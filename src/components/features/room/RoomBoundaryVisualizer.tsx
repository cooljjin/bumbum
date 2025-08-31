import React, { useMemo } from 'react';
import { Line, Html } from '@react-three/drei';
import { getRoomBoundaryPoints, getRoomBoundaries } from '../../../utils/roomBoundary';

interface RoomBoundaryVisualizerProps {
  visible?: boolean;
  color?: string;
  lineWidth?: number;
}

export default function RoomBoundaryVisualizer({ 
  visible = true, 
  color = '#ff6b6b', 
  lineWidth = 2 
}: RoomBoundaryVisualizerProps) {
  const boundaryPoints = useMemo(() => getRoomBoundaryPoints(), []);
  const boundaries = useMemo(() => getRoomBoundaries(), []);

  if (!visible) return null;

  return (
    <group>
      {/* 바닥 경계선 */}
      <Line
        points={boundaryPoints}
        color={color}
        lineWidth={lineWidth}
        dashed={false}
        transparent
        opacity={0.8}
      />
      
      {/* 경계 정보 표시 */}
      <group position={[0, 0.1, 0]}>
        {/* X축 경계 */}
        <Line
          points={[
            [boundaries.minX, 0, boundaries.minZ],
            [boundaries.maxX, 0, boundaries.minZ]
          ]}
          color="#ff6b6b"
          lineWidth={1}
          transparent
          opacity={0.6}
        />
        
        {/* Z축 경계 */}
        <Line
          points={[
            [boundaries.minX, 0, boundaries.minZ],
            [boundaries.minX, 0, boundaries.maxZ]
          ]}
          color="#4ecdc4"
          lineWidth={1}
          transparent
          opacity={0.6}
        />
      </group>
      
      {/* 경계 치수 표시 (HTML 오버레이) */}
      <Html position={[0, 0.2, 0]} center>
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}>
          {`${(boundaries.maxX - boundaries.minX).toFixed(1)}m × ${(boundaries.maxZ - boundaries.minZ).toFixed(1)}m`}
        </div>
      </Html>
    </group>
  );
}
