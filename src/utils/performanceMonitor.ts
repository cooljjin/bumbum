// Zustand 스토어 성능 모니터링 및 최적화 유틸리티

interface PerformanceMetrics {
  renderCount: number;
  updateTime: number;
  memoryUsage: number;
  lastUpdate: number;
}

interface StorePerformanceData {
  [storeName: string]: PerformanceMetrics;
}

class PerformanceMonitor {
  private metrics: StorePerformanceData = {};
  private observers: Set<(data: StorePerformanceData) => void> = new Set();
  private isMonitoring = false;
  private updateThreshold = 16; // 60fps 기준

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupPerformanceObserver();
    }
  }

  // 성능 모니터링 시작
  startMonitoring(storeName: string): void {
    if (this.isMonitoring) return;

    this.metrics[storeName] = {
      renderCount: 0,
      updateTime: 0,
      memoryUsage: 0,
      lastUpdate: Date.now()
    };

    this.isMonitoring = true;
    console.log(`🚀 성능 모니터링 시작: ${storeName}`);
  }

  // 성능 모니터링 중지
  stopMonitoring(storeName: string): void {
    if (!this.isMonitoring) return;

    delete this.metrics[storeName];
    this.isMonitoring = false;
    console.log(`⏹️ 성능 모니터링 중지: ${storeName}`);
  }

  // 렌더링 카운트 증가
  incrementRenderCount(storeName: string): void {
    if (this.metrics[storeName]) {
      this.metrics[storeName].renderCount++;
      this.checkPerformance(storeName);
    }
  }

  // 업데이트 시간 기록
  recordUpdateTime(storeName: string, updateTime: number): void {
    if (this.metrics[storeName]) {
      this.metrics[storeName].updateTime = updateTime;
      this.metrics[storeName].lastUpdate = Date.now();
      
      // 성능 임계값 체크
      if (updateTime > this.updateThreshold) {
        console.warn(`⚠️ 느린 업데이트 감지: ${storeName} - ${updateTime.toFixed(2)}ms`);
      }
    }
  }

  // 메모리 사용량 기록
  recordMemoryUsage(storeName: string): void {
    if (this.metrics[storeName] && typeof performance !== 'undefined') {
      const memory = (performance as any).memory;
      if (memory) {
        this.metrics[storeName].memoryUsage = memory.usedJSHeapSize;
      }
    }
  }

  // 성능 체크
  private checkPerformance(storeName: string): void {
    const metric = this.metrics[storeName];
    if (!metric) return;

    // 렌더링 빈도 체크
    const timeSinceLastUpdate = Date.now() - metric.lastUpdate;
    const renderFrequency = metric.renderCount / (timeSinceLastUpdate / 1000);

    if (renderFrequency > 60) {
      console.warn(`⚠️ 과도한 렌더링 감지: ${storeName} - ${renderFrequency.toFixed(2)}fps`);
    }
  }

  // 성능 데이터 가져오기
  getMetrics(storeName?: string): StorePerformanceData | PerformanceMetrics | null {
    if (storeName) {
      return this.metrics[storeName] || null;
    }
    return { ...this.metrics };
  }

  // 성능 리포트 생성
  generateReport(storeName?: string): string {
    const data = storeName ? this.metrics[storeName] : this.metrics;
    
    if (!data) return '데이터가 없습니다.';

    let report = '📊 성능 리포트\n';
    report += '='.repeat(30) + '\n';

    if (storeName) {
      report += this.formatMetricReport(storeName, data);
    } else {
      Object.entries(data).forEach(([name, metric]) => {
        report += this.formatMetricReport(name, metric);
        report += '\n';
      });
    }

    return report;
  }

  // 메트릭 리포트 포맷팅
  private formatMetricReport(storeName: string, metric: PerformanceMetrics): string {
    return `${storeName}:\n` +
           `  렌더링 횟수: ${metric.renderCount}\n` +
           `  마지막 업데이트: ${new Date(metric.lastUpdate).toLocaleTimeString()}\n` +
           `  업데이트 시간: ${metric.updateTime.toFixed(2)}ms\n` +
           `  메모리 사용량: ${(metric.memoryUsage / 1024 / 1024).toFixed(2)}MB`;
  }

  // 성능 옵저버 설정
  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'measure') {
              this.handlePerformanceEntry(entry);
            }
          });
        });

        observer.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('PerformanceObserver 설정 실패:', error);
      }
    }
  }

  // 성능 엔트리 처리
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    // 성능 측정 결과를 메트릭에 반영
    Object.keys(this.metrics).forEach(storeName => {
      if (entry.name.includes(storeName)) {
        this.recordUpdateTime(storeName, entry.duration);
      }
    });
  }

  // 옵저버 추가
  addObserver(callback: (data: StorePerformanceData) => void): void {
    this.observers.add(callback);
  }

  // 옵저버 제거
  removeObserver(callback: (data: StorePerformanceData) => void): void {
    this.observers.delete(callback);
  }

  // 옵저버들에게 데이터 전달
  private notifyObservers(): void {
    this.observers.forEach(callback => {
      try {
        callback({ ...this.metrics });
      } catch (error) {
        console.error('옵저버 콜백 실행 중 오류:', error);
      }
    });
  }

  // 성능 최적화 권장사항
  getOptimizationSuggestions(storeName: string): string[] {
    const metric = this.metrics[storeName];
    if (!metric) return [];

    const suggestions: string[] = [];

    // 렌더링 빈도 체크
    const timeSinceLastUpdate = Date.now() - metric.lastUpdate;
    const renderFrequency = metric.renderCount / (timeSinceLastUpdate / 1000);

    if (renderFrequency > 60) {
      suggestions.push('과도한 렌더링이 감지되었습니다. useMemo와 useCallback을 활용하여 불필요한 리렌더링을 방지하세요.');
    }

    if (metric.updateTime > this.updateThreshold) {
      suggestions.push('느린 업데이트가 감지되었습니다. 상태 업데이트 로직을 최적화하거나 배치 업데이트를 고려하세요.');
    }

    if (metric.memoryUsage > 50 * 1024 * 1024) { // 50MB
      suggestions.push('높은 메모리 사용량이 감지되었습니다. 메모리 누수를 확인하고 불필요한 객체 참조를 정리하세요.');
    }

    return suggestions;
  }

  // 성능 데이터 초기화
  resetMetrics(storeName?: string): void {
    if (storeName) {
      if (this.metrics[storeName]) {
        this.metrics[storeName] = {
          renderCount: 0,
          updateTime: 0,
          memoryUsage: 0,
          lastUpdate: Date.now()
        };
      }
    } else {
      this.metrics = {};
    }
  }

  // 성능 데이터 내보내기
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  // 성능 데이터 가져오기
  importMetrics(data: string): void {
    try {
      const imported = JSON.parse(data);
      this.metrics = { ...this.metrics, ...imported };
    } catch (error) {
      console.error('성능 데이터 가져오기 실패:', error);
    }
  }
}

