import { validateBlobUrl, regenerateBlobFromCustomFurniture } from '@/services/blobRecovery';
import { safeRevokeObjectURL, isBlobUrlActive, markBlobActive, unmarkBlobActive } from './blobUtils';
import { storeBlob } from './blobCache';

export interface BlobMetadata {
  type: 'model' | 'texture' | 'thumbnail' | 'export' | 'other';
  itemId?: string;
  source?: 'custom-furniture' | 'built-in' | 'upload' | 'download' | 'async';
  createdAt: number;
  maxAge?: number;
  refCount: number;
  size: number;
  extra?: Record<string, unknown>;
}

export enum BlobErrorType {
  REVOKED = 'revoked',
  INVALID = 'invalid',
  RECOVERY_FAILED = 'recovery_failed',
  STORAGE_ERROR = 'storage_error',
  CREATION_ERROR = 'creation_error'
}

export class BlobError extends Error {
  constructor(
    public type: BlobErrorType,
    message: string,
    public url?: string,
    public itemId?: string
  ) {
    super(message);
    this.name = 'BlobError';
  }
}

interface EnsureResult {
  url: string | null;
  recovered: boolean;
}

class BlobManager {
  private urlRegistry = new Map<string, BlobMetadata>();
  private activeLoads = new Set<string>();
  private pendingRevokes = new Map<string, boolean>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private readonly cleanupInterval = 5 * 60 * 1000;
  private readonly defaultMaxAge = 30 * 60 * 1000;
  private readonly debugMode = process.env.NODE_ENV !== 'production';

  constructor() {
    this.startAutoCleanup();
  }

  public createUrl(blob: Blob, metadata: Partial<BlobMetadata> = {}): string {
    if (typeof window === 'undefined') {
      throw new BlobError(BlobErrorType.CREATION_ERROR, 'Cannot create blob URL on the server');
    }

    const url = URL.createObjectURL(blob);
    this.urlRegistry.set(url, {
      type: metadata.type ?? 'other',
      itemId: metadata.itemId,
      source: metadata.source,
      createdAt: Date.now(),
      maxAge: metadata.maxAge ?? this.defaultMaxAge,
      refCount: metadata.refCount ?? 1,
      size: blob.size,
      extra: metadata.extra
    });

    storeBlob(url, blob);

    return url;
  }

  public async validateUrl(url: string | null | undefined): Promise<boolean> {
    if (!url || !url.startsWith('blob:')) {
      return false;
    }
    return validateBlobUrl(url);
  }

  public async ensureValidUrl(
    url: string | null,
    itemId?: string,
    metadataHint?: Partial<BlobMetadata>
  ): Promise<EnsureResult> {
    if (!url || !url.startsWith('blob:')) {
      if (!itemId) {
        return { url: url ?? null, recovered: false };
      }
      const recovered = await this.recoverUrl(itemId, undefined, metadataHint);
      return { url: recovered, recovered: !!recovered };
    }

    const isValid = await this.validateUrl(url);
    if (isValid) {
      return { url, recovered: false };
    }

    if (!itemId) {
      return { url: null, recovered: false };
    }

    const recovered = await this.recoverUrl(itemId, url, metadataHint);
    return { url: recovered, recovered: !!recovered };
  }

  public async recoverUrl(
    itemId: string,
    oldUrl?: string | null,
    metadataHint?: Partial<BlobMetadata>
  ): Promise<string | null> {
    try {
      const blob = await regenerateBlobFromCustomFurniture(itemId);
      if (!blob) {
        return null;
      }

      if (oldUrl) {
        this.revokeUrl(oldUrl, true);
      }

      return this.createUrl(blob, {
        type: metadataHint?.type ?? 'model',
        itemId,
        source: metadataHint?.source ?? 'custom-furniture',
        extra: metadataHint?.extra
      });
    } catch (error) {
      throw new BlobError(
        BlobErrorType.RECOVERY_FAILED,
        error instanceof Error ? error.message : 'Failed to recover blob URL',
        oldUrl ?? undefined,
        itemId
      );
    }
  }

  public revokeUrl(url: string, force = false): void {
    if (!url || !url.startsWith('blob:')) {
      return;
    }

    if (this.activeLoads.has(url)) {
      const existingForce = this.pendingRevokes.get(url) ?? false;
      this.pendingRevokes.set(url, existingForce || force);
      return;
    }

    if (isBlobUrlActive(url)) {
      const existingForce = this.pendingRevokes.get(url) ?? false;
      this.pendingRevokes.set(url, existingForce || force);
      if (this.debugMode) {
        console.debug('[BlobManager] Delaying revoke for active blob URL:', url);
      }
      return;
    }

    this.performRevoke(url, force);
  }

  public markUrlInUse(url: string | null | undefined): void {
    if (!url || !url.startsWith('blob:')) {
      return;
    }
    markBlobActive(url);
    this.activeLoads.add(url);
  }

  public releaseUrlInUse(url: string | null | undefined): void {
    if (!url || !url.startsWith('blob:')) {
      return;
    }
    if (!this.activeLoads.delete(url)) {
      return;
    }
    unmarkBlobActive(url);

    const pendingForce = this.pendingRevokes.get(url);
    if (pendingForce !== undefined) {
      this.pendingRevokes.delete(url);
      this.performRevoke(url, pendingForce);
    }
  }

  private performRevoke(url: string, force: boolean): void {
    if (isBlobUrlActive(url)) {
      const existingForce = this.pendingRevokes.get(url) ?? false;
      this.pendingRevokes.set(url, existingForce || force);
      if (this.debugMode) {
        console.debug('[BlobManager] Skip revoke, blob still active:', url);
      }
      return;
    }

    const metadata = this.urlRegistry.get(url);

    if (!metadata) {
      safeRevokeObjectURL(url);
      return;
    }

    metadata.refCount--;

    if (force || metadata.refCount <= 0) {
      safeRevokeObjectURL(url);
      this.urlRegistry.delete(url);
    } else if (this.debugMode) {
      console.log('[BlobManager] refCount decreased:', { url, refCount: metadata.refCount });
    }
  }

  private startAutoCleanup(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [url, meta] of this.urlRegistry.entries()) {
        if (meta.maxAge !== undefined && now - meta.createdAt > meta.maxAge) {
          this.revokeUrl(url, true);
        }
      }
    }, this.cleanupInterval);
  }
}

export const blobManager = new BlobManager();
