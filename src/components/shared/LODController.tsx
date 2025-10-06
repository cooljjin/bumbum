'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PerformanceOptions } from '../../types/editor';

interface LODControllerProps {
  /** LOD 활성화 여부 */
  enabled: boolean;
  /** 카메라와의 거리별 LOD 레벨 */
  lodLevels: {
    distance: number;
    level: 'high' | 'medium' | 'low';
  }[];
  /** LOD 적용할 객체들 */
  children: React.ReactNode;
}

/**
 * LOD (Level of Detail) 컨트롤러
 * 카메라와의 거리에 따라 렌더링 품질을 조절합니다.
 */
export const LODController: React.FC<LODControllerProps> = ({
  enabled,
  lodLevels,
  children
}) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!enabled || !groupRef.current) return;

    // 카메라와의 거리 계산
    const distance = camera.position.distanceTo(groupRef.current.position);
    
    // 거리에 따른 LOD 레벨 결정
    let currentLevel: 'high' | 'medium' | 'low' = 'high';
    for (const lodLevel of lodLevels) {
      if (distance <= lodLevel.distance) {
        currentLevel = lodLevel.level;
        break;
      }
    }

    // LOD 레벨에 따른 렌더링 설정 적용
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        switch (currentLevel) {
          case 'high':
            child.visible = true;
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.wireframe = false;
                  mat.transparent = false;
                });
              } else {
                child.material.wireframe = false;
                child.material.transparent = false;
              }
            }
            break;
          case 'medium':
            child.visible = true;
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.wireframe = false;
                  mat.transparent = false;
                });
              } else {
                child.material.wireframe = false;
                child.material.transparent = false;
              }
            }
            break;
          case 'low':
            child.visible = true;
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.wireframe = false;
                  mat.transparent = false;
                });
              } else {
                child.material.wireframe = false;
                child.material.transparent = false;
              }
            }
            break;
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
};

/**
 * 성능 옵션에 따른 LOD 설정 생성
 */
export const createLODLevels = (performanceOptions: PerformanceOptions) => {
  if (!performanceOptions.enableLOD) {
    return [{ distance: Infinity, level: 'high' as const }];
  }

  return [
    { distance: 5, level: 'high' as const },
    { distance: 15, level: 'medium' as const },
    { distance: 30, level: 'low' as const }
  ];
};

export default LODController;