// 싱글톤 인스턴스 생성
export const performanceMonitor = new PerformanceMonitor();

// 편의 함수들
export const startStoreMonitoring = (storeName: string) => performanceMonitor.startMonitoring(storeName);
export const stopStoreMonitoring = (storeName: string) => performanceMonitor.stopMonitoring(storeName);
export const getStoreMetrics = (storeName?: string) => performanceMonitor.getMetrics(storeName);
export const getPerformanceReport = (storeName?: string) => performanceMonitor.generateReport(storeName);
export const getOptimizationSuggestions = (storeName: string) => performanceMonitor.getOptimizationSuggestions(storeName);

// React 훅으로 사용할 수 있는 래퍼
export const usePerformanceMonitor = (storeName: string) => {
  return {
    startMonitoring: () => startStoreMonitoring(storeName),
    stopMonitoring: () => stopStoreMonitoring(storeName),
    getMetrics: () => getStoreMetrics(storeName),
    getReport: () => getPerformanceReport(storeName),
    getSuggestions: () => getOptimizationSuggestions(storeName),
    reset: () => performanceMonitor.resetMetrics(storeName)
  };
};

// 성능 측정을 위한 유틸리티 함수
export const measurePerformance = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    const duration = end - start;
    performanceMonitor.recordUpdateTime(name, duration);
    
    return result;
  }) as T;
};

// 배치 업데이트를 위한 디바운스 함수
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

// 쓰로틀링을 위한 함수
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

// 메모리 사용량 체크
export const checkMemoryUsage = (): { used: number; total: number; limit: number } => {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };
  }
  return { used: 0, total: 0, limit: 0 };
};

// 성능 경고 설정
export const setPerformanceWarnings = (warnings: {
  renderThreshold?: number;
  updateThreshold?: number;
  memoryThreshold?: number;
}) => {
  if (warnings.renderThreshold) {
    performanceMonitor['updateThreshold'] = warnings.renderThreshold;
  }
};

export default performanceMonitor;
