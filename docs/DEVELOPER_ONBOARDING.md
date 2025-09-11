# 개발자 온보딩 가이드

## 👋 환영합니다!

Bondidi 3D 룸 에디터 프로젝트에 참여하게 된 것을 환영합니다! 이 가이드는 새로운 팀원이 프로젝트에 빠르게 적응할 수 있도록 돕는 것을 목표로 합니다.

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [개발 환경 설정](#개발-환경-설정)
3. [코드 구조 이해](#코드-구조-이해)
4. [주요 워크플로우](#주요-워크플로우)
5. [개발 도구 및 명령어](#개발-도구-및-명령어)
6. [코드 기여 가이드](#코드-기여-가이드)
7. [문제 해결](#문제-해결)
8. [참고 자료](#참고-자료)

## 프로젝트 개요

### 🎯 프로젝트 목표

**Bondidi**는 사용자가 3D 환경에서 가구를 배치하고 디자인할 수 있는 웹 애플리케이션입니다. 주요 기능은 다음과 같습니다:

- **3D 룸 시각화**: Three.js를 활용한 실시간 3D 렌더링
- **가구 배치**: 드래그 앤 드롭 방식의 직관적인 인터랙션
- **실시간 편집**: 즉각적인 피드백을 제공하는 편집 환경
- **반응형 디자인**: 모바일과 데스크톱 모두 지원

### 🏗️ 기술 스택

| 카테고리 | 기술 | 버전 | 목적 |
|---------|------|------|------|
| **프론트엔드** | Next.js | 15.x | React 기반 풀스택 프레임워크 |
| **언어** | TypeScript | 5.x | 타입 안전성 확보 |
| **UI 라이브러리** | React | 18.x | 컴포넌트 기반 UI 개발 |
| **3D 그래픽스** | Three.js | 최신 | WebGL 기반 3D 렌더링 |
| **3D 통합** | React Three Fiber | 최신 | React와 Three.js 통합 |
| **상태 관리** | Zustand | 최신 | 경량 상태 관리 |
| **스타일링** | Tailwind CSS | 최신 | 유틸리티 퍼스트 CSS |
| **테스트** | Jest + React Testing Library | 최신 | 단위 및 통합 테스트 |
| **E2E 테스트** | Playwright | 최신 | 종단 간 테스트 |

### 📊 프로젝트 규모

- **총 라인 수**: ~10,000+ 라인
- **컴포넌트 수**: 30+ 개
- **테스트 커버리지 목표**: 90%+
- **주요 의존성**: 50+ 개

## 개발 환경 설정

### 📋 사전 요구사항

#### 시스템 요구사항
```bash
# Node.js (권장 버전)
Node.js: 20.x 이상
npm: 10.x 이상
Yarn: 1.x 이상 (선택사항)

# 운영체제
macOS: 12.0+
Windows: 10+
Linux: Ubuntu 20.04+

# 하드웨어
RAM: 8GB 이상
저장공간: 10GB 이상
```

#### 필수 도구 설치
```bash
# Node.js 설치 (nvm 사용 권장)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Git 설정
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Git LFS (3D 모델 파일용)
git lfs install
```

### 🚀 프로젝트 설정

#### 1. 저장소 클론
```bash
git clone https://github.com/company/bumbum.git
cd bumbum
```

#### 2. 의존성 설치
```bash
# npm 사용
npm install

# 또는 yarn 사용
yarn install
```

#### 3. 환경 변수 설정
```bash
# .env.local 파일 생성
cp .env.example .env.local

# 다음 변수들을 설정하세요:
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_ENV=development
```

#### 4. 개발 서버 실행
```bash
# 기본 개발 서버
npm run dev

# 또는
yarn dev
```

#### 5. 브라우저에서 확인
```
http://localhost:3000 (또는 할당된 포트)
```

### 🔧 추가 설정 (선택사항)

#### VS Code 확장 프로그램
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright"
  ]
}
```

#### Pre-commit Hook 설정
```bash
# husky 설치 및 설정
npm run prepare
```

## 코드 구조 이해

### 📁 디렉토리 구조

```
bumbum/
├── 📁 docs/                 # 프로젝트 문서
│   ├── API.md              # API 문서
│   ├── ARCHITECTURE.md     # 아키텍처 문서
│   ├── COMPONENTS.md       # 컴포넌트 가이드
│   ├── CODING_STYLE.md     # 코딩 스타일 가이드
│   └── DEVELOPER_ONBOARDING.md # 이 파일
├── 📁 public/              # 정적 파일
│   ├── models/            # 3D 모델 파일
│   └── images/            # 이미지 파일
├── 📁 src/
│   ├── 📁 app/            # Next.js App Router
│   │   ├── layout.tsx     # 루트 레이아웃
│   │   ├── page.tsx       # 메인 페이지
│   │   └── globals.css    # 전역 스타일
│   ├── 📁 components/     # React 컴포넌트
│   │   ├── ui/           # 기본 UI 컴포넌트
│   │   ├── furniture/    # 가구 관련 컴포넌트
│   │   └── layout/       # 레이아웃 컴포넌트
│   ├── 📁 hooks/         # 커스텀 React 훅
│   ├── 📁 store/         # Zustand 상태 관리
│   ├── 📁 types/         # TypeScript 타입 정의
│   ├── 📁 utils/         # 유틸리티 함수
│   └── 📁 data/          # 정적 데이터
├── 📁 tests/              # E2E 테스트
├── 📁 .github/            # GitHub Actions
└── 📄 package.json        # 프로젝트 설정
```

### 🔄 데이터 플로우

```
사용자 인터랙션 → 컴포넌트 이벤트 → 액션 디스패치 → 상태 업데이트 → 리렌더링
    ↓                ↓                ↓              ↓            ↓
마우스 클릭 → onClick 핸들러 → store.action() → 상태 변경 → 새 UI 표시
```

### 🎯 주요 컴포넌트 역할

| 컴포넌트 | 역할 | 주요 기능 |
|---------|------|----------|
| **Real3DRoom** | 메인 3D 씬 | Three.js 캔버스, 카메라 컨트롤, 조명 |
| **DraggableFurniture** | 가구 아이템 | 3D 모델 렌더링, 드래그 앤 드롭, 충돌 감지 |
| **FurnitureCatalog** | 가구 목록 | 카테고리 필터링, 검색, 미리보기 |
| **EditorToolbar** | 편집 도구 | 실행 취소/다시 실행, 그리드 토글, 저장 |
| **SettingsModal** | 설정 패널 | 그리드 설정, 스냅 설정, 성능 설정 |

## 주요 워크플로우

### 🏠 기본 사용자 플로우

1. **프로젝트 로드**: 메인 페이지에서 새로운 룸 생성 또는 기존 프로젝트 로드
2. **가구 선택**: 왼쪽 패널에서 카테고리 선택 후 가구 선택
3. **가구 배치**: 선택한 가구를 드래그하여 3D 공간에 배치
4. **세부 조정**: 위치, 회전, 크기 조정 (편집 모드)
5. **저장**: 작업 내용 저장 및 내보내기

### 🔧 개발 워크플로우

1. **이슈 할당**: GitHub Issues에서 작업할 이슈 선택
2. **브랜치 생성**: `feature/이슈번호-간단한-설명` 형식
3. **코드 작성**: 기능 구현 및 테스트 작성
4. **코드 리뷰**: PR 생성 후 팀원 리뷰 요청
5. **병합**: 승인 후 main 브랜치에 병합

## 개발 도구 및 명령어

### 📦 주요 npm 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린팅 실행
npm run lint

# 린팅 자동 수정
npm run lint:fix

# 타입 체킹
npm run type-check

# 테스트 실행
npm run test

# 테스트 커버리지
npm run test:coverage

# E2E 테스트
npm run test:e2e

# 모든 검증 실행
npm run validate
```

### 🛠️ 개발 도구 명령어

```bash
# 새로운 컴포넌트 생성
npm run generate component ComponentName

# 새로운 훅 생성
npm run generate hook useHookName

# 새로운 타입 생성
npm run generate type TypeName

# 새로운 유틸리티 생성
npm run generate util utilityName
```

### 🔍 디버깅 명령어

```bash
# React DevTools 열기
npm run devtools

# 빌드 분석
npm run analyze

# 번들 크기 분석
npm run bundle-analyzer
```

## 코드 기여 가이드

### 📝 브랜치 전략

```
main (프로덕션 준비)
├── develop (개발 통합)
│   ├── feature/123-user-authentication
│   ├── feature/124-3d-model-optimization
│   └── bugfix/125-drag-drop-issue
└── hotfix/critical-security-patch
```

### 🔄 Pull Request 프로세스

#### 1. PR 생성 전 체크리스트
- [ ] 관련 이슈가 있는 경우 이슈 번호 포함
- [ ] 테스트 코드 작성 완료
- [ ] 코딩 스타일 준수 (ESLint 통과)
- [ ] 타입 체킹 통과
- [ ] 문서 업데이트 완료

#### 2. PR 템플릿
```markdown
## 📝 작업 내용
어떤 작업을 했는지 간단히 설명해주세요.

## 🔧 변경사항
- 변경된 파일과 주요 변경사항을 나열해주세요
- breaking changes가 있다면 명시해주세요

## 🧪 테스트
- 추가된 테스트 케이스
- 테스트 커버리지 변화
- 수동 테스트 결과

## 📚 문서
- 업데이트된 문서 파일
- 새로운 API나 컴포넌트 설명

## 🔗 관련 이슈
Closes #123
Refs #456

## 📋 추가 노트
리뷰어에게 전달할 추가 정보
```

#### 3. 코드 리뷰 기준
- **기능성**: 요구사항을 정확히 구현했는가?
- **코드 품질**: 가독성, 성능, 유지보수성이 좋은가?
- **테스트**: 충분한 테스트 커버리지를 가지고 있는가?
- **문서화**: 필요한 문서가 업데이트되었는가?

### 🎯 커밋 메시지 규칙

```
feat(auth): add user login functionality
^    ^     ^
|    |     └── 제목: 현재형 동사로 시작, 50자 이내
|    └── 범위: 영향을 받는 모듈/컴포넌트
└── 타입: feat, fix, docs, style, refactor, test, chore
```

## 문제 해결

### 🔧 일반적인 문제들

#### 빌드 실패
```bash
# 캐시 정리
npm run clean

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# TypeScript 캐시 정리
npx tsc --build --clean
```

#### 테스트 실패
```bash
# 특정 테스트만 실행
npm run test -- --testNamePattern="ComponentName"

# 디버그 모드로 테스트 실행
npm run test:debug

# 테스트 커버리지 제외 파일 설정
# .gitignore에 추가
coverage/
```

#### 성능 문제
```bash
# 번들 분석
npm run analyze

# 메모리 누수 확인
npm run test:memory

# React DevTools Profiler 사용
```

### 📞 도움이 필요한 경우

#### 팀 연락처
- **기술 리드**: tech-lead@company.com
- **프론트엔드 리드**: frontend-lead@company.com
- **DevOps**: devops@company.com

#### 커뮤니케이션 채널
- **Slack**: #frontend-dev, #3d-graphics, #testing
- **GitHub Issues**: 버그 리포트 및 기능 요청
- **Wiki**: 프로젝트 문서 및 가이드

#### 긴급 상황
🚨 **긴급 상황 시**: 24시간 응답 팀에 연락
- 시스템 다운: +82-10-XXXX-XXXX
- 보안 이슈: security@company.com

## 참고 자료

### 📚 필수 읽기 자료

1. **[프로젝트 문서](./README.md)** - 프로젝트 개요 및 시작 가이드
2. **[코딩 스타일 가이드](./CODING_STYLE.md)** - 코드 작성 규칙
3. **[아키텍처 문서](./ARCHITECTURE.md)** - 시스템 설계 원칙
4. **[컴포넌트 가이드](./COMPONENTS.md)** - 컴포넌트 사용법
5. **[API 문서](./API.md)** - API 및 타입 정의

### 🔗 외부 참고 자료

#### 공식 문서
- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://react.dev)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs)
- [Three.js 문서](https://threejs.org/docs)

#### 학습 리소스
- [React Three Fiber 튜토리얼](https://docs.pmnd.rs/react-three-fiber)
- [Zustand 가이드](https://github.com/pmndrs/zustand)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

#### 커뮤니티
- [React 한국어 커뮤니티](https://react-kr.github.io)
- [TypeScript 한국어 커뮤니티](https://typescript-kr.github.io)
- [Three.js 포럼](https://discourse.threejs.org)

### 🏆 성공 기준

#### 1주차 목표
- [ ] 개발 환경 완전 설정
- [ ] 프로젝트 구조 이해
- [ ] 간단한 컴포넌트 수정/추가
- [ ] 기본 테스트 작성
- [ ] 첫 PR 생성

#### 2주차 목표
- [ ] 주요 기능 구현 참여
- [ ] 코드 리뷰 참여
- [ ] 테스트 커버리지 기여
- [ ] 문서화 기여

#### 1개월차 목표
- [ ] 독립적인 기능 개발
- [ ] 팀 프로세스 완전 이해
- [ ] 코드 리뷰어 역할 수행
- [ ] 새로운 팀원 멘토링

---

## 🎉 시작하기

이제 모든 준비가 완료되었습니다! 다음 단계들을 따라 시작해보세요:

1. **이 문서 끝까지 읽기** 📖
2. **개발 환경 설정하기** 💻
3. **첫 번째 "Hello World" 컴포넌트 만들기** 🚀
4. **간단한 테스트 작성하기** 🧪
5. **첫 PR 만들기** ✅

궁금한 점이 있으면 언제든지 물어보세요. 함께 멋진 프로젝트를 만들어 나가요! 🌟

---

**문서 버전**: 1.0.0
**마지막 업데이트**: 2024년 12월
**작성자**: 개발팀
**승인자**: 기술 리드
