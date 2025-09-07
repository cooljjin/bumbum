'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
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
  isSelected = false
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const originalEmissiveRef = useRef<Map<THREE.Material, THREE.Color>>(new Map());

  // 모델 로딩
  const gltf = useGLTF(
    furniture.modelPath || '',
    () => {
      console.log('Furniture model loaded:', furniture.name);
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

        // 그림자 설정 및 재질 최적화
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = furniture.renderSettings.castShadow;
            child.receiveShadow = furniture.renderSettings.receiveShadow;

            // 재질 최적화 - 메탈릭 재질 개선
            if (child.material) {
              const material = Array.isArray(child.material) ? child.material[0] : child.material;
              
              // 메탈릭 재질 감지 및 개선
              if (material.metalness !== undefined) {
                // 메탈릭 재질인 경우 반사 특성 개선
                if (material.metalness > 0.5) {
                  material.envMapIntensity = 1.0;
                  material.roughness = Math.min(material.roughness || 0.1, 0.3);
                }
              }
              
              material.side = THREE.DoubleSide;
              material.needsUpdate = true;
            }
          }
        });

        // 그룹에 모델 추가
        if (groupRef.current) {
          groupRef.current.clear();
          groupRef.current.add(model);
        }

        setIsLoading(false);
        console.log('Furniture model loaded successfully:', furniture.name);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error.message);
        setIsLoading(false);
        console.error('Error setting up furniture model:', error);
      }
    }
  }, [gltf, furniture, position, rotation, scale]);

  // 선택 상태에 따른 하이라이트 효과 (최적화된 버전)
  useEffect(() => {
    if (!groupRef.current) return;

    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material) => {
          if (material.emissive) {
            if (isSelected) {
              // 선택된 상태: 하이라이트 효과 적용
              if (!originalEmissiveRef.current.has(material)) {
                // 원본 emissive 색상 저장
                originalEmissiveRef.current.set(material, material.emissive.clone());
              }
              material.emissive.setHex(0x444444);
            } else {
              // 선택 해제된 상태: 원본 색상으로 복원
              const originalEmissive = originalEmissiveRef.current.get(material);
              if (originalEmissive) {
                material.emissive.copy(originalEmissive);
              } else {
                // 원본 색상이 저장되지 않은 경우 검은색으로 설정
                material.emissive.setHex(0x000000);
              }
            }
            // 재질 업데이트 플래그 설정
            material.needsUpdate = true;
          }
        });
      }
    });
  }, [isSelected]); // isSelected가 변경될 때만 실행

  // 로딩 중 표시
  if (isLoading) {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#cccccc" />
        </mesh>
      </group>
    );
  }

  // 에러 표시
  if (error) {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      </group>
    );
  }

  return <group ref={groupRef} />;
};

export default FurnitureModel;