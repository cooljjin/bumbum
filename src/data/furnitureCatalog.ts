import { Vector3, Euler } from 'three';
import { FurnitureCatalog, FurnitureItem } from '../types/furniture';
import { PlacedItem } from '../types/editor';

// 기본 Vector3와 Euler 객체 생성 헬퍼 함수
const v3 = (x: number, y: number, z: number): Vector3 => new Vector3(x, y, z);
const e = (x: number, y: number, z: number): Euler => new Euler(x, y, z);

// 샘플 가구 데이터 - Blueprint3D 스타일로 확장
export const sampleFurniture: FurnitureItem[] = [
  // === 거실 가구 ===
  {
    id: 'sofa-001',
    name: 'Modern Sofa',
    nameKo: '모던 소파',
    category: 'living',
    subcategory: 'sofa',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/sofa-001.svg',
    footprint: {
      width: 2.2,
      depth: 0.9,
      height: 0.8
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'ModernHome',
      model: 'MS-001',
      price: 1200000,
      description: '편안하고 세련된 모던 디자인의 3인용 소파',
      tags: ['소파', '거실', '모던', '편안함'],
      materials: ['천', '폴리에스터'],
      colors: ['회색', '베이지', '네이비']
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

  // 추가 소파들
  {
    id: 'sofa-luxury-001',
    name: 'Luxury Sofa',
    nameKo: '럭셔리 소파',
    category: 'living',
    subcategory: 'sofa',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/sofa-luxury-001.svg',
    footprint: {
      width: 2.5,
      depth: 1.0,
      height: 0.85
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'LuxuryLiving',
      model: 'LS-001',
      price: 2500000,
      description: '고급스러운 디자인과 최고급 소재로 만든 프리미엄 소파',
      tags: ['소파', '거실', '럭셔리', '고급', '편안함'],
      materials: ['가죽', '금속'],
      colors: ['블랙', '브라운', '화이트']
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

  {
    id: 'sofa-sectional-001',
    name: 'Sectional Sofa',
    nameKo: '섹셔널 소파',
    category: 'living',
    subcategory: 'sofa',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/sofa-sectional-001.svg',
    footprint: {
      width: 3.0,
      depth: 2.5,
      height: 0.8
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'ComfortZone',
      model: 'SS-001',
      price: 3500000,
      description: 'L자형으로 배치 가능한 모듈러 섹셔널 소파',
      tags: ['소파', '거실', '섹셔널', '모듈러', 'L자형'],
      materials: ['천', '나무'],
      colors: ['베이지', '그레이', '블루']
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

  // === 커피 테이블 및 사이드 테이블 ===
  {
    id: 'coffee-table-001',
    name: 'Glass Coffee Table',
    nameKo: '글라스 커피 테이블',
    category: 'living',
    subcategory: 'table',
    modelPath: '/models/furniture/testtable.glb', // 테스트 테이블 모델 사용
    thumbnailPath: '/thumbnails/furniture/coffee-table-001.svg',
    footprint: {
      width: 1.2,
      depth: 0.6,
      height: 0.45
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'GlassArt',
      model: 'GT-001',
      price: 450000,
      description: '투명한 글라스와 스테인리스 스틸로 제작된 세련된 커피 테이블',
      tags: ['테이블', '커피테이블', '글라스', '세련됨'],
      materials: ['글라스', '스테인리스스틸'],
      colors: ['투명', '실버']
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

  // 추가 테이블들
  {
    id: 'coffee-table-wood-001',
    name: 'Wooden Coffee Table',
    nameKo: '원목 커피 테이블',
    category: 'living',
    subcategory: 'table',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/coffee-table-wood-001.svg',
    footprint: {
      width: 1.2,
      depth: 0.6,
      height: 0.45
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'NatureWood',
      model: 'NW-CT-001',
      price: 350000,
      description: '천연 원목으로 만든 따뜻한 느낌의 커피 테이블',
      tags: ['테이블', '커피테이블', '원목', '자연', '따뜻함'],
      materials: ['원목', '천연오일'],
      colors: ['월넛', '오크', '메이플']
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

  {
    id: 'side-table-001',
    name: 'Side Table',
    nameKo: '사이드 테이블',
    category: 'living',
    subcategory: 'table',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/side-table-001.svg',
    footprint: {
      width: 0.5,
      depth: 0.5,
      height: 0.6
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'HomeStyle',
      model: 'HS-ST-001',
      price: 150000,
      description: '소파 옆에 놓기 좋은 컴팩트한 사이드 테이블',
      tags: ['테이블', '사이드테이블', '소형', '컴팩트'],
      materials: ['나무', '메탈'],
      colors: ['블랙', '화이트', '우드']
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

  // === TV 및 엔터테인먼트 ===
  {
    id: 'tv-stand-001',
    name: 'TV Stand',
    nameKo: 'TV 스탠드',
    category: 'living',
    subcategory: 'entertainment',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/tv-stand-001.svg',
    footprint: {
      width: 1.8,
      depth: 0.4,
      height: 0.6
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'EntertainmentPro',
      model: 'EP-TVS-001',
      price: 280000,
      description: 'TV와 주변기기를 깔끔하게 정리할 수 있는 TV 스탠드',
      tags: ['TV', '스탠드', '엔터테인먼트', '정리', '미디어'],
      materials: ['나무', '메탈'],
      colors: ['블랙', '화이트', '우드']
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

  {
    id: 'wall-tv-mount',
    name: 'Wall TV Mount',
    nameKo: '벽걸이 TV 마운트',
    category: 'living',
    subcategory: 'entertainment',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/wall-tv-mount.svg',
    footprint: {
      width: 1.2,
      depth: 0.1,
      height: 0.8
    },
    placement: {
      canRotate: false,
      canScale: false,
      floorOffset: 0.8
    },
    metadata: {
      brand: 'WallMountPro',
      model: 'WM-TV-001',
      price: 120000,
      description: '벽에 TV를 고정할 수 있는 튼튼한 마운트',
      tags: ['TV', '마운트', '벽걸이', '공간절약', '모던'],
      materials: ['메탈', '플라스틱'],
      colors: ['블랙', '실버']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: false,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: false,
      rotationSnap: 90,
      collisionGroup: 'wall_mount'
    }
  },

  // === 조명 ===
  {
    id: 'floor-lamp-001',
    name: 'Floor Lamp',
    nameKo: '플로어 램프',
    category: 'living',
    subcategory: 'lighting',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/floor-lamp-001.svg',
    footprint: {
      width: 0.4,
      depth: 0.4,
      height: 1.8
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'LightStyle',
      model: 'LS-FL-001',
      price: 180000,
      description: '거실이나 서재에 어울리는 세련된 플로어 램프',
      tags: ['조명', '플로어램프', '거실', '서재', '세련됨'],
      materials: ['메탈', '유리'],
      colors: ['블랙', '크롬', '골드']
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

  {
    id: 'table-lamp-001',
    name: 'Table Lamp',
    nameKo: '테이블 램프',
    category: 'living',
    subcategory: 'lighting',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/table-lamp-001.svg',
    footprint: {
      width: 0.3,
      depth: 0.3,
      height: 0.6
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'LightStyle',
      model: 'LS-TL-001',
      price: 95000,
      description: '책상이나 사이드 테이블에 놓기 좋은 실용적인 테이블 램프',
      tags: ['조명', '테이블램프', '책상', '실용적', '읽기등'],
      materials: ['세라믹', '메탈'],
      colors: ['화이트', '블랙', '블루']
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

  // === 침실 가구 ===
  {
    id: 'bed-001',
    name: 'Queen Size Bed',
    nameKo: '퀸 사이즈 침대',
    category: 'bedroom',
    subcategory: 'bed',
    modelPath: null, // 더미 파일 제거됨
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
      brand: 'SleepWell',
      model: 'QB-001',
      price: 800000,
      description: '편안한 수면을 위한 퀸 사이즈 침대',
      tags: ['침대', '침실', '퀸사이즈', '편안함'],
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

  // 추가 침대 옵션들
  {
    id: 'bed-single-001',
    name: 'Single Bed',
    nameKo: '싱글 침대',
    category: 'bedroom',
    subcategory: 'bed',
    modelPath: null,
    thumbnailPath: '/thumbnails/furniture/bed-single-001.svg',
    footprint: {
      width: 1.0,
      depth: 2.0,
      height: 0.6
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SleepWell',
      model: 'SB-001',
      price: 450000,
      description: '1인용으로 적합한 싱글 침대',
      tags: ['침대', '침실', '싱글', '1인용', '컴팩트'],
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

  {
    id: 'bed-king-001',
    name: 'King Size Bed',
    nameKo: '킹 사이즈 침대',
    category: 'bedroom',
    subcategory: 'bed',
    modelPath: null,
    thumbnailPath: '/thumbnails/furniture/bed-king-001.svg',
    footprint: {
      width: 1.8,
      depth: 2.0,
      height: 0.6
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SleepWell',
      model: 'KB-001',
      price: 1200000,
      description: '넓은 공간을 제공하는 킹 사이즈 침대',
      tags: ['침대', '침실', '킹사이즈', '넓은', '편안함'],
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

  // 추가 침실 가구들
  {
    id: 'bedside-table-001',
    name: 'Bedside Table',
    nameKo: '침대 옆 테이블',
    category: 'bedroom',
    subcategory: 'table',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/bedside-table-001.svg',
    footprint: {
      width: 0.5,
      depth: 0.4,
      height: 0.65
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SleepWell',
      model: 'SW-BT-001',
      price: 120000,
      description: '침대 옆에 놓기 좋은 서랍이 있는 사이드 테이블',
      tags: ['테이블', '침대옆', '서랍', '침실', '수납'],
      materials: ['나무', '메탈'],
      colors: ['화이트', '블랙', '우드']
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

  {
    id: 'dresser-001',
    name: 'Dresser',
    nameKo: '드레서',
    category: 'bedroom',
    subcategory: 'storage',
    modelPath: null, // 더미 파일 제거됨
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
      brand: 'StoragePro',
      model: 'SP-DR-001',
      price: 450000,
      description: '의류와 소품을 정리할 수 있는 6단 서랍장',
      tags: ['드레서', '서랍장', '수납', '침실', '정리'],
      materials: ['나무', '메탈'],
      colors: ['화이트', '블랙', '우드']
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

  {
    id: 'wardrobe-001',
    name: 'Wardrobe',
    nameKo: '옷장',
    category: 'bedroom',
    subcategory: 'storage',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/wardrobe-001.svg',
    footprint: {
      width: 1.2,
      depth: 0.6,
      height: 2.0
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SpaceSaver',
      model: 'SS-WR-001',
      price: 650000,
      description: '많은 옷을 수납할 수 있는 대형 옷장',
      tags: ['옷장', '수납', '침실', '대형', '정리'],
      materials: ['나무', '거울'],
      colors: ['화이트', '블랙', '우드']
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

  // === 주방 가구 ===
  {
    id: 'dining-table-001',
    name: 'Round Dining Table',
    nameKo: '원형 식탁',
    category: 'kitchen',
    subcategory: 'table',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/dining-table-001.svg',
    footprint: {
      width: 1.4,
      depth: 1.4,
      height: 0.75
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'KitchenPro',
      model: 'DT-001',
      price: 650000,
      description: '4-6인용 원형 식탁',
      tags: ['식탁', '주방', '원형', '4-6인용'],
      materials: ['나무', '스테인리스스틸'],
      colors: ['우드', '화이트']
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

  // 사무실 가구
  {
    id: 'desk-001',
    name: 'Office Desk',
    nameKo: '사무용 책상',
    category: 'office',
    subcategory: 'desk',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/desk-001.svg',
    footprint: {
      width: 1.4,
      depth: 0.7,
      height: 0.75
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'OfficeMax',
      model: 'OD-001',
      price: 350000,
      description: '업무 효율성을 높이는 사무용 책상',
      tags: ['책상', '사무실', '업무', '효율성'],
      materials: ['나무', '메탈'],
      colors: ['우드', '블랙', '화이트']
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

  // 추가 사무실 가구들
  {
    id: 'office-chair-001',
    name: 'Office Chair',
    nameKo: '사무용 의자',
    category: 'office',
    subcategory: 'chair',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/office-chair-001.svg',
    footprint: {
      width: 0.6,
      depth: 0.6,
      height: 1.2
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'OfficePro',
      model: 'OP-OC-001',
      price: 350000,
      description: '장시간 앉아 작업하기 좋은 인체공학적 디자인의 사무용 의자',
      tags: ['의자', '사무실', '인체공학', '편안함', '작업'],
      materials: ['메쉬', '메탈', '플라스틱'],
      colors: ['블랙', '화이트', '그레이']
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

  {
    id: 'computer-desk-001',
    name: 'Computer Desk',
    nameKo: '컴퓨터 책상',
    category: 'office',
    subcategory: 'desk',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/computer-desk-001.svg',
    footprint: {
      width: 1.6,
      depth: 0.8,
      height: 0.75
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'TechDesk',
      model: 'TD-CD-001',
      price: 280000,
      description: '컴퓨터 작업에 최적화된 책상으로 많은 공간을 제공',
      tags: ['책상', '컴퓨터', '사무실', '작업', '넓은'],
      materials: ['나무', '메탈'],
      colors: ['블랙', '화이트', '우드']
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

  // === 수납 가구 ===
  {
    id: 'bookshelf-001',
    name: 'Tall Bookshelf',
    nameKo: '높은 책장',
    category: 'storage',
    subcategory: 'bookshelf',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/bookshelf-001.jpg',
    footprint: {
      width: 0.8,
      depth: 0.4,
      height: 2.0
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'StoragePro',
      model: 'BS-001',
      price: 280000,
      description: '책과 소품을 체계적으로 정리할 수 있는 높은 책장',
      tags: ['책장', '수납', '정리', '높은'],
      materials: ['나무', 'MDF'],
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

  // 간단한 소파들
  {
    id: 'sofa-simple-2seater',
    name: 'Simple 2-Seater Sofa',
    nameKo: '간단한 2인용 소파',
    category: 'living',
    subcategory: 'sofa',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/sofa-simple-2seater.svg',
    footprint: {
      width: 1.6,
      depth: 0.8,
      height: 0.8
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SimpleHome',
      model: 'SS-2S',
      price: 350000,
      description: '깔끔하고 실용적인 2인용 소파',
      tags: ['소파', '거실', '간단한', '2인용'],
      materials: ['천', '나무'],
      colors: ['베이지', '네이비', '그레이']
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

  {
    id: 'sofa-simple-3seater',
    name: 'Simple 3-Seater Sofa',
    nameKo: '간단한 3인용 소파',
    category: 'living',
    subcategory: 'sofa',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/sofa-simple-3seater.svg',
    footprint: {
      width: 2.2,
      depth: 0.9,
      height: 0.8
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SimpleHome',
      model: 'SS-3S',
      price: 450000,
      description: '가족이 함께 사용할 수 있는 간단한 3인용 소파',
      tags: ['소파', '거실', '간단한', '3인용', '가족용'],
      materials: ['천', '나무'],
      colors: ['베이지', '네이비', '그레이']
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

  {
    id: 'sofa-simple-corner',
    name: 'Simple Corner Sofa',
    nameKo: '간단한 코너 소파',
    category: 'living',
    subcategory: 'sofa',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/sofa-simple-corner.svg',
    footprint: {
      width: 2.5,
      depth: 1.8,
      height: 0.8
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SimpleHome',
      model: 'SS-CR',
      price: 550000,
      description: '공간을 효율적으로 활용할 수 있는 L자형 코너 소파',
      tags: ['소파', '거실', '코너', 'L자형', '효율적'],
      materials: ['천', '나무'],
      colors: ['베이지', '네이비', '그레이']
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

  // 간단한 책장들
  {
    id: 'bookshelf-simple-small',
    name: 'Simple Small Bookshelf',
    nameKo: '간단한 작은 책장',
    category: 'storage',
    subcategory: 'bookshelf',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/bookshelf-simple-small.svg',
    footprint: {
      width: 0.6,
      depth: 0.3,
      height: 1.5
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SimpleStorage',
      model: 'BS-SM',
      price: 120000,
      description: '작은 공간에 적합한 간단한 3단 책장',
      tags: ['책장', '수납', '작은', '3단', '간단한'],
      materials: ['나무', 'MDF'],
      colors: ['화이트', '블랙', '우드']
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

  {
    id: 'bookshelf-simple-medium',
    name: 'Simple Medium Bookshelf',
    nameKo: '간단한 중간 책장',
    category: 'storage',
    subcategory: 'bookshelf',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/bookshelf-simple-medium.svg',
    footprint: {
      width: 0.8,
      depth: 0.3,
      height: 1.8
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SimpleStorage',
      model: 'BS-MD',
      price: 180000,
      description: '일반적인 용도로 사용하기 좋은 4단 책장',
      tags: ['책장', '수납', '중간', '4단', '일반용'],
      materials: ['나무', 'MDF'],
      colors: ['화이트', '블랙', '우드']
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

  {
    id: 'bookshelf-simple-wide',
    name: 'Simple Wide Bookshelf',
    nameKo: '간단한 넓은 책장',
    category: 'storage',
    subcategory: 'bookshelf',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/bookshelf-simple-wide.svg',
    footprint: {
      width: 1.2,
      depth: 0.3,
      height: 1.8
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SimpleStorage',
      model: 'BS-WD',
      price: 220000,
      description: '많은 책을 수납할 수 있는 넓은 책장',
      tags: ['책장', '수납', '넓은', '대용량', '책수납'],
      materials: ['나무', 'MDF'],
      colors: ['화이트', '블랙', '우드']
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

  // === 간단한 초보자용 가구들 ===
  {
    id: 'simple-chair-001',
    name: 'Simple Chair',
    nameKo: '간단한 의자',
    category: 'living',
    subcategory: 'chair',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/simple-chair-001.svg',
    footprint: {
      width: 0.5,
      depth: 0.5,
      height: 0.9
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SimpleFurniture',
      model: 'SF-SC-001',
      price: 80000,
      description: '사용하기 쉽고 공간을 많이 차지하지 않는 간단한 의자',
      tags: ['의자', '간단한', '초보자', '컴팩트', '실용적'],
      materials: ['나무', '플라스틱'],
      colors: ['화이트', '블랙', '우드']
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

  {
    id: 'simple-table-001',
    name: 'Simple Table',
    nameKo: '간단한 테이블',
    category: 'living',
    subcategory: 'table',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/simple-table-001.svg',
    footprint: {
      width: 1.0,
      depth: 0.6,
      height: 0.75
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SimpleFurniture',
      model: 'SF-ST-001',
      price: 120000,
      description: '다양한 용도로 사용할 수 있는 심플한 디자인의 테이블',
      tags: ['테이블', '간단한', '다용도', '심플', '실용적'],
      materials: ['나무', '메탈'],
      colors: ['화이트', '블랙', '우드']
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

  // Weird Table 추가
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
      depth: 1.2,
      height: 0.8
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

  // Test Table 추가
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

  // Test Bed 추가
  {
    id: 'testbed',
    name: 'Test Bed',
    nameKo: '테스트 침대',
    category: 'bedroom',
    subcategory: 'bed',
    modelPath: '/models/furniture/_testbed.glb',
    thumbnailPath: '/thumbnails/furniture/_testbed.svg',
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

  // === 시계 및 시간 관련 장식품 ===
  {
    id: 'clock',
    name: 'Wall Clock',
    nameKo: '벽시계',
    category: 'decorative',
    subcategory: 'clock',
    modelPath: '/models/furniture/clock.glb',
    thumbnailPath: '/thumbnails/furniture/clock.png',
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

  {
    id: 'clock-modern-001',
    name: 'Modern Digital Clock',
    nameKo: '모던 디지털 시계',
    category: 'decorative',
    subcategory: 'clock',
    modelPath: null,
    thumbnailPath: '/thumbnails/furniture/clock-modern-001.svg',
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

  {
    id: 'clock-vintage-001',
    name: 'Vintage Wall Clock',
    nameKo: '빈티지 벽시계',
    category: 'decorative',
    subcategory: 'clock',
    modelPath: null,
    thumbnailPath: '/thumbnails/furniture/clock-vintage-001.svg',
    footprint: {
      width: 0.5,
      depth: 0.1,
      height: 0.5
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'VintageTime',
      model: 'VT-WC-001',
      price: 85000,
      description: '클래식한 빈티지 스타일의 벽시계',
      tags: ['시계', '빈티지', '클래식', '벽걸이', '레트로'],
      materials: ['나무', '금속'],
      colors: ['골드', '브라운', '블랙']
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

  {
    id: 'simple-shelf-001',
    name: 'Simple Shelf',
    nameKo: '간단한 선반',
    category: 'storage',
    subcategory: 'shelf',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/simple-shelf-001.svg',
    footprint: {
      width: 0.8,
      depth: 0.3,
      height: 1.2
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'SimpleStorage',
      model: 'SS-SH-001',
      price: 60000,
      description: '벽에 걸거나 바닥에 놓고 사용할 수 있는 간단한 선반',
      tags: ['선반', '간단한', '벽걸이', '수납', '컴팩트'],
      materials: ['나무', '메탈'],
      colors: ['화이트', '블랙', '우드']
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
      collisionGroup: 'storage'
    }
  },

  // === 장식품 및 액세서리 ===
  {
    id: 'plant-stand-001',
    name: 'Plant Stand',
    nameKo: '식물 받침대',
    category: 'decorative',
    subcategory: 'plant',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/plant-stand-001.svg',
    footprint: {
      width: 0.4,
      depth: 0.4,
      height: 1.0
    },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0
    },
    metadata: {
      brand: 'GreenHome',
      model: 'GH-PS-001',
      price: 45000,
      description: '화분을 올려놓기 좋은 세련된 디자인의 받침대',
      tags: ['식물', '받침대', '장식', '화분', '세련됨'],
      materials: ['메탈', '나무'],
      colors: ['블랙', '화이트', '골드']
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
      collisionGroup: 'decorative'
    }
  },

  {
    id: 'wall-art-001',
    name: 'Wall Art Frame',
    nameKo: '벽걸이 액자',
    category: 'decorative',
    subcategory: 'art',
    modelPath: null, // 더미 파일 제거됨
    thumbnailPath: '/thumbnails/furniture/wall-art-001.svg',
    footprint: {
      width: 0.8,
      depth: 0.05,
      height: 1.0
    },
    placement: {
      canRotate: false,
      canScale: false,
      floorOffset: 1.0
    },
    metadata: {
      brand: 'ArtWall',
      model: 'AW-AF-001',
      price: 35000,
      description: '벽에 걸어 공간을 아름답게 꾸밀 수 있는 액자',
      tags: ['액자', '벽걸이', '장식', '아름다움', '공간'],
      materials: ['나무', '유리'],
      colors: ['블랙', '화이트', '우드']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: false,
      defaultScale: v3(1, 1, 1),
      defaultRotation: e(0, 0, 0)
    },
    editSettings: {
      snapToGrid: false,
      rotationSnap: 90,
      collisionGroup: 'wall_decor'
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
      items: sampleFurniture.filter(item => item.category === 'kitchen')
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
      items: sampleFurniture.filter(item => item.category === 'office')
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
    storage: {
      name: 'Storage',
      nameKo: '수납',
      description: '공간을 효율적으로 활용할 수 있는 수납 가구들',
      items: sampleFurniture.filter(item => item.category === 'storage')
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
    modelPath: furniture.modelPath,
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
