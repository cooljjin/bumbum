import React, { useMemo } from 'react';
import { Line, Text } from '@react-three/drei';
import { Vector3, Euler } from 'three';

interface RotationSnapGuideProps {
  position: Vector3;
  rotation: Euler;
  snapAngle: number;
  isActive: boolean;
  visible: boolean;
}

export const RotationSnapGuide: React.FC<RotationSnapGuideProps> = ({
  position,
  rotation,
  snapAngle,
  isActive,
  visible
}) => {
  const snapRadians = (snapAngle * Math.PI) / 180;

  // 회전 스냅 가이드 라인 생성
  const rotationGuides = useMemo(() => {
    if (!visible || !isActive) return [];

    const guides = [];
    const radius = 1.5;
    const divisions = Math.floor(360 / snapAngle);

    for (let i = 0; i < divisions; i++) {
      const angle = i * snapRadians;
      const startX = Math.cos(angle) * radius;
      const startZ = Math.sin(angle) * radius;
      const endX = Math.cos(angle) * (radius + 0.3);
      const endZ = Math.sin(angle) * (radius + 0.3);

      guides.push(
        <Line
          key={`rotation-${i}`}
          points={[
            [startX, 0, startZ],
            [endX, 0, endZ]
          ]}
          color="#0088ff"
          lineWidth={2}
          transparent
          opacity={0.8}
        />
      );
    }

    return guides;
  }, [snapAngle, snapRadians, isActive, visible]);

  // 회전 스냅 정보 텍스트
  const snapInfo = useMemo(() => {
    if (!visible || !isActive) return null;

    return (
      <Text
        position={[0, 2, 0]}
        fontSize={0.3}
        color="#0088ff"
        anchorX="center"
        anchorY="middle"
      >
        {`Rotation: ${snapAngle}°`}
      </Text>
    );
  }, [snapAngle, isActive, visible]);

  // 현재 회전 각도 표시
  const currentRotationInfo = useMemo(() => {
    if (!visible || !isActive) return null;

    const currentAngle = (rotation.y * 180) / Math.PI;
    const snappedAngle = Math.round(currentAngle / snapAngle) * snapAngle;

    return (
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {`Current: ${currentAngle.toFixed(1)}° → ${snappedAngle.toFixed(1)}°`}
      </Text>
    );
  }, [rotation.y, snapAngle, isActive, visible]);

  // 회전 원형 가이드
  const rotationCircle = useMemo(() => {
    if (!visible || !isActive) return null;

    const points: [number, number, number][] = [];
    const radius = 1.5;
    const segments = 64;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      points.push([x, 0, z]);
    }

    return (
      <Line
        points={points}
        color="#0088ff"
        lineWidth={1}
        transparent
        opacity={0.4}
      />
    );
  }, [isActive, visible]);

  if (!visible) return null;

  return (
    <group position={position}>
      {/* 회전 원형 가이드 */}
      {rotationCircle}

      {/* 회전 스냅 가이드 라인들 */}
      {rotationGuides}

      {/* 스냅 정보 */}
      {snapInfo}

      {/* 현재 회전 정보 */}
      {currentRotationInfo}

      {/* 중심점 표시 */}
      {isActive && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#0088ff" />
        </mesh>
      )}
    </group>
  );
};

export default RotationSnapGuide;
