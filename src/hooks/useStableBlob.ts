'use client';

import { MutableRefObject, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_BLOB_REVOKE_DELAY_MS, safeRevokeObjectURL } from '@/utils/blobUtils';
import { blobManager } from '@/utils/blobManager';

type BlobSource = File | Blob | null | undefined;

interface UseStableBlobOptions {
  /**
   * Optional error callback when creating the object URL fails.
   */
  onError?: (error: unknown) => void;
  /**
   * When true the hook returns null and skips any URL work.
   */
  disabled?: boolean;
}

export interface UseStableBlobResult {
  /**
   * Latest created blob URL or null when unavailable.
   */
  blobUrl: string | null;
  /**
   * Mutable ref that always holds the current blob URL.
   * Useful when consumers need a synchronous guard before using the URL.
   */
  currentUrlRef: MutableRefObject<string | null>;
  /**
   * Schedules a safe revocation for an arbitrary blob URL.
   * Consumers can use this for externally created object URLs.
   */
  revokeLater: (url: string | null, delay?: number) => void;
}

/**
 * Creates a blob URL that stays stable across renders and only revokes
 * the previous value on the next macrotask. This prevents consumers such as
 * Three.js loaders from hitting a revoked URL mid-render.
 */
export function useStableBlob(
  source: BlobSource,
  options: UseStableBlobOptions = {}
): UseStableBlobResult {
  const { onError, disabled = false } = options;
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const pendingRevokesRef = useRef<Set<string>>(new Set());

  const revokeLater = useCallback(
    (url: string | null, delay = DEFAULT_BLOB_REVOKE_DELAY_MS) => {
      if (typeof window === 'undefined' || !url) {
        return;
      }
      const pending = pendingRevokesRef.current;
      if (pending.has(url)) {
        return;
      }
      pending.add(url);
      const revokeDelay = Math.max(0, delay);
      safeRevokeObjectURL(url, revokeDelay);
      window.setTimeout(() => {
        pending.delete(url);
      }, revokeDelay + 16);
    },
    []
  );

  useLayoutEffect(() => {
    if (disabled || typeof window === 'undefined') {
      if (currentUrlRef.current) {
        revokeLater(currentUrlRef.current);
        currentUrlRef.current = null;
      }
      setBlobUrl(null);
      return;
    }

    if (!source) {
      if (currentUrlRef.current) {
        revokeLater(currentUrlRef.current);
        currentUrlRef.current = null;
      }
      setBlobUrl(null);
      return;
    }

    let nextUrl: string | null = null;

    try {
      // ✅ BlobManager 사용
      nextUrl = blobManager.createUrl(source, {
        type: 'other'
      });
      currentUrlRef.current = nextUrl;
      setBlobUrl(nextUrl);
    } catch (error) {
      currentUrlRef.current = null;
      setBlobUrl(null);
      onError?.(error);
      if (process.env.NODE_ENV !== 'production') {
        console.error('[useStableBlob] Failed to create object URL.', error);
      }
      return;
    }

    return () => {
      if (!nextUrl) {
        return;
      }
      if (currentUrlRef.current === nextUrl) {
        currentUrlRef.current = null;
        setBlobUrl((current) => (current === nextUrl ? null : current));
      }
      revokeLater(nextUrl);
    };
  }, [source, disabled, revokeLater, onError]);

  return useMemo(
    () => ({
      blobUrl,
      currentUrlRef,
      revokeLater
    }),
    [blobUrl, revokeLater]
  );
}
