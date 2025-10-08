# 하이브리드 저장소 구현 가이드

## 📋 프로젝트 개요

**목표**: 퍼블리시 후 서버 업로드를 지원하는 하이브리드 저장소 시스템 구현
**기간**: 단계별 구현 (Phase 1-4)
**협업**: AI 에이전트 A, B 역할 분담

---

## 🤖 AI 에이전트 역할 분담

### **Agent A: 백엔드/인프라 담당**
- **담당 영역**: 서버 API, 데이터베이스, 파일 저장소
- **주요 작업**:
  - API 엔드포인트 설계 및 구현
  - 데이터베이스 스키마 설계
  - 파일 업로드/다운로드 로직
  - 서버 인프라 구성
  - 보안 및 인증 시스템

### **Agent B: 프론트엔드/클라이언트 담당**
- **담당 영역**: 클라이언트 로직, UI/UX, 동기화 관리
- **주요 작업**:
  - 타입 정의 및 인터페이스
  - HybridStorage 클래스 구현
  - UI 컴포넌트 수정
  - 동기화 상태 관리
  - 오프라인 지원

---

## 📁 파일 구조 및 작업 분배

```
src/
├── types/
│   ├── furniture.ts          # Agent B: 타입 확장
│   └── api.ts               # Agent A: API 타입 정의
├── services/
│   ├── furnitureApi.ts      # Agent A: 서버 API 클라이언트
│   ├── hybridStorage.ts     # Agent B: 하이브리드 저장소
│   └── syncManager.ts       # Agent B: 동기화 관리
├── utils/
│   ├── customLibrary.ts     # Agent B: 기존 코드 수정
│   └── fileOptimizer.ts     # Agent A: 파일 최적화
├── components/
│   └── features/
│       └── furniture/
│           └── EnhancedFurnitureCatalog.tsx  # Agent B: UI 수정
└── api/                     # Agent A: 서버 API 구현
    ├── routes/
    │   └── furniture.ts
    └── middleware/
        └── auth.ts
```

---

## 🎯 Phase 1: 기본 하이브리드 저장소 (우선순위: 높음)

### **Agent B 작업 (프론트엔드)**

#### 1.1 타입 정의 확장
**파일**: `src/types/furniture.ts`
```typescript
// 추가할 타입들
export type StorageType = 'local' | 'server' | 'hybrid';
export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'error';

export interface CustomFurnitureItem extends FurnitureItem {
  storage: {
    type: StorageType;
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

#### 1.2 HybridStorage 클래스 구현
**파일**: `src/services/hybridStorage.ts`
```typescript
export class HybridStorage {
  // 로컬 저장 (즉시)
  async saveLocal(item: CustomFurnitureItem): Promise<void>
  
  // 서버 동기화 (백그라운드)
  async syncToServer(item: CustomFurnitureItem): Promise<void>
  
  // 동기화 상태 관리
  async getSyncStatus(itemId: string): Promise<SyncStatus>
  
  // 충돌 해결
  async resolveConflict(itemId: string, resolution: 'local' | 'server'): Promise<void>
}
```

#### 1.3 기존 코드 수정
**파일**: `src/utils/customLibrary.ts`
- `saveCustomFurniture` 함수를 HybridStorage 사용하도록 수정
- 기존 IndexedDB 로직을 하이브리드 방식으로 변경

### **Agent A 작업 (백엔드)**

#### 1.4 API 타입 정의
**파일**: `src/types/api.ts`
```typescript
// API 요청/응답 타입들
export interface UploadFurnitureRequest {
  name: string;
  category: FurnitureCategory;
  metadata: any;
  files: {
    model: File;
    thumbnail?: File;
  };
}

export interface UploadFurnitureResponse {
  id: string;
  serverId: string;
  urls: {
    model: string;
    thumbnail?: string;
  };
}
```

#### 1.5 Mock API 서비스 구현
**파일**: `src/services/furnitureApi.ts`
```typescript
export class FurnitureApiService {
  // Mock 구현 (실제 서버 없이 테스트)
  async uploadFurniture(data: UploadFurnitureRequest): Promise<UploadFurnitureResponse>
  async downloadFurniture(id: string): Promise<CustomFurnitureItem>
  async syncStatus(id: string): Promise<SyncStatus>
}
```

---

## 🎯 Phase 2: 서버 API 연동 (우선순위: 중간)

### **Agent A 작업 (백엔드)**

#### 2.1 실제 API 서버 구현
**파일**: `src/api/routes/furniture.ts`
- Express.js 또는 Next.js API Routes 사용
- 파일 업로드 처리 (multer)
- 데이터베이스 연동 (PostgreSQL/MongoDB)

#### 2.2 파일 저장소 구성
- AWS S3 또는 CloudFront 설정
- CDN 구성
- 파일 최적화 (이미지 압축, GLB 최적화)

#### 2.3 인증 시스템
**파일**: `src/api/middleware/auth.ts`
- JWT 토큰 기반 인증
- 사용자 권한 관리
- API 키 관리

### **Agent B 작업 (프론트엔드)**

#### 2.4 UI 컴포넌트 수정
**파일**: `src/components/features/furniture/EnhancedFurnitureCatalog.tsx`
- 동기화 상태 표시
- 업로드 진행률 표시
- 오프라인 상태 표시

#### 2.5 동기화 관리자 구현
**파일**: `src/services/syncManager.ts`
```typescript
export class SyncManager {
  // 백그라운드 동기화
  async startBackgroundSync(): Promise<void>
  
