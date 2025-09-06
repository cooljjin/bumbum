import { Vector3, Euler } from 'three';
import { PlacedItem } from '../types/editor';

/**
 * 가구를 좌측으로 90도 회전시킵니다
 */
export const rotateLeft = (item: PlacedItem): Partial<PlacedItem> => {
  const currentRotation = item.rotation;
  const newRotation = new Euler(
    currentRotation.x,
    currentRotation.y - Math.PI / 2, // Y축 기준으로 -90도 회전
    currentRotation.z
  );
  
  return {
    rotation: newRotation
  };
};

/**
 * 가구를 우측으로 90도 회전시킵니다
 */
export const rotateRight = (item: PlacedItem): Partial<PlacedItem> => {
  const currentRotation = item.rotation;
  const newRotation = new Euler(
    currentRotation.x,
    currentRotation.y + Math.PI / 2, // Y축 기준으로 +90도 회전
    currentRotation.z
  );
  
  return {
    rotation: newRotation
  };
};

/**
 * 가구를 복제합니다
 */
export const duplicateFurniture = (item: PlacedItem): PlacedItem => {
  const newId = `${item.id}_copy_${Date.now()}`;
  
  // 원본에서 약간 오프셋된 위치에 배치
  const offsetPosition = new Vector3(
    item.position.x + 0.5,
    item.position.y,
    item.position.z + 0.5
  );
  
  return {
    ...item,
    id: newId,
    position: offsetPosition,
    // 복제된 아이템은 잠금 해제
    isLocked: false,
    lastModified: new Date()
  };
};

/**
 * 가구 삭제 확인을 위한 유틸리티
 */
export const confirmDelete = (itemName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(
      `"${itemName}"을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    );
    resolve(confirmed);
  });
};

/**
 * 회전 각도를 정규화합니다 (0 ~ 2π 범위로)
 */
export const normalizeRotation = (rotation: Euler): Euler => {
  const normalizedY = ((rotation.y % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return new Euler(rotation.x, normalizedY, rotation.z);
};

/**
 * 회전 각도를 도(degree) 단위로 변환합니다
 */
export const rotationToDegrees = (rotation: Euler): { x: number; y: number; z: number } => {
  return {
    x: (rotation.x * 180) / Math.PI,
    y: (rotation.y * 180) / Math.PI,
    z: (rotation.z * 180) / Math.PI
  };
};

/**
 * 도(degree)를 라디안으로 변환합니다
 */
export const degreesToRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};
