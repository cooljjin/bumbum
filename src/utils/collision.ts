import { Vector3, Euler } from 'three';
import { PlacedItem, RoomBounds } from '../types/editor';
import { getRoomBoundaries } from './roomBoundary';

/**
 * AABB (Axis-Aligned Bounding Box) 타입
 * @description 3D 공간에서 축에 정렬된 경계 상자
 */
export interface AABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/**
 * Vector3의 유효성을 검증하는 함수
 * @param v 검증할 Vector3
 * @returns 유효한 Vector3인지 여부
 */
export function validateVector3(v: Vector3 | { x: number; y: number; z: number }): boolean {
  if (!v || typeof v !== 'object') return false;
  
  const { x, y, z } = v;
  return (
    typeof x === 'number' &&
    typeof y === 'number' &&
    typeof z === 'number' &&
    !isNaN(x) &&
    !isNaN(y) &&
    !isNaN(z) &&
    isFinite(x) &&
    isFinite(y) &&
    isFinite(z)
  );
}

/**
 * Vector3를 안전하게 정규화하는 함수
 * @param v 정규화할 Vector3
 * @param fallback NaN이나 무한대일 때 사용할 기본값
 * @returns 정규화된 Vector3 또는 fallback
 */
export function safeVector3(v: Vector3 | { x: number; y: number; z: number }, fallback: Vector3 = new Vector3(0, 0, 0)): Vector3 {
  if (!validateVector3(v)) {
    console.warn('⚠️ Vector3 유효성 검증 실패, fallback 사용:', v);
    return fallback.clone();
  }
  
  const { x, y, z } = v;
  return new Vector3(x, y, z);
}

/**
 * Euler의 유효성을 검증하는 함수
 * @param e 검증할 Euler
 * @returns 유효한 Euler인지 여부
 */
export function validateEuler(e: Euler | { x: number; y: number; z: number }): boolean {
  if (!e || typeof e !== 'object') return false;
  
  const { x, y, z } = e;
  return (
    typeof x === 'number' &&
    typeof y === 'number' &&
    typeof z === 'number' &&
    !isNaN(x) &&
    !isNaN(y) &&
    !isNaN(z) &&
    isFinite(x) &&
    isFinite(y) &&
    isFinite(z)
  );
}

/**
 * PlacedItem의 footprint으로부터 AABB를 계산하는 함수
 * @param footprint 가구의 발자국 정보
 * @param transform 변환 정보 (위치, 회전, 스케일)
 * @returns 계산된 AABB
 */
export function aabbFromFootprint(
  footprint: { width: number; depth: number; height: number },
  transform: {
    position: Vector3 | { x: number; y: number; z: number };
    rotation?: Euler | { x: number; y: number; z: number };
    scale?: Vector3 | { x: number; y: number; z: number };
  }
): AABB {
  // 입력 검증
  if (!footprint || typeof footprint !== 'object') {
    throw new Error('footprint은 유효한 객체여야 합니다.');
  }
  
  const { width, depth, height } = footprint;
  if (typeof width !== 'number' || typeof depth !== 'number' || typeof height !== 'number' ||
      isNaN(width) || isNaN(depth) || isNaN(height) ||
      width <= 0 || depth <= 0 || height <= 0) {
    throw new Error('footprint의 width, depth, height는 양수여야 합니다.');
  }
  
  // 안전한 변환 정보 추출
  const position = safeVector3(transform.position);
  const rotation = transform.rotation && validateEuler(transform.rotation) 
    ? new Euler(transform.rotation.x, transform.rotation.y, transform.rotation.z)
    : new Euler(0, 0, 0);
  const scale = transform.scale && validateVector3(transform.scale)
    ? safeVector3(transform.scale, new Vector3(1, 1, 1))
    : new Vector3(1, 1, 1);
  
  // 스케일 적용된 크기
  const scaledWidth = width * scale.x;
  const scaledDepth = depth * scale.z;
  const scaledHeight = height * scale.y;
  
  // 회전을 고려한 AABB 계산 (Y축 회전만 고려)
  const yaw = rotation.y;
  const cosYaw = Math.abs(Math.cos(yaw));
  const sinYaw = Math.abs(Math.sin(yaw));
  
  // 회전된 AABB의 반치수
  const halfX = (cosYaw * scaledWidth + sinYaw * scaledDepth) / 2;
  const halfZ = (sinYaw * scaledWidth + cosYaw * scaledDepth) / 2;
  const halfY = scaledHeight / 2;
  
  return {
    minX: position.x - halfX,
    maxX: position.x + halfX,
    minY: position.y,
    maxY: position.y + scaledHeight,
    minZ: position.z - halfZ,
    maxZ: position.z + halfZ
  };
}

