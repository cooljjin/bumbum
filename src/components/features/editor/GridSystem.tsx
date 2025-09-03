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
  color = '#ffffff',
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

  // 그리드 센터 라인 제거됨 (불필요한 요소)

  // 그리드 경계 표시 제거됨 (불필요한 요소)

  // 스냅 포인트 표시 제거됨 (불필요한 요소)



  return (
    <group>
      {/* 스냅용 투명 평면 */}
      {renderSnapPlane()}

      {/* 메인 그리드 */}
      {renderGridLines()}
    </group>
  );
};

export default GridSystem;
