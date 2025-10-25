# 🚀 MVP 우선 하이브리드 저장소 구현 가이드

## 📋 프로젝트 개요 (수정)

**목표**: MVP 완성 후 백엔드 구축을 고려한 하이브리드 저장소 시스템 구현
**현재 환경**: Next.js 정적 사이트 (Static Export), 백엔드 서버 없음
**전략**: **MVP 우선** → Mock API → 향후 실제 백엔드 연동
**기간**: MVP 완성 후 백엔드 구축
**협업**: AI 에이전트 A, B 역할 분담

### 🎯 수정된 우선순위
1. **MVP 완성** (현재 우선)
2. **Mock API 기반 테스트** (백엔드 없이 전체 기능 검증)
3. **향후 백엔드 연동** (MVP 완성 후)

---

## 🎯 수정된 구현 전략

### **MVP 우선 접근 방법**

```mermaid
graph LR
    A[현재: IndexedDB<br/>로컬만] --> B[MVP: Mock API<br/>전체 기능 테스트]
    B --> C[향후: 실제 백엔드<br/>MVP 완성 후]
    
    style B fill:#e1f5fe
    style C fill:#f3e5f5
```

### **환경별 모드 전환 (MVP 우선)**

```typescript
// src/config/storage.ts
export const STORAGE_CONFIG = {
  // MVP 단계 (현재)
  mvp: {
    mode: 'mock-api',
    apiUrl: null,
    syncEnabled: true, // Mock API로 동기화 시뮬레이션
    service: 'mock'
  },
  
  // 향후 백엔드 연동 시
  production: {
    mode: 'hybrid',
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    syncEnabled: true,
    service: process.env.NEXT_PUBLIC_API_SERVICE // 'firebase' | 'supabase' | 'aws'
  }
};
```

---

## 🤖 AI 에이전트 역할 분담 (MVP 우선)

### **Agent A: Mock API/인프라 담당**
- **담당 영역**: Mock API 구현, 향후 백엔드 연동 준비
- **주요 작업**:
  - Mock API 서비스 구현
  - API 인터페이스 설계
  - 향후 백엔드 연동을 위한 구조 설계
  - 파일 최적화 및 관리

### **Agent B: 프론트엔드/클라이언트 담당**
- **담당 영역**: 클라이언트 로직, UI/UX, 동기화 관리
- **주요 작업**:
  - 타입 정의 및 인터페이스
  - HybridStorage 클래스 구현
  - UI 컴포넌트 수정
  - 동기화 상태 관리
  - Mock API와의 연동

---

## 📁 파일 구조 및 작업 분배 (MVP 우선)

```
src/
├── config/
│   └── storage.ts            # Agent A: MVP/Production 환경 설정
├── types/
│   ├── furniture.ts          # Agent B: 타입 확장
│   ├── api.ts               # Agent A: API 인터페이스 정의
│   └── storage.ts           # Agent B: 저장소 타입
├── services/
│   ├── storage/
│   │   ├── localStorage.ts   # Agent B: 로컬 저장소
│   │   ├── hybridStorage.ts  # Agent B: 하이브리드 저장소
│   │   └── syncManager.ts    # Agent B: 동기화 관리
│   ├── api/
│   │   ├── mockApi.ts        # Agent A: Mock API 구현
│   │   ├── furnitureApi.ts   # Agent A: 실제 API (향후)
│   │   └── apiFactory.ts     # Agent A: API 팩토리
│   └── auth/
│       └── authService.ts    # Agent A: 인증 서비스 (Mock)
├── utils/
│   ├── customLibrary.ts     # Agent B: 기존 코드 수정
│   └── fileOptimizer.ts     # Agent A: 파일 최적화
└── components/
    └── features/
        └── furniture/
            └── EnhancedFurnitureCatalog.tsx  # Agent B: UI 수정
```

---

## 🎯 Phase 1: MVP Mock API 구현 (현재 우선)

### **Agent A 작업 (Mock API)**

