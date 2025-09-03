'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3, Raycaster, Vector2, Plane } from 'three';
import { useEditorStore } from '../../../store/editorStore';
import { useTouchControls, TouchCallbacks } from '../../../hooks/useTouchControls';

interface EnhancedTouchControlsProps {
  enabled?: boolean;
  selectedItemId: string | null;
  onItemSelect: (id: string | null) => void;
  onItemUpdate: (id: string, updates: any) => void;
}

// Canvas 내부에서 사용할 터치 컨트롤 컴포넌트
export const EnhancedTouchControls: React.FC<EnhancedTouchControlsProps> = ({
  enabled = true,
  selectedItemId,
  onItemSelect,
  onItemUpdate
}) => {
  const { camera } = useThree();
  const { placedItems, setDragging } = useEditorStore();
  
  // 3D 환경 전용 터치 상태
  const [dragStartPosition, setDragStartPosition] = useState<Vector3 | null>(null);
  
  // Canvas 크기 가져오기
  const { size } = useThree();

  // 화면 좌표를 3D 좌표로 변환 (Canvas 크기 기준)
  const screenToWorld = useCallback((clientX: number, clientY: number, canvasWidth: number, canvasHeight: number): Vector3 | null => {
    const x = (clientX / canvasWidth) * 2 - 1;
    const y = -(clientY / canvasHeight) * 2 + 1;

    const mouse = new Vector2(x, y);
    const raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // 바닥 평면과의 교차점 계산
    const plane = new Plane(new Vector3(0, 1, 0), 0);
    const intersectionPoint = new Vector3();
    raycaster.ray.intersectPlane(plane, intersectionPoint);

    return intersectionPoint;
  }, [camera]);

  // 가구 선택 (레이캐스팅)
  const selectFurnitureAtPosition = useCallback((clientX: number, clientY: number, canvasWidth: number, canvasHeight: number) => {
    const x = (clientX / canvasWidth) * 2 - 1;
    const y = -(clientY / canvasHeight) * 2 + 1;

    const mouse = new Vector2(x, y);
    const raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // 모든 가구와의 교차점 확인
    let closestItem = null;
    let closestDistance = Infinity;

    placedItems.forEach(item => {
      // 간단한 바운딩 박스 교차 테스트
      const itemPos = new Vector3(item.position.x, item.position.y, item.position.z);
      const distance = raycaster.ray.distanceToPoint(itemPos);
      
      if (distance < closestDistance && distance < 2) { // 2미터 이내
        closestDistance = distance;
        closestItem = item;
      }
    });

    return closestItem;
  }, [camera, placedItems]);

  // 3D 환경 전용 터치 콜백 정의
  const touchCallbacks: TouchCallbacks = {
    onTap: useCallback((clientX: number, clientY: number) => {
      const worldPos = screenToWorld(clientX, clientY, size.width, size.height);
      if (worldPos) {
        const selectedItem = selectFurnitureAtPosition(clientX, clientY, size.width, size.height);
        if (selectedItem && 'id' in selectedItem) {
          onItemSelect((selectedItem as any).id);
        } else {
          onItemSelect(null);
        }
      }
    }, [screenToWorld, selectFurnitureAtPosition, onItemSelect, size.width, size.height]),

    onDoubleTap: useCallback((clientX: number, clientY: number) => {
      // 더블 탭으로 가구 선택 해제
      onItemSelect(null);
    }, [onItemSelect]),

    onDragStart: useCallback((clientX: number, clientY: number) => {
      const worldPos = screenToWorld(clientX, clientY, size.width, size.height);
      if (worldPos) {
        const selectedItem = selectFurnitureAtPosition(clientX, clientY, size.width, size.height);
        if (selectedItem && 'id' in selectedItem) {
          onItemSelect((selectedItem as any).id);
          setDragStartPosition(new Vector3(
            (selectedItem as any).position.x,
            (selectedItem as any).position.y,
            (selectedItem as any).position.z
          ));
          setDragging(true);
        }
      }
    }, [screenToWorld, selectFurnitureAtPosition, onItemSelect, size.width, size.height, setDragging]),

    onDragMove: useCallback((deltaX: number, deltaY: number) => {
      if (selectedItemId && dragStartPosition) {
        // 3D 공간에서의 드래그 이동 처리
        const newPosition = new Vector3(
          dragStartPosition.x + deltaX * 0.01, // 스케일 조정
          dragStartPosition.y,
          dragStartPosition.z + deltaY * 0.01
        );
        
        onItemUpdate(selectedItemId, { position: newPosition });
      }
    }, [selectedItemId, dragStartPosition, onItemUpdate]),

    onDragEnd: useCallback(() => {
      setDragStartPosition(null);
      setDragging(false);
    }, [setDragging])
  };

  // useTouchControls 훅을 사용하여 터치 로직 처리
  const { touchState, isMobile, touchHandlers } = useTouchControls({
    enabled,
    callbacks: touchCallbacks
  });

  // 모바일이 아니거나 비활성화된 경우 렌더링하지 않음
  if (!enabled || !isMobile) {
    return null;
  }

  // 3D 공간에서 터치 이벤트를 처리하는 투명한 평면
  return (
    <mesh
      position={[0, 0.01, 0]} // 바닥보다 약간 위에 배치
      rotation={[-Math.PI / 2, 0, 0]} // 바닥과 평행하게
      scale={[20, 20, 1]} // 충분히 큰 크기로 설정
      onPointerDown={(e) => {
        // Pointer 이벤트를 터치 이벤트로 변환하여 훅에서 처리
        const touchEvent = {
          touches: [{ clientX: e.clientX, clientY: e.clientY }],
          changedTouches: [],
          preventDefault: () => {},
          stopPropagation: () => e.stopPropagation()
        } as any;
        
        touchCallbacks.onDragStart?.(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (touchState.isDragging && selectedItemId && dragStartPosition) {
          const worldPos = screenToWorld(e.clientX, e.clientY, size.width, size.height);
          if (worldPos) {
            const newPosition = new Vector3(
              worldPos.x,
              dragStartPosition.y, // Y축은 유지
              worldPos.z
            );
            
            onItemUpdate(selectedItemId, { position: newPosition });
          }
        }
      }}
      onPointerUp={(e) => {
        touchCallbacks.onDragEnd?.();
      }}
      onPointerCancel={(e) => {
        touchCallbacks.onDragEnd?.();
      }}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

export default EnhancedTouchControls;
