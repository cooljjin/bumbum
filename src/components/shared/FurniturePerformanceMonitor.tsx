import React, { useState, useEffect, useRef } from 'react';
import { memoryManager } from '../../utils/memoryManager';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryUsagePercent: number;
  objectCount: number;
  visibleObjects: number;
  isLowMemory: boolean;
}

interface FurniturePerformanceMonitorProps {
  enabled?: boolean;
  showUI?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  scene?: any; // Three.js scene 객체
  gl?: any; // WebGL renderer 객체
}

export const FurniturePerformanceMonitor: React.FC<FurniturePerformanceMonitorProps> = ({
  enabled = true,
  showUI = false,
  onMetricsUpdate,
  scene,
  gl
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    memoryLimit: 0,
    memoryUsagePercent: 0,
    objectCount: 0,
    visibleObjects: 0,
    isLowMemory: false
  });

  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 }); // 기본 위치 (top-4 right-4)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const frameCount = React.useRef(0);
  const lastTime = React.useRef(performance.now());
  const renderStartTime = React.useRef(0);

  /**
   * 🎯 성능 모니터링 메인 루프 (useFrame 대신 setInterval 사용)
   */
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime.current;

      // 1초마다 메트릭 업데이트
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / deltaTime);
        const frameTime = renderStartTime.current ? currentTime - renderStartTime.current : 0;

        // 메모리 정보 가져오기 (메모리 관리자 사용)
        const memoryInfo = memoryManager.getMemoryUsage();
        const memoryUsage = memoryInfo?.memoryUsage || 0;
        const memoryLimit = memoryInfo?.memoryLimit || 0;
        const memoryUsagePercent = memoryInfo?.memoryUsagePercent || 0;
        const isLowMemory = memoryInfo?.isLowMemory || false;

        // 객체 개수 계산
        let objectCount = 0;
        let visibleObjects = 0;

        if (scene) {
          scene.traverse((object: any) => {
            objectCount++;
            if (object.visible) visibleObjects++;
          });
        }

        const newMetrics: PerformanceMetrics = {
          fps,
          frameTime: Math.round(frameTime),
          memoryUsage,
          memoryLimit,
          memoryUsagePercent: Math.round(memoryUsagePercent * 100) / 100,
          objectCount,
          visibleObjects,
          isLowMemory
        };

        setMetrics(newMetrics);
        onMetricsUpdate?.(newMetrics);

        // 메모리 사용량이 높을 때 자동 정리
        if (isLowMemory) {
          console.warn('⚠️ 메모리 사용량이 높습니다. 자동 정리를 시작합니다.');
          memoryManager.cleanupTemporaryResources();
        }

        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      frameCount.current++;
      renderStartTime.current = currentTime;
    }, 100); // 100ms마다 체크

    return () => clearInterval(interval);
  }, [enabled, scene, onMetricsUpdate]);

  // 드래그 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    if (panelRef.current && e.touches[0]) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // 화면 경계 내에서만 이동
    const maxX = window.innerWidth - 200; // 패널 너비 고려
    const maxY = window.innerHeight - 150; // 패널 높이 고려
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    
    if (e.touches[0]) {
      const newX = e.touches[0].clientX - dragOffset.x;
      const newY = e.touches[0].clientY - dragOffset.y;
      
      // 화면 경계 내에서만 이동
      const maxX = window.innerWidth - 200;
      const maxY = window.innerHeight - 150;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 마우스 및 터치 이벤트 리스너 등록/해제
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  if (!showUI) return null;

  return (
    <div 
      ref={panelRef}
      className={`fixed bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono z-devtools select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '180px',
        userSelect: 'none',
        pointerEvents: 'auto'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* 드래그 핸들 */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold">성능 모니터</span>
        </div>
        <div className="text-gray-400 text-xs">⋮⋮</div>
      </div>
      
      {/* 성능 지표 */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={metrics.fps < 30 ? 'text-red-400' : metrics.fps < 45 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.fps}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Frame Time:</span>
          <span className={metrics.frameTime > 33 ? 'text-red-400' : metrics.frameTime > 22 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.frameTime}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>Memory:</span>
          <span className={metrics.isLowMemory ? 'text-red-400' : 'text-blue-400'}>
            {metrics.memoryUsage}MB / {metrics.memoryLimit}MB
          </span>
        </div>
        <div className="flex justify-between">
          <span>Memory %:</span>
          <span className={metrics.memoryUsagePercent > 80 ? 'text-red-400' : metrics.memoryUsagePercent > 60 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.memoryUsagePercent}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>Objects:</span>
          <span className="text-purple-400">{metrics.objectCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Visible:</span>
          <span className="text-cyan-400">{metrics.visibleObjects}</span>
        </div>
      </div>
      
      {/* 드래그 안내 텍스트 */}
      <div className="mt-2 pt-2 border-t border-gray-600 text-gray-400 text-xs text-center">
        드래그하여 이동
      </div>
    </div>
  );
};

export default FurniturePerformanceMonitor;
