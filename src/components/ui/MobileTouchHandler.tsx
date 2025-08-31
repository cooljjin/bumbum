'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler, Group } from 'three';
import { useEditorStore } from '../../store/editorStore';

interface TouchGesture {
  type: 'none' | 'pan' | 'pinch' | 'rotate';
  startTime: number;
  startTouches: Touch[];
  currentTouches: Touch[];
}



interface MobileTouchHandlerProps {
  target?: Group | null;
  enabled?: boolean;
  onTransform?: (position: Vector3, rotation: Euler, scale: Vector3) => void;
  sensitivity?: {
    pan: number;
    pinch: number;
    rotate: number;
  };
}

  // 터치 피드백 유틸리티 함수들
  const provideTouchFeedback = (type: 'start' | 'move' | 'end', gestureType: string) => {
    // 햅틱 피드백 (지원되는 경우)
    if (navigator.vibrate) {
      switch (type) {
        case 'start':
          navigator.vibrate(50);
          break;
        case 'move':
          // 이동 중에는 약한 피드백
          navigator.vibrate(10);
          break;
        case 'end':
          navigator.vibrate(30);
          break;
      }
    }

    // 시각적 피드백을 위한 커스텀 이벤트 발생
    const feedbackEvent = new CustomEvent('touchFeedback', {
      detail: { type, gestureType, timestamp: Date.now() }
    });
    window.dispatchEvent(feedbackEvent);

    console.log(`📱 터치 피드백: ${type} - ${gestureType}`);
  };



