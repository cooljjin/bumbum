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

export class PerformanceMeasurer {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;
  private isMeasuring = false;
  private frameCount = 0;
  private lastTime = performance.now();
  private fpsHistory: number[] = [];
  private maxFpsHistory = 60;

  /**
   * 성능 측정을 시작합니다
   */
  startMeasurement(): void {
    this.isMeasuring = true;
    this.metrics = [];
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    console.log('📊 성능 측정 시작');
  }

  /**
   * 성능 측정을 중지합니다
   */
  stopMeasurement(): void {
    this.isMeasuring = false;
    console.log('⏹️ 성능 측정 중지');
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

      // 메트릭 수 제한
      if (this.metrics.length > this.maxMetrics) {
        this.metrics.shift();
      }

      // 카운터 리셋
      this.frameCount = 0;
      this.lastTime = currentTime;
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
      suggestions: this.generateOptimizationSuggestions()
    }, null, 2);
  }

  /**
   * 정리합니다
   */
  dispose(): void {
    this.stopMeasurement();
    this.metrics = [];
    this.fpsHistory = [];
  }
}

// 전역 인스턴스
export const performanceMeasurer = new PerformanceMeasurer();

// 유틸리티 함수들
export const performanceUtils = {
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

    console.log(`⚡ 벤치마크 [${name}]: ${iterations}회 실행, 총 ${duration.toFixed(2)}ms, 평균 ${avgDuration.toFixed(4)}ms`);

    return result!;
  },

  /**
   * 메모리 사용량을 측정합니다
   */
  measureMemoryUsage(): number {
    const memoryInfo = (performance as any).memory;
    return memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0;
  },

  /**
   * FPS를 측정합니다
   */
  measureFPS(): number {
    const now = performance.now();
    const fps = 1000 / (now - (performanceMeasurer as any).lastTime || now);
    return Math.round(Math.min(fps, 120));
  }
};
