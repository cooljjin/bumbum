import { useState, useEffect } from 'react';
import { safeRevokeObjectURL } from '../utils/blobUtils';
import { blobManager } from '../utils/blobManager';

/**
 * Blob URL 관리를 위한 커스텀 훅
 * 
 * Stable Dev Env Setup 가이드 적용:
 * - File을 Blob URL로 변환
 * - 컴포넌트 언마운트 시 안전하게 revoke
 * - Safe Mode 지원
 * 
 * @param file - Blob URL로 변환할 File 객체
 * @returns Blob URL 또는 null
 * 
 * @example
 * ```tsx
 * const MyComponent = ({ file }: { file: File }) => {
 *   const blobUrl = useBlobUrl(file);
 *   
 *   if (!blobUrl) return <div>로딩 중...</div>;
 *   
 *   return <img src={blobUrl} alt="Preview" />;
 * };
 * ```
 */
export function useBlobUrl(file?: File | null): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    // file이 없으면 초기화
    if (!file) {
      setBlobUrl(null);
      return;
    }

    try {
      // ✅ BlobManager 사용
      const url = blobManager.createUrl(file, {
        type: 'other'
      });
      setBlobUrl(url);

      // 정상 생성 로그
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useBlobUrl] Created blob URL for', file.name, '→', url);
      }

      // Cleanup: 컴포넌트 언마운트 시 안전하게 revoke
      return () => {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[useBlobUrl] Cleanup triggered for', url);
        }
        safeRevokeObjectURL(url);
      };
    } catch (error) {
      console.error('[useBlobUrl] Failed to create blob URL:', error);
      setBlobUrl(null);
    }
  }, [file]);

  return blobUrl;
}


