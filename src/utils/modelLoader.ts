import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { shouldUsePlaceholderModels } from './placeholder';

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

  // 개발/테스트 환경에서는 실제 GLTF 로딩을 생략하고 플레이스홀더 반환
  if (shouldUsePlaceholderModels()) {
    console.log('🧩 Placeholder 모델 사용(개발/테스트 모드):', url);
    return createFallbackModel();
  }

  console.log('🎯 실제 GLTF 모델 로딩 시도:', url);

  // 모델 URL 해석 (CDN/base URL 지원)
  const resolvedUrl = resolveModelUrl(url);

  // 캐시에서 모델 확인
  if (useCache && modelCache.has(url)) {
    const cached = modelCache.get(url)!;
    cached.useCount++;
    cached.timestamp = Date.now();
    console.log(`📦 모델 캐시 히트: ${url}`);
    return cached.model.clone();
  }

  try {
    console.log(`🔄 모델 로딩 시작: ${resolvedUrl}`);
    
    // 더미 파일 감지를 위한 사전 체크
    try {
      const response = await fetch(resolvedUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // 파일 크기가 매우 작으면 더미 파일일 가능성
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) < 1000) {
        console.warn(`⚠️ 파일 크기가 매우 작음 (${contentLength} bytes), 더미 파일일 가능성`);
      }
    } catch (fetchError) {
      console.warn(`⚠️ 파일 사전 체크 실패:`, fetchError);
    }
    
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
        loader.load(resolvedUrl, resolve, progressHandler, reject);
      } else {
        loader.load(resolvedUrl, resolve, undefined, reject);
      }
    });

    const model = gltf.scene;
    
    // 더미 파일 감지 (모델이 비어있거나 매우 간단한 경우)
    if (!model || model.children.length === 0) {
      console.warn(`⚠️ 로드된 모델이 비어있음, 더미 파일일 가능성: ${resolvedUrl}`);
      throw new Error('Empty model detected - likely dummy file');
    }
    
    // 모델 최적화
    optimizeModel(model);
    
    // 캐시에 저장
    if (useCache) {
      cacheModel(url, model);
    }

    console.log(`✅ 모델 로딩 완료: ${resolvedUrl}`);
    return model;

  } catch (error) {
    console.error(`❌ 모델 로딩 실패: ${resolvedUrl}`, error);
    throw error;
  }
}

/**
 * 상대 경로 모델 URL을 환경변수 기반으로 해석합니다.
 * - 절대 URL(http/https)인 경우 그대로 사용
 * - `NEXT_PUBLIC_GLTF_BASE_URL`이 설정되면 해당 값을 접두사로 사용
 */
export function resolveModelUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_GLTF_BASE_URL;
  if (!base) return url; // 기본: 상대 경로 유지 (Next 정적 파일)
  const trimmedBase = base.replace(/\/$/, '');
  const trimmedPath = url.replace(/^\//, '');
  return `${trimmedBase}/${trimmedPath}`;
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
  
  // 🔧 나무결 무늬 개선을 위한 Anisotropic Filtering 추가
  // GPU가 지원하는 최대 anisotropy 값 사용 (일반적으로 16)
  texture.anisotropy = 16; // 최대 품질로 설정
  
  // 🔧 나무결 텍스처를 위한 추가 설정
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  // 메모리 최적화
  texture.flipY = false; // GLTF는 flipY가 false여야 함
  
  // 압축 텍스처 지원
  if (texture.image) {
    texture.needsUpdate = true;
  }
  
  console.log(`🎨 텍스처 최적화 완료: anisotropy=${texture.anisotropy}`);
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
 * 시계 전용 폴백 모델을 생성합니다
 */
export function createClockFallbackModel(): THREE.Group {
  const group = new THREE.Group();
  
  // 시계 본체 (원형) - 벽에 걸리는 형태로 세우기
  const clockGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
  const clockMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const clockMesh = new THREE.Mesh(clockGeometry, clockMaterial);
  // 시계를 벽에 걸리는 형태로 회전 (Z축을 중심으로 90도 회전)
  clockMesh.rotation.z = Math.PI / 2;
  clockMesh.castShadow = true;
  clockMesh.receiveShadow = true;
  group.add(clockMesh);
  
  // 시계 바늘들
  const hourHandGeometry = new THREE.BoxGeometry(0.15, 0.01, 0.01);
  const minuteHandGeometry = new THREE.BoxGeometry(0.18, 0.008, 0.008);
  const handMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
  
  const hourHand = new THREE.Mesh(hourHandGeometry, handMaterial);
  hourHand.position.y = 0.03;
  hourHand.rotation.z = Math.PI / 4; // 3시 방향
  group.add(hourHand);
  
  const minuteHand = new THREE.Mesh(minuteHandGeometry, handMaterial);
  minuteHand.position.y = 0.03;
  minuteHand.rotation.z = Math.PI / 2; // 12시 방향
  group.add(minuteHand);
  
  // 시계 중심점
  const centerGeometry = new THREE.SphereGeometry(0.01, 8, 8);
  const centerMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
  const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
  centerMesh.position.y = 0.03;
  group.add(centerMesh);
  
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
