# 🧠 Cursor Prompt: Mock API 기반 MVP 통합 가이드 생성

## 🎯 목표
현재 하이브리드 저장소 MVP 개발 중이며,  
백엔드는 아직 구축되지 않은 상태입니다.  

따라서 **서버 없이도 전체 기능이 작동하도록**  
Mock API와 로컬 저장소 기반으로 MVP를 테스트할 수 있는 가이드 문서를 생성하세요.  

이 가이드는 `docs/MOCK_INTEGRATION_GUIDE.md` 파일로 생성됩니다.  
문서 안에는 아래 내용이 모두 포함되어야 합니다:

---

# 🧩 Mock API 기반 MVP 통합 가이드

**목적:**  
현재 하이브리드 저장소 MVP 단계에서는 **실제 백엔드 서버 없이도 전체 기능을 테스트**할 수 있어야 합니다.  
이 문서는 기존 API 의존 코드를 **Mock 기반으로 임시 대체하는 방법**을 안내합니다.

---

## 📁 파일 구조 (MVP용 Mock 포함)

```
src/
├── services/
│   ├── furnitureApi.mock.ts      # Mock API 구현
│   ├── hybridStorage.ts          # HybridStorage 클래스
│   └── syncManager.ts            # 동기화 매니저 (Mock과 연동)
├── types/
│   ├── api.ts                    # API 인터페이스 정의
│   └── furniture.ts              # CustomFurnitureItem 타입
├── utils/
│   └── mockHelpers.ts            # 공통 Mock 유틸리티
└── components/
    └── features/
        └── furniture/
            └── EnhancedFurnitureCatalog.tsx  # UI 컴포넌트 (Mock 데이터 표시)
```

---

## ⚙️ 1. Mock API 서비스 구현

**파일:** `src/services/furnitureApi.mock.ts`

```typescript
import { UploadFurnitureRequest, UploadFurnitureResponse } from '@/types/api'
import { CustomFurnitureItem, SyncStatus } from '@/types/furniture'

// ✅ 서버 없이 동작하는 Mock API
export const MockFurnitureApi = {
  async uploadFurniture(data: UploadFurnitureRequest): Promise<UploadFurnitureResponse> {
    console.log('[MOCK] UploadFurniture called:', data.name)

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `mock-${Date.now()}`,
          serverId: `srv-${Date.now()}`,
          urls: {
            model: '/mock/model.glb',
            thumbnail: '/mock/thumb.jpg',
          },
        })
      }, 300)
    })
  },

  async downloadFurniture(id: string): Promise<CustomFurnitureItem> {
    console.log('[MOCK] DownloadFurniture called:', id)
    return {
      id,
      name: 'Mock Chair',
      category: 'chair',
      storage: {
        type: 'local',
        localId: id,
        version: 1,
      },
      sync: { status: 'synced' },
      files: {
        model: { local: new Blob(), size: 100, hash: 'abc123' },
        thumbnail: { local: new Blob(), size: 50, hash: 'xyz789' },
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'mock-user',
        tags: ['mock', 'test'],
        isPublic: true,
      },
    }
  },

  async syncStatus(id: string): Promise<SyncStatus> {
    console.log('[MOCK] SyncStatus check:', id)
    return 'synced'
  },
}
```

---

## ⚙️ 2. HybridStorage에 Mock API 연결

**파일:** `src/services/hybridStorage.ts`

```typescript
import { MockFurnitureApi } from './furnitureApi.mock'
import { CustomFurnitureItem, SyncStatus } from '@/types/furniture'

export class HybridStorage {
  async saveLocal(item: CustomFurnitureItem): Promise<void> {
    localStorage.setItem(item.storage.localId, JSON.stringify(item))
    console.log('[LOCAL] Saved item locally:', item.name)
  }

  async syncToServer(item: CustomFurnitureItem): Promise<void> {
    console.log('[SYNC] Trying to sync item:', item.name)

    const response = await MockFurnitureApi.uploadFurniture({
      name: item.name,
      category: item.category,
      metadata: item.metadata,
      files: {
        model: new File([item.files.model.local], `${item.name}.glb`),
      },
    })

    item.storage.serverId = response.serverId
    item.sync.status = 'synced'
    localStorage.setItem(item.storage.localId, JSON.stringify(item))

    console.log('[SYNC] Item synced to mock server:', response.serverId)
  }

  async getSyncStatus(itemId: string): Promise<SyncStatus> {
    return MockFurnitureApi.syncStatus(itemId)
  }

  async resolveConflict(itemId: string, resolution: 'local' | 'server'): Promise<void> {
    console.log(`[MOCK] Conflict resolved by ${resolution} for item:`, itemId)
  }
}
```

