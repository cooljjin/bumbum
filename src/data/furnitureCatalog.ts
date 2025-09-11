import { Vector3, Euler } from 'three';
import { FurnitureCatalog, FurnitureItem } from '../types/furniture';
import { PlacedItem } from '../types/editor';

// 기본 Vector3와 Euler 객체 생성 헬퍼 함수
const v3 = (x: number, y: number, z: number): Vector3 => new Vector3(x, y, z);
const e = (x: number, y: number, z: number): Euler => new Euler(x, y, z);

// 수동으로 추가한 가구 데이터만 유지
export const sampleFurniture: FurnitureItem[] = [
  // === Weird Table ===
  {
    id: 'weirdtable',
    name: 'Weird Table',
    nameKo: '위어드 테이블',
    category: 'living',
    subcategory: 'table',
    modelPath: '/models/furniture/weirdtable.glb',
    thumbnailPath: '/thumbnails/furniture/weirdtable.svg',
    footprint: {
      width: 1.6,
      depth: 1.4,
      height: 1.2
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'CustomFurniture',
      model: 'CF-WT-001',
      price: 180000,
      description: '독특하고 특별한 디자인의 위어드 테이블',
      tags: ['테이블', '위어드', '독특한', '특별한', '디자인'],
      materials: ['나무', '메탈'],
      colors: ['우드', '블랙', '실버']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 15,
      collisionGroup: 'furniture'
    }
  },

  // === Cozy Bed ===
  {
    id: 'cozybed',
    name: 'Cozy Bed',
    nameKo: '코지 침대',
    category: 'bedroom',
    subcategory: 'bed',
    modelPath: '/models/furniture/Cozy_bed_0909043453_texture.glb',
    thumbnailPath: '/thumbnails/furniture/cozybed.svg',
    footprint: {
      width: 2.0,
      depth: 1.5,
      height: 0.8
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'CozyFurniture',
      model: 'CF-BED-001',
      price: 450000,
      description: '편안하고 아늑한 침대',
      tags: ['침대', '코지', '편안한', '아늑한', '침실'],
      materials: ['나무', '천', '폼'],
      colors: ['우드', '화이트', '블루', '그레이']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 15,
      collisionGroup: 'furniture'
    }
  },

  // === Test Table ===
  {
    id: 'testtable',
    name: 'Test Table',
    nameKo: '테스트 테이블',
    category: 'living',
    subcategory: 'table',
    modelPath: '/models/furniture/testtable.glb',
    thumbnailPath: '/thumbnails/furniture/testtable.svg',
    footprint: {
      width: 1.2,
      depth: 0.8,
      height: 0.75
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'TestFurniture',
      model: 'TF-TT-001',
      price: 120000,
      description: '테스트용 테이블 모델',
      tags: ['테이블', '테스트', '실험용'],
      materials: ['나무', '메탈'],
      colors: ['우드', '블랙']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 15,
      collisionGroup: 'furniture'
    }
  },

  // === Golden Glow Lamp ===
  {
    id: 'golden-glow-lamp-0904034529',
    name: 'Golden Glow Lamp',
    nameKo: '골든 글로우 램프',
    category: 'living',
    subcategory: 'lighting',
    modelPath: '/models/furniture/Golden_Glow_Lamp_0904034529_texture.glb',
    thumbnailPath: '/thumbnails/furniture/golden-glow-lamp-0904034529.png',
    footprint: {
      width: 0.4,
      depth: 0.4,
      height: 0.7
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'GoldenGlow',
      model: 'GG-L-0904034529',
      price: 120000,
      description: '부드러운 황금빛 글로우를 내는 세련된 테이블 램프',
      tags: ['조명', '테이블램프', '골든', '글로우', '세련됨', '황금빛'],
      materials: ['유리', '크롬', '금속'],
      colors: ['골드', '크롬', '크림']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 15,
      collisionGroup: 'lighting'
    }
  },

  // === Test Bed ===
  {
    id: 'testbed',
    name: 'Test Bed',
    nameKo: '테스트 침대',
    category: 'bedroom',
    subcategory: 'bed',
    modelPath: '/models/furniture/_testbed.glb',
    thumbnailPath: '/thumbnails/furniture/bed-001.svg',
    footprint: {
      width: 1.6,
      depth: 2.0,
      height: 0.6
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'TestFurniture',
      model: 'TF-TB-001',
      price: 600000,
      description: '테스트용 침대 모델',
      tags: ['침대', '테스트', '실험용', '침실'],
      materials: ['나무', '천'],
      colors: ['우드', '화이트', '블랙']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 90,
      collisionGroup: 'furniture'
    }
  },

  // === Cozy Bed ===
  {
    id: 'cozy-bed-0909043453',
    name: 'Cozy Bed',
    nameKo: '아늑한 침대',
    category: 'bedroom',
    subcategory: 'bed',
    modelPath: '/models/furniture/Cozy_bed_0909043453_texture.glb',
    thumbnailPath: '/thumbnails/furniture/bed-001.svg',
    footprint: {
      width: 1.2,
      depth: 2.0,
      height: 0.6
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'CozyHome',
      model: 'CH-CB-0909043453',
      price: 550000,
      description: '따뜻한 나무 톤과 둥근 모서리로 아늑한 느낌을 주는 싱글 침대',
      tags: ['침대', '싱글', '아늑한', '따뜻한', '나무톤', '둥근모서리', '침실'],
      materials: ['나무', '천', '쿠션'],
      colors: ['라이트우드', '크림', '라벤더']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 90,
      collisionGroup: 'furniture'
    }
  },

  // === Wall Clock ===
  {
    id: 'clock',
    name: 'Wall Clock',
    nameKo: '벽시계',
    category: 'decorative',
    subcategory: 'clock',
    modelPath: '/models/furniture/clock.glb',
    thumbnailPath: '/thumbnails/furniture/clock.svg.png',
    footprint: {
      width: 0.4,
      depth: 0.1,
      height: 0.4
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0,
      wallOnly: true,
      wallHeight: 1.8
    },
    metadata: {
      brand: 'TimeDesign',
      model: 'TD-C-001',
      price: 45000,
      description: '우아하고 실용적인 벽시계',
      tags: ['시계', '벽걸이', '우아한', '실용적'],
      materials: ['나무', '유리'],
      colors: ['우드', '화이트', '블랙']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, Math.PI / 2)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 15,
      collisionGroup: 'furniture'
    }
  },

  // === Modern Digital Clock ===
  {
    id: 'clock-modern-001',
    name: 'Modern Digital Clock',
    nameKo: '모던 디지털 시계',
    category: 'decorative',
    subcategory: 'clock',
    modelPath: '/models/furniture/clock_black_updated.glb',
    thumbnailPath: '/thumbnails/furniture/clock.svg.png',
    footprint: {
      width: 0.3,
      depth: 0.05,
      height: 0.2
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'TechTime',
      model: 'TT-DC-001',
      price: 65000,
      description: '현대적인 디지털 디스플레이가 있는 벽시계',
      tags: ['시계', '디지털', '모던', '벽걸이', '현대적'],
      materials: ['플라스틱', '메탈'],
      colors: ['블랙', '화이트', '실버']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 15,
      collisionGroup: 'furniture'
    }
  },

  // === Wooden Floor ===
  {
    id: 'floor-wooden',
    name: 'Wooden Floor',
    nameKo: '나무 바닥',
    category: 'floor',
    subcategory: 'wood',
    modelPath: '/models/floor/floor_wooden.png', // 바닥 텍스처 경로
    thumbnailPath: '/thumbnails/floor/floor_wooden.png',
    footprint: {
      width: 10,  // 방 크기에 맞춰 큰 값으로 설정
      depth: 10,  // 방 크기에 맞춰 큰 값으로 설정
      height: 0.02 // 바닥 두께
    },
    placement: {
      canRotate: false,  // 바닥은 회전하지 않음
      canScale: true,    // 크기 조절 가능
      floorOffset: 0     // 바닥에 바로 배치
    },
    metadata: {
      brand: 'FloorMaster',
      model: 'FM-WF-001',
      price: 150000,
      description: '고급스러운 나무 질감의 바닥재로 따뜻하고 아늑한 분위기를 연출합니다',
      tags: ['바닥', '나무', '우드', '따뜻한', '아늑한', '고급스러운'],
      materials: ['나무', '라미네이트'],
      colors: ['라이트우드', '다크우드', '메디엄우드']
    },
    renderSettings: {
      castShadow: false,     // 바닥은 그림자를 생성하지 않음
      receiveShadow: true,   // 바닥은 그림자를 받음
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 0,  // 회전하지 않으므로 0
      collisionGroup: 'floor'
    }
  },

  // === Wooden Dresser ===
  {
    id: 'wooden-dresser',
    name: 'Wooden Dresser',
    nameKo: '나무 서랍장',
    category: 'bedroom',
    subcategory: 'storage',
    modelPath: '/models/furniture/Wooden__Dresser.glb',
    thumbnailPath: '/thumbnails/furniture/dresser-001.svg',
    footprint: {
      width: 1.2,
      depth: 0.6,
      height: 1.0
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'WoodCraft',
      model: 'WC-DR-001',
      price: 280000,
      description: '고급스러운 나무 질감의 3단 서랍장으로 수납 공간을 효율적으로 활용할 수 있습니다',
      tags: ['서랍장', '나무', '수납', '침실', '고급스러운', '3단', '우드'],
      materials: ['나무', '메탈', '유리'],
      colors: ['다크우드', '라이트우드', '내추럴']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 90,
      collisionGroup: 'furniture'
    }
  },

  // === Gray Drawer ===
  {
    id: 'gray-drawer',
    name: 'Gray Drawer',
    nameKo: '그레이 서랍장',
    category: 'bedroom',
    subcategory: 'storage',
    modelPath: '/models/furniture/_gray_drawer.glb',
    thumbnailPath: '/thumbnails/furniture/dresser-001.svg',
    footprint: {
      width: 1.0,
      depth: 0.5,
      height: 0.8
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'ModernFurniture',
      model: 'MF-GD-001',
      price: 220000,
      description: '모던하고 세련된 그레이 톤의 서랍장으로 현대적인 인테리어에 완벽하게 어울립니다',
      tags: ['서랍장', '그레이', '수납', '침실', '모던', '세련된', '현대적'],
      materials: ['합판', '메탈', '플라스틱'],
      colors: ['그레이', '다크그레이', '차콜']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 90,
      collisionGroup: 'furniture'
    }
  },

  // === 벽 카테고리 ===
  {
    id: 'wall_beige',
    name: 'Beige Wall',
    nameKo: '베이지 벽',
    category: 'wall',
    subcategory: 'interior_wall',
    modelPath: '/models/wall/wall_beige.png', // 텍스처 기반 벽 모델
    thumbnailPath: '/thumbnails/wall/wall_beige.svg',
    footprint: {
      width: 3.0,  // 벽의 기본 너비
      depth: 0.1,  // 벽의 두께
      height: 2.5  // 벽의 높이
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0 // 벽은 바닥에 붙어서 배치
    },
    metadata: {
      brand: 'WallDecor',
      model: 'WD-WALL-BEIGE',
      price: 50000,
      description: '따뜻한 베이지톤의 인테리어 벽',
      tags: ['벽', '베이지', '인테리어', '따뜻한', '모던'],
      materials: ['벽지', '페인트'],
      colors: ['베이지', '크림']
    },
    renderSettings: {
      castShadow: false,  // 벽은 그림자를 드리우지 않음
      receiveShadow: true, // 하지만 그림자를 받음
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, Math.PI / 2, 0) // 벽을 세로로 세우기
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 90, // 벽은 90도 단위로 회전
      collisionGroup: 'wall'
    }
  },

  // === Cozy Sofa ===
  {
    id: 'cozy_sofa_0911122807_texture',
    name: 'Cozy Sofa',
    nameKo: '코지 소파',
    category: 'living',
    subcategory: 'sofa',
    modelPath: '/models/furniture/cozy_sofa_0911122807_texture.glb',
    thumbnailPath: '/thumbnails/furniture/cozy_sofa_0911122807_texture.svg',
    footprint: {
      width: 2.2,
      depth: 0.9,
      height: 1.05
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'CozyFurniture',
      model: 'CF-SF-001',
      price: 450000,
      description: '편안하고 아늑한 느낌의 코지 소파',
      tags: ['소파', '코지', '편안한', '아늑한', '거실'],
      materials: ['천', '폼', '목재'],
      colors: ['베이지', '그레이', '브라운']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 15,
      collisionGroup: 'furniture'
    }
  }
];

