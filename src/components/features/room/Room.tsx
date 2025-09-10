'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { getCurrentRoomDimensions } from '../../../utils/roomBoundary';

interface RoomProps {
  receiveShadow?: boolean;
  floorTexturePath?: string;
  wallTexturePath?: string;
}

export default function Room({ receiveShadow = false, floorTexturePath, wallTexturePath }: RoomProps) {
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

  // 성능 최적화를 위한 카메라 위치 추적
  const lastCamPos = useRef<THREE.Vector3>(new THREE.Vector3());

  // 카메라에서 가장 가까운 벽을 숨겨 내부가 보이도록 처리 (부드러운 페이드)
  useFrame(() => {
    const cam = camera.position;

    // 성능 최적화: 카메라 위치가 크게 변하지 않았으면 스킵
    if (lastCamPos.current.distanceTo(cam) < 0.1) return;
    lastCamPos.current.copy(cam);

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

  // 바닥 텍스처 로드
  const defaultFloorTexture = useLoader(THREE.TextureLoader, '/models/floor/floor_wooden.png');
  const customFloorTexture = floorTexturePath && floorTexturePath !== '/models/floor/floor_wooden.png'
    ? useLoader(THREE.TextureLoader, floorTexturePath)
    : null;

  // 실제 사용할 바닥 텍스처 선택
  const floorTexture = customFloorTexture || defaultFloorTexture;

  // 벽 텍스처 로드
  const defaultWallTexture = useLoader(THREE.TextureLoader, '/models/wall/wall_beige.png');
  const customWallTexture = wallTexturePath && wallTexturePath !== '/models/wall/wall_beige.png'
    ? useLoader(THREE.TextureLoader, wallTexturePath)
    : null;

  // 실제 사용할 벽 텍스처 선택
  const wallTexture = customWallTexture || defaultWallTexture;

  // 각 벽면에 맞는 텍스처 생성
  const wallTextures = useMemo(() => {
    if (!wallTexture) return null;

    // 각 벽면에 맞는 텍스처 복제본 생성
    const createWallTexture = (width: number, height: number) => {
      const clonedTexture = wallTexture.clone();

      // 텍스처 반복을 정수로 맞춰서 경계 자연스럽게 연결
      clonedTexture.wrapS = THREE.RepeatWrapping;
      clonedTexture.wrapT = THREE.RepeatWrapping;

      // 더 세밀한 반복으로 경계 자연스럽게 연결
      const baseRepeatSize = 1.0; // 더 작은 기본 반복 크기
      const horizontalRepeat = Math.max(2, Math.round(width / baseRepeatSize));
      const verticalRepeat = Math.max(2, Math.round(height / baseRepeatSize));

      clonedTexture.repeat.set(horizontalRepeat, verticalRepeat);

      // 아주 미세한 랜덤 오프셋으로 반복 경계 시각적으로 숨기기
      const randomOffsetX = (Math.random() - 0.5) * 0.01; // -0.005 ~ 0.005
      const randomOffsetY = (Math.random() - 0.5) * 0.01; // -0.005 ~ 0.005
      clonedTexture.offset.set(randomOffsetX, randomOffsetY);

      // 텍스처 필터링 개선 (경계 부드럽게)
      clonedTexture.magFilter = THREE.LinearFilter;
      clonedTexture.minFilter = THREE.LinearMipmapLinearFilter;
      clonedTexture.generateMipmaps = true;
      clonedTexture.needsUpdate = true;

      return clonedTexture;
    };

    return {
      back: createWallTexture(dims.width, dims.height),    // 뒤쪽 벽
      front: createWallTexture(dims.width, dims.height),   // 앞쪽 벽
      left: createWallTexture(dims.depth, dims.height),    // 왼쪽 벽
      right: createWallTexture(dims.depth, dims.height)    // 오른쪽 벽
    };
  }, [wallTexture, dims.width, dims.depth, dims.height]);

  // 텍스처 반복 설정 (방 크기에 맞게 반복)
  useMemo(() => {
    if (floorTexture) {
      floorTexture.wrapS = THREE.RepeatWrapping;
      floorTexture.wrapT = THREE.RepeatWrapping;
      // 방 크기에 따라 반복 횟수 설정 (예: 10x10 방에 4x4 반복)
      const repeatCount = Math.max(1, Math.floor(dims.width / 2.5));
      floorTexture.repeat.set(repeatCount, repeatCount);
      floorTexture.needsUpdate = true;
    }
  }, [floorTexture, dims.width, dims.depth]);

  return (
    <group ref={roomRef}>
      {/* 바닥 - 텍스처 적용된 평면 형태 */}
      <mesh position={[0, -floorThickness / 2, 0]} receiveShadow={receiveShadow} castShadow={false} raycast={() => undefined}>
        <boxGeometry args={[dims.width, floorThickness, dims.depth]} />
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.8}
          metalness={0.1}
          color="#ffffff" // 텍스처에 색상 적용하지 않음
        />
      </mesh>

      {/* 벽들 - 평면 지오메트리로 정확한 UV 매핑 및 개별 텍스처 적용 */}
      {/* 뒤쪽 벽 */}
      <mesh ref={backWallRef} position={[0, height / 2, -halfDepth]} receiveShadow={receiveShadow} raycast={() => undefined}>
        <planeGeometry args={[dims.width, height]} />
        <meshStandardMaterial
          ref={backMatRef}
          map={wallTextures?.back}
          roughness={0.7}
          metalness={0.05}
          transparent
          opacity={1}
        />
      </mesh>

      {/* 왼쪽 벽 */}
      <mesh ref={leftWallRef} position={[-halfWidth, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow={receiveShadow} raycast={() => undefined}>
        <planeGeometry args={[dims.depth, height]} />
        <meshStandardMaterial
          ref={leftMatRef}
          map={wallTextures?.left}
          roughness={0.7}
          metalness={0.05}
          transparent
          opacity={1}
        />
      </mesh>

      {/* 오른쪽 벽 */}
      <mesh ref={rightWallRef} position={[halfWidth, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow={receiveShadow} raycast={() => undefined}>
        <planeGeometry args={[dims.depth, height]} />
        <meshStandardMaterial
          ref={rightMatRef}
          map={wallTextures?.right}
          roughness={0.7}
          metalness={0.05}
          transparent
          opacity={1}
        />
      </mesh>

      {/* 앞쪽 벽 (입구 쪽) */}
      <mesh ref={frontWallRef} position={[0, height / 2, halfDepth]} rotation={[0, Math.PI, 0]} receiveShadow={receiveShadow} raycast={() => undefined}>
        <planeGeometry args={[dims.width, height]} />
        <meshStandardMaterial
          ref={frontMatRef}
          map={wallTextures?.front}
          roughness={0.7}
          metalness={0.05}
          transparent
          opacity={1}
        />
      </mesh>

      {/* 천장 */}
      <mesh
        ref={ceilingRef}
        position={[0, height, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow={receiveShadow}
        raycast={() => undefined}
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