#### 1.1 Mock API 서비스 구현
**파일**: `src/services/api/mockApi.ts`
```typescript
import { UploadFurnitureRequest, UploadFurnitureResponse } from '@/types/api';
import { CustomFurnitureItem, SyncStatus } from '@/types/furniture';

export class MockFurnitureApiService {
  // ✅ 서버 없이 동작하는 Mock API
  async uploadFurniture(data: UploadFurnitureRequest): Promise<UploadFurnitureResponse> {
    console.log('[MOCK] UploadFurniture called:', data.name);
    
    // 실제 서버처럼 지연 시간 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      id: `mock-${Date.now()}`,
      serverId: `srv-${Date.now()}`,
      urls: {
        model: `/mock/models/${data.name}.glb`,
        thumbnail: `/mock/thumbnails/${data.name}.png`
      }
    };
  }
  
  async downloadFurniture(id: string): Promise<CustomFurnitureItem | null> {
    console.log('[MOCK] DownloadFurniture called:', id);
    
    // Mock 데이터 반환
    return {
      id,
      name: 'Mock Furniture',
      category: 'decorative',
      storage: {
        mode: 'hybrid',
        localId: id,
        serverId: `srv-${id}`,
        version: 1
      },
      sync: {
        status: 'synced',
        lastSynced: Date.now()
      },
      files: {
        model: {
          local: new Blob(),
          server: `/mock/models/${id}.glb`,
          size: 100,
          hash: 'mock-hash'
        },
        thumbnail: {
          local: new Blob(),
          server: `/mock/thumbnails/${id}.png`,
          size: 50,
          hash: 'mock-thumb-hash'
        }
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'mock-user',
        tags: ['mock', 'test'],
        isPublic: true
      }
    };
  }
  
  async syncStatus(id: string): Promise<SyncStatus> {
    console.log('[MOCK] SyncStatus check:', id);
    return 'synced';
  }
  
  async deleteFurniture(id: string): Promise<void> {
    console.log('[MOCK] DeleteFurniture called:', id);
    // Mock에서는 아무것도 하지 않음
  }
}
```

#### 1.2 API 팩토리 구현
**파일**: `src/services/api/apiFactory.ts`
```typescript
import { MockFurnitureApiService } from './mockApi';
// import { FirebaseApiService } from './firebase'; // 향후
// import { SupabaseApiService } from './supabase'; // 향후

export type ApiServiceType = 'mock' | 'firebase' | 'supabase' | 'aws';

export class ApiFactory {
  static createApiService(type: ApiServiceType = 'mock') {
    switch (type) {
      case 'mock':
        return new MockFurnitureApiService();
      // case 'firebase':
      //   return new FirebaseApiService();
      // case 'supabase':
      //   return new SupabaseApiService();
      default:
        return new MockFurnitureApiService();
    }
  }
}
```

#### 1.3 환경 설정 관리
**파일**: `src/config/storage.ts`
```typescript
export interface StorageConfig {
  mode: 'mock-api' | 'hybrid';
  apiUrl?: string;
  syncEnabled: boolean;
  service: ApiServiceType;
}

export const getStorageConfig = (): StorageConfig => {
  // MVP 단계에서는 항상 Mock API 사용
  if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_API_URL) {
    return {
      mode: 'mock-api',
      syncEnabled: true,
      service: 'mock'
    };
  }
  
  // 향후 실제 API 연동 시
  return {
    mode: 'hybrid',
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    syncEnabled: true,
    service: (process.env.NEXT_PUBLIC_API_SERVICE as ApiServiceType) || 'mock'
  };
};
```

### **Agent B 작업 (프론트엔드)**

#### 1.4 타입 정의 확장
**파일**: `src/types/furniture.ts`
```typescript
// 기존 FurnitureItem에 추가
export type StorageMode = 'local-only' | 'mock-api' | 'hybrid';
export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'error' | 'disabled';

export interface CustomFurnitureItem extends FurnitureItem {
  storage: {
    mode: StorageMode;
    localId: string;
    serverId?: string;
    version: number;
  };
  sync: {
    status: SyncStatus;
    lastSynced?: number;
    serverVersion?: number;
    conflictData?: any;
  };
  files: {
    model: {
      local: Blob;
      server?: string;
      size: number;
      hash: string;
    };
    thumbnail: {
      local: Blob;
      server?: string;
      size: number;
      hash: string;
    };
  };
  metadata: {
    createdAt: number;
    updatedAt: number;
    createdBy: string;
    tags: string[];
    isPublic: boolean;
  };
}
```

