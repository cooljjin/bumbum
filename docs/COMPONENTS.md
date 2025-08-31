# 컴포넌트 사용법 가이드

## 개요

이 문서는 가구 라이브러리 UI 리팩토링 프로젝트의 주요 컴포넌트들의 사용법과 예제 코드를 설명합니다.

## 핵심 컴포넌트

### 1. Real3DRoom

3D 룸 렌더링을 담당하는 메인 컴포넌트입니다.

#### 기본 사용법
```tsx
import { Real3DRoom } from '../components/Real3DRoom';

function RoomEditor() {
  const [items, setItems] = useState<PlacedItem[]>([]);
  
  const handleItemUpdate = (id: string, updates: Partial<PlacedItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };
  
  const handleItemSelect = (id: string) => {
    // 아이템 선택 로직
  };
  
  return (
    <Real3DRoom
      items={items}
      onItemUpdate={handleItemUpdate}
      onItemSelect={handleItemSelect}
    />
  );
}
```

#### 주요 Props
- `items`: 배치된 가구 아이템 배열
- `onItemUpdate`: 아이템 업데이트 콜백
- `onItemSelect`: 아이템 선택 콜백

#### 고급 설정
```tsx
<Real3DRoom
  items={items}
  onItemUpdate={handleItemUpdate}
  onItemSelect={handleItemSelect}
  showGrid={true}
  showAxes={false}
  enableShadows={true}
  performanceMode="balanced"
/>
```

### 2. DraggableFurniture

개별 가구 아이템의 3D 렌더링과 인터랙션을 담당합니다.

#### 기본 사용법
```tsx
import { DraggableFurniture } from '../components/DraggableFurniture';

function FurnitureRenderer({ item, isSelected, isEditMode }) {
  const handleSelect = (id: string) => {
    // 선택 로직
  };
  
  const handleUpdate = (id: string, updates: Partial<PlacedItem>) => {
    // 업데이트 로직
  };
  
  return (
    <DraggableFurniture
      item={item}
      isSelected={isSelected}
      isEditMode={isEditMode}
      onSelect={handleSelect}
      onUpdate={handleUpdate}
    />
  );
}
```

#### 주요 기능
- **드래그 앤 드롭**: 마우스로 가구 이동
- **그리드 스냅**: 정확한 위치 배치
- **회전 조작**: 마우스 휠로 회전
- **메모리 관리**: 자동 리소스 정리

#### 커스터마이징
```tsx
<DraggableFurniture
  item={item}
  isSelected={isSelected}
  isEditMode={isEditMode}
  onSelect={handleSelect}
  onUpdate={handleUpdate}
  showBoundingBox={true}
  enableSnap={true}
  snapGrid={0.5}
/>
```

### 3. FurnitureCatalog

가구 카탈로그를 표시하는 컴포넌트입니다.

#### 기본 사용법
```tsx
import { FurnitureCatalog } from '../components/FurnitureCatalog';

function CatalogPanel() {
  const handleItemSelect = (item: FurnitureItem) => {
    // 가구 선택 시 처리
    console.log('Selected furniture:', item);
  };
  
  return (
    <FurnitureCatalog
      onItemSelect={handleItemSelect}
      category="chairs"
    />
  );
}
```

#### 카테고리별 필터링
```tsx
// 모든 카테고리 표시
<FurnitureCatalog onItemSelect={handleItemSelect} />

// 특정 카테고리만 표시
<FurnitureCatalog 
  onItemSelect={handleItemSelect} 
  category="tables" 
/>

// 여러 카테고리 표시
<FurnitureCatalog 
  onItemSelect={handleItemSelect} 
  category={['chairs', 'tables', 'storage']} 
/>
```

#### 검색 기능
```tsx
<FurnitureCatalog
  onItemSelect={handleItemSelect}
  searchQuery="modern chair"
  showFavorites={true}
  sortBy="name"
/>
```

### 4. RoomEditor

전체 룸 에디터를 관리하는 메인 컴포넌트입니다.

#### 기본 사용법
```tsx
import { RoomEditor } from '../components/RoomEditor';

function App() {
  return (
    <div className="app">
      <RoomEditor />
    </div>
  );
}
```

