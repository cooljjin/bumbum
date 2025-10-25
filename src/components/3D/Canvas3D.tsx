'use client';

import React, { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveEvents, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { PerformanceOptions } from '../../types/editor';
import LoadingSpinner from '../ui/LoadingSpinner';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';

interface Canvas3DProps {
  isMobile: boolean;
  isEditMode: boolean;
  minDpr: number;
  maxDpr: number;
  children: React.ReactNode;
  onClick?: () => void;
  onCreated?: (scene: any, gl: any) => void;
  onPointerMissed?: (event: any) => void;
  performanceOptions?: PerformanceOptions;
}

function RenderQualityStabilizer() {
  const { gl } = useThree();

  useFrame(() => {
    const currentPixelRatio = gl.getPixelRatio();
    if (currentPixelRatio < 1) {
      gl.setPixelRatio(1);
    }
  });

  return null;
}

const Canvas3D: React.FC<Canvas3DProps> = ({
  isMobile,
  isEditMode,
  children,
  onClick,
  onCreated,
  onPointerMissed,
  performanceOptions
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const glOptions = useMemo(
    () => ({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
      depth: true,
      stencil: false,
      logarithmicDepthBuffer: false,
      outputColorSpace: THREE.SRGBColorSpace,
      precision: 'highp'
    }),
    []
  );
  const cameraOptions = useMemo(
    () => ({
      position: [4.5, 3.0, 4.5] as [number, number, number],
      fov: 40
    }),
    []
  );

  const applyPerformanceOptions = useCallback((gl: THREE.WebGLRenderer) => {
    if (!performanceOptions) return;

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

  }, [performanceOptions]);

  const handleEmptySpaceClick = () => {

    if (onClick) {
      onClick();
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (typeof window === 'undefined' || !isMounted) {
    return <LoadingSpinner message="Loading 3D renderer..." />;
  }

  return (
    <div className="w-full h-full relative">
      <CanvasErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading 3D renderer..." />}>
          <Canvas
            shadows
            camera={cameraOptions}
            gl={glOptions}
            dpr={[1, 2]}
            className={`w-full h-full block absolute top-0 left-0 ${isEditMode && isMobile ? 'edit-mode-canvas' : ''}`}
            style={{
              backgroundColor: '#f8fafc',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              touchAction: 'auto'
            }}
            onPointerMissed={onPointerMissed || handleEmptySpaceClick}
            onCreated={({ gl, scene, camera }: { gl: any; scene: any; camera: any }) => {
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
                } catch {}
              }

              applyPerformanceOptions(gl);

              if (onCreated) {
                onCreated(scene, gl);
              }
            }}
            onWheel={() => {}}
          >
            <color attach="background" args={['#f8fafc']} />

            {process.env['NEXT_PUBLIC_USE_ENV'] === '1' && (
              <Environment preset="apartment" />
            )}

            <ambientLight intensity={0.4} color="#ffffff" />
            <hemisphereLight args={['#87CEEB', '#C0C0C0', 0.6]} />
            <directionalLight
              name="directional-light"
              castShadow
              position={[5, 10, 5]}
              intensity={1.2}
              color="#ffffff"
              shadow-mapSize-width={isMobile ? 1024 : 2048}
              shadow-mapSize-height={isMobile ? 1024 : 2048}
              shadow-camera-near={0.1}
              shadow-camera-far={50}
              shadow-camera-left={-10}
              shadow-camera-right={10}
              shadow-camera-top={10}
              shadow-camera-bottom={-10}
              shadow-bias={-0.0001}
            />
            <directionalLight
              position={[-5, 8, -5]}
              intensity={0.3}
              color="#ffffff"
            />

            <RenderQualityStabilizer />

            <AdaptiveEvents />

            {children}
          </Canvas>
        </Suspense>
      </CanvasErrorBoundary>
    </div>
  );
};

export default Canvas3D;
