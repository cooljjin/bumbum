# 🧭 Canvas3D Blob Load Error 재발 방지 지침서

## 🎯 목표
`Could not load blob: undefined` 오류가 여전히 발생하는 문제를 완전히 해결하기 위해, **Agent A (로직/생명주기)** 와 **Agent B (렌더/UI)** 가 병렬로 작업할 수 있는 세부 지침을 제시합니다.

---

## ⚙️ 문제 진단
현재 구조는 blob URL을 생성 및 관리하는 로직이 안정화되었음에도 불구하고, 렌더 타이밍상 **Canvas가 아직 유효하지 않은 blob URL을 참조**하는 경우가 존재합니다.

즉, 문제는 다음 세 가지 원인 중 하나에 해당합니다:

1. **Suspense/Boundary 타이밍 문제** — `CanvasErrorBoundary`나 `Suspense`가 URL 준비 전에 렌더를 시도함.
2. **Re-render 레이스 컨디션** — blob URL이 revoke되는 타이밍과 렌더 시점이 어긋남.
3. **Three.js 내부 캐시 문제** — GLTFLoader 또는 TextureLoader가 이전 revoke된 blob URL을 캐시에서 재시도함.

---

## 👥 Agent 역할 분담

### 🧠 **Agent A: Lifecycle / Blob Management 담당**
> 목표: blob URL의 생명주기를 완전히 제어하여, 렌더 전에는 절대 undefined URL이 존재하지 않도록 보장.

#### 작업 지침
1. **useStableBlob 개선**
   - blob 생성과 revoke 타이밍을 분리.
   - `useLayoutEffect`로 URL 변경을 DOM 커밋 이전에 반영.

   ```tsx
   useLayoutEffect(() => {
     let objectUrl: string | null = null;
     if (modelFile) {
       objectUrl = URL.createObjectURL(modelFile);
       setBlobUrl(objectUrl);
     }
     return () => {
       if (objectUrl) URL.revokeObjectURL(objectUrl);
       setBlobUrl(null);
     };
   }, [modelFile]);
   ```

2. **Ref 기반 로더 보호**
   - GLTFLoader 또는 TextureLoader 사용 시, `if (!blobUrlRef.current)` 가드 추가.
   - undefined인 경우 즉시 리턴.

3. **Revoke 시점 완화**
   - URL.revokeObjectURL은 언마운트 시점에서만 실행되도록 조정.
   - `blobUrl`이 변경될 때 기존 URL은 1 tick 지연 후 해제 (microtask delay 사용).

   ```tsx
   setTimeout(() => URL.revokeObjectURL(oldUrl), 0);
   ```

4. **로더 캐시 무효화**
   ```tsx
   loader.manager.cache.clear();
   loader.parser.cache.clear();
   ```

#### 산출물
- `useStableBlob.ts` (개선된 훅)
- `Canvas3D_Lifecycle_A.tsx` (안정화된 훅 및 revoke 로직 적용)

---

### 🎨 **Agent B: UI / Suspense / Boundary 담당**
> 목표: 렌더 타이밍을 완전히 제어해 blob URL이 준비되기 전에는 Canvas가 절대 렌더되지 않도록.

#### 작업 지침
1. **Canvas 렌더 조건 강화**
   ```tsx
   if (!effectiveModelUrl || typeof effectiveModelUrl !== 'string') {
     return <LoadingSpinner message="모델 준비 중..." />;
   }
   ```

2. **Suspense + Boundary 병렬 렌더링 방지**
   - Suspense 내부에 ErrorBoundary를 중첩하지 않고, 하나의 상위 Wrapper에서만 관리.
   - key 기반 remount 대신 `resetKeys` 사용.

   ```tsx
   <CanvasErrorBoundary
     resetKeys={[modelSourceKey]}
     fallback={<LoadingSpinner message={loadingLabel} />}
   >
     <Suspense fallback={<LoadingSpinner message={loadingLabel} />}>
       <Canvas>...</Canvas>
     </Suspense>
   </CanvasErrorBoundary>
   ```

3. **렌더링 지연 (Transition / Deferred Value)**
   ```tsx
   const deferredUrl = useDeferredValue(effectiveModelUrl);
   if (!deferredUrl) return <LoadingSpinner message="모델 로딩 중..." />;
   ```

4. **Fallback 최적화**
   - 로딩 중인 blob이 교체될 때, 이전 Canvas를 유지하며 새 모델만 로딩하도록 변경.
   - 깜빡임 최소화 및 Suspense 재시작 방지.

#### 산출물
- `Canvas3D_Render_B.tsx` (Suspense 및 Boundary 안정화 적용)

---

## 🧩 병렬 작업 원칙
| 구분 | Agent A | Agent B |
|------|----------|----------|
| **Hook 선언부** | 전체 관리 | 수정 금지 |
| **렌더/JSX 구조** | 참조만 가능 | 수정 가능 |
| **ErrorBoundary/Suspense** | 사용하지 않음 | 통합 관리 |
| **Revoke/Fetch 타이밍** | 직접 제어 | 참조만 함 |
| **테스트 우선순위** | blob 생성/해제 안정성 | 렌더 타이밍 및 UI 안정성 |

---

## ✅ 완료 기준
- [ ] blob URL 생성/해제 타이밍이 DOM 렌더 전후로 정확히 동작
- [ ] undefined blob 접근이 절대 발생하지 않음
- [ ] CanvasErrorBoundary가 Suspense와 중복 렌더를 발생시키지 않음
- [ ] 렌더 중 blob 교체 시 깜빡임 없이 안전히 교체됨

---

## 🔍 검증 단계
1. 파일 업로드 → 모델 로딩 확인
2. 다른 blob으로 전환 → 기존 모델 정상 해제 후 새 모델 로드
3. 잘못된 모델 로드 → ErrorBoundary에서 오류 복원 확인
4. 모든 시나리오에서 콘솔에 `Could not load blob: undefined`가 나타나지 않음