/**
 * 두 AABB가 교차하는지 검사하는 함수
 * @param aabb1 첫 번째 AABB
 * @param aabb2 두 번째 AABB
 * @returns 교차 여부
 */
export function intersectsAABB(aabb1: AABB, aabb2: AABB): boolean {
  return (
    aabb1.minX <= aabb2.maxX &&
    aabb1.maxX >= aabb2.minX &&
    aabb1.minY <= aabb2.maxY &&
    aabb1.maxY >= aabb2.minY &&
    aabb1.minZ <= aabb2.maxZ &&
    aabb1.maxZ >= aabb2.minZ
  );
}

/**
 * AABB가 룸 경계와 교차하는지 검사하는 함수
 * @param aabb 검사할 AABB
 * @param roomBounds 룸 경계 정보
 * @returns 교차 여부
 */
export function intersectsRoomBounds(aabb: AABB, roomBounds: RoomBounds): boolean {
  const halfWidth = roomBounds.width / 2;
  const halfDepth = roomBounds.depth / 2;
  
  const roomAABB: AABB = {
    minX: -halfWidth + roomBounds.wallThickness,
    maxX: halfWidth - roomBounds.wallThickness,
    minY: 0,
    maxY: roomBounds.height - roomBounds.wallThickness,
    minZ: -halfDepth + roomBounds.wallThickness,
    maxZ: halfDepth - roomBounds.wallThickness
  };
  
  return intersectsAABB(aabb, roomAABB);
}

/**
 * AABB가 룸 경계 내부에 완전히 포함되는지 검사하는 함수
 * @param aabb 검사할 AABB
 * @param roomBounds 룸 경계 정보
 * @returns 포함 여부
 */
export function isAABBInsideRoom(aabb: AABB, roomBounds: RoomBounds): boolean {
  const halfWidth = roomBounds.width / 2;
  const halfDepth = roomBounds.depth / 2;
  
  const roomAABB: AABB = {
    minX: -halfWidth + roomBounds.wallThickness,
    maxX: halfWidth - roomBounds.wallThickness,
    minY: 0,
    maxY: roomBounds.height - roomBounds.wallThickness,
    minZ: -halfDepth + roomBounds.wallThickness,
    maxZ: halfDepth - roomBounds.wallThickness
  };
  
  return (
    aabb.minX >= roomAABB.minX &&
    aabb.maxX <= roomAABB.maxX &&
    aabb.minY >= roomAABB.minY &&
    aabb.maxY <= roomAABB.maxY &&
    aabb.minZ >= roomAABB.minZ &&
    aabb.maxZ <= roomAABB.maxZ
  );
}

/**
 * Vector3를 그리드에 스냅하는 함수
 * @param v 스냅할 Vector3
 * @param gridSize 그리드 크기 (기본값: 0.1)
 * @returns 스냅된 Vector3
 */
