import * as THREE from 'three';

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  objectCount: number;
  textureCount: number;
  geometryCount: number;
  materialCount: number;
}

export interface MemoryLeakDetection {
  isLeaking: boolean;
  leakRate: number; // MB per minute
  confidence: number; // 0-1
  suspectedObjects: string[];
  recommendations: string[];
}

export interface MemoryCleanupResult {
  cleanedObjects: number;
  freedMemory: number;
  cleanupTime: number;
  errors: string[];
}

export class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private maxSnapshots = 50;
  private detectionInterval = 30000; // 30초
  private cleanupThreshold = 10; // MB
  private leakDetectionThreshold = 5; // MB per minute
  private intervalId: NodeJS.Timeout | null = null;
  private scene: THREE.Scene | null = null;
  private objectRegistry = new Map<string, { object: any; timestamp: number; type: string }>();

  constructor() {
    this.startMonitoring();
  }

  /**
   * 메모리 모니터링을 시작합니다.
   */
  startMonitoring(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.takeSnapshot();
      this.detectLeaks();
    }, this.detectionInterval);

    console.log('🔍 메모리 누수 감지 시스템 시작');
  }

  /**
   * 메모리 모니터링을 중지합니다.
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('⏹️ 메모리 누수 감지 시스템 중지');
  }

  /**
   * Three.js 씬을 등록합니다.
   */
  registerScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.setupSceneMonitoring(scene);
  }

  /**
   * 객체를 등록합니다.
   */
  registerObject(id: string, object: any, type: string): void {
    this.objectRegistry.set(id, {
      object,
      timestamp: Date.now(),
      type
    });
  }

  /**
   * 객체 등록을 해제합니다.
   */
  unregisterObject(id: string): void {
    this.objectRegistry.delete(id);
  }

  /**
   * 메모리 스냅샷을 생성합니다.
   */
  private takeSnapshot(): void {
    const memoryInfo = (performance as any).memory;
    if (!memoryInfo) return;

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      objectCount: this.objectRegistry.size,
      textureCount: this.countTextures(),
      geometryCount: this.countGeometries(),
      materialCount: this.countMaterials()
    };

    this.snapshots.push(snapshot);

    // 스냅샷 수 제한
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    console.log(`📊 메모리 스냅샷: ${Math.round(snapshot.usedJSHeapSize / 1024 / 1024)}MB`);
  }

  /**
   * 텍스처 수를 계산합니다.
   */
  private countTextures(): number {
    if (!this.scene) return 0;
    
    let count = 0;
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
        if (material.map) count++;
        if (material.normalMap) count++;
        if (material.roughnessMap) count++;
        if (material.metalnessMap) count++;
      }
    });
    return count;
  }

  /**
   * 지오메트리 수를 계산합니다.
   */
  private countGeometries(): number {
    if (!this.scene) return 0;
    
    let count = 0;
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry) {
        count++;
      }
    });
    return count;
  }

  /**
   * 머티리얼 수를 계산합니다.
   */
  private countMaterials(): number {
    if (!this.scene) return 0;
    
    let count = 0;
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        if (Array.isArray(object.material)) {
          count += object.material.length;
        } else {
          count++;
        }
      }
    });
    return count;
  }

  /**
   * 메모리 누수를 감지합니다.
   */
  private detectLeaks(): MemoryLeakDetection | null {
    if (this.snapshots.length < 5) return null;

    const recent = this.snapshots.slice(-5);
    const memoryGrowth = recent[recent.length - 1].usedJSHeapSize - recent[0].usedJSHeapSize;
    const timeSpan = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000 / 60; // minutes
    const leakRate = memoryGrowth / 1024 / 1024 / timeSpan; // MB per minute

    const isLeaking = leakRate > this.leakDetectionThreshold;
    const confidence = Math.min(1, Math.abs(leakRate) / this.leakDetectionThreshold);

    if (isLeaking) {
      const detection: MemoryLeakDetection = {
        isLeaking: true,
        leakRate,
        confidence,
        suspectedObjects: this.findSuspectedObjects(),
        recommendations: this.generateRecommendations(leakRate)
      };

      console.warn(`🚨 메모리 누수 감지: ${leakRate.toFixed(2)}MB/min (신뢰도: ${(confidence * 100).toFixed(1)}%)`);
      this.triggerLeakEvent(detection);
      return detection;
    }

    return null;
  }

  /**
   * 의심스러운 객체들을 찾습니다.
   */
  private findSuspectedObjects(): string[] {
    const suspected: string[] = [];
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5분

    this.objectRegistry.forEach((entry, id) => {
      if (now - entry.timestamp > maxAge) {
        suspected.push(`${entry.type}:${id}`);
      }
    });

    return suspected;
  }

  /**
   * 권장사항을 생성합니다.
   */
  private generateRecommendations(leakRate: number): string[] {
    const recommendations: string[] = [];

    if (leakRate > 20) {
      recommendations.push('즉시 메모리 정리를 실행하세요.');
      recommendations.push('사용하지 않는 텍스처와 지오메트리를 제거하세요.');
    } else if (leakRate > 10) {
      recommendations.push('메모리 사용량을 모니터링하세요.');
      recommendations.push('오래된 객체들을 정리하세요.');
    } else {
      recommendations.push('메모리 사용량을 주의깊게 관찰하세요.');
    }

    return recommendations;
  }

  /**
   * 메모리 누수 이벤트를 발생시킵니다.
   */
  private triggerLeakEvent(detection: MemoryLeakDetection): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('memory-leak-detected', {
        detail: detection
      }));
    }
  }

  /**
   * 자동 메모리 정리를 수행합니다.
   */
  async performAutoCleanup(): Promise<MemoryCleanupResult> {
    const startTime = performance.now();
    const startMemory = this.getCurrentMemoryUsage();
    const errors: string[] = [];
    let cleanedObjects = 0;

    try {
      // 1. 사용하지 않는 텍스처 정리
      cleanedObjects += await this.cleanupUnusedTextures();

      // 2. 사용하지 않는 지오메트리 정리
      cleanedObjects += await this.cleanupUnusedGeometries();

      // 3. 사용하지 않는 머티리얼 정리
      cleanedObjects += await this.cleanupUnusedMaterials();

      // 4. 오래된 객체 정리
      cleanedObjects += await this.cleanupOldObjects();

      // 5. 가비지 컬렉션 강제 실행
      if (window.gc) {
        window.gc();
      }

    } catch (error) {
      errors.push(`정리 중 오류 발생: ${error}`);
    }

    const endTime = performance.now();
    const endMemory = this.getCurrentMemoryUsage();
    const freedMemory = startMemory - endMemory;

    const result: MemoryCleanupResult = {
      cleanedObjects,
      freedMemory: Math.max(0, freedMemory),
      cleanupTime: endTime - startTime,
      errors
    };

    console.log(`🧹 자동 메모리 정리 완료: ${cleanedObjects}개 객체, ${freedMemory.toFixed(2)}MB 해제`);
    return result;
  }

  /**
   * 사용하지 않는 텍스처를 정리합니다.
   */
  private async cleanupUnusedTextures(): Promise<number> {
    if (!this.scene) return 0;

    let cleaned = 0;
    const usedTextures = new Set<THREE.Texture>();

    // 사용 중인 텍스처 수집
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
        if (material.map) usedTextures.add(material.map);
        if (material.normalMap) usedTextures.add(material.normalMap);
        if (material.roughnessMap) usedTextures.add(material.roughnessMap);
        if (material.metalnessMap) usedTextures.add(material.metalnessMap);
      }
    });

    // 사용하지 않는 텍스처 정리
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
        if (material.map && !usedTextures.has(material.map)) {
          material.map.dispose();
          material.map = null;
          cleaned++;
        }
      }
    });

    return cleaned;
  }

  /**
   * 사용하지 않는 지오메트리를 정리합니다.
   */
  private async cleanupUnusedGeometries(): Promise<number> {
    if (!this.scene) return 0;

    let cleaned = 0;
    const usedGeometries = new Set<THREE.BufferGeometry>();

    // 사용 중인 지오메트리 수집
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry) {
        usedGeometries.add(object.geometry);
      }
    });

    // 사용하지 않는 지오메트리 정리
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry && !usedGeometries.has(object.geometry)) {
        object.geometry.dispose();
        cleaned++;
      }
    });

    return cleaned;
  }

  /**
   * 사용하지 않는 머티리얼을 정리합니다.
   */
  private async cleanupUnusedMaterials(): Promise<number> {
    if (!this.scene) return 0;

    let cleaned = 0;
    const usedMaterials = new Set<THREE.Material>();

    // 사용 중인 머티리얼 수집
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => usedMaterials.add(mat));
        } else {
          usedMaterials.add(object.material);
        }
      }
    });

    // 사용하지 않는 머티리얼 정리
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => {
            if (!usedMaterials.has(mat)) {
              mat.dispose();
              cleaned++;
            }
          });
        } else if (!usedMaterials.has(object.material)) {
          object.material.dispose();
          cleaned++;
        }
      }
    });

    return cleaned;
  }

  /**
   * 오래된 객체를 정리합니다.
   */
  private async cleanupOldObjects(): Promise<number> {
    let cleaned = 0;
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10분

    this.objectRegistry.forEach((entry, id) => {
      if (now - entry.timestamp > maxAge) {
        // 객체 정리 로직
        if (entry.object && typeof entry.object.dispose === 'function') {
          entry.object.dispose();
        }
        this.objectRegistry.delete(id);
        cleaned++;
      }
    });

    return cleaned;
  }

  /**
   * 현재 메모리 사용량을 가져옵니다.
   */
  private getCurrentMemoryUsage(): number {
    const memoryInfo = (performance as any).memory;
    return memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;
  }

  /**
   * 씬 모니터링을 설정합니다.
   */
  private setupSceneMonitoring(scene: THREE.Scene): void {
    // 씬에 객체가 추가될 때마다 등록
    const originalAdd = scene.add.bind(scene);
    scene.add = (object: THREE.Object3D) => {
      const result = originalAdd(object);
      this.registerObject(`scene-${Date.now()}-${Math.random()}`, object, object.type);
      return result;
    };

    // 씬에서 객체가 제거될 때마다 등록 해제
    const originalRemove = scene.remove.bind(scene);
    scene.remove = (object: THREE.Object3D) => {
      const result = originalRemove(object);
      // 등록된 객체 찾아서 제거
      this.objectRegistry.forEach((entry, id) => {
        if (entry.object === object) {
          this.unregisterObject(id);
        }
      });
      return result;
    };
  }

  /**
   * 현재 스냅샷을 반환합니다.
   */
  getCurrentSnapshot(): MemorySnapshot | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }

  /**
   * 모든 스냅샷을 반환합니다.
   */
  getAllSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * 메모리 사용량 트렌드를 반환합니다.
   */
  getMemoryTrend(): { timestamp: number; memory: number }[] {
    return this.snapshots.map(snapshot => ({
      timestamp: snapshot.timestamp,
      memory: snapshot.usedJSHeapSize / 1024 / 1024
    }));
  }

  /**
   * 정리합니다.
   */
  dispose(): void {
    this.stopMonitoring();
    this.snapshots = [];
    this.objectRegistry.clear();
    this.scene = null;
  }
}

