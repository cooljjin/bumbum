import { PlacedItem } from '../types/editor';
import { Vector3 } from 'three';
import { getRoomBoundaries, constrainFurnitureToRoom, isFurnitureInRoom } from './roomBoundary';

/**
 * 가구의 바운딩 박스를 계산합니다
 */
export const getFurnitureBoundingBox = (item: PlacedItem) => {
  const safetyMargin = 0.1; // 안전 마진
  
  // 회전을 고려한 실제 크기 계산
  const baseHalfW = (item.footprint.width * item.scale.x) / 2;
  const baseHalfD = (item.footprint.depth * item.scale.z) / 2;
  const yaw = item.rotation?.y ?? 0;
  const c = Math.abs(Math.cos(yaw));
  const s = Math.abs(Math.sin(yaw));
  const halfX = c * baseHalfW + s * baseHalfD + safetyMargin;
  const halfZ = s * baseHalfW + c * baseHalfD + safetyMargin;
  const halfY = (item.footprint.height * item.scale.y) / 2 + safetyMargin;

  return {
    minX: item.position.x - halfX,
    maxX: item.position.x + halfX,
    minY: item.position.y - halfY,
    maxY: item.position.y + halfY,
    minZ: item.position.z - halfZ,
    maxZ: item.position.z + halfZ,
    center: new Vector3(item.position.x, item.position.y, item.position.z),
    size: new Vector3(halfX * 2, halfY * 2, halfZ * 2)
  };
};

/**
 * 두 가구가 충돌하는지 확인합니다
 */
export const checkFurnitureCollision = (item1: PlacedItem, item2: PlacedItem): boolean => {
  const box1 = getFurnitureBoundingBox(item1);
  const box2 = getFurnitureBoundingBox(item2);

  // AABB (Axis-Aligned Bounding Box) 충돌 검사
  const collision = (
    box1.minX < box2.maxX &&
    box1.maxX > box2.minX &&
    box1.minY < box2.maxY &&
    box1.maxY > box2.minY &&
    box1.minZ < box2.maxZ &&
    box1.maxZ > box2.minZ
  );

  if (collision) {
    // console.log(`🚨 가구 충돌 감지: ${item1.name || item1.id} ↔ ${item2.name || item2.id}`);
    // console.log(`   ${item1.name || item1.id}: (${box1.minX.toFixed(2)}, ${box1.minZ.toFixed(2)}) ~ (${box1.maxX.toFixed(2)}, ${box1.maxZ.toFixed(2)})`);
    // console.log(`   ${item2.name || item2.id}: (${box2.minX.toFixed(2)}, ${box2.minZ.toFixed(2)}) ~ (${box2.maxX.toFixed(2)}, ${box2.maxZ.toFixed(2)})`);
  }

  return collision;
};

/**
 * 특정 가구가 다른 가구들과 충돌하는지 확인합니다
 */
export const checkCollisionWithOthers = (
  targetItem: PlacedItem, 
  allItems: PlacedItem[], 
  excludeId?: string
): { hasCollision: boolean; collidingItems: PlacedItem[] } => {
  const collidingItems: PlacedItem[] = [];
  
  for (const item of allItems) {
    // 자기 자신은 제외
    if (item.id === targetItem.id || item.id === excludeId) {
      continue;
    }
    
    if (checkFurnitureCollision(targetItem, item)) {
      collidingItems.push(item);
    }
  }
  
  return {
    hasCollision: collidingItems.length > 0,
    collidingItems
  };
};

/**
 * 충돌을 피할 수 있는 가장 가까운 위치를 찾습니다
 */
export const findNonCollidingPosition = (
  targetItem: PlacedItem,
  allItems: PlacedItem[],
  maxAttempts: number = 50
): Vector3 | null => {
  const originalPosition = new Vector3(targetItem.position.x, targetItem.position.y, targetItem.position.z);
  const stepSize = 0.5; // 이동 단위
  const maxDistance = 5.0; // 최대 이동 거리
  
  // 원래 위치를 경계 내로 보정한 뒤 충돌 확인
  const constrainedOriginal = constrainFurnitureToRoom(targetItem);
  const originalCollision = checkCollisionWithOthers(constrainedOriginal, allItems, constrainedOriginal.id);
  if (!originalCollision.hasCollision && isFurnitureInRoom(constrainedOriginal)) {
    return constrainedOriginal.position.clone();
  }
  
  // 스파이럴 패턴으로 충돌하지 않는 위치 탐색
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const angle = (attempt * 0.5) % (Math.PI * 2);
    const radius = Math.min(attempt * stepSize, maxDistance);
    
    const testPosition = new Vector3(
      originalPosition.x + Math.cos(angle) * radius,
      originalPosition.y,
      originalPosition.z + Math.sin(angle) * radius
    );
    
    let testItem: PlacedItem = {
      ...targetItem,
      position: testPosition
    } as PlacedItem;
    // 방 경계 내로 먼저 보정
    testItem = constrainFurnitureToRoom(testItem);
    
    const collision = checkCollisionWithOthers(testItem, allItems, targetItem.id);
    if (!collision.hasCollision && isFurnitureInRoom(testItem)) {
      // console.log(`✅ 충돌 없는 위치 발견: (${testPosition.x.toFixed(2)}, ${testPosition.y.toFixed(2)}, ${testPosition.z.toFixed(2)}) - ${attempt}번째 시도`);
      return testItem.position.clone();
    }
  }
  
  console.warn(`⚠️ 충돌 없는 위치를 찾지 못했습니다 (${maxAttempts}번 시도)`);
  return null;
};

