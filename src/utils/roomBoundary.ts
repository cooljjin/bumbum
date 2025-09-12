import { Vector3 } from 'three';
import { PlacedItem } from '../types/editor';
import { AxisString } from './orientation';

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
  // console.log('🏠 방 크기 업데이트:', currentRoomDimensions);
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

// 벽 사이드 타입
export type WallSide = 'minX' | 'maxX' | 'minZ' | 'maxZ';

// 네 개의 벽 평면 좌표와 실내 방향 법선 제공
export const getWallPlanes = () => {
  const b = getRoomBoundaries();
  return {
    minX: { constant: b.minX, normal: new Vector3(1, 0, 0) },   // 실내 방향 +X
    maxX: { constant: b.maxX, normal: new Vector3(-1, 0, 0) },  // 실내 방향 -X
    minZ: { constant: b.minZ, normal: new Vector3(0, 0, 1) },   // 실내 방향 +Z
    maxZ: { constant: b.maxZ, normal: new Vector3(0, 0, -1) },  // 실내 방향 -Z
  } as const;
};

// 내부 실제 벽면(시각적 면)의 평면: margin을 무시하고 방 내부 크기를 기준으로 계산
export const getWallInteriorPlanes = () => {
  const halfWidth = ROOM_DIMENSIONS.width / 2;
  const halfDepth = ROOM_DIMENSIONS.depth / 2;
  return {
    minX: { constant: -halfWidth, normal: new Vector3(1, 0, 0) },   // x = -W/2
    maxX: { constant: +halfWidth, normal: new Vector3(-1, 0, 0) },  // x = +W/2
    minZ: { constant: -halfDepth, normal: new Vector3(0, 0, 1) },   // z = -D/2
    maxZ: { constant: +halfDepth, normal: new Vector3(0, 0, -1) },  // z = +D/2
  } as const;
};

// 포인트에서 가장 가까운 벽 사이드 계산
export const nearestWallSide = (p: Vector3): WallSide => {
  const b = getRoomBoundaries();
  const dxMin = Math.abs(p.x - b.minX);
  const dxMax = Math.abs(p.x - b.maxX);
  const dzMin = Math.abs(p.z - b.minZ);
  const dzMax = Math.abs(p.z - b.maxZ);
  const minXDist = Math.min(dxMin, dxMax);
  const minZDist = Math.min(dzMin, dzMax);

  if (minXDist <= minZDist) {
    return dxMin < dxMax ? 'minX' : 'maxX';
  }
  return dzMin < dzMax ? 'minZ' : 'maxZ';
};

// 벽 평면 로컬 2D 축 정의: 수평축(벽 길이 방향), 수직축(Y)
const wallAxes = (side: WallSide) => {
  // 수평축 단위벡터와 추출 함수
  if (side === 'minX' || side === 'maxX') {
    return {
      horizontal: new Vector3(0, 0, 1), // Z 방향
      toU: (v: Vector3) => v.z,
      fromU: (u: number) => new Vector3(0, 0, u),
      normalAxis: 'x' as const
    };
  }
  return {
    horizontal: new Vector3(1, 0, 0), // X 방향
    toU: (v: Vector3) => v.x,
    fromU: (u: number) => new Vector3(u, 0, 0),
    normalAxis: 'z' as const
  };
};

// 항목의 회전을 고려하여 벽 법선 방향 반치수(깊이)를 계산
const halfDepthAlongNormal = (item: PlacedItem, normalAxis: 'x' | 'z') => {
  const baseHalfW = (item.footprint.width * item.scale.x) / 2;
  const baseHalfD = (item.footprint.depth * item.scale.z) / 2;
  const yaw = item.rotation?.y ?? 0;
  const c = Math.abs(Math.cos(yaw));
  const s = Math.abs(Math.sin(yaw));
  // XZ에서의 AABB 반치수
  const halfX = c * baseHalfW + s * baseHalfD;
  const halfZ = s * baseHalfW + c * baseHalfD;
  return normalAxis === 'x' ? halfX : halfZ;
};

// 벽 부착 아이템을 현재 side, u, height에 맞춰 위치/회전을 계산
export const computeWallMountedTransform = (
  item: PlacedItem,
  side: WallSide,
  u: number,
  height: number,
  _offset: number = 0,
  frontAxis: AxisString = '+z',
  upAxis: AxisString = '+y'
) => {
  // 벽에 딱 붙이기: margin/offset 무시, 실제 내부 벽면에 밀착
  const planes = getWallInteriorPlanes();
  const { normalAxis, fromU } = wallAxes(side);

  // 중심 좌표 계산
  const alongNormal = halfDepthAlongNormal(item, normalAxis); // offset 무시
  const base = new Vector3();
  if (side === 'minX') base.set(planes.minX.constant + alongNormal, height, 0);
  if (side === 'maxX') base.set(planes.maxX.constant - alongNormal, height, 0);
  if (side === 'minZ') base.set(0, height, planes.minZ.constant + alongNormal);
  if (side === 'maxZ') base.set(0, height, planes.maxZ.constant - alongNormal);

  const pos = base.clone().add(fromU(u));

  // 회전: 정면이 실내를 향하도록 (orientation 유틸 사용)
  // 유틸에서 Quaternion을 계산하므로, 여기서는 yaw만 맞춰도 1차 동작 가능
  // 간단화: side에 따라 yaw를 고정
  let yaw = 0;
  if (side === 'minX') yaw = Math.PI / 2;      // +X 바라보면 정면은 -X여야 하므로 yaw는 +90도 → 모델 front '+z'를 -x로 돌림(간이)
  if (side === 'maxX') yaw = -Math.PI / 2;     // -X
  if (side === 'minZ') yaw = 0;                // +Z
  if (side === 'maxZ') yaw = Math.PI;          // -Z

  return { position: pos, rotationY: yaw };
};

