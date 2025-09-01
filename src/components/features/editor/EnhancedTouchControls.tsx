'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3, Raycaster, Vector2, Plane } from 'three';
import { useEditorStore } from '../../../store/editorStore';

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
  
  // 터치 상태 관리
  const [touchState, setTouchState] = useState({
    isDragging: false,
    isPinching: false,
    startPosition: null as Vector2 | null,
    startDistance: 0,
    startAngle: 0,
    lastTapTime: 0,
    dragStartPosition: null as Vector3 | null
  });

  // 모바일 환경 감지
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

  // Canvas 크기 가져오기
  const { size } = useThree();

  // 터치 시작 핸들러 (Pointer 이벤트용)
  const handlePointerDown = useCallback((e: any) => {
    if (!enabled || !isMobile) return;

    // preventDefault는 호출하지 않음 (passive 경고 방지)
    e.stopPropagation();

    // Pointer 이벤트에서 터치 좌표 가져오기
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    
    const worldPos = screenToWorld(clientX, clientY, size.width, size.height);
    
    if (worldPos) {
      const selectedItem = selectFurnitureAtPosition(clientX, clientY, size.width, size.height);
      
      if (selectedItem && 'id' in selectedItem) {
        onItemSelect((selectedItem as any).id);
        setTouchState(prev => ({
          ...prev,
          isDragging: true,
          startPosition: new Vector2(clientX, clientY),
          dragStartPosition: new Vector3((selectedItem as any).position.x, (selectedItem as any).position.y, (selectedItem as any).position.z)
        }));
        // 전역 드래그 상태 on (스크롤락 트리거)
        setDragging(true);
      } else {
        onItemSelect(null);
      }
    }
  }, [enabled, isMobile, screenToWorld, selectFurnitureAtPosition, onItemSelect, size.width, size.height]);

  // 터치 이동 핸들러 (Pointer 이벤트용)
  const handlePointerMove = useCallback((e: any) => {
    if (!enabled || !isMobile) return;

    // preventDefault는 호출하지 않음 (passive 경고 방지)
    e.stopPropagation();

    if (touchState.isDragging && selectedItemId && touchState.dragStartPosition) {
      // 단일 터치 드래그 - 가구 이동
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const worldPos = screenToWorld(clientX, clientY, size.width, size.height);
      
      if (worldPos) {
        const newPosition = new Vector3(
          worldPos.x,
          touchState.dragStartPosition.y, // Y축은 유지
          worldPos.z
        );
        
        onItemUpdate(selectedItemId, { position: newPosition });
      }
    }
  }, [enabled, isMobile, touchState, selectedItemId, screenToWorld, onItemUpdate, size.width, size.height]);

  // 터치 종료 핸들러 (Pointer 이벤트용)
  const handlePointerUp = useCallback((e: any) => {
    if (!enabled || !isMobile) return;

    // preventDefault는 호출하지 않음 (passive 경고 방지)
    e.stopPropagation();

    // 모든 터치 종료
    setTouchState(prev => ({
      ...prev,
      isDragging: false,
      isPinching: false,
      startPosition: null,
      startDistance: 0,
      startAngle: 0,
      dragStartPosition: null
    }));
    // 전역 드래그 상태 off (스크롤락 해제)
    setDragging(false);

    // 탭 감지 (더블 탭으로 가구 선택 해제)
    const currentTime = Date.now();
    
    if (currentTime - touchState.lastTapTime < 300) {
      // 더블 탭
      onItemSelect(null);
      setTouchState(prev => ({ ...prev, lastTapTime: 0 }));
    } else {
      setTouchState(prev => ({ ...prev, lastTapTime: currentTime }));
    }
  }, [enabled, isMobile, touchState.lastTapTime, onItemSelect]);

  if (!enabled || !isMobile) {
    return null;
  }

  // 3D 공간에서 터치 이벤트를 처리하는 투명한 평면
  return (
    <mesh
      position={[0, 0.01, 0]} // 바닥보다 약간 위에 배치
      rotation={[-Math.PI / 2, 0, 0]} // 바닥과 평행하게
      scale={[20, 20, 1]} // 충분히 큰 크기로 설정
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

export default EnhancedTouchControls;
  // 주의: r3f Pointer 이벤트는 브라우저가 passive로 처리될 수 있음 → preventDefault 경고 발생 가능.
  // 이 컴포넌트에서는 포인터 핸들러에서 preventDefault를 호출하지 않습니다.
