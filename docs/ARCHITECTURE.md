# 프로젝트 아키텍처 문서

## 개요

이 문서는 가구 라이브러리 UI 리팩토링 프로젝트의 전체 아키텍처와 설계 원칙을 설명합니다.

## 🏗️ 전체 아키텍처

### 시스템 개요

```
┌─────────────────────────────────────────────────────────────┐
│                    사용자 인터페이스 레이어                    │
├─────────────────────────────────────────────────────────────┤
│  React Components (TSX)                                    │
│  ├── Real3DRoom.tsx                                        │
│  ├── DraggableFurniture.tsx                                │
│  ├── FurnitureCatalog.tsx                                  │
│  └── ...                                                   │
├─────────────────────────────────────────────────────────────┤
│                    상태 관리 레이어                          │
├─────────────────────────────────────────────────────────────┤
│  Zustand Store                                             │
│  ├── editorStore.ts                                        │
│  └── ...                                                   │
├─────────────────────────────────────────────────────────────┤
│                    비즈니스 로직 레이어                      │
├─────────────────────────────────────────────────────────────┤
│  Custom Hooks & Utils                                      │
│  ├── usePerformanceOptimization.ts                         │
│  ├── useKeyboardShortcuts.ts                               │
│  ├── modelLoader.ts                                        │
│  └── ...                                                   │
├─────────────────────────────────────────────────────────────┤
│                    3D 렌더링 레이어                         │
├─────────────────────────────────────────────────────────────┤
│  Three.js + React Three Fiber                              │
│  ├── Scene Management                                      │
│  ├── Camera Controls                                       │
│  ├── Lighting System                                       │
│  └── Model Loading                                         │
├─────────────────────────────────────────────────────────────┤
│                    데이터 레이어                            │
├─────────────────────────────────────────────────────────────┤
│  Static Data & Local Storage                               │
│  ├── furnitureCatalog.ts                                   │
│  ├── roomTemplates.ts                                      │
│  └── storageManager.ts                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 설계 원칙

### 1. 컴포넌트 설계 원칙

#### 단일 책임 원칙 (Single Responsibility Principle)
- 각 컴포넌트는 하나의 명확한 책임만 가짐
- `Real3DRoom`: 3D 씬 렌더링만 담당
- `DraggableFurniture`: 개별 가구 인터랙션만 담당
- `FurnitureCatalog`: 가구 목록 표시만 담당

#### 관심사 분리 (Separation of Concerns)
- UI 로직과 비즈니스 로직 분리
- 상태 관리와 렌더링 로직 분리
- 3D 렌더링과 이벤트 처리 분리

#### 컴포지션 우선 (Composition over Inheritance)
- 상속보다는 컴포지션 사용
- 재사용 가능한 작은 컴포넌트 조합
- Props를 통한 유연한 구성

### 2. 상태 관리 설계

#### 중앙 집중식 상태 관리
```typescript
// src/store/editorStore.ts
interface EditorState {
  // 가구 아이템 관리
  items: PlacedItem[];
  selectedItemId: string | null;
  
  // 편집 모드 관리
  isEditMode: boolean;
  
  // 그리드 설정
  grid: GridSettings;
  
  // 카메라 설정
  camera: CameraSettings;
  
