import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 모델 로더 인스턴스 (싱글톤)
let gltfLoader: GLTFLoader | null = null;

// 모델 캐시
const modelCache = new Map<string, {
  model: THREE.Group;
  timestamp: number;
  useCount: number;
}>();

// 텍스처 캐시
const textureCache = new Map<string, {
  texture: THREE.Texture;
  timestamp: number;
  useCount: number;
}>();

// 캐시 설정
const CACHE_CONFIG = {
  maxModels: 50,
  maxTextures: 100,
  maxAge: 5 * 60 * 1000, // 5분
  cleanupInterval: 30 * 1000 // 30초마다 정리
};

// 캐시 정리 타이머
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * GLTF 로더를 가져옵니다 (싱글톤)
 */
function getGLTFLoader(): GLTFLoader {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
  }
  return gltfLoader;
}

/**
 * 모델을 로드합니다 (캐시 우선)
 */
export async function loadModel(
  url: string,
  options: {
    useCache?: boolean;
    priority?: 'high' | 'normal' | 'low';
    onProgress?: (progress: number) => void;
  } = {}
): Promise<THREE.Group> {
  const { useCache = true, priority = 'normal', onProgress } = options;

  // 캐시에서 모델 확인
  if (useCache && modelCache.has(url)) {
    const cached = modelCache.get(url)!;
    cached.useCount++;
    cached.timestamp = Date.now();
    console.log(`📦 모델 캐시 히트: ${url}`);
    return cached.model.clone();
  }

  try {
    console.log(`🔄 모델 로딩 시작: ${url}`);
    
    // 로딩 진행률 처리
    const progressHandler = onProgress ? 
      (event: ProgressEvent) => {
        if (event.lengthComputable) {
          const progress = event.loaded / event.total;
          onProgress(progress);
        }
      } : undefined;

    // 모델 로드
    const gltf = await new Promise<THREE.GLTF>((resolve, reject) => {
      const loader = getGLTFLoader();
      
      if (progressHandler) {
        loader.load(url, resolve, progressHandler, reject);
      } else {
        loader.load(url, resolve, undefined, reject);
      }
    });

    const model = gltf.scene;
    
    // 모델 최적화
    optimizeModel(model);
    
    // 캐시에 저장
    if (useCache) {
      cacheModel(url, model);
    }

    console.log(`✅ 모델 로딩 완료: ${url}`);
    return model;

  } catch (error) {
    console.error(`❌ 모델 로딩 실패: ${url}`, error);
    throw error;
  }
}

/**
 * 모델을 캐시에 저장합니다
 */
function cacheModel(url: string, model: THREE.Group): void {
  // 캐시 크기 제한 확인
  if (modelCache.size >= CACHE_CONFIG.maxModels) {
    cleanupOldestModels();
  }

  modelCache.set(url, {
    model: model.clone(),
    timestamp: Date.now(),
    useCount: 1
  });

  // 캐시 정리 타이머 시작
  if (!cleanupTimer) {
    startCleanupTimer();
  }
}

/**
 * 텍스처를 로드합니다 (캐시 우선)
 */
export async function loadTexture(
  url: string,
  options: {
    useCache?: boolean;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<THREE.Texture> {
  const { useCache = true, onProgress } = options;

  // 캐시에서 텍스처 확인
  if (useCache && textureCache.has(url)) {
    const cached = textureCache.get(url)!;
    cached.useCount++;
    cached.timestamp = Date.now();
    console.log(`🖼️ 텍스처 캐시 히트: ${url}`);
    return cached.texture;
  }

  try {
    console.log(`🔄 텍스처 로딩 시작: ${url}`);
    
    const texture = await new Promise<THREE.Texture>((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      
      if (onProgress) {
        // TextureLoader는 진행률을 지원하지 않으므로 별도 처리
        loader.load(url, resolve, undefined, reject);
      } else {
        loader.load(url, resolve, undefined, reject);
      }
    });

    // 텍스처 최적화
    optimizeTexture(texture);
    
    // 캐시에 저장
    if (useCache) {
      cacheTexture(url, texture);
    }

    console.log(`✅ 텍스처 로딩 완료: ${url}`);
    return texture;

  } catch (error) {
    console.error(`❌ 텍스처 로딩 실패: ${url}`, error);
    throw error;
  }
}

/**
 * 텍스처를 캐시에 저장합니다
 */
function cacheTexture(url: string, texture: THREE.Texture): void {
  // 캐시 크기 제한 확인
  if (textureCache.size >= CACHE_CONFIG.maxTextures) {
    cleanupOldestTextures();
  }

  textureCache.set(url, {
    texture,
    timestamp: Date.now(),
    useCount: 1
  });
}

/**
 * 모델을 최적화합니다
 */
function optimizeModel(model: THREE.Group): void {
  model.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      // 지오메트리 최적화
      if (object.geometry) {
        object.geometry.computeBoundingSphere();
        object.geometry.computeBoundingBox();
      }

      // 머티리얼 최적화
      if (object.material) {
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
        
        // 텍스처 최적화
        if (material.map) optimizeTexture(material.map);
        if (material.normalMap) optimizeTexture(material.normalMap);
        if (material.roughnessMap) optimizeTexture(material.roughnessMap);
        if (material.metalnessMap) optimizeTexture(material.metalnessMap);
        
        // 머티리얼 설정 최적화
        material.needsUpdate = true;
      }

      // Frustum culling 활성화
      object.frustumCulled = true;
      
      // 그림자 설정
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}

/**
 * 텍스처를 최적화합니다
 */
function optimizeTexture(texture: THREE.Texture): void {
  // 텍스처 압축 및 최적화
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  // 메모리 최적화
  texture.flipY = false; // GLTF는 flipY가 false여야 함
  
  // 압축 텍스처 지원
  if (texture.image) {
    texture.needsUpdate = true;
  }
}

/**
 * 가장 오래된 모델들을 정리합니다
 */
function cleanupOldestModels(): void {
  const entries = Array.from(modelCache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  // 가장 오래된 20% 제거
  const removeCount = Math.ceil(modelCache.size * 0.2);
  for (let i = 0; i < removeCount; i++) {
    const [url, { model }] = entries[i];
    disposeModel(model);
    modelCache.delete(url);
  }
  
  console.log(`🧹 ${removeCount}개 모델 캐시 정리 완료`);
}

/**
 * 가장 오래된 텍스처들을 정리합니다
 */
function cleanupOldestTextures(): void {
  const entries = Array.from(textureCache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  // 가장 오래된 20% 제거
  const removeCount = Math.ceil(textureCache.size * 0.2);
  for (let i = 0; i < removeCount; i++) {
    const [url, { texture }] = entries[i];
    texture.dispose();
    textureCache.delete(url);
  }
  
  console.log(`🧹 ${removeCount}개 텍스처 캐시 정리 완료`);
}

/**
 * 모델을 메모리에서 해제합니다
 */
export function disposeModel(model: THREE.Group): void {
  try {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // 지오메트리 해제
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        // 머티리얼 해제
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => {
              disposeMaterial(mat);
            });
          } else {
            disposeMaterial(object.material);
          }
        }
      }
    });
    
    console.log('🧹 모델 메모리 해제 완료');
  } catch (error) {
    console.warn('모델 메모리 해제 중 오류:', error);
  }
}