// 벽 부착 아이템을 방 경계에 맞게 클램프 (u, height 범위 조정 후 최종 위치 계산)
export const clampWallMountedItem = (item: PlacedItem): PlacedItem => {
  if (!item.mount || item.mount.type !== 'wall') return item;
  const b = getRoomBoundaries();
  const { side } = item.mount;
  const { normalAxis } = wallAxes(side);

  // 수평 범위
  let minU = 0, maxU = 0;
  if (side === 'minX' || side === 'maxX') {
    minU = b.minZ; maxU = b.maxZ;
  } else {
    minU = b.minX; maxU = b.maxX;
  }

  // 아이템 반폭(수평축 방향) 고려하여 클램프
  const baseHalfW = (item.footprint.width * item.scale.x) / 2;
  const baseHalfD = (item.footprint.depth * item.scale.z) / 2;
  const yaw = item.rotation?.y ?? 0;
  const c = Math.abs(Math.cos(yaw));
  const s = Math.abs(Math.sin(yaw));
  const halfX = c * baseHalfW + s * baseHalfD;
  const halfZ = s * baseHalfW + c * baseHalfD;
  const halfAlongU = (side === 'minX' || side === 'maxX') ? halfZ : halfX;

  const clampedU = Math.min(Math.max(item.mount.u, minU + halfAlongU), maxU - halfAlongU);

  // 높이(Y) 클램프
  const maxY = b.maxY;
  const height = Math.min(Math.max(item.mount.height, 0), maxY - item.footprint.height * item.scale.y);

  // offset은 0으로 고정하여 벽에 딱 붙임
  const offset = 0;
  const { position, rotationY } = computeWallMountedTransform(item, side, clampedU, height, offset);

  return {
    ...item,
    position,
    rotation: { ...item.rotation, y: rotationY } as any,
    mount: { ...item.mount, u: clampedU, height, offset }
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
  
  // console.log(`🔍 벽 충돌 검사: ${item.name}`, {
  //   가구위치: `(${item.position.x.toFixed(2)}, ${item.position.y.toFixed(2)}, ${item.position.z.toFixed(2)})`,
  //   가구크기: `${item.footprint.width}x${item.footprint.height}x${item.footprint.depth}`,
  //   스케일: `${item.scale.x}x${item.scale.y}x${item.scale.z}`,
  //   가구경계: `X:${furnitureBounds.minX.toFixed(2)}~${furnitureBounds.maxX.toFixed(2)}, Z:${furnitureBounds.minZ.toFixed(2)}~${furnitureBounds.maxZ.toFixed(2)}`,
  //   방경계: `X:${boundaries.minX.toFixed(2)}~${boundaries.maxX.toFixed(2)}, Z:${boundaries.minZ.toFixed(2)}~${boundaries.maxZ.toFixed(2)}`
  // });
  
  // X축 검증
  if (furnitureBounds.minX < boundaries.minX || furnitureBounds.maxX > boundaries.maxX) {
    // console.log(`❌ X축 벽 충돌: 가구(${furnitureBounds.minX.toFixed(2)}~${furnitureBounds.maxX.toFixed(2)}) vs 방(${boundaries.minX.toFixed(2)}~${boundaries.maxX.toFixed(2)})`);
    return false;
  }
  
  // Z축 검증
  if (furnitureBounds.minZ < boundaries.minZ || furnitureBounds.maxZ > boundaries.maxZ) {
    // console.log(`❌ Z축 벽 충돌: 가구(${furnitureBounds.minZ.toFixed(2)}~${furnitureBounds.maxZ.toFixed(2)}) vs 방(${boundaries.minZ.toFixed(2)}~${boundaries.maxZ.toFixed(2)})`);
    return false;
  }
  
  // Y축 검증 (바닥 위, 천장 아래)
  if (furnitureBounds.minY < boundaries.minY || furnitureBounds.maxY > boundaries.maxY) {
    // console.log(`❌ Y축 벽 충돌: 가구(${furnitureBounds.minY.toFixed(2)}~${furnitureBounds.maxY.toFixed(2)}) vs 방(${boundaries.minY.toFixed(2)}~${boundaries.maxY.toFixed(2)})`);
    return false;
  }
  
  // console.log(`✅ 벽 충돌 없음: ${item.name}`);
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
  
  // console.log(`🔧 가구 위치 제한: ${item.name} - 원래: (${item.position.x.toFixed(2)}, ${item.position.y.toFixed(2)}, ${item.position.z.toFixed(2)}) -> 새 위치: (${newX.toFixed(2)}, ${newY.toFixed(2)}, ${newZ.toFixed(2)})`);
  
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
