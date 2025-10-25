/**
 * Managed Blob URL Hook
 * 
 * BlobManager를 활용하여 React 컴포넌트에서 Blob URL을 관리하는 훅
 * - 자동 생성 및 해제
 * - 유효성 검증 및 자동 복구
 * - 컴포넌트 언마운트 시 안전한 정리
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { blobManager, BlobMetadata, BlobError, BlobErrorType } from '@/utils/blobManager';

/**
 * useManagedBlob 옵션
 */
export interface UseManagedBlobOptions {
  /** Blob 타입 */
  type?: BlobMetadata['type'];
  /** 아이템 ID (복구용) */
  itemId?: string;
  /** Blob 소스 */
  source?: BlobMetadata['source'];
  /** 최대 생존 시간 (밀리초) */
  maxAge?: number;
  /** 에러 콜백 */
  onError?: (error: BlobError) => void;
  /** URL 준비 완료 콜백 */
  onReady?: (url: string) => void;
  /** 복구 성공 콜백 */
  onRecovered?: (url: string) => void;
  /** 훅 비활성화 */
  disabled?: boolean;
  /** 자동 복구 활성화 */
  autoRecover?: boolean;
}

/**
 * useManagedBlob 반환값
 */
export interface UseManagedBlobResult {
  /** 생성된 Blob URL */
  blobUrl: string | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 정보 */
  error: BlobError | null;
  /** URL이 복구되었는지 여부 */
  isRecovered: boolean;
  /** 수동으로 URL 재검증 및 복구 */
  refresh: () => Promise<void>;
  /** 현재 URL 해제 */
  revoke: () => void;
}

/**
 * Managed Blob URL Hook
 * 
 * @param blob - Blob 또는 File 객체
 * @param options - 옵션
 * @returns UseManagedBlobResult
 * 
 * @example
 * ```tsx
 * const MyComponent = ({ file, itemId }: Props) => {
 *   const { blobUrl, isLoading, error, refresh } = useManagedBlob(file, {
 *     type: 'model',
 *     itemId,
 *     autoRecover: true,
 *     onError: (err) => console.error('Blob error:', err)
 *   });
 * 
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} onRetry={refresh} />;
 *   if (!blobUrl) return null;
 * 
 *   return <Model url={blobUrl} />;
 * };
 * ```
 */
