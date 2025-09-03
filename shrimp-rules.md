# Bondidi Project Development Guidelines

## 프로젝트 개요

**Bondidi**는 Next.js 15 + React 19 기반의 3D 룸 에디터 애플리케이션입니다.
- **핵심 기능**: 3D 공간에서 가구 배치 및 편집
- **기술 스택**: Next.js 15.4.2, React 19.1.1, TypeScript 5.9.2, Three.js, Zustand
- **아키텍처**: App Router + 클라이언트 사이드 렌더링

## 프로젝트 아키텍처

### 디렉토리 구조
```
src/
├── app/                    # Next.js App Router 페이지
├── components/            # React 컴포넌트
│   ├── features/         # 기능별 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── shared/           # 공통 컴포넌트
│   └── ui/               # UI 기본 컴포넌트
├── store/                # Zustand 상태 관리
├── types/                # TypeScript 타입 정의
├── hooks/                # 커스텀 훅
├── utils/                # 유틸리티 함수
└── data/                 # 정적 데이터
```

### 핵심 컴포넌트
- **Real3DRoom.tsx**: 메인 3D 룸 컴포넌트 (979줄)
- **editorStore.ts**: 편집 상태 관리 (Zustand)
- **Room.tsx**: 3D 룸 렌더링
- **EnhancedFurnitureCatalog**: 가구 카탈로그

## 코드 표준

### TypeScript 설정
- **엄격 모드**: `strict: true`, `noImplicitAny: true`
- **절대 경로**: `@/*` 별칭 사용 필수
- **타입 안전성**: 모든 함수와 변수에 명시적 타입 정의

### React 컴포넌트 규칙
- **클라이언트 컴포넌트**: `'use client'` 지시어 필수
- **동적 임포트**: SSR 최적화를 위한 `dynamic()` 사용
- **성능 최적화**: `useCallback`, `useMemo` 적극 활용

### 상태 관리 (Zustand)
- **스토어 구조**: `subscribeWithSelector`, `devtools` 미들웨어 사용
- **성능 최적화**: `deepEqual` 비교로 불필요한 리렌더링 방지
- **히스토리 관리**: Undo/Redo 기능 지원

## 기능 구현 표준

### 3D 렌더링 (Three.js)
- **Canvas**: `@react-three/fiber` 사용
- **카메라 제어**: `camera-controls` 라이브러리 활용
- **성능 최적화**: `AdaptiveDpr`, `AdaptiveEvents` 사용

### 가구 편집 시스템
- **배치**: 그리드 스냅, 회전 스냅 지원
- **제약 조건**: 룸 경계 내 배치 강제
- **상태 관리**: 선택, 이동, 회전, 스케일링

### 성능 최적화
- **상수 정의**: `PERFORMANCE_CONSTANTS` 객체 사용
- **배치 업데이트**: 16ms 지연으로 60fps 최적화
- **메모리 관리**: 히스토리 크기 제한 (30개)

## 프레임워크/플러그인 사용 표준

### Next.js 15
- **App Router**: `src/app/` 디렉토리 구조 준수
- **동적 임포트**: 클라이언트 전용 컴포넌트는 `dynamic()` 사용
- **SSR 최적화**: 3D 컴포넌트는 `ssr: false` 설정

### Three.js + React Three Fiber
- **컴포넌트**: `@react-three/drei` 제공 컴포넌트 우선 사용
- **후처리**: `@react-three/postprocessing` 활용
- **성능**: `PerformanceMonitor` 컴포넌트로 모니터링

### Tailwind CSS
- **설정**: `tailwind.config.js` 커스터마이징
- **클래스**: 유틸리티 클래스 우선 사용
- **반응형**: 모바일 퍼스트 접근법

## 워크플로우 표준

### 개발 프로세스
1. **컴포넌트 생성**: `src/components/features/` 하위에 기능별 배치
2. **타입 정의**: `src/types/`에 인터페이스 정의
3. **상태 관리**: `src/store/`에 Zustand 스토어 생성
4. **테스트 작성**: `tests/` 디렉토리에 Jest + Playwright 테스트

### 테스트 전략
- **단위 테스트**: Jest + React Testing Library
- **E2E 테스트**: Playwright
- **성능 테스트**: 커스텀 성능 모니터링

## 주요 파일 상호작용 표준

### 동시 수정 필요 파일
- **Real3DRoom.tsx** 수정 시 → 관련 타입, 스토어, 유틸리티 동시 업데이트
- **editorStore.ts** 수정 시 → 타입 정의, 컴포넌트 연동 확인
- **타입 정의** 변경 시 → 모든 관련 컴포넌트와 스토어 업데이트

### 의존성 관리
- **3D 컴포넌트**: `@react-three/fiber`, `@react-three/drei` 버전 호환성
- **React 버전**: React 19 호환성 확인
- **TypeScript**: 엄격 모드 설정 유지

## AI 의사결정 표준

### 우선순위 판단 기준
1. **타입 안전성**: TypeScript 엄격 모드 준수 최우선
2. **성능 최적화**: 3D 렌더링 성능 영향 최소화
3. **사용자 경험**: 직관적인 3D 편집 인터페이스
4. **코드 품질**: 모듈화 및 재사용성

### 모호한 상황 처리
- **3D 성능 이슈**: `PerformanceMonitor` 컴포넌트 활용
- **타입 충돌**: `src/types/` 디렉토리 전체 검토
- **상태 동기화**: Zustand 스토어 구조 분석

## 금지 행위

### 절대 금지
- **SSR에서 3D 렌더링**: `ssr: false` 설정 필수
- **타입 안전성 무시**: `any` 타입 사용 금지
- **성능 최적화 무시**: 불필요한 리렌더링 방지 필수
- **절대 경로 무시**: `@/*` 별칭 사용 필수

### 권장하지 않음
- **인라인 스타일**: Tailwind CSS 클래스 우선 사용
- **전역 상태**: Zustand 외 상태 관리 라이브러리 사용 금지
- **직접 DOM 조작**: React 방식 준수

## 파일별 수정 가이드

### Real3DRoom.tsx 수정 시
- 관련 타입: `src/types/editor.ts`
- 상태 관리: `src/store/editorStore.ts`
- 유틸리티: `src/utils/roomBoundary.ts`

### 새로운 기능 추가 시
1. `src/types/`에 타입 정의
2. `src/store/`에 상태 관리 로직
3. `src/components/features/`에 컴포넌트 생성
4. `src/utils/`에 유틸리티 함수
5. 테스트 파일 작성

### 성능 최적화 시
- `PERFORMANCE_CONSTANTS` 상수 활용
- `useCallback`, `useMemo` 훅 사용
- 불필요한 리렌더링 방지
- 메모리 누수 방지

## 테스트 및 품질 관리

### 테스트 커버리지
- **단위 테스트**: 80% 이상 유지
- **E2E 테스트**: 주요 사용자 시나리오 커버
- **성능 테스트**: 60fps 유지 확인

### 코드 품질
- **ESLint**: 엄격한 규칙 적용
- **Prettier**: 일관된 코드 포맷팅
- **TypeScript**: 컴파일 에러 없음

## 배포 및 빌드

### 빌드 프로세스
- **정적 내보내기**: `next build && next export`
- **최적화**: 이미지, 폰트, 3D 모델 압축
- **CDN**: 정적 자산 CDN 배포

### 환경별 설정
- **개발**: `npm run dev` (포트 3002)
- **프로덕션**: `npm run build && npm run start`
- **테스트**: `npm run test:full`
