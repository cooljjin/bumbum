'use client';

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import * as THREE from 'three';
import { DEFAULT_BLOB_REVOKE_DELAY_MS, safeRevokeObjectURL } from '@/utils/blobUtils';
import { PerformanceOptions } from '../../types/editor';
import { blobManager } from '@/utils/blobManager';

export interface Canvas3DProps {
  isMobile: boolean;
  isEditMode: boolean;
  minDpr: number;
  maxDpr: number;
  children: React.ReactNode;
  onClick?: () => void;
  onCreated?: (scene: any, gl: any) => void;
  onPointerMissed?: (event: any) => void;
  performanceOptions?: PerformanceOptions;
  modelFile?: File | Blob | null;
  modelUrl?: string | null;
  modelFetcher?: (() => Promise<Blob | null>) | null;
  onModelUrlReady?: (url: string | null) => void;
  onAssetLoadError?: (info: { url?: string; error: unknown }) => void;
  loadingMessage?: string;
}

export interface Canvas3DAssetContextValue {
  modelUrl: string | null;
  modelSource: 'prop-url' | 'blob-file' | 'async' | 'none';
}

const Canvas3DAssetContext = React.createContext<Canvas3DAssetContextValue>({
  modelUrl: null,
  modelSource: 'none'
});

export function useCanvas3DAssets(): Canvas3DAssetContextValue {
  return useContext(Canvas3DAssetContext);
}

export interface Canvas3DHookResult {
  assetContextValue: Canvas3DAssetContextValue;
  effectiveModelUrl: string | null;
  loadingLabel: string;
  shouldBlockRender: boolean;
  waitingForModel: boolean;
  pointerMissHandler: (event: any) => void;
  canvasCreatedHandler: (context: { gl: any; scene: any; camera: any }) => void;
  suspenseKey: string;
}

const DEFAULT_LOADING_MESSAGE = '3D model loading...';
const BLOB_REVOKE_DELAY_MS = DEFAULT_BLOB_REVOKE_DELAY_MS;

