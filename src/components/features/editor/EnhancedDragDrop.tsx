'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Vector3, Euler } from 'three';
import { useEditorStore } from '../../../store/editorStore';

interface EnhancedDragDropProps {
  children: React.ReactNode;
  onDrop?: (position: Vector3, rotation: Euler, scale: Vector3) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  snapToGrid?: boolean;
  gridSize?: number;
  showDropZones?: boolean;
}

interface DragState {
  isDragging: boolean;
  startPosition: Vector3;
  currentPosition: Vector3;
  dragOffset: Vector3;
  isValidDrop: boolean;
}

export const EnhancedDragDrop: React.FC<EnhancedDragDropProps> = ({
  children,
  onDrop,
  onDragStart,
  onDragEnd,
  snapToGrid = true,
  gridSize = 1,
  showDropZones = true
}) => {
  const { tool, mode, grid } = useEditorStore();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: new Vector3(),
    currentPosition: new Vector3(),
    dragOffset: new Vector3(),
    isValidDrop: true
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);

  // 그리드 스냅 계산
  const snapToGridPosition = useCallback((position: Vector3): Vector3 => {
    if (!snapToGrid || !grid.enabled) return position;

    const snappedPosition = new Vector3();
    snappedPosition.x = Math.round(position.x / gridSize) * gridSize;
    snappedPosition.y = Math.round(position.y / gridSize) * gridSize;
    snappedPosition.z = Math.round(position.z / gridSize) * gridSize;

    return snappedPosition;
  }, [snapToGrid, grid.enabled, gridSize]);

  // 드래그 시작 처리
  const handleDragStart = useCallback((event: React.DragEvent) => {
    if (mode !== 'edit') return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startPos = new Vector3(
      (event.clientX - rect.left) / rect.width * 20 - 10,
      0,
      (event.clientY - rect.top) / rect.height * 20 - 10
    );

    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startPosition: startPos.clone(),
      currentPosition: startPos.clone(),
      dragOffset: new Vector3()
    }));

    onDragStart?.();

    // 드래그 이미지 설정
    if (event.dataTransfer.setDragImage) {
      const dragImage = document.createElement('div');
      dragImage.className = 'w-8 h-8 bg-blue-500 rounded-full opacity-50';
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 16, 16);
      
      // 드래그 이미지 정리
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }

    // console.log('🚀 드래그 시작:', { startPos, tool });
  }, [mode, onDragStart, tool]);

  // 드래그 중 처리
  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (!dragState.isDragging) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentPos = new Vector3(
      (event.clientX - rect.left) / rect.width * 20 - 10,
      0,
      (event.clientY - rect.top) / rect.height * 20 - 10
    );

    // 그리드 스냅 적용
    const snappedPos = snapToGridPosition(currentPos);
    
    setDragState(prev => ({
      ...prev,
      currentPosition: snappedPos,
      dragOffset: snappedPos.clone().sub(prev.startPosition)
    }));

    // 드래그 프리뷰 업데이트
    if (dragPreviewRef.current) {
      dragPreviewRef.current.style.transform = `translate3d(${event.clientX - rect.left}px, ${event.clientY - rect.top}px, 0)`;
    }
  }, [dragState.isDragging, snapToGridPosition]);

  // 드롭 처리
  const handleDrop = useCallback((event: React.DragEvent) => {
    if (!dragState.isDragging) return;

    event.preventDefault();
    
    const dropPosition = dragState.currentPosition.clone();
    const dropRotation = new Euler(0, 0, 0);
    const dropScale = new Vector3(1, 1, 1);

    // 드롭 위치 유효성 검사
    const isValidDrop = dropPosition.length() < 15; // 경계 내부인지 확인
    
    if (isValidDrop && onDrop) {
      onDrop(dropPosition, dropRotation, dropScale);
      // console.log('✅ 드롭 완료:', { position: dropPosition, rotation: dropRotation, scale: dropScale });
    } else {
      // console.log('❌ 드롭 실패: 유효하지 않은 위치');
    }

    // 드래그 상태 초기화
    setDragState({
      isDragging: false,
      startPosition: new Vector3(),
      currentPosition: new Vector3(),
      dragOffset: new Vector3(),
      isValidDrop: true
    });

    onDragEnd?.();
  }, [dragState, onDrop, onDragEnd]);

  // 드래그 종료 처리
  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      startPosition: new Vector3(),
      currentPosition: new Vector3(),
      dragOffset: new Vector3(),
      isValidDrop: true
    });

    onDragEnd?.();
    // console.log('🛑 드래그 종료');
  }, [onDragEnd]);

  // 드래그 프리뷰 렌더링
  const renderDragPreview = () => {
    if (!dragState.isDragging) return null;

    return (
      <div
        ref={dragPreviewRef}
        className="fixed pointer-events-none z-hud transition-transform duration-100"
        style={{
          left: 0,
          top: 0
        }}
      >
        <div className="w-16 h-16 bg-blue-500 rounded-full opacity-70 flex items-center justify-center">
          <span className="text-white text-lg font-bold">
            {tool === 'translate' ? '➡️' : tool === 'rotate' ? '🔄' : tool === 'scale' ? '📏' : '🖱️'}
          </span>
        </div>
      </div>
    );
  };

  // 드롭 영역 표시
  const renderDropZones = () => {
    if (!showDropZones || !dragState.isDragging) return null;

    const zones = [];
    const zoneSize = 2;

    // 그리드 기반 드롭 영역 생성
    for (let x = -10; x <= 10; x += zoneSize) {
      for (let z = -10; z <= 10; z += zoneSize) {
        const isSnapZone = snapToGrid && grid.enabled;
        const isCurrentZone = Math.abs(x - dragState.currentPosition.x) < zoneSize/2 && 
                             Math.abs(z - dragState.currentPosition.z) < zoneSize/2;

        if (isSnapZone || isCurrentZone) {
          zones.push(
            <div
              key={`zone-${x}-${z}`}
              className={`absolute w-2 h-2 rounded-full transition-all duration-200 ${
                isCurrentZone 
                  ? 'bg-green-500 scale-150 shadow-lg' 
                  : 'bg-gray-300 opacity-30'
              }`}
              style={{
                left: `${(x + 10) * 5}%`,
                top: `${(z + 10) * 5}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          );
        }
      }
    }

    return zones;
  };

  // 드래그 가이드 라인
  const renderDragGuides = () => {
    if (!dragState.isDragging) return null;

    const startPos = dragState.startPosition;
    const currentPos = dragState.currentPosition;

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-overlay"
        style={{ left: 0, top: 0 }}
      >
        {/* 시작점 표시 */}
        <circle
          cx={`${(startPos.x + 10) * 5}%`}
          cy={`${(startPos.z + 10) * 5}%`}
          r="4"
          fill="blue"
          opacity="0.7"
        />
        
        {/* 현재 위치 표시 */}
        <circle
          cx={`${(currentPos.x + 10) * 5}%`}
          cy={`${(currentPos.z + 10) * 5}%`}
          r="4"
          fill="green"
          opacity="0.7"
        />
        
        {/* 드래그 경로 */}
        <line
          x1={`${(startPos.x + 10) * 5}%`}
          y1={`${(startPos.z + 10) * 5}%`}
          x2={`${(currentPos.x + 10) * 5}%`}
          y2={`${(currentPos.z + 10) * 5}%`}
          stroke="blue"
          strokeWidth="2"
          opacity="0.5"
          strokeDasharray="5,5"
        />
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      {/* 드래그 가이드 */}
      {renderDragGuides()}
      
      {/* 드롭 영역 */}
      {renderDropZones()}
      
      {/* 드래그 프리뷰 */}
      {renderDragPreview()}
      
      {/* 드래그 상태 표시 */}
      {dragState.isDragging && (
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg z-hud">
          <div className="flex items-center gap-2">
            <span className="text-sm">🚀</span>
            <span className="text-sm font-medium">
              {tool === 'translate' ? '이동 중' : tool === 'rotate' ? '회전 중' : tool === 'scale' ? '크기 조절 중' : '선택 중'}
            </span>
          </div>
          <div className="text-xs mt-1 opacity-80">
            위치: ({dragState.currentPosition.x.toFixed(1)}, {dragState.currentPosition.z.toFixed(1)})
          </div>
        </div>
      )}
      
      {/* 자식 컴포넌트 */}
      {children}
    </div>
  );
};

export default EnhancedDragDrop;
