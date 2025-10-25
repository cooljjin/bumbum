/**
 * Blob URL Recovery Service
 * 
 * Blob URL이 revoke되거나 HMR 중 무효화되었을 때 자동으로 재생성하는 복구 시스템
 * 
 * Agent B - Blob URL Recovery Framework
 */
import { getCustomFurnitureRaw } from '@/utils/customLibrary';
import { storeBlob } from '@/utils/blobCache';

/**
 * Blob URL 유효성 검증
 * HEAD 요청으로 Blob URL이 접근 가능한지 확인
 * 
 * @param url - 검증할 Blob URL
 * @returns URL이 유효하면 true, 아니면 false
 */
export async function validateBlobUrl(url: string): Promise<boolean> {
  if (!url || !url.startsWith('blob:')) {
    return false;
  }

  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[blobRecovery] Blob URL validation failed:', url, error);
    }
    return false;
  }
}

/**
 * localStorage에서 base64 인코딩된 파일 복구
 * 
 * @param itemId - 가구 아이템 ID
 * @returns Blob 또는 null
 */
async function recoverFromLocalStorage(itemId: string): Promise<Blob | null> {
  try {
    const stored = localStorage.getItem(`custom-furniture-${itemId}`);
    if (!stored) {
      return null;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[blobRecovery] 🔍 Recovering from localStorage:', itemId);
    }

    const binary = atob(stored);
    const arrayBuffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      arrayBuffer[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([arrayBuffer], { type: 'model/gltf-binary' });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[blobRecovery] ✅ Recovered from localStorage, size:', blob.size);
    }
    
    return blob;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[blobRecovery] Failed to recover from localStorage:', error);
    }
    return null;
  }
}

/**
 * IndexedDB에서 커스텀 가구 파일 복구
 * 
 * @param itemId - 가구 아이템 ID
 * @returns Blob 또는 null
 */
async function recoverFromIndexedDB(itemId: string): Promise<Blob | null> {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[blobRecovery] 🔍 Recovering from IndexedDB:', itemId);
    }

    const customFurniture = await getCustomFurnitureRaw(itemId);
    
    const file = customFurniture?.files?.model?.local;
    if (!file) {
      return null;
    }
    
    const mimeType = file.type && file.type.length > 0 ? file.type : 'model/gltf-binary';
    const blob = file.type && file.type.length > 0 ? file : new Blob([file], { type: mimeType });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[blobRecovery] ✅ Recovered from IndexedDB, size:', blob.size);
    }
    
    return blob;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[blobRecovery] Failed to recover from IndexedDB:', error);
    }
    return null;
  }
}

/**
 * API에서 가구 파일 복구 (최후의 수단)
 * 
 * @param itemId - 가구 아이템 ID
 * @returns Blob 또는 null
 */
async function recoverFromAPI(itemId: string): Promise<Blob | null> {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[blobRecovery] 🔍 Recovering from API:', itemId);
    }

    const response = await fetch(`/api/furniture/${itemId}`);
    
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[blobRecovery] ✅ Recovered from API, size:', blob.size);
    }
    
    return blob;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[blobRecovery] Failed to recover from API:', error);
    }
    return null;
  }
}

/**
 * 원본 소스로부터 Blob 재생성
 * localStorage → IndexedDB → API 순서로 fallback 시도
 * 
 * @param itemId - 가구 아이템 ID
 * @returns 복구된 Blob
 * @throws 모든 복구 시도가 실패한 경우
 */
export async function regenerateBlobFromSource(itemId: string): Promise<Blob> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[blobRecovery] 🔄 Starting blob recovery for:', itemId);
  }

  // 1단계: localStorage에서 복구 시도
  let blob = await recoverFromLocalStorage(itemId);
  if (blob) {
    return blob;
  }

  // 2단계: IndexedDB에서 복구 시도
  blob = await recoverFromIndexedDB(itemId);
  if (blob) {
    return blob;
  }

  // 3단계: API에서 복구 시도
  blob = await recoverFromAPI(itemId);
  if (blob) {
    return blob;
  }

  // 모든 복구 시도 실패
  const error = new Error(`Failed to recover blob for item: ${itemId}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error('[blobRecovery] ❌ All recovery attempts failed:', itemId);
  }
  throw error;
}

/**
 * CustomFurniture의 파일 데이터에서 직접 Blob 재생성
 * DraggableFurniture에서 사용하기 위한 특화 함수
 * 
 * @param itemId - 가구 아이템 ID
 * @returns 복구된 Blob 또는 null
 */
export async function regenerateBlobFromCustomFurniture(itemId: string): Promise<Blob | null> {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[blobRecovery] 🔄 Regenerating blob from custom furniture:', itemId);
    }

    const customFurniture = await getCustomFurnitureRaw(itemId);
    
    if (!customFurniture) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[blobRecovery] Custom furniture not found:', itemId);
      }
      return null;
    }

    // 모델 파일이 있는지 확인
    const file = customFurniture.files?.model?.local;
    if (!file) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[blobRecovery] Model file not found in custom furniture:', itemId);
      }
      return null;
    }

    const mimeType = file.type && file.type.length > 0 ? file.type : 'model/gltf-binary';
    const blob = file.type && file.type.length > 0 ? file : new Blob([file], { type: mimeType });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[blobRecovery] ✅ Blob regenerated from custom furniture, size:', blob.size);
    }
    
    return blob;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[blobRecovery] Failed to regenerate blob from custom furniture:', error);
    }
    return null;
  }
}

/**
 * Blob URL을 안전하게 복구하고 새 URL 생성
 * 기존 URL이 유효하지 않은 경우에만 복구 시도
 * 
 * @param currentUrl - 현재 Blob URL
 * @param itemId - 가구 아이템 ID
 * @returns { url: string, recovered: boolean } - 새 URL과 복구 여부
 */
export async function ensureValidBlobUrl(
  currentUrl: string | null | undefined,
  itemId: string
): Promise<{ url: string | null; recovered: boolean }> {
  // URL이 없거나 blob URL이 아닌 경우
  if (!currentUrl || !currentUrl.startsWith('blob:')) {
    return { url: currentUrl || null, recovered: false };
  }

  // URL 유효성 검증
  const isValid = await validateBlobUrl(currentUrl);
  
  if (isValid) {
    // 유효한 URL이므로 그대로 사용
    return { url: currentUrl, recovered: false };
  }

  // 무효한 URL이므로 복구 시도
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[blobRecovery] ⚠️ Blob URL invalid, attempting recovery:', currentUrl);
    }

    const blob = await regenerateBlobFromSource(itemId);
    const newUrl = URL.createObjectURL(blob);
    storeBlob(newUrl, blob);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[blobRecovery] ✅ Blob URL recovered:', newUrl);
    }
    
    return { url: newUrl, recovered: true };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[blobRecovery] ❌ Blob recovery failed:', error);
    }
    return { url: null, recovered: false };
  }
}

