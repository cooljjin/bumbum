'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveEvents, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface Canvas3DProps {
  isMobile: boolean;
  isEditMode: boolean;
  minDpr: number;
  maxDpr: number;
  children: React.ReactNode;
  onClick?: () => void;
}

// ---------- 초기 렌더링 강제 실행 컴포넌트 제거됨 ----------

// ---------- 렌더링 품질 일정 유지 컴포넌트 (최적화됨) ----------
function RenderQualityStabilizer() {
  const { gl } = useThree();
  
  useFrame(() => {
    // DPR이 1보다 작으면 최소값으로 설정 (뿌옇게 보이는 문제 방지)
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
  minDpr,
  maxDpr,
  children,
  onClick
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 클라이언트 사이드에서만 렌더링
  if (typeof window === 'undefined' || !isMounted) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">3D 렌더러 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">

      <Suspense 
        fallback={
          <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">3D 렌더러 로딩 중...</p>
            </div>
          </div>
        }
      >
        <Canvas
          shadows
          camera={{ position: [4.5, 3.0, 4.5], fov: 40 }}
          gl={{
            antialias: true, // 모든 디바이스에서 안티앨리어싱 활성화
            alpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
            depth: true,
            stencil: false,
            logarithmicDepthBuffer: false,
            outputColorSpace: THREE.SRGBColorSpace,
            precision: 'highp' // 고정밀도 렌더링
          }}
          dpr={[1, 2]} // DPR 범위 설정 (최소 1, 최대 2)
          className={`w-full h-full block absolute top-0 left-0 ${isEditMode && isMobile ? 'edit-mode-canvas' : ''}`}
          style={{
            backgroundColor: '#f8fafc',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            touchAction: 'auto'  // 카메라 컨트롤을 위해 터치 이벤트 허용
          }}
          onCreated={({ gl, scene, size, camera }: { gl: any; scene: any; size: any; camera: any }) => {
            // 초기 렌더링 품질 설정
            gl.setClearColor('#f8fafc', 1);
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            scene.background = new THREE.Color('#f8fafc');

            // 색상 공간 설정
            gl.outputColorSpace = THREE.SRGBColorSpace;
            
            // 텍스처 품질 설정
            const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
            THREE.Texture.DEFAULT_ANISOTROPY = Math.min(4, maxAnisotropy);
            
            // 톤 매핑 설정
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.0;
            
            // 카메라 초기화 - 뿌옇게 보이는 문제 방지
            camera.updateProjectionMatrix();
            camera.updateMatrixWorld();
            
            console.log(`🎨 3D 품질 설정 완료:`, {
              anisotropy: THREE.Texture.DEFAULT_ANISOTROPY,
              shadowMapSize: isMobile ? '1024x1024' : '2048x2048',
              antialias: true,
              devicePixelRatio: window.devicePixelRatio,
              pixelRatio: gl.getPixelRatio(),
              canvasSize: size,
              cameraPosition: camera.position,
              cameraFov: camera.fov
            });
          }}
          onWheel={() => {
            // e.stopPropagation(); // 이벤트 전파 허용
          }}
          onClick={onClick}
        >
          {/* 카메라 컨트롤은 UnifiedCameraControls에서 처리됨 */}

          {/* 배경색 설정 */}
          <color attach="background" args={['#f8fafc']} />

          {/* 환경 맵핑 - 크롬 재질 반사를 위해 추가 */}
          <Environment preset="apartment" />

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

          {/* 렌더링 품질 일정 유지 컴포넌트 */}
          <RenderQualityStabilizer />

          {/* AdaptiveDpr 완전 비활성화 - 에셋 선택 시 화면 뿌옇게 변하는 문제 해결 */}
          {/* {!isEditMode && !isMobile && (
            <AdaptiveDpr pixelated={false} />
          )} */}
          <AdaptiveEvents />

          {children}
        </Canvas>
      </Suspense>
    </div>
  );
};

export default Canvas3D;