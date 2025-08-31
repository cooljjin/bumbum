import React, { useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderCalls: number;
  triangles: number;
  points: number;
  lines: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: [number, number, number];
  showDetails?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = true,
  position = [0, 0, 0],
  showDetails = false
}) => {
  const { gl } = useThree();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderCalls: 0,
    triangles: 0,
    points: 0,
    lines: 0
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef<number[]>([]);
  const maxHistorySize = 60; // 1초간의 FPS 기록 (60fps 기준)

  // FPS 계산 및 성능 메트릭 수집
  useFrame(() => {
    if (!enabled) return;

    frameCount.current++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime.current;

    // 1초마다 FPS 계산
    if (deltaTime >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / deltaTime);
      
      // FPS 히스토리 업데이트
      fpsHistory.current.push(fps);
      if (fpsHistory.current.length > maxHistorySize) {
        fpsHistory.current.shift();
      }

      // 평균 FPS 계산
      const avgFps = Math.round(
        fpsHistory.current.reduce((sum, f) => sum + f, 0) / fpsHistory.current.length
      );

      // 메모리 사용량 추적
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0;

      // 렌더링 통계 수집
      const rendererInfo = gl.info;
      const renderCalls = rendererInfo.render.calls;
      const triangles = rendererInfo.render.triangles;
      const points = rendererInfo.render.points;
      const lines = rendererInfo.render.lines;

      setMetrics({
        fps: avgFps,
        frameTime: Math.round(deltaTime / frameCount.current),
        memoryUsage,
        renderCalls,
        triangles,
        points,
        lines
      });

      // 성능 경고 로그
      if (avgFps < 30) {
        console.warn(`⚠️ 성능 경고: FPS가 낮습니다 (${avgFps}fps)`);
      }
      if (memoryUsage > 100) {
        console.warn(`⚠️ 메모리 경고: 높은 메모리 사용량 (${memoryUsage}MB)`);
      }

      // 카운터 리셋
      frameCount.current = 0;
      lastTime.current = currentTime;
    }
  });



  if (!enabled) return null;

  return (
    <group position={position}>
      {/* 성능 모니터 UI */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial 
          color={metrics.fps >= 50 ? '#00ff00' : metrics.fps >= 30 ? '#ffff00' : '#ff0000'} 
          transparent 
          opacity={0.8} 
        />
      </mesh>

      {/* 성능 정보 텍스트 (3D 공간에 표시) */}
      {showDetails && (
        <group position={[0, 0.2, 0]}>
          {/* FPS 표시 */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.8, 0.05, 0.01]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.7} />
          </mesh>
          
          {/* 메모리 사용량 표시 */}
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.8, 0.05, 0.01]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// 성능 최적화 유틸리티 함수들
export const performanceUtils = {
  // 객체 LOD 레벨 계산
  calculateLODLevel: (distance: number, maxDistance: number = 10): number => {
    if (distance < maxDistance * 0.3) return 0; // 고품질
    if (distance < maxDistance * 0.6) return 1; // 중간 품질
    return 2; // 저품질
  },

  // 메모리 사용량 최적화
  optimizeMemory: (scene: THREE.Scene): void => {
    // 사용하지 않는 텍스처 제거
    const textures = new Set<THREE.Texture>();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
        if (material.map) textures.add(material.map);
        if (material.normalMap) textures.add(material.normalMap);
        if (material.roughnessMap) textures.add(material.roughnessMap);
      }
    });

    // 사용되지 않는 텍스처 메모리 해제
    textures.forEach(texture => {
      if (texture.image && texture.image.src) {
        texture.dispose();
      }
    });
  },

  // 렌더링 최적화
  optimizeRendering: (scene: THREE.Scene): void => {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Frustum culling 활성화
        object.frustumCulled = true;
        
        // 그림자 설정 최적화
        if (object.position.y > 0.1) {
          object.castShadow = true;
        }
        object.receiveShadow = true;
      }
    });
  }
};

export default PerformanceMonitor;
