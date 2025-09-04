import { Vector3, Euler } from 'three';

// 가구 카테고리 타입
export type FurnitureCategory =
  | 'living'      // 거실
  | 'bedroom'     // 침실
  | 'kitchen'     // 주방
  | 'bathroom'    // 욕실
  | 'office'      // 사무실
  | 'outdoor'     // 실외
  | 'decorative'  // 장식품
  | 'storage';    // 수납

// 가구 아이템 타입
export interface FurnitureItem {
  id: string;
  name: string;
  nameKo: string;           // 한국어 이름
  category: FurnitureCategory;
  subcategory?: string;     // 서브 카테고리 (예: 'sofa', 'chair', 'table')

  // 3D 모델 정보
  modelPath: string | null; // GLTF/GLB 파일 경로 (null이면 폴백 모델 사용)
  thumbnailPath?: string;   // 썸네일 이미지 경로

  // 물리적 속성
  footprint: {
    width: number;          // 너비 (미터)
    depth: number;          // 깊이 (미터)
    height: number;         // 높이 (미터)
  };

  // 배치 관련 속성
  placement: {
    canRotate: boolean;     // 회전 가능 여부
    canScale: boolean;      // 크기 조절 가능 여부
    floorOffset: number;    // 바닥에서의 오프셋 (미터)
    wallOffset?: number;    // 벽에서의 오프셋 (벽에 붙이는 가구용)
    wallOnly?: boolean;     // 벽에만 배치 가능한지 여부 (시계 등)
    wallHeight?: number;    // 벽에 배치할 때의 높이 (미터)
  };

  // 메타데이터
  metadata: {
    brand?: string;         // 브랜드
    model?: string;         // 모델명
    price?: number;         // 가격
    description?: string;   // 설명
    tags: string[];         // 태그 (검색용)
    materials?: string[];   // 재질
    colors?: string[];      // 사용 가능한 색상
  };

  // 렌더링 설정
  renderSettings: {
    castShadow: boolean;    // 그림자 생성 여부
    receiveShadow: boolean; // 그림자 수신 여부
    defaultScale: Vector3;  // 기본 크기
    defaultRotation: Euler; // 기본 회전
  };

  // 편집 모드 설정
  editSettings: {
    snapToGrid: boolean;    // 그리드에 스냅 여부
    rotationSnap: number;   // 회전 스냅 각도 (도)
    collisionGroup: string; // 충돌 감지 그룹
  };
}

// 가구 카탈로그 타입
export interface FurnitureCatalog {
  version: string;
  lastUpdated: string;
  categories: {
    [key in FurnitureCategory]: {
      name: string;
      nameKo: string;
      description: string;
      items: FurnitureItem[];
    };
  };
}

// 가구 검색 필터 타입
export interface FurnitureFilter {
  category?: FurnitureCategory;
  subcategory?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  materials?: string[];
  colors?: string[];
  tags?: string[];
  searchQuery?: string;
}

// 가구 검색 결과 타입
export interface FurnitureSearchResult {
  items: FurnitureItem[];
  totalCount: number;
  filteredCount: number;
  categories: {
    [key in FurnitureCategory]: number;
  };
}

// 가구 배치 정보 타입 (편집 모드에서 사용)
export interface PlacedFurniture {
  id: string;
  furnitureId: string;      // FurnitureItem의 ID
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
  placedAt: Date;
  lastModified: Date;
}

// 가구 프리셋 타입 (자주 사용하는 조합)
export interface FurniturePreset {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  category: FurnitureCategory;
  items: {
    furnitureId: string;
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
  }[];
  thumbnailPath?: string;
  tags: string[];
}
