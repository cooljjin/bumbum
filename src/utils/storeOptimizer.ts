// Zustand 스토어 성능 최적화 유틸리티

import { performanceMonitor } from './performanceMonitor';

// 스토어 성능 최적화를 위한 설정
interface OptimizationConfig {
  enableShallowComparison: boolean;
  enableBatchUpdates: boolean;
  enableMemoryOptimization: boolean;
  maxHistorySize: number;
  updateDebounceDelay: number;
}

// 기본 최적화 설정
const defaultConfig: OptimizationConfig = {
  enableShallowComparison: true,
  enableBatchUpdates: true,
  enableMemoryOptimization: true,
  maxHistorySize: 30,
  updateDebounceDelay: 16
};

// 스토어 최적화 클래스
class StoreOptimizer {
  private config: OptimizationConfig;
  private updateQueue: Map<string, Function> = new Map();
  private isProcessingQueue = false;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // 얕은 비교를 통한 불필요한 업데이트 방지
  shallowEqual<T>(a: T, b: T): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      const keysA = Object.keys(a as object);
      const keysB = Object.keys(b as object);

      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if ((a as any)[key] !== (b as any)[key]) return false;
      }

      return true;
    }

    return false;
  }

  // 깊은 비교를 통한 불필요한 업데이트 방지
  deepEqual<T>(a: T, b: T): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, index) => this.deepEqual(val, b[index]));
    }

    if (typeof a === 'object') {
      const keysA = Object.keys(a as object);
      const keysB = Object.keys(b as object);

      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual((a as any)[key], (b as any)[key])) return false;
      }

      return true;
    }

    return false;
  }

  // 선택적 비교 함수 (설정에 따라 얕은 비교 또는 깊은 비교)
  compareValues<T>(a: T, b: T): boolean {
    return this.config.enableShallowComparison 
      ? this.shallowEqual(a, b) 
      : this.deepEqual(a, b);
  }

  // 배치 업데이트를 위한 큐 시스템
  queueUpdate<T extends (...args: any[]) => any>(
    key: string,
    updateFn: T,
    ...args: Parameters<T>
  ): void {
    if (!this.config.enableBatchUpdates) {
      updateFn(...args);
      return;
    }

    this.updateQueue.set(key, () => updateFn(...args));

    if (!this.isProcessingQueue) {
      this.processUpdateQueue();
    }
  }

  // 업데이트 큐 처리
  private processUpdateQueue(): void {
    if (this.updateQueue.size === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;

    // requestAnimationFrame을 사용하여 다음 프레임에서 처리
    requestAnimationFrame(() => {
      const updates = Array.from(this.updateQueue.values());
      this.updateQueue.clear();

      // 성능 측정
      const startTime = performance.now();
      
      updates.forEach(update => {
        try {
          update();
        } catch (error) {
          console.error('배치 업데이트 실행 중 오류:', error);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 성능 모니터링에 기록
      performanceMonitor.recordUpdateTime('batch-update', duration);

      this.isProcessingQueue = false;

      // 큐에 새로운 업데이트가 있다면 다시 처리
      if (this.updateQueue.size > 0) {
        this.processUpdateQueue();
      }
    });
  }

  // 메모리 최적화를 위한 히스토리 관리
  optimizeHistory<T>(history: T[], maxSize: number = this.config.maxHistorySize): T[] {
    if (!this.config.enableMemoryOptimization) return history;

    if (history.length <= maxSize) return history;

    // 가장 오래된 항목들을 제거
    return history.slice(-maxSize);
  }

  // 객체 참조 최적화
  optimizeObjectReferences<T extends Record<string, any>>(obj: T): T {
    if (!this.config.enableMemoryOptimization) return obj;

    const optimized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && typeof value === 'object') {
        // 중첩된 객체는 재귀적으로 최적화
        optimized[key] = this.optimizeObjectReferences(value);
      } else {
        optimized[key] = value;
      }
    }

    return optimized;
  }

  // 배열 최적화
  optimizeArray<T>(arr: T[]): T[] {
    if (!this.config.enableMemoryOptimization) return arr;

    // 불필요한 null/undefined 값 제거
    return arr.filter(item => item != null);
  }

  // 메모리 사용량 체크 및 정리
  checkMemoryUsage(): { used: number; total: number; percentage: number } {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize;
      const total = memory.jsHeapSizeLimit;
      const percentage = (used / total) * 100;

      // 메모리 사용량이 80%를 초과하면 경고
      if (percentage > 80) {
        console.warn(`⚠️ 높은 메모리 사용량: ${percentage.toFixed(2)}%`);
        this.suggestMemoryCleanup();
      }

      return { used, total, percentage };
    }

    return { used: 0, total: 0, percentage: 0 };
  }

  // 메모리 정리 제안
  private suggestMemoryCleanup(): void {
    // console.log('💡 메모리 정리 제안:');
    // console.log('  - 불필요한 히스토리 항목 제거');
    // console.log('  - 큰 객체 참조 해제');
    // console.log('  - 캐시된 데이터 정리');
  }

  // 성능 최적화된 상태 업데이트 함수 생성
  createOptimizedUpdater<T>(
    originalUpdater: (updates: Partial<T>) => void,
    storeName: string
  ) {
    return (updates: Partial<T>) => {
      // 성능 측정
      const startTime = performance.now();

      try {
        // 원본 업데이터 실행
        originalUpdater(updates);

        const endTime = performance.now();
        const duration = endTime - startTime;

        // 성능 모니터링에 기록
        performanceMonitor.recordUpdateTime(storeName, duration);

        // 느린 업데이트 경고
        if (duration > 16) { // 60fps 기준
          console.warn(`⚠️ 느린 상태 업데이트: ${storeName} - ${duration.toFixed(2)}ms`);
        }
      } catch (error) {
        console.error(`상태 업데이트 중 오류 발생: ${storeName}`, error);
      }
    };
  }

  // 디바운스된 업데이트 함수 생성
  createDebouncedUpdater<T>(
    originalUpdater: (updates: Partial<T>) => void,
    delay: number = this.config.updateDebounceDelay
  ) {
    let timeoutId: NodeJS.Timeout;
    
    return (updates: Partial<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        originalUpdater(updates);
      }, delay);
    };
  }

  // 쓰로틀된 업데이트 함수 생성
  createThrottledUpdater<T>(
    originalUpdater: (updates: Partial<T>) => void,
    limit: number = this.config.updateDebounceDelay
  ) {
    let inThrottle = false;
    
    return (updates: Partial<T>) => {
      if (!inThrottle) {
        originalUpdater(updates);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  // 설정 업데이트
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // console.log('🔧 스토어 최적화 설정 업데이트:', this.config);
  }

  // 현재 설정 가져오기
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  // 성능 통계 생성
  generatePerformanceStats(): string {
    const memoryUsage = this.checkMemoryUsage();
    const queueSize = this.updateQueue.size;
    
    let stats = '📊 스토어 최적화 통계\n';
    stats += '='.repeat(30) + '\n';
    stats += `메모리 사용량: ${(memoryUsage.used / 1024 / 1024).toFixed(2)}MB\n`;
    stats += `메모리 사용률: ${memoryUsage.percentage.toFixed(2)}%\n`;
    stats += `업데이트 큐 크기: ${queueSize}\n`;
    stats += `배치 업데이트: ${this.config.enableBatchUpdates ? '활성화' : '비활성화'}\n`;
    stats += `얕은 비교: ${this.config.enableShallowComparison ? '활성화' : '비활성화'}\n`;
    stats += `메모리 최적화: ${this.config.enableMemoryOptimization ? '활성화' : '비활성화'}\n`;
    
    return stats;
  }

  // 최적화 권장사항 생성
  generateOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const memoryUsage = this.checkMemoryUsage();

    if (memoryUsage.percentage > 80) {
      suggestions.push('메모리 사용량이 높습니다. 히스토리 크기를 줄이거나 불필요한 객체를 정리하세요.');
    }

    if (this.updateQueue.size > 10) {
      suggestions.push('업데이트 큐가 큽니다. 업데이트 빈도를 줄이거나 배치 크기를 조정하세요.');
    }

    if (!this.config.enableBatchUpdates) {
      suggestions.push('배치 업데이트를 활성화하여 성능을 향상시킬 수 있습니다.');
    }

    if (!this.config.enableShallowComparison) {
      suggestions.push('얕은 비교를 활성화하여 비교 성능을 향상시킬 수 있습니다.');
    }

    return suggestions;
  }
}

