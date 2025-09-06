'use client';

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';

interface UnifiedCameraControlsProps {
  isViewLocked: boolean;
  isDragging: boolean;
  isEditMode: boolean;
  hasSelection: boolean;
  isMobile: boolean;
  controlsRef: React.RefObject<import('camera-controls').default | null>;
  onTransitionLockChange?: (locked: boolean) => void;
}

// 모바일 최적화 설정 - 터치 제스처에 최적화
const MOBILE_CONFIG = {
  smoothTime: 0.15,        // 더 빠른 반응성
  maxSpeed: 0.6,           // 부드러운 움직임
  dollySpeed: 0.12,        // 줌 속도 조절
  azimuthRotateSpeed: 0.8, // 수평 회전 감도
  polarRotateSpeed: 0.8,   // 수직 회전 감도
  truckSpeed: 1.0,         // 이동 속도
  minDistance: 1.0,        // 최소 거리
  maxDistance: 10,         // 최대 거리 (모바일 화면에 맞게)
  maxPolarAngle: Math.PI * 0.75, // 위쪽 제한
  minPolarAngle: Math.PI * 0.25, // 아래쪽 제한
};

// PC 최적화 설정 - 마우스 조작에 최적화
const PC_CONFIG = {
  smoothTime: 0.08,        // 빠른 반응성
  maxSpeed: 2.5,           // 빠른 움직임
  dollySpeed: 0.3,         // 줌 속도
  azimuthRotateSpeed: 1.2, // 수평 회전 감도
  polarRotateSpeed: 1.2,   // 수직 회전 감도
  truckSpeed: 2.5,         // 이동 속도
  minDistance: 1.0,        // 최소 거리
  maxDistance: 15,         // 최대 거리
  maxPolarAngle: Math.PI * 0.85, // 위쪽 제한
  minPolarAngle: Math.PI * 0.15, // 아래쪽 제한
};

const UnifiedCameraControls: React.FC<UnifiedCameraControlsProps> = ({
  isViewLocked,
  isDragging,
  isEditMode,
  hasSelection,
  isMobile,
  controlsRef,
  onTransitionLockChange
}) => {
  const { camera } = useThree();

  // 시점 고정 시 이동할 위치와 시점 (10x10x5 방에 맞게 조정)
  const lockedPosition: [number, number, number] = [5, 4, 6];
  const lockedLookAt: [number, number, number] = [0, 0, 0];

  // 카메라 위치 모니터링 (디버그용)
  const lastLogTime = useRef<number>(0);

  // 현재 설정을 메모이제이션
  const currentConfig = useMemo(() => {
    return isMobile ? MOBILE_CONFIG : PC_CONFIG;
  }, [isMobile]);


  // 카메라 설정 적용 함수
  const applyCameraSettings = useCallback((config: typeof MOBILE_CONFIG) => {
    if (!controlsRef.current) return;

    try {
      // 기본 CameraControls 설정
      controlsRef.current.smoothTime = config.smoothTime;
      controlsRef.current.maxSpeed = config.maxSpeed;
      controlsRef.current.dollySpeed = config.dollySpeed;
      
      // 회전 및 이동 속도 설정
      (controlsRef.current as any).azimuthRotateSpeed = config.azimuthRotateSpeed;
      (controlsRef.current as any).polarRotateSpeed = config.polarRotateSpeed;
      (controlsRef.current as any).truckSpeed = config.truckSpeed;
      
      console.log('🎥 카메라 설정 적용:', { config, isMobile });
    } catch (error) {
      console.warn('⚠️ 카메라 설정 적용 실패:', error);
    }
  }, [controlsRef, isMobile]);


  // 카메라 설정 초기화 및 변경 감지
  useEffect(() => {
    if (!controlsRef.current) return;
    
    // 현재 설정 적용
    applyCameraSettings(currentConfig);
    
    // 개발 환경에서만 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('🎥 카메라 컨트롤 초기화:', {
        isMobile,
        isEditMode,
        isDragging,
        hasSelection,
        config: currentConfig
      });
    }
  }, [controlsRef, currentConfig, applyCameraSettings, isMobile, isEditMode, isDragging, hasSelection]);

  // 카메라 위치 제한 및 디버깅
  useFrame(() => {
    // Y축 위치 제한 (너무 낮게 내려가지 않도록)
    const minY = 0.5;
    if (camera.position.y < minY) {
      camera.position.y = minY;
    }

    // 디버그 로그 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      const now = Date.now();
      if (now - lastLogTime.current > 1000) { // 1초마다 로그
        const position = camera.position;
        console.log(`🎥 카메라 위치: x=${position.x.toFixed(2)}, y=${position.y.toFixed(2)}, z=${position.z.toFixed(2)}`);
        lastLogTime.current = now;
      }
    }
  });

  // 시점 고정 처리
  useEffect(() => {
    if (!controlsRef.current) return;

    if (isViewLocked) {
      // 개발 환경에서만 로그 출력
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 시점 고정 모드 활성화');
      }
      
      // 시점 고정 시 카메라 설정
      controlsRef.current.smoothTime = 1.0;
      controlsRef.current.maxSpeed = 3;
      
      // 회전/이동 비활성화 (줌은 허용)
      try {
        (controlsRef.current as any).azimuthRotateSpeed = 0;
        (controlsRef.current as any).polarRotateSpeed = 0;
        (controlsRef.current as any).truckSpeed = 0;
      } catch (e) {
        // 속성 설정 실패 시 무시
      }

      // 부드러운 전환으로 목표 위치로 이동
      onTransitionLockChange?.(true);
      controlsRef.current.setLookAt(
        lockedPosition[0], lockedPosition[1], lockedPosition[2],
        lockedLookAt[0], lockedLookAt[1], lockedLookAt[2],
        true
      ).finally(() => {
        onTransitionLockChange?.(false);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ 시점 고정 완료');
        }
      });
    } else {
      // 개발 환경에서만 로그 출력
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 시점 자유 모드 활성화');
      }
      
      // 자유 모드 시 현재 설정 적용
      applyCameraSettings(currentConfig);
    }
  }, [isViewLocked, controlsRef, onTransitionLockChange, applyCameraSettings, currentConfig]);
  

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      enabled={!isViewLocked}
      // 현재 설정 적용
      minDistance={currentConfig.minDistance}
      maxDistance={currentConfig.maxDistance}
      maxPolarAngle={currentConfig.maxPolarAngle}
      minPolarAngle={currentConfig.minPolarAngle}
      smoothTime={currentConfig.smoothTime}
      maxSpeed={currentConfig.maxSpeed}
      dollySpeed={currentConfig.dollySpeed}
      infinityDolly={false}
      // 터치 감도 조절
      azimuthRotateSpeed={currentConfig.azimuthRotateSpeed}
      polarRotateSpeed={currentConfig.polarRotateSpeed}
      truckSpeed={currentConfig.truckSpeed}
    />
  );
};

export default UnifiedCameraControls;
