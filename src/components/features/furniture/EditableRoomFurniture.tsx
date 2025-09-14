import React, { useRef, useEffect } from 'react';

import { TransformControls, Box } from '@react-three/drei';
import { Vector3, Euler, Group } from 'three';
import { useEditorStore } from '../../../store/editorStore';
import { PlacedItem } from '../../../types/editor';
import { safePosition, safeRotation, safeScale } from '../../../utils/safePosition';
import { constrainFurnitureToRoom, isFurnitureInRoom } from '../../../utils/roomBoundary';
import { getMobileHtmlStyle } from '../../../utils/mobileHtmlConstraints';
import * as THREE from 'three';
import { useScreenAnchor } from '../../../hooks/useScreenAnchor';
import { FloatingLayerFUI } from '../../shared/FloatingLayerFUI';
import { useViewportClamp } from '../../../hooks/useViewportClamp';

interface EditableRoomFurnitureProps {
  item: PlacedItem;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<PlacedItem>) => void;
  onDelete: () => void;
  children: React.ReactNode; // 기존 가구의 3D 메시들
}

export const EditableRoomFurniture: React.FC<EditableRoomFurnitureProps> = ({
  item,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  children
}) => {
  const groupRef = useRef<Group>(null);
  const transformControlsRef = useRef<any>(null);

  const { mode, tool, grid, rotationSnap } = useEditorStore();


  // TransformControls 스냅 설정 적용
  useEffect(() => {
    if (transformControlsRef.current && isSelected && mode === 'edit') {
      // 그리드 스냅 설정
      if (grid.enabled) {
        const cellSize = grid.size / grid.divisions;
        transformControlsRef.current.setTranslationSnap(cellSize);
        // console.log(`Room furniture grid snap enabled: ${cellSize}m`);
      } else {
        transformControlsRef.current.setTranslationSnap(null);
        // console.log('Room furniture grid snap disabled');
      }

      // 회전 스냅 설정
      if (rotationSnap.enabled) {
        const snapAngle = (rotationSnap.angle * Math.PI) / 180; // 도를 라디안으로 변환
        transformControlsRef.current.setRotationSnap(snapAngle);
        // console.log(`Room furniture rotation snap enabled: ${rotationSnap.angle}°`);
      } else {
        transformControlsRef.current.setRotationSnap(null);
        // console.log('Room furniture rotation snap disabled');
      }
    }
  }, [isSelected, mode, grid.enabled, grid.size, grid.divisions, rotationSnap.enabled, rotationSnap.angle]);

  // TransformControls 변경 이벤트 처리 - 벽 충돌 감지 포함
  const handleTransformChange = () => {
    if (groupRef.current) {
      try {
        let newPosition = new Vector3(
          groupRef.current.position.x,
          groupRef.current.position.y,
          groupRef.current.position.z
        );
        const newRotation = new Euler(
          groupRef.current.rotation.x,
          groupRef.current.rotation.y,
          groupRef.current.rotation.z
        );
        const newScale = new Vector3(
          groupRef.current.scale.x,
          groupRef.current.scale.y,
          groupRef.current.scale.z
        );

        // 🔥 벽 충돌 감지 추가
        const tempItem = {
          ...item,
          position: newPosition,
          rotation: newRotation,
          scale: newScale
        };

        // 방 경계 내에 있는지 확인
        if (!isFurnitureInRoom(tempItem)) {
          // 방 밖에 있으면 제한된 위치로 이동
          const constrainedItem = constrainFurnitureToRoom(tempItem);
          newPosition = constrainedItem.position;
          
          // TransformControls의 위치도 즉시 업데이트
          if (groupRef.current) {
            groupRef.current.position.copy(newPosition);
          }
          
          // console.log('🚫 Room Furniture TransformControls: 벽 충돌 감지, 위치 제한:', newPosition);
        }

        onUpdate({
          position: newPosition,
          rotation: newRotation,
          scale: newScale
        });
      } catch (error) {
        // console.warn('Room furniture transform update failed:', error);
      }
    }
  };

  // 클릭 이벤트 처리
  const handleClick = (event: any) => {
    // event.stopPropagation(); // 이벤트 전파 허용
    onSelect();
  };

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSelected) return;

      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          onDelete();
          break;
        case 'Escape':
          event.preventDefault();
          onSelect(); // 선택 해제
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, onDelete, onSelect]);

  // 바운딩 박스 렌더링
  const renderBoundingBox = () => {
    if (!isSelected || !item.footprint) return null;

    return (
      <Box
        args={[item.footprint.width, item.footprint.height, item.footprint.depth]}
        position={[0, item.footprint.height / 2, 0]}
        visible={true}
      >
        <meshBasicMaterial
          color="#00ff00"
          wireframe={true}
          transparent={true}
          opacity={0.5}
        />
      </Box>
    );
  };

  // 가구 이름을 한글로 변환하는 함수
  const getFurnitureName = (name: string) => {
    const nameMap: { [key: string]: string } = {
      'coffee_table': '커피 테이블',
      'main_table': '메인 테이블',
      'chair': '의자',
      'bed': '침대',
      'sofa': '소파',
      'lamp': '램프',
      'plant': '화분',
      'bookshelf': '책장',
      'cabinet': '수납장',
      'mirror': '거울'
    };
    return nameMap[name] || name;
  };

  // 카테고리를 한글로 변환하는 함수
  const getCategoryName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'table': '테이블',
      'chair': '의자',
      'bed': '침대',
      'sofa': '소파',
      'lighting': '조명',
      'decoration': '장식',
      'storage': '수납'
    };
    return categoryMap[category] || category;
  };

  // Overlay clamp for mobile: keep label inside viewport
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const { style: overlayClampStyle } = useViewportClamp(overlayRef, {
    margin: 12,
    includeSafeAreas: true,
    includeOcclusions: true,
    enabled: true,
  });
  const overlayStyle = { ...getMobileHtmlStyle(200), ...overlayClampStyle } as React.CSSProperties;

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      position={safePosition(item.position)}
      rotation={safeRotation(item.rotation)}
      scale={safeScale(item.scale)}
    >
      {/* 기존 가구의 3D 메시들 */}
      {children}

      {/* 바운딩 박스 */}
      {renderBoundingBox()}

      {/* 가구 정보 오버레이 - 편집모드에서만 표시 */}
      {mode === 'edit' && (() => {
        const anchor = useScreenAnchor(() => {
          if (!groupRef.current) return null;
          const wp = new THREE.Vector3();
          groupRef.current.getWorldPosition(wp);
          const h = item.footprint?.height || 0;
          wp.y += h + 0.5;
          return wp;
        });
        if (!anchor) return null;
        return (
          <FloatingLayerFUI anchor={anchor} placement="top" offset={10} zClass="z-floating">
            <div ref={overlayRef} style={overlayStyle} className={`
            px-3 py-2 rounded-lg font-medium text-sm shadow-lg border-2
            ${isSelected
              ? 'bg-blue-600 text-white border-blue-700'
              : 'bg-white/90 text-gray-800 border-gray-300'
            }
            backdrop-blur-sm
            max-w-[200px]
            break-words
            mobile-text-constraint
          `}>
              <div className="text-center">
                <div className="font-bold">
                  {getFurnitureName(item.name)}
                </div>
                {item.metadata?.category && (
                  <div className="text-xs opacity-80">
                    {getCategoryName(item.metadata.category)}
                  </div>
                )}
              </div>
            </div>
          </FloatingLayerFUI>
        );
      })()}

      {/* TransformControls */}
      {isSelected && mode === 'edit' && (
        <TransformControls
          ref={transformControlsRef}
          object={groupRef.current!}
          mode={tool === 'rotate' ? 'rotate' : tool === 'scale' ? 'scale' : 'translate'}
          onObjectChange={handleTransformChange}
          size={0.75}
          showX={true}
          showY={true}
          showZ={true}
        />
      )}
    </group>
  );
};

export default EditableRoomFurniture;