/**
 * 가구를 안전한 위치로 이동시킵니다
 */
export const moveToSafePosition = (
  targetItem: PlacedItem,
  allItems: PlacedItem[]
): PlacedItem => {
  const safePosition = findNonCollidingPosition(targetItem, allItems);
  
  if (safePosition) {
    const item = {
      ...targetItem,
      position: safePosition
    } as PlacedItem;
    // 반환 전 방 경계 보정으로 일관성 유지
    return constrainFurnitureToRoom(item);
  }
  
  // 안전한 위치를 찾지 못한 경우 원래 위치 반환
  console.warn(`⚠️ ${targetItem.name || targetItem.id}의 안전한 위치를 찾지 못했습니다`);
  return targetItem;
};

/**
 * 드래그 중 실시간 충돌 감지
 */
export const checkDragCollision = (
  draggedItem: PlacedItem,
  allItems: PlacedItem[],
  newPosition: Vector3
): { hasCollision: boolean; collidingItems: PlacedItem[] } => {
  const testItem = {
    ...draggedItem,
    position: newPosition
  };
  
  return checkCollisionWithOthers(testItem, allItems, draggedItem.id);
};

// ================== 벽 부착 전용 오버랩 검사 ==================

const wallHalfExtentAlongU = (item: PlacedItem, side: 'minX'|'maxX'|'minZ'|'maxZ') => {
  const baseHalfW = (item.footprint.width * item.scale.x) / 2;
  const baseHalfD = (item.footprint.depth * item.scale.z) / 2;
  const yaw = item.rotation?.y ?? 0;
  const c = Math.abs(Math.cos(yaw));
  const s = Math.abs(Math.sin(yaw));
  const halfX = c * baseHalfW + s * baseHalfD;
  const halfZ = s * baseHalfW + c * baseHalfD;
  return (side === 'minX' || side === 'maxX') ? halfZ : halfX;
};

const getWallHorizontalRange = (side: 'minX'|'maxX'|'minZ'|'maxZ') => {
  const b = getRoomBoundaries();
  if (side === 'minX' || side === 'maxX') return { minU: b.minZ, maxU: b.maxZ };
  return { minU: b.minX, maxU: b.maxX };
};

export const getWallRect = (item: PlacedItem) => {
  if (!item.mount || item.mount.type !== 'wall') return null;
  const side = item.mount.side;
  const halfU = wallHalfExtentAlongU(item, side);
  const uMin = item.mount.u - halfU;
  const uMax = item.mount.u + halfU;
  const yMin = item.mount.height;
  const yMax = yMin + item.footprint.height * item.scale.y;
  return { side, uMin, uMax, yMin, yMax };
};

export const checkWallOverlapWithOthers = (
  targetItem: PlacedItem,
  allItems: PlacedItem[],
  minGap: number = 0.02
): { hasOverlap: boolean; overlappingItems: PlacedItem[] } => {
  if (!targetItem.mount || targetItem.mount.type !== 'wall') return { hasOverlap: false, overlappingItems: [] };
  const rectA = getWallRect(targetItem);
  if (!rectA) return { hasOverlap: false, overlappingItems: [] };

  const overlaps: PlacedItem[] = [];
  for (const other of allItems) {
    if (other.id === targetItem.id) continue;
    if (!other.mount || other.mount.type !== 'wall') continue;
    if (other.mount.side !== rectA.side) continue;
    const rectB = getWallRect(other)!;
    // 최소 간격을 고려한 겹침 판단(간격보다 가까우면 겹침)
    const overlap = (
      rectA.uMin < rectB.uMax + minGap && rectA.uMax > rectB.uMin - minGap &&
      rectA.yMin < rectB.yMax && rectA.yMax > rectB.yMin
    );
    if (overlap) overlaps.push(other);
  }
  return { hasOverlap: overlaps.length > 0, overlappingItems: overlaps };
};

export const findNonOverlappingWallPosition = (
  targetItem: PlacedItem,
  allItems: PlacedItem[],
  step: number = 0.1,
  maxAttempts: number = 200,
  minGap: number = 0.02
): { u: number } | null => {
  if (!targetItem.mount || targetItem.mount.type !== 'wall') return null;
  const side = targetItem.mount.side;
  const { minU, maxU } = getWallHorizontalRange(side);
  const originalU = targetItem.mount.u;

  // 먼저 원래 u에서 체크
  if (!checkWallOverlapWithOthers(targetItem, allItems).hasOverlap) {
    return { u: originalU };
  }

  // 좌우로 번갈아가며 확장 탐색
  for (let i = 1; i <= maxAttempts; i++) {
    const delta = step * i;
    for (const dir of [-1, 1]) {
      const u = originalU + dir * delta;
      const test: PlacedItem = { ...targetItem, mount: { ...targetItem.mount, u } } as PlacedItem;
      // 경계 내 클램프는 상위에서 보정하므로, 여기서는 범위만 대략 체크
      if (u < minU || u > maxU) continue;
      if (!checkWallOverlapWithOthers(test, allItems, minGap).hasOverlap) {
        return { u };
      }
    }
  }
  return null;
};