  // 성능 설정
  performance: PerformanceSettings;
}
```

#### 상태 업데이트 패턴
```typescript
// 불변성 유지
updateItem: (id: string, updates: Partial<PlacedItem>) => 
  set((state) => ({
    items: state.items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),

// 배치 업데이트
batchUpdate: (updates: Array<{ id: string; updates: Partial<PlacedItem> }>) =>
  set((state) => ({
    items: state.items.map(item => {
      const update = updates.find(u => u.id === item.id);
      return update ? { ...item, ...update.updates } : item;
    })
  }))
```

### 3. 성능 최적화 설계

#### 렌더링 최적화
```typescript
// React.memo를 사용한 컴포넌트 메모이제이션
export const DraggableFurniture = React.memo<DraggableFurnitureProps>(
  ({ item, isSelected, isEditMode, onSelect, onUpdate }) => {
    // 컴포넌트 로직
  },
  (prevProps, nextProps) => {
    // 커스텀 비교 함수
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isEditMode === nextProps.isEditMode
    );
  }
);
```

#### 메모리 관리
```typescript
// 3D 모델 리소스 정리
useEffect(() => {
  return () => {
    if (model) {
      disposeModel(model);
    }
  };
}, [model]);

// 재귀적 dispose 함수
const disposeModel = (model: Group) => {
  model.traverse((obj: any) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((material: Material) => material.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
};
```

## 🔧 기술 스택 아키텍처

### 1. 프론트엔드 프레임워크

#### Next.js 15 (App Router)
- **파일 기반 라우팅**: `app/` 디렉토리 구조
- **서버 컴포넌트**: 초기 로딩 성능 향상
- **정적 생성**: SEO 최적화
- **API 라우트**: 백엔드 API 구현

#### React 18
- **Concurrent Features**: 동시성 기능
- **Automatic Batching**: 자동 배칭
- **Suspense**: 로딩 상태 관리
- **Strict Mode**: 개발 시 엄격한 검사

### 2. 3D 그래픽스

#### Three.js
- **WebGL 기반**: 하드웨어 가속 3D 렌더링
- **씬 그래프**: 계층적 3D 객체 관리
- **머티리얼 시스템**: 다양한 렌더링 효과
- **애니메이션**: 키프레임 및 모핑 애니메이션

#### React Three Fiber
- **React 통합**: Three.js를 React 컴포넌트로 사용
- **자동 리소스 관리**: 메모리 누수 방지
- **성능 최적화**: 자동 렌더링 최적화
- **TypeScript 지원**: 타입 안정성

### 3. 상태 관리

#### Zustand
- **경량화**: 번들 크기 최소화
- **TypeScript 지원**: 완벽한 타입 안정성
- **React DevTools**: 개발자 도구 지원
- **미들웨어**: 확장 가능한 아키텍처

### 4. 스타일링

#### Tailwind CSS
- **유틸리티 퍼스트**: 빠른 개발
- **반응형 디자인**: 모바일 우선 접근법
- **커스터마이징**: 디자인 시스템 구축
- **JIT 컴파일러**: 최적화된 CSS 생성

## 📁 파일 구조 아키텍처

### 1. 디렉토리 구조 설계 원칙

#### 기능별 그룹화
```
src/
├── app/                    # Next.js App Router
│   ├── (routes)/          # 라우트 그룹
│   ├── api/               # API 엔드포인트
│   └── globals.css        # 전역 스타일
├── components/             # React 컴포넌트
│   ├── ui/                # 기본 UI 컴포넌트
│   ├── furniture/         # 가구 관련 컴포넌트
│   ├── room/              # 룸 관련 컴포넌트
│   └── layout/            # 레이아웃 컴포넌트
├── hooks/                  # 커스텀 훅
│   ├── performance/        # 성능 관련 훅
│   ├── interaction/        # 인터랙션 관련 훅
│   └── data/              # 데이터 관련 훅
├── store/                  # 상태 관리
│   ├── slices/             # 상태 슬라이스
│   └── middleware/         # 미들웨어
├── utils/                  # 유틸리티 함수
│   ├── three/              # Three.js 관련
│   ├── performance/        # 성능 관련
│   └── validation/         # 검증 관련
├── types/                  # TypeScript 타입
│   ├── api/                # API 관련 타입
│   ├── components/         # 컴포넌트 관련 타입
│   └── store/              # 상태 관련 타입
└── data/                   # 정적 데이터
    ├── furniture/          # 가구 데이터
    ├── templates/          # 템플릿 데이터
    └── config/             # 설정 데이터
```

### 2. 컴포넌트 구조 설계

#### 컴포넌트 계층 구조
```
App
├── Layout
│   ├── Header
│   ├── Navigation
│   └── Footer
├── RoomEditor
│   ├── EditorToolbar
│   ├── EditorMain
│   │   ├── Real3DRoom
│   │   │   ├── Scene
│   │   │   ├── Camera
│   │   │   ├── Lighting
│   │   │   └── DraggableFurniture[]
│   │   └── SidePanel
│   │       ├── FurnitureCatalog
│   │       └── PropertiesPanel
│   └── EditorBottomPanel
│       ├── GridSystem
│       └── PerformanceMonitor
└── ErrorBoundary
```

#### 컴포넌트 간 통신
```typescript
// Props를 통한 상위 → 하위 통신
<Real3DRoom
  items={items}
  onItemUpdate={handleItemUpdate}
  onItemSelect={handleItemSelect}
/>

// 콜백을 통한 하위 → 상위 통신
const handleItemUpdate = (id: string, updates: Partial<PlacedItem>) => {
  // 상태 업데이트 로직
};

// Context를 통한 전역 상태 공유
const { items, updateItem } = useEditorStore();
```

## 🔄 데이터 플로우 아키텍처

### 1. 단방향 데이터 플로우

```
User Action → Event Handler → State Update → Re-render → UI Update
     ↓              ↓            ↓           ↓         ↓
  Click Item → onSelect() → updateState() → React → New UI
```

### 2. 상태 업데이트 플로우

```typescript
// 1. 사용자 액션
const handleItemSelect = (id: string) => {
  // 2. 상태 업데이트
  updateSelectedItem(id);
  
  // 3. 부수 효과 실행
  updateCameraPosition(id);
  updateGridSnap(id);
};

// 4. 컴포넌트 리렌더링
const selectedItem = useEditorStore(state => state.selectedItemId);
const isSelected = selectedItem === item.id;
```

### 3. 비동기 데이터 플로우

```typescript
// 1. 데이터 로딩 시작
const [isLoading, setIsLoading] = useState(false);
const [data, setData] = useState(null);

// 2. 비동기 작업 실행
useEffect(() => {
  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchData();
      setData(result);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  loadData();
}, []);
```

## 🎨 UI/UX 아키텍처

### 1. 디자인 시스템

#### 컴포넌트 라이브러리
```typescript
// 기본 UI 컴포넌트
export const Button = ({ variant, size, children, ...props }) => {
  const baseClasses = "px-4 py-2 rounded font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

#### 테마 시스템
```typescript
// 테마 컨텍스트
const ThemeContext = createContext<Theme>(defaultTheme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ ...theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 2. 반응형 디자인

#### 브레이크포인트 시스템
```typescript
// Tailwind CSS 브레이크포인트
const breakpoints = {
  sm: '640px',   // 모바일 가로
  md: '768px',   // 태블릿
  lg: '1024px',  // 데스크톱
  xl: '1280px',  // 대형 데스크톱
  '2xl': '1536px' // 초대형 데스크톱
};

// 반응형 컴포넌트
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4 
  gap-4
">
  {/* 그리드 아이템들 */}
</div>
```

#### 모바일 우선 접근법
```typescript
// 모바일 기본 스타일
const mobileStyles = "p-4 text-sm";

// 태블릿 이상에서 확장
const tabletStyles = "md:p-6 md:text-base";

// 데스크톱에서 최대 확장
const desktopStyles = "lg:p-8 lg:text-lg";
```

## 🚀 성능 아키텍처

### 1. 렌더링 최적화

#### 가상화 (Virtualization)
```typescript
// 대량 아이템 처리
import { FixedSizeList as List } from 'react-window';

function VirtualizedFurnitureList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <FurnitureItem item={items[index]} />
    </div>
  );
  
  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={60}
      overscanCount={5}
    >
      {Row}
    </List>
  );
}
```

#### 코드 스플리팅
```typescript
// 동적 임포트
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 라우트 기반 코드 스플리팅
const RoomEditor = lazy(() => import('./RoomEditor'));

// 조건부 로딩
{showEditor && (
  <Suspense fallback={<LoadingSpinner />}>
    <RoomEditor />
  </Suspense>
)}
```

### 2. 메모리 최적화

#### 3D 모델 관리
```typescript
// 모델 캐싱 시스템
const modelCache = new Map<string, Group>();

const loadModel = async (path: string): Promise<Group> => {
  if (modelCache.has(path)) {
    return modelCache.get(path)!.clone();
  }
  
  const model = await createFurnitureModel(path);
  modelCache.set(path, model);
  return model.clone();
};

// 메모리 정리
const cleanupCache = () => {
  modelCache.forEach((model, path) => {
    disposeModel(model);
  });
  modelCache.clear();
};
```

#### 이미지 최적화
```typescript
// Lazy loading
const LazyImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: '50px' }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <img
      ref={imgRef}
      src={isInView ? src : ''}
      alt={alt}
      onLoad={() => setIsLoaded(true)}
      className={`transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      {...props}
    />
  );
};
```

## 🔒 보안 아키텍처

### 1. 클라이언트 사이드 보안

#### 입력 검증
```typescript
// 타입 안전성
interface UserInput {
  name: string;
  email: string;
  age: number;
}

const validateUserInput = (input: unknown): UserInput => {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid input format');
  }
  
  const { name, email, age } = input as any;
  
  if (typeof name !== 'string' || name.length < 1) {
    throw new Error('Invalid name');
  }
  
  if (typeof email !== 'string' || !email.includes('@')) {
    throw new Error('Invalid email');
  }
  
  if (typeof age !== 'number' || age < 0 || age > 150) {
    throw new Error('Invalid age');
  }
  
  return { name, email, age };
};
```

#### XSS 방지
```typescript
// 안전한 HTML 렌더링
import DOMPurify from 'dompurify';

const SafeHTML: React.FC<{ html: string }> = ({ html }) => {
  const sanitizedHTML = DOMPurify.sanitize(html);
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      className="safe-html"
    />
  );
};
```

### 2. 데이터 보안

#### 로컬 스토리지 보안
```typescript
// 민감한 데이터 암호화
const encryptData = (data: string, key: string): string => {
  // 간단한 암호화 예시 (실제로는 더 강력한 암호화 사용)
  return btoa(data + key);
};

const decryptData = (encryptedData: string, key: string): string => {
  try {
    const decoded = atob(encryptedData);
    return decoded.replace(key, '');
  } catch {
    return '';
  }
};

// 안전한 저장
const secureStorage = {
  setItem: (key: string, value: string) => {
    const encrypted = encryptData(value, 'secret-key');
    localStorage.setItem(key, encrypted);
  },
  
  getItem: (key: string): string | null => {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    return decryptData(encrypted, 'secret-key');
  }
};
```

## 🧪 테스트 아키텍처

### 1. 테스트 피라미드

```
        E2E Tests (End-to-End)
           /           \
          /             \
         /               \
    Integration Tests   UI Tests
         \               /
          \             /
           \           /
        Unit Tests   Component Tests
```

### 2. 테스트 전략

#### 단위 테스트
```typescript
// 유틸리티 함수 테스트
describe('modelLoader', () => {
  it('should create fallback model when loading fails', () => {
    const fallbackModel = createFallbackModel();
    
    expect(fallbackModel).toBeDefined();
    expect(fallbackModel.type).toBe('Group');
    expect(fallbackModel.children.length).toBeGreaterThan(0);
  });
  
  it('should handle invalid model paths gracefully', async () => {
    await expect(createFurnitureModel('invalid/path.glb'))
      .rejects
      .toThrow('Failed to load model');
  });
});
```

#### 컴포넌트 테스트
```typescript
// 컴포넌트 렌더링 테스트
describe('DraggableFurniture', () => {
  it('renders furniture item with correct properties', () => {
    const mockItem = createMockFurnitureItem();
    
    render(
      <DraggableFurniture
        item={mockItem}
        isSelected={false}
        isEditMode={true}
        onSelect={jest.fn()}
        onUpdate={jest.fn()}
      />
    );
    
    expect(screen.getByText(mockItem.name)).toBeInTheDocument();
    expect(screen.getByTestId('furniture-item')).toHaveAttribute(
      'data-selected', 
      'false'
    );
  });
});
```

#### 통합 테스트
```typescript
// 사용자 워크플로우 테스트
describe('Room Editor Workflow', () => {
  it('allows user to add furniture to room', async () => {
    render(<RoomEditor />);
    
    // 가구 카탈로그 열기
    const catalogButton = screen.getByText('Add Furniture');
    fireEvent.click(catalogButton);
    
    // 가구 선택
    const furnitureItem = screen.getByText('Modern Chair');
    fireEvent.click(furnitureItem);
    
    // 3D 룸에 가구 추가 확인
    await waitFor(() => {
      expect(screen.getByText('Modern Chair')).toBeInTheDocument();
    });
    
    // 가구 속성 편집
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    // 위치 변경
    const positionInput = screen.getByLabelText('X Position');
    fireEvent.change(positionInput, { target: { value: '5' } });
    
    // 변경사항 저장 확인
    expect(positionInput).toHaveValue('5');
  });
});
```

## 📊 모니터링 아키텍처

### 1. 성능 모니터링

#### 프론트엔드 메트릭
```typescript
// Core Web Vitals 모니터링
const monitorCoreWebVitals = () => {
  // LCP (Largest Contentful Paint)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('LCP:', entry.startTime);
      // 분석 서비스에 전송
    }
  }).observe({ entryTypes: ['largest-contentful-paint'] });
  
  // FID (First Input Delay)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('FID:', entry.processingStart - entry.startTime);
      // 분석 서비스에 전송
    }
  }).observe({ entryTypes: ['first-input'] });
  
  // CLS (Cumulative Layout Shift)
  new PerformanceObserver((list) => {
    let cls = 0;
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        cls += entry.value;
      }
    }
    console.log('CLS:', cls);
    // 분석 서비스에 전송
  }).observe({ entryTypes: ['layout-shift'] });
};
```

#### 3D 렌더링 성능
```typescript
// FPS 모니터링
const useFPSMonitor = () => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  
  useEffect(() => {
    const countFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime.current >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)));
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      requestAnimationFrame(countFPS);
    };
    
    countFPS();
  }, []);
  
  return fps;
};
```

### 2. 에러 모니터링

#### 에러 바운더리
```typescript
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅
    console.error('Error caught by boundary:', error, errorInfo);
    
    // 에러 분석 서비스에 전송
    logError({
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={() => this.setState({ hasError: false })}
        />
      );
    }
    
    return this.props.children;
  }
}
```

## 🔄 배포 아키텍처

### 1. CI/CD 파이프라인

#### GitHub Actions 워크플로우
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      # 배포 스크립트 실행
      - run: npm run deploy
```

### 2. 환경별 설정

#### 환경 변수 관리
```typescript
// 환경별 설정
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    enableDebug: true,
    logLevel: 'debug'
  },
  staging: {
    apiUrl: 'https://staging-api.yourdomain.com',
    enableDebug: true,
    logLevel: 'info'
  },
  production: {
    apiUrl: 'https://api.yourdomain.com',
    enableDebug: false,
    logLevel: 'error'
  }
};

