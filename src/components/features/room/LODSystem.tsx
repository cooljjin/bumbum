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

  // LOD 레벨 계산
  calculateLODLevel: (distance: number, maxDistance: number = 10): number => {
    if (distance < maxDistance * 0.3) return 0; // 고품질
    if (distance < maxDistance * 0.6) return 1; // 중간 품질
    return 2; // 저품질
  },

  // 모델 복잡도 분석
  analyzeModelComplexity: (model: THREE.Group): {
    triangleCount: number;
    vertexCount: number;
    materialCount: number;
    textureCount: number;
  } => {
    let triangleCount = 0;
    let vertexCount = 0;
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          if (child.geometry.index) {
            triangleCount += child.geometry.index.count / 3;
            vertexCount += child.geometry.index.count;
          } else if (child.geometry.attributes.position) {
            triangleCount += child.geometry.attributes.position.count / 3;
            vertexCount += child.geometry.attributes.position.count;
          }
        }

        if (child.material) {
          const materialArray = Array.isArray(child.material) ? child.material : [child.material];
          materialArray.forEach(mat => {
            materials.add(mat);
            if (mat.map) textures.add(mat.map);
            if (mat.normalMap) textures.add(mat.normalMap);
            if (mat.roughnessMap) textures.add(mat.roughnessMap);
          });
        }
      }
    });

    return {
      triangleCount,
      vertexCount,
      materialCount: materials.size,
      textureCount: textures.size
    };
  },

  // 모델 최적화 권장사항 생성
  generateOptimizationRecommendations: (complexity: ReturnType<typeof lodUtils.analyzeModelComplexity>): string[] => {
    const recommendations: string[] = [];

    if (complexity.triangleCount > 10000) {
      recommendations.push('삼각형 수가 많습니다. 모델을 단순화하거나 LOD를 사용하세요.');
    }
    if (complexity.materialCount > 5) {
      recommendations.push('재질 수가 많습니다. 재질을 통합하세요.');
    }
    if (complexity.textureCount > 10) {
      recommendations.push('텍스처 수가 많습니다. 텍스처 아틀라스를 사용하세요.');
    }

    return recommendations;
  }
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
      console.log(`🎯 LOD 레벨 변경: ${currentLODLevel} → ${newLODLevel} (거리: ${distance.toFixed(2)}, 삼각형: ${currentLevel.triangleCount})`);
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

    const currentLevel = lodLevels[currentLODLevel];
    const distance = groupRef.current ? camera.position.distanceTo(groupRef.current.position) : 0;

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
