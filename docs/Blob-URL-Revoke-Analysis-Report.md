# 🔍 Blob URL Revoke 호출 지점 전체 분석 보고서

## 📋 개요
프로젝트 전체에서 `URL.revokeObjectURL()` 호출을 찾아 **Blob URL이 너무 일찍 revoke되어 Three.js가 접근하지 못하는 문제**를 분석합니다.

---

## 🎯 주요 발견 사항

### ✅ 안전한 Revoke 패턴
1. **useStableBlob.ts** - `setTimeout(..., 0)` 지연 사용 ✅
2. **export/download 기능** - 다운로드 후 즉시 revoke ✅

### ⚠️ 잠재적 문제 패턴
1. **Canvas3D_HooksA.tsx** - useEffect cleanup에서 즉시 revoke ⚠️
2. **dev 페이지들** - useEffect cleanup에서 즉시 revoke ⚠️

---

## 📄 상세 분석

### 1️⃣ **src/hooks/useStableBlob.ts** ✅ 안전함

**위치**: Lines 49-74

```typescript
const revokeLater = useCallback(
  (url: string | null) => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!url) {
      return;
    }
    const pending = pendingRevokesRef.current;
    if (pending.has(url)) {
      return;
    }
    pending.add(url);
    setTimeout(() => {  // ✅ 지연 사용!
      pending.delete(url);
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useStableBlob] Failed to revoke object URL.', error);
        }
      }
    }, 0);
  },
  []
);
```

**호출 타이밍**:
- ⏰ `setTimeout(..., 0)` - 다음 macrotask까지 지연
- 📍 useLayoutEffect cleanup에서 호출

**분석**:
- ✅ **안전함** - `setTimeout`으로 revoke를 다음 이벤트 루프로 연기
- ✅ Three.js 로더가 blob URL을 읽을 시간 확보
- ✅ 동시에 여러 revoke 요청 방지 (Set 사용)

**권장 사항**:
- ✅ 현재 구현 유지
- 💡 필요시 지연 시간을 100ms 정도로 늘려볼 수 있음

---

### 2️⃣ **src/components/3D/Canvas3D_HooksA.tsx** ⚠️ 문제 가능성

#### A. memoBlobUrl Revoke (Lines 143-157)

```typescript
useEffect(() => {
  if (!memoBlobUrl) {
    return;
  }

  return () => {
    try {
      URL.revokeObjectURL(memoBlobUrl);  // ⚠️ 즉시 revoke!
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Canvas3D] Failed to revoke object URL.', error);
      }
    }
  };
}, [memoBlobUrl]);
```

**호출 타이밍**:
- ⏰ useEffect cleanup - 즉시 실행
- 📍 `memoBlobUrl`이 변경되거나 컴포넌트 언마운트 시

**분석**:
- ⚠️ **위험** - `memoBlobUrl`이 변경되면 즉시 이전 URL revoke
- ❌ Three.js 로더가 아직 읽는 중일 수 있음
- ❌ 레이스 컨디션 발생 가능

**권장 수정**:
```typescript
useEffect(() => {
  if (!memoBlobUrl) {
    return;
  }

  return () => {
    // ✅ setTimeout으로 지연
    setTimeout(() => {
      try {
        URL.revokeObjectURL(memoBlobUrl);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Canvas3D] Failed to revoke object URL.', error);
        }
      }
    }, 100); // 100ms 지연
  };
}, [memoBlobUrl]);
```

---

#### B. asyncBlobUrl Revoke - 즉시 정리 (Lines 167-175)

```typescript
if (!modelFetcher) {
  if (asyncObjectUrlRef.current) {
    try {
      URL.revokeObjectURL(asyncObjectUrlRef.current);  // ⚠️ 즉시 revoke!
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Canvas3D] Failed to revoke async object URL.', error);
      }
    }
    asyncObjectUrlRef.current = null;
  }
  setAsyncBlobUrl(null);
  setIsAsyncLoading(false);
  return;
}
```

**호출 타이밍**:
- ⏰ `modelFetcher`가 null이 되면 즉시 실행
- 📍 useEffect 실행 중 (cleanup 아님)

**분석**:
- ⚠️ **위험** - `modelFetcher`가 변경되면 즉시 revoke
- ❌ 이전 모델이 아직 렌더링 중일 수 있음
- ❌ DraggableFurniture 등에서 참조 중일 수 있음

