import React, { useRef, useEffect, useMemo } from 'react';

import { Grid, Plane } from '@react-three/drei';
import { useEditorStore } from '../../../store/editorStore';

interface GridSystemProps {
  size?: number;
  divisions?: number;
  color?: string;
  showGrid?: boolean;
  isEditMode?: boolean;
}

export const GridSystem: React.FC<GridSystemProps> = React.memo(({
  size = 10,
  divisions = 10,
  color = '#ffffff',
  showGrid = true,
  isEditMode = false
}) => {
  const gridRef = useRef<any>(null);
  const planeRef = useRef<any>(null);

  const { showGrid: storeShowGrid, mode } = useEditorStore();

  // 그리드 가시성 계산 (메모이제이션으로 최적화)
  const isGridVisible = useMemo(() => {
    return showGrid && storeShowGrid && (mode === 'edit' || isEditMode);
  }, [showGrid, storeShowGrid, mode, isEditMode]);

  // 그리드 설정 동기화 (최적화)
  useEffect(() => {
    if (gridRef.current && gridRef.current.material) {
      try {
        gridRef.current.material.color.setHex(color.replace('#', '0x'));
      } catch (error) {
        console.warn('Grid material color update failed:', error);
      }
    }
  }, [color]);

  // 그리드 크기 및 분할 동기화 (최적화)
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.args = [size, divisions];
    }
  }, [size, divisions]);

  // 그리드 가시성 제어 (깜빡거림 방지 및 부드러운 전환)
  useEffect(() => {
    if (gridRef.current && gridRef.current.material) {
      // 부드러운 페이드 인/아웃 효과
      const targetOpacity = isGridVisible ? 1 : 0;
      const currentOpacity = gridRef.current.material.opacity || 0;
      
      if (Math.abs(currentOpacity - targetOpacity) > 0.01) {
        const fadeSpeed = 0.1; // 페이드 속도 조절
        const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * fadeSpeed;
        
        gridRef.current.material.opacity = newOpacity;
        gridRef.current.material.transparent = true;
        gridRef.current.visible = newOpacity > 0.01;
        
        // 애니메이션 계속
        if (Math.abs(newOpacity - targetOpacity) > 0.01) {
          requestAnimationFrame(() => {
            if (gridRef.current && gridRef.current.material) {
              gridRef.current.material.opacity = targetOpacity;
              gridRef.current.visible = targetOpacity > 0.01;
            }
          });
        }
      }
    }
  }, [isGridVisible]);

  // 그리드 스냅을 위한 투명한 평면 (레이캐스트용) - 메모이제이션
  const renderSnapPlane = useMemo(() => {
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
  }, [mode, size]);

  // 그리드 라인 렌더링 (항상 렌더링하되 투명도로 제어) - 메모이제이션
  const renderGridLines = useMemo(() => {
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
        visible={true}
        material-transparent={true}
        material-opacity={isGridVisible ? 1 : 0}
      />
    );
  }, [size, divisions, color, isGridVisible]);

  // 그리드 센터 라인 제거됨 (불필요한 요소)

  // 그리드 경계 표시 제거됨 (불필요한 요소)

  // 스냅 포인트 표시 제거됨 (불필요한 요소)



  return (
    <group>
      {/* 스냅용 투명 평면 */}
      {renderSnapPlane}

      {/* 메인 그리드 - 항상 렌더링하되 투명도로 제어 */}
      {renderGridLines}
    </group>
  );
});

export default GridSystem;
