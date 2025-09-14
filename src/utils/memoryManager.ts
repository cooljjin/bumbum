/**
 * 메모리 관리 및 페이지 리로드 방지 유틸리티
 */

import React from 'react';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceMetrics {
  memoryUsage: number;
  memoryLimit: number;
  memoryUsagePercent: number;
  isLowMemory: boolean;
}

class MemoryManager {
  private static instance: MemoryManager;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private lowMemoryThreshold = 0.8; // 80% 사용 시 경고
  private criticalMemoryThreshold = 0.9; // 90% 사용 시 위험
  private lastMemoryCheck = 0;
  private memoryCheckIntervalMs = 5000; // 5초마다 체크

  private constructor() {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      this.setupPageReloadPrevention();
    }
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * 페이지 리로드 방지 설정
   */
  private setupPageReloadPrevention(): void {
    // beforeunload 이벤트로 페이지 리로드 방지
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // 메모리 사용량이 높을 때만 경고
      const memoryInfo = this.getMemoryInfo();
      if (memoryInfo && memoryInfo.memoryUsagePercent > this.lowMemoryThreshold) {
        event.preventDefault();
        event.returnValue = '작업 중인 내용이 있습니다. 정말로 페이지를 떠나시겠습니까?';
        return event.returnValue;
      }
    };

    // unload 이벤트로 리소스 정리
    const handleUnload = () => {
      this.cleanup();
    };

    // visibilitychange 이벤트로 백그라운드 전환 시 메모리 정리
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.cleanupTemporaryResources();
      }
    };

    // 메모리 압박 이벤트 처리
    const handleMemoryPressure = () => {
      console.warn('🚨 메모리 압박 감지 - 리소스 정리 시작');
      this.cleanupTemporaryResources();
    };

    // 이벤트 리스너 등록
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 메모리 압박 이벤트 (Chrome에서 지원)
    if ('memory' in performance) {
      window.addEventListener('memorypressure', handleMemoryPressure as EventListener);
    }

    // 페이지 숨김 시 메모리 정리
    document.addEventListener('pagehide', handleUnload);
  }

  /**
   * 메모리 정보 가져오기
   */
  private getMemoryInfo(): PerformanceMetrics | null {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory as MemoryInfo;
    const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    const memoryLimit = memory.jsHeapSizeLimit / 1024 / 1024; // MB
    const memoryUsagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

    return {
      memoryUsage: Math.round(memoryUsage),
      memoryLimit: Math.round(memoryLimit),
      memoryUsagePercent,
      isLowMemory: memoryUsagePercent > this.lowMemoryThreshold
    };
  }

  /**
   * 메모리 모니터링 시작
   */
  public startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;

    this.isMonitoring = true;
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.memoryCheckIntervalMs);

    console.log('🔍 메모리 모니터링 시작');
  }

  /**
   * 메모리 모니터링 중지
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    console.log('⏹️ 메모리 모니터링 중지');
  }

  /**
   * 메모리 사용량 체크
   */
  private checkMemoryUsage(): void {
    if (typeof window === 'undefined') return;
    
    const memoryInfo = this.getMemoryInfo();
    if (!memoryInfo) return;

    const now = Date.now();
    if (now - this.lastMemoryCheck < this.memoryCheckIntervalMs) return;
    this.lastMemoryCheck = now;

    // 메모리 사용량이 높을 때 경고
    if (memoryInfo.memoryUsagePercent > this.criticalMemoryThreshold) {
      console.error('🚨 위험: 메모리 사용량이 90%를 초과했습니다!', memoryInfo);
      this.cleanupTemporaryResources();
      this.triggerGarbageCollection();
    } else if (memoryInfo.memoryUsagePercent > this.lowMemoryThreshold) {
      console.warn('⚠️ 경고: 메모리 사용량이 80%를 초과했습니다.', memoryInfo);
      this.cleanupTemporaryResources();
    }
  }

  /**
   * 임시 리소스 정리
   */
  public cleanupTemporaryResources(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // 가비지 컬렉션 강제 실행
      if (window.gc) {
        window.gc();
      }

      // 이미지 캐시 정리
      this.clearImageCache();

      // WebGL 컨텍스트 정리
      this.clearWebGLResources();

      // 이벤트 리스너 정리
      this.cleanupEventListeners();

      console.log('🧹 임시 리소스 정리 완료');
    } catch (error) {
      console.error('리소스 정리 중 오류:', error);
    }
  }

  /**
   * 이미지 캐시 정리
   */
  private clearImageCache(): void {
    if (typeof document === 'undefined') return;
    
    // 이미지 요소들의 src를 빈 문자열로 설정하여 메모리 해제
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src.startsWith('blob:') || img.src.startsWith('data:')) {
        img.src = '';
      }
    });
  }

  /**
   * WebGL 리소스 정리
   */
  private clearWebGLResources(): void {
    if (typeof document === 'undefined') return;
    
    try {
      // 모든 canvas 요소를 확인
      const canvases = document.querySelectorAll('canvas');
      
      for (const canvas of canvases) {
        try {
          // 이미 WebGL 컨텍스트가 있는지 확인
          const existingContext = canvas.getContext('webgl') || canvas.getContext('webgl2');
          
          if (existingContext && (existingContext instanceof WebGLRenderingContext || existingContext instanceof WebGL2RenderingContext)) {
            // WebGL 리소스 정리
            const ext = existingContext.getExtension('WEBGL_lose_context');
            if (ext) {
              // 컨텍스트 손실 (필요시에만)
              // ext.loseContext();
            }
          }
        } catch (canvasError) {
          // 개별 canvas 처리 오류는 무시
          console.warn('Canvas WebGL 정리 중 오류 (무시됨):', canvasError);
        }
      }
    } catch (error) {
      // 전체 WebGL 리소스 정리 오류는 로그만 출력
      console.warn('WebGL 리소스 정리 중 오류 (무시됨):', error);
    }
  }

  /**
   * 이벤트 리스너 정리
   */
  private cleanupEventListeners(): void {
    // 불필요한 이벤트 리스너 제거
    // 실제로는 각 컴포넌트에서 정리해야 함
  }

  /**
   * 가비지 컬렉션 강제 실행
   */
  private triggerGarbageCollection(): void {
    if (typeof window === 'undefined') return;
    
    if (window.gc) {
      window.gc();
    } else {
      // 가비지 컬렉션을 유도하는 방법
      const temp = new Array(1000000).fill(0);
      temp.length = 0;
    }
  }

  /**
   * 전체 정리
   */
  public cleanup(): void {
    this.stopMonitoring();
    this.cleanupTemporaryResources();
  }

  /**
   * 메모리 사용량 정보 반환
   */
  public getMemoryUsage(): PerformanceMetrics | null {
    return this.getMemoryInfo();
  }

  /**
   * 메모리 사용량이 높은지 확인
   */
  public isMemoryHigh(): boolean {
    const memoryInfo = this.getMemoryInfo();
    return memoryInfo ? memoryInfo.isLowMemory : false;
  }
}

// 전역 인스턴스 생성
export const memoryManager = MemoryManager.getInstance();

// 메모리 사용량을 실시간으로 모니터링하는 훅
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = React.useState<PerformanceMetrics | null>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const info = memoryManager.getMemoryUsage();
      setMemoryInfo(info);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

export default memoryManager;