// 가구 카탈로그 생성
export const furnitureCatalog: FurnitureCatalog = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  categories: {
    living: {
      name: 'Living Room',
      nameKo: '거실',
      description: '거실에 어울리는 가구들',
      items: sampleFurniture.filter(item => item.category === 'living')
    },
    bedroom: {
      name: 'Bedroom',
      nameKo: '침실',
      description: '침실에 어울리는 가구들',
      items: sampleFurniture.filter(item => item.category === 'bedroom')
    },
    kitchen: {
      name: 'Kitchen',
      nameKo: '주방',
      description: '주방에 어울리는 가구들',
      items: []
    },
    bathroom: {
      name: 'Bathroom',
      nameKo: '욕실',
      description: '욕실에 어울리는 가구들',
      items: []
    },
    office: {
      name: 'Office',
      nameKo: '사무실',
      description: '사무실에 어울리는 가구들',
      items: []
    },
    outdoor: {
      name: 'Outdoor',
      nameKo: '실외',
      description: '실외에 어울리는 가구들',
      items: []
    },
    decorative: {
      name: 'Decorative',
      nameKo: '장식품',
      description: '공간을 아름답게 만드는 장식품들',
      items: sampleFurniture.filter(item => item.category === 'decorative')
    },
    wall: {
      name: 'Walls',
      nameKo: '벽',
      description: '벽면 장식과 인테리어 벽재',
      items: sampleFurniture.filter(item => item.category === 'wall')
    },
    storage: {
      name: 'Storage',
      nameKo: '수납',
      description: '공간을 효율적으로 활용할 수 있는 수납 가구들',
      items: sampleFurniture.filter(item => item.category === 'bedroom' && item.subcategory === 'storage')
    },
    floor: {
      name: 'Floor',
      nameKo: '바닥',
      description: '방의 바닥을 아름답게 꾸밀 수 있는 바닥재들',
      items: sampleFurniture.filter(item => item.category === 'floor')
    }
  }
};

