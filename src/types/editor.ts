import { Vector3, Euler } from 'three';

// 편집 모드 타입
export type Mode = 'view' | 'edit';

// 편집 도구 타입
export type Tool = 'select' | 'translate' | 'rotate' | 'scale' | 'delete' | 'duplicate';

// 압축된 상태 타입
export interface CompressedState {
  items: {
    id: string;
    pos: number[];
    rot: number[];
    scl: number[];
    locked: boolean;
  }[];
  timestamp: number;
  description: string;
}

// 가구 아이템 타입 (기존 FurnitureItem 확장)
export interface PlacedItem {
  id: string;
  name: string;
  modelPath: string;
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
  footprint: {
    width: number;
    depth: number;
    height: number;
  };
  // 벽 부착 정보 (벽 전용 객체에서 사용)
  mount?: {
    type: 'wall';
    side: 'minX' | 'maxX' | 'minZ' | 'maxZ'; // 어느 벽면인지
    u: number;       // 벽 길이 방향 위치 (로컬 1D)
    height: number;  // 바닥에서 높이(Y)
    offset?: number; // 벽으로부터 추가 오프셋(기본 0)
  };
  metadata?: {
    category: string;
    brand?: string;
    price?: number;
    description?: string;
    furnitureId?: string;
  };
  isLocked?: boolean; // 객체 고정 여부
  snapSettings?: {
    gridEnabled: boolean;
    rotationSnapEnabled: boolean;
    rotationSnapAngle: number;
    gridSize: number;
    gridDivisions: number;
  }; // 객체 고정 시의 스냅 설정 저장
}

// 그리드 설정 타입
export interface GridSettings {
  enabled: boolean;
  size: number;
  divisions: number;
  color: string;
}

// 회전 스냅 설정 타입
export interface RotationSnapSettings {
  enabled: boolean;
  angle: number; // 도 단위
}

// 스냅 강도 설정 타입
export interface SnapStrengthSettings {
  translation: number; // 그리드 스냅 강도 (0.0 ~ 2.0)
  rotation: number;    // 회전 스냅 강도 (0.0 ~ 2.0)
  enabled: boolean;    // 스냅 강도 조절 활성화 여부
}

// 편집 히스토리 타입 - 압축된 상태와 일반 상태 모두 지원
export interface EditHistory {
  past: (PlacedItem[] | CompressedState)[];
  present: PlacedItem[] | CompressedState;
  future: (PlacedItem[] | CompressedState)[];
}

// 편집 상태 타입
export interface EditorState {
  // 기본 상태
  mode: Mode;
  tool: Tool;

  // 가구 관리
  placedItems: PlacedItem[];
  selectedItemId: string | null;

  // 그리드 및 스냅 설정
  grid: GridSettings;
  rotationSnap: RotationSnapSettings;
  snapStrength: SnapStrengthSettings;

  // 히스토리 관리
  history: EditHistory;

  // UI 상태
  isDragging: boolean;
  draggingItemId?: string | null; // 현재 드래그 중인 아이템 ID (단일 드래그 보장)
  showGrid: boolean;
  showBoundingBoxes: boolean;

  // 카테고리 선택
  selectedCategory: string | 'all';

  // 자동 고정 설정
  autoLock: {
    enabled: boolean;
    delay: number; // 고정 지연 시간 (밀리초)
  };

  // 스크롤 락 설정 (모바일 편집모드용)
  scrollLockEnabled: boolean;

  // 바닥 텍스처 설정
  currentFloorTexture: string; // 현재 적용된 바닥 텍스처 경로

  // 벽 텍스처 설정
  currentWallTexture: string; // 현재 적용된 벽 텍스처 경로
}

// 편집 액션 타입
export interface EditorActions {
  // 모드 및 도구 변경
  setMode: (mode: Mode) => void;
  setTool: (tool: Tool) => void;

  // 가구 관리
  addItem: (item: PlacedItem) => void;
  updateItem: (id: string, updates: Partial<PlacedItem>) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  selectItem: (id: string | null) => void;
  clearSelection: () => void;
  lockItem: (id: string) => void;
  unlockItem: (id: string) => void;

  // 카테고리 선택
  setSelectedCategory: (category: string | 'all') => void;

  // 그리드 설정
  setGridSettings: (settings: Partial<GridSettings>) => void;
  setRotationSnapSettings: (settings: Partial<RotationSnapSettings>) => void;

  // 스냅 설정 토글
  toggleGridSnap: () => void;
  toggleRotationSnap: () => void;

  // 스냅 강도 조절
  setSnapStrength: (settings: Partial<SnapStrengthSettings>) => void;
  toggleSnapStrength: () => void;

  // 빠른 도구 전환
  cycleTool: () => void;

  // 스냅 설정 저장 및 복원
  saveSnapSettings: () => void;
  loadSnapSettings: () => void;

  // 히스토리 관리
  captureHistory: (description?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // UI 상태
  setDragging: (isDragging: boolean) => void;
  beginDraggingItem: (id: string) => boolean; // 성공 시 true (락 획득)
  endDraggingItem: (id: string) => void;      // 본인이면 해제
  toggleGrid: () => void;
  toggleBoundingBoxes: () => void;

  // 전체 상태 리셋
  reset: () => void;
  clearAllItems: () => void;

  // 룸 상태 저장 및 불러오기
  saveCurrentState: () => void;
  loadSavedState: () => void;
  hasSavedState: () => boolean;

  // 압축된 상태 복원
  restoreFromCompressedState: (compressedState: CompressedState) => PlacedItem[];

  // 자동 고정 설정
  toggleAutoLock: () => void;
  setAutoLockDelay: (delay: number) => void;

  // 🗄️ 레이아웃 저장 및 불러오기
  saveLayout: (name: string, description?: string, tags?: string[]) => string;
  loadLayout: (layoutId: string) => PlacedItem[];
  getAllLayouts: () => any[];
  deleteLayout: (layoutId: string) => boolean;

  // 🔄 자동 저장 관련
  loadAutoSave: () => PlacedItem[] | null;
  triggerAutoSave: () => void;

  // 📊 저장소 관리
  getStorageUsage: () => { used: number; total: number; percentage: number };
  cleanupStorage: () => { removed: number; freed: number };

  // 🔒 스크롤 락 관리 (모바일 편집모드용)
  toggleScrollLock: () => void;
  setScrollLockEnabled: (enabled: boolean) => void;

  // 바닥 텍스처 관리
  setFloorTexture: (texturePath: string) => void;

  // 벽 텍스처 관리
  setWallTexture: (texturePath: string) => void;
}

// 편집 스토어 타입
export type EditorStore = EditorState & EditorActions;
