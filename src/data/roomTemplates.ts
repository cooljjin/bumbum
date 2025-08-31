import { Vector3, Euler } from 'three';
import { PlacedItem } from '../types/editor';
import { createPlacedItemFromFurniture, getFurnitureById } from './furnitureCatalog';

// 템플릿 메타데이터 인터페이스
export interface RoomTemplateMetadata {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  category: 'living' | 'bedroom' | 'kitchen' | 'office' | 'dining';
  thumbnailPath?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // 분 단위
  tags: string[];
}

// 룸 환경 설정 인터페이스
export interface RoomEnvironment {
  cameraPosition: Vector3;
  cameraTarget: Vector3;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  directionalLightPosition: Vector3;
  backgroundColor?: string;
  gridSize: number;
}

// 템플릿 가구 배치 정보
export interface TemplateFurnitureItem {
  furnitureId: string; // furnitureCatalog.ts의 ID
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
  isLocked?: boolean;
}

// 룸 템플릿 인터페이스
export interface RoomTemplate {
  metadata: RoomTemplateMetadata;
  environment: RoomEnvironment;
  furniture: TemplateFurnitureItem[];
  createdAt: string;
  updatedAt: string;
}

// 템플릿 컬렉션
export const roomTemplates: RoomTemplate[] = [
  {
    metadata: {
      id: 'modern-living-room',
      name: 'Modern Living Room',
      nameKo: '모던 거실',
      description: 'A clean and modern living room setup with essential furniture',
      descriptionKo: '필수 가구로 구성된 깔끔하고 모던한 거실',
      category: 'living',
      thumbnailPath: '/thumbnails/templates/modern-living.jpg',
      difficulty: 'beginner',
      estimatedTime: 5,
      tags: ['modern', 'minimal', 'sofa', 'coffee-table']
    },
    environment: {
      cameraPosition: new Vector3(8, 5, 8),
      cameraTarget: new Vector3(0, 0, 0),
      ambientLightIntensity: 0.4,
      directionalLightIntensity: 1.0,
      directionalLightPosition: new Vector3(10, 10, 5),
      gridSize: 10
    },
    furniture: [
      {
        furnitureId: 'sofa-modern-001',
        position: new Vector3(0, 0, -2),
        rotation: new Euler(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      },
      {
        furnitureId: 'coffee-table-glass-001',
        position: new Vector3(0, 0, 0),
        rotation: new Euler(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      },
      {
        furnitureId: 'tv-stand-modern-001',
        position: new Vector3(0, 0, 3),
        rotation: new Euler(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    metadata: {
      id: 'cozy-bedroom',
      name: 'Cozy Bedroom',
      nameKo: '아늑한 침실',
      description: 'A warm and inviting bedroom perfect for relaxation',
      descriptionKo: '휴식을 위한 따뜻하고 편안한 침실',
      category: 'bedroom',
      thumbnailPath: '/thumbnails/templates/cozy-bedroom.jpg',
      difficulty: 'beginner',
      estimatedTime: 8,
      tags: ['bedroom', 'cozy', 'bed', 'nightstand']
    },
    environment: {
      cameraPosition: new Vector3(6, 4, 6),
      cameraTarget: new Vector3(0, 1, 0),
      ambientLightIntensity: 0.3,
      directionalLightIntensity: 0.8,
      directionalLightPosition: new Vector3(5, 8, 5),
      backgroundColor: '#f8f9fa',
      gridSize: 8
    },
    furniture: [
      {
        furnitureId: 'bed-queen-001',
        position: new Vector3(0, 0, 0),
        rotation: new Euler(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      },
      {
        furnitureId: 'nightstand-wood-001',
        position: new Vector3(1.5, 0, 1),
        rotation: new Euler(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      },
      {
        furnitureId: 'nightstand-wood-001',
        position: new Vector3(-1.5, 0, 1),
        rotation: new Euler(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      },
      {
        furnitureId: 'wardrobe-large-001',
        position: new Vector3(-3, 0, -2),
        rotation: new Euler(0, Math.PI / 2, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      }
    ],
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z'
  },
  {
    metadata: {
      id: 'modern-kitchen',
      name: 'Modern Kitchen',
      nameKo: '모던 주방',
      description: 'A sleek and functional modern kitchen setup',
      descriptionKo: '세련되고 실용적인 모던 주방',
      category: 'kitchen',
      thumbnailPath: '/thumbnails/templates/modern-kitchen.jpg',
      difficulty: 'intermediate',
      estimatedTime: 12,
      tags: ['kitchen', 'modern', 'cooking', 'dining']
    },
    environment: {
      cameraPosition: new Vector3(10, 6, 8),
      cameraTarget: new Vector3(0, 1, 0),
      ambientLightIntensity: 0.5,
      directionalLightIntensity: 1.2,
      directionalLightPosition: new Vector3(8, 12, 6),
      gridSize: 12
    },
    furniture: [
      {
        furnitureId: 'kitchen-cabinet-base-001',
        position: new Vector3(-2, 0, 0),
        rotation: new Euler(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      },
      {
        furnitureId: 'kitchen-cabinet-wall-001',
        position: new Vector3(-2, 2, 0),
        rotation: new Euler(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      },
      {
        furnitureId: 'refrigerator-modern-001',
        position: new Vector3(-4, 0, 0),
        rotation: new Euler(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      },
      {
        furnitureId: 'dining-table-round-001',
        position: new Vector3(3, 0, 2),
        rotation: new Euler(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      },
      {
        furnitureId: 'dining-chair-001',
        position: new Vector3(3, 0, 3.5),
        rotation: new Euler(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      },
      {
        furnitureId: 'dining-chair-001',
        position: new Vector3(3, 0, 0.5),
        rotation: new Euler(0, Math.PI, 0),
        scale: new Vector3(1, 1, 1),
        isLocked: false
      }
    ],
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  }
];

// 유틸리티 함수들
export const getAllTemplates = (): RoomTemplate[] => {
  return roomTemplates;
};

export const getTemplateById = (id: string): RoomTemplate | undefined => {
  return roomTemplates.find(template => template.metadata.id === id);
};

export const getTemplatesByCategory = (category: RoomTemplate['metadata']['category']): RoomTemplate[] => {
  return roomTemplates.filter(template => template.metadata.category === category);
};

export const searchTemplates = (query: string): RoomTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return roomTemplates.filter(template =>
    template.metadata.name.toLowerCase().includes(lowerQuery) ||
    template.metadata.nameKo.includes(query) ||
    template.metadata.description.toLowerCase().includes(lowerQuery) ||
    template.metadata.descriptionKo.includes(query) ||
    template.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getTemplateCategories = (): { key: string; name: string; nameKo: string }[] => {
  return [
    { key: 'living', name: 'Living Room', nameKo: '거실' },
    { key: 'bedroom', name: 'Bedroom', nameKo: '침실' },
    { key: 'kitchen', name: 'Kitchen', nameKo: '주방' },
    { key: 'office', name: 'Office', nameKo: '사무실' },
    { key: 'dining', name: 'Dining', nameKo: '식당' }
  ];
};

// 템플릿 적용 유틸리티 함수들
export const applyRoomTemplate = async (template: RoomTemplate): Promise<{
  placedItems: PlacedItem[];
  environment: RoomEnvironment;
}> => {
  const placedItems: PlacedItem[] = [];

  // 템플릿의 각 가구를 PlacedItem으로 변환
  for (const templateItem of template.furniture) {
    try {
      const furniture = getFurnitureById(templateItem.furnitureId);
      if (furniture) {
        const placedItem = createPlacedItemFromFurniture(
          furniture,
          templateItem.position,
          templateItem.rotation,
          templateItem.scale
        );

        // 템플릿에서 지정한 고정 상태 적용
        placedItem.isLocked = templateItem.isLocked || false;

        // 템플릿에서 지정한 스냅 설정 저장
        if (templateItem.isLocked) {
          placedItem.snapSettings = {
            gridEnabled: template.environment.gridSize > 0,
            rotationSnapEnabled: true,
            rotationSnapAngle: 15,
            gridSize: template.environment.gridSize,
            gridDivisions: template.environment.gridSize
          };
        }

        placedItems.push(placedItem);
      } else {
        console.warn(`가구를 찾을 수 없음: ${templateItem.furnitureId}`);
      }
    } catch (error) {
      console.error(`템플릿 가구 적용 실패 (${templateItem.furnitureId}):`, error);
    }
  }

  return {
    placedItems,
    environment: template.environment
  };
};

// 템플릿 적용 후 카메라 및 환경 설정 적용 함수
export const applyTemplateEnvironment = (
  template: RoomTemplate,
  setCameraPosition?: (position: Vector3) => void,
  setCameraTarget?: (target: Vector3) => void
) => {
  // 카메라 위치 설정
  if (setCameraPosition) {
    setCameraPosition(template.environment.cameraPosition);
  }

  if (setCameraTarget) {
    setCameraTarget(template.environment.cameraTarget);
  }

  // 환경 설정 적용 (필요시 다른 컴포넌트에서 처리)
  return template.environment;
};

// 템플릿 적용 결과 인터페이스
export interface TemplateApplicationResult {
  success: boolean;
  placedItems: PlacedItem[];
  environment: RoomEnvironment;
  error?: string;
  appliedCount: number;
  totalCount: number;
}