export const MobileTouchHandler: React.FC<MobileTouchHandlerProps> = ({
  target,
  enabled = true,
  onTransform,
  sensitivity = { pan: 1, pinch: 1, rotate: 1 }
}) => {
  const { camera, gl } = useThree();
  const { tool, mode } = useEditorStore();

  // 터치 상태 관리
  const [currentGesture, setCurrentGesture] = useState<TouchGesture>({
    type: 'none',
    startTime: 0,
    startTouches: [],
    currentTouches: []
  });

  // 터치 이벤트 핸들러
  const touchStartHandler = useCallback((event: TouchEvent) => {
    if (!enabled || mode !== 'edit') return;

    event.preventDefault();

    const touches = Array.from(event.touches);
    const now = Date.now();



    const gestureType = touches.length === 1 ? 'pan' : touches.length === 2 ? 'pinch' : 'none';

    setCurrentGesture({
      type: gestureType as any,
      startTime: now,
      startTouches: touches,
      currentTouches: touches
    });

    // 터치 시작 피드백
    provideTouchFeedback('start', gestureType);

    console.log('📱 터치 시작:', {
      touchCount: touches.length,
      type: gestureType,
      tool: tool
    });

  }, [enabled, mode, tool]);

  const touchMoveHandler = useCallback((event: TouchEvent) => {
    if (!enabled || mode !== 'edit' || !target) return;

    event.preventDefault();

    const touches = Array.from(event.touches);

    setCurrentGesture(prev => ({
      ...prev,
      currentTouches: touches
    }));

    // 터치 이동 처리
    if (touches.length === 1 && tool === 'translate' && touches[0]) {
      // 단일 터치 - 이동
      handleSingleTouchPan(touches[0]);
    } else if (touches.length === 2) {
      // 두 손가락 터치 - 줌 또는 회전
      handleTwoFingerGesture(touches);
    }

  }, [enabled, mode, tool, target]);

  const touchEndHandler = useCallback((event: TouchEvent) => {
    if (!enabled || mode !== 'edit') return;

    event.preventDefault();

    const touches = Array.from(event.touches);

    if (touches.length === 0) {
      // 모든 터치가 끝남
      provideTouchFeedback('end', currentGesture.type);
      console.log('📱 터치 종료');
      setCurrentGesture({
        type: 'none',
        startTime: 0,
        startTouches: [],
        currentTouches: []
      });
    } else {
      // 일부 터치만 끝남 - 제스처 유지
      setCurrentGesture(prev => ({
        ...prev,
        currentTouches: touches
      }));
    }

  }, [enabled, mode]);

  // 단일 터치 이동 처리
  const handleSingleTouchPan = useCallback((touch: Touch) => {
    if (!target) return;

    // 터치 이동 거리를 3D 공간으로 변환
    const deltaX = touch.clientX - (currentGesture.startTouches[0]?.clientX || 0);
    const deltaY = touch.clientY - (currentGesture.startTouches[0]?.clientY || 0);

    // 이동 감도 조절
    const panSpeed = 0.01 * sensitivity.pan;

    // 현재 카메라 방향을 고려한 이동 계산
    const cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);

    const right = new Vector3().crossVectors(camera.up, cameraDirection).normalize();
    const up = camera.up.clone();

    const movement = new Vector3()
      .addScaledVector(right, -deltaX * panSpeed)
      .addScaledVector(up, deltaY * panSpeed);

    // 객체 이동 적용
    target.position.add(movement);

    if (onTransform) {
      onTransform(target.position, new Euler().setFromQuaternion(target.quaternion), target.scale);
    }

  }, [target, currentGesture, sensitivity, camera, onTransform]);

  // 두 손가락 제스처 처리 (줌/회전)
  const handleTwoFingerGesture = useCallback((touches: Touch[]) => {
    if (!target || touches.length < 2) return;

    const touch1 = touches[0];
    const touch2 = touches[1];
    const startTouch1 = currentGesture.startTouches[0];
    const startTouch2 = currentGesture.startTouches[1];

    if (!touch1 || !touch2 || !startTouch1 || !startTouch2) return;

    // 현재 거리와 각도 계산
    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    const startDistance = Math.sqrt(
      Math.pow(startTouch2.clientX - startTouch1.clientX, 2) +
      Math.pow(startTouch2.clientY - startTouch1.clientY, 2)
    );

    // 줌 처리 (Scale)
    if (tool === 'scale') {
      const scaleFactor = currentDistance / startDistance;
      const newScale = target.scale.clone().multiplyScalar(scaleFactor);

      // 최소/최대 크기 제한
      newScale.clampLength(0.1, 5.0);
      target.scale.copy(newScale);

      if (onTransform) {
        onTransform(target.position, new Euler().setFromQuaternion(target.quaternion), target.scale);
      }
    }

    // 회전 처리 (Rotation)
    else if (tool === 'rotate') {
      const currentAngle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );

      const startAngle = Math.atan2(
        startTouch2.clientY - startTouch1.clientY,
        startTouch2.clientX - startTouch1.clientX
      );

      const angleDelta = currentAngle - startAngle;
      const rotationSpeed = sensitivity.rotate * 0.5;

      // Y축 회전 적용
      target.rotateY(angleDelta * rotationSpeed);

      if (onTransform) {
        onTransform(target.position, new Euler().setFromQuaternion(target.quaternion), target.scale);
      }
    }

  }, [target, currentGesture, tool, sensitivity, onTransform]);

  // 이벤트 리스너 등록/해제
  useEffect(() => {
    if (!enabled) return;

    const canvas = gl.domElement;

    canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', touchEndHandler, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', touchStartHandler);
      canvas.removeEventListener('touchmove', touchMoveHandler);
      canvas.removeEventListener('touchend', touchEndHandler);
    };
  }, [enabled, touchStartHandler, touchMoveHandler, touchEndHandler, gl]);

  // 터치 시각적 피드백
  useFrame(() => {
    if (currentGesture.type !== 'none' && target) {
      // 터치 중인 객체에 시각적 피드백 추가 가능
      // 예: 객체 테두리 색상 변경, 크기 약간 확대 등
    }
  });

  return null; // 이 컴포넌트는 렌더링하지 않음
};

export default MobileTouchHandler;
