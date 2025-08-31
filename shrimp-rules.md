# Bondidi 3D Room Editor - AI Agent Development Standards

## Project Overview

**Purpose**: 3D 룸 에디터 - React Three Fiber 기반 가구 배치 및 편집 시스템
**Tech Stack**: Next.js 15, React Three Fiber, Zustand, TypeScript, Tailwind CSS
**Core Functionality**: 3D 공간에서 가구 배치, 편집, 템플릿 적용

## Project Architecture

### Directory Structure
```
src/
├── app/                 # Next.js App Router
├── components/          # React 컴포넌트
│   ├── Real3DRoom.tsx  # 메인 3D 룸 컴포넌트
│   ├── EditableFurniture.tsx  # 편집 가능한 가구 컴포넌트
│   ├── GridSystem.tsx  # 그리드 시스템
│   └── ...             # 기타 UI 컴포넌트
├── store/               # Zustand 상태 관리
│   └── editorStore.ts  # 편집 상태 및 가구 관리
├── types/               # TypeScript 타입 정의
│   ├── editor.ts       # 편집 관련 타입
│   └── furniture.ts    # 가구 관련 타입
├── data/                # 데이터 및 유틸리티
│   ├── furnitureCatalog.ts  # 가구 카탈로그
│   └── roomTemplates.ts     # 룸 템플릿
└── utils/               # 유틸리티 함수
```

## Code Standards

### Naming Conventions
- **Components**: PascalCase (예: `Real3DRoom`, `EditableFurniture`)
- **Files**: PascalCase for components, camelCase for utilities
- **Functions**: camelCase (예: `handleTransformChange`, `snapToGrid`)
- **Constants**: UPPER_SNAKE_CASE (예: `TOLERANCE`, `MAX_HISTORY_SIZE`)

### Code Style
- **TypeScript**: Strict mode 사용, 모든 props에 타입 정의
- **React Hooks**: useCallback, useEffect, useState 적절히 사용
- **Comments**: 한국어 주석 사용, 주요 로직에 설명 추가
- **Console Logs**: 🎯, ⚠️, ✅ 등 이모지로 로그 레벨 구분

### Import Order
1. React 관련
2. Three.js 관련
3. 외부 라이브러리
4. 내부 컴포넌트/유틸리티
5. 타입 정의

## Functionality Implementation Standards

### 3D 컴포넌트 구현
- **TransformControls**: 편집 모드에서만 활성화, 모바일 환경 고려
- **그리드 스냅**: 실시간 스냅, 임계값 기반 자연스러운 스냅
- **상태 동기화**: Three.js 객체와 Zustand 상태 간 일관성 유지

### 상태 관리
- **Zustand Store**: 단일 스토어로 모든 편집 상태 관리
- **히스토리**: 압축된 형태로 메모리 효율성 확보
- **성능**: 불필요한 리렌더링 방지, useCallback/useMemo 활용

### 가구 시스템
- **모델 로딩**: GLTF 모델 우선, 폴백 모델 지원
- **배치**: 충돌 방지, 적절한 초기 위치 계산
- **편집**: 위치/회전/크기 조정, 고정/해제 기능

## Framework/Plugin Usage Standards

### React Three Fiber
- **Canvas**: shadows, antialias, alpha 설정 최적화
- **useFrame**: 60fps 제한, 성능 고려
- **useThree**: 카메라, 렌더러 접근 시 주의

### Three.js
- **Vector3/Euler**: 새 인스턴스 생성 시 clone() 사용
- **Geometry**: 메모리 누수 방지, dispose() 호출
- **Materials**: 재사용 가능한 머티리얼 사용

### Zustand
- **subscribeWithSelector**: 선택적 구독으로 성능 최적화
- **상태 업데이트**: 불변성 유지, 스프레드 연산자 사용
- **액션 함수**: 외부에서 직접 호출 가능하도록 export

## Workflow Standards

### 편집 모드 전환
1. `setMode('edit')` 호출
2. 그리드 시스템 활성화
3. TransformControls 준비
4. 가구 카탈로그 표시

### 가구 배치 프로세스
1. 카탈로그에서 가구 선택
2. 적절한 초기 위치 계산
3. `addItem()` 호출
4. 편집 모드 자동 진입

### 상태 업데이트 플로우
1. 사용자 입력 감지
2. Three.js 객체 속성 변경
3. `updateItem()` 호출
4. 히스토리 캡처
5. UI 동기화

## Key File Interaction Standards

### 동시 수정이 필요한 파일들
- **Real3DRoom.tsx** ↔ **editorStore.ts**: 모드 변경, 가구 관리
- **EditableFurniture.tsx** ↔ **editorStore.ts**: 상태 업데이트, 히스토리
- **GridSystem.tsx** ↔ **editorStore.ts**: 그리드 설정 동기화

### 의존성 체인
```
Real3DRoom (UI) → editorStore (상태) → EditableFurniture (3D 객체)
                ↓
            GridSystem (시각적 그리드)
```

### 파일 수정 순서
1. 타입 정의 수정 (`types/`)
2. 상태 관리 수정 (`store/`)
3. 컴포넌트 수정 (`components/`)
4. 데이터/유틸리티 수정 (`data/`, `utils/`)

## AI Decision-making Standards

### 우선순위 판단 기준
1. **Critical**: 런타임 에러, 상태 불일치
2. **High**: 사용자 경험 저하, 성능 문제
3. **Medium**: 코드 품질, 리팩토링
4. **Low**: 주석, 로깅, 문서화

### 모호한 상황 처리
- **상태 불일치**: Three.js 객체와 Zustand 상태 비교
- **성능 문제**: React DevTools, Three.js Inspector 사용
- **타입 에러**: TypeScript 컴파일러 오류 메시지 분석

### 테스트 우선순위
1. **기능 테스트**: 주요 편집 기능 동작 확인
2. **상태 테스트**: Zustand 스토어 상태 일관성
3. **3D 테스트**: Three.js 객체 속성 정확성
4. **UI 테스트**: 반응형 디자인, 모바일 호환성

## Prohibited Actions

### ❌ 금지된 행위
- **하드코딩**: 매직 넘버, 하드코딩된 값 사용
- **전역 상태**: Zustand 외 전역 상태 관리 도구 사용
- **직접 DOM 조작**: React 방식 외 DOM 직접 수정
- **메모리 누수**: Three.js 객체 dispose() 호출 누락
- **타입 무시**: any 타입 사용, 타입 체크 우회

### ⚠️ 주의사항
- **성능**: 무한 루프, 불필요한 리렌더링 방지
- **메모리**: 대용량 3D 모델, 텍스처 관리
- **사용자 경험**: 모바일 환경, 터치 인터페이스 고려
- **에러 처리**: try-catch 블록, 사용자 친화적 에러 메시지

## Development Workflow

### 새 기능 추가 시
1. 타입 정의 추가/수정
2. 상태 관리 로직 구현
3. UI 컴포넌트 구현
4. 3D 기능 연동
5. 테스트 및 검증

### 버그 수정 시
1. 문제 현상 파악
2. 관련 코드 분석
3. 근본 원인 식별
4. 최소한의 수정으로 해결
5. 부작용 검증

### 리팩토링 시
1. 기존 기능 동작 확인
2. 단계별 수정 진행
3. 각 단계마다 테스트
4. 성능 영향 분석
5. 문서 업데이트
