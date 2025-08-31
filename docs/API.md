# API 문서

## 개요

이 문서는 가구 라이브러리 UI 리팩토링 프로젝트의 주요 API와 타입 정의를 설명합니다.

## 핵심 타입 정의

### Editor Types

#### PlacedItem
```typescript
interface PlacedItem {
  id: string;
  name: string;
  category: string;
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
  isLocked: boolean;
  isSelected: boolean;
}
```

#### EditorState
```typescript
interface EditorState {
  items: PlacedItem[];
  selectedItemId: string | null;
  isEditMode: boolean;
  grid: GridSettings;
  camera: CameraSettings;
}
```

#### GridSettings
```typescript
interface GridSettings {
  enabled: boolean;
  size: number;
  divisions: number;
  snapEnabled: boolean;
}
```

## Store API

### EditorStore

#### 주요 메서드

##### addItem(item: PlacedItem)
- 새로운 가구 아이템을 씬에 추가
- 자동으로 고유 ID 생성
- 기본 위치 및 회전값 설정

##### updateItem(id: string, updates: Partial<PlacedItem>)
- 기존 아이템의 속성 업데이트
- 위치, 회전, 크기, 잠금 상태 등 변경 가능

##### removeItem(id: string)
- 지정된 ID의 아이템 제거
- 메모리 정리 및 상태 업데이트

##### selectItem(id: string | null)
- 아이템 선택 상태 변경
- 다중 선택 지원

##### toggleEditMode()
- 편집 모드 전환
- 그리드 스냅, 카메라 컨트롤 등 활성화/비활성화

#### 상태 구독
```typescript
const { items, selectedItemId, isEditMode } = useEditorStore();
```

## 컴포넌트 API

### DraggableFurniture

#### Props
```typescript
interface DraggableFurnitureProps {
  item: PlacedItem;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PlacedItem>) => void;
}
```

#### 주요 기능
- 3D 모델 로딩 및 렌더링
- 드래그 앤 드롭 인터랙션
- 그리드 스냅 지원
- 메모리 관리 (dispose)

### Real3DRoom

#### Props
```typescript
interface Real3DRoomProps {
  items: PlacedItem[];
  onItemUpdate: (id: string, updates: Partial<PlacedItem>) => void;
  onItemSelect: (id: string) => void;
}
```

#### 주요 기능
- 3D 씬 렌더링
- 카메라 컨트롤
- 조명 및 그림자 설정
- 성능 최적화

### FurnitureCatalog

#### Props
```typescript
interface FurnitureCatalogProps {
  onItemSelect: (item: FurnitureItem) => void;
  category?: string;
}
```

#### 주요 기능
- 가구 카테고리별 분류
- 이미지 lazy loading
- 검색 및 필터링
- 반응형 레이아웃

## 유틸리티 API

### ModelLoader

#### 주요 함수

##### createFurnitureModel(modelPath: string)
- GLB/GLTF 모델 파일 로딩
- 자동 스케일링 및 최적화
- 에러 처리 및 fallback

##### createFallbackModel()
- 모델 로딩 실패 시 기본 박스 모델 생성
- 디버깅 및 개발 지원

### StorageManager

#### 주요 함수

##### saveRoomLayout(layout: RoomLayout)
- 룸 레이아웃을 로컬 스토리지에 저장
- 압축 및 최적화

##### loadRoomLayout(): RoomLayout | null
- 저장된 레이아웃 로드
- 버전 호환성 검사

## 성능 최적화 API

### usePerformanceOptimization

#### 주요 기능
- 프레임 레이트 모니터링
- 메모리 사용량 추적
- 자동 품질 조정
- 성능 경고 시스템

## 에러 처리

### ErrorBoundary
- React 컴포넌트 에러 캐치
- 사용자 친화적 에러 메시지
- 개발자 디버깅 정보 제공

### ErrorHandler
- 에러 로깅 및 분석
- 사용자 피드백 수집
- 자동 복구 시도

## 마이그레이션 가이드

### v1.0 → v2.0
- `PlacedItem` 인터페이스에 `isLocked` 속성 추가
- 그리드 설정 API 변경
- 카메라 컨트롤 개선

### v2.0 → v2.1
- 성능 최적화 API 추가
- 메모리 관리 개선
- TypeScript strict mode 활성화

## 참고 자료

- [Three.js 공식 문서](https://threejs.org/docs/)
- [React Three Fiber 문서](https://docs.pmnd.rs/react-three-fiber/)
- [Zustand 상태 관리](https://github.com/pmndrs/zustand)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
