# 개발자 온보딩 가이드

## 개요

이 문서는 가구 라이브러리 UI 리팩토링 프로젝트에 새로 참여하는 개발자들을 위한 온보딩 가이드입니다.

## 🚀 빠른 시작

### 1. 개발 환경 설정

#### 필수 요구사항
- **Node.js**: 18.0.0 이상
- **npm**: 9.0.0 이상
- **Git**: 2.30.0 이상

#### 권장 개발 도구
- **VS Code**: 프로젝트에서 권장하는 에디터
- **React DevTools**: 브라우저 확장 프로그램
- **Three.js Inspector**: 3D 씬 디버깅 도구

### 2. 프로젝트 클론 및 설치

```bash
# 프로젝트 클론
git clone https://github.com/your-org/bumbum-project.git
cd bumbum-project

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

### 3. 첫 번째 실행

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 확인
open http://localhost:3000
```

## 🏗️ 프로젝트 구조

### 디렉토리 구조
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx          # 메인 페이지
│   ├── room-editor/      # 룸 에디터 페이지
│   └── globals.css       # 전역 스타일
├── components/            # React 컴포넌트
│   ├── Real3DRoom.tsx    # 3D 룸 렌더링
│   ├── DraggableFurniture.tsx # 가구 인터랙션
│   ├── FurnitureCatalog.tsx   # 가구 카탈로그
│   └── ...               # 기타 컴포넌트
├── store/                 # 상태 관리
│   └── editorStore.ts    # Zustand 스토어
├── hooks/                 # 커스텀 훅
│   ├── usePerformanceOptimization.ts
│   └── useKeyboardShortcuts.ts
├── utils/                 # 유틸리티 함수
│   ├── modelLoader.ts    # 3D 모델 로딩
│   └── errorHandler.ts   # 에러 처리
├── types/                 # TypeScript 타입 정의
│   ├── editor.ts         # 에디터 관련 타입
│   └── furniture.ts      # 가구 관련 타입
└── data/                  # 정적 데이터
    ├── furnitureCatalog.ts
    └── roomTemplates.ts
```

### 핵심 파일 설명

#### 1. `src/app/page.tsx`
- 애플리케이션의 진입점
- 라우팅 및 레이아웃 관리

#### 2. `src/components/Real3DRoom.tsx`
- 3D 씬의 메인 컨테이너
- Three.js 렌더링 및 카메라 제어

#### 3. `src/store/editorStore.ts`
- Zustand 기반 상태 관리
- 가구 아이템, 선택 상태, 편집 모드 등

#### 4. `src/types/editor.ts`
- TypeScript 타입 정의
- 인터페이스 및 타입 안정성

## 🛠️ 개발 워크플로우

### 1. 기능 개발 프로세스

```bash
# 1. 새로운 브랜치 생성
git checkout -b feature/new-feature

# 2. 개발 및 테스트
npm run dev
npm run test

# 3. 커밋 및 푸시
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin feature/new-feature

# 4. Pull Request 생성
# GitHub에서 PR 생성 및 리뷰 요청
```

### 2. 코드 품질 관리

#### ESLint 실행
```bash
# 코드 품질 검사
npm run lint

# 자동 수정
npm run lint:fix
```

#### TypeScript 타입 검사
```bash
# 타입 검사
npm run type-check

# 빌드 테스트
npm run build
```

### 3. 테스트 작성

#### 컴포넌트 테스트
```tsx
// src/components/__tests__/DraggableFurniture.test.tsx
import { render, screen } from '@testing-library/react';
import { DraggableFurniture } from '../DraggableFurniture';

describe('DraggableFurniture', () => {
  it('renders furniture item correctly', () => {
    const mockItem = {
      id: '1',
      name: 'Test Chair',
      // ... 기타 속성
    };
    
    render(<DraggableFurniture item={mockItem} />);
    expect(screen.getByText('Test Chair')).toBeInTheDocument();
  });
});
```

#### 통합 테스트
```tsx
// src/__tests__/integration/room-editor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import RoomEditor from '../../app/room-editor/page';

