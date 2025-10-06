import * as THREE from 'three';

// 공통 인터페이스 정의
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderCalls: number;
  triangles: number;
  points: number;
  lines: number;
  timestamp: number;
}

export interface OptimizationSuggestion {
  id: string;
  type: 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  action?: string;
  impact: 'low' | 'medium' | 'high';
  autoFixable?: boolean;
  fixFunction?: () => void;
}

export interface PerformanceHistory {
  fps: number[];
  memoryUsage: number[];
  frameTime: number[];
  timestamps: number[];
}

export interface PerformanceComparison {
  before: PerformanceMetrics;
  after: PerformanceMetrics;
  improvement: {
    fps: number;
    frameTime: number;
    memoryUsage: number;
    renderCalls: number;
    triangles: number;
  };
  percentage: {
    fps: number;
    frameTime: number;
    memoryUsage: number;
    renderCalls: number;
    triangles: number;
  };
}

export interface StorePerformanceData {
  [storeName: string]: {
    renderCount: number;
    updateTime: number;
    memoryUsage: number;
    lastUpdate: number;
  };
}

export interface OptimizationConfig {
  enableShallowComparison: boolean;
  enableBatchUpdates: boolean;
  enableMemoryOptimization: boolean;
  maxHistorySize: number;
  updateDebounceDelay: number;
  fpsThresholds: {
    critical: number;
    warning: number;
  };
  memoryThresholds: {
    critical: number;
    warning: number;
  };
}

/**
 * 통합된 성능 관리자 클래스
 * 4개의 분산된 성능 유틸리티를 통합하여 코드 중복을 제거하고 관리 효율성을 향상시킵니다.
 */
export class PerformanceManager {
  // 기본 설정
  private config: OptimizationConfig;
  
  // 성능 측정 관련
  private metrics: PerformanceMetrics[] = [];
  private history: PerformanceHistory;
  private suggestions: OptimizationSuggestion[] = [];
  private isMeasuring = false;
  private frameCount = 0;
  private lastTime = performance.now();
  private fpsHistory: number[] = [];
  
  // 스토어 모니터링 관련
  private storeMetrics: StorePerformanceData = {};
  private updateQueue: Map<string, Function> = new Map();
  private isProcessingQueue = false;
  private observers: Set<(data: StorePerformanceData) => void> = new Set();
  
