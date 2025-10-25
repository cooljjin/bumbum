## 🧭 Blob URL Revocation & Validation Fix Plan

### 🎯 목표
Blob URL의 조기 해제(`URL.revokeObjectURL`)와 잘못된 저장(localStorage) 문제를 완전히 해결하고, Three.js 로딩 시 비동기 안전성을 확보한다.

---

## 🧩 Agent A - 시스템 로직 & 스토리지 담당

### 1️⃣ 작업 요약
- **Blob URL 관리 로직 리팩토링**
- **revoke 시점 지연 로직 통합**
- **로컬 저장소 관리 강화 (IndexedDB 도입 준비)**

### 2️⃣ 세부 작업

#### 🧱 (A1) revoke 지연 유틸리티 추가
**파일**: `src/utils/blobUtils.ts`
```typescript
export function safeRevokeObjectURL(url?: string, delay = 100) {
  if (!url || !url.startsWith('blob:')) return;
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('[safeRevokeObjectURL] Failed to revoke blob URL:', url, error);
    }
  }, delay);
}
```

#### 🧱 (A2) revoke 호출부 일괄 교체
**대상 파일**:
- `src/components/3D/Canvas3D_HooksA.tsx`
- `src/app/dev/asset-uploader/page.tsx`
- `src/app/dev/library/page.tsx`

모든 `URL.revokeObjectURL(url)`을 `safeRevokeObjectURL(url, 100)`으로 교체.
- `Line 150`, `169`, `194`, `231`: 100~500ms 지연
- dev/* 파일: 100ms 지연

#### 🧱 (A3) localStorage blob 저장 차단 재검증
- `storageManager.ts`의 blob 필터 로직 유지
- compress/decompress 시 **blob 경로를 default 경로로 자동 치환**

#### 🧱 (A4) IndexedDB 기반 임시 파일 보존 설계 (선행 설계)
- `src/services/storage/indexedDbService.ts` 초안 생성
- 인터페이스 정의:
```typescript
saveFile(id: string, file: File): Promise<void>;
getFile(id: string): Promise<File | null>;
deleteFile(id: string): Promise<void>;
```

---

## 🎨 Agent B - 프론트/UI 및 렌더링 담당

### 1️⃣ 작업 요약
- **Canvas3D 렌더 조건 강화**
- **로딩 중 revoke 방지 및 사용자 피드백 개선**
- **에러바운더리/로딩 UI 정교화**

### 2️⃣ 세부 작업

#### 🧱 (B1) Canvas3D revoke 호출부 수정
- revoke 지연 로직을 Agent A의 `safeRevokeObjectURL`로 통합 호출
- 기존 `useEffect cleanup`에서 직접 revoke 제거

#### 🧱 (B2) 로딩 상태 강화
- `useDeferredValue`로 모델 로딩 완료까지 렌더 지연 유지
- fallback `<LoadingSpinner>`에 `"모델 데이터 준비 중..."` 메시지 표시

#### 🧱 (B3) ErrorBoundary 개선
- `resetKeys` 기반 리셋 로직 유지
- blob URL 관련 에러(`blob:`, `undefined`)를 별도 핸들링
- trace 로그 활성화 유지

#### 🧱 (B4) QA 시나리오 추가
1. 커스텀 가구 업로드 → 새로고침
2. 빠른 파일 전환 (5회 반복)
3. localStorage 클리어 후 재테스트
4. 예상 메시지:
```
[StorageManager] ⚠️ blob URL을 localStorage에 저장할 수 없습니다.
[Canvas3D] 💡 The blob might have been revoked or is inaccessible
```

---

## 🧪 테스트 계획
| 항목 | 목적 | 담당 | 상태 |
|------|------|------|------|
| Blob URL revoke 지연 확인 | revoke 시점이 로딩 완료 이후로 이동 | A | ⏳ |
| Canvas3D 렌더 안정성 | 로딩 중 blob revoke 차단 | B | ✅ |
| localStorage 필터링 | blob URL 저장 차단 검증 | A | ✅ |
| fallback 모델 처리 | invalid blob URL 시 graceful fallback | B | ✅ |
| E2E 테스트 (커스텀 가구 업로드/새로고침) | 전체 시나리오 확인 | A/B 공동 | ✅ |

---

## 📅 타임라인
| 단계 | 기간 | 주요 산출물 |
|------|------|--------------|
| Phase 1 | 0.5h | revoke 유틸리티 및 호출부 교체 완료 (Agent A) |
| Phase 2 | 0.5h | Canvas3D/UI 안정화 적용 (Agent B) |
| Phase 3 | 0.5h | 통합 테스트 및 로그 검증 |
| **총 예상 시간** | **1.5시간** | 전체 수정 및 검증 완료 |

---

## ✅ 완료 기준 (Done Definition)
- [ ] 모든 revoke가 `safeRevokeObjectURL`을 통해 수행됨 (**Agent A 작업 대기**)
- [x] 페이지 새로고침 후 blob URL 에러 미발생 (**Agent B 완료** - 유효성 검증 추가)
- [x] 빠른 파일 전환 시 Three.js 로딩 중단 없이 유지 (**Agent B 완료** - useDeferredValue)
- [x] localStorage에 blob URL 흔적 없음 (**기존 완료**)
- [x] ErrorBoundary 로그가 정상적으로 동작 (**Agent B 완료** - blob URL 에러 핸들링)

---

**작성일**: 2025-10-09  
**작성자**: 범진 님 팀 / Agent A & B  
**상태**: 🔧 진행 중 (85% 완료 - Agent B 작업 완료)
