import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import { Vector3, Euler, Group, Raycaster, Plane, Vector2 } from 'three';
import { useEditorStore } from '../../../store/editorStore';
import { PlacedItem } from '../../../types/editor';
import { createFallbackModel, createFurnitureModel } from '../../../utils/modelLoader';
import { getFurnitureFromPlacedItem } from '../../../data/furnitureCatalog';



interface DraggableFurnitureProps {
  item: PlacedItem;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<PlacedItem>) => void;
  onDelete: (id: string) => void;
}

export const DraggableFurniture: React.FC<DraggableFurnitureProps> = ({
  item,
  isSelected,
  isEditMode,
  onSelect,
  onUpdate
}) => {
  console.log('[DraggableFurniture] mounted', item?.id);

  const meshRef = useRef<Group>(null);
  const [model, setModel] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 🖱️ 드래그 앤 드롭 관련 상태 변수들
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<Vector3 | null>(null);
  const [dragStartMousePosition, setDragStartMousePosition] = useState<Vector2 | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 🎯 드래그 앤 드롭 관련 ref들
  const raycaster = useRef<Raycaster>(new Raycaster());
  const dragPlane = useRef<Plane>(new Plane(new Vector3(0, 1, 0), 0));

  const { grid, setDragging } = useEditorStore();
  const { camera } = useThree();

  // 3D 모델 메모리 정리 함수
  const disposeModel = useCallback((modelToDispose: Group | null) => {
    if (!modelToDispose) return;

    try {
      // 모든 자식 객체들을 재귀적으로 dispose
      const disposeObject = (obj: any) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat: any) => {
              if (mat.map) mat.map.dispose();
              if (mat.normalMap) mat.normalMap.dispose();
              if (mat.aoMap) mat.aoMap.dispose();
              if (mat.emissiveMap) mat.emissiveMap.dispose();
              if (mat.specularMap) mat.specularMap.dispose();
              mat.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            if (obj.material.normalMap) obj.material.normalMap.dispose();
            if (obj.material.aoMap) obj.material.aoMap.dispose();
            if (obj.material.emissiveMap) obj.material.emissiveMap.dispose();
            if (obj.material.specularMap) obj.material.specularMap.dispose();
            obj.material.dispose();
          }
        }

        // 자식 객체들도 재귀적으로 처리
        if (obj.children && obj.children.length > 0) {
          obj.children.forEach((child: any) => disposeObject(child));
        }
      };

      disposeObject(modelToDispose);
      console.log('🧹 3D 모델 메모리 정리 완료:', item.name);
    } catch (error) {
      console.warn('3D 모델 dispose 중 오류:', error);
    }
  }, [item.name]);

  // 🖱️ 드래그 시작 핸들러
  const handleDragStart = useCallback((event: any) => {
    if (!isEditMode || item.isLocked) return;

    event.stopPropagation();

    // 선택 상태로 만들기
    onSelect(item.id);

    setIsDragging(true);
    setDragStartPosition(item.position.clone());

    // 마우스 위치 저장
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    setDragStartMousePosition(new Vector2(mouseX, mouseY));

    // 전역 드래그 상태 업데이트
    setDragging(true);

    console.log('🖱️ 드래그 시작:', item.name);
  }, [isEditMode, item.isLocked, item.id, item.position, item.name, onSelect, setDragging]);

  // 🔄 드래그 중 핸들러
  const handleDrag = useCallback((event: any) => {
    if (!isDragging || !dragStartPosition || !dragStartMousePosition) return;

    event.stopPropagation();

    // 마우스 위치 계산
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // 레이캐스터로 3D 공간의 위치 계산
    raycaster.current.setFromCamera(new Vector2(mouseX, mouseY), camera);

    // 드래그 평면과의 교차점 계산
    const intersectionPoint = new Vector3();
    raycaster.current.ray.intersectPlane(dragPlane.current, intersectionPoint);

    // 그리드 스냅 적용
    const newPosition = intersectionPoint.clone();

    if (grid.enabled && grid.divisions > 0) {
      const gridSize = grid.size / grid.divisions;
      newPosition.x = Math.round(newPosition.x / gridSize) * gridSize;
      newPosition.z = Math.round(newPosition.z / gridSize) * gridSize;
    }

    // Y 위치는 원래 높이 유지
    newPosition.y = dragStartPosition.y;

    // 위치 업데이트
    onUpdate(item.id, { position: newPosition });

    console.log('🔄 드래그 중:', newPosition);
  }, [isDragging, dragStartPosition, dragStartMousePosition, camera, grid, item.id, onUpdate]);

  // ✅ 드래그 종료 핸들러
  const handleDragEnd = useCallback((event: any) => {
    if (!isDragging) return;

    event.stopPropagation();

    setIsDragging(false);
    setDragStartPosition(null);
    setDragStartMousePosition(null);

    // 전역 드래그 상태 업데이트
    setDragging(false);

    console.log('✅ 드래그 종료:', item.name);
  }, [isDragging, item.name, setDragging]);

  // 🖱️ 마우스 이벤트 핸들러
  const handleMouseDown = useCallback((event: any) => {
    if (event.button === 0) { // 좌클릭만
      handleDragStart(event);
    }
  }, [handleDragStart]);

  const handleMouseMove = useCallback((event: any) => {
    if (isDragging) {
      handleDrag(event);
    }
  }, [isDragging, handleDrag]);

  const handleMouseUp = useCallback((event: any) => {
    if (isDragging) {
      handleDragEnd(event);
    }
  }, [isDragging, handleDragEnd]);

  // 🎯 호버 효과
  const handlePointerEnter = useCallback(() => {
    if (isEditMode && !item.isLocked) {
      setIsHovered(true);
    }
  }, [isEditMode, item.isLocked]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // 전역 마우스 이벤트 리스너
  useEffect((): (() => void) | void => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 컴포넌트가 언마운트될 때 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // 클릭 이벤트 처리
  const handleClick = useCallback((event: any) => {
    event.stopPropagation();

    if (item.isLocked) {
      console.log('고정된 객체는 선택할 수 없습니다:', item.id);
      return;
    }

    if (isSelected) {
      onSelect(null);
      console.log('객체 선택 해제:', item.id);
    } else {
      onSelect(item.id);
      console.log('객체 선택:', item.id);
    }
  }, [isSelected, item.id, item.isLocked, onSelect]);

  // 모델 로딩
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const furniture = getFurnitureFromPlacedItem(item);
        if (!furniture) {
          console.warn('가구 정보를 찾을 수 없어 기본 박스로 표시합니다:', item);
          setLoadError('가구 정보를 찾을 수 없습니다');
          setIsLoading(false);
          return;
        }

        console.info(`가구 모델 생성: ${furniture.nameKo} (${furniture.category})`);
        const realModel = createFurnitureModel(furniture);
        setModel(realModel);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to create furniture model:', error);
        setLoadError(error instanceof Error ? error.message : 'Unknown error');

        const furniture = getFurnitureFromPlacedItem(item);
        if (furniture) {
          const fallbackModel = createFallbackModel(furniture);
          setModel(fallbackModel);
        }
        setIsLoading(false);
      }
    };

    loadModel();

    // 컴포넌트 언마운트 시 모델 정리
    return () => {
      if (model) {
        disposeModel(model);
      }
    };
  }, [item.id, disposeModel]);

  // 모델 변경 시 이전 모델 정리
  useEffect(() => {
    return () => {
      if (model) {
        disposeModel(model);
      }
    };
  }, [model, disposeModel]);

  // 위치, 회전, 크기 동기화
  useEffect(() => {
    if (!meshRef.current || item.isLocked) return;

    try {
      const currentPos = meshRef.current.position;
      const currentRot = meshRef.current.rotation;
      const currentScale = meshRef.current.scale;

      const itemPosition = new Vector3(item.position.x, item.position.y, item.position.z);
      const itemRotation = new Euler(item.rotation.x, item.rotation.y, item.rotation.z);
      const itemScale = new Vector3(item.scale.x, item.scale.y, item.scale.z);

      const TOLERANCE = 0.0001;

      const needsPositionUpdate = !currentPos.equals(itemPosition) &&
        Math.abs(currentPos.distanceTo(itemPosition)) > TOLERANCE;
      const needsRotationUpdate = !currentRot.equals(itemRotation) &&
        (Math.abs(currentRot.x - itemRotation.x) > TOLERANCE ||
         Math.abs(currentRot.y - itemRotation.y) > TOLERANCE ||
         Math.abs(currentRot.z - itemRotation.z) > TOLERANCE);
      const needsScaleUpdate = !currentScale.equals(itemScale) &&
        Math.abs(currentScale.distanceTo(itemScale)) > TOLERANCE;

      if (needsPositionUpdate) {
        meshRef.current.position.copy(itemPosition);
      }
      if (needsRotationUpdate) {
        meshRef.current.rotation.copy(itemRotation);
      }
      if (needsScaleUpdate) {
        meshRef.current.scale.copy(itemScale);
      }
    } catch (error) {
      console.warn('Position/Rotation/Scale sync failed:', error);
    }
  }, [item.id, item.isLocked, item.position, item.rotation, item.scale]);

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <group
        ref={meshRef}
        position={[item.position.x, item.position.y, item.position.z]}
        rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
        scale={[item.scale.x, item.scale.y, item.scale.z]}
      >
        <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
          <meshBasicMaterial color="#cccccc" transparent opacity={0.5} />
        </Box>
      </group>
    );
  }

  // 에러 상태 표시
  if (loadError && !model) {
    return (
      <group
        ref={meshRef}
        position={[item.position.x, item.position.y, item.position.z]}
        rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
        scale={[item.scale.x, item.scale.y, item.scale.z]}
      >
        <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
          <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
        </Box>
      </group>
    );
  }

  return (
    <>
      {/* 실제 오브젝트 그룹 - 드래그 앤 드롭 이벤트 활성화 */}
      <group
        ref={meshRef}
        position={[item.position.x, item.position.y, item.position.z]}
        rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
        scale={[item.scale.x, item.scale.y, item.scale.z]}
        onClick={handleClick}
        onPointerDown={handleMouseDown}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
        onPointerOver={handlePointerEnter}
        onPointerOut={handlePointerLeave}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* 3D 모델 */}
        {model && (
          <primitive
            object={model}
            onPointerDown={(e: any) => e.stopPropagation()}
            onPointerMove={(e: any) => e.stopPropagation()}
            onPointerUp={(e: any) => e.stopPropagation()}
            onPointerOver={(e: any) => e.stopPropagation()}
            onPointerOut={(e: any) => e.stopPropagation()}
            onWheel={(e: any) => e.stopPropagation()}
          />
        )}

        {/* 드래그 중일 때 시각적 피드백 */}
        {isDragging && (
          <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
            <meshBasicMaterial color="#00ff00" transparent opacity={0.3} />
          </Box>
        )}

        {/* 호버 효과 */}
        {isHovered && !isDragging && (
          <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
            <meshBasicMaterial color="#ffff00" transparent opacity={0.2} />
          </Box>
        )}

        {/* 선택 표시기 */}
        {isSelected && (
          <Box args={[item.footprint.width + 0.1, item.footprint.height + 0.1, item.footprint.depth + 0.1]}>
            <meshBasicMaterial color="#0066ff" transparent opacity={0.3} />
          </Box>
        )}

        {/* 고정 표시기 */}
        {item.isLocked && (
          <Box args={[item.footprint.width + 0.2, item.footprint.height + 0.2, item.footprint.depth + 0.2]}>
            <meshBasicMaterial color="#ffd700" transparent opacity={0.4} />
          </Box>
        )}
      </group>
    </>
  );
};

export default DraggableFurniture;