  // 임계값 설정
  private maxMetrics = 1000;
  private maxFpsHistory = 60;
  private maxHistorySize = 100;
  private memoryLeakThreshold = 10; // MB
  private updateThreshold = 16; // 60fps 기준

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableShallowComparison: true,
      enableBatchUpdates: true,
      enableMemoryOptimization: true,
      maxHistorySize: 100,
      updateDebounceDelay: 16,
      fpsThresholds: {
        critical: 30,
        warning: 50
      },
      memoryThresholds: {
        critical: 150, // MB
        warning: 100   // MB
      },
      ...config
    };

    this.history = {
      fps: [],
      memoryUsage: [],
      frameTime: [],
      timestamps: []
    };

    if (typeof window !== 'undefined') {
      this.setupPerformanceObserver();
    }
  }

  // ==================== 성능 측정 관련 메서드 ====================

  /**
   * 성능 측정을 시작합니다
   */
  startMeasurement(): void {
    this.isMeasuring = true;
    this.metrics = [];
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    // console.log('📊 성능 측정 시작');
  }

  /**
   * 성능 측정을 중지합니다
   */
  stopMeasurement(): void {
    this.isMeasuring = false;
    // console.log('⏹️ 성능 측정 중지');
  }

  /**
   * 프레임별 성능 메트릭을 수집합니다
   */
  measureFrame(renderer: THREE.WebGLRenderer): void {
    if (!this.isMeasuring) return;

    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    // 1초마다 메트릭 수집
    if (deltaTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / deltaTime);
      
      // FPS 히스토리 업데이트
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > this.maxFpsHistory) {
        this.fpsHistory.shift();
      }

      // 평균 FPS 계산
      const avgFps = Math.round(
        this.fpsHistory.reduce((sum, f) => sum + f, 0) / this.fpsHistory.length
      );

      // 메모리 사용량
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0;

      // 렌더링 통계
      const rendererInfo = renderer.info;
      const renderCalls = rendererInfo.render.calls;
      const triangles = rendererInfo.render.triangles;
      const points = rendererInfo.render.points;
      const lines = rendererInfo.render.lines;

      const metric: PerformanceMetrics = {
        fps: avgFps,
        frameTime: Math.round(deltaTime / this.frameCount),
        memoryUsage,
        renderCalls,
        triangles,
        points,
        lines,
        timestamp: currentTime
      };

      this.metrics.push(metric);
      this.addToHistory(metric);

      // 메트릭 수 제한
      if (this.metrics.length > this.maxMetrics) {
        this.metrics.shift();
      }

      // 카운터 리셋
      this.frameCount = 0;
      this.lastTime = currentTime;

      // 최적화 제안 생성
      this.generateSuggestions(metric);
    }
  }

  /**
   * 현재 성능 메트릭을 반환합니다
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;
    return this.metrics[this.metrics.length - 1];
  }

  /**
   * 모든 성능 메트릭을 반환합니다
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * 성능 통계를 계산합니다
   */
  getPerformanceStats(): {
    avgFps: number;
    minFps: number;
    maxFps: number;
    avgFrameTime: number;
    avgMemoryUsage: number;
    avgRenderCalls: number;
    avgTriangles: number;
    totalFrames: number;
  } | null {
    if (this.metrics.length === 0) return null;

    const fpsValues = this.metrics.map(m => m.fps);
    const frameTimeValues = this.metrics.map(m => m.frameTime);
    const memoryValues = this.metrics.map(m => m.memoryUsage);
    const renderCallValues = this.metrics.map(m => m.renderCalls);
    const triangleValues = this.metrics.map(m => m.triangles);

    return {
      avgFps: Math.round(fpsValues.reduce((sum, val) => sum + val, 0) / fpsValues.length),
      minFps: Math.min(...fpsValues),
      maxFps: Math.max(...fpsValues),
      avgFrameTime: Math.round(frameTimeValues.reduce((sum, val) => sum + val, 0) / frameTimeValues.length),
      avgMemoryUsage: Math.round(memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length),
      avgRenderCalls: Math.round(renderCallValues.reduce((sum, val) => sum + val, 0) / renderCallValues.length),
      avgTriangles: Math.round(triangleValues.reduce((sum, val) => sum + val, 0) / triangleValues.length),
      totalFrames: this.metrics.length
    };
  }

  // ==================== 히스토리 관리 메서드 ====================

  /**
   * 히스토리에 메트릭을 추가합니다.
   */
  private addToHistory(metrics: PerformanceMetrics): void {
    this.history.fps.push(metrics.fps);
    this.history.memoryUsage.push(metrics.memoryUsage);
    this.history.frameTime.push(metrics.frameTime);
    this.history.timestamps.push(metrics.timestamp);

    // 히스토리 크기 제한
    if (this.history.fps.length > this.maxHistorySize) {
      this.history.fps.shift();
      this.history.memoryUsage.shift();
      this.history.frameTime.shift();
      this.history.timestamps.shift();
    }
  }

  /**
   * 현재 히스토리를 반환합니다.
   */
  getHistory(): PerformanceHistory {
    return { ...this.history };
  }

  /**
   * 히스토리를 초기화합니다.
   */
  clearHistory(): void {
    this.history = {
      fps: [],
      memoryUsage: [],
      frameTime: [],
      timestamps: []
    };
  }

  // ==================== 최적화 제안 생성 메서드 ====================

  /**
   * 성능 메트릭을 기반으로 최적화 제안을 생성합니다.
   */
  private generateSuggestions(metrics: PerformanceMetrics): void {
    this.suggestions = [];

    // FPS 기반 제안
    this.addFpsSuggestions(metrics);

    // 메모리 사용량 기반 제안
    this.addMemorySuggestions(metrics);

    // 프레임 타임 기반 제안
    this.addFrameTimeSuggestions(metrics);

    // 메모리 누수 감지
    this.addMemoryLeakSuggestions();

    // 렌더링 통계 기반 제안
    this.addRenderingSuggestions(metrics);

    // 트렌드 분석 기반 제안
    this.addTrendSuggestions();
  }

  /**
   * FPS 기반 최적화 제안을 추가합니다.
   */
  private addFpsSuggestions(metrics: PerformanceMetrics): void {
    if (metrics.fps < this.config.fpsThresholds.critical) {
      this.suggestions.push({
        id: 'low-fps-critical',
        type: 'critical',
        title: '심각한 FPS 저하',
        description: `현재 FPS가 ${metrics.fps}로 매우 낮습니다.`,
        action: '렌더링 품질을 크게 낮추거나 불필요한 객체를 제거하세요.',
        impact: 'high',
        autoFixable: true,
        fixFunction: () => this.autoOptimizeForLowFps()
      });
    } else if (metrics.fps < this.config.fpsThresholds.warning) {
      this.suggestions.push({
        id: 'low-fps-warning',
        type: 'warning',
        title: 'FPS 개선 필요',
        description: `현재 FPS가 ${metrics.fps}입니다.`,
        action: '일부 효과를 비활성화하거나 LOD를 조정하세요.',
        impact: 'medium',
        autoFixable: true,
        fixFunction: () => this.autoOptimizeForMediumFps()
      });
    }
  }

  /**
   * 메모리 사용량 기반 최적화 제안을 추가합니다.
   */
  private addMemorySuggestions(metrics: PerformanceMetrics): void {
    if (metrics.memoryUsage > this.config.memoryThresholds.critical) {
      this.suggestions.push({
        id: 'high-memory-critical',
        type: 'critical',
        title: '심각한 메모리 사용량',
        description: `메모리 사용량이 ${metrics.memoryUsage}MB입니다.`,
        action: '즉시 사용하지 않는 텍스처나 모델을 정리하세요.',
        impact: 'high',
        autoFixable: true,
        fixFunction: () => this.autoCleanupMemory()
      });
    } else if (metrics.memoryUsage > this.config.memoryThresholds.warning) {
      this.suggestions.push({
        id: 'high-memory-warning',
        type: 'warning',
        title: '높은 메모리 사용량',
        description: `메모리 사용량이 ${metrics.memoryUsage}MB입니다.`,
        action: '메모리 사용량을 모니터링하고 정리하세요.',
        impact: 'medium',
        autoFixable: true,
        fixFunction: () => this.autoOptimizeMemory()
      });
    }
  }

  /**
   * 프레임 타임 기반 최적화 제안을 추가합니다.
   */
  private addFrameTimeSuggestions(metrics: PerformanceMetrics): void {
    if (metrics.frameTime > 33) { // 30fps 미만
      this.suggestions.push({
        id: 'high-frame-time',
        type: 'warning',
        title: '높은 프레임 타임',
        description: `프레임 타임이 ${metrics.frameTime}ms입니다.`,
        action: '렌더링 최적화를 고려하세요.',
        impact: 'medium',
        autoFixable: true,
        fixFunction: () => this.autoOptimizeFrameTime()
      });
    }
  }

  /**
   * 메모리 누수 감지 및 제안을 추가합니다.
   */
  private addMemoryLeakSuggestions(): void {
    if (this.history.memoryUsage.length < 10) return;

    const recentMemory = this.history.memoryUsage.slice(-10);
    const isIncreasing = recentMemory.every((val, i) => i === 0 || val >= recentMemory[i - 1]);
    const increaseRate = recentMemory[recentMemory.length - 1] - recentMemory[0];
    
    if (isIncreasing && increaseRate > this.memoryLeakThreshold) {
      this.suggestions.push({
        id: 'memory-leak',
        type: 'critical',
        title: '메모리 누수 감지',
        description: `메모리 사용량이 지속적으로 증가하고 있습니다 (${increaseRate}MB 증가).`,
        action: '메모리 누수를 확인하고 정리하세요.',
        impact: 'high',
        autoFixable: true,
        fixFunction: () => this.autoFixMemoryLeak()
      });
    }
  }

  /**
   * 렌더링 통계 기반 최적화 제안을 추가합니다.
   */
  private addRenderingSuggestions(metrics: PerformanceMetrics): void {
    if (metrics.triangles > 100000) {
      this.suggestions.push({
        id: 'high-triangle-count',
        type: 'warning',
        title: '높은 삼각형 수',
        description: `렌더링되는 삼각형이 ${metrics.triangles.toLocaleString()}개입니다.`,
        action: 'LOD 시스템을 활성화하거나 모델을 단순화하세요.',
        impact: 'medium',
        autoFixable: true,
        fixFunction: () => this.autoOptimizeTriangles()
      });
    }

    if (metrics.renderCalls > 100) {
      this.suggestions.push({
        id: 'high-render-calls',
        type: 'info',
        title: '높은 렌더 호출 수',
        description: `렌더 호출이 ${metrics.renderCalls}회입니다.`,
        action: '객체를 배치하거나 인스턴싱을 사용하세요.',
        impact: 'low',
        autoFixable: true,
        fixFunction: () => this.autoOptimizeRenderCalls()
      });
    }
  }

  /**
   * 트렌드 분석 기반 최적화 제안을 추가합니다.
   */
  private addTrendSuggestions(): void {
    if (this.history.fps.length < 20) return;

    const recentFps = this.history.fps.slice(-20);
    const avgFps = recentFps.reduce((sum, fps) => sum + fps, 0) / recentFps.length;
    const fpsVariance = recentFps.reduce((sum, fps) => sum + Math.pow(fps - avgFps, 2), 0) / recentFps.length;
    const fpsStdDev = Math.sqrt(fpsVariance);

    // FPS 변동성이 높은 경우
    if (fpsStdDev > 10) {
      this.suggestions.push({
        id: 'fps-instability',
        type: 'info',
        title: 'FPS 불안정성',
        description: `FPS가 불안정합니다 (표준편차: ${fpsStdDev.toFixed(1)}).`,
        action: '렌더링 로드를 균등하게 분산하세요.',
        impact: 'low',
        autoFixable: false
      });
    }
  }

  /**
   * 현재 제안을 반환합니다.
   */
  getSuggestions(): OptimizationSuggestion[] {
    return [...this.suggestions];
  }

  // ==================== 자동 최적화 메서드 ====================

  /**
   * 자동 최적화 함수들
   */
  private autoOptimizeForLowFps(): void {
    this.triggerEvent('auto-optimize-low-fps');
  }

  private autoOptimizeForMediumFps(): void {
    this.triggerEvent('auto-optimize-medium-fps');
  }

  private autoCleanupMemory(): void {
    this.triggerEvent('auto-cleanup-memory');
    
    // 가비지 컬렉션 강제 실행 (가능한 경우)
    if (window.gc) {
      window.gc();
    }
  }

  private autoOptimizeMemory(): void {
    this.triggerEvent('auto-optimize-memory');
  }

  private autoOptimizeFrameTime(): void {
    this.triggerEvent('auto-optimize-frame-time');
  }

  private autoFixMemoryLeak(): void {
    this.triggerEvent('auto-fix-memory-leak');
  }

  private autoOptimizeTriangles(): void {
    this.triggerEvent('auto-optimize-triangles');
  }

  private autoOptimizeRenderCalls(): void {
    this.triggerEvent('auto-optimize-render-calls');
  }

  /**
   * 커스텀 이벤트를 발생시킵니다.
   */
  private triggerEvent(eventName: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, {
        detail: { timestamp: Date.now() }
      }));
    }
  }

  // ==================== Three.js 씬 최적화 메서드 ====================

  /**
   * Three.js 씬에 대한 자동 최적화를 수행합니다.
   */
  optimizeScene(scene: THREE.Scene): void {
    // 사용하지 않는 텍스처 정리
    this.cleanupUnusedTextures(scene);

    // LOD 설정
    this.setupLOD(scene);

    // Frustum culling 활성화
    this.enableFrustumCulling(scene);

    // 그림자 최적화
    this.optimizeShadows(scene);
  }

  /**
   * 사용하지 않는 텍스처를 정리합니다.
   */
  private cleanupUnusedTextures(scene: THREE.Scene): void {
    const usedTextures = new Set<THREE.Texture>();
    
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
        if (material.map) usedTextures.add(material.map);
        if (material.normalMap) usedTextures.add(material.normalMap);
        if (material.roughnessMap) usedTextures.add(material.roughnessMap);
        if (material.metalnessMap) usedTextures.add(material.metalnessMap);
      }
    });

    // 사용되지 않는 텍스처 메모리 해제
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
        if (material.map && !usedTextures.has(material.map)) {
          material.map.dispose();
          material.map = null;
        }
      }
    });
  }

  /**
   * LOD (Level of Detail) 설정을 적용합니다.
   */
  private setupLOD(scene: THREE.Scene): void {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // 거리에 따른 LOD 설정
        const distance = object.position.length();
        if (distance > 10) {
          // 멀리 있는 객체는 단순화
          object.visible = false;
        } else if (distance > 5) {
          // 중간 거리의 객체는 중간 품질
          object.castShadow = false;
        }
      }
    });
  }

  /**
   * Frustum culling을 활성화합니다.
   */
  private enableFrustumCulling(scene: THREE.Scene): void {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.frustumCulled = true;
      }
    });
  }

  /**
   * 그림자를 최적화합니다.
   */
  private optimizeShadows(scene: THREE.Scene): void {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // 높이에 따른 그림자 설정
        if (object.position.y > 0.1) {
          object.castShadow = true;
        }
        object.receiveShadow = true;
      }
    });
  }

  // ==================== 스토어 모니터링 메서드 ====================

  /**
   * 스토어 성능 모니터링을 시작합니다
   */
  startStoreMonitoring(storeName: string): void {
    this.storeMetrics[storeName] = {
      renderCount: 0,
      updateTime: 0,
      memoryUsage: 0,
      lastUpdate: Date.now()
    };
    // console.log(`🚀 성능 모니터링 시작: ${storeName}`);
  }

  /**
   * 스토어 성능 모니터링을 중지합니다
   */
  stopStoreMonitoring(storeName: string): void {
    delete this.storeMetrics[storeName];
    // console.log(`⏹️ 성능 모니터링 중지: ${storeName}`);
  }

  /**
   * 렌더링 카운트를 증가시킵니다
   */
  incrementRenderCount(storeName: string): void {
    if (this.storeMetrics[storeName]) {
      this.storeMetrics[storeName].renderCount++;
      this.checkStorePerformance(storeName);
    }
  }

  /**
   * 업데이트 시간을 기록합니다
   */
  recordUpdateTime(storeName: string, updateTime: number): void {
    if (this.storeMetrics[storeName]) {
      this.storeMetrics[storeName].updateTime = updateTime;
      this.storeMetrics[storeName].lastUpdate = Date.now();
      
      // 성능 임계값 체크
      if (updateTime > this.updateThreshold) {
        console.warn(`⚠️ 느린 업데이트 감지: ${storeName} - ${updateTime.toFixed(2)}ms`);
      }
    }
  }

  /**
   * 메모리 사용량을 기록합니다
   */
  recordMemoryUsage(storeName: string): void {
    if (this.storeMetrics[storeName] && typeof performance !== 'undefined') {
      const memory = (performance as any).memory;
      if (memory) {
        this.storeMetrics[storeName].memoryUsage = memory.usedJSHeapSize;
      }
    }
  }

  /**
   * 스토어 성능을 체크합니다
   */
  private checkStorePerformance(storeName: string): void {
    const metric = this.storeMetrics[storeName];
    if (!metric) return;

    // 렌더링 빈도 체크
    const timeSinceLastUpdate = Date.now() - metric.lastUpdate;
    const renderFrequency = metric.renderCount / (timeSinceLastUpdate / 1000);

    if (renderFrequency > 60) {
      console.warn(`⚠️ 과도한 렌더링 감지: ${storeName} - ${renderFrequency.toFixed(2)}fps`);
    }
  }

  /**
   * 스토어 성능 데이터를 가져옵니다
   */
  getStoreMetrics(storeName?: string): StorePerformanceData | any | null {
    if (storeName) {
      return this.storeMetrics[storeName] || null;
    }
    return { ...this.storeMetrics };
  }

  // ==================== 스토어 최적화 메서드 ====================

  /**
   * 얕은 비교를 통한 불필요한 업데이트 방지
   */
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

  /**
   * 깊은 비교를 통한 불필요한 업데이트 방지
   */
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

  /**
   * 선택적 비교 함수 (설정에 따라 얕은 비교 또는 깊은 비교)
   */
  compareValues<T>(a: T, b: T): boolean {
    return this.config.enableShallowComparison 
      ? this.shallowEqual(a, b) 
      : this.deepEqual(a, b);
  }

  /**
   * 배치 업데이트를 위한 큐 시스템
   */
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

  /**
   * 업데이트 큐 처리
   */
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
      this.recordUpdateTime('batch-update', duration);

      this.isProcessingQueue = false;

      // 큐에 새로운 업데이트가 있다면 다시 처리
      if (this.updateQueue.size > 0) {
        this.processUpdateQueue();
      }
    });
  }

  /**
   * 메모리 최적화를 위한 히스토리 관리
   */
  optimizeHistory<T>(history: T[], maxSize: number = this.config.maxHistorySize): T[] {
    if (!this.config.enableMemoryOptimization) return history;

    if (history.length <= maxSize) return history;

    // 가장 오래된 항목들을 제거
    return history.slice(-maxSize);
  }

  /**
   * 객체 참조 최적화
   */
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

  /**
   * 배열 최적화
   */
  optimizeArray<T>(arr: T[]): T[] {
    if (!this.config.enableMemoryOptimization) return arr;

    // 불필요한 null/undefined 값 제거
    return arr.filter(item => item != null);
  }

  /**
   * 메모리 사용량 체크 및 정리
   */
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

  /**
   * 메모리 정리 제안
   */
  private suggestMemoryCleanup(): void {
    // console.log('💡 메모리 정리 제안:');
    // console.log('  - 불필요한 히스토리 항목 제거');
    // console.log('  - 큰 객체 참조 해제');
    // console.log('  - 캐시된 데이터 정리');
  }

  /**
   * 성능 최적화된 상태 업데이트 함수 생성
   */
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
        this.recordUpdateTime(storeName, duration);

        // 느린 업데이트 경고
        if (duration > 16) { // 60fps 기준
          console.warn(`⚠️ 느린 상태 업데이트: ${storeName} - ${duration.toFixed(2)}ms`);
        }
      } catch (error) {
        console.error(`상태 업데이트 중 오류 발생: ${storeName}`, error);
      }
    };
  }

  /**
   * 디바운스된 업데이트 함수 생성
   */
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

  /**
   * 쓰로틀된 업데이트 함수 생성
   */
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

  // ==================== 성능 비교 및 분석 메서드 ====================

  /**
   * 성능 개선 효과를 비교합니다
   */
  comparePerformance(beforeMetrics: PerformanceMetrics[], afterMetrics: PerformanceMetrics[]): PerformanceComparison | null {
    if (beforeMetrics.length === 0 || afterMetrics.length === 0) return null;

    // 평균 메트릭 계산
    const before = this.calculateAverageMetrics(beforeMetrics);
    const after = this.calculateAverageMetrics(afterMetrics);

    // 개선 효과 계산
    const improvement = {
      fps: after.fps - before.fps,
      frameTime: before.frameTime - after.frameTime, // 낮을수록 좋음
      memoryUsage: before.memoryUsage - after.memoryUsage, // 낮을수록 좋음
      renderCalls: before.renderCalls - after.renderCalls, // 낮을수록 좋음
      triangles: before.triangles - after.triangles // 낮을수록 좋음
    };

    // 백분율 계산
    const percentage = {
      fps: before.fps > 0 ? (improvement.fps / before.fps) * 100 : 0,
      frameTime: before.frameTime > 0 ? (improvement.frameTime / before.frameTime) * 100 : 0,
      memoryUsage: before.memoryUsage > 0 ? (improvement.memoryUsage / before.memoryUsage) * 100 : 0,
      renderCalls: before.renderCalls > 0 ? (improvement.renderCalls / before.renderCalls) * 100 : 0,
      triangles: before.triangles > 0 ? (improvement.triangles / before.triangles) * 100 : 0
    };

    return { before, after, improvement, percentage };
  }

  /**
   * 평균 메트릭을 계산합니다
   */
  private calculateAverageMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    const avgFps = Math.round(metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length);
    const avgFrameTime = Math.round(metrics.reduce((sum, m) => sum + m.frameTime, 0) / metrics.length);
    const avgMemoryUsage = Math.round(metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length);
    const avgRenderCalls = Math.round(metrics.reduce((sum, m) => sum + m.renderCalls, 0) / metrics.length);
    const avgTriangles = Math.round(metrics.reduce((sum, m) => sum + m.triangles, 0) / metrics.length);
    const avgPoints = Math.round(metrics.reduce((sum, m) => sum + m.points, 0) / metrics.length);
    const avgLines = Math.round(metrics.reduce((sum, m) => sum + m.lines, 0) / metrics.length);

    return {
      fps: avgFps,
      frameTime: avgFrameTime,
      memoryUsage: avgMemoryUsage,
      renderCalls: avgRenderCalls,
      triangles: avgTriangles,
      points: avgPoints,
      lines: avgLines,
      timestamp: Date.now()
    };
  }

  // ==================== 리포트 생성 메서드 ====================

  /**
   * 성능 리포트를 생성합니다
   */
  generatePerformanceReport(): string {
    const stats = this.getPerformanceStats();
    if (!stats) return '측정된 성능 데이터가 없습니다.';

    const report = `
📊 성능 측정 리포트
==================
총 프레임 수: ${stats.totalFrames}
평균 FPS: ${stats.avgFps} (최소: ${stats.minFps}, 최대: ${stats.maxFps})
평균 프레임 타임: ${stats.avgFrameTime}ms
평균 메모리 사용량: ${stats.avgMemoryUsage}MB
평균 렌더 호출: ${stats.avgRenderCalls}회
평균 삼각형 수: ${stats.avgTriangles}개
==================
`;

    return report;
  }

  /**
   * 성능 개선 제안을 생성합니다
   */
  generateOptimizationSuggestions(): string[] {
    const stats = this.getPerformanceStats();
    if (!stats) return [];

    const suggestions: string[] = [];

    // FPS 기반 제안
    if (stats.avgFps < 30) {
      suggestions.push('🔴 FPS가 매우 낮습니다. 렌더링 품질을 크게 낮추거나 불필요한 객체를 제거하세요.');
    } else if (stats.avgFps < 50) {
      suggestions.push('🟡 FPS가 낮습니다. 일부 효과를 비활성화하거나 LOD를 조정하세요.');
    }

    // 프레임 타임 기반 제안
    if (stats.avgFrameTime > 33) {
      suggestions.push('⏱️ 프레임 타임이 높습니다. 렌더링 최적화를 고려하세요.');
    }

    // 메모리 사용량 기반 제안
    if (stats.avgMemoryUsage > 100) {
      suggestions.push('💾 메모리 사용량이 높습니다. 사용하지 않는 텍스처나 모델을 정리하세요.');
    }

    // 렌더 호출 기반 제안
    if (stats.avgRenderCalls > 100) {
      suggestions.push('🎨 렌더 호출이 많습니다. 객체를 배치하거나 인스턴싱을 사용하세요.');
    }

    // 삼각형 수 기반 제안
    if (stats.avgTriangles > 100000) {
      suggestions.push('🔺 삼각형 수가 많습니다. LOD 시스템을 활성화하거나 모델을 단순화하세요.');
    }

    return suggestions;
  }

  /**
   * 스토어 성능 리포트 생성
   */
  generateStoreReport(storeName?: string): string {
    if (storeName) {
      const data = this.storeMetrics[storeName];
      if (!data) return '데이터가 없습니다.';

      let report = '📊 성능 리포트\n';
      report += '='.repeat(30) + '\n';
      report += this.formatMetricReport(storeName, data);

      return report;
    } else {
      const data = this.storeMetrics;
      if (Object.keys(data).length === 0) return '데이터가 없습니다.';

      let report = '📊 성능 리포트\n';
      report += '='.repeat(30) + '\n';

      Object.entries(data).forEach(([name, metric]) => {
        report += this.formatMetricReport(name, metric);
        report += '\n';
      });

      return report;
    }
  }

  /**
   * 메트릭 리포트 포맷팅
   */
  private formatMetricReport(storeName: string, metric: any): string {
    return `${storeName}:\n` +
           `  렌더링 횟수: ${metric.renderCount}\n` +
           `  마지막 업데이트: ${new Date(metric.lastUpdate).toLocaleTimeString()}\n` +
           `  업데이트 시간: ${metric.updateTime.toFixed(2)}ms\n` +
           `  메모리 사용량: ${(metric.memoryUsage / 1024 / 1024).toFixed(2)}MB`;
  }

  /**
   * 성능 데이터를 CSV로 내보냅니다
   */
  exportToCSV(): string {
    if (this.metrics.length === 0) return '';

    const headers = ['Timestamp', 'FPS', 'FrameTime', 'MemoryUsage', 'RenderCalls', 'Triangles', 'Points', 'Lines'];
    const csvData = this.metrics.map(m => [
      new Date(m.timestamp).toISOString(),
      m.fps,
      m.frameTime,
      m.memoryUsage,
      m.renderCalls,
      m.triangles,
      m.points,
      m.lines
    ].join(','));

    return [headers.join(','), ...csvData].join('\n');
  }

  /**
   * 성능 데이터를 JSON으로 내보냅니다
   */
  exportToJSON(): string {
    return JSON.stringify({
      metrics: this.metrics,
      stats: this.getPerformanceStats(),
      suggestions: this.generateOptimizationSuggestions(),
      storeMetrics: this.storeMetrics
    }, null, 2);
  }

  // ==================== 설정 관리 메서드 ====================

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // console.log('🔧 성능 관리자 설정 업데이트:', this.config);
  }

  /**
   * 현재 설정 가져오기
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * 성능 옵저버 설정
   */
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

  /**
   * 성능 엔트리 처리
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    // 성능 측정 결과를 메트릭에 반영
    Object.keys(this.storeMetrics).forEach(storeName => {
      if (entry.name.includes(storeName)) {
        this.recordUpdateTime(storeName, entry.duration);
      }
    });
  }

  /**
   * 옵저버 추가
   */
  addObserver(callback: (data: StorePerformanceData) => void): void {
    this.observers.add(callback);
  }

  /**
   * 옵저버 제거
   */
  removeObserver(callback: (data: StorePerformanceData) => void): void {
    this.observers.delete(callback);
  }

  /**
   * 성능 최적화 권장사항
   */
  getStoreOptimizationSuggestions(storeName: string): string[] {
    const metric = this.storeMetrics[storeName];
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

  /**
   * 성능 데이터 초기화
   */
  resetMetrics(storeName?: string): void {
    if (storeName) {
      if (this.storeMetrics[storeName]) {
        this.storeMetrics[storeName] = {
          renderCount: 0,
          updateTime: 0,
          memoryUsage: 0,
          lastUpdate: Date.now()
        };
      }
    } else {
      this.storeMetrics = {};
      this.metrics = [];
      this.clearHistory();
    }
  }

  /**
   * 성능 통계 생성
   */
  generatePerformanceStats(): string {
    const memoryUsage = this.checkMemoryUsage();
    const queueSize = this.updateQueue.size;
    
    let stats = '📊 통합 성능 관리자 통계\n';
    stats += '='.repeat(40) + '\n';
    stats += `메모리 사용량: ${(memoryUsage.used / 1024 / 1024).toFixed(2)}MB\n`;
    stats += `메모리 사용률: ${memoryUsage.percentage.toFixed(2)}%\n`;
    stats += `업데이트 큐 크기: ${queueSize}\n`;
    stats += `배치 업데이트: ${this.config.enableBatchUpdates ? '활성화' : '비활성화'}\n`;
    stats += `얕은 비교: ${this.config.enableShallowComparison ? '활성화' : '비활성화'}\n`;
    stats += `메모리 최적화: ${this.config.enableMemoryOptimization ? '활성화' : '비활성화'}\n`;
    stats += `측정 중: ${this.isMeasuring ? '활성화' : '비활성화'}\n`;
    stats += `스토어 모니터링: ${Object.keys(this.storeMetrics).length}개\n`;
    
    return stats;
  }

  /**
   * 정리합니다
   */
  dispose(): void {
    this.stopMeasurement();
    this.metrics = [];
    this.fpsHistory = [];
    this.storeMetrics = {};
    this.updateQueue.clear();
    this.observers.clear();
    this.clearHistory();
  }
}

