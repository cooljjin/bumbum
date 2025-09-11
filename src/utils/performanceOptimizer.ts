import * as THREE from 'three';

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

export class PerformanceOptimizer {
  private history: PerformanceHistory;
  private suggestions: OptimizationSuggestion[] = [];
  private maxHistorySize = 100;
  private memoryLeakThreshold = 10; // MB
  private fpsThresholds = {
    critical: 30,
    warning: 50
  };
  private memoryThresholds = {
    critical: 150, // MB
    warning: 100   // MB
  };

  constructor() {
    this.history = {
      fps: [],
      memoryUsage: [],
      frameTime: [],
      timestamps: []
    };
  }

  /**
   * 성능 메트릭을 업데이트하고 최적화 제안을 생성합니다.
   */
  updateMetrics(metrics: PerformanceMetrics): OptimizationSuggestion[] {
    this.addToHistory(metrics);
    this.generateSuggestions(metrics);
    return [...this.suggestions];
  }

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
    if (metrics.fps < this.fpsThresholds.critical) {
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
    } else if (metrics.fps < this.fpsThresholds.warning) {
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
    if (metrics.memoryUsage > this.memoryThresholds.critical) {
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
    } else if (metrics.memoryUsage > this.memoryThresholds.warning) {
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
   * 자동 최적화 함수들
   */
  private autoOptimizeForLowFps(): void {
    // 낮은 FPS에 대한 자동 최적화
    // console.log('🚀 낮은 FPS 자동 최적화 실행');
    this.triggerEvent('auto-optimize-low-fps');
  }

  private autoOptimizeForMediumFps(): void {
    // 중간 FPS에 대한 자동 최적화
    // console.log('⚡ 중간 FPS 자동 최적화 실행');
    this.triggerEvent('auto-optimize-medium-fps');
  }

  private autoCleanupMemory(): void {
    // 메모리 정리
    // console.log('🧹 메모리 자동 정리 실행');
    this.triggerEvent('auto-cleanup-memory');
    
    // 가비지 컬렉션 강제 실행 (가능한 경우)
    if (window.gc) {
      window.gc();
    }
  }

  private autoOptimizeMemory(): void {
    // 메모리 최적화
    // console.log('💾 메모리 자동 최적화 실행');
    this.triggerEvent('auto-optimize-memory');
  }

  private autoOptimizeFrameTime(): void {
    // 프레임 타임 최적화
    // console.log('⏱️ 프레임 타임 자동 최적화 실행');
    this.triggerEvent('auto-optimize-frame-time');
  }

  private autoFixMemoryLeak(): void {
    // 메모리 누수 수정
    // console.log('🔧 메모리 누수 자동 수정 실행');
    this.triggerEvent('auto-fix-memory-leak');
  }

  private autoOptimizeTriangles(): void {
    // 삼각형 수 최적화
    // console.log('🔺 삼각형 수 자동 최적화 실행');
    this.triggerEvent('auto-optimize-triangles');
  }

  private autoOptimizeRenderCalls(): void {
    // 렌더 호출 최적화
    // console.log('🎨 렌더 호출 자동 최적화 실행');
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

  /**
   * Three.js 씬에 대한 자동 최적화를 수행합니다.
   */
  optimizeScene(scene: THREE.Scene): void {
    // console.log('🎯 씬 자동 최적화 시작');

    // 사용하지 않는 텍스처 정리
    this.cleanupUnusedTextures(scene);

    // LOD 설정
    this.setupLOD(scene);

    // Frustum culling 활성화
    this.enableFrustumCulling(scene);

    // 그림자 최적화
    this.optimizeShadows(scene);

    // console.log('✅ 씬 자동 최적화 완료');
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

  /**
   * 현재 히스토리를 반환합니다.
   */
  getHistory(): PerformanceHistory {
    return { ...this.history };
  }

  /**
   * 현재 제안을 반환합니다.
   */
  getSuggestions(): OptimizationSuggestion[] {
    return [...this.suggestions];
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
}

// 전역 인스턴스
export const performanceOptimizer = new PerformanceOptimizer();

// 유틸리티 함수들
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
  }
};
