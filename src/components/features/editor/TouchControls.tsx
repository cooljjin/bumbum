'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TouchControlsProps {
  enabled?: boolean;
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  sensitivity?: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  enabled = true,
  onPinch,
  onRotate,
  onPan,
  onTap,
  onDoubleTap,
  sensitivity = 1.0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPinching, setIsPinching] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [touchStartDistance, setTouchStartDistance] = useState(0);
  const [touchStartAngle, setTouchStartAngle] = useState(0);

  // 터치 포인트 간 거리 계산
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 터치 포인트 간 각도 계산
  const getTouchAngle = (touch1: Touch, touch2: Touch): number => {
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
  };

  // 터치 이벤트 핸들러들
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enabled) return;

    const touches = e.touches;
    if (touches.length === 2 && touches[0] && touches[1]) {
      // 핀치/회전 시작
      setIsPinching(true);
      const distance = getTouchDistance(touches[0] as Touch, touches[1] as Touch);
      const angle = getTouchAngle(touches[0] as Touch, touches[1] as Touch);
      setTouchStartDistance(distance);
      setTouchStartAngle(angle);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enabled) return;

    const touches = e.touches;

    if (touches.length === 1 && touches[0]) {
      // 단일 터치 - 팬
      const touch = touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        onPan?.(x, y);
      }
    } else if (touches.length === 2 && isPinching && touches[0] && touches[1]) {
      // 두 손가락 터치 - 핀치/회전
      const currentDistance = getTouchDistance(touches[0] as Touch, touches[1] as Touch);
      const currentAngle = getTouchAngle(touches[0] as Touch, touches[1] as Touch);

      // 핀치 스케일 계산
      if (touchStartDistance > 0) {
        const scale = currentDistance / touchStartDistance;
        onPinch?.(scale * sensitivity);
      }

      // 회전 각도 계산
      if (touchStartAngle !== 0) {
        const angleDelta = currentAngle - touchStartAngle;
        onRotate?.(angleDelta * sensitivity);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!enabled) return;

    const touches = e.touches;

    if (touches.length === 0) {
      // 모든 터치 종료
      setIsPinching(false);
      setTouchStartDistance(0);
      setTouchStartAngle(0);
    } else if (touches.length === 1) {
      // 한 손가락만 남음
      setIsPinching(false);
    }

    // 탭 감지
    if (e.changedTouches.length === 1 && e.changedTouches[0]) {
      const touch = e.changedTouches[0];
      const rect = containerRef.current?.getBoundingClientRect();

      if (rect) {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const currentTime = Date.now();

        // 더블 탭 감지
        if (currentTime - lastTapTime < 300) {
          onDoubleTap?.(x, y);
          setLastTapTime(0);
        } else {
          onTap?.(x, y);
          setLastTapTime(currentTime);
        }
      }
    }
  };

  // 모바일 기기 감지
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(navigator.userAgent) || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!enabled || !isMobile) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none"
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 터치 피드백 오버레이 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          backgroundColor: isPinching ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
        }}
        transition={{ duration: 0.2 }}
      />

      {/* 터치 힌트 */}
      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <span>👆</span>
          <span>두 손가락으로 확대/축소 및 회전</span>
        </div>
      </motion.div>
    </div>
  );
};

export default TouchControls;
