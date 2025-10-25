import { releaseBlob, storeBlob } from './blobCache';

/**
 * Safe blob URL helpers used throughout the 3D pipeline.
 *
 * Stable Dev Env Setup guide highlights:
 * - Set NEXT_PUBLIC_BLOB_REVOKE_SAFE_MODE=true to skip revocation in dev
 * - Avoid revoking blob URLs too early while loaders are still streaming data
 */

export const DEFAULT_BLOB_REVOKE_DELAY_MS = 800;

const activeBlobSet = new Set<string>();

const DEV_SAFE_MODE_ENABLED =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_BLOB_REVOKE_SAFE_MODE === 'true';

export function isValidBlobUrl(url?: string | null): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed !== url) {
    return false;
  }

  if (!trimmed.startsWith('blob:')) {
    return false;
  }

  if (trimmed.length <= 5) {
    return false;
  }

  const lowered = trimmed.toLowerCase();
  if (lowered.includes('undefined') || lowered.includes('null')) {
    return false;
  }

  const slashIndex = trimmed.lastIndexOf('/');
  if (slashIndex <= 'blob:'.length || slashIndex === trimmed.length - 1) {
    return false;
  }

  return true;
}

export function extractBlobId(url?: string | null): string | null {
  if (!isValidBlobUrl(url)) {
    return null;
  }

  const trimmed = (url as string).trim();
  const slashIndex = trimmed.lastIndexOf('/');
  if (slashIndex === -1 || slashIndex === trimmed.length - 1) {
    return null;
  }

  const id = trimmed.slice(slashIndex + 1);
  return id.length > 0 ? id : null;
}

export function markBlobActive(url?: string | null): void {
  if (!isValidBlobUrl(url)) {
    return;
  }
  activeBlobSet.add((url as string).trim());
}

export function unmarkBlobActive(url?: string | null): void {
  if (!isValidBlobUrl(url)) {
    return;
  }
  activeBlobSet.delete((url as string).trim());
}

export function isBlobUrlActive(url?: string | null): boolean {
  if (!isValidBlobUrl(url)) {
    return false;
  }
  return activeBlobSet.has((url as string).trim());
}

export function safeRevokeObjectURL(
  url?: string | null,
  delay: number = DEFAULT_BLOB_REVOKE_DELAY_MS
): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!isValidBlobUrl(url)) {
    return;
  }

  if (isBlobUrlActive(url)) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[safeRevokeObjectURL] Skip revoke (active load):', url);
    }
    return;
  }

  if (DEV_SAFE_MODE_ENABLED) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[safeRevokeObjectURL] Dev safe mode active, skipping revoke for', url);
    }
    return;
  }

  const timeout = Math.max(0, delay);
  window.setTimeout(() => {
    try {
      URL.revokeObjectURL(url as string);
      releaseBlob(url);
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[safeRevokeObjectURL] Revoked blob URL:', url);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[safeRevokeObjectURL] Failed to revoke blob URL:', url, error);
      }
    }
  }, timeout);
}

export function safeRevokeBulk(
  urls: readonly (string | null | undefined)[],
  delay: number = DEFAULT_BLOB_REVOKE_DELAY_MS
): void {
  if (!Array.isArray(urls)) {
    return;
  }

  for (const url of urls) {
    if (url) {
      safeRevokeObjectURL(url, delay);
    }
  }
}

interface CreateSafeBlobUrlOptions {
  revokeDelay?: number;
}

export function createSafeBlobUrl(
  blob: Blob,
  options: CreateSafeBlobUrlOptions = {}
): { url: string; revoke: () => void } {
  if (typeof window === 'undefined') {
    throw new Error('createSafeBlobUrl can only run in a browser context');
  }

  const url = URL.createObjectURL(blob);
  storeBlob(url, blob);
  const revoke = () =>
    safeRevokeObjectURL(url, options.revokeDelay ?? DEFAULT_BLOB_REVOKE_DELAY_MS);

  return { url, revoke };
}
