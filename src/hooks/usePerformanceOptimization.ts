import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Vector3, Frustum, Matrix4, Camera, Object3D } from 'three';

// LOD 레벨 설정
export interface LODSettings {
  near: number;      // 고품질 렌더링 거리
  medium: number;    // 중간 품질 렌더링 거리
  far: number;       // 저품질 렌더링 거리
  cull: number;      // 렌더링 제외 거리
}

// 성능 모니터링 데이터
export interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  objectCount: number;
  visibleObjects: number;
}

// 기본 LOD 설정
const DEFAULT_LOD_SETTINGS: LODSettings = {
  near: 5,      // 5m 이내: 고품질
  medium: 15,   // 15m 이내: 중간 품질
  far: 30,      // 30m 이내: 저품질
  cull: 50      // 50m 이상: 렌더링 제외
};

/**
 * 🚀 성능 최적화 커스텀 훅
 * LOD 시스템, 프러스텀 컬링, 성능 모니터링을 제공
 */
export function usePerformanceOptimization(
  lodSettings: LODSettings = DEFAULT_LOD_SETTINGS,
  enableMonitoring: boolean = true
) {
  const { camera, gl, scene } = useThree();

  // 성능 메트릭 상태
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
    memoryUsage: 0,
    objectCount: 0,
    visibleObjects: 0
  });

  // 프러스텀 컬링을 위한 참조
  const frustum = useRef(new Frustum());
  const matrix = useRef(new Matrix4());

  // 성능 측정을 위한 참조
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const renderStartTime = useRef(0);

  /**
   * 🎯 LOD 레벨 계산
   * 카메라와 객체 간의 거리에 따른 품질 레벨 결정
   */
  const calculateLODLevel = useCallback((objectPosition: Vector3): 'high' | 'medium' | 'low' | 'cull' => {
    const distance = camera.position.distanceTo(objectPosition);

    if (distance <= lodSettings.near) return 'high';
    if (distance <= lodSettings.medium) return 'medium';
    if (distance <= lodSettings.far) return 'low';
    return 'cull';
  }, [camera.position, lodSettings]);

  /**
   * 👁️ 프러스텀 컬링 체크
   * 화면 밖 객체인지 확인
   */
  const isInFrustum = useCallback((object: Object3D): boolean => {
    // 카메라 뷰 매트릭스 업데이트
    matrix.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.current.setFromProjectionMatrix(matrix.current);

    // 객체의 바운딩 박스가 프러스텀 내에 있는지 확인
    return frustum.current.intersectsObject(object);
  }, [camera]);

  /**
   * 🧹 메모리 정리
   * 사용하지 않는 텍스처와 지오메트리 dispose
   */
  const cleanupMemory = useCallback(() => {
    // 씬의 모든 객체를 순회하며 메모리 정리
    scene.traverse((object) => {
      if ('geometry' in object && object.geometry) {
        // 지오메트리가 사용되지 않는 경우 dispose
        const geometry = object.geometry as THREE.BufferGeometry;
        if (geometry.userData?.['disposeAfter'] === true) {
          geometry.dispose();
        }
      }

      if ('material' in object && object.material) {
        // 텍스처가 사용되지 않는 경우 dispose
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => {
            const material = mat as THREE.MeshStandardMaterial;
            if ('map' in material && material.map && material.map.userData?.['disposeAfter'] === true) {
              material.map.dispose();
            }
          });
        } else {
          const material = object.material as THREE.MeshStandardMaterial;
          if ('map' in material && material.map && material.map.userData?.['disposeAfter'] === true) {
            material.map.dispose();
          }
        }
      }
    });

    // WebGL 컨텍스트 강제 정리
    gl.getContext()?.getExtension('WEBGL_lose_context')?.loseContext();

    // console.log('🧹 메모리 정리 완료');
  }, [scene, gl]);

  /**
   * 📊 성능 메트릭 업데이트
   */
  const updatePerformanceMetrics = useCallback(() => {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime.current;

    if (deltaTime >= 1000) { // 1초마다 업데이트
      const fps = Math.round((frameCount.current * 1000) / deltaTime);
      const renderTime = renderStartTime.current ? currentTime - renderStartTime.current : 0;

      // 메모리 사용량 (간단한 추정)
      const memoryUsage = 0; // WebGL 메모리 정보는 복잡하므로 간단하게 처리

      // 객체 개수 계산
      let objectCount = 0;
      let visibleObjects = 0;

      scene.traverse((object) => {
        objectCount++;
        if (object.visible) visibleObjects++;
      });

      setMetrics({
        fps,
        renderTime: Math.round(renderTime),
        memoryUsage,
        objectCount,
        visibleObjects
      });

      frameCount.current = 0;
      lastTime.current = currentTime;
    }

    frameCount.current++;
  }, [gl, scene]);

  /**
   * ⚡ 동적 품질 조절
   * 성능에 따른 자동 LOD 레벨 조절
   */
  const adjustQualityDynamically = useCallback(() => {
    const { fps } = metrics;

    // FPS가 낮을 때 자동으로 LOD 레벨 조절
    if (fps < 30) {
      // 거리 임계값을 줄여서 더 많은 객체를 저품질로 렌더링
      const adjustedSettings: LODSettings = {
        near: Math.max(2, lodSettings.near * 0.7),
        medium: Math.max(8, lodSettings.medium * 0.8),
        far: Math.max(20, lodSettings.far * 0.9),
        cull: Math.max(35, lodSettings.cull * 0.9)
      };

      // console.log('⚡ 성능 저하 감지, LOD 레벨 자동 조절:', adjustedSettings);
      return adjustedSettings;
    }

    return lodSettings;
  }, [metrics, lodSettings]);

  /**
   * 🎮 useFrame 최적화
   * 렌더링 루프에서 성능 최적화 적용
   */
  useFrame(() => {
    if (enableMonitoring) {
      renderStartTime.current = performance.now();
      updatePerformanceMetrics();
    }
  });

  /**
   * 🔄 프러스텀 컬링 적용
   * 화면 밖 객체의 렌더링 제외
   */
  const applyFrustumCulling = useCallback((objects: Object3D[]) => {
    return objects.filter(obj => isInFrustum(obj));
  }, [isInFrustum]);

  /**
   * 📈 성능 통계 반환
   */
  const getPerformanceStats = useCallback(() => {
    const currentSettings = adjustQualityDynamically();

    return {
      metrics,
      lodSettings: currentSettings,
      recommendations: {
        shouldReduceQuality: metrics.fps < 30,
        shouldCleanupMemory: metrics.memoryUsage > 1000000, // 1MB 이상
        shouldReduceObjectCount: metrics.objectCount > 1000
      }
    };
  }, [metrics, adjustQualityDynamically]);

  // 컴포넌트 언마운트 시 메모리 정리
  useEffect(() => {
    return () => {
      if (enableMonitoring) {
        cleanupMemory();
      }
    };
  }, [cleanupMemory, enableMonitoring]);

  return {
    // LOD 시스템
    calculateLODLevel,
    adjustQualityDynamically,

    // 프러스텀 컬링
    isInFrustum,
    applyFrustumCulling,

    // 성능 모니터링
    metrics,
    getPerformanceStats,

    // 메모리 관리
    cleanupMemory,

    // 설정
    lodSettings: adjustQualityDynamically()
  };
}

/**
 * 🎯 간단한 LOD 훅
 * 기본적인 거리 기반 LOD만 필요한 경우 사용
 */
export function useSimpleLOD(camera: Camera, settings: Partial<LODSettings> = {}) {
  const mergedSettings = { ...DEFAULT_LOD_SETTINGS, ...settings };

  const getLODLevel = useCallback((position: Vector3) => {
    const distance = camera.position.distanceTo(position);

    if (distance <= mergedSettings.near) return 'high';
    if (distance <= mergedSettings.medium) return 'medium';
    if (distance <= mergedSettings.far) return 'low';
    return 'cull';
  }, [camera.position, mergedSettings]);

  return { getLODLevel, settings: mergedSettings };
}

/**
 * 📊 성능 모니터링 전용 훅
 * LOD 없이 성능만 모니터링하고 싶은 경우 사용
 */
export function usePerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [renderTime, setRenderTime] = useState(0);

  useFrame((_, delta) => {
    // FPS 계산
    if (delta > 0) {
      const currentFps = Math.round(1 / delta);
      setFps(currentFps);
    }

    // 렌더링 시간 측정
    setRenderTime(Math.round(delta * 1000));
  });

  return { fps, renderTime };
}
