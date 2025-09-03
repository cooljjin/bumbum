'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useTouchControls, TouchCallbacks } from '../../../hooks/useTouchControls';

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

  // useTouchControls 훅을 사용하여 터치 로직 처리
  const { touchState, isMobile, touchHandlers } = useTouchControls({
    enabled,
    sensitivity,
    callbacks: {
      onPinch,
      onRotate,
      onPan,
      onTap,
      onDoubleTap
    } as TouchCallbacks
  });

  // 모바일이 아니거나 비활성화된 경우 렌더링하지 않음
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
      {...touchHandlers}
    >
      {/* 터치 피드백 오버레이 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          backgroundColor: touchState.isPinching ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
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