**권장 수정**:
```typescript
if (!modelFetcher) {
  if (asyncObjectUrlRef.current) {
    const urlToRevoke = asyncObjectUrlRef.current;
    asyncObjectUrlRef.current = null;
    
    // ✅ setTimeout으로 지연
    setTimeout(() => {
      try {
        URL.revokeObjectURL(urlToRevoke);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Canvas3D] Failed to revoke async object URL.', error);
        }
      }
    }, 100);
  }
  setAsyncBlobUrl(null);
  setIsAsyncLoading(false);
  return;
}
```

---

#### C. asyncBlobUrl Revoke - 새 URL 생성 전 (Lines 192-201)

```typescript
if (asyncObjectUrlRef.current) {
  try {
    URL.revokeObjectURL(asyncObjectUrlRef.current);  // ⚠️ 즉시 revoke!
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Canvas3D] Failed to revoke previous async URL.', error);
    }
  }
  asyncObjectUrlRef.current = null;
}
```

**호출 타이밍**:
- ⏰ 새 blob 생성 직전
- 📍 async 함수 내부

**분석**:
- ⚠️ **위험** - 새 blob을 만들기 직전에 이전 blob revoke
- ❌ 이전 모델을 참조하는 컴포넌트가 있을 수 있음
- ❌ React 리렌더링과 동기화되지 않음

**권장 수정**:
```typescript
if (asyncObjectUrlRef.current) {
  const oldUrl = asyncObjectUrlRef.current;
  asyncObjectUrlRef.current = null;
  
  // ✅ setTimeout으로 지연
  setTimeout(() => {
    try {
      URL.revokeObjectURL(oldUrl);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Canvas3D] Failed to revoke previous async URL.', error);
      }
    }
  }, 500); // 더 긴 지연 (새 모델 로딩 대기)
}
```

---

#### D. asyncBlobUrl Cleanup (Lines 227-239)

```typescript
return () => {
  cancelled = true;
  if (asyncObjectUrlRef.current) {
    try {
      URL.revokeObjectURL(asyncObjectUrlRef.current);  // ⚠️ 즉시 revoke!
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Canvas3D] Failed to revoke async object URL on cleanup.', error);
      }
    }
    asyncObjectUrlRef.current = null;
  }
};
```

**호출 타이밍**:
- ⏰ useEffect cleanup - 즉시 실행
- 📍 컴포넌트 언마운트 또는 `modelFetcher` 변경 시

**분석**:
- ⚠️ **위험** - cleanup 시 즉시 revoke
- ❌ 자식 컴포넌트가 아직 언마운트되지 않았을 수 있음
- ❌ Three.js가 아직 모델 로딩 중일 수 있음

**권장 수정**:
```typescript
return () => {
  cancelled = true;
  if (asyncObjectUrlRef.current) {
    const urlToRevoke = asyncObjectUrlRef.current;
    asyncObjectUrlRef.current = null;
    
    // ✅ setTimeout으로 지연
    setTimeout(() => {
      try {
        URL.revokeObjectURL(urlToRevoke);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Canvas3D] Failed to revoke async object URL on cleanup.', error);
        }
      }
    }, 100);
  }
};
```

---

### 3️⃣ **src/app/dev/asset-uploader/page.tsx** ⚠️ 문제 가능성

**위치**: Lines 12-20

```typescript
const [url, setUrl] = React.useState<string | null>(null);
React.useEffect(() => {
  if (!file) { setUrl(null); return; }
  const u = URL.createObjectURL(file);
  setUrl(u);
  return () => URL.revokeObjectURL(u);  // ⚠️ 즉시 revoke!
}, [file]);
```

**호출 타이밍**:
- ⏰ useEffect cleanup - 즉시 실행
- 📍 `file`이 변경되거나 컴포넌트 언마운트 시

**분석**:
- ⚠️ **위험** - 파일 변경 시 즉시 이전 URL revoke
- ❌ Canvas3D나 다른 컴포넌트가 아직 읽는 중일 수 있음
- ❌ 사용자가 빠르게 파일을 연속으로 선택하면 문제 발생

**권장 수정**:
```typescript
React.useEffect(() => {
  if (!file) { setUrl(null); return; }
  const u = URL.createObjectURL(file);
  setUrl(u);
  
  return () => {
    // ✅ setTimeout으로 지연
    setTimeout(() => {
      URL.revokeObjectURL(u);
    }, 100);
  };
}, [file]);
```

---

### 4️⃣ **src/app/dev/library/page.tsx** ⚠️ 문제 가능성

**위치**: Lines 13-21

```typescript
const [url, setUrl] = React.useState<string | null>(null);
React.useEffect(() => {
  if (!file) { setUrl(null); return; }
  const u = URL.createObjectURL(file);
  setUrl(u);
  return () => URL.revokeObjectURL(u);  // ⚠️ 즉시 revoke!
}, [file]);
```