// 전역 인스턴스 생성
export const performanceManager = new PerformanceManager();

// 편의 함수들
export const performanceUtils = {
  /**
   * 메모리 사용량을 가져옵니다.
   */
  getMemoryUsage(): number {
    const memoryInfo = (performance as any).memory;
    return memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0;
  },

  /**
   * FPS를 계산합니다.
   */
  calculateFPS(frameTime: number): number {
    return Math.round(1000 / frameTime);
  },

  /**
   * 성능 등급을 반환합니다.
   */
  getPerformanceGrade(fps: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (fps >= 60) return 'A';
    if (fps >= 50) return 'B';
    if (fps >= 40) return 'C';
    if (fps >= 30) return 'D';
    return 'F';
  },

  /**
   * 성능 상태를 반환합니다.
   */
  getPerformanceStatus(fps: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (fps >= 60) return 'excellent';
    if (fps >= 50) return 'good';
    if (fps >= 40) return 'fair';
    if (fps >= 30) return 'poor';
    return 'critical';
  },

  /**
   * 성능 측정을 위한 간단한 벤치마크
   */
  benchmark<T>(name: string, fn: () => T, iterations: number = 1000): T {
    const start = performance.now();
    let result: T;

    for (let i = 0; i < iterations; i++) {
      result = fn();
    }

    const end = performance.now();
    const duration = end - start;
    const avgDuration = duration / iterations;

    // console.log(`⚡ 벤치마크 [${name}]: ${iterations}회 실행, 총 ${duration.toFixed(2)}ms, 평균 ${avgDuration.toFixed(4)}ms`);

    return result!;
  },

  /**
   * FPS를 측정합니다
   */
  measureFPS(): number {
    const now = performance.now();
    const fps = 1000 / (now - (performanceManager as any).lastTime || now);
    return Math.round(Math.min(fps, 120));
  }
};

