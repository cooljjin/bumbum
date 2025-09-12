'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { getCurrentRoomDimensions } from '../../../utils/roomBoundary';
import { useWallFades } from '../../../store/wallVisibilityStore';
import { patchObjectWithWallFade, setWallFadeValue, applyFadeFlagsToObject } from '@/lib/wallFadeShader';
import { setVisibleWalls, setWallFades } from '../../../store/wallVisibilityStore';

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

  const wallFades = useWallFades();

  // Store-driven fade application (values computed by WallFadeController)
  useFrame(() => {
    // 최초 1회 패치 보장
    if (backWallRef.current) patchObjectWithWallFade(backWallRef.current, 'minZ');
    if (frontWallRef.current) patchObjectWithWallFade(frontWallRef.current, 'maxZ');
    if (leftWallRef.current) patchObjectWithWallFade(leftWallRef.current, 'minX');
    if (rightWallRef.current) patchObjectWithWallFade(rightWallRef.current, 'maxX');

    const fMinZ = wallFades.minZ ?? 1; setWallFadeValue('minZ', fMinZ); applyFadeFlagsToObject(backWallRef.current, fMinZ);
    const fMaxZ = wallFades.maxZ ?? 1; setWallFadeValue('maxZ', fMaxZ); applyFadeFlagsToObject(frontWallRef.current, fMaxZ);
    const fMinX = wallFades.minX ?? 1; setWallFadeValue('minX', fMinX); applyFadeFlagsToObject(leftWallRef.current, fMinX);
    const fMaxX = wallFades.maxX ?? 1; setWallFadeValue('maxX', fMaxX); applyFadeFlagsToObject(rightWallRef.current, fMaxX);

    // 천장 처리는 기존 로직 유지(요구 범위 밖): 카메라 높이에 따라 보이기/숨기기
    const camY = camera.position.y;
    const targetCeil = camY > height + 0.01 ? 0 : 1;
    const current = fadeRef.current.ceiling ?? 1;
    const ease = 0.15;
    fadeRef.current.ceiling = current + (targetCeil - current) * ease;
    // 천장엔 유니폼 패치를 적용하지 않으므로 플래그/opacity만 동기화
    applyFadeFlagsToObject(ceilingRef.current, fadeRef.current.ceiling);
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