describe('RoomEditor Integration', () => {
  it('can add furniture to room', async () => {
    render(<RoomEditor />);
    
    // 가구 카탈로그에서 아이템 선택
    const furnitureItem = screen.getByText('Modern Chair');
    fireEvent.click(furnitureItem);
    
    // 3D 룸에 아이템이 추가되었는지 확인
    expect(screen.getByText('Modern Chair')).toBeInTheDocument();
  });
});
```

## 🔧 개발 도구 및 설정

### 1. VS Code 설정

#### 권장 확장 프로그램
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### 작업 영역 설정
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.suggest.autoImports": true
}
```

### 2. 디버깅 설정

#### 브라우저 디버깅
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/next/dist/bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### 3. 성능 모니터링

#### 개발 모드에서 성능 추적
```tsx
// src/components/PerformanceMonitor.tsx
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';

export function PerformanceMonitor() {
  const { fps, memoryUsage, renderTime } = usePerformanceOptimization();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="performance-monitor">
      <span>FPS: {fps}</span>
      <span>Memory: {memoryUsage}MB</span>
      <span>Render: {renderTime}ms</span>
    </div>
  );
}
```

## 📚 학습 리소스

### 1. 필수 지식

#### React & Next.js
- [React 공식 문서](https://reactjs.org/docs/)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [React Hooks 가이드](https://reactjs.org/docs/hooks-intro.html)

#### 3D 그래픽스
- [Three.js 공식 문서](https://threejs.org/docs/)
- [React Three Fiber 문서](https://docs.pmnd.rs/react-three-fiber/)
- [Three.js 예제](https://threejs.org/examples/)

#### TypeScript
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [TypeScript Playground](https://www.typescriptlang.org/play)

### 2. 고급 주제

#### 상태 관리
- [Zustand 문서](https://github.com/pmndrs/zustand)
- [React 상태 관리 패턴](https://react.dev/learn/managing-state)

#### 성능 최적화
- [React 성능 최적화](https://react.dev/learn/render-and-commit)
- [Three.js 성능 팁](https://discoverthreejs.com/tips-and-tricks/)

## 🐛 문제 해결

### 1. 일반적인 문제들

#### 빌드 오류
```bash
# 의존성 문제 해결
rm -rf node_modules package-lock.json
npm install

# TypeScript 오류 해결
npm run type-check
```

#### 3D 렌더링 문제
```tsx
// Three.js 컨텍스트 확인
import { useThree } from '@react-three/fiber';

function DebugInfo() {
  const { gl, scene, camera } = useThree();
  
  console.log('WebGL Context:', gl);
  console.log('Scene:', scene);
  console.log('Camera:', camera);
  
  return null;
}
```

#### 성능 문제
```tsx
// 성능 모니터링 활성화
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';

function App() {
  const { enableMonitoring } = usePerformanceOptimization();
  
  useEffect(() => {
    enableMonitoring();
  }, []);
  
  // ... 나머지 컴포넌트
}
```

### 2. 디버깅 팁

#### React DevTools 사용
1. 브라우저에서 React DevTools 설치
2. 컴포넌트 트리 탐색
3. Props 및 State 검사
4. 성능 프로파일링

#### Three.js Inspector 사용
```tsx
// 개발 모드에서만 활성화
if (process.env.NODE_ENV === 'development') {
  import('three/examples/jsm/libs/Stats').then(({ default: Stats }) => {
    const stats = new Stats();
    document.body.appendChild(stats.dom);
    
    // 애니메이션 루프에서 stats 업데이트
    function animate() {
      stats.begin();
      // 렌더링 로직
      stats.end();
      requestAnimationFrame(animate);
    }
  });
}
```

## 📝 코딩 컨벤션

### 1. 파일 및 폴더 명명

#### 컴포넌트 파일
- **PascalCase**: `DraggableFurniture.tsx`
- **기능별 그룹화**: `components/furniture/`, `components/ui/`

#### 유틸리티 파일
- **camelCase**: `modelLoader.ts`, `errorHandler.ts`
- **기능별 접미사**: `*.util.ts`, `*.helper.ts`

### 2. 컴포넌트 작성 규칙

#### 함수형 컴포넌트
```tsx
interface ComponentProps {
  title: string;
  onAction: () => void;
}

export const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  // 훅 사용
  const [state, setState] = useState(false);
  
  // 이벤트 핸들러
  const handleClick = useCallback(() => {
    onAction();
  }, [onAction]);
  
  // 렌더링
  return (
    <div className="component">
      <h2>{title}</h2>
      <button onClick={handleClick}>Action</button>
    </div>
  );
};
```

#### 타입 정의
```tsx
// 명확한 인터페이스 정의
interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
}

// 유니온 타입 사용
type FurnitureCategory = 'chairs' | 'tables' | 'storage' | 'lighting';

// 제네릭 활용
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}
```

### 3. 스타일링 규칙

#### CSS 클래스 네이밍
```css
/* BEM 방법론 사용 */
.room-editor { }
.room-editor__header { }
.room-editor__main { }
.room-editor--edit-mode { }
.room-editor--view-mode { }
```

#### Tailwind CSS 사용
```tsx
// 일관된 스페이싱
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
    제목
  </h1>
</div>

// 반응형 디자인
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 그리드 아이템들 */}
</div>
```

## 🚀 배포 및 배포 후 관리

### 1. 배포 프로세스

#### 프로덕션 빌드
```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 확인
npm run start
```

#### 환경 변수 설정
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_VERSION=2.1.0
```

### 2. 모니터링 및 유지보수

#### 에러 추적
```tsx
// 에러 바운더리에서 에러 로깅
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 서비스에 전송
    logError(error, errorInfo);
  }
}
```

#### 성능 모니터링
```tsx
// 성능 메트릭 수집
useEffect(() => {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // 성능 데이터 수집
      collectPerformanceData(entry);
    }
  });
  
  observer.observe({ entryTypes: ['measure', 'navigation'] });
  
  return () => observer.disconnect();
}, []);
```

## 🤝 팀 협업

### 1. 코드 리뷰

#### 리뷰 체크리스트
- [ ] 코드가 요구사항을 충족하는가?
- [ ] 타입 안정성이 확보되었는가?
- [ ] 성능에 영향을 주지 않는가?
- [ ] 테스트가 작성되었는가?
- [ ] 문서화가 업데이트되었는가?

#### 리뷰 코멘트 예시
```tsx
// 좋은 예시
// TODO: 이 함수는 나중에 더 효율적인 알고리즘으로 개선 필요
function processData(data: Data[]) {
  // 현재 구현...
}

// 개선 제안
// 이 부분을 useMemo로 최적화하면 불필요한 재계산을 방지할 수 있습니다
const processedData = useMemo(() => {
  return processData(rawData);
}, [rawData]);
```

### 2. 지식 공유

#### 기술 세미나
- 주간 기술 공유 세션
- 새로운 기능 소개
- 문제 해결 사례 공유

#### 문서화
- 코드 주석 작성
- README 업데이트
- API 문서 유지보수

## 📞 지원 및 연락처

### 1. 기술 지원

#### 내부 리소스
- **팀 리드**: [이름] - [이메일]
- **시니어 개발자**: [이름] - [이메일]
- **프로젝트 매니저**: [이름] - [이메일]

#### 외부 리소스
- **GitHub Issues**: 프로젝트 버그 리포트
- **Stack Overflow**: 일반적인 기술 질문
- **공식 문서**: 각 라이브러리별 공식 문서

### 2. 학습 지원

#### 온라인 코스
- [React 공식 튜토리얼](https://react.dev/learn)
- [Three.js 기초](https://threejs.org/manual/)
- [TypeScript 기초](https://www.typescriptlang.org/docs/)

#### 책 추천
- "React: Up & Running" by Stoyan Stefanov
- "Three.js Cookbook" by Jos Dirksen
- "Programming TypeScript" by Boris Cherny

## 🎯 다음 단계

### 1. 단기 목표 (1-2주)
- [ ] 프로젝트 구조 파악
- [ ] 기본 컴포넌트 사용법 학습
- [ ] 첫 번째 기능 개발 참여

### 2. 중기 목표 (1-2개월)
- [ ] 전체 시스템 아키텍처 이해
- [ ] 성능 최적화 기법 습득
- [ ] 독립적인 기능 개발

### 3. 장기 목표 (3-6개월)
- [ ] 아키텍처 개선 제안
- [ ] 새로운 기능 설계 및 구현
- [ ] 주니어 개발자 멘토링

---

**마지막 업데이트**: 2024년 12월

**문서 버전**: 2.1.0

**작성자**: 개발팀

**문의사항**: [이메일 주소]