#### 1.5 HybridStorage 클래스 구현
**파일**: `src/services/storage/hybridStorage.ts`
```typescript
import { ApiFactory } from '../api/apiFactory';
import { getStorageConfig } from '../../config/storage';
import { CustomFurnitureItem, SyncStatus } from '../../types/furniture';

export class HybridStorage {
  private config = getStorageConfig();
  private apiService = ApiFactory.createApiService(this.config.service);
  
  // 가구 저장 (로컬 우선 + Mock API 동기화)
  async saveFurniture(item: CustomFurnitureItem): Promise<void> {
    // 1. 항상 로컬에 먼저 저장 (즉시 반응)
    await this.saveLocal(item);
    
    // 2. Mock API로 동기화 시뮬레이션
    if (this.config.syncEnabled) {
      this.syncToServer(item); // 백그라운드
    }
  }
  
  // 로컬 저장
  private async saveLocal(item: CustomFurnitureItem): Promise<void> {
    // IndexedDB에 저장 (기존 로직 활용)
    const db = await this.openIndexedDB();
    const transaction = db.transaction(['items'], 'readwrite');
    const store = transaction.objectStore('items');
    await store.put(item);
    
    console.log('[LOCAL] Saved item locally:', item.name);
  }
  
  // 서버 동기화 (Mock API)
  private async syncToServer(item: CustomFurnitureItem): Promise<void> {
    try {
      console.log('[SYNC] Trying to sync item:', item.name);
      
      const response = await this.apiService.uploadFurniture({
        name: item.name,
        category: item.category,
        metadata: item.metadata,
        files: {
          model: new File([item.files.model.local], `${item.name}.glb`),
          thumbnail: item.files.thumbnail.local ? 
            new File([item.files.thumbnail.local], `${item.name}.png`) : undefined
        }
      });
      
      // 서버 ID 업데이트
      item.storage.serverId = response.serverId;
      item.sync.status = 'synced';
      item.sync.lastSynced = Date.now();
      
      // 로컬 저장소 업데이트
      await this.saveLocal(item);
      
      console.log('[SYNC] Item synced to mock server:', response.serverId);
    } catch (error) {
      console.error('[SYNC] Failed to sync item:', error);
      item.sync.status = 'error';
    }
  }
  
  // 가구 목록 조회
  async getFurnitureList(): Promise<CustomFurnitureItem[]> {
    const db = await this.openIndexedDB();
    const transaction = db.transaction(['items'], 'readonly');
    const store = transaction.objectStore('items');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // IndexedDB 열기
  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('bumbum_custom_library', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
```

#### 1.6 기존 코드 수정
**파일**: `src/utils/customLibrary.ts`
```typescript
import { HybridStorage } from '../services/storage/hybridStorage';
import { CustomFurnitureItem } from '../types/furniture';

// 기존 saveCustomFurniture 함수를 HybridStorage 사용하도록 수정
export async function saveCustomFurniture(params: SaveParams): Promise<string> {
  const hybridStorage = new HybridStorage();
  
  // 기존 로직을 CustomFurnitureItem 형태로 변환
  const item: CustomFurnitureItem = {
    id: makeId(),
    name: params.name,
    nameKo: params.name,
    category: params.category || 'decorative',
    subcategory: params.isDoor ? 'door' : (params.isWall ? 'wall-custom' : 'custom'),
    modelPath: '', // Blob URL로 설정
    thumbnailPath: '', // Blob URL로 설정
    footprint: params.footprint || { width: 1, depth: 1, height: 1 },
    placement: {
      canRotate: true,
      canScale: true,
      floorOffset: 0,
      wallOnly: !!params.isWall,
      wallHeight: params.isWall ? (params.wallHeight ?? 1.4) : undefined
    },
    metadata: {
      brand: 'Custom',
      model: makeId(),
      price: 0,
      description: '로컬 커스텀 라이브러리 항목',
      tags: params.tags || ['custom']
    },
    renderSettings: {
      castShadow: true,
      receiveShadow: true,
      defaultScale: new Vector3(1, 1, 1),
      defaultRotation: new Euler(0, 0, 0)
    },
    editSettings: {
      snapToGrid: true,
      rotationSnap: 15,
      collisionGroup: 'furniture'
    },
    storage: {
      mode: 'mock-api',
      localId: makeId(),
      version: 1
    },
    sync: {
      status: 'pending'
    },
    files: {
      model: {
        local: params.modelBlob,
        size: params.modelBlob.size,
        hash: await this.calculateHash(params.modelBlob)
      },
      thumbnail: {
        local: params.thumbnailBlob || new Blob(),
        size: params.thumbnailBlob?.size || 0,
        hash: params.thumbnailBlob ? await this.calculateHash(params.thumbnailBlob) : ''
      }
    },
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'local-user',
      tags: params.tags || ['custom'],
      isPublic: false
    }
  };
  
  await hybridStorage.saveFurniture(item);
  return item.storage.localId;
}
```

---

## 🎯 Phase 2: UI 컴포넌트 수정 (MVP 완성)

### **Agent B 작업 (프론트엔드)**