#### 커스텀 설정
```tsx
<RoomEditor
  initialLayout="modern-living-room"
  enableAutoSave={true}
  showToolbar={true}
  showGrid={true}
  defaultCameraPosition={[0, 5, 10]}
/>
```

### 5. GridSystem

그리드 시스템을 관리하는 컴포넌트입니다.

#### 기본 사용법
```tsx
import { GridSystem } from '../components/GridSystem';

function GridController() {
  const [gridSettings, setGridSettings] = useState({
    enabled: true,
    size: 10,
    divisions: 20,
    snapEnabled: true
  });
  
  return (
    <GridSystem
      settings={gridSettings}
      onSettingsChange={setGridSettings}
    />
  );
}
```

#### 그리드 설정
```tsx
const gridSettings = {
  enabled: true,        // 그리드 활성화
  size: 10,            // 그리드 크기 (미터)
  divisions: 20,       // 그리드 분할 수
  snapEnabled: true,   // 스냅 기능 활성화
  snapThreshold: 0.1,  // 스냅 임계값
  showLabels: true,    // 축 라벨 표시
  color: '#666666'     // 그리드 색상
};
```

### 6. ErrorBoundary

에러 처리를 담당하는 컴포넌트입니다.

#### 기본 사용법
```tsx
import { ErrorBoundary } from '../components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <RoomEditor />
    </ErrorBoundary>
  );
}
```

#### 커스텀 에러 처리
```tsx
<ErrorBoundary
  fallback={<CustomErrorComponent />}
  onError={(error, errorInfo) => {
    console.error('Error caught:', error);
    // 에러 로깅 또는 분석
  }}
  resetKeys={['roomId']}
>
  <RoomEditor />
</ErrorBoundary>
```

## 컴포넌트 조합 예제

### 기본 룸 에디터 구성
```tsx
function BasicRoomEditor() {
  const [items, setItems] = useState<PlacedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  return (
    <div className="room-editor">
      {/* 툴바 */}
      <EditToolbar
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onSave={() => saveRoom(items)}
        onLoad={() => loadRoom()}
      />
      
      {/* 3D 룸 */}
      <div className="room-view">
        <Real3DRoom
          items={items}
          onItemUpdate={(id, updates) => {
            setItems(prev => prev.map(item => 
              item.id === id ? { ...item, ...updates } : item
            ));
          }}
          onItemSelect={setSelectedItem}
        />
      </div>
      
      {/* 가구 카탈로그 */}
      <FurnitureCatalog
        onItemSelect={(furniture) => {
          const newItem: PlacedItem = {
            id: generateId(),
            name: furniture.name,
            category: furniture.category,
            position: new Vector3(0, 0, 0),
            rotation: new Euler(0, 0, 0),
            scale: new Vector3(1, 1, 1),
            isLocked: false,
            isSelected: false
          };
          setItems(prev => [...prev, newItem]);
        }}
      />
    </div>
  );
}
```

### 고급 룸 에디터 구성
```tsx
function AdvancedRoomEditor() {
  const [roomState, setRoomState] = useState({
    items: [],
    selectedItem: null,
    isEditMode: false,
    gridSettings: {
      enabled: true,
      size: 10,
      divisions: 20,
      snapEnabled: true
    },
    cameraSettings: {
      position: [0, 5, 10],
      fov: 75,
      near: 0.1,
      far: 1000
    }
  });
  
  return (
    <div className="advanced-room-editor">
      {/* 헤더 */}
      <EditorHeader
        title="Modern Living Room"
        onSave={() => saveRoom(roomState)}
        onExport={() => exportRoom(roomState)}
      />
      
      {/* 메인 에디터 */}
      <div className="editor-main">
        {/* 3D 뷰 */}
        <div className="editor-3d-view">
          <Real3DRoom
            items={roomState.items}
            onItemUpdate={handleItemUpdate}
            onItemSelect={handleItemSelect}
            cameraSettings={roomState.cameraSettings}
          />
        </div>
        
        {/* 사이드 패널 */}
        <div className="editor-side-panel">
          <FurnitureCatalog
            onItemSelect={handleFurnitureSelect}
            category={roomState.selectedCategory}
          />
          
          <PropertiesPanel
            selectedItem={roomState.selectedItem}
            onUpdate={handleItemUpdate}
          />
        </div>
      </div>
      
      {/* 하단 패널 */}
      <div className="editor-bottom-panel">
        <GridSystem
          settings={roomState.gridSettings}
          onSettingsChange={handleGridSettingsChange}
        />
        
        <PerformanceMonitor />
      </div>
    </div>
  );
}
```