**분석**: asset-uploader와 동일한 문제

**권장 수정**: asset-uploader와 동일

---

### 5️⃣ **Export/Download 기능들** ✅ 안전함

#### A. src/components/shared/AnalyticsDashboard.tsx (Line 211)
#### B. src/components/features/modals/UserPreferences.tsx (Line 148)
#### C. src/components/features/modals/ExportShareTools.tsx (Line 140)
#### D. tests/test-dashboard.html (Line 1607)

```typescript
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = filename;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);  // ✅ 다운로드 완료 후 즉시 revoke
```

**호출 타이밍**:
- ⏰ 다운로드 트리거 직후
- 📍 동기적으로 실행

**분석**:
- ✅ **안전함** - 다운로드가 완료된 후 revoke
- ✅ Three.js와 무관한 코드
- ✅ 메모리 누수 방지

**권장 사항**:
- ✅ 현재 구현 유지

---

## 🎯 문제 발생 시나리오

### 시나리오 1: 빠른 파일 전환
```
1. 사용자가 model1.glb 선택
   → blob:http://localhost:3002/abc123 생성
2. Canvas3D가 모델 로딩 시작 (Three.js)
3. 0.5초 후, 사용자가 model2.glb 선택
4. ❌ useEffect cleanup이 즉시 실행
   → URL.revokeObjectURL(blob:...abc123) 즉시 실행!
5. ❌ Three.js가 아직 model1.glb를 읽는 중
6. ❌ "Could not load blob:...: undefined" 에러!
```

### 시나리오 2: 컴포넌트 리렌더링
```
1. PlacedItem에 blob URL 저장
2. DraggableFurniture가 blob URL로 모델 로딩 시작
3. 다른 상태 변경으로 Canvas3D 리렌더링
4. ❌ useEffect cleanup 실행
   → blob URL 즉시 revoke!
5. ❌ DraggableFurniture의 loadModel이 아직 실행 중
6. ❌ "Could not load blob:...: undefined" 에러!
```

---

## ✅ 종합 권장 사항

### 1. **모든 Blob URL Revoke에 지연 적용**

**원칙**:
```typescript
// ❌ 나쁜 예
URL.revokeObjectURL(url);

// ✅ 좋은 예
setTimeout(() => {
  URL.revokeObjectURL(url);
}, 100); // 최소 100ms 지연
```

**이유**:
- Three.js 로더가 blob URL을 읽을 시간 확보
- React 리렌더링 사이클 완료 대기
- 자식 컴포넌트 언마운트 완료 대기

---

### 2. **우선순위별 수정 계획**

#### 🔴 긴급 (High Priority)
1. **Canvas3D_HooksA.tsx**
   - Lines 150, 169, 194, 231
   - 모든 즉시 revoke를 `setTimeout(..., 100)`으로 변경

2. **dev/asset-uploader/page.tsx**
   - Line 17
   - `setTimeout(..., 100)` 추가

3. **dev/library/page.tsx**
   - Line 18
   - `setTimeout(..., 100)` 추가

#### 🟡 중간 (Medium Priority)
1. **useStableBlob.ts**
   - 현재는 안전하지만, 지연 시간을 100ms로 늘려볼 것
   - Line 62: `setTimeout(..., 0)` → `setTimeout(..., 100)`

#### 🟢 낮음 (Low Priority)
1. **Export/Download 기능들**
   - 현재 구현 유지
   - 문제 없음

---

### 3. **공통 유틸리티 함수 생성**

```typescript
// src/utils/blobUrlManager.ts

/**
 * ✅ 안전한 Blob URL Revoke 유틸리티
 * Three.js와 React 렌더링 사이클을 고려하여 지연된 revoke 수행
 */
export function safeRevokeObjectURL(url: string | null, delay: number = 100): void {
  if (!url || typeof window === 'undefined') {
    return;
  }

  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
      if (process.env.NODE_ENV !== 'production') {
        console.log('[BlobManager] ✅ Blob URL revoked safely:', url);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[BlobManager] ⚠️ Failed to revoke blob URL:', error);
      }
    }
  }, delay);
}

/**
 * ✅ 안전한 Blob URL 생성 및 자동 정리
 */
export function createSafeObjectURL(
  source: Blob | File,
  autoRevokeDelay?: number
): string | null {
  try {
    const url = URL.createObjectURL(source);
    
    // 자동 정리 옵션
    if (autoRevokeDelay !== undefined) {
      safeRevokeObjectURL(url, autoRevokeDelay);
    }
    
    return url;
  } catch (error) {
    console.error('[BlobManager] ❌ Failed to create blob URL:', error);
    return null;
  }
}
```

