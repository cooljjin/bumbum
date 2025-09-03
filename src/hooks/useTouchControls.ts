'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TouchState {
  isPinching: boolean;
  isDragging: boolean;
  startPosition: { x: number; y: number } | null;
  startDistance: number;
  startAngle: number;
  lastTapTime: number;
}

export interface TouchCallbacks {
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onDragStart?: (x: number, y: number) => void;
  onDragMove?: (deltaX: number, deltaY: number) => void;
  onDragEnd?: () => void;
}

export interface UseTouchControlsOptions {
  enabled?: boolean;
  sensitivity?: number;
  doubleTapDelay?: number;
  callbacks: TouchCallbacks;
}

export function useTouchControls({
  enabled = true,
  sensitivity = 1.0,
  doubleTapDelay = 300,
  callbacks
}: UseTouchControlsOptions) {
  // 터치 상태 관리
  const [touchState, setTouchState] = useState<TouchState>({
    isPinching: false,
    isDragging: false,
    startPosition: null,
    startDistance: 0,
    startAngle: 0,
    lastTapTime: 0
  });

  // 모바일 환경 감지
  const [isMobile, setIsMobile] = useState(false);
  
  // 터치 시작 위치 저장 (팬 계산용)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // 모바일 환경 감지 함수
  const checkMobile = useCallback(() => {
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileDevice = mobileRegex.test(navigator.userAgent) || window.innerWidth <= 768;
    setIsMobile(isMobileDevice);
  }, []);

  // 모바일 환경 감지 설정
  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  // 터치 포인트 간 거리 계산
  const getTouchDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // 터치 포인트 간 각도 계산
  const getTouchAngle = useCallback((touch1: Touch, touch2: Touch): number => {
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
  }, []);

  // 터치 시작 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || !isMobile) return;

    const touches = e.touches;
    
    if (touches.length === 1 && touches[0]) {
      // 단일 터치 - 드래그 시작
      const touch = touches[0];
      const position = { x: touch.clientX, y: touch.clientY };
      
      setTouchState(prev => ({
        ...prev,
        isDragging: true,
        startPosition: position
      }));
      
      touchStartRef.current = position;
      callbacks.onDragStart?.(touch.clientX, touch.clientY);
      
    } else if (touches.length === 2 && touches[0] && touches[1]) {
      // 두 손가락 터치 - 핀치/회전 시작
      const distance = getTouchDistance(touches[0], touches[1]);
      const angle = getTouchAngle(touches[0], touches[1]);
      
      setTouchState(prev => ({
        ...prev,
        isPinching: true,
        startDistance: distance,
        startAngle: angle
      }));
    }
  }, [enabled, isMobile, getTouchDistance, getTouchAngle, callbacks]);

  // 터치 이동 핸들러
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !isMobile) return;

    const touches = e.touches;

    if (touches.length === 1 && touches[0] && touchState.isDragging && touchStartRef.current) {
      // 단일 터치 - 팬/드래그
      const touch = touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      callbacks.onPan?.(deltaX, deltaY);
      callbacks.onDragMove?.(deltaX, deltaY);
      
    } else if (touches.length === 2 && touchState.isPinching && touches[0] && touches[1]) {
      // 두 손가락 터치 - 핀치/회전
      const currentDistance = getTouchDistance(touches[0], touches[1]);
      const currentAngle = getTouchAngle(touches[0], touches[1]);

      // 핀치 스케일 계산
      if (touchState.startDistance > 0) {
        const scale = currentDistance / touchState.startDistance;
        callbacks.onPinch?.(scale * sensitivity);
      }

      // 회전 각도 계산
      if (touchState.startAngle !== 0) {
        const angleDelta = currentAngle - touchState.startAngle;
        callbacks.onRotate?.(angleDelta * sensitivity);
      }
    }
  }, [enabled, isMobile, touchState, getTouchDistance, getTouchAngle, sensitivity, callbacks]);

  // 터치 종료 핸들러
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled || !isMobile) return;

    const touches = e.touches;

    if (touches.length === 0) {
      // 모든 터치 종료
      setTouchState(prev => ({
        ...prev,
        isPinching: false,
        isDragging: false,
        startPosition: null,
        startDistance: 0,
        startAngle: 0
      }));
      
      touchStartRef.current = null;
      callbacks.onDragEnd?.();
      
    } else if (touches.length === 1) {
      // 한 손가락만 남음
      setTouchState(prev => ({
        ...prev,
        isPinching: false
      }));
    }

    // 탭 감지
    if (e.changedTouches.length === 1 && e.changedTouches[0]) {
      const touch = e.changedTouches[0];
      const currentTime = Date.now();

      // 더블 탭 감지
      if (currentTime - touchState.lastTapTime < doubleTapDelay) {
        callbacks.onDoubleTap?.(touch.clientX, touch.clientY);
        setTouchState(prev => ({ ...prev, lastTapTime: 0 }));
      } else {
        callbacks.onTap?.(touch.clientX, touch.clientY);
        setTouchState(prev => ({ ...prev, lastTapTime: currentTime }));
      }
    }
  }, [enabled, isMobile, touchState.lastTapTime, doubleTapDelay, callbacks]);

  // 터치 이벤트 핸들러 객체 반환
  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };

  return {
    touchState,
    isMobile,
    touchHandlers,
    // 유틸리티 함수들
    getTouchDistance,
    getTouchAngle
  };
}