export function useCanvas3DController(props: Canvas3DProps): Canvas3DHookResult {
  const {
    onClick,
    onCreated,
    onPointerMissed,
    performanceOptions,
    modelFile,
    modelUrl: explicitModelUrl,
    modelFetcher,
    onModelUrlReady,
    onAssetLoadError,
    loadingMessage
  } = props;

  const [isMounted, setIsMounted] = useState(false);
  const [asyncBlobUrl, setAsyncBlobUrl] = useState<string | null>(null);
  const [isAsyncLoading, setIsAsyncLoading] = useState(false);

  const asyncObjectUrlRef = useRef<string | null>(null);

  const modelUrlProvided = Object.prototype.hasOwnProperty.call(props, 'modelUrl');
  const modelFileProvided = Object.prototype.hasOwnProperty.call(props, 'modelFile');
  const modelFetcherProvided = Object.prototype.hasOwnProperty.call(props, 'modelFetcher');

  const requiresModelUrl =
    (modelUrlProvided || modelFileProvided || modelFetcherProvided) &&
    (explicitModelUrl !== undefined || modelFile !== undefined || modelFetcher !== undefined);

  const memoBlobUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    if (!modelFile) {
      return null;
    }
    try {
      // ✅ BlobManager 사용
      return blobManager.createUrl(modelFile, {
        type: 'model'
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Canvas3D] Failed to create object URL from modelFile.', error);
      }
      onAssetLoadError?.({ error });
      return null;
    }
  }, [modelFile, onAssetLoadError]);

  const effectiveModelUrl = useMemo(() => {
    if (explicitModelUrl) {
      return explicitModelUrl;
    }
    if (memoBlobUrl) {
      return memoBlobUrl;
    }
    if (asyncBlobUrl) {
      return asyncBlobUrl;
    }
    return null;
  }, [explicitModelUrl, memoBlobUrl, asyncBlobUrl]);

  const assetContextValue = useMemo<Canvas3DAssetContextValue>(() => {
    if (!effectiveModelUrl) {
      return { modelUrl: null, modelSource: 'none' };
    }
    if (explicitModelUrl && effectiveModelUrl === explicitModelUrl) {
      return { modelUrl: effectiveModelUrl, modelSource: 'prop-url' };
    }
    if (memoBlobUrl && effectiveModelUrl === memoBlobUrl) {
      return { modelUrl: effectiveModelUrl, modelSource: 'blob-file' };
    }
    if (asyncBlobUrl && effectiveModelUrl === asyncBlobUrl) {
      return { modelUrl: effectiveModelUrl, modelSource: 'async' };
    }
    return { modelUrl: effectiveModelUrl, modelSource: 'none' };
  }, [effectiveModelUrl, explicitModelUrl, memoBlobUrl, asyncBlobUrl]);

  const loadingLabel = useMemo(
    () => loadingMessage || DEFAULT_LOADING_MESSAGE,
    [loadingMessage]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!memoBlobUrl) {
      return;
    }

    return () => {
      safeRevokeObjectURL(memoBlobUrl, BLOB_REVOKE_DELAY_MS);
    };
  }, [memoBlobUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setAsyncBlobUrl(null);
      setIsAsyncLoading(false);
      return;
    }

    if (!modelFetcher) {
      if (asyncObjectUrlRef.current) {
        safeRevokeObjectURL(asyncObjectUrlRef.current, BLOB_REVOKE_DELAY_MS);
        asyncObjectUrlRef.current = null;
      }
      setAsyncBlobUrl(null);
      setIsAsyncLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsAsyncLoading(true);
      try {
        const blob = await modelFetcher();
        if (cancelled) {
          return;
        }

        if (asyncObjectUrlRef.current) {
          safeRevokeObjectURL(asyncObjectUrlRef.current, BLOB_REVOKE_DELAY_MS);
          asyncObjectUrlRef.current = null;
        }

        if (blob) {
          // ✅ BlobManager 사용
          const createdUrl = blobManager.createUrl(blob, {
            type: 'model',
            source: 'async'
          });
          asyncObjectUrlRef.current = createdUrl;
          setAsyncBlobUrl(createdUrl);
        } else {
          setAsyncBlobUrl(null);
        }
      } catch (error) {
        if (!cancelled) {
          setAsyncBlobUrl(null);
          if (process.env.NODE_ENV !== 'production') {
            console.error('[Canvas3D] Async model fetch failed.', error);
          }
          onAssetLoadError?.({ error });
        }
      } finally {
        if (!cancelled) {
          setIsAsyncLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      if (asyncObjectUrlRef.current) {
        safeRevokeObjectURL(asyncObjectUrlRef.current, BLOB_REVOKE_DELAY_MS);
        asyncObjectUrlRef.current = null;
      }
    };
  }, [modelFetcher, onAssetLoadError]);

  useEffect(() => {
    if (onModelUrlReady) {
      onModelUrlReady(effectiveModelUrl);
    }
  }, [effectiveModelUrl, onModelUrlReady]);

  useEffect(() => {
    if (!onAssetLoadError || typeof window === 'undefined') {
      return;
    }

    const manager = THREE.DefaultLoadingManager;
    const previousOnError = manager.onError;

    manager.onError = (url) => {
      const error = new Error(`Failed to load asset: ${url}`);
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Canvas3D] Asset loading error.', error);
      }
      onAssetLoadError({ url, error });

      if (typeof previousOnError === 'function') {
        try {
          previousOnError(url);
        } catch (cascadeError) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[Canvas3D] Error in previous loading manager handler.', cascadeError);
          }
        }
      }
    };

    return () => {
      manager.onError = previousOnError;
    };
  }, [onAssetLoadError]);

  const applyPerformanceOptions = useCallback(
    (gl: THREE.WebGLRenderer) => {
      if (!performanceOptions) {
        return;
      }

      if (performanceOptions.shadowQuality) {
        switch (performanceOptions.shadowQuality) {
          case 'low':
            gl.shadowMap.type = THREE.BasicShadowMap;
            break;
          case 'medium':
            gl.shadowMap.type = THREE.PCFShadowMap;
            break;
          case 'high':
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            break;
        }
      }

      if (performanceOptions.enableTextureCompression !== undefined) {
        const ext = gl.getContext().getExtension('WEBGL_compressed_texture_s3tc');
        if (ext && performanceOptions.enableTextureCompression) {
          gl.capabilities.precision = 'highp';
        }
      }
    },
    [performanceOptions]
  );

  const pointerMissHandler = useCallback(
    (event: any) => {
      if (onPointerMissed) {
        onPointerMissed(event);
        return;
      }
      if (onClick) {
        onClick();
      }
    },
    [onPointerMissed, onClick]
  );

  const canvasCreatedHandler = useCallback(
    ({ gl, scene, camera }: { gl: any; scene: any; camera: any }) => {
      gl.setClearColor('#f8fafc', 1);
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      scene.background = new THREE.Color('#f8fafc');

      gl.outputColorSpace = THREE.SRGBColorSpace;

      const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
      THREE.Texture.DEFAULT_ANISOTROPY = Math.min(4, maxAnisotropy);

      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.0;

      gl.physicallyCorrectLights = true;

      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      if (typeof window !== 'undefined') {
        try {
          (window as any).__R3F = { gl, scene, camera };
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[Canvas3D] Failed to expose __R3F handle.', error);
          }
        }
      }

      applyPerformanceOptions(gl);

      if (onCreated) {
        onCreated(scene, gl);
      }
    },
    [applyPerformanceOptions, onCreated]
  );

  const waitingForModel = requiresModelUrl && (isAsyncLoading || !effectiveModelUrl);
  const shouldBlockRender =
    typeof window === 'undefined' || !isMounted || waitingForModel;
  const suspenseKey = effectiveModelUrl || 'default';

  return {
    assetContextValue,
    effectiveModelUrl,
    loadingLabel,
    shouldBlockRender,
    waitingForModel,
    pointerMissHandler,
    canvasCreatedHandler,
    suspenseKey
  };
}

export { Canvas3DAssetContext };