export function snapToGrid(v: Vector3 | { x: number; y: number; z: number }, gridSize: number = 0.1): Vector3 {
  if (!validateVector3(v)) {
    console.warn('⚠️ Vector3 유효성 검증 실패, 원본 반환:', v);
    return v instanceof Vector3 ? v.clone() : new Vector3(v.x, v.y, v.z);
  }
  
  if (typeof gridSize !== 'number' || isNaN(gridSize) || gridSize <= 0) {
    console.warn('⚠️ 유효하지 않은 gridSize, 기본값 0.1 사용:', gridSize);
    gridSize = 0.1;
  }
  
  const { x, y, z } = v;
  
  return new Vector3(
    Math.round(x / gridSize) * gridSize,
    Math.round(y / gridSize) * gridSize,
    Math.round(z / gridSize) * gridSize
  );
}

/**
 * 각도를 스냅하는 함수
 * @param angle 스냅할 각도 (라디안)
 * @param snapAngle 스냅 각도 (라디안, 기본값: π/4 = 45도)
 * @returns 스냅된 각도
 */
export function snapAngle(angle: number, snapAngle: number = Math.PI / 4): number {
  if (typeof angle !== 'number' || isNaN(angle) || !isFinite(angle)) {
    console.warn('⚠️ 유효하지 않은 angle, 0 반환:', angle);
    return 0;
  }
  
  if (typeof snapAngle !== 'number' || isNaN(snapAngle) || snapAngle <= 0) {
    console.warn('⚠️ 유효하지 않은 snapAngle, 기본값 π/4 사용:', snapAngle);
    snapAngle = Math.PI / 4;
  }
  
  return Math.round(angle / snapAngle) * snapAngle;
}

/**
 * PlacedItem이 룸 경계 내부에 있는지 검사하는 함수
 * @param item 검사할 PlacedItem
 * @param roomBounds 룸 경계 정보
 * @returns 룸 내부 여부
 */
export function isItemInRoom(item: PlacedItem, roomBounds: RoomBounds): boolean {
  try {
    const aabb = aabbFromFootprint(item.footprint, {
      position: item.position,
      rotation: item.rotation,
      scale: item.scale
    });
    
    return isAABBInsideRoom(aabb, roomBounds);
  } catch (error) {
    console.error('❌ isItemInRoom 검사 중 오류:', error);
    return false;
  }
}

/**
 * PlacedItem을 룸 경계 내부로 제한하는 함수
 * @param item 제한할 PlacedItem
 * @param roomBounds 룸 경계 정보
 * @returns 제한된 PlacedItem
 */
export function constrainItemToRoom(item: PlacedItem, roomBounds: RoomBounds): PlacedItem {
  try {
    const aabb = aabbFromFootprint(item.footprint, {
      position: item.position,
      rotation: item.rotation,
      scale: item.scale
    });
    
    const halfWidth = roomBounds.width / 2;
    const halfDepth = roomBounds.depth / 2;
    
    const roomAABB: AABB = {
      minX: -halfWidth + roomBounds.wallThickness,
      maxX: halfWidth - roomBounds.wallThickness,
      minY: 0,
      maxY: roomBounds.height - roomBounds.wallThickness,
      minZ: -halfDepth + roomBounds.wallThickness,
      maxZ: halfDepth - roomBounds.wallThickness
    };
    
    // AABB를 룸 경계 내부로 클램프
    const clampedAABB: AABB = {
      minX: Math.max(aabb.minX, roomAABB.minX),
      maxX: Math.min(aabb.maxX, roomAABB.maxX),
      minY: Math.max(aabb.minY, roomAABB.minY),
      maxY: Math.min(aabb.maxY, roomAABB.maxY),
      minZ: Math.max(aabb.minZ, roomAABB.minZ),
      maxZ: Math.min(aabb.maxZ, roomAABB.maxZ)
    };
    
    // 클램프된 AABB에서 새로운 위치 계산
    const newPosition = new Vector3(
      (clampedAABB.minX + clampedAABB.maxX) / 2,
      clampedAABB.minY,
      (clampedAABB.minZ + clampedAABB.maxZ) / 2
    );
    
    return {
      ...item,
      position: newPosition
    };
  } catch (error) {
    console.error('❌ constrainItemToRoom 처리 중 오류:', error);
    return item;
  }
}

