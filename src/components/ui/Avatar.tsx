'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AvatarProps {
  castShadow?: boolean;
}

export default function Avatar({ castShadow = false }: AvatarProps) {
  const avatarRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);

  // 부드러운 호흡 애니메이션
  useFrame((state) => {
    if (headRef.current) {
      const time = state.clock.elapsedTime;
      headRef.current.position.y = Math.sin(time * 2) * 0.02 + 1.7;
    }
  });

  return (
    <group ref={avatarRef} position={[0, 0, 0]}>
      {/* 몸통 - 검은색 재킷 */}
      <mesh
        position={[0, 1, 0]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <cylinderGeometry args={[0.4, 0.5, 1.2]} />
        <meshStandardMaterial
          color="#000000" // 검은색 재킷
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* 재킷 단추들 */}
      {[0.8, 0.6, 0.4, 0.2, 0, -0.2].map((y, i) => (
        <mesh
          key={i}
          position={[0, y, 0.5]}
          castShadow={castShadow}
          receiveShadow={castShadow}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial
            color="#FFFFFF" // 흰색 단추
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* 머리 */}
      <mesh
        ref={headRef}
        position={[0, 1.7, 0]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#FFE4B5"
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>

      {/* 눈들 */}
      <mesh
        position={[-0.1, 1.75, 0.25]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color="#000000"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      <mesh
        position={[0.1, 1.75, 0.25]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color="#000000"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* 코 */}
      <mesh
        position={[0, 1.7, 0.3]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <coneGeometry args={[0.03, 0.1, 8]} />
        <meshStandardMaterial
          color="#FFE4B5"
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>

      {/* 입 */}
      <mesh
        position={[0, 1.6, 0.25]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <torusGeometry args={[0.08, 0.02, 8, 16]} />
        <meshStandardMaterial
          color="#FF69B4"
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* 팔들 - 요가 포즈로 변경 */}
      {/* 왼쪽 팔 - 가슴 앞으로 구부러짐 */}
      <mesh
        position={[-0.3, 1.3, 0.3]}
        rotation={[0, 0, Math.PI / 3]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <cylinderGeometry args={[0.15, 0.15, 0.6]} />
        <meshStandardMaterial
          color="#FFE4B5"
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>

      {/* 오른쪽 팔 - 가슴 앞으로 구부러짐 */}
      <mesh
        position={[0.3, 1.3, 0.3]}
        rotation={[0, 0, -Math.PI / 3]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <cylinderGeometry args={[0.15, 0.15, 0.6]} />
        <meshStandardMaterial
          color="#FFE4B5"
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>

      {/* 손들 - 가슴 앞에서 모임 */}
      {/* 왼쪽 손 */}
      <mesh
        position={[0, 1.1, 0.6]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color="#FFE4B5"
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>

      {/* 오른쪽 손 */}
      <mesh
        position={[0, 1.1, 0.6]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color="#FFE4B5"
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>

      {/* 다리들 - 흰색 바지 */}
      {/* 왼쪽 다리 */}
      <mesh
        position={[-0.2, 0.3, 0]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <cylinderGeometry args={[0.2, 0.2, 0.6]} />
        <meshStandardMaterial
          color="#FFFFFF" // 흰색 바지
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* 오른쪽 다리 */}
      <mesh
        position={[0.2, 0.3, 0]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <cylinderGeometry args={[0.2, 0.2, 0.6]} />
        <meshStandardMaterial
          color="#FFFFFF" // 흰색 바지
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* 바지 줄무늬 */}
      {[-0.2, 0.2].map((x, i) => (
        <mesh
          key={i}
          position={[x, 0.3, 0]}
          castShadow={castShadow}
          receiveShadow={castShadow}
        >
          <cylinderGeometry args={[0.21, 0.21, 0.6]} />
          <meshStandardMaterial
            color="#000000" // 검은색 줄무늬
            roughness={0.7}
            metalness={0.1}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}

      {/* 발들 - 흰색 신발 */}
      {/* 왼쪽 발 */}
      <mesh
        position={[-0.2, 0, 0.1]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <boxGeometry args={[0.3, 0.1, 0.4]} />
        <meshStandardMaterial
          color="#FFFFFF" // 흰색 신발
          roughness={0.9}
          metalness={0.2}
        />
      </mesh>

      {/* 오른쪽 발 */}
      <mesh
        position={[0.2, 0, 0.1]}
        castShadow={castShadow}
        receiveShadow={castShadow}
      >
        <boxGeometry args={[0.3, 0.1, 0.4]} />
        <meshStandardMaterial
          color="#FFFFFF" // 흰색 신발
          roughness={0.9}
          metalness={0.2}
        />
      </mesh>

      {/* 신발 밑창 */}
      {[-0.2, 0.2].map((x, i) => (
        <mesh
          key={i}
          position={[x, -0.05, 0.1]}
          castShadow={castShadow}
          receiveShadow={castShadow}
        >
          <boxGeometry args={[0.35, 0.05, 0.45]} />
          <meshStandardMaterial
            color="#E0E0E0" // 회색 밑창
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* 모자 제거 (요가 포즈에는 모자가 적합하지 않음) */}
    </group>
  );
}
