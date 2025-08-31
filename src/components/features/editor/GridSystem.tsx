import React, { useRef, useEffect } from 'react';

import { Grid, Plane } from '@react-three/drei';
import { useEditorStore } from '../../../store/editorStore';

interface GridSystemProps {
  size?: number;
  divisions?: number;
  color?: string;
  showGrid?: boolean;
}

export const GridSystem: React.FC<GridSystemProps> = ({
  size = 10,
  divisions = 10,
  color = '#888888',
  showGrid = true
}) => {
  const gridRef = useRef<any>(null);
  const planeRef = useRef<any>(null);

  const { showGrid: storeShowGrid, mode } = useEditorStore();

  // 그리드 설정 동기화
  useEffect(() => {
    if (gridRef.current && gridRef.current.material) {
      try {
        gridRef.current.material.color.setHex(color.replace('#', '0x'));
      } catch (error) {
        console.warn('Grid material color update failed:', error);
      }
    }
  }, [color]);

  // 그리드 크기 및 분할 동기화
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.args = [size, divisions];
    }
  }, [size, divisions]);

  // 그리드 가시성 동기화
  const isGridVisible = showGrid && storeShowGrid && mode === 'edit';

  // 그리드 스냅을 위한 투명한 평면 (레이캐스트용)
  const renderSnapPlane = () => {
    if (mode !== 'edit') return null;

    return (
      <Plane
        ref={planeRef}
        args={[size * 2, size * 2]}
        position={[0, 0.01, 0]} // 바닥보다 약간 위에 배치
        rotation={[-Math.PI / 2, 0, 0]} // 바닥과 평행하게
        visible={false} // 투명하게
        userData={{ type: 'snapPlane' }} // 식별용 데이터
      >
        <meshBasicMaterial transparent opacity={0} />
      </Plane>
    );
  };

  // 그리드 라인 렌더링
  const renderGridLines = () => {
    if (!isGridVisible) return null;

    return (
      <Grid
        ref={gridRef}
        args={[size, divisions]}
        cellSize={size / divisions}
        cellThickness={0.5}
        cellColor={color}
        sectionSize={size / divisions}
        sectionThickness={1}
        sectionColor={color}
        fadeDistance={size * 2}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
        position={[0, 0, 0]}
      />
    );
  };

  // 그리드 센터 라인 (더 진하게)
  const renderCenterLines = () => {
    if (!isGridVisible) return null;

    const centerColor = '#444444';
    const lineWidth = 2;

    return (
      <group>
        {/* X축 중심선 */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[size * 2, 0.01, lineWidth]} />
          <meshBasicMaterial color={centerColor} />
        </mesh>

        {/* Z축 중심선 */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[lineWidth, 0.01, size * 2]} />
          <meshBasicMaterial color={centerColor} />
        </mesh>
      </group>
    );
  };

  // 그리드 경계 표시
  const renderGridBoundary = () => {
    if (!isGridVisible) return null;

    const boundaryColor = '#666666';
    const boundaryWidth = 0.05;

    return (
      <group>
        {/* 경계선들 */}
        {[
          // 위쪽 경계
          { position: [0, 0.02, size / 2], size: [size, 0.01, boundaryWidth] },
          // 아래쪽 경계
          { position: [0, 0.02, -size / 2], size: [size, 0.01, boundaryWidth] },
          // 왼쪽 경계
          { position: [-size / 2, 0.02, 0], size: [boundaryWidth, 0.01, size] },
          // 오른쪽 경계
          { position: [size / 2, 0.02, 0], size: [boundaryWidth, 0.01, size] }
        ].map((boundary, index) => (
          <mesh key={index} position={boundary.position as [number, number, number]}>
            <boxGeometry args={boundary.size as [number, number, number]} />
            <meshBasicMaterial color={boundaryColor} />
          </mesh>
        ))}
      </group>
    );
  };

  // 스냅 포인트 표시 (개선된 시각적 피드백)
  const renderSnapPoints = () => {
    if (!isGridVisible || !storeShowGrid) return null;

    const snapPoints: React.ReactElement[] = [];
    const snapColor = '#4F46E5';
    const snapSize = 0.1;

    // 주요 스냅 포인트 생성 (중심, 모서리, 중간점)
    const points = [
      [0, 0.03, 0], // 중심
      [size / 2, 0.03, size / 2], // 우상단 모서리
      [-size / 2, 0.03, size / 2], // 좌상단 모서리
      [size / 2, 0.03, -size / 2], // 우하단 모서리
      [-size / 2, 0.03, -size / 2], // 좌하단 모서리
      [size / 4, 0.03, 0], // 우측 중간점
      [-size / 4, 0.03, 0], // 좌측 중간점
      [0, 0.03, size / 4], // 상단 중간점
      [0, 0.03, -size / 4] // 하단 중간점
    ];

    points.forEach((point, index) => {
      snapPoints.push(
        <mesh key={`snap-${index}`} position={point as [number, number, number]}>
          <sphereGeometry args={[snapSize, 8, 6]} />
          <meshBasicMaterial color={snapColor} transparent opacity={0.7} />
        </mesh>
      );
    });

    return <group>{snapPoints}</group>;
  };



  return (
    <group>
      {/* 스냅용 투명 평면 */}
      {renderSnapPlane()}

      {/* 메인 그리드 */}
      {renderGridLines()}

      {/* 중심선 */}
      {renderCenterLines()}

      {/* 경계선 */}
      {renderGridBoundary()}

      {/* 스냅 포인트 (개선된 시각적 피드백) */}
      {renderSnapPoints()}
    </group>
  );
};

export default GridSystem;
