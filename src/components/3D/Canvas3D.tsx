'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import * as THREE from 'three';

interface Canvas3DProps {
  isMobile: boolean;
  isEditMode: boolean;
  minDpr: number;
  maxDpr: number;
  cameraControlsRef: React.RefObject<any>;
  children: React.ReactNode;
}

const Canvas3D: React.FC<Canvas3DProps> = ({
  isMobile,
  isEditMode,
  minDpr,
  maxDpr,
  cameraControlsRef,
  children
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 클라이언트 사이드에서만 렌더링
  if (typeof window === 'undefined' || !isMounted) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        3D 렌더러 로딩 중...
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Suspense 
        fallback={
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            3D 렌더러 로딩 중...
          </div>
        }
      >
        <Canvas
          shadows
          camera={{ position: [4.5, 3.0, 4.5], fov: 40 }}
          gl={{
            antialias: !isMobile,
            alpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
            depth: true,
            stencil: false,
            logarithmicDepthBuffer: false,
            outputColorSpace: THREE.SRGBColorSpace
          }}
          dpr={[minDpr, maxDpr]}
          className={`w-full h-full block absolute top-0 left-0 ${isEditMode && isMobile ? 'edit-mode-canvas' : ''}`}
          style={{
            backgroundColor: '#f8fafc',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            touchAction: isEditMode && isMobile ? 'none' : 'auto'
          }}
          onCreated={({ gl, scene }: { gl: any; scene: any }) => {
            gl.setClearColor('#f8fafc', 1);
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            scene.background = new THREE.Color('#f8fafc');

            // 텍스처 품질 개선을 위한 설정
            const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
            console.log(`🎨 GPU 최대 Anisotropy 지원: ${maxAnisotropy}`);
            
            gl.outputColorSpace = THREE.SRGBColorSpace;
            THREE.Texture.DEFAULT_ANISOTROPY = Math.min(4, maxAnisotropy);
            
            console.log(`🎨 3D 품질 설정 완료:`, {
              anisotropy: THREE.Texture.DEFAULT_ANISOTROPY,
              shadowMapSize: isMobile ? '1024x1024' : '2048x2048',
              antialias: !isMobile,
              dpr: `${minDpr}-${maxDpr}`
            });
            
            const context = gl.getContext();
            if (context) {
              context.clearColor(0.973, 0.98, 0.988, 1.0);
              context.clear(context.COLOR_BUFFER_BIT);
            }
          }}
          onPointerDown={(e: any) => {
            if (isEditMode && isMobile) {
              e.stopPropagation();
              console.log('🎯 3D 캔버스 터치 허용됨');
            }
          }}
          onPointerMove={(e: any) => {
            if (isEditMode && isMobile) {
              e.stopPropagation();
            }
          }}
          onPointerUp={(e: any) => {
            if (isEditMode && isMobile) {
              e.stopPropagation();
            }
          }}
          onWheel={(e: any) => {
            e.stopPropagation();
          }}
          onTouchStart={(e: any) => {
            if (isEditMode && isMobile) {
              e.stopPropagation();
              console.log('🎯 3D 캔버스 터치 시작 허용됨');
            }
          }}
          onTouchMove={(e: any) => {
            if (isEditMode && isMobile) {
              e.stopPropagation();
            }
          }}
          onTouchEnd={(e: any) => {
            if (isEditMode && isMobile) {
              e.stopPropagation();
              console.log('🎯 3D 캔버스 터치 종료 허용됨');
            }
          }}
        >
          {/* 카메라 컨트롤러 */}
          <CameraControls
            ref={cameraControlsRef}
            makeDefault
            minDistance={1}
            maxDistance={20}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI - Math.PI / 6}
            smoothTime={0.25}
            maxSpeed={Infinity}
            dollySpeed={0.2}
            infinityDolly={false}
          />

          {/* 배경색 설정 */}
          <color attach="background" args={['#f8fafc']} />

          {/* 조명 */}
          <ambientLight intensity={0.6} color="#ffffff" />
          <hemisphereLight args={['#87CEEB', '#C0C0C0', 0.4]} />
          <directionalLight
            name="directional-light"
            castShadow
            position={[5, 10, 5]}
            intensity={0.8}
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

          {/* 편집 모드나 모바일에서는 AdaptiveDpr 비활성화 */}
          {!isEditMode && !isMobile && (
            <AdaptiveDpr pixelated={false} />
          )}
          <AdaptiveEvents />

          {children}
        </Canvas>
      </Suspense>
    </div>
  );
};

export default Canvas3D;