  // 네트워크 상태 감지
  onNetworkChange(callback: (online: boolean) => void): void
  
  // 동기화 큐 관리
  async processSyncQueue(): Promise<void>
}
```

---

## 🎯 Phase 3: 고급 기능 (우선순위: 낮음)

### **Agent A 작업 (백엔드)**

#### 3.1 충돌 해결 시스템
- 서버 측 충돌 감지
- 자동 병합 로직
- 버전 관리 시스템

#### 3.2 성능 최적화
- 파일 압축 및 최적화
- CDN 캐싱 전략
- 데이터베이스 인덱싱

### **Agent B 작업 (프론트엔드)**

#### 3.3 오프라인 지원
- Service Worker 구현
- 오프라인 캐싱
- 동기화 큐 관리

#### 3.4 사용자 경험 개선
- 로딩 상태 관리
- 에러 처리 및 복구
- 진행률 표시

---

## 🎯 Phase 4: 운영 준비 (우선순위: 낮음)

### **Agent A 작업 (백엔드)**

#### 4.1 보안 강화
- 파일 보안 검증
- 바이러스 스캔
- 접근 권한 관리

#### 4.2 모니터링 및 로깅
- API 모니터링
- 에러 로깅
- 성능 메트릭

### **Agent B 작업 (프론트엔드)**

#### 4.3 에러 처리
- 사용자 친화적 에러 메시지
- 자동 복구 로직
- 백업 및 복원

---

## 🔄 협업 워크플로우

### **1. 작업 시작 전**
- 각 Agent는 담당 Phase의 작업 목록 확인
- 필요한 파일과 인터페이스 정의 확인
- 상호 의존성 있는 작업은 순서 조율

### **2. 작업 중**
- **Agent A**: API 인터페이스 먼저 정의 → Agent B에게 공유
- **Agent B**: 타입 정의 먼저 완료 → Agent A에게 공유
- 인터페이스 변경 시 상대방에게 즉시 알림

### **3. 작업 완료 후**
- 코드 리뷰 및 테스트
- 문서 업데이트
- 다음 Phase 준비

---

## 📋 체크리스트

### **Phase 1 완료 기준**
- [ ] Agent B: 타입 정의 완료
- [ ] Agent B: HybridStorage 클래스 구현
- [ ] Agent B: 기존 코드 수정 완료
- [ ] Agent A: API 타입 정의 완료
- [ ] Agent A: Mock API 서비스 구현
- [ ] 통합 테스트 통과

### **Phase 2 완료 기준**
- [ ] Agent A: 실제 API 서버 구현
- [ ] Agent A: 파일 저장소 구성
- [ ] Agent A: 인증 시스템 구현
- [ ] Agent B: UI 컴포넌트 수정
- [ ] Agent B: 동기화 관리자 구현
- [ ] E2E 테스트 통과

### **Phase 3 완료 기준**
- [ ] Agent A: 충돌 해결 시스템
- [ ] Agent A: 성능 최적화
- [ ] Agent B: 오프라인 지원
- [ ] Agent B: 사용자 경험 개선
- [ ] 성능 테스트 통과

### **Phase 4 완료 기준**
- [ ] Agent A: 보안 강화
- [ ] Agent A: 모니터링 시스템
- [ ] Agent B: 에러 처리
- [ ] Agent B: 백업/복원
- [ ] 운영 환경 배포

---

## 🚨 주의사항

### **Agent A 주의사항**
- API 인터페이스 변경 시 Agent B에게 즉시 알림
- 데이터베이스 스키마 변경 시 마이그레이션 스크립트 제공
- 보안 관련 설정은 민감 정보 제외하고 문서화

### **Agent B 주의사항**
- 타입 정의 변경 시 Agent A에게 즉시 알림
- 기존 UI 동작 유지 (하위 호환성)
- 사용자 경험을 해치지 않는 방향으로 구현

### **공통 주의사항**
- 각 Phase별로 독립적으로 테스트 가능하도록 구현
- 에러 처리는 graceful하게 구현
- 성능 최적화는 사용자 경험을 우선으로 고려
- 코드 리뷰는 상호 진행

---

## 📞 커뮤니케이션

### **작업 시작 시**
```
Agent A: "Phase 1 백엔드 작업 시작합니다. API 타입 정의부터 진행하겠습니다."
Agent B: "Phase 1 프론트엔드 작업 시작합니다. 타입 정의부터 진행하겠습니다."
```

### **인터페이스 변경 시**
```
Agent A: "API 응답 타입에 'serverId' 필드를 추가했습니다. 확인 부탁드립니다."
Agent B: "CustomFurnitureItem 타입에 'sync' 필드를 추가했습니다. 확인 부탁드립니다."
```

### **작업 완료 시**
```
Agent A: "Phase 1 백엔드 작업 완료했습니다. Mock API 서비스가 준비되었습니다."
Agent B: "Phase 1 프론트엔드 작업 완료했습니다. HybridStorage 클래스가 준비되었습니다."
```

---

이 가이드를 따라 각 Agent가 역할을 분담하여 효율적으로 작업을 진행할 수 있습니다. 각 Phase별로 명확한 목표와 완료 기준을 제시했으므로, 단계별로 진행하면서 품질을 보장할 수 있습니다.
