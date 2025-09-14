import { useRef, useCallback, useMemo } from 'react';
import { Vector3, Euler } from 'three';

/**
 * 가구 편집 성능 최적화를 위한 커스텀 훅
 */
export function useFurnitureOptimization() {
  const lastUpdateTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const isThrottling = useRef<boolean>(false);

  /**
   * 프레임 기반 스로틀링
   * 30fps로 제한하여 성능 최적화
   */
  const shouldUpdate = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastUpdateTime.current;
    
    // 33ms (30fps) 간격으로 업데이트 제한
    if (deltaTime < 33) {
      return false;
    }
    
    lastUpdateTime.current = now;
    return true;
  }, []);

  /**
   * 배치 업데이트를 위한 디바운스
   */
  const createDebouncedUpdate = useCallback(
    <T extends (...args: any[]) => void>(
      updateFn: T,
      delay: number = 16
    ) => {
      let timeoutId: NodeJS.Timeout;
      
      return ((...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => updateFn(...args), delay);
      }) as T;
    },
    []
  );

  /**
   * 벡터 비교 최적화
   */
  const vectorsEqual = useCallback((a: Vector3, b: Vector3, tolerance: number = 0.001): boolean => {
    return Math.abs(a.x - b.x) < tolerance &&
           Math.abs(a.y - b.y) < tolerance &&
           Math.abs(a.z - b.z) < tolerance;
  }, []);

  /**
   * 오일러 각도 비교 최적화
   */
  const eulersEqual = useCallback((a: Euler, b: Euler, tolerance: number = 0.001): boolean => {
    return Math.abs(a.x - b.x) < tolerance &&
           Math.abs(a.y - b.y) < tolerance &&
           Math.abs(a.z - b.z) < tolerance;
  }, []);

  /**
   * 성능 모니터링
   */
  const performanceMetrics = useMemo(() => ({
    frameCount: frameCount.current,
    isThrottling: isThrottling.current,
    lastUpdateTime: lastUpdateTime.current
  }), []);

  /**
   * 프레임 카운터 증가
   */
  const incrementFrameCount = useCallback(() => {
    frameCount.current++;
  }, []);

  /**
   * 스로틀링 상태 설정
   */
  const setThrottling = useCallback((throttling: boolean) => {
    isThrottling.current = throttling;
  }, []);

  return {
    shouldUpdate,
    createDebouncedUpdate,
    vectorsEqual,
    eulersEqual,
    performanceMetrics,
    incrementFrameCount,
    setThrottling
  };
}

/**
 * 메모리 사용량 최적화를 위한 유틸리티
 */
export function useMemoryOptimization() {
  const cleanupFunctions = useRef<Array<() => void>>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  const cleanup = useCallback(() => {
    cleanupFunctions.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.warn('Cleanup function error:', error);
      }
    });
    cleanupFunctions.current = [];
  }, []);

  const cleanupOnUnmount = useCallback(() => {
    return cleanup;
  }, [cleanup]);

  return {
    addCleanup,
    cleanup,
    cleanupOnUnmount
  };
}
