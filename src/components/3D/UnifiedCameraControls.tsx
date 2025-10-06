'use client';

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { moveCameraToTarget, forceResetCameraRotation } from '@/utils/cameraUtils';

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
  // smoothTime: 0.15,        // 더 빠른 반응성 - 부드러운 줌 비활성화
  // maxSpeed: 0.6,           // 부드러운 움직임 - 부드러운 줌 비활성화
  // dollySpeed: 0.12,        // 줌 속도 조절 - 부드러운 줌 비활성화
  azimuthRotateSpeed: 0.8, // 수평 회전 감도
  polarRotateSpeed: 0.8,   // 수직 회전 감도
  truckSpeed: 1.0,         // 이동 속도
  minDistance: 1.0,        // 최소 거리
  maxDistance: 25,         // 최대 거리 (모바일에서 더 멀리 볼 수 있도록)
  maxPolarAngle: Math.PI * 0.75, // 위쪽 제한
  minPolarAngle: Math.PI * 0.25, // 아래쪽 제한
};

// PC 최적화 설정 - 마우스 조작에 최적화
const PC_CONFIG = {
  // smoothTime: 0.08,        // 빠른 반응성 - 부드러운 줌 비활성화
  // maxSpeed: 2.5,           // 빠른 움직임 - 부드러운 줌 비활성화
  // dollySpeed: 0.3,         // 줌 속도 - 부드러운 줌 비활성화
  azimuthRotateSpeed: 1.2, // 수평 회전 감도
  polarRotateSpeed: 1.2,   // 수직 회전 감도
  truckSpeed: 2.5,         // 이동 속도
  minDistance: 1.0,        // 최소 거리
  maxDistance: 20,         // 최대 거리 (PC에서 더 먼 줌 허용)
  maxPolarAngle: Math.PI * 0.85, // 위쪽 제한
  minPolarAngle: Math.PI * 0.15, // 아래쪽 제한
};

