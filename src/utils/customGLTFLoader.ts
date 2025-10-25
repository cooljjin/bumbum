import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { isThreePatchApplied } from '@/bootstrap/threePatchGuard';
import { getBlob } from './blobCache';

if (process.env.NODE_ENV !== 'production' && !isThreePatchApplied()) {
  console.warn(
    '[CachedGLTFLoader] ⚠️ FileLoaderPatch not yet applied. Check initThreePatches import order.'
  );
}

export class CachedGLTFLoader extends GLTFLoader {
  async loadFromCache(url: string): Promise<GLTF | null> {
    const blob = getBlob(url);
    if (!blob) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[CachedGLTFLoader] Blob not found in cache:', url);
      }
      return null;
    }

    try {
      const buffer = await blob.arrayBuffer();
      const gltf = await new Promise<GLTF>((resolve, reject) => {
        this.parse(
          buffer,
          '',
          (parsed) => resolve(parsed),
          (error) =>
            reject(
              error instanceof Error
                ? error
                : new Error('Failed to parse cached GLTF blob')
            )
        );
      });

      if (process.env.NODE_ENV !== 'production') {
        console.debug('[CachedGLTFLoader] Loaded GLTF from cache:', url);
      }
      return gltf;
    } catch (error) {
      console.error('[CachedGLTFLoader] Unable to load cached blob:', url, error);
      return null;
    }
  }
}
