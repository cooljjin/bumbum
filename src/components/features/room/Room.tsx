'use client';

import React, { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { getCurrentRoomDimensions } from '../../../utils/roomBoundary';

interface RoomProps {
  receiveShadow?: boolean;
}

export default function Room({ receiveShadow = false }: RoomProps) {
  const roomRef = useRef<THREE.Group>(null);
  const dims = getCurrentRoomDimensions();
  const wallThickness = dims.wallThickness; // 벽 두께 (미터)
  const floorThickness = 0.3; // 바닥 두께 (미터)
  const halfWidth = dims.width / 2;
  const halfDepth = dims.depth / 2;
  const height = dims.height;
  const backWallRef = useRef<THREE.Mesh>(null);
  const frontWallRef = useRef<THREE.Mesh>(null);
  const leftWallRef = useRef<THREE.Mesh>(null);
  const rightWallRef = useRef<THREE.Mesh>(null);
  const ceilingRef = useRef<THREE.Mesh>(null);
  const backMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const frontMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const leftMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rightMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ceilingMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const { camera } = useThree();

  // 페이드 상태 추적 (0: 숨김, 1: 표시)
  const fadeRef = useRef<Record<string, number>>({
    back: 1,
    front: 1,
    left: 1,
    right: 1,
    ceiling: 1
  });

  // 카메라에서 가장 가까운 벽을 숨겨 내부가 보이도록 처리 (부드러운 페이드)
  useFrame(() => {
    const cam = camera.position;

    // 각 벽 중심과 카메라 간 거리 계산
    const walls: Array<[name: string, mesh: THREE.Mesh | null, dist: number]> = [];

    const tmp = new THREE.Vector3();
    if (backWallRef.current) { backWallRef.current.getWorldPosition(tmp); walls.push(['back', backWallRef.current, cam.distanceTo(tmp.clone())]); }
    if (frontWallRef.current) { frontWallRef.current.getWorldPosition(tmp); walls.push(['front', frontWallRef.current, cam.distanceTo(tmp.clone())]); }
    if (leftWallRef.current) { leftWallRef.current.getWorldPosition(tmp); walls.push(['left', leftWallRef.current, cam.distanceTo(tmp.clone())]); }
    if (rightWallRef.current) { rightWallRef.current.getWorldPosition(tmp); walls.push(['right', rightWallRef.current, cam.distanceTo(tmp.clone())]); }

    // 숨길 벽 선택 (최대 2개)
    const sorted = walls.sort((a, b) => a[2] - b[2]);
    const toHide = new Set<string>(sorted.slice(0, 2).map(([name]) => name));

    // 카메라가 천장보다 높으면 천장 숨김
    if (cam.y > height + 0.01) {
      toHide.add('ceiling');
    }

    // 페이드 업데이트
    const ease = 0.15;
    const applyFade = (
      name: string,
      mesh: THREE.Mesh | null,
      mat: THREE.MeshStandardMaterial | null
    ) => {
      if (!mat || !mesh) return;
      const target = toHide.has(name) ? 0 : 1;
      const current = fadeRef.current[name] ?? 1;
      const next = current + (target - current) * ease;
      fadeRef.current[name] = next;

      // 머티리얼 속성 적용
      const clamped = THREE.MathUtils.clamp(next, 0, 1);
      const fullyOpaque = clamped > 0.98;
      const fullyHidden = clamped < 0.02;

      if (fullyHidden) {
        // 완전히 숨김
        mat.transparent = true;
        mat.opacity = 0;
        mat.depthWrite = false;
        mesh.visible = false;
      } else if (fullyOpaque) {
        // 완전 불투명 상태로 복원하여 Z-fighting/블렌딩 아티팩트 방지
        mesh.visible = true;
        mat.transparent = false;
        mat.opacity = 1;
        mat.depthWrite = true;
      } else {
        // 페이드 구간에서는 투명 렌더링, 깊이 쓰기 비활성화
        mesh.visible = true;
        mat.transparent = true;
        mat.opacity = clamped;
        mat.depthWrite = false;
      }
      mat.depthTest = true;
    };

    applyFade('back', backWallRef.current, backMatRef.current);
    applyFade('front', frontWallRef.current, frontMatRef.current);
    applyFade('left', leftWallRef.current, leftMatRef.current);
    applyFade('right', rightWallRef.current, rightMatRef.current);
    applyFade('ceiling', ceilingRef.current, ceilingMatRef.current);
  });

  return (
    <group ref={roomRef}>
      {/* 바닥 - 두께가 있는 박스 형태 (상단 면이 y=0) */}
      <mesh position={[0, -floorThickness / 2, 0]} receiveShadow={receiveShadow} castShadow={false}>
        <boxGeometry args={[dims.width, floorThickness, dims.depth]} />
        <meshStandardMaterial color="#103B57" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* 벽들 - 흰색, 바닥에 완전히 붙여서 배치 */}
      {/* 뒤쪽 벽 */}
      <mesh ref={backWallRef} position={[0, height / 2, -halfDepth - wallThickness / 2]} receiveShadow={receiveShadow}>
        <boxGeometry args={[dims.width, height, wallThickness]} />
        <meshStandardMaterial ref={backMatRef} color="#ffffff" roughness={0.7} metalness={0.05} transparent opacity={1} />
      </mesh>

      {/* 왼쪽 벽 */}
      <mesh ref={leftWallRef} position={[-halfWidth - wallThickness / 2, height / 2, 0]} receiveShadow={receiveShadow}>
        <boxGeometry args={[wallThickness, height, dims.depth]} />
        <meshStandardMaterial ref={leftMatRef} color="#ffffff" roughness={0.7} metalness={0.05} transparent opacity={1} />
      </mesh>

      {/* 오른쪽 벽 */}
      <mesh ref={rightWallRef} position={[halfWidth + wallThickness / 2, height / 2, 0]} receiveShadow={receiveShadow}>
        <boxGeometry args={[wallThickness, height, dims.depth]} />
        <meshStandardMaterial ref={rightMatRef} color="#ffffff" roughness={0.7} metalness={0.05} transparent opacity={1} />
      </mesh>

      {/* 앞쪽 벽 (입구 쪽) */}
      <mesh ref={frontWallRef} position={[0, height / 2, halfDepth + wallThickness / 2]} receiveShadow={receiveShadow}>
        <boxGeometry args={[dims.width, height, wallThickness]} />
        <meshStandardMaterial ref={frontMatRef} color="#ffffff" roughness={0.7} metalness={0.05} transparent opacity={1} />
      </mesh>

      {/* 천장 */}
      <mesh
        ref={ceilingRef}
        position={[0, height, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow={receiveShadow}
      >
        <planeGeometry args={[dims.width, dims.depth]} />
        <meshStandardMaterial
          ref={ceilingMatRef}
          color="#f8fafc"
          roughness={0.9}
          metalness={0.02}
          transparent
          opacity={1}
        />
      </mesh>

















    </group>
  );
}