export function useManagedBlob(
  blob: Blob | File | null | undefined,
  options: UseManagedBlobOptions = {}
): UseManagedBlobResult {
  const {
    type = 'other',
    itemId,
    source,
    maxAge,
    onError,
    onReady,
    onRecovered,
    disabled = false,
    autoRecover = true
  } = options;

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<BlobError | null>(null);
  const [isRecovered, setIsRecovered] = useState<boolean>(false);

  const currentUrlRef = useRef<string | null>(null);
  const onErrorRef = useRef(onError);
  const onReadyRef = useRef(onReady);
  const onRecoveredRef = useRef(onRecovered);

  // Ref 업데이트
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onRecoveredRef.current = onRecovered;
  }, [onRecovered]);

  /**
   * URL 생성
   */
  const createUrl = useCallback(async () => {
    if (typeof window === 'undefined' || disabled || !blob) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = blobManager.createUrl(blob, {
        type,
        itemId,
        source,
        maxAge
      });

      currentUrlRef.current = url;
      setBlobUrl(url);
      setIsRecovered(false);
      onReadyRef.current?.(url);

      if (process.env.NODE_ENV !== 'production') {
        console.log('[useManagedBlob] ✅ Created URL:', url);
      }
    } catch (err) {
      const blobError = err instanceof BlobError 
        ? err 
        : new BlobError(BlobErrorType.CREATION_ERROR, 'Failed to create blob URL');
      
      setError(blobError);
      onErrorRef.current?.(blobError);
      
      if (process.env.NODE_ENV !== 'production') {
        console.error('[useManagedBlob] ❌ Failed to create URL:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [blob, disabled, type, itemId, source, maxAge]);

  /**
   * URL 검증 및 복구
   */
  const refresh = useCallback(async () => {
    if (typeof window === 'undefined' || disabled) {
      return;
    }

    const currentUrl = currentUrlRef.current;
    
    if (!currentUrl || !currentUrl.startsWith('blob:')) {
      // Blob URL이 아니면 새로 생성
      await createUrl();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // URL 유효성 검증
      const isValid = await blobManager.validateUrl(currentUrl);

      if (isValid) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[useManagedBlob] ✅ URL is valid');
        }
        setIsLoading(false);
        return;
      }

      // 무효한 URL - 복구 시도
      if (!autoRecover) {
        throw new BlobError(
          BlobErrorType.INVALID,
          'Blob URL is invalid and auto-recovery is disabled',
          currentUrl,
          itemId
        );
      }

      if (!itemId) {
        throw new BlobError(
          BlobErrorType.RECOVERY_FAILED,
          'Cannot recover: itemId not provided',
          currentUrl
        );
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('[useManagedBlob] 🔄 Attempting to recover URL...');
      }

      const recoveredUrl = await blobManager.recoverUrl(itemId, currentUrl);

      if (!recoveredUrl) {
        throw new BlobError(
          BlobErrorType.RECOVERY_FAILED,
          'Failed to recover blob URL',
          currentUrl,
          itemId
        );
      }

      currentUrlRef.current = recoveredUrl;
      setBlobUrl(recoveredUrl);
      setIsRecovered(true);
      onRecoveredRef.current?.(recoveredUrl);

      if (process.env.NODE_ENV !== 'production') {
        console.log('[useManagedBlob] ✅ URL recovered:', recoveredUrl);
      }
    } catch (err) {
      const blobError = err instanceof BlobError 
        ? err 
        : new BlobError(BlobErrorType.RECOVERY_FAILED, 'Failed to refresh blob URL');
      
      setError(blobError);
      onErrorRef.current?.(blobError);
      
      if (process.env.NODE_ENV !== 'production') {
        console.error('[useManagedBlob] ❌ Failed to refresh URL:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [disabled, itemId, autoRecover, createUrl]);

  /**
   * URL 해제
   */
  const revoke = useCallback(() => {
    if (currentUrlRef.current) {
      blobManager.revokeUrl(currentUrlRef.current);
      currentUrlRef.current = null;
      setBlobUrl(null);
      setIsRecovered(false);

      if (process.env.NODE_ENV !== 'production') {
        console.log('[useManagedBlob] 🗑️ URL revoked');
      }
    }
  }, []);

  // Blob 변경 시 URL 생성
  useEffect(() => {
    if (disabled) {
      revoke();
      return;
    }

    if (!blob) {
      revoke();
      return;
    }

    createUrl();

    // Cleanup
    return () => {
      if (currentUrlRef.current) {
        blobManager.revokeUrl(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, [blob, disabled, createUrl, revoke]);

  // 주기적인 URL 검증 (옵션)
  useEffect(() => {
    if (disabled || !autoRecover || !blobUrl || !itemId) {
      return;
    }

    // 5분마다 URL 유효성 검증
    const validationInterval = 5 * 60 * 1000;
    const timer = setInterval(() => {
      refresh();
    }, validationInterval);

    return () => {
      clearInterval(timer);
    };
  }, [disabled, autoRecover, blobUrl, itemId, refresh]);

  return {
    blobUrl,
    isLoading,
    error,
    isRecovered,
    refresh,
    revoke
  };
}

/**
 * 여러 Blob을 관리하는 훅
 * 
 * @example
 * ```tsx
 * const MyComponent = ({ files }: Props) => {
 *   const urls = useManagedBlobBatch(files, {
 *     type: 'thumbnail',
 *     source: 'upload'
 *   });
 * 
 *   return (
 *     <div>
 *       {urls.map((url, idx) => (
 *         url && <img key={idx} src={url} alt={`Image ${idx}`} />
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 */
export function useManagedBlobBatch(
  blobs: (Blob | File | null | undefined)[],
  options: UseManagedBlobOptions = {}
): (string | null)[] {
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const urlRefsRef = useRef<(string | null)[]>([]);

  useEffect(() => {
    if (options.disabled) {
      // 모든 URL 해제
      urlRefsRef.current.forEach(url => {
        if (url) {
          blobManager.revokeUrl(url);
        }
      });
      urlRefsRef.current = [];
      setUrls([]);
      return;
    }

    const newUrls: (string | null)[] = [];

    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i];
      
      if (!blob) {
        newUrls.push(null);
        continue;
      }

      try {
        const url = blobManager.createUrl(blob, {
          type: options.type,
          itemId: options.itemId,
          source: options.source,
          maxAge: options.maxAge
        });
        newUrls.push(url);
      } catch (error) {
        newUrls.push(null);
        options.onError?.(
          error instanceof BlobError 
            ? error 
            : new BlobError(BlobErrorType.CREATION_ERROR, 'Failed to create blob URL')
        );
      }
    }

    urlRefsRef.current = newUrls;
    setUrls(newUrls);

    // Cleanup
    return () => {
      urlRefsRef.current.forEach(url => {
        if (url) {
          blobManager.revokeUrl(url);
        }
      });
      urlRefsRef.current = [];
    };
  }, [blobs, options.disabled, options.type, options.itemId, options.source, options.maxAge, options.onError]);

  return urls;
}