## 스타일링 가이드

### CSS 클래스 네이밍
```css
/* 컴포넌트별 클래스 */
.room-editor { }
.room-editor__header { }
.room-editor__main { }
.room-editor__sidebar { }

/* 상태별 클래스 */
.room-editor--edit-mode { }
.room-editor--view-mode { }

/* 반응형 클래스 */
.room-editor--mobile { }
.room-editor--tablet { }
.room-editor--desktop { }
```

### 테마 시스템
```tsx
const theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '3rem'
  },
  breakpoints: {
    mobile: '576px',
    tablet: '768px',
    desktop: '992px',
    large: '1200px'
  }
};
```

## 성능 최적화 팁

### 1. 컴포넌트 메모이제이션
```tsx
const MemoizedFurniture = React.memo(DraggableFurniture);

// 사용 시
<MemoizedFurniture
  key={item.id}
  item={item}
  isSelected={isSelected}
  isEditMode={isEditMode}
  onSelect={handleSelect}
  onUpdate={handleUpdate}
/>
```

### 2. 이벤트 핸들러 최적화
```tsx
const handleItemUpdate = useCallback((id: string, updates: Partial<PlacedItem>) => {
  setItems(prev => prev.map(item => 
    item.id === id ? { ...item, ...updates } : item
  ));
}, []);

const handleItemSelect = useCallback((id: string) => {
  setSelectedItem(id);
}, []);
```

### 3. 가상화 (대량 아이템 처리)
```tsx
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
    >
      {Row}
    </List>
  );
}
```

## 디버깅 및 개발 도구

### 1. React DevTools
- 컴포넌트 트리 탐색
- Props 및 State 검사
- 성능 프로파일링

### 2. Three.js Inspector
```tsx
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 개발 모드에서만 활성화
if (process.env.NODE_ENV === 'development') {
  // Three.js Inspector 활성화
}
```

### 3. 성능 모니터링
```tsx
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';

function PerformanceMonitor() {
  const { fps, memoryUsage, renderTime } = usePerformanceOptimization();
  
  return (
    <div className="performance-monitor">
      <span>FPS: {fps}</span>
      <span>Memory: {memoryUsage}MB</span>
      <span>Render: {renderTime}ms</span>
    </div>
  );
}
```

## 테스트 가이드

### 1. 컴포넌트 테스트
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableFurniture } from '../components/DraggableFurniture';

test('renders furniture item correctly', () => {
  const mockItem = {
    id: '1',
    name: 'Test Chair',
    category: 'chairs',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    isLocked: false,
    isSelected: false
  };
  
  render(
    <DraggableFurniture
      item={mockItem}
      isSelected={false}
      isEditMode={true}
      onSelect={jest.fn()}
      onUpdate={jest.fn()}
    />
  );
  
  expect(screen.getByText('Test Chair')).toBeInTheDocument();
});
```

### 2. 통합 테스트
```tsx
test('can add furniture to room', async () => {
  render(<RoomEditor />);
  
  // 가구 카탈로그에서 아이템 선택
  const furnitureItem = screen.getByText('Modern Chair');
  fireEvent.click(furnitureItem);
  
  // 3D 룸에 아이템이 추가되었는지 확인
  expect(screen.getByText('Modern Chair')).toBeInTheDocument();
});
```

## 마이그레이션 가이드

### v1.0 → v2.0
1. `DraggableFurniture` 컴포넌트의 Props 인터페이스 변경
2. 그리드 시스템 API 업데이트
3. 카메라 컨트롤 개선

### v2.0 → v2.1
1. 성능 최적화 훅 추가
2. 메모리 관리 개선
3. TypeScript strict mode 활성화

## 참고 자료

- [React 공식 문서](https://reactjs.org/docs/)
- [Three.js 공식 문서](https://threejs.org/docs/)
- [React Three Fiber 문서](https://docs.pmnd.rs/react-three-fiber/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