const currentConfig = config[process.env.NODE_ENV as keyof typeof config] || config.development;
```

## 🔮 향후 아키텍처 계획

### 1. 단기 계획 (1-3개월)

#### 마이크로프론트엔드 도입
- 모듈형 컴포넌트 시스템
- 독립적인 배포 파이프라인
- 팀별 독립 개발 환경

#### 상태 관리 개선
- Redux Toolkit 도입 검토
- 상태 정규화 및 최적화
- 실시간 상태 동기화

### 2. 중기 계획 (3-6개월)

#### 서버 사이드 렌더링 강화
- Next.js SSR 최적화
- 정적 생성 전략 개선
- 캐싱 전략 수립

#### 성능 모니터링 강화
- APM 도구 도입
- 사용자 행동 분석
- 성능 예측 모델

### 3. 장기 계획 (6개월 이상)

#### 아키텍처 현대화
- WebAssembly 도입 검토
- WebGPU 활용
- 실시간 협업 기능

#### 확장성 개선
- 마이크로서비스 아키텍처
- 클라우드 네이티브 설계
- 글로벌 CDN 전략

## 📚 참고 자료

### 아키텍처 패턴
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

### React 아키텍처
- [React Architecture Patterns](https://react.dev/learn)
- [State Management Patterns](https://react.dev/learn/managing-state)
- [Performance Optimization](https://react.dev/learn/render-and-commit)

### 3D 웹 아키텍처
- [Three.js Best Practices](https://threejs.org/manual/)
- [WebGL Performance](https://webglfundamentals.org/webgl/lessons/webgl-performance.html)
- [3D Web Standards](https://www.khronos.org/webgl/)

---

**문서 버전**: 2.1.0  
**마지막 업데이트**: 2024년 12월  
**작성자**: 아키텍처 팀  
**검토자**: 기술 리드
