import React, { useRef, useEffect } from 'react';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

export interface SelectionOutlineProps {
  /** 표시할 바운더리의 크기 */
  size: [number, number, number];
  /** 표시할 바운더리의 위치 */
  position?: [number, number, number];
  /** 표시할 바운더리의 회전 */
  rotation?: [number, number, number];
  /** 선택 상태 */
  isSelected?: boolean;
  /** 호버 상태 */
  isHovered?: boolean;
  /** 드래그 상태 */
  isDragging?: boolean;
  /** 충돌 상태 */
  isColliding?: boolean;
  /** 고정 상태 */
  isLocked?: boolean;
  /** 벽 부착 여부 */
  isWallMounted?: boolean;
  /** 실제 메시 참조 (정확한 바운더리 계산용) */
  meshRef?: React.RefObject<THREE.Object3D | null>;
}

/**
 * 공통 선택 표시기 컴포넌트
 * 가구와 벽 모두에서 사용할 수 있는 통일된 선택/드래그 표시기
 */
export const SelectionOutline: React.FC<SelectionOutlineProps> = ({
  size,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isSelected = false,
  isHovered = false,
  isDragging = false,
  isColliding = false,
  isLocked = false,
  isWallMounted = false,
  meshRef
}) => {
  const outlineRef = useRef<THREE.Group>(null);
  
  // 안전한 크기 추출
  const [width, height, depth] = size || [1, 1, 1];
  
  // 유효한 크기인지 확인
  if (!width || !height || !depth || width <= 0 || height <= 0 || depth <= 0) {
    console.warn('⚠️ SelectionOutline: 유효하지 않은 크기:', size);
    return null;
  }

  // 실제 메시에서 정확한 바운더리 계산
  useEffect(() => {
    if (!outlineRef.current || !meshRef?.current) return;

    try {
      // 실제 메시의 바운딩 박스 계산 (matrixWorld 적용)
      const box = new THREE.Box3().setFromObject(meshRef.current);
      
      // 유효한 바운딩 박스인지 확인
      if (box.isEmpty()) {
        console.warn('⚠️ SelectionOutline: 빈 바운딩 박스 감지');
        return;
      }
      
      box.applyMatrix4(meshRef.current.matrixWorld);
      
      const boxSize = box.getSize(new THREE.Vector3());
      const boxCenter = box.getCenter(new THREE.Vector3());
      
      // 유효한 크기인지 확인
      if (boxSize.x <= 0 || boxSize.y <= 0 || boxSize.z <= 0) {
        console.warn('⚠️ SelectionOutline: 유효하지 않은 바운딩 박스 크기:', boxSize);
        return;
      }
      
      // 바운더리 박스 크기 조정 (약간 확장하여 시각적 안정화)
      const expandedSize = boxSize.clone().multiplyScalar(1.02);
      
      // 얇은 오브젝트(벽 등)는 추가 확장
      const minDimension = Math.min(expandedSize.x, expandedSize.y, expandedSize.z);
      if (minDimension < 0.1) {
        expandedSize.addScalar(0.01);
      }
      
      // 바운더리 위치와 크기 업데이트
      outlineRef.current.position.copy(boxCenter);
      outlineRef.current.scale.copy(expandedSize);
      
    } catch (error) {
      console.warn('⚠️ SelectionOutline: 바운더리 계산 실패:', error);
      // 폴백: 기본 크기 사용
      if (outlineRef.current) {
        outlineRef.current.scale.set(1, 1, 1);
        outlineRef.current.position.set(0, 0, 0);
      }
    }
  }, [meshRef, isSelected, isDragging]);

  return (
    <group ref={outlineRef}>
      {/* 드래그 중일 때 시각적 피드백 */}
      {isDragging && (
        <>
          {/* 드래그 중 그림자 */}
          <Box args={[1, 0.01, 1]} position={[0, -0.01, 0]}>
            <meshBasicMaterial 
              color="#000000" 
              transparent 
              opacity={0.18} 
              depthWrite={false} 
              depthTest={false} 
            />
          </Box>
          
          {/* 드래그 중 하이라이트 - 충돌 시 빨간색, 정상 시 파란색 */}
          <Box args={[1, 1, 1]}>
            <meshBasicMaterial
              color={isColliding ? "#ef4444" : "#3b82f6"}
              transparent
              opacity={0.5}
              depthWrite={false}
              depthTest={false}
              toneMapped={false}
            />
          </Box>
          
          {/* 충돌 시 추가 경고 표시 */}
          {isColliding && (
            <Box args={[1.2, 1.2, 1.2]}>
              <meshBasicMaterial 
                color="#ef4444" 
                transparent 
                opacity={0.3} 
                depthWrite={false} 
                depthTest={false} 
              />
            </Box>
          )}
        </>
      )}

      {/* 호버 효과 */}
      {isHovered && !isDragging && (
        <Box args={[1, 1, 1]}>
          <meshBasicMaterial 
            color="#ffff00" 
            transparent 
            opacity={0.3} 
            depthWrite={false} 
            depthTest={false} 
            toneMapped={false} 
          />
        </Box>
      )}

      {/* 선택 표시기 */}
      {isSelected && (
        <Box args={[1, 1, 1]}>
          <meshBasicMaterial 
            color="rgba(0,128,255,0.25)" 
            transparent 
            opacity={0.25} 
            depthWrite={false} 
            depthTest={false} 
            toneMapped={false} 
          />
        </Box>
      )}

      {/* 고정 표시기 */}
      {isLocked && (
        <Box args={[1.1, 1.1, 1.1]}>
          <meshBasicMaterial 
            color="#ffd700" 
            transparent 
            opacity={0.3} 
            depthWrite={false} 
            depthTest={false} 
            toneMapped={false} 
          />
        </Box>
      )}
    </group>
  );
};

