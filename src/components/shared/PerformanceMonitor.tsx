import React, { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { performanceManager, PerformanceMetrics } from '../../utils/PerformanceManager';
import { memoryLeakDetector, MemorySnapshot } from '../../utils/memoryLeakDetector';
import PerformanceDashboard from './PerformanceDashboard';
import PerformanceVisualization from './PerformanceVisualization';

interface PerformanceMetricsExtended {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderCalls: number;
  triangles: number;
  points: number;
  lines: number;
  timestamp: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: [number, number, number];
  showDetails?: boolean;
  showDashboard?: boolean;
  showVisualization?: boolean;
  dashboardPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
  autoOptimize?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = true,
  position = [0, 0, 0],
  showDetails = false,
  showDashboard = true,
  showVisualization = false,
  dashboardPosition = 'top-right',
  compact = false,
  autoOptimize = true
}) => {
  const { gl, scene } = useThree();
  const [metrics, setMetrics] = useState<PerformanceMetricsExtended>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderCalls: 0,
    triangles: 0,
    points: 0,
    lines: 0,
    timestamp: Date.now()
  });

  const [performanceData, setPerformanceData] = useState<PerformanceMetricsExtended[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<any[]>([]);
  const [memorySnapshots, setMemorySnapshots] = useState<MemorySnapshot[]>([]);

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef<number[]>([]);
  const maxHistorySize = 60; // 1초간의 FPS 기록 (60fps 기준)

  // 초기화
  useEffect(() => {
    if (enabled) {
      // 성능 측정 시작
      performanceManager.startMeasurement();
      
      // 메모리 누수 감지기 초기화
      memoryLeakDetector.registerScene(scene);
      memoryLeakDetector.startMonitoring();

      // 자동 최적화 이벤트 리스너
      const handleAutoOptimize = (event: CustomEvent) => {
        if (autoOptimize) {
          // console.log('🚀 자동 최적화 실행:', event.type);
          performanceManager.optimizeScene(scene);
        }
      };

      // 메모리 누수 감지 이벤트 리스너
      const handleMemoryLeak = (event: CustomEvent) => {
        // console.warn('🚨 메모리 누수 감지:', event.detail);
        if (autoOptimize) {
          memoryLeakDetector.performAutoCleanup();
        }
      };

      // 이벤트 리스너 등록
      window.addEventListener('auto-optimize-low-fps', handleAutoOptimize as EventListener);
      window.addEventListener('auto-optimize-medium-fps', handleAutoOptimize as EventListener);
      window.addEventListener('auto-cleanup-memory', handleAutoOptimize as EventListener);
      window.addEventListener('memory-leak-detected', handleMemoryLeak as EventListener);

      return () => {
        // 정리
        performanceManager.stopMeasurement();
        memoryLeakDetector.stopMonitoring();
        window.removeEventListener('auto-optimize-low-fps', handleAutoOptimize as EventListener);
        window.removeEventListener('auto-optimize-medium-fps', handleAutoOptimize as EventListener);
        window.removeEventListener('auto-cleanup-memory', handleAutoOptimize as EventListener);
        window.removeEventListener('memory-leak-detected', handleMemoryLeak as EventListener);
      };
    }
  }, [enabled, autoOptimize, scene]);

  // FPS 계산 및 성능 메트릭 수집
  useFrame(() => {
    if (!enabled) return;

    // 통합된 PerformanceManager를 사용하여 성능 측정
    performanceManager.measureFrame(gl);

    // 현재 메트릭 가져오기
    const currentMetrics = performanceManager.getCurrentMetrics();
    if (currentMetrics) {
      const newMetrics: PerformanceMetricsExtended = {
        fps: currentMetrics.fps,
        frameTime: currentMetrics.frameTime,
        memoryUsage: currentMetrics.memoryUsage,
        renderCalls: currentMetrics.renderCalls,
        triangles: currentMetrics.triangles,
        points: currentMetrics.points,
        lines: currentMetrics.lines,
        timestamp: currentMetrics.timestamp
      };

      setMetrics(newMetrics);

      // 성능 데이터 히스토리 업데이트
      setPerformanceData(prev => {
        const updated = [...prev, newMetrics];
        return updated.slice(-100); // 최근 100개 데이터만 유지
      });

      // 성능 최적화 제안 생성
      const suggestions = performanceManager.getSuggestions();
      setOptimizationSuggestions(suggestions);

      // 메모리 스냅샷 업데이트
      const currentSnapshot = memoryLeakDetector.getCurrentSnapshot();
      if (currentSnapshot) {
        setMemorySnapshots(prev => {
          const updated = [...prev, currentSnapshot];
          return updated.slice(-50); // 최근 50개 스냅샷만 유지
        });
      }

      // 성능 경고 로그
      if (newMetrics.fps < 30) {
        // console.warn(`⚠️ 성능 경고: FPS가 낮습니다 (${newMetrics.fps}fps)`);
      }
      if (newMetrics.memoryUsage > 100) {
        // console.warn(`⚠️ 메모리 경고: 높은 메모리 사용량 (${newMetrics.memoryUsage}MB)`);
      }
    }
  });



  if (!enabled) return null;

  return (
    <>
      {/* 3D 성능 모니터 UI */}
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

      {/* 2D 대시보드 UI - Html 컴포넌트로 감싸기 */}
      {showDashboard && (
        <Html position={[0, 0, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <PerformanceDashboard
              enabled={enabled}
              position={dashboardPosition}
              compact={compact}
              showHistory={true}
              onOptimizationSuggestion={(suggestion) => {
                // console.log('최적화 제안:', suggestion);
                if (autoOptimize && suggestion.autoFixable && suggestion.fixFunction) {
                  suggestion.fixFunction();
                }
              }}
            />
          </div>
        </Html>
      )}

      {/* 성능 시각화 - Html 컴포넌트로 감싸기 */}
      {showVisualization && performanceData.length > 0 && (
        <Html position={[0, 0, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <PerformanceVisualization
              data={performanceData}
              width={400}
              height={200}
              showFPS={true}
              showMemory={true}
              showFrameTime={true}
              showRenderStats={true}
              timeRange={60000}
              autoScale={true}
              theme="dark"
            />
          </div>
        </Html>
      )}
    </>
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
