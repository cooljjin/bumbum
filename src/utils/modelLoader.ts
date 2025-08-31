import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { FurnitureItem } from '../types/furniture';

// GLTF 로더 인스턴스 생성 (싱글톤 패턴)
let gltfLoader: GLTFLoader | null = null;
let dracoLoader: DRACOLoader | null = null;

/**
 * GLTF 로더 인스턴스를 반환하는 함수
 * DRACO 압축 지원 포함
 */
export const getGLTFLoader = (): GLTFLoader => {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();

    // DRACO 압축 지원 설정
    if (!dracoLoader) {
      dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/'); // DRACO 디코더 경로 설정
    }

    gltfLoader.setDRACOLoader(dracoLoader);
  }

  return gltfLoader;
};

/**
 * 가구 모델을 로딩하는 함수
 * @param modelPath 모델 파일 경로
 * @returns Promise<THREE.Group> 로딩된 3D 모델
 */
export const loadFurnitureModel = async (modelPath: string): Promise<THREE.Group> => {
  return new Promise((resolve, reject) => {
    // 더미 GLB 파일인지 확인 (텍스트 파일로 생성된 경우)
    if (modelPath.endsWith('.glb')) {
      // 더미 파일인 경우 실제 3D 모델 생성
      try {
        const model = createDummyFurnitureModel(modelPath);
        resolve(model);
      } catch (error) {
        console.error(`Error creating dummy model for ${modelPath}:`, error);
        reject(error);
      }
      return;
    }

    // 실제 GLB 파일인 경우 기존 로더 사용
    const loader = getGLTFLoader();

    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;

        // 모델의 모든 메시에 그림자 설정
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        resolve(model);
      },
      (progress) => {
        // 로딩 진행률 처리 (필요시)
        console.log(`Loading ${modelPath}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error(`Error loading model ${modelPath}:`, error);
        reject(error);
      }
    );
  });
};

/**
 * 더미 GLB 파일을 위한 실제 3D 모델 생성 함수
 */
const createDummyFurnitureModel = (modelPath: string): THREE.Group => {
  const group = new THREE.Group();

  // 파일명에서 가구 타입 추출
  const fileName = modelPath.split('/').pop()?.replace('.glb', '') || '';

  // 가구 타입에 따른 기본 치수 설정
  let width = 1.0, depth = 1.0, height = 1.0;
  let color = 0xcccccc;

  if (fileName.includes('sofa')) {
    width = 2.0; depth = 0.8; height = 0.85;
    color = 0x8B4513; // 갈색
  } else if (fileName.includes('table')) {
    width = 1.2; depth = 0.6; height = 0.45;
    color = 0xDEB887; // 버건디
  } else if (fileName.includes('chair')) {
    width = 0.6; depth = 0.6; height = 0.9;
    color = 0x4169E1; // 왕청색
  } else if (fileName.includes('bed')) {
    width = 1.6; depth = 2.0; height = 0.6;
    color = 0x8B4513; // 갈색
  } else if (fileName.includes('bookshelf')) {
    width = 1.0; depth = 0.4; height = 2.0;
    color = 0x654321; // 어두운 갈색
  } else if (fileName.includes('lamp')) {
    width = 0.3; depth = 0.3; height = 1.5;
    color = 0xFFD700; // 금색
  }

  // 기본 박스 지오메트리 생성
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshLambertMaterial({
    color: color,
    transparent: true,
    opacity: 0.9
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = height / 2;

  // 그림자 설정
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  group.add(mesh);

  // 메타데이터 추가
  (group as any).furnitureData = {
    id: fileName,
    name: fileName.replace(/-/g, ' ').replace(/\d+/g, ''),
    modelPath: modelPath,
    footprint: { width, depth, height },
    category: 'furniture',
    isDummy: true
  };

  return group;
};

/**
 * 가구 모델을 배치 가능한 형태로 로딩하는 함수
 * @param furniture 가구 아이템 정보
 * @returns Promise<THREE.Group> 배치 가능한 3D 모델
 */
export const loadFurnitureModelForPlacement = async (furniture: FurnitureItem): Promise<THREE.Group> => {
  try {
    const model = await loadFurnitureModel(furniture.modelPath);

    // 모델을 기본 위치와 회전으로 설정
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.set(1, 1, 1);

    // 모델에 메타데이터 추가
    (model as any).furnitureData = furniture;

    return model;
  } catch (error) {
    console.error(`Failed to load furniture model for ${furniture.name}:`, error);
    throw error;
  }
};

/**
 * 모델 로딩 상태를 추적하는 클래스
 */
export class ModelLoadingManager {
  private loadingModels = new Map<string, Promise<THREE.Group>>();
  private loadedModels = new Map<string, THREE.Group>();
  private failedModels = new Set<string>();

  /**
   * 모델 로딩 시작
   */
  startLoading(modelPath: string): Promise<THREE.Group> {
    if (this.loadedModels.has(modelPath)) {
      return Promise.resolve(this.loadedModels.get(modelPath)!);
    }

    if (this.failedModels.has(modelPath)) {
      return Promise.reject(new Error(`Model ${modelPath} previously failed to load`));
    }

    if (this.loadingModels.has(modelPath)) {
      return this.loadingModels.get(modelPath)!;
    }

    const loadingPromise = loadFurnitureModel(modelPath)
      .then((model) => {
        this.loadedModels.set(modelPath, model);
        this.loadingModels.delete(modelPath);
        return model;
      })
      .catch((error) => {
        this.failedModels.add(modelPath);
        this.loadingModels.delete(modelPath);
        throw error;
      });

    this.loadingModels.set(modelPath, loadingPromise);
    return loadingPromise;
  }

  /**
   * 로딩 중인 모델 수 반환
   */
  getLoadingCount(): number {
    return this.loadingModels.size;
  }

  /**
   * 로딩된 모델 수 반환
   */
  getLoadedCount(): number {
    return this.loadedModels.size;
  }

  /**
   * 로딩 실패한 모델 수 반환
   */
  getFailedCount(): number {
    return this.failedModels.size;
  }

  /**
   * 특정 모델의 로딩 상태 확인
   */
  getModelStatus(modelPath: string): 'loading' | 'loaded' | 'failed' | 'not_started' {
    if (this.loadingModels.has(modelPath)) return 'loading';
    if (this.loadedModels.has(modelPath)) return 'loaded';
    if (this.failedModels.has(modelPath)) return 'failed';
    return 'not_started';
  }

  /**
   * 모든 모델 로딩 완료 대기
   */
  async waitForAllModels(): Promise<void> {
    const promises = Array.from(this.loadingModels.values());
    if (promises.length === 0) return;

    await Promise.allSettled(promises);
  }

  /**
   * 로딩 관리자 초기화
   */
  clear(): void {
    this.loadingModels.clear();
    this.loadedModels.clear();
    this.failedModels.clear();
  }
}

// 전역 모델 로딩 관리자 인스턴스
export const globalModelLoader = new ModelLoadingManager();

/**
 * 가구 카탈로그의 모든 모델을 미리 로딩하는 함수
 * 편집 모드 진입 시 사용
 */
export const preloadAllFurnitureModels = async (): Promise<void> => {
  const { getAllFurnitureItems } = await import('../data/furnitureCatalog');
  const furnitureItems = getAllFurnitureItems();

  const loadPromises = furnitureItems.map(item =>
    globalModelLoader.startLoading(item.modelPath)
  );

  await Promise.allSettled(loadPromises);
  console.log('All furniture models preloaded');
};

/**
 * 가구 타입별 실제 3D 모델 생성 함수들
 */

// 테이블 생성 함수
export const createTableModel = (furniture: FurnitureItem): THREE.Group => {
  const group = new THREE.Group();

  // 테이블 상판
  const tableTopGeometry = new THREE.BoxGeometry(
    furniture.footprint.width,
    0.05,
    furniture.footprint.depth
  );
  const tableTopMaterial = new THREE.MeshLambertMaterial({
    color: 0x8B4513 // 갈색
  });
  const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
  tableTop.position.y = furniture.footprint.height - 0.025;
  group.add(tableTop);

  // 테이블 다리들 (4개)
  const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, furniture.footprint.height - 0.05, 8);
  const legMaterial = new THREE.MeshLambertMaterial({
    color: 0x654321 // 어두운 갈색
  });

  const legPositions = [
    [-furniture.footprint.width/2 + 0.1, furniture.footprint.height/2 - 0.025, -furniture.footprint.depth/2 + 0.1],
    [furniture.footprint.width/2 - 0.1, furniture.footprint.height/2 - 0.025, -furniture.footprint.depth/2 + 0.1],
    [-furniture.footprint.width/2 + 0.1, furniture.footprint.height/2 - 0.025, furniture.footprint.depth/2 - 0.1],
    [furniture.footprint.width/2 - 0.1, furniture.footprint.height/2 - 0.025, furniture.footprint.depth/2 - 0.1]
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(pos[0], pos[1], pos[2]);
    group.add(leg);
  });

  return group;
};

// 의자 생성 함수
export const createChairModel = (furniture: FurnitureItem): THREE.Group => {
  const group = new THREE.Group();

  // 의자 좌석
  const seatGeometry = new THREE.BoxGeometry(
    furniture.footprint.width,
    0.05,
    furniture.footprint.depth
  );
  const seatMaterial = new THREE.MeshLambertMaterial({
    color: 0x4169E1 // 왕청색
  });
  const seat = new THREE.Mesh(seatGeometry, seatMaterial);
  seat.position.y = furniture.footprint.height * 0.4;
  group.add(seat);

  // 의자 등받이
  const backGeometry = new THREE.BoxGeometry(
    furniture.footprint.width,
    furniture.footprint.height * 0.6,
    0.05
  );
  const backMaterial = new THREE.MeshLambertMaterial({
    color: 0x4682B4 // 청색
  });
  const back = new THREE.Mesh(backGeometry, backMaterial);
  back.position.y = furniture.footprint.height * 0.7;
  back.position.z = -furniture.footprint.depth/2 + 0.025;
  group.add(back);

  // 의자 다리들 (4개)
  const legGeometry = new THREE.CylinderGeometry(0.015, 0.015, furniture.footprint.height * 0.4, 6);
  const legMaterial = new THREE.MeshLambertMaterial({
    color: 0x8B4513 // 갈색
  });

  const legPositions = [
    [-furniture.footprint.width/2 + 0.08, furniture.footprint.height * 0.2, -furniture.footprint.depth/2 + 0.08],
    [furniture.footprint.width/2 - 0.08, furniture.footprint.height * 0.2, -furniture.footprint.depth/2 + 0.08],
    [-furniture.footprint.width/2 + 0.08, furniture.footprint.height * 0.2, furniture.footprint.depth/2 - 0.08],
    [furniture.footprint.width/2 - 0.08, furniture.footprint.height * 0.2, furniture.footprint.depth/2 - 0.08]
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(pos[0], pos[1], pos[2]);
    group.add(leg);
  });

  return group;
};

// 소파 생성 함수
export const createSofaModel = (furniture: FurnitureItem): THREE.Group => {
  const group = new THREE.Group();

  // 소파 본체 (좌석)
  const seatGeometry = new THREE.BoxGeometry(
    furniture.footprint.width,
    furniture.footprint.height * 0.4,
    furniture.footprint.depth
  );
  const seatMaterial = new THREE.MeshLambertMaterial({
    color: 0xDC143C // 진홍색
  });
  const seat = new THREE.Mesh(seatGeometry, seatMaterial);
  seat.position.y = furniture.footprint.height * 0.2;
  group.add(seat);

  // 소파 등받이
  const backGeometry = new THREE.BoxGeometry(
    furniture.footprint.width,
    furniture.footprint.height * 0.6,
    furniture.footprint.depth * 0.3
  );
  const backMaterial = new THREE.MeshLambertMaterial({
    color: 0xB22222 // 파이어 브릭
  });
  const back = new THREE.Mesh(backGeometry, backMaterial);
  back.position.y = furniture.footprint.height * 0.5;
  back.position.z = -furniture.footprint.depth * 0.35;
  group.add(back);

  // 소파 팔걸이 (좌측)
  const armGeometry = new THREE.BoxGeometry(
    furniture.footprint.width * 0.1,
    furniture.footprint.height * 0.8,
    furniture.footprint.depth
  );
  const armMaterial = new THREE.MeshLambertMaterial({
    color: 0x8B0000 // 다크 레드
  });
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.x = -furniture.footprint.width/2 + furniture.footprint.width * 0.05;
  leftArm.position.y = furniture.footprint.height * 0.4;
  group.add(leftArm);

  // 소파 팔걸이 (우측)
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.x = furniture.footprint.width/2 - furniture.footprint.width * 0.05;
  rightArm.position.y = furniture.footprint.height * 0.4;
  group.add(rightArm);

  return group;
};

// 책장 생성 함수
export const createBookshelfModel = (furniture: FurnitureItem): THREE.Group => {
  const group = new THREE.Group();

  // 책장 프레임
  const frameGeometry = new THREE.BoxGeometry(
    furniture.footprint.width,
    furniture.footprint.height,
    furniture.footprint.depth * 0.1
  );
  const frameMaterial = new THREE.MeshLambertMaterial({
    color: 0x8B4513 // 갈색
  });

  // 앞면과 뒷면 프레임
  const frontFrame = new THREE.Mesh(frameGeometry, frameMaterial);
  frontFrame.position.z = furniture.footprint.depth/2 - furniture.footprint.depth * 0.05;
  group.add(frontFrame);

  const backFrame = new THREE.Mesh(frameGeometry, frameMaterial);
  backFrame.position.z = -furniture.footprint.depth/2 + furniture.footprint.depth * 0.05;
  group.add(backFrame);

  // 측면 프레임
  const sideGeometry = new THREE.BoxGeometry(
    furniture.footprint.depth * 0.1,
    furniture.footprint.height,
    furniture.footprint.depth
  );
  const leftSide = new THREE.Mesh(sideGeometry, frameMaterial);
  leftSide.position.x = -furniture.footprint.width/2 + furniture.footprint.depth * 0.05;
  group.add(leftSide);

  const rightSide = new THREE.Mesh(sideGeometry, frameMaterial);
  rightSide.position.x = furniture.footprint.width/2 - furniture.footprint.depth * 0.05;
  group.add(rightSide);

  // 선반들 (5개)
  const shelfGeometry = new THREE.BoxGeometry(
    furniture.footprint.width - furniture.footprint.depth * 0.2,
    0.02,
    furniture.footprint.depth - furniture.footprint.depth * 0.2
  );
  const shelfMaterial = new THREE.MeshLambertMaterial({
    color: 0xDEB887 // 버건디
  });

  const shelfCount = 5;
  for (let i = 0; i < shelfCount; i++) {
    const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
    shelf.position.y = (i + 1) * (furniture.footprint.height / (shelfCount + 1)) - furniture.footprint.height / 2;
    group.add(shelf);
  }

  return group;
};

// 침대 생성 함수
export const createBedModel = (furniture: FurnitureItem): THREE.Group => {
  const group = new THREE.Group();

  // 침대 프레임
  const frameGeometry = new THREE.BoxGeometry(
    furniture.footprint.width,
    furniture.footprint.height * 0.2,
    furniture.footprint.depth
  );
  const frameMaterial = new THREE.MeshLambertMaterial({
    color: 0x8B4513 // 갈색
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.position.y = furniture.footprint.height * 0.1;
  group.add(frame);

  // 매트리스
  const mattressGeometry = new THREE.BoxGeometry(
    furniture.footprint.width - 0.1,
    furniture.footprint.height * 0.3,
    furniture.footprint.depth - 0.1
  );
  const mattressMaterial = new THREE.MeshLambertMaterial({
    color: 0xF5F5DC // 베이지
  });
  const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
  mattress.position.y = furniture.footprint.height * 0.35;
  group.add(mattress);

  // 베개
  const pillowGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.3);
  const pillowMaterial = new THREE.MeshLambertMaterial({
    color: 0xFFFFFF // 흰색
  });
  const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
  pillow.position.y = furniture.footprint.height * 0.5;
  pillow.position.z = -furniture.footprint.depth/2 + 0.25;
  group.add(pillow);

  return group;
};

// 캐비닛/서랍장 생성 함수
export const createCabinetModel = (furniture: FurnitureItem): THREE.Group => {
  const group = new THREE.Group();

  // 캐비닛 본체
  const bodyGeometry = new THREE.BoxGeometry(
    furniture.footprint.width,
    furniture.footprint.height,
    furniture.footprint.depth
  );
  const bodyMaterial = new THREE.MeshLambertMaterial({
    color: 0x8B4513 // 갈색
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = furniture.footprint.height / 2;
  group.add(body);

  // 서랍들 (3개)
  const drawerGeometry = new THREE.BoxGeometry(
    furniture.footprint.width - 0.1,
    furniture.footprint.height * 0.25,
    furniture.footprint.depth - 0.05
  );
  const drawerMaterial = new THREE.MeshLambertMaterial({
    color: 0x654321 // 어두운 갈색
  });

  const drawerCount = 3;
  for (let i = 0; i < drawerCount; i++) {
    const drawer = new THREE.Mesh(drawerGeometry, drawerMaterial);
    const yPos = (i + 1) * (furniture.footprint.height / (drawerCount + 1)) - furniture.footprint.height / 2;
    drawer.position.y = yPos;
    drawer.position.z = 0.025;
    group.add(drawer);

    // 서랍 손잡이
    const handleGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8);
    const handleMaterial = new THREE.MeshLambertMaterial({
      color: 0xFFD700 // 금색
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.x = furniture.footprint.width / 2 - 0.05;
    handle.position.y = yPos;
    handle.position.z = furniture.footprint.depth / 2 + 0.01;
    group.add(handle);
  }

  return group;
};

/**
 * 가구 타입에 따른 실제 3D 모델 생성
 */
export const createFurnitureModel = (furniture: FurnitureItem): THREE.Group => {
  let model: THREE.Group;

  switch (furniture.category) {
    case 'living':
      if (furniture.subcategory === 'sofa') {
        model = createSofaModel(furniture);
      } else if (furniture.subcategory === 'table') {
        model = createTableModel(furniture);
      } else {
        model = createTableModel(furniture); // 기본 테이블
      }
      break;

    case 'bedroom':
      if (furniture.subcategory === 'bed') {
        model = createBedModel(furniture);
      } else {
        model = createCabinetModel(furniture); // 기본 캐비닛
      }
      break;

    case 'kitchen':
      model = createCabinetModel(furniture);
      break;

    case 'office':
      if (furniture.subcategory === 'desk') {
        model = createTableModel(furniture);
      } else {
        model = createChairModel(furniture);
      }
      break;

    case 'storage':
      if (furniture.subcategory === 'bookshelf') {
        model = createBookshelfModel(furniture);
      } else {
        model = createCabinetModel(furniture);
      }
      break;

    default:
      model = createTableModel(furniture); // 기본 테이블
  }

  // 모든 메시에 그림자 설정
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // 메타데이터 추가
  (model as any).furnitureData = furniture;
  (model as any).isRealModel = true;

  return model;
};

/**
 * 모델 로딩 에러 처리 및 폴백 모델 생성 (기존 함수 유지)
 */
export const createFallbackModel = (furniture: FurnitureItem): THREE.Group => {
  const group = new THREE.Group();

  // 안전성 검사: furniture와 footprint가 존재하는지 확인
  if (!furniture || !furniture.footprint) {
    console.warn('Invalid furniture data for fallback model:', furniture);
    // 기본 박스 모델 반환
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.5;
    group.add(mesh);
    return group;
  }

  // 간단한 박스 지오메트리로 폴백 모델 생성
  const geometry = new THREE.BoxGeometry(
    furniture.footprint.width,
    furniture.footprint.height,
    furniture.footprint.depth
  );
  const material = new THREE.MeshLambertMaterial({
    color: 0xcccccc,
    transparent: true,
    opacity: 0.7
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = furniture.footprint.height / 2;

  group.add(mesh);

  // 메타데이터 추가
  (group as any).furnitureData = furniture;
  (group as any).isFallback = true;

  return group;
};

// === 충돌 감지 및 스마트 플레이스먼트 유틸리티 함수들 ===
import { PlacedItem } from '../types/editor';

/**
 * 두 가구 아이템 간의 충돌을 감지하는 함수
 * 간단한 AABB (Axis-Aligned Bounding Box) 충돌 감지 알고리즘 사용
 */
export const checkCollision = (item1: PlacedItem, item2: PlacedItem): boolean => {
  const box1 = getBoundingBox(item1);
  const box2 = getBoundingBox(item2);

  return box1.intersectsBox(box2);
};

/**
 * 가구 아이템의 바운딩 박스를 계산하는 함수
 */
export const getBoundingBox = (item: PlacedItem): THREE.Box3 => {
  const halfWidth = item.footprint.width / 2;
  const halfDepth = item.footprint.depth / 2;

  const min = new THREE.Vector3(
    item.position.x - halfWidth,
    item.position.y,
    item.position.z - halfDepth
  );

  const max = new THREE.Vector3(
    item.position.x + halfWidth,
    item.position.y + item.footprint.height,
    item.position.z + halfDepth
  );

  return new THREE.Box3(min, max);
};

/**
 * 스마트 플레이스먼트: 충돌을 최소화하는 최적의 위치를 찾는 함수
 */
export const findSmartPlacement = (
  newItem: PlacedItem,
  existingItems: PlacedItem[],
  gridSize: number = 1.0
): THREE.Vector3 => {
  const originalPosition = newItem.position.clone();
  let bestPosition = originalPosition.clone();
  let minCollisions = Infinity;

  // 주변 그리드 포인트들을 확인 (3x3 그리드)
  const searchRadius = 3;
  const stepSize = gridSize;

  for (let x = -searchRadius; x <= searchRadius; x++) {
    for (let z = -searchRadius; z <= searchRadius; z++) {
      const testPosition = new THREE.Vector3(
        originalPosition.x + (x * stepSize),
        originalPosition.y,
        originalPosition.z + (z * stepSize)
      );

      // 테스트 위치에서 충돌 검사
      const testItem = { ...newItem, position: testPosition };
      let collisionCount = 0;

      for (const existingItem of existingItems) {
        if (checkCollision(testItem, existingItem)) {
          collisionCount++;
        }
      }

      // 더 적은 충돌을 가진 위치를 선택
      if (collisionCount < minCollisions) {
        minCollisions = collisionCount;
        bestPosition = testPosition;
      }

      // 충돌이 전혀 없는 위치를 찾으면 즉시 반환
      if (collisionCount === 0) {
        return testPosition;
      }
    }
  }

  return bestPosition;
};

/**
 * 벽과의 충돌을 방지하여 위치를 조정하는 함수
 */
export const avoidWallCollision = (
  item: PlacedItem,
  roomBounds: { width: number; depth: number }
): THREE.Vector3 => {
  const margin = 0.1; // 벽과의 최소 거리
  const halfWidth = item.footprint.width / 2;
  const halfDepth = item.footprint.depth / 2;

  const newPosition = item.position.clone();

  // 벽과의 충돌 검사 및 위치 조정
  if (item.position.x - halfWidth < -roomBounds.width / 2) {
    newPosition.x = -roomBounds.width / 2 + halfWidth + margin;
  } else if (item.position.x + halfWidth > roomBounds.width / 2) {
    newPosition.x = roomBounds.width / 2 - halfWidth - margin;
  }

  if (item.position.z - halfDepth < -roomBounds.depth / 2) {
    newPosition.z = -roomBounds.depth / 2 + halfDepth + margin;
  } else if (item.position.z + halfDepth > roomBounds.depth / 2) {
    newPosition.z = roomBounds.depth / 2 - halfDepth - margin;
  }

  return newPosition;
};

/**
 * 스마트 배치 추천 위치들을 계산하는 함수
 */
export const getPlacementSuggestions = (
  newItem: PlacedItem,
  existingItems: PlacedItem[],
  roomBounds: { width: number; depth: number }
): THREE.Vector3[] => {
  const suggestions: THREE.Vector3[] = [];

  // 기존 가구 주변의 좋은 위치들 추천
  for (const existingItem of existingItems) {
    const suggestionsForItem = [
      // 기존 가구의 오른쪽
      new THREE.Vector3(
        existingItem.position.x + existingItem.footprint.width / 2 + newItem.footprint.width / 2 + 0.5,
        existingItem.position.y,
        existingItem.position.z
      ),
      // 기존 가구의 왼쪽
      new THREE.Vector3(
        existingItem.position.x - existingItem.footprint.width / 2 - newItem.footprint.width / 2 - 0.5,
        existingItem.position.y,
        existingItem.position.z
      ),
      // 기존 가구의 앞쪽
      new THREE.Vector3(
        existingItem.position.x,
        existingItem.position.y,
        existingItem.position.z + existingItem.footprint.depth / 2 + newItem.footprint.depth / 2 + 0.5
      ),
      // 기존 가구의 뒤쪽
      new THREE.Vector3(
        existingItem.position.x,
        existingItem.position.y,
        existingItem.position.z - existingItem.footprint.depth / 2 - newItem.footprint.depth / 2 - 0.5
      )
    ];

    // 벽 충돌을 고려하여 유효한 위치들만 추가
    for (const suggestion of suggestionsForItem) {
      const testItem = { ...newItem, position: suggestion };
      const wallAdjustedPosition = avoidWallCollision(testItem, roomBounds);

      // 충돌이 적은 위치만 추천
      let collisionCount = 0;
      for (const otherItem of existingItems) {
        if (otherItem.id !== existingItem.id) {
          const testWithWall = { ...newItem, position: wallAdjustedPosition };
          if (checkCollision(testWithWall, otherItem)) {
            collisionCount++;
          }
        }
      }

      if (collisionCount === 0) {
        suggestions.push(wallAdjustedPosition);
      }
    }
  }

  // 최대 5개의 추천 위치만 반환
  return suggestions.slice(0, 5);
};

/**
 * 가구 배치 시 충돌을 감지하고 시각적 피드백을 위한 함수
 */
export const detectPlacementConflicts = (
  newItem: PlacedItem,
  existingItems: PlacedItem[]
): { hasCollision: boolean; collidingItems: PlacedItem[] } => {
  const collidingItems: PlacedItem[] = [];

  for (const existingItem of existingItems) {
    if (checkCollision(newItem, existingItem)) {
      collidingItems.push(existingItem);
    }
  }

  return {
    hasCollision: collidingItems.length > 0,
    collidingItems
  };
};