// 전역 인스턴스
export const memoryLeakDetector = new MemoryLeakDetector();

// 유틸리티 함수들
export const memoryUtils = {
  /**
   * 메모리 사용량을 포맷팅합니다.
   */
  formatMemoryUsage(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(1)}KB`;
    }
    return `${mb.toFixed(1)}MB`;
  },

  /**
   * 메모리 사용량이 임계값을 초과하는지 확인합니다.
   */
  isMemoryUsageHigh(threshold: number = 100): boolean {
    const memoryInfo = (performance as any).memory;
    if (!memoryInfo) return false;
    return (memoryInfo.usedJSHeapSize / 1024 / 1024) > threshold;
  },

  /**
   * 메모리 압박 상태를 확인합니다.
   */
  isMemoryPressureHigh(): boolean {
    const memoryInfo = (performance as any).memory;
    if (!memoryInfo) return false;
    
    const usedRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
    return usedRatio > 0.8; // 80% 이상 사용 시
  },

  /**
   * 가비지 컬렉션을 강제로 실행합니다.
   */
  forceGarbageCollection(): void {
    if (window.gc) {
      window.gc();
      console.log('🗑️ 가비지 컬렉션 강제 실행');
    } else {
      console.warn('⚠️ 가비지 컬렉션을 강제로 실행할 수 없습니다.');
    }
  }
};
