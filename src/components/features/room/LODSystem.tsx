import React, { useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LODLevel {
  level: number;
  model: THREE.Group;
  maxDistance: number;
  triangleCount: number;
}

interface LODSystemProps {
  children: React.ReactNode;
  position: [number, number, number];
  highDetailModel: THREE.Group;
  mediumDetailModel?: THREE.Group;
  lowDetailModel?: THREE.Group;
  maxDistance?: number;
  enabled?: boolean;
}

// LOD 최적화 유틸리티 함수들
const lodUtils: {
  calculateTriangleCount: (model: THREE.Group) => number;
  shouldUseLowQuality: (distance: number, triangleCount: number) => boolean;
  createLODMaterial: (originalMaterial: THREE.Material, quality: 'low' | 'medium' | 'high') => THREE.Material;
  optimizeGeometry: (geometry: THREE.BufferGeometry, quality: 'low' | 'medium' | 'high') => THREE.BufferGeometry;
  calculateLODLevel: (distance: number, maxDistance?: number) => number;
} = {
  // 모델의 삼각형 수 계산
  calculateTriangleCount: (model: THREE.Group): number => {
    let triangleCount = 0;
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        if (child.geometry.index) {
          triangleCount += child.geometry.index.count / 3;
        } else if (child.geometry.attributes.position) {
          triangleCount += child.geometry.attributes.position.count / 3;
        }
      }
    });
    return triangleCount;
  },

  // 저품질 사용 여부 결정
  shouldUseLowQuality: (distance: number, triangleCount: number): boolean => {
    return distance > 8 || triangleCount > 5000;
  },

  // LOD 재질 생성
  createLODMaterial: (originalMaterial: THREE.Material, _quality: 'low' | 'medium' | 'high'): THREE.Material => {
    const material = originalMaterial.clone();
    return material;
  },

  // 지오메트리 최적화
  optimizeGeometry: (geometry: THREE.BufferGeometry, quality: 'low' | 'medium' | 'high'): THREE.BufferGeometry => {
    if (quality === 'low' && geometry.attributes['position'] && geometry.attributes['position'].count > 1000) {
      // 간단한 최적화: 정점 수 줄이기
      const simplifiedGeometry = geometry.clone();
      // 실제 최적화 로직은 여기에 구현
      return simplifiedGeometry;
    }
    return geometry;
  },

  // LOD 레벨 계산
  calculateLODLevel: (distance: number, maxDistance: number = 10): number => {
    if (distance < maxDistance * 0.3) return 0; // 고품질
    if (distance < maxDistance * 0.6) return 1; // 중간 품질
    return 2; // 저품질
  },
};

export const LODSystem: React.FC<LODSystemProps> = ({
  children,
  position,
  highDetailModel,
  mediumDetailModel,
  lowDetailModel,
  maxDistance = 10,
  enabled = true
}) => {
  const { camera } = useThree();
  const [currentLODLevel, setCurrentLODLevel] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const groupRef = useRef<THREE.Group>(null);
  const lastUpdateTime = useRef(0);
  const updateInterval = 100; // 100ms마다 LOD 업데이트

  // LOD 레벨별 모델 설정
  const lodLevels: LODLevel[] = [
    {
      level: 0,
      model: highDetailModel,
      maxDistance: maxDistance * 0.3,
      triangleCount: highDetailModel ? lodUtils.calculateTriangleCount(highDetailModel) : 0
    },
    {
      level: 1,
      model: mediumDetailModel || highDetailModel,
      maxDistance: maxDistance * 0.6,
      triangleCount: mediumDetailModel ? lodUtils.calculateTriangleCount(mediumDetailModel) : 0
    },
    {
      level: 2,
      model: lowDetailModel || mediumDetailModel || highDetailModel,
      maxDistance: maxDistance,
      triangleCount: lowDetailModel ? lodUtils.calculateTriangleCount(lowDetailModel) : 0
    }
  ];

  // LOD 레벨 업데이트
  const updateLODLevel = () => {
    if (!groupRef.current || !enabled) return;

    const now = performance.now();
    if (now - lastUpdateTime.current < updateInterval) return;

    const distance = camera.position.distanceTo(groupRef.current.position);
    const newLODLevel = lodUtils.calculateLODLevel(distance, maxDistance);

    // LOD 레벨이 변경된 경우에만 업데이트
    if (newLODLevel !== currentLODLevel) {
      setCurrentLODLevel(newLODLevel);
      lastUpdateTime.current = now;

      // 성능 로깅
      const currentLevel = lodLevels[newLODLevel];
      if (currentLevel) {
        // console.log(`🎯 LOD 레벨 변경: ${currentLODLevel} → ${newLODLevel} (거리: ${distance.toFixed(2)}, 삼각형: ${currentLevel.triangleCount})`);
      }
    }

    // 간단한 가시성 체크 (카메라와의 거리 기반)
    const maxVisibleDistance = maxDistance * 1.5;
    const isInView = distance <= maxVisibleDistance;
    setIsVisible(isInView);
  };

  // useFrame에서 LOD 업데이트
  useFrame(() => {
    updateLODLevel();
  });

  // 현재 LOD 레벨에 해당하는 모델 렌더링
  const renderCurrentLOD = () => {
    const currentLevel = lodLevels[currentLODLevel];
    if (!currentLevel || !currentLevel.model) return null;

    return (
      <primitive 
        object={currentLevel.model.clone()} 
        position={[0, 0, 0]}
      />
    );
  };

  // LOD 정보 표시 (디버그용)
  const renderLODInfo = () => {
    if (!enabled) return null;

    return (
      <group position={[0, 2, 0]}>
        {/* LOD 레벨 표시기 */}
        <mesh>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial 
            color={
              currentLODLevel === 0 ? '#00ff00' : 
              currentLODLevel === 1 ? '#ffff00' : '#ff0000'
            } 
            transparent 
            opacity={0.8} 
          />
        </mesh>
        
        {/* 거리 정보 */}
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.5, 0.03, 0.01]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} />
        </mesh>
      </group>
    );
  };

  if (!isVisible) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* 현재 LOD 레벨의 모델 */}
      {renderCurrentLOD()}
      
      {/* LOD 정보 표시 (개발 모드에서만) */}
      {process.env.NODE_ENV === 'development' && renderLODInfo()}
      
      {/* 자식 컴포넌트들 */}
      {children}
    </group>
  );
};

// 유틸리티 함수들을 외부로 export
export { lodUtils };

export default LODSystem;