/**
 * 벽용 선택 표시기 컴포넌트
 * 벽의 평면 지오메트리에 맞춘 선택 표시기
 */
export interface WallSelectionOutlineProps {
  /** 벽의 크기 [width, height] */
  size: [number, number];
  /** 벽의 위치 */
  position: [number, number, number];
  /** 벽의 회전 */
  rotation: [number, number, number];
  /** 선택 상태 */
  isSelected?: boolean;
  /** 실제 메시 참조 (정확한 바운더리 계산용) */
  meshRef?: React.RefObject<THREE.Object3D | null>;
}

export const WallSelectionOutline: React.FC<WallSelectionOutlineProps> = ({
  size,
  position,
  rotation,
  isSelected = false,
  meshRef
}) => {
  const outlineRef = useRef<THREE.Mesh>(null);
  
  // 안전한 크기 추출
  const [width, height] = size || [1, 1];
  
  // 유효한 크기인지 확인
  if (!width || !height || width <= 0 || height <= 0) {
    console.warn('⚠️ WallSelectionOutline: 유효하지 않은 크기:', size);
    return null;
  }

  // 유효한 위치인지 확인
  if (!position || position.length !== 3) {
    console.warn('⚠️ WallSelectionOutline: 유효하지 않은 위치:', position);
    return null;
  }

  if (!isSelected) return null;

  // 실제 메시에서 정확한 바운더리 계산
  useEffect(() => {
    if (!outlineRef.current || !meshRef?.current) return;

    try {
      // 실제 메시의 바운딩 박스 계산 (matrixWorld 적용)
      const box = new THREE.Box3().setFromObject(meshRef.current);
      
      // 유효한 바운딩 박스인지 확인
      if (box.isEmpty()) {
        console.warn('⚠️ WallSelectionOutline: 빈 바운딩 박스 감지');
        return;
      }
      
      box.applyMatrix4(meshRef.current.matrixWorld);
      
      const boxSize = box.getSize(new THREE.Vector3());
      const boxCenter = box.getCenter(new THREE.Vector3());
      
      // 유효한 크기인지 확인
      if (boxSize.x <= 0 || boxSize.y <= 0 || boxSize.z <= 0) {
        console.warn('⚠️ WallSelectionOutline: 유효하지 않은 바운딩 박스 크기:', boxSize);
        return;
      }
      
      // 벽의 경우 얇은 오브젝트이므로 적절한 확장 적용
      const expandedSize = boxSize.clone();
      const minDimension = Math.min(expandedSize.x, expandedSize.y, expandedSize.z);
      if (minDimension < 0.1) {
        expandedSize.addScalar(0.01);
      }
      
      // 바운더리 위치와 크기 업데이트
      outlineRef.current.position.copy(boxCenter);
      outlineRef.current.scale.copy(expandedSize);
      
    } catch (error) {
      console.warn('⚠️ WallSelectionOutline: 바운더리 계산 실패:', error);
      // 폴백: 기본 크기 사용
      if (outlineRef.current) {
        outlineRef.current.scale.set(1, 1, 1);
        outlineRef.current.position.set(0, 0, 0);
      }
    }
  }, [meshRef, isSelected]);

  return (
    <mesh ref={outlineRef} position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        color="rgba(0,128,255,0.25)"
        transparent
        opacity={0.25}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};