/**
 * 두 PlacedItem이 충돌하는지 검사하는 함수
 * @param item1 첫 번째 PlacedItem
 * @param item2 두 번째 PlacedItem
 * @returns 충돌 여부
 */
export function itemsCollide(item1: PlacedItem, item2: PlacedItem): boolean {
  try {
    const aabb1 = aabbFromFootprint(item1.footprint, {
      position: item1.position,
      rotation: item1.rotation,
      scale: item1.scale
    });
    
    const aabb2 = aabbFromFootprint(item2.footprint, {
      position: item2.position,
      rotation: item2.rotation,
      scale: item2.scale
    });
    
    return intersectsAABB(aabb1, aabb2);
  } catch (error) {
    console.error('❌ itemsCollide 검사 중 오류:', error);
    return false;
  }
}

/**
 * PlacedItem을 안전하게 검증하고 정규화하는 함수
 * @param item 검증할 PlacedItem
 * @returns 검증된 PlacedItem
 */
export function validateAndNormalizeItem(item: PlacedItem): PlacedItem {
  try {
    // 기본 필드 검증
    if (!item || typeof item !== 'object') {
      throw new Error('item은 유효한 객체여야 합니다.');
    }
    
    if (!item.id || typeof item.id !== 'string') {
      throw new Error('id는 필수 문자열이어야 합니다.');
    }
    
    if (!item.name || typeof item.name !== 'string') {
      throw new Error('name은 필수 문자열이어야 합니다.');
    }
    
    if (!item.modelPath || typeof item.modelPath !== 'string') {
      throw new Error('modelPath는 필수 문자열이어야 합니다.');
    }
    
    // Vector3 및 Euler 검증 및 정규화
    const safePosition = safeVector3(item.position);
    const safeRotation = validateEuler(item.rotation) 
      ? new Euler(item.rotation.x, item.rotation.y, item.rotation.z)
      : new Euler(0, 0, 0);
    const safeScale = validateVector3(item.scale)
      ? safeVector3(item.scale, new Vector3(1, 1, 1))
      : new Vector3(1, 1, 1);
    
    // Footprint 검증
    if (!item.footprint || typeof item.footprint !== 'object') {
      throw new Error('footprint은 필수 객체여야 합니다.');
    }
    
    const { width, depth, height } = item.footprint;
    if (typeof width !== 'number' || typeof depth !== 'number' || typeof height !== 'number' ||
        isNaN(width) || isNaN(depth) || isNaN(height) ||
        width <= 0 || depth <= 0 || height <= 0) {
      throw new Error('footprint의 width, depth, height는 양수여야 합니다.');
    }
    
    return {
      ...item,
      position: safePosition,
      rotation: safeRotation,
      scale: safeScale,
      footprint: {
        width: Math.max(0.01, width), // 최소값 보장
        depth: Math.max(0.01, depth),
        height: Math.max(0.01, height)
      }
    };
  } catch (error) {
    console.error('❌ validateAndNormalizeItem 처리 중 오류:', error);
    throw error;
  }
}

/**
 * 현재 룸 경계를 RoomBounds 형태로 반환하는 함수
 * @returns 현재 룸 경계 정보
 */
export function getCurrentRoomBounds(): RoomBounds {
  const boundaries = getRoomBoundaries();
  const halfWidth = (boundaries.maxX - boundaries.minX) / 2;
  const halfDepth = (boundaries.maxZ - boundaries.minZ) / 2;
  
  return {
    width: halfWidth * 2,
    depth: halfDepth * 2,
    height: boundaries.maxY - boundaries.minY,
    wallThickness: 0.3 // roomBoundary.ts의 기본값과 일치
  };
}
