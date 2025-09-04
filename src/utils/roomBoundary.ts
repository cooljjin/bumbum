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

// 가구의 경계 상자 계산 (실제 footprint 크기 사용)
export const getFurnitureBounds = (item: PlacedItem, safetyMargin: number = 0.1) => {
  // 실제 footprint 크기 사용 (스케일 적용)
  const halfWidth = (item.footprint.width * item.scale.x) / 2;
  const halfDepth = (item.footprint.depth * item.scale.z) / 2;
  const height = item.footprint.height * item.scale.y;
  
  console.log(`📏 가구 경계 계산: ${item.name} - 크기: ${item.footprint.width}x${item.footprint.height}x${item.footprint.depth}, 스케일: ${item.scale.x}x${item.scale.y}x${item.scale.z}`);
  console.log(`📐 실제 크기: ${(halfWidth * 2).toFixed(2)} x ${height.toFixed(2)} x ${(halfDepth * 2).toFixed(2)}`);
  
  return {
    minX: item.position.x - halfWidth - safetyMargin,
    maxX: item.position.x + halfWidth + safetyMargin,
    minZ: item.position.z - halfDepth - safetyMargin,
    maxZ: item.position.z + halfDepth + safetyMargin,
    minY: item.position.y,
    maxY: item.position.y + height + safetyMargin
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
  
  // 실제 footprint 크기 사용
  const halfWidth = (item.footprint.width * item.scale.x) / 2;
  const halfDepth = (item.footprint.depth * item.scale.z) / 2;
  const height = item.footprint.height * item.scale.y;
  
  let newX = item.position.x;
  let newZ = item.position.z;
  let newY = item.position.y;
  
  // X축 제한 (실제 크기 고려)
  if (furnitureBounds.minX < boundaries.minX) {
    newX = boundaries.minX + halfWidth;
  } else if (furnitureBounds.maxX > boundaries.maxX) {
    newX = boundaries.maxX - halfWidth;
  }
  
  // Z축 제한 (실제 크기 고려)
  if (furnitureBounds.minZ < boundaries.minZ) {
    newZ = boundaries.minZ + halfDepth;
  } else if (furnitureBounds.maxZ > boundaries.maxZ) {
    newZ = boundaries.maxZ - halfDepth;
  }
  
  // Y축 제한 (실제 높이 고려)
  if (furnitureBounds.minY < boundaries.minY) {
    newY = boundaries.minY;
  } else if (furnitureBounds.maxY > boundaries.maxY) {
    newY = boundaries.maxY - height;
  }
  
  console.log(`🔧 가구 위치 제한: ${item.name} - 원래: (${item.position.x.toFixed(2)}, ${item.position.y.toFixed(2)}, ${item.position.z.toFixed(2)}) -> 새 위치: (${newX.toFixed(2)}, ${newY.toFixed(2)}, ${newZ.toFixed(2)})`);
  
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