const UnifiedCameraControls = React.forwardRef<import('camera-controls').default, UnifiedCameraControlsProps>(({
  isViewLocked,
  isDragging,
  isEditMode,
  hasSelection,
  isMobile,
  controlsRef,
  onTransitionLockChange
}, ref) => {
  const { camera } = useThree();

  // 시점 고정 시 이동할 위치와 시점 (10x10x5 방에 맞게 조정)
  const lockedPosition: [number, number, number] = [5, 4, 6];
  const lockedLookAt: [number, number, number] = [0, 0, 0];

  // ref와 controlsRef를 동기화
  React.useEffect(() => {
    if (ref && typeof ref === 'object' && 'current' in ref) {
      (ref as React.MutableRefObject<import('camera-controls').default | null>).current = controlsRef.current;
    }
  }, [ref, controlsRef]);

  // 카메라 위치 모니터링 (디버그용)
  const lastLogTime = useRef<number>(0);

  // 현재 설정을 메모이제이션
  const currentConfig = useMemo(() => {
    return isMobile ? MOBILE_CONFIG : PC_CONFIG;
  }, [isMobile]);


  // 카메라 설정 적용 함수 (일반 모드 - 부드러운 줌 비활성화)
  const applyCameraSettings = useCallback((config: typeof MOBILE_CONFIG) => {
    if (!controlsRef.current) return;

    try {
      // 일반 카메라 조작 시 부드러운 줌 비활성화 (즉시 반응)
      controlsRef.current.smoothTime = 0;  // 즉시 반응
      controlsRef.current.maxSpeed = 10;   // 빠른 속도
      controlsRef.current.dollySpeed = 1;  // 빠른 줌 속도
      
      // 회전 및 이동 속도 설정
      (controlsRef.current as any).azimuthRotateSpeed = config.azimuthRotateSpeed;
      (controlsRef.current as any).polarRotateSpeed = config.polarRotateSpeed;
      (controlsRef.current as any).truckSpeed = config.truckSpeed;
      
      // console.log('🎥 카메라 설정 적용 (일반 모드 - 부드러운 줌 비활성화):', { config, isMobile });
    } catch (error) {
      // console.warn('⚠️ 카메라 설정 적용 실패:', error);
    }
  }, [controlsRef, isMobile]);

  // 시점 고정 시 카메라 설정 적용 함수 (부드러운 전환 활성화)
  const applyViewLockSettings = useCallback(() => {
    if (!controlsRef.current) return;

    try {
      // 시점 고정 시에만 부드러운 전환 활성화
      controlsRef.current.smoothTime = 0.8;  // 0.8초 동안 부드러운 전환
      controlsRef.current.maxSpeed = 2.0;    // 적당한 속도
      controlsRef.current.dollySpeed = 0.5;  // 부드러운 줌 속도
      
      // console.log('🔒 시점 고정 카메라 설정 적용 (부드러운 전환 활성화)');
    } catch (error) {
      // console.warn('⚠️ 시점 고정 카메라 설정 적용 실패:', error);
    }
  }, [controlsRef]);


  // 카메라 설정 초기화 및 변경 감지
  useEffect(() => {
    if (!controlsRef.current) return;
    
    // 현재 설정 적용
    applyCameraSettings(currentConfig);
    
    // 개발 환경에서만 로그 출력
    if (process.env.NODE_ENV === 'development') {
      // console.log('🎥 카메라 컨트롤 초기화:', {
      //   isMobile,
      //   isEditMode,
      //   isDragging,
      //   hasSelection,
      //   cameraEnabled: !isViewLocked && !isDragging,
      //   config: currentConfig
      // });
    }
  }, [controlsRef, currentConfig, applyCameraSettings, isMobile, isEditMode, isDragging, hasSelection, isViewLocked]);

  // 드래그 상태 변경 시 카메라 컨트롤 상태 업데이트
  useEffect(() => {
    if (!controlsRef.current) return;
    
    const cameraEnabled = !isViewLocked && !isDragging;
    
    if (process.env.NODE_ENV === 'development') {
      // console.log('🎯 카메라 컨트롤 상태 변경:', {
      //   isDragging,
      //   isViewLocked,
      //   cameraEnabled,
      //   action: isDragging ? '드래그 중 - 카메라 비활성화' : '드래그 종료 - 카메라 활성화'
      // });
    }
    
    // 카메라 컨트롤 활성화/비활성화
    controlsRef.current.enabled = cameraEnabled;
    
  }, [isDragging, isViewLocked, controlsRef]);

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
        // console.log(`🎥 카메라 위치: x=${position.x.toFixed(2)}, y=${position.y.toFixed(2)}, z=${position.z.toFixed(2)}`);
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
        // console.log('🔒 시점 고정 모드 활성화');
      }
      
      // 시점 고정 시 카메라 설정 - 부드러운 줌 비활성화
      // controlsRef.current.smoothTime = 1.0;
      // controlsRef.current.maxSpeed = 3;
      
      // 회전/이동 비활성화 (줌은 허용)
      try {
        (controlsRef.current as any).azimuthRotateSpeed = 0;
        (controlsRef.current as any).polarRotateSpeed = 0;
        (controlsRef.current as any).truckSpeed = 0;
      } catch (e) {
        // 속성 설정 실패 시 무시
      }

      // 시점 고정 전 카메라 회전 상태 초기화
      onTransitionLockChange?.(true);
      
      // 1. 카메라 회전 상태를 강제 초기화하여 불필요한 회전 방지 (시점고정 모드에서만)
      if (isViewLocked) {
        forceResetCameraRotation(controlsRef.current);
      }
      
      // 2. 시점 고정 시 카메라 설정 적용 (부드러운 전환 활성화)
      applyViewLockSettings();
      
      // 3. DPR 변경 방지 코드 제거 - React Three Fiber가 자동으로 관리하도록 함
      
      // 4. 최단 경로로 목표 위치로 이동 - 시점 고정 시에만 부드러운 전환 활성화
      moveCameraToTarget(
        controlsRef.current.camera,
        controlsRef.current,
        lockedPosition,
        lockedLookAt,
        true  // 시점 고정 시 부드러운 전환 활성화
      );
      
      // 전환 완료 처리 (부드러운 전환 시간에 맞춰 조정)
      setTimeout(() => {
        onTransitionLockChange?.(false);
        if (process.env.NODE_ENV === 'development') {
          // console.log('✅ 시점 고정 완료 - 부드러운 전환으로 이동');
        }
      }, 800); // 0.8초 후 완료 처리 (smoothTime과 동일)
    } else {
      // 개발 환경에서만 로그 출력
      if (process.env.NODE_ENV === 'development') {
        // console.log('🎯 시점 자유 모드 활성화');
      }
      
      // 자유 모드 시 일반 카메라 설정 적용 (부드러운 줌 비활성화)
      applyCameraSettings(currentConfig);
    }
  }, [isViewLocked, controlsRef, onTransitionLockChange, applyCameraSettings, applyViewLockSettings, currentConfig]);
  

  return (
    <CameraControls
      ref={ref}
      makeDefault
      enabled={!isViewLocked && !isDragging} // 가구 드래그 중에는 카메라 컨트롤 비활성화
      // 현재 설정 적용
      minDistance={currentConfig.minDistance}
      maxDistance={currentConfig.maxDistance}
      maxPolarAngle={currentConfig.maxPolarAngle}
      minPolarAngle={currentConfig.minPolarAngle}
      // smoothTime={currentConfig.smoothTime}  // 부드러운 줌 비활성화
      // maxSpeed={currentConfig.maxSpeed}      // 부드러운 줌 비활성화
      // dollySpeed={currentConfig.dollySpeed}  // 부드러운 줌 비활성화
      infinityDolly={false}
      // 터치 감도 조절
      azimuthRotateSpeed={currentConfig.azimuthRotateSpeed}
      polarRotateSpeed={currentConfig.polarRotateSpeed}
      truckSpeed={currentConfig.truckSpeed}
    />
  );
});

UnifiedCameraControls.displayName = 'UnifiedCameraControls';

export default UnifiedCameraControls;
