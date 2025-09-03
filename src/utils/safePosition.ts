/**
 * 안전한 position 값 처리를 위한 유틸리티 함수들
 */

/**
 * NaN, undefined, null 값을 안전한 기본값으로 변환
 */
export function safeNumber(value: number | undefined | null, defaultValue: number = 0): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  return value;
}

/**
 * position 객체를 안전하게 처리
 */
export function safePosition(
  position: { x?: number; y?: number; z?: number } | undefined | null,
  defaultPosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
): [number, number, number] {
  if (!position) {
    return [defaultPosition.x, defaultPosition.y, defaultPosition.z];
  }

  return [
    safeNumber(position.x, defaultPosition.x),
    safeNumber(position.y, defaultPosition.y),
    safeNumber(position.z, defaultPosition.z)
  ];
}

/**
 * rotation 객체를 안전하게 처리
 */
export function safeRotation(
  rotation: { x?: number; y?: number; z?: number } | undefined | null,
  defaultRotation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
): [number, number, number] {
  if (!rotation) {
    return [defaultRotation.x, defaultRotation.y, defaultRotation.z];
  }

  return [
    safeNumber(rotation.x, defaultRotation.x),
    safeNumber(rotation.y, defaultRotation.y),
    safeNumber(rotation.z, defaultRotation.z)
  ];
}

/**
 * scale 객체를 안전하게 처리
 */
export function safeScale(
  scale: { x?: number; y?: number; z?: number } | undefined | null,
  defaultScale: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 }
): [number, number, number] {
  if (!scale) {
    return [defaultScale.x, defaultScale.y, defaultScale.z];
  }

  return [
    safeNumber(scale.x, defaultScale.x),
    safeNumber(scale.y, defaultScale.y),
    safeNumber(scale.z, defaultScale.z)
  ];
}
