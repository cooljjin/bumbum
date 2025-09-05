import { Vector3 } from 'three';
import { PlacedItem } from '../types/editor';

// 방의 기본 크기 상수
// 실제 Room.tsx의 기하와 일치하도록 기본값을 설정합니다.
// Room.tsx 기준:
// - 내부 너비/깊이: 10m (X: -5~5, Z: -5~5)
// - 벽 높이: 5m (Y: 0~5)
// - 벽 두께: 0.3m
// 이 값들이 유틸의 경계 계산과 불일치하면, 가구가 시각적 벽을 통과해 보일 수 있습니다.
export const ROOM_DIMENSIONS = {
  width: 10,        // X축 방향 (좌우)
  depth: 10,        // Z축 방향 (앞뒤)
  height: 5,        // Y축 방향 (상하)
  wallThickness: 0.3, // Room.tsx의 wallThickness와 동일하게
  // 벽과의 최소 여백. 벽 두께와 충돌 안전 여백을 고려해 0.3m로 설정
  // (가구 safetyMargin 0.1과 합쳐 실제 시각적 침투를 방지)
  margin: 0.3
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
  // 스케일 적용한 원본 반치수
  const baseHalfW = (item.footprint.width * item.scale.x) / 2;
  const baseHalfD = (item.footprint.depth * item.scale.z) / 2;
  const height = item.footprint.height * item.scale.y;

  // Yaw(회전.y) 반영한 XZ 평면상의 AABB 반치수 계산
  const yaw = item.rotation?.y ?? 0;
  const c = Math.abs(Math.cos(yaw));
  const s = Math.abs(Math.sin(yaw));
  const halfX = c * baseHalfW + s * baseHalfD;
  const halfZ = s * baseHalfW + c * baseHalfD;

  return {
    minX: item.position.x - (halfX + safetyMargin),
    maxX: item.position.x + (halfX + safetyMargin),
    minZ: item.position.z - (halfZ + safetyMargin),
    maxZ: item.position.z + (halfZ + safetyMargin),
    minY: item.position.y,
    maxY: item.position.y + height + safetyMargin
  };
};

// 가구가 방 안에 있는지 검증
export const isFurnitureInRoom = (item: PlacedItem): boolean => {
  const boundaries = getRoomBoundaries();
  const furnitureBounds = getFurnitureBounds(item);
  
  console.log(`🔍 벽 충돌 검사: ${item.name}`, {
    가구위치: `(${item.position.x.toFixed(2)}, ${item.position.y.toFixed(2)}, ${item.position.z.toFixed(2)})`,
    가구크기: `${item.footprint.width}x${item.footprint.height}x${item.footprint.depth}`,
    스케일: `${item.scale.x}x${item.scale.y}x${item.scale.z}`,
    가구경계: `X:${furnitureBounds.minX.toFixed(2)}~${furnitureBounds.maxX.toFixed(2)}, Z:${furnitureBounds.minZ.toFixed(2)}~${furnitureBounds.maxZ.toFixed(2)}`,
    방경계: `X:${boundaries.minX.toFixed(2)}~${boundaries.maxX.toFixed(2)}, Z:${boundaries.minZ.toFixed(2)}~${boundaries.maxZ.toFixed(2)}`
  });
  
  // X축 검증
  if (furnitureBounds.minX < boundaries.minX || furnitureBounds.maxX > boundaries.maxX) {
    console.log(`❌ X축 벽 충돌: 가구(${furnitureBounds.minX.toFixed(2)}~${furnitureBounds.maxX.toFixed(2)}) vs 방(${boundaries.minX.toFixed(2)}~${boundaries.maxX.toFixed(2)})`);
    return false;
  }
  
  // Z축 검증
  if (furnitureBounds.minZ < boundaries.minZ || furnitureBounds.maxZ > boundaries.maxZ) {
    console.log(`❌ Z축 벽 충돌: 가구(${furnitureBounds.minZ.toFixed(2)}~${furnitureBounds.maxZ.toFixed(2)}) vs 방(${boundaries.minZ.toFixed(2)}~${boundaries.maxZ.toFixed(2)})`);
    return false;
  }
  
  // Y축 검증 (바닥 위, 천장 아래)
  if (furnitureBounds.minY < boundaries.minY || furnitureBounds.maxY > boundaries.maxY) {
    console.log(`❌ Y축 벽 충돌: 가구(${furnitureBounds.minY.toFixed(2)}~${furnitureBounds.maxY.toFixed(2)}) vs 방(${boundaries.minY.toFixed(2)}~${boundaries.maxY.toFixed(2)})`);
    return false;
  }
  
  console.log(`✅ 벽 충돌 없음: ${item.name}`);
  return true;
};

// 가구를 방 안으로 이동시키는 함수
export const constrainFurnitureToRoom = (item: PlacedItem): PlacedItem => {
  const boundaries = getRoomBoundaries();
  const safetyMargin = 0.1; // getFurnitureBounds와 동일한 safetyMargin 사용

  // 회전 반영된 반치수 계산 (XZ)
  const baseHalfW = (item.footprint.width * item.scale.x) / 2;
  const baseHalfD = (item.footprint.depth * item.scale.z) / 2;
  const yaw = item.rotation?.y ?? 0;
  const c = Math.abs(Math.cos(yaw));
  const s = Math.abs(Math.sin(yaw));
  const halfX = c * baseHalfW + s * baseHalfD + safetyMargin;
  const halfZ = s * baseHalfW + c * baseHalfD + safetyMargin;
  const height = item.footprint.height * item.scale.y + safetyMargin;
  
  let newX = item.position.x;
  let newZ = item.position.z;
  let newY = item.position.y;
  
  // X축 제한 (회전 반영된 실제 크기 고려)
  if (item.position.x - halfX < boundaries.minX) {
    newX = boundaries.minX + halfX;
  } else if (item.position.x + halfX > boundaries.maxX) {
    newX = boundaries.maxX - halfX;
  }
  
  // Z축 제한 (회전 반영된 실제 크기 고려)
  if (item.position.z - halfZ < boundaries.minZ) {
    newZ = boundaries.minZ + halfZ;
  } else if (item.position.z + halfZ > boundaries.maxZ) {
    newZ = boundaries.maxZ - halfZ;
  }
  
  // Y축 제한 (safetyMargin 포함한 실제 높이 고려)
  if (item.position.y < boundaries.minY) {
    newY = boundaries.minY;
  } else if (item.position.y + height > boundaries.maxY) {
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
