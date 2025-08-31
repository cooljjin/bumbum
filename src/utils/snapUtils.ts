import { Vector3, Euler } from 'three';

// 그리드 스냅 계산 함수
export const calculateGridSnap = (
  position: Vector3,
  gridSize: number,
  gridDivisions: number
): Vector3 => {
  const cellSize = gridSize / gridDivisions;

  return new Vector3(
    Math.round(position.x / cellSize) * cellSize,
    Math.round(position.y / cellSize) * cellSize,
    Math.round(position.z / cellSize) * cellSize
  );
};

// 회전 스냅 계산 함수
export const calculateRotationSnap = (
  rotation: Euler,
  snapAngle: number
): Euler => {
  const snapRadians = (snapAngle * Math.PI) / 180;

  return new Euler(
    Math.round(rotation.x / snapRadians) * snapRadians,
    Math.round(rotation.y / snapRadians) * snapRadians,
    Math.round(rotation.z / snapRadians) * snapRadians
  );
};

// 스냅 설정이 변경되었는지 확인하는 함수
export const hasSnapSettingsChanged = (
  currentGrid: { enabled: boolean; size: number; divisions: number },
  currentRotationSnap: { enabled: boolean; angle: number },
  previousGrid: { enabled: boolean; size: number; divisions: number },
  previousRotationSnap: { enabled: boolean; angle: number }
): boolean => {
  return (
    currentGrid.enabled !== previousGrid.enabled ||
    currentGrid.size !== previousGrid.size ||
    currentGrid.divisions !== previousGrid.divisions ||
    currentRotationSnap.enabled !== previousRotationSnap.enabled ||
    currentRotationSnap.angle !== previousRotationSnap.angle
  );
};

// 스냅 계산 결과를 메모이제이션하기 위한 캐시
const snapCache = new Map<string, Vector3 | Euler>();

// 캐시 키 생성 함수
export const generateSnapCacheKey = (
  type: 'grid' | 'rotation',
  values: number[],
  position?: Vector3,
  rotation?: Euler
): string => {
  if (type === 'grid') {
    return `grid_${values.join('_')}_${position?.x}_${position?.y}_${position?.z}`;
  } else {
    return `rotation_${values.join('_')}_${rotation?.x}_${rotation?.y}_${rotation?.z}`;
  }
};

// 메모이제이션된 그리드 스냅 계산
export const memoizedGridSnap = (
  position: Vector3,
  gridSize: number,
  gridDivisions: number
): Vector3 => {
  const cacheKey = generateSnapCacheKey('grid', [gridSize, gridDivisions], position);

  if (snapCache.has(cacheKey)) {
    return snapCache.get(cacheKey) as Vector3;
  }

  const result = calculateGridSnap(position, gridSize, gridDivisions);
  snapCache.set(cacheKey, result);

  // 캐시 크기 제한 (메모리 누수 방지)
  if (snapCache.size > 1000) {
    const firstKey = snapCache.keys().next().value;
    if (firstKey) {
      snapCache.delete(firstKey);
    }
  }

  return result;
};

// 메모이제이션된 회전 스냅 계산
export const memoizedRotationSnap = (
  rotation: Euler,
  snapAngle: number
): Euler => {
  const cacheKey = generateSnapCacheKey('rotation', [snapAngle], undefined, rotation);

  if (snapCache.has(cacheKey)) {
    return snapCache.get(cacheKey) as Euler;
  }

  const result = calculateRotationSnap(rotation, snapAngle);
  snapCache.set(cacheKey, result);

  // 캐시 크기 제한 (메모리 누수 방지)
  if (snapCache.size > 1000) {
    const firstKey = snapCache.keys().next().value;
    if (firstKey) {
      snapCache.delete(firstKey);
    }
  }

  return result;
};

// 캐시 클리어 함수
export const clearSnapCache = (): void => {
  snapCache.clear();
};
