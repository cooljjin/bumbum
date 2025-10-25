import { FileLoader, LoadingManager } from 'three';
import { setThreePatchApplied } from '@/bootstrap/threePatchGuard';

let __FILE_LOADER_PATCHED__ = false;

/**
 * Override THREE.FileLoader.load to prevent network fetches for blob URLs.
 * - blob: URLs skip fetch and immediately resolve
 * - Non-blob URLs continue through the original loader
 * The patch is idempotent.
 */
export function patchFileLoader(): void {
  if (__FILE_LOADER_PATCHED__) {
    return;
  }
  __FILE_LOADER_PATCHED__ = true;

  const originalLoad = (FileLoader.prototype as any).load;

  (FileLoader.prototype as any).load = function patchedLoad(
    this: FileLoader,
    url: string,
    onLoad?: (response?: unknown) => void,
    onProgress?: (event: ProgressEvent<EventTarget>) => void,
    onError?: (error: unknown) => void
  ) {
    try {
      if (!url || typeof url !== 'string') {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[FileLoaderPatch] Blocked empty or invalid URL.');
        }
        try {
          onLoad?.();
        } catch (callbackError) {
          console.warn('[FileLoaderPatch] onLoad guard (empty URL):', callbackError);
        }
        return;
      }

      if (url.startsWith('blob:')) {
        const manager: LoadingManager | undefined = (this as any).manager;
        try {
          manager?.itemStart?.(url);
        } catch {
          /* no-op */
        }

        if (process.env.NODE_ENV !== 'production') {
          console.debug('[FileLoaderPatch] Skipped network fetch for blob URL:', url);
        }

        try {
          onLoad?.();
        } catch (callbackError) {
          console.warn('[FileLoaderPatch] onLoad guard (blob URL):', callbackError);
        }

        try {
          manager?.itemEnd?.(url);
        } catch {
          /* no-op */
        }
        return;
      }

      return originalLoad.call(this, url, onLoad, onProgress, onError);
    } catch (error) {
      console.error('[FileLoaderPatch] Unexpected error from patched load:', error);
      try {
        onError?.(error);
      } catch {
        /* no-op */
      }
      return;
    }
  };

  setThreePatchApplied();

  if (process.env.NODE_ENV !== 'production') {
    console.info('[FileLoaderPatch] FileLoader override active');
  }
}