**사용 예시**:
```typescript
// ❌ 기존
URL.revokeObjectURL(url);

// ✅ 개선
safeRevokeObjectURL(url, 100);

// ✅ 자동 정리
const url = createSafeObjectURL(file, 5000); // 5초 후 자동 revoke
```

---

## 📊 수정 우선순위 매트릭스

| 파일 | 라인 | 위험도 | 영향도 | 우선순위 | 예상 수정 시간 |
|------|------|--------|--------|----------|----------------|
| Canvas3D_HooksA.tsx | 150 | 🔴 높음 | 🔴 높음 | 🔴 긴급 | 5분 |
| Canvas3D_HooksA.tsx | 169 | 🔴 높음 | 🔴 높음 | 🔴 긴급 | 5분 |
| Canvas3D_HooksA.tsx | 194 | 🔴 높음 | 🔴 높음 | 🔴 긴급 | 5분 |
| Canvas3D_HooksA.tsx | 231 | 🔴 높음 | 🔴 높음 | 🔴 긴급 | 5분 |
| dev/asset-uploader | 17 | 🟡 중간 | 🟡 중간 | 🟡 중간 | 3분 |
| dev/library | 18 | 🟡 중간 | 🟡 중간 | 🟡 중간 | 3분 |
| useStableBlob.ts | 62 | 🟢 낮음 | 🟡 중간 | 🟢 낮음 | 2분 |

**총 예상 수정 시간**: 약 30분

---

## 🧪 테스트 시나리오

### 1. 빠른 파일 전환 테스트
```typescript
// test/blob-url-race-condition.spec.ts
test('빠른 파일 전환 시 blob URL 안정성', async ({ page }) => {
  await page.goto('/dev/asset-uploader');
  
  // 첫 번째 파일 업로드
  await page.setInputFiles('input[type="file"]', 'model1.glb');
  await page.waitForTimeout(100); // Three.js 로딩 시작
  
  // 즉시 두 번째 파일 업로드
  await page.setInputFiles('input[type="file"]', 'model2.glb');
  
  // 에러 체크
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.waitForTimeout(2000);
  
  // blob URL 에러가 없어야 함
  const blobErrors = errors.filter(e => 
    e.includes('Could not load blob') || 
    e.includes('Failed to fetch')
  );
  expect(blobErrors).toHaveLength(0);
});
```

### 2. 리렌더링 안정성 테스트
```typescript
test('컴포넌트 리렌더링 시 blob URL 안정성', async ({ page }) => {
  await page.goto('/');
  
  // 커스텀 가구 추가
  await page.click('[data-testid="add-custom-furniture"]');
  await page.setInputFiles('input[type="file"]', 'custom.glb');
  
  // 모델 로딩 대기
  await page.waitForSelector('canvas');
  await page.waitForTimeout(500);
  
  // 다른 UI 상태 변경 (리렌더링 유발)
  await page.click('[data-testid="toggle-grid"]');
  await page.click('[data-testid="change-room-size"]');
  
  // 에러 체크
  await page.waitForTimeout(1000);
  
  const errors = await page.evaluate(() => {
    return (window as any).__consoleErrors || [];
  });
  
  expect(errors.filter((e: string) => e.includes('blob'))).toHaveLength(0);
});
```

---

## 🎉 기대 효과

### Before (현재 상태)
```
1. 파일 전환 시 즉시 revoke
2. ❌ Three.js가 접근 시도
3. ❌ "Could not load blob" 에러
4. ❌ 모델 로딩 실패
5. ❌ Fallback 모델로 대체
```

### After (수정 후)
```
1. 파일 전환 시 100ms 지연 후 revoke
2. ✅ Three.js가 안전하게 읽기 완료
3. ✅ 에러 없음
4. ✅ 새 모델 정상 로딩
5. ✅ 부드러운 전환
```

---

## 📝 체크리스트

- [ ] Canvas3D_HooksA.tsx의 4개 revoke 지점 수정
- [ ] dev/asset-uploader/page.tsx 수정
- [ ] dev/library/page.tsx 수정
- [ ] safeRevokeObjectURL 유틸리티 생성
- [ ] useStableBlob 지연 시간 조정
- [ ] 테스트 시나리오 작성 및 실행
- [ ] 문서 업데이트
- [ ] 코드 리뷰 및 배포

---

**작성일**: 2025-10-09  
**분석자**: Agent A + B 통합 팀  
**상태**: ✅ 분석 완료, 수정 대기
**우선순위**: 🔴 긴급 - 즉시 수정 권장

