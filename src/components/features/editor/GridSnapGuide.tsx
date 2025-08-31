import React, { useMemo } from 'react';
import { Line, Text } from '@react-three/drei';
import { Vector3 } from 'three';

interface GridSnapGuideProps {
  position: Vector3;
  gridSize: number;
  gridDivisions: number;
  isActive: boolean;
  visible: boolean;
}

export const GridSnapGuide: React.FC<GridSnapGuideProps> = ({
  position,
  gridSize,
  gridDivisions,
  isActive,
  visible
}) => {
  const cellSize = gridSize / gridDivisions;

  // 그리드 라인 생성
  const gridLines = useMemo(() => {
    if (!visible || !isActive) return [];

    const lines = [];
    const halfSize = gridSize / 2;
    const divisions = gridDivisions;

    // X축 그리드 라인 (Y-Z 평면)
    for (let i = 0; i <= divisions; i++) {
      const x = -halfSize + (i * cellSize);
      lines.push(
        <Line
          key={`x-${i}`}
          points={[
            [x, -halfSize, -halfSize],
            [x, -halfSize, halfSize],
            [x, halfSize, halfSize],
            [x, halfSize, -halfSize],
            [x, -halfSize, -halfSize]
          ]}
          color={isActive ? '#00ff00' : '#666666'}
          lineWidth={isActive ? 2 : 1}
          transparent
          opacity={0.6}
        />
      );
    }

    // Z축 그리드 라인 (X-Y 평면)
    for (let i = 0; i <= divisions; i++) {
      const z = -halfSize + (i * cellSize);
      lines.push(
        <Line
          key={`z-${i}`}
          points={[
            [-halfSize, -halfSize, z],
            [halfSize, -halfSize, z],
            [halfSize, halfSize, z],
            [-halfSize, halfSize, z],
            [-halfSize, -halfSize, z]
          ]}
          color={isActive ? '#00ff00' : '#666666'}
          lineWidth={isActive ? 2 : 1}
          transparent
          opacity={0.6}
        />
      );
    }

    return lines;
  }, [gridSize, gridDivisions, cellSize, isActive, visible]);

  // 스냅 정보 텍스트
  const snapInfo = useMemo(() => {
    if (!visible || !isActive) return null;

    return (
      <Text
        position={[0, gridSize / 2 + 0.5, 0]}
        fontSize={0.3}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
      >
        {`Grid: ${cellSize.toFixed(2)}m`}
      </Text>
    );
  }, [cellSize, isActive, visible, gridSize]);

  if (!visible) return null;

  return (
    <group position={position}>
      {/* 그리드 라인들 */}
      {gridLines}

      {/* 스냅 정보 */}
      {snapInfo}

      {/* 중심점 표시 */}
      {isActive && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      )}
    </group>
  );
};

export default GridSnapGuide;