---

## ⚙️ 3. SyncManager에서 Mock 큐 관리

**파일:** `src/services/syncManager.ts`

```typescript
import { HybridStorage } from './hybridStorage'

export class SyncManager {
  private storage = new HybridStorage()

  async startBackgroundSync() {
    console.log('[SYNC] Background sync started (mock mode)')
    const allKeys = Object.keys(localStorage)
    for (const key of allKeys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const item = JSON.parse(raw)
      if (item.sync?.status === 'pending') {
        await this.storage.syncToServer(item)
      }
    }
  }

  onNetworkChange(callback: (online: boolean) => void) {
    window.addEventListener('online', () => callback(true))
    window.addEventListener('offline', () => callback(false))
  }
}
```

---

## 🎨 4. UI 컴포넌트에서 Mock 데이터 활용

**파일:** `src/components/features/furniture/EnhancedFurnitureCatalog.tsx`

```tsx
import { useEffect, useState } from 'react'
import { CustomFurnitureItem } from '@/types/furniture'
import { HybridStorage } from '@/services/hybridStorage'

export default function EnhancedFurnitureCatalog() {
  const [items, setItems] = useState<CustomFurnitureItem[]>([])
  const storage = new HybridStorage()

  useEffect(() => {
    const mockItem = {
      name: 'Mock Sofa',
      category: 'sofa',
      storage: { type: 'local', localId: 'mock-sofa', version: 1 },
      sync: { status: 'pending' },
      files: {
        model: { local: new Blob(), size: 100, hash: 'xyz' },
        thumbnail: { local: new Blob(), size: 50, hash: 'abc' },
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'mock-user',
        tags: ['mock', 'preview'],
        isPublic: true,
      },
    }
    setItems([mockItem as CustomFurnitureItem])
  }, [])

  return (
    <div>
      <h2 className="text-lg font-bold">Furniture Catalog (Mock Mode)</h2>
      {items.map((item) => (
        <div key={item.storage.localId} className="border p-2 mt-2 rounded">
          <p>🪑 {item.name}</p>
          <p>Status: {item.sync.status}</p>
          <button
            className="bg-blue-500 text-white px-2 py-1 rounded mt-1"
            onClick={() => storage.syncToServer(item)}
          >
            Sync to Mock Server
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## 🔄 5. 전환 포인트 (나중에 백엔드 연결 시)

Mock을 제거할 때는 아래 두 가지만 교체하면 됩니다 👇

| 항목 | 현재 | 나중에 교체 |
|------|------|-------------|
| API 파일 | `furnitureApi.mock.ts` | `furnitureApi.ts` (실제 서버 API) |
| import 경로 | `import { MockFurnitureApi }` | `import { FurnitureApiService }` |

구조나 함수 이름은 동일하게 유지하므로,  
다른 코드는 수정할 필요 없습니다.

---

## ✅ 요약

| 목표 | 설명 |
|------|------|
| 빠른 MVP 실행 | 서버 구축 없이 전체 흐름 테스트 |
| 구조 유지 | 나중에 서버 연결 시 최소 수정 |
| 테스트 용이 | UI, HybridStorage, SyncManager 모두 Mock 데이터로 작동 |
| 교체 용이 | 실제 API 서비스와 동일한 함수 시그니처 유지 |

---

## 🧠 팁

- Mock 데이터는 **localStorage**에 자동 저장되어 새로고침해도 유지됩니다.  
- DevTools → Application 탭에서 삭제 가능.  
- 나중에 실제 서버 연결 시 이 Mock API는 테스트 레이어로 재활용할 수 있습니다.  

---

> 💬 **결론:**  
> 이 구조를 통해 MVP 단계에서 **서버 없이도 실제 백엔드처럼 작동**하는 환경을 유지할 수 있으며,  
> 나중에 서버를 붙여도 **코드 수정은 import 한 줄로 제한**됩니다.

