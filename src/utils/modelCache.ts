import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

interface CachedModel {
  model: THREE.Group;
  lastUsed: number;
  useCount: number;
  size: number; // 메모리 크기 (KB)
  complexity: {
    triangleCount: number;
    vertexCount: number;
    materialCount: number;
    textureCount: number;
  };
}

interface ModelCacheOptions {
  maxMemory: number; // 최대 메모리 사용량 (MB)
  maxModels: number; // 최대 캐시 모델 수
  cleanupInterval: number; // 정리 간격 (ms)
  enableCompression: boolean; // DRACO 압축 사용 여부
}

class ModelCache {
  private cache = new Map<string, CachedModel>();
  private loader: GLTFLoader;
  private options: ModelCacheOptions;
  private totalMemory = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: Partial<ModelCacheOptions> = {}) {
    this.loader = new GLTFLoader();
    this.options = {
      maxMemory: 512, // 512MB
      maxModels: 100,
      cleanupInterval: 30000, // 30초
      enableCompression: true,
      ...options
    };

    this.initializeLoader();
    this.startCleanupTimer();
  }

  private initializeLoader(): void {
    this.loader = new GLTFLoader();

    if (this.options.enableCompression) {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      this.loader.setDRACOLoader(dracoLoader);
    }
  }

  /**
   * 모델을 캐시에서 가져오거나 로딩
   */
  async getModel(modelPath: string): Promise<THREE.Group> {
    // 캐시에서 확인
    if (this.cache.has(modelPath)) {
      const cached = this.cache.get(modelPath)!;
      cached.lastUsed = Date.now();
      cached.useCount++;
      
      console.log(`📦 캐시 히트: ${modelPath} (사용 횟수: ${cached.useCount})`);
      return cached.model.clone();
    }

    // 새로 로딩
    console.log(`🔄 모델 로딩: ${modelPath}`);
    const model = await this.loadModel(modelPath);
    
    // 캐시에 저장
    await this.cacheModel(modelPath, model);
    
    return model.clone();
  }

  /**
   * 모델 로딩
   */
  private async loadModel(modelPath: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        modelPath,
        (gltf) => {
          const model = gltf.scene;
          
          // 모델 최적화 적용
          this.optimizeModel(model);
          
          resolve(model);
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(2);
          console.log(`📥 로딩 진행률: ${percent}%`);
        },
        (error) => {
          console.error(`❌ 모델 로딩 실패: ${modelPath}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * 모델을 캐시에 저장
   */
  private async cacheModel(modelPath: string, model: THREE.Group): Promise<void> {
    // 메모리 사용량 계산
    const size = this.calculateModelSize(model);
    const complexity = this.analyzeModelComplexity(model);

    const cachedModel: CachedModel = {
      model,
      lastUsed: Date.now(),
      useCount: 1,
      size,
      complexity
    };

    // 메모리 제한 확인 및 정리
    if (this.totalMemory + size > this.options.maxMemory * 1024) {
      await this.cleanupCache();
    }

    // 캐시에 저장
    this.cache.set(modelPath, cachedModel);
    this.totalMemory += size;

    console.log(`💾 모델 캐시됨: ${modelPath} (크기: ${(size / 1024).toFixed(2)}MB)`);
  }

  /**
   * 모델 크기 계산 (KB)
   */
  private calculateModelSize(model: THREE.Group): number {
    let size = 0;
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          geometries.add(child.geometry);
        }
        if (child.material) {
          const materialArray = Array.isArray(child.material) ? child.material : [child.material];
          materialArray.forEach(mat => materials.add(mat));
        }
      }
    });

    // 지오메트리 크기 계산
    geometries.forEach(geometry => {
      if (geometry.attributes['position']) {
        size += geometry.attributes['position'].count * 3 * 4; // float32
      }
      if (geometry.attributes['normal']) {
        size += geometry.attributes['normal'].count * 3 * 4;
      }
      if (geometry.attributes['uv']) {
        size += geometry.attributes['uv'].count * 2 * 4;
      }
    });

    // 재질 및 텍스처 크기 추정
    size += materials.size * 1024; // 재질당 약 1KB
    size += textures.size * 512; // 텍스처당 약 0.5KB

    return Math.round(size / 1024); // KB로 변환
  }

  /**
   * 모델 복잡도 분석
   */
  private analyzeModelComplexity(model: THREE.Group): CachedModel['complexity'] {
    let triangleCount = 0;
    let vertexCount = 0;
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        if (child.geometry.index) {
          triangleCount += child.geometry.index.count / 3;
          vertexCount += child.geometry.index.count;
        } else if (child.geometry.attributes.position) {
          triangleCount += child.geometry.attributes.position.count / 3;
          vertexCount += child.geometry.attributes.position.count;
        }

        if (child.material) {
          const materialArray = Array.isArray(child.material) ? child.material : [child.material];
          materialArray.forEach(mat => {
            materials.add(mat);
            if (mat.map) textures.add(mat.map);
            if (mat.normalMap) textures.add(mat.normalMap);
            if (mat.roughnessMap) textures.add(mat.roughnessMap);
          });
        }
      }
    });

    return {
      triangleCount,
      vertexCount,
      materialCount: materials.size,
      textureCount: textures.size
    };
  }

  /**
   * 모델 최적화
   */
  private optimizeModel(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Frustum culling 활성화
        child.frustumCulled = true;
        
        // 그림자 설정 최적화
        if (child.position.y > 0.1) {
          child.castShadow = true;
        }
        child.receiveShadow = true;

        // 지오메트리 최적화
        if (child.geometry) {
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }
      }
    });
  }

  /**
   * 캐시 정리
   */
  public async cleanupCache(): Promise<void> {
    console.log('🧹 캐시 정리 시작...');

    const entries = Array.from(this.cache.entries());
    
    // 사용 빈도와 마지막 사용 시간을 기준으로 정렬
    entries.sort((a, b) => {
      const scoreA = a[1].useCount * 0.7 + (Date.now() - a[1].lastUsed) * 0.3;
      const scoreB = b[1].useCount * 0.7 + (Date.now() - b[1].lastUsed) * 0.3;
      return scoreA - scoreB;
    });

    // 메모리 제한에 도달할 때까지 제거
    while (this.totalMemory > this.options.maxMemory * 1024 * 0.8 && entries.length > 0) {
      const [path, model] = entries.shift()!;
      
      // 모델 메모리 해제
      this.disposeModel(model.model);
      
      // 캐시에서 제거
      this.cache.delete(path);
      this.totalMemory -= model.size;
      
      console.log(`🗑️ 모델 제거됨: ${path} (크기: ${(model.size / 1024).toFixed(2)}MB)`);
    }

    console.log(`✅ 캐시 정리 완료 (총 메모리: ${(this.totalMemory / 1024).toFixed(2)}MB)`);
  }

  /**
   * 모델 메모리 해제
   */
  private disposeModel(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          const materialArray = Array.isArray(child.material) ? child.material : [child.material];
          materialArray.forEach(mat => {
            if (mat.map) mat.map.dispose();
            if (mat.normalMap) mat.normalMap.dispose();
            if (mat.roughnessMap) mat.roughnessMap.dispose();
            mat.dispose();
          });
        }
      }
    });
  }

  /**
   * 정리 타이머 시작
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupCache();
    }, this.options.cleanupInterval);
  }

  /**
   * 캐시 통계 반환
   */
  getStats(): {
    totalModels: number;
    totalMemory: number;
    hitRate: number;
    averageComplexity: {
      triangleCount: number;
      vertexCount: number;
      materialCount: number;
      textureCount: number;
    };
  } {
    const totalModels = this.cache.size;
    const totalMemory = this.totalMemory;
    
    // 평균 복잡도 계산
    let totalTriangles = 0;
    let totalVertices = 0;
    let totalMaterials = 0;
    let totalTextures = 0;
    
    this.cache.forEach(model => {
      totalTriangles += model.complexity.triangleCount;
      totalVertices += model.complexity.vertexCount;
      totalMaterials += model.complexity.materialCount;
      totalTextures += model.complexity.textureCount;
    });

    const averageComplexity = {
      triangleCount: Math.round(totalTriangles / totalModels),
      vertexCount: Math.round(totalVertices / totalModels),
      materialCount: Math.round(totalMaterials / totalModels),
      textureCount: Math.round(totalTextures / totalModels)
    };

    return {
      totalModels,
      totalMemory,
      hitRate: 0, // TODO: 히트율 계산 구현
      averageComplexity
    };
  }

  /**
   * 캐시 완전 정리
   */
  clearCache(): void {
    console.log('🗑️ 캐시 완전 정리...');
    
    this.cache.forEach((model) => {
      this.disposeModel(model.model);
    });
    
    this.cache.clear();
    this.totalMemory = 0;
    
    console.log('✅ 캐시 완전 정리 완료');
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clearCache();
  }
}

// 싱글톤 인스턴스 생성
export const modelCache = new ModelCache();

// 유틸리티 함수들
export const cacheUtils = {
  // 모델 프리로딩
  preloadModels: async (modelPaths: string[]): Promise<void> => {
    console.log(`🚀 모델 프리로딩 시작: ${modelPaths.length}개`);
    
    const promises = modelPaths.map(path => 
      modelCache.getModel(path).catch(error => {
        console.warn(`⚠️ 프리로딩 실패: ${path}`, error);
      })
    );
    
    await Promise.all(promises);
    console.log('✅ 모델 프리로딩 완료');
  },

  // 캐시 상태 확인
  getCacheStatus: () => modelCache.getStats(),

  // 캐시 정리
  cleanupCache: () => modelCache.cleanupCache(),

  // 캐시 완전 정리
  clearCache: () => modelCache.clearCache()
};

export default modelCache;