#### 2.1 EnhancedFurnitureCatalog 수정
**파일**: `src/components/features/furniture/EnhancedFurnitureCatalog.tsx`
```typescript
import { useEffect, useState } from 'react';
import { CustomFurnitureItem } from '@/types/furniture';
import { HybridStorage } from '@/services/storage/hybridStorage';

export default function EnhancedFurnitureCatalog() {
  const [items, setItems] = useState<CustomFurnitureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const storage = new HybridStorage();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const furnitureItems = await storage.getFurnitureList();
      setItems(furnitureItems);
    } catch (error) {
      console.error('Failed to load furniture items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncItem = async (item: CustomFurnitureItem) => {
    try {
      await storage.syncToServer(item);
      await loadItems(); // 목록 새로고침
    } catch (error) {
      console.error('Failed to sync item:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-bold">Furniture Catalog (MVP Mode)</h2>
      <div className="text-sm text-gray-600 mb-4">
        Mock API로 동기화 시뮬레이션 중
      </div>
      
      {items.map((item) => (
        <div key={item.storage.localId} className="border p-4 mt-2 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">🪑 {item.name}</p>
              <p className="text-sm text-gray-600">
                Status: {item.sync.status} 
                {item.sync.lastSynced && (
                  <span className="ml-2">
                    (Last synced: {new Date(item.sync.lastSynced).toLocaleTimeString()})
                  </span>
                )}
              </p>
            </div>
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => handleSyncItem(item)}
              disabled={item.sync.status === 'synced'}
            >
              {item.sync.status === 'synced' ? 'Synced' : 'Sync to Mock'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔄 향후 백엔드 연동 전환 포인트

### **MVP 완성 후 백엔드 연동 시**

```typescript
// 1. 환경변수 설정
NEXT_PUBLIC_API_URL=https://your-api.com
NEXT_PUBLIC_API_SERVICE=firebase

// 2. API 서비스 교체 (import만 변경)
// Before (Mock)
import { MockFurnitureApiService } from './mockApi';

// After (Real)
import { FirebaseApiService } from './firebase';

// 3. ApiFactory에서 자동 선택
const apiService = ApiFactory.createApiService('firebase'); // 환경변수에서 자동 선택
```

### **전환 시 수정 필요한 파일**
- `src/services/api/firebase.ts` (새로 생성)
- `src/services/api/apiFactory.ts` (import 추가)
- `src/config/storage.ts` (환경변수 확인)

**다른 파일은 수정 불필요!** 🎉

---

## 📋 체크리스트 (MVP 우선)

### **Phase 1 완료 기준 (MVP)**
- [ ] Agent A: Mock API 서비스 구현
- [ ] Agent A: API 팩토리 구현
- [ ] Agent A: 환경 설정 관리
- [ ] Agent B: 타입 정의 확장
- [ ] Agent B: HybridStorage 클래스 구현
- [ ] Agent B: 기존 코드 수정
- [ ] 통합 테스트 통과 (Mock API 모드)

### **Phase 2 완료 기준 (UI 완성)**
- [ ] Agent B: EnhancedFurnitureCatalog 수정
- [ ] Agent B: 동기화 상태 표시
- [ ] Agent B: Mock API 연동 테스트
- [ ] E2E 테스트 통과 (전체 MVP 기능)

### **향후 백엔드 연동 준비**
- [ ] Agent A: Firebase/Supabase API 서비스 구현
- [ ] Agent A: 실제 인증 시스템 구현
- [ ] 환경변수 설정으로 전환 테스트

---

## 🚨 주의사항 (MVP 우선)

### **MVP 단계 주의사항**
- **Mock API**: 실제 서버 없이 전체 기능 시뮬레이션
- **로컬 우선**: IndexedDB에 먼저 저장, Mock API로 동기화
- **사용자 경험**: 실제 서버처럼 느껴지도록 구현
- **향후 전환**: 구조는 그대로 두고 API만 교체

### **백엔드 연동 시 주의사항**
- **점진적 전환**: 환경변수로 모드 전환
- **데이터 마이그레이션**: 기존 IndexedDB 데이터 유지
- **롤백 계획**: 문제 발생 시 Mock 모드로 복구

---

## 💡 MVP 우선 접근의 장점

### **1. 빠른 개발**
- 백엔드 구축 없이 전체 기능 테스트
- UI/UX 완성도 높이기
- 사용자 피드백 빠른 수집

### **2. 위험 최소화**
- 백엔드 구축 전에 전체 아키텍처 검증
- 데이터 구조 및 API 설계 검증
- 사용자 경험 최적화

### **3. 유연한 전환**
- Mock API → 실제 API 전환이 간단
- 구조는 그대로, 구현만 교체
- 단계별 백엔드 연동 가능

이제 MVP 우선으로 작업을 진행할 수 있습니다! 🚀