// React 훅으로 사용할 수 있는 래퍼
export const usePerformanceManager = () => {
  return {
    // 성능 측정
    startMeasurement: performanceManager.startMeasurement.bind(performanceManager),
    stopMeasurement: performanceManager.stopMeasurement.bind(performanceManager),
    measureFrame: performanceManager.measureFrame.bind(performanceManager),
    getCurrentMetrics: performanceManager.getCurrentMetrics.bind(performanceManager),
    getAllMetrics: performanceManager.getAllMetrics.bind(performanceManager),
    getPerformanceStats: performanceManager.getPerformanceStats.bind(performanceManager),
    
    // 최적화
    getSuggestions: performanceManager.getSuggestions.bind(performanceManager),
    optimizeScene: performanceManager.optimizeScene.bind(performanceManager),
    
    // 스토어 모니터링
    startStoreMonitoring: performanceManager.startStoreMonitoring.bind(performanceManager),
    stopStoreMonitoring: performanceManager.stopStoreMonitoring.bind(performanceManager),
    incrementRenderCount: performanceManager.incrementRenderCount.bind(performanceManager),
    recordUpdateTime: performanceManager.recordUpdateTime.bind(performanceManager),
    getStoreMetrics: performanceManager.getStoreMetrics.bind(performanceManager),
    
    // 스토어 최적화
    createOptimizedUpdater: performanceManager.createOptimizedUpdater.bind(performanceManager),
    createDebouncedUpdater: performanceManager.createDebouncedUpdater.bind(performanceManager),
    createThrottledUpdater: performanceManager.createThrottledUpdater.bind(performanceManager),
    compareValues: performanceManager.compareValues.bind(performanceManager),
    queueUpdate: performanceManager.queueUpdate.bind(performanceManager),
    
    // 리포트 및 분석
    generatePerformanceReport: performanceManager.generatePerformanceReport.bind(performanceManager),
    generateStoreReport: performanceManager.generateStoreReport.bind(performanceManager),
    comparePerformance: performanceManager.comparePerformance.bind(performanceManager),
    exportToCSV: performanceManager.exportToCSV.bind(performanceManager),
    exportToJSON: performanceManager.exportToJSON.bind(performanceManager),
    
    // 설정 관리
    updateConfig: performanceManager.updateConfig.bind(performanceManager),
    getConfig: performanceManager.getConfig.bind(performanceManager),
    getStats: performanceManager.generatePerformanceStats.bind(performanceManager),
    
    // 유틸리티
    checkMemoryUsage: performanceManager.checkMemoryUsage.bind(performanceManager),
    resetMetrics: performanceManager.resetMetrics.bind(performanceManager),
    dispose: performanceManager.dispose.bind(performanceManager)
  };
};

// 기존 API와의 호환성을 위한 별칭들
export const performanceOptimizer = performanceManager;
export const performanceMeasurer = performanceManager;
export const performanceMonitor = performanceManager;
export const storeOptimizer = performanceManager;

export default performanceManager;
