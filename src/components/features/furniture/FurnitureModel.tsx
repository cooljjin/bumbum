import React, { useRef, useEffect, useState } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';
import { FurnitureItem } from '../../../types/furniture';

interface FurnitureModelProps {
  furniture: FurnitureItem;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  isSelected?: boolean;
  onLoad?: (model: THREE.Group) => void;
  onError?: (error: Error) => void;
}

const FurnitureModel: React.FC<FurnitureModelProps> = ({
  furniture,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  isSelected = false,
  onLoad,
  onError
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DRACO 압축 지원을 위한 로더 설정
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');

  // GLTF 로더 설정
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  // 모델 로딩
  const gltf = useLoader(
    GLTFLoader,
    furniture.modelPath,
    () => {
      // 로딩 진행률 처리 (필요시)
      console.log('Loading furniture model:', furniture.name);
    }
  );

  // 모델 로딩 완료 시 처리
  useEffect(() => {
    if (gltf && gltf.scene) {
      try {
        const model = gltf.scene.clone();

        // 모델 설정 적용
        model.position.set(...position);
        model.rotation.set(...rotation);
        model.scale.set(...scale);

        // 그림자 설정
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
          child.castShadow = furniture.renderSettings.castShadow;
          child.receiveShadow = furniture.renderSettings.receiveShadow;

          // 재질 최적화
          if (child.material) {
            child.material.side = THREE.DoubleSide;
            child.material.needsUpdate = true;
          }
        }
        });

        // 그룹에 모델 추가
        if (groupRef.current) {
          groupRef.current.clear();
          groupRef.current.add(model);
        }

        setIsLoading(false);
        onLoad?.(model);

        console.log('Furniture model loaded successfully:', furniture.name);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error.message);
        setIsLoading(false);
        onError?.(error);
        console.error('Error setting up furniture model:', error);
      }
    }
  }, [gltf, furniture, position, rotation, scale, onLoad, onError]);

  // 선택 상태에 따른 하이라이트 효과
  useFrame(() => {
    if (groupRef.current && isSelected) {
      // 선택된 가구에 하이라이트 효과 적용
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat.emissive) {
                mat.emissive.setHex(0x444444);
              }
            });
          } else {
            if (child.material.emissive) {
              child.material.emissive.setHex(0x444444);
            }
          }
        }
      });
    }
  });

  // 로딩 중 표시
  if (isLoading) {
    return (
      <group ref={groupRef} position={position}>
        {/* 로딩 중 플레이스홀더 */}
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#cccccc" transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }

  // 에러 발생 시 표시
  if (error) {
    return (
      <group ref={groupRef} position={position}>
        {/* 에러 상태 플레이스홀더 */}
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      {/* GLTF 모델이 여기에 렌더링됩니다 */}
    </group>
  );
};

export default FurnitureModel;
