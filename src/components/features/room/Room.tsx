'use client';

import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface RoomProps {
  receiveShadow?: boolean;
}

export default function Room({ receiveShadow = false }: RoomProps) {
  const roomRef = useRef<THREE.Group>(null);

  // 부드러운 회전 애니메이션 (선택사항)
  useFrame(() => {
    if (roomRef.current) {
      // roomRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={roomRef}>
      {/* 바닥 - #103B57 색상으로 변경 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.375, 0]}
        receiveShadow={receiveShadow}
      >
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial
          color="#103B57" // #103B57 색상
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* 벽들 - #C4C8BF 색상으로 변경 */}
      {/* 뒤쪽 벽 */}
      <mesh
        position={[0, 3.375, -7.5]}
        receiveShadow={receiveShadow}
      >
        <planeGeometry args={[15, 7.5]} />
        <meshStandardMaterial
          color="#C4C8BF" // #C4C8BF 색상
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* 왼쪽 벽 */}
      <mesh
        position={[-7.5, 3.375, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow={receiveShadow}
      >
        <planeGeometry args={[15, 7.5]} />
        <meshStandardMaterial
          color="#C4C8BF" // #C4C8BF 색상
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* 오른쪽 벽 */}
      <mesh
        position={[7.49, 3.375, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow={receiveShadow}
      >
        <planeGeometry args={[15, 7.5]} />
        <meshStandardMaterial
          color="#C4C8BF" // #C4C8BF 색상
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* 앞쪽 벽 (입구 쪽) */}
      <mesh
        position={[0, 3.375, 7.5]}
        rotation={[0, Math.PI, 0]}
        receiveShadow={receiveShadow}
      >
        <planeGeometry args={[15, 7.5]} />
        <meshStandardMaterial
          color="#C4C8BF" // #C4C8BF 색상
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* 천장 */}
      <mesh
        position={[0, 6.75, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow={receiveShadow}
      >
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.9}
          metalness={0.02}
        />
      </mesh>

















    </group>
  );
}