// 모든 가구 아이템을 평면 배열로 반환하는 함수
export const getAllFurnitureItems = (): FurnitureItem[] => {
  return Object.values(furnitureCatalog.categories)
    .flatMap(category => category.items);
};

// 카테고리별 가구 아이템을 반환하는 함수
export const getFurnitureByCategory = (category: string): FurnitureItem[] => {
  return furnitureCatalog.categories[category as keyof typeof furnitureCatalog.categories]?.items || [];
};

// ID로 가구 아이템을 찾는 함수
export const getFurnitureById = (id: string): FurnitureItem | undefined => {
  return getAllFurnitureItems().find(item => item.id === id);
};

// 검색 기능
export const searchFurniture = (query: string): FurnitureItem[] => {
  const searchTerm = query.toLowerCase();
  return getAllFurnitureItems().filter(item =>
    item.name.toLowerCase().includes(searchTerm) ||
    item.nameKo.toLowerCase().includes(searchTerm) ||
    item.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    item.metadata.description?.toLowerCase().includes(searchTerm)
  );
};

// 편집 모드 전용 함수들

/**
 * FurnitureItem을 PlacedItem으로 변환하는 함수
 * 편집 모드에서 가구를 배치할 때 사용
 */
export const createPlacedItemFromFurniture = (
  furniture: FurnitureItem,
  position: Vector3 = new Vector3(0, 0, 0),
  rotation: Euler = new Euler(0, 0, 0),
  scale: Vector3 = new Vector3(1, 1, 1)
): PlacedItem => {
  return {
    id: `${furniture.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: furniture.name,
    modelPath: furniture.modelPath || '',
    position,
    rotation,
    scale,
    footprint: furniture.footprint,
    metadata: {
      category: furniture.category,
      ...(furniture.metadata.brand && { brand: furniture.metadata.brand }),
      ...(furniture.metadata.price && { price: furniture.metadata.price }),
      ...(furniture.metadata.description && { description: furniture.metadata.description }),
      furnitureId: furniture.id // furniture ID를 metadata에 저장
    }
  };
};

/**
 * PlacedItem을 FurnitureItem으로 변환하는 함수
 * 편집 모드에서 가구 정보를 복원할 때 사용
 */
export const getFurnitureFromPlacedItem = (placedItem: PlacedItem): FurnitureItem | undefined => {
  // metadata에서 furniture ID를 우선적으로 찾고, 없으면 name에서 찾음 (호환성 유지)
  let furnitureId = placedItem.metadata?.furnitureId;

  if (!furnitureId && placedItem.name) {
    // fallback: name이 furniture ID일 수 있음 (이전 버전 호환성)
    furnitureId = placedItem.name;
  }

  if (!furnitureId) {
    console.warn('PlacedItem에 furniture ID가 없습니다:', placedItem);
    return undefined;
  }

  const furniture = getFurnitureById(furnitureId);

  if (!furniture) {
    console.warn(`Furniture ID '${furnitureId}'를 찾을 수 없습니다.`);
    // 불필요한 대용량 데이터 로깅 제거 (성능 문제 방지)
    // 개발 모드에서만 상세 정보 출력
    if (process.env.NODE_ENV === 'development') {
      console.debug('배치된 아이템:', placedItem);
    }
  }

  return furniture;
};

/**
 * 가구 모델 로딩 상태를 관리하는 함수
 * GLTF 로더와 연동하여 사용
 */
export const validateModelPath = (modelPath: string): boolean => {
  // 실제 파일 존재 여부는 런타임에서 확인
  // 여기서는 기본적인 경로 유효성만 검사
  return modelPath.startsWith('/models/') && modelPath.endsWith('.glb');
};

/**
 * 가구 카테고리별 통계 정보 반환
 * 편집 모드 UI에서 사용
 */
export const getCategoryStats = () => {
  const stats: Record<string, { count: number; totalPrice: number }> = {};

  Object.entries(furnitureCatalog.categories).forEach(([category, catData]) => {
    const items = catData.items;
    const totalPrice = items.reduce((sum, item) => sum + (item.metadata.price || 0), 0);

    stats[category] = {
      count: items.length,
      totalPrice
    };
  });

  return stats;
};

/**
 * 가구 태그별 필터링
 * 편집 모드 검색에서 사용
 */
export const getFurnitureByTags = (tags: string[]): FurnitureItem[] => {
  return getAllFurnitureItems().filter(item =>
    tags.some(tag => item.metadata.tags.includes(tag))
  );
};

/**
 * 가구 가격 범위별 필터링
 * 편집 모드 검색에서 사용
 */
export const getFurnitureByPriceRange = (minPrice: number, maxPrice: number): FurnitureItem[] => {
  return getAllFurnitureItems().filter(item => {
    const price = item.metadata.price || 0;
    return price >= minPrice && price <= maxPrice;
  });
};