// 싱글톤 인스턴스 생성
export const storeOptimizer = new StoreOptimizer();

// 편의 함수들
export const createOptimizedUpdater = <T>(
  originalUpdater: (updates: Partial<T>) => void,
  storeName: string
) => storeOptimizer.createOptimizedUpdater(originalUpdater, storeName);

export const createDebouncedUpdater = <T>(
  originalUpdater: (updates: Partial<T>) => void,
  delay?: number
) => storeOptimizer.createDebouncedUpdater(originalUpdater, delay);

export const createThrottledUpdater = <T>(
  originalUpdater: (updates: Partial<T>) => void,
  limit?: number
) => storeOptimizer.createThrottledUpdater(originalUpdater, limit);

export const optimizeHistory = <T>(history: T[], maxSize?: number) => 
  storeOptimizer.optimizeHistory(history, maxSize);

export const compareValues = <T>(a: T, b: T) => storeOptimizer.compareValues(a, b);

export const checkMemoryUsage = () => storeOptimizer.checkMemoryUsage();

export const getOptimizationSuggestions = () => storeOptimizer.generateOptimizationSuggestions();

export const getPerformanceStats = () => storeOptimizer.generatePerformanceStats();

export const updateOptimizationConfig = (config: Partial<OptimizationConfig>) => 
  storeOptimizer.updateConfig(config);

export const getOptimizationConfig = () => storeOptimizer.getConfig();

// React 훅으로 사용할 수 있는 래퍼
export const useStoreOptimizer = () => {
  return {
    createOptimizedUpdater: storeOptimizer.createOptimizedUpdater.bind(storeOptimizer),
    createDebouncedUpdater: storeOptimizer.createDebouncedUpdater.bind(storeOptimizer),
    createThrottledUpdater: storeOptimizer.createThrottledUpdater.bind(storeOptimizer),
    optimizeHistory: storeOptimizer.optimizeHistory.bind(storeOptimizer),
    compareValues: storeOptimizer.compareValues.bind(storeOptimizer),
    checkMemoryUsage: storeOptimizer.checkMemoryUsage.bind(storeOptimizer),
    getSuggestions: storeOptimizer.generateOptimizationSuggestions.bind(storeOptimizer),
    getStats: storeOptimizer.generatePerformanceStats.bind(storeOptimizer),
    updateConfig: storeOptimizer.updateConfig.bind(storeOptimizer),
    getConfig: storeOptimizer.getConfig.bind(storeOptimizer)
  };
};

export default storeOptimizer;
