import { useCallback, useRef, useState, useEffect } from 'react';
import { Vector3, Euler, Group } from 'three';
import { useEditorStore } from '../store/editorStore';
import { PlacedItem } from '../types/editor';
import { safePosition, safeRotation, safeScale } from '../utils/safePosition';
import { constrainFurnitureToRoom, isFurnitureInRoom } from '../utils/roomBoundary';
import { checkDragCollision, moveToSafePosition } from '../utils/collisionDetection';
import { useFurnitureOptimization } from './useFurnitureOptimization';

/**
 * 가구 편집을 위한 공통 로직을 제공하는 커스텀 훅
 * DraggableFurniture와 EditableFurniture의 중복 코드를 제거
 */
export const useFurnitureEditing = (item: PlacedItem) => {
  const { grid, rotationSnap, snapStrength, mode, placedItems } = useEditorStore();
  const { shouldUpdate, vectorsEqual, eulersEqual } = useFurnitureOptimization();
  
  // 상태 관리
  const [isHovered, setIsHovered] = useState(false);
  const [isColliding, setIsColliding] = useState(false);
  const meshRef = useRef<Group>(null);
  const transformControlsRef = useRef<any>(null);
  
  /**
   * 그리드 스냅 함수
   */
  const snapToGrid = useCallback((value: number, snapSize: number = 0.25): number => {
    return Math.round(value / snapSize) * snapSize;
  }, []);

  /**
   * 위치 스냅
   */
  const snapPosition = useCallback((position: Vector3, snapSize: number = 0.25): Vector3 => {
    return new Vector3(
      snapToGrid(position.x, snapSize),
      position.y, // Y축은 바닥에 고정 (스냅하지 않음)
      snapToGrid(position.z, snapSize)
    );
  }, [snapToGrid]);

  /**
   * 회전 스냅
   */
  const snapRotation = useCallback((rotation: Euler, snapAngle: number = 15): Euler => {
    const snapAngleRad = (snapAngle * Math.PI) / 180;
    return new Euler(
      Math.round(rotation.x / snapAngleRad) * snapAngleRad,
      Math.round(rotation.y / snapAngleRad) * snapAngleRad,
      Math.round(rotation.z / snapAngleRad) * snapAngleRad
    );
  }, []);

  /**
   * 위치, 회전, 크기 동기화
   */
  const syncTransform = useCallback((item: PlacedItem) => {
    if (!meshRef.current || item.isLocked) return;

    try {
      const currentPos = meshRef.current.position;
      const currentRot = meshRef.current.rotation;
      const currentScale = meshRef.current.scale;

      const [x, y, z] = safePosition(item.position);
      const itemPosition = new Vector3(x, y, z);
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
      console.warn('Transform sync failed:', error);
    }
  }, []);

  /**
   * 충돌 감지 및 안전한 위치 계산
   */
  const checkAndResolveCollision = useCallback((
    testItem: PlacedItem,
    newPosition?: Vector3
  ): { hasCollision: boolean; safePosition: Vector3 } => {
    const otherItems = placedItems.filter(placedItem => placedItem.id !== item.id);
    
    let testPosition = newPosition || testItem.position;
    const collisionCheck = checkDragCollision(testItem, otherItems, testPosition);
    
    setIsColliding(collisionCheck.hasCollision);
    
    if (collisionCheck.hasCollision) {
      const safeItem = moveToSafePosition(testItem, otherItems);
      return { hasCollision: true, safePosition: safeItem.position };
    }
    
    return { hasCollision: false, safePosition: testPosition };
  }, [item.id, placedItems]);

  /**
   * 호버 이벤트 핸들러
   */
  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  /**
   * 클릭 이벤트 핸들러
   */
  const handleClick = useCallback((onSelect: (id: string | null) => void) => {
    // 고정된 객체는 선택할 수 없음
    if (item.isLocked) {
      return;
    }

    onSelect(item.id);
    setIsHovered(true);
  }, [item.id, item.isLocked]);

  /**
   * TransformControls 변경 이벤트 처리
   */
  const handleTransformChange = useCallback((
    onUpdate: (id: string, updates: Partial<PlacedItem>) => void
  ) => {
    if (!meshRef.current || !transformControlsRef.current) return;

    // 성능 최적화: 프레임 기반 스로틀링
    if (!shouldUpdate()) return;

    try {
      let currentPosition = meshRef.current.position.clone();
      let currentRotation = meshRef.current.rotation.clone();
      const currentScale = meshRef.current.scale.clone();

      // 그리드 스냅 적용 (편집 모드에서만)
      if (grid.enabled && mode === 'edit') {
        const cellSize = grid.size / grid.divisions;
        currentPosition = snapPosition(currentPosition, cellSize);
      }

      // 회전 스냅 적용 (편집 모드에서만)
      if (rotationSnap.enabled && mode === 'edit') {
        currentRotation = snapRotation(currentRotation, rotationSnap.angle);
      }

      // 벽 충돌 감지
      const tempItem = {
        ...item,
        position: currentPosition,
        rotation: currentRotation,
        scale: currentScale
      };

      // 방 경계 내에 있는지 확인
      if (!isFurnitureInRoom(tempItem)) {
        const constrainedItem = constrainFurnitureToRoom(tempItem);
        currentPosition = constrainedItem.position;
        
        if (meshRef.current) {
          meshRef.current.position.copy(currentPosition);
        }
      }

      // 충돌 감지 및 해결
      const collisionResult = checkAndResolveCollision(tempItem, currentPosition);
      if (collisionResult.hasCollision) {
        currentPosition = collisionResult.safePosition;
        if (meshRef.current) {
          meshRef.current.position.copy(currentPosition);
        }
      }

      // 현재 값과 이전 값을 비교하여 실제 변경된 경우에만 업데이트
      const [x, y, z] = safePosition(item.position);
      const itemPosition = new Vector3(x, y, z);
      const itemRotation = new Euler(item.rotation.x, item.rotation.y, item.rotation.z);
      const itemScale = new Vector3(item.scale.x, item.scale.y, item.scale.z);

      const TOLERANCE = 0.001;
      const positionChanged = !vectorsEqual(currentPosition, itemPosition, TOLERANCE);
      const rotationChanged = !eulersEqual(currentRotation, itemRotation, TOLERANCE);
      const scaleChanged = !vectorsEqual(currentScale, itemScale, TOLERANCE);

      if (positionChanged || rotationChanged || scaleChanged) {
        onUpdate(item.id, {
          position: currentPosition,
          rotation: currentRotation,
          scale: currentScale
        });
      }
    } catch (error) {
      console.warn('Transform update failed:', error);
    }
  }, [
    item,
    grid,
    rotationSnap,
    mode,
    snapPosition,
    snapRotation,
    shouldUpdate,
    vectorsEqual,
    eulersEqual,
    checkAndResolveCollision
  ]);

  /**
   * TransformControls 드래그 종료 처리
   */
  const handleTransformEnd = useCallback((
    onUpdate: (id: string, updates: Partial<PlacedItem>) => void
  ) => {
    if (item.isLocked) return;

    setIsHovered(true);

    // 자동 고정 설정 확인 - Hook 내부에서 호출
    const { autoLock, endDraggingItem, lockItem } = useEditorStore();

    if (autoLock.enabled) {
      setTimeout(() => {
        if (meshRef.current && !item.isLocked) {
          const currentPosition = meshRef.current.position.clone();
          const currentRotation = meshRef.current.rotation.clone();
          const currentScale = meshRef.current.scale.clone();

          onUpdate(item.id, {
            position: currentPosition,
            rotation: currentRotation,
            scale: currentScale
          });

          lockItem(item.id);
        }
      }, autoLock.delay);
    }

    // 드래그 락 해제
    try { endDraggingItem(item.id); } catch {}
  }, [item.id, item.isLocked]);

  /**
   * 3D 모델 메모리 정리
   */
  const disposeModel = useCallback((modelToDispose: Group | null) => {
    if (!modelToDispose) return;

    try {
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

        if (obj.children && obj.children.length > 0) {
          obj.children.forEach((child: any) => disposeObject(child));
        }
      };

      disposeObject(modelToDispose);
    } catch (error) {
      console.warn('Model dispose error:', error);
    }
  }, []);

  return {
    // 상태
    isHovered,
    isColliding,
    meshRef,
    transformControlsRef,
    
    // 상태 변경 함수
    setIsHovered,
    setIsColliding,
    
    // 함수
    syncTransform,
    snapPosition,
    snapRotation,
    checkAndResolveCollision,
    handlePointerEnter,
    handlePointerLeave,
    handleClick,
    handleTransformChange,
    handleTransformEnd,
    disposeModel
  };
};
