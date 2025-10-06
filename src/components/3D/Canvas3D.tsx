'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveEvents, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { PerformanceOptions } from '../../types/editor';
import LoadingSpinner from '../ui/LoadingSpinner';

// React Three Fiber 확장 설정
// import { extend } from '@react-three/fiber';

interface Canvas3DProps {
  isMobile: boolean;
  isEditMode: boolean;
  minDpr: number;
  maxDpr: number;
  children: React.ReactNode;
  onClick?: () => void;
  onCreated?: (scene: any, gl: any) => void;
  onPointerMissed?: (event: any) => void;
  /** 성능 옵션 설정 */
  performanceOptions?: PerformanceOptions;
}

// (보강 핸들러 제거) onPointerMissed만 사용해 빈 공간 클릭 처리

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
  children,
  onClick,
  onCreated,
  onPointerMissed,
  performanceOptions
}) => {
  const [isMounted, setIsMounted] = useState(false);

  // 성능 옵션 적용
  const applyPerformanceOptions = useCallback((gl: THREE.WebGLRenderer) => {
    if (!performanceOptions) return;

    // 그림자 품질 설정
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

    // 텍스처 압축 설정
    if (performanceOptions.enableTextureCompression !== undefined) {
      // WebGL 확장 확인 후 적용
      const ext = gl.getContext().getExtension('WEBGL_compressed_texture_s3tc');
      if (ext && performanceOptions.enableTextureCompression) {
        // 압축 텍스처 사용 설정
        gl.capabilities.precision = 'highp';
      }
    }

    // 프러스텀 컬링 설정 (WebGLRenderer에는 frustumCulled 속성이 없으므로 제거)
    // if (performanceOptions.enableFrustumCulling !== undefined) {
    //   gl.frustumCulled = performanceOptions.enableFrustumCulling;
    // }
  }, [performanceOptions]);

  // 빈 공간 클릭 핸들러
  const handleEmptySpaceClick = () => {
    // console.log('🎯 Canvas3D 빈 공간 클릭 감지됨:', {
    //   type: event.type,
    //   pointerType: event.pointerType,
    //   clientX: event.clientX,
    //   clientY: event.clientY,
    //   timestamp: Date.now()
    // });

    // 외부 onClick 핸들러 호출
    if (onClick) {
      onClick();
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 클라이언트 사이드에서만 렌더링
  if (typeof window === 'undefined' || !isMounted) {
    return <LoadingSpinner message="3D 렌더러 로딩 중..." />;
  }

  return (
    <div className="w-full h-full relative">

      <Suspense 
        fallback={<LoadingSpinner message="3D 렌더러 로딩 중..." />}
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
          onPointerMissed={onPointerMissed || handleEmptySpaceClick}
          onCreated={({ gl, scene, camera }: { gl: any; scene: any; camera: any }) => {
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

            // 물리적으로 정확한 조명 활성화
            gl.physicallyCorrectLights = true;

            // 카메라 초기화 - 뿌옇게 보이는 문제 방지
            camera.updateProjectionMatrix();
            camera.updateMatrixWorld();

            // 디버그: R3F 핸들 노출 (개발 전용)
            if (typeof window !== 'undefined') {
              try {
                (window as any).__R3F = { gl, scene, camera };
              } catch {}
            }

            // 성능 옵션 적용
            applyPerformanceOptions(gl);

            // 성능 모니터링을 위한 씬 정보 전달
            if (onCreated) {
              onCreated(scene, gl);
            }

            // console.log(`🎨 3D 품질 설정 완료:`, {
            //   anisotropy: THREE.Texture.DEFAULT_ANISOTROPY,
            //   shadowMapSize: isMobile ? '1024x1024' : '2048x2048',
            //   antialias: true,
            //   devicePixelRatio: window.devicePixelRatio,
            //   pixelRatio: gl.getPixelRatio(),
            //   canvasSize: size,
            //   cameraPosition: camera.position,
            //   cameraFov: camera.fov
            // });
          }}
          onWheel={() => {
            // e.stopPropagation(); // 이벤트 전파 허용
          }}
          // onClick 제거: 빈 공간 해제는 onPointerMissed 또는 DOM raycast로 처리
        >
          {/* 카메라 컨트롤은 UnifiedCameraControls에서 처리됨 */}

          {/* 배경색 설정 */}
          <color attach="background" args={['#f8fafc']} />

          {/* 환경 맵핑 - 네트워크 제한 환경에서 오류를 유발할 수 있어 기본 비활성화 */}
          {process.env['NEXT_PUBLIC_USE_ENV'] === '1' && (
            <Environment preset="apartment" />
          )}

          {/* 조명 (개선된 설정) */}
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
          {/* 추가 조명 - 더 부드러운 그림자 */}
          <directionalLight
            position={[-5, 8, -5]}
            intensity={0.3}
            color="#ffffff"
          />

          {/* 렌더링 품질 일정 유지 컴포넌트 */}
          <RenderQualityStabilizer />

          {/* AdaptiveDpr 완전 비활성화 - 에셋 선택 시 화면 뿌옇게 변하는 문제 해결 */}
          {/* {!isEditMode && !isMobile && (
            <AdaptiveDpr pixelated={false} />
          )} */}
          <AdaptiveEvents />

          {/* 빈 공간 처리는 onPointerMissed만 사용 */}

          {children}
        </Canvas>
      </Suspense>
    </div>
  );
};

export default Canvas3D;
