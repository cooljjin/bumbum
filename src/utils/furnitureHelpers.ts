import type { FurnitureItem } from '../types/furniture';
import type { PlacedItem } from '../types/editor';

/**
 * 가구가 문(door)인지 판별하는 유틸리티 함수
 * @description 다음 조건을 확인합니다:
 * 1. subcategory가 'door'인 경우
 * 2. 벽에만 부착되고(wallOnly) 바닥 높이(wallHeight=0)인 경우
 * 
 * @param furniture - FurnitureItem 또는 PlacedItem (null/undefined 허용)
 * @returns 문 여부
 */
export function isDoorFurniture(
  furniture: FurnitureItem | PlacedItem | null | undefined
): boolean {
  if (!furniture) return false;

  // FurnitureItem인 경우: subcategory 체크
  if ('subcategory' in furniture && furniture.subcategory === 'door') {
    return true;
  }

  // placement 속성으로 판별 (커스텀 가구용)
  if ('placement' in furniture && furniture.placement) {
    return furniture.placement.wallOnly === true && 
           furniture.placement.wallHeight === 0;
  }

  return false;
}

/**
 * 문 가구의 기본 placement 설정을 반환
 * @description 문 가구에 필요한 표준 placement 설정을 제공합니다.
 * - 벽에만 부착 가능 (wallOnly: true)
 * - 바닥 높이에 배치 (wallHeight: 0)
 * - 벽에 밀착 (wallOffset: 0)
 * 
 * @returns 문 가구의 표준 placement 설정
 */
export function getDoorPlacementDefaults() {
  return {
    canRotate: true,
    canScale: true,
    floorOffset: 0,
    wallOnly: true,
    wallHeight: 0,
    wallOffset: 0.0,
    frontAxis: '+z' as const,
    upAxis: '+y' as const,
    supportedSurfaces: ['wall'] as const
  };
}

/**
 * 가구가 벽에만 부착 가능한지 확인
 * @param furniture - FurnitureItem
 * @returns 벽 전용 가구 여부
 */
export function isWallOnlyFurniture(furniture: FurnitureItem | null | undefined): boolean {
  if (!furniture) return false;
  return furniture.placement?.wallOnly === true;
}

/**
 * 가구의 벽 부착 높이를 반환
 * @param furniture - FurnitureItem
 * @returns 벽 부착 높이 (미터), 벽 전용이 아니면 undefined
 */
export function getWallHeight(furniture: FurnitureItem | null | undefined): number | undefined {
  if (!furniture || !furniture.placement?.wallOnly) return undefined;
  return furniture.placement.wallHeight;
}