/**
 * 머티리얼을 메모리에서 해제합니다
 */
function disposeMaterial(material: THREE.Material): void {
  try {
    // 텍스처 해제
    if (material.map) material.map.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.roughnessMap) material.roughnessMap.dispose();
    if (material.metalnessMap) material.metalnessMap.dispose();
    if (material.aoMap) material.aoMap.dispose();
    if (material.emissiveMap) material.emissiveMap.dispose();
    if (material.specularMap) material.specularMap.dispose();
    
    // 머티리얼 해제
    material.dispose();
  } catch (error) {
    console.warn('머티리얼 메모리 해제 중 오류:', error);
  }
}

/**
 * 캐시 정리 타이머를 시작합니다
 */
function startCleanupTimer(): void {
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    
    // 오래된 모델 정리
    for (const [url, { timestamp }] of modelCache.entries()) {
      if (now - timestamp > CACHE_CONFIG.maxAge) {
        const cached = modelCache.get(url)!;
        disposeModel(cached.model);
        modelCache.delete(url);
      }
    }
    
    // 오래된 텍스처 정리
    for (const [url, { timestamp }] of textureCache.entries()) {
      if (now - timestamp > CACHE_CONFIG.maxAge) {
        const cached = textureCache.get(url)!;
        cached.texture.dispose();
        textureCache.delete(url);
      }
    }
    
    // 캐시가 비어있으면 타이머 정지
    if (modelCache.size === 0 && textureCache.size === 0) {
      if (cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
      }
    }
  }, CACHE_CONFIG.cleanupInterval);
}

/**
 * 캐시 통계를 반환합니다
 */
export function getCacheStats(): {
  modelCount: number;
  textureCount: number;
  totalMemory: number;
} {
  let totalMemory = 0;
  
  // 모델 메모리 계산 (대략적)
  for (const { model } of modelCache.values()) {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry) {
        totalMemory += object.geometry.attributes.position.count * 12; // 3 floats * 4 bytes
      }
    });
  }
  
  // 텍스처 메모리 계산 (대략적)
  for (const { texture } of textureCache.values()) {
    if (texture.image) {
      const { width, height } = texture.image;
      totalMemory += width * height * 4; // RGBA
    }
  }
  
  return {
    modelCount: modelCache.size,
    textureCount: textureCache.size,
    totalMemory: Math.round(totalMemory / 1024 / 1024) // MB
  };
}

/**
 * 캐시를 완전히 비웁니다
 */
export function clearCache(): void {
  // 모델 캐시 정리
  for (const { model } of modelCache.values()) {
    disposeModel(model);
  }
  modelCache.clear();
  
  // 텍스처 캐시 정리
  for (const { texture } of textureCache.values()) {
    texture.dispose();
  }
  textureCache.clear();
  
  // 타이머 정지
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
  
  console.log('🧹 모든 캐시 정리 완료');
}

/**
 * 폴백 모델을 생성합니다 (로딩 실패 시)
 */
export function createFallbackModel(): THREE.Group {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  return group;
}

/**
 * 가구 모델을 생성합니다 (기본 형태)
 */
export function createFurnitureModel(
  width: number,
  height: number,
  depth: number,
  color: number = 0x8B4513
): THREE.Group {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  
  // 그림자 설정
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  group.add(mesh);
  return group;
}
