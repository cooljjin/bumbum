import { Vector3 } from 'three';
import { PlacedItem } from '../types/editor';

// 방의 기본 크기 상수
export const ROOM_DIMENSIONS = {
  width: 15,    // X축 방향 (좌우)
  depth: 15,    // Z축 방향 (앞뒤)
  height: 7.5,  // Y축 방향 (상하)
  wallThickness: 0.1, // 벽 두께
  margin: 0.5   // 벽에서 최소 여백
};

// 동적 방 크기 관리를 위한 상태
let currentRoomDimensions = { ...ROOM_DIMENSIONS };

// 방 크기 업데이트 함수
export const updateRoomDimensions = (newDimensions: Partial<typeof ROOM_DIMENSIONS>) => {
  currentRoomDimensions = { ...currentRoomDimensions, ...newDimensions };
  console.log('🏠 방 크기 업데이트:', currentRoomDimensions);
};

// 현재 방 크기 가져오기
export const getCurrentRoomDimensions = () => currentRoomDimensions;

// 방 경계 계산
export const getRoomBoundaries = () => {
  const dimensions = getCurrentRoomDimensions();
  const halfWidth = dimensions.width / 2;
  const halfDepth = dimensions.depth / 2;
  
  return {
    minX: -halfWidth + dimensions.margin,
    maxX: halfWidth - dimensions.margin,
    minZ: -halfDepth + dimensions.margin,
    maxZ: halfDepth - dimensions.margin,
    minY: 0,
    maxY: dimensions.height - dimensions.margin
  };
};

// 가구의 경계 상자 계산 (간단한 구면 근사)
export const getFurnitureBounds = (item: PlacedItem, safetyMargin: number = 0.3) => {
  // 가구의 크기를 추정 (실제로는 3D 모델의 바운딩 박스를 사용해야 함)
  const estimatedSize = 1.0; // 기본 추정 크기
  
  return {
    minX: item.position.x - estimatedSize - safetyMargin,
    maxX: item.position.x + estimatedSize + safetyMargin,
    minZ: item.position.z - estimatedSize - safetyMargin,
    maxZ: item.position.z + estimatedSize + safetyMargin,
    minY: item.position.y,
    maxY: item.position.y + estimatedSize + safetyMargin
  };
};

// 가구가 방 안에 있는지 검증
export const isFurnitureInRoom = (item: PlacedItem): boolean => {
  const boundaries = getRoomBoundaries();
  const furnitureBounds = getFurnitureBounds(item);
  
  // X축 검증
  if (furnitureBounds.minX < boundaries.minX || furnitureBounds.maxX > boundaries.maxX) {
    return false;
  }
  
  // Z축 검증
  if (furnitureBounds.minZ < boundaries.minZ || furnitureBounds.maxZ > boundaries.maxZ) {
    return false;
  }
  
  // Y축 검증 (바닥 위, 천장 아래)
  if (furnitureBounds.minY < boundaries.minY || furnitureBounds.maxY > boundaries.maxY) {
    return false;
  }
  
  return true;
};

// 가구를 방 안으로 이동시키는 함수
export const constrainFurnitureToRoom = (item: PlacedItem): PlacedItem => {
  const boundaries = getRoomBoundaries();
  const furnitureBounds = getFurnitureBounds(item);
  const estimatedSize = 1.0;
  
  let newX = item.position.x;
  let newZ = item.position.z;
  let newY = item.position.y;
  
  // X축 제한
  if (furnitureBounds.minX < boundaries.minX) {
    newX = boundaries.minX + estimatedSize;
  } else if (furnitureBounds.maxX > boundaries.maxX) {
    newX = boundaries.maxX - estimatedSize;
  }
  
  // Z축 제한
  if (furnitureBounds.minZ < boundaries.minZ) {
    newZ = boundaries.minZ + estimatedSize;
  } else if (furnitureBounds.maxZ > boundaries.maxZ) {
    newZ = boundaries.maxZ - estimatedSize;
  }
  
  // Y축 제한
  if (furnitureBounds.minY < boundaries.minY) {
    newY = boundaries.minY;
  } else if (furnitureBounds.maxY > boundaries.maxY) {
    newY = boundaries.maxY - estimatedSize;
  }
  
  return {
    ...item,
    position: new Vector3(newX, newY, newZ)
  };
};

// 방 크기 동적 감지 (향후 확장용)
export const detectRoomSize = (): typeof ROOM_DIMENSIONS => {
  // 현재는 동적으로 관리되는 크기를 반환
  return getCurrentRoomDimensions();
};

// 방 경계 시각화를 위한 포인트들
export const getRoomBoundaryPoints = () => {
  const boundaries = getRoomBoundaries();
  
  return [
    new Vector3(boundaries.minX, 0, boundaries.minZ),
    new Vector3(boundaries.maxX, 0, boundaries.minZ),
    new Vector3(boundaries.maxX, 0, boundaries.maxZ),
    new Vector3(boundaries.minX, 0, boundaries.maxZ),
    new Vector3(boundaries.minX, 0, boundaries.minZ), // 닫기
  ];
};
