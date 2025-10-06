import { Vector3, Euler } from 'three';

/**
 * 편집 모드 타입
 * @description 뷰 모드와 편집 모드를 구분하는 타입
 */
export type Mode = 'view' | 'edit';

/**
 * 편집 도구 타입
 * @description 사용 가능한 편집 도구들을 정의하는 타입
 */
export type Tool = 'select' | 'translate' | 'rotate' | 'scale' | 'delete' | 'duplicate';

/**
 * 가구 아이템의 발자국(Footprint) 타입
 * @description 3D 공간에서 가구가 차지하는 영역의 크기를 정의
 */
export interface Footprint {
  /** 가구의 너비 (X축 방향) */
  width: number;
  /** 가구의 깊이 (Z축 방향) */
  depth: number;
  /** 가구의 높이 (Y축 방향) */
  height: number;
}

/**
 * 룸의 경계 정보 타입
 * @description 3D 룸의 크기와 벽 두께를 정의
 */
export interface RoomBounds {
  /** 룸의 너비 (X축 방향) */
  width: number;
  /** 룸의 깊이 (Z축 방향) */
  depth: number;
  /** 룸의 높이 (Y축 방향) */
  height: number;
  /** 벽의 두께 */
  wallThickness: number;
}

/**
 * 벽 부착 정보 타입
 * @description 가구가 벽에 부착될 때의 위치와 방향 정보
 */
export interface Mount {
  /** 부착 타입 (현재는 벽만 지원) */
  type: 'wall';
  /** 부착할 벽면 ('minX' | 'maxX' | 'minZ' | 'maxZ') */
  side: 'minX' | 'maxX' | 'minZ' | 'maxZ';
  /** 벽 길이 방향 위치 (로컬 1D 좌표, 0~1 범위) */
  u: number;
  /** 바닥에서의 높이 (Y축 좌표) */
  height: number;
  /** 벽으로부터의 추가 오프셋 (기본값: 0) */
  offset?: number;
}

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

/**
 * 배치된 가구 아이템 타입
 * @description 3D 공간에 배치된 가구의 모든 정보를 포함하는 핵심 타입
 */
export interface PlacedItem {
  /** 고유 식별자 */
  id: string;
  /** 가구 이름 */
  name: string;
  /** 3D 모델 파일 경로 */
  modelPath: string;
  /** 3D 공간에서의 위치 (Vector3) */
  position: Vector3;
  /** 3D 공간에서의 회전 (Euler) */
  rotation: Euler;
  /** 3D 공간에서의 크기 (Vector3) */
  scale: Vector3;
  /** 가구가 차지하는 영역의 크기 */
  footprint: Footprint;
  /** 벽 부착 정보 (벽 전용 객체에서 사용) */
  mount?: Mount;
  /** 가구 메타데이터 */
  metadata?: {
    /** 카테고리 */
    category: string;
    /** 브랜드 */
    brand?: string;
    /** 가격 */
    price?: number;
    /** 설명 */
    description?: string;
    /** 가구 ID */
    furnitureId?: string;
  };
  /** 객체 고정 여부 */
  isLocked?: boolean;
  /** 스냅 설정 (객체 고정 시 저장) */
  snapSettings?: {
    /** 그리드 스냅 활성화 */
    gridEnabled: boolean;
    /** 회전 스냅 활성화 */
    rotationSnapEnabled: boolean;
    /** 회전 스냅 각도 */
    rotationSnapAngle: number;
    /** 그리드 크기 */
    gridSize: number;
    /** 그리드 분할 수 */
    gridDivisions: number;
  };
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

/**
 * 성능 옵션 타입
 * @description 3D 렌더링 성능을 제어하는 옵션들
 */
export interface PerformanceOptions {
  /** LOD (Level of Detail) 활성화 여부 */
  enableLOD: boolean;
  /** 프러스텀 컬링 활성화 여부 */
  enableFrustumCulling: boolean;
  /** 그림자 품질 설정 */
  shadowQuality: 'low' | 'medium' | 'high';
  /** 텍스처 압축 활성화 여부 */
  enableTextureCompression: boolean;
  /** 애니메이션 프레임 제한 */
  maxFPS: number;
  /** 메모리 사용량 제한 (MB) */
  memoryLimit: number;
}

/**
 * 룸 경계 컨텍스트 타입
 * @description Room 컴포넌트에서 제공하는 경계 정보
 */
export interface RoomBoundsContext {
  /** 룸의 경계 정보 */
  bounds: RoomBounds;
  /** 경계 정보 업데이트 함수 */
  updateBounds: (newBounds: RoomBounds) => void;
  /** 가구가 룸 내부에 있는지 확인하는 함수 */
  isItemInBounds: (item: PlacedItem) => boolean;
}

// 편집 스토어 타입
export type EditorStore = EditorState & EditorActions;

/**
 * PlacedItem 타입 가드 함수
 * @param obj 검증할 객체
 * @returns PlacedItem인지 여부
 */
export function isPlacedItem(obj: any): obj is PlacedItem {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.modelPath === 'string' &&
    obj.position &&
    obj.rotation &&
    obj.scale &&
    obj.footprint &&
    typeof obj.footprint.width === 'number' &&
    typeof obj.footprint.depth === 'number' &&
    typeof obj.footprint.height === 'number' &&
    !isNaN(obj.footprint.width) &&
    !isNaN(obj.footprint.depth) &&
    !isNaN(obj.footprint.height)
  );
}

/**
 * PlacedItem 유효성 검증 함수
 * @param item 검증할 PlacedItem
 * @returns 유효성 검증 결과
 */
export function validatePlacedItem(item: PlacedItem): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 기본 필수 필드 검증
  if (!item.id || typeof item.id !== 'string') {
    errors.push('id는 필수 문자열이어야 합니다.');
  }

  if (!item.name || typeof item.name !== 'string') {
    errors.push('name은 필수 문자열이어야 합니다.');
  }

  if (!item.modelPath || typeof item.modelPath !== 'string') {
    errors.push('modelPath는 필수 문자열이어야 합니다.');
  }

  // Vector3 검증
  if (!item.position || !Array.isArray(item.position) || item.position.length !== 3) {
    errors.push('position은 3개 요소의 배열이어야 합니다.');
  } else {
    const [x, y, z] = item.position;
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      errors.push('position의 모든 요소는 유효한 숫자여야 합니다.');
    }
  }

  // Euler 검증
  if (!item.rotation || !Array.isArray(item.rotation) || item.rotation.length !== 3) {
    errors.push('rotation은 3개 요소의 배열이어야 합니다.');
  } else {
    const [x, y, z] = item.rotation;
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      errors.push('rotation의 모든 요소는 유효한 숫자여야 합니다.');
    }
  }

  // Vector3 검증
  if (!item.scale || !Array.isArray(item.scale) || item.scale.length !== 3) {
    errors.push('scale은 3개 요소의 배열이어야 합니다.');
  } else {
    const [x, y, z] = item.scale;
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      errors.push('scale의 모든 요소는 유효한 숫자여야 합니다.');
    }
  }

  // Footprint 검증
  if (!item.footprint || typeof item.footprint !== 'object') {
    errors.push('footprint는 객체여야 합니다.');
  } else {
    const { width, depth, height } = item.footprint;
    if (typeof width !== 'number' || isNaN(width) || width <= 0) {
      errors.push('footprint.width는 양수여야 합니다.');
    }
    if (typeof depth !== 'number' || isNaN(depth) || depth <= 0) {
      errors.push('footprint.depth는 양수여야 합니다.');
    }
    if (typeof height !== 'number' || isNaN(height) || height <= 0) {
      errors.push('footprint.height는 양수여야 합니다.');
    }
  }

  // Mount 검증 (선택적)
  if (item.mount) {
    if (item.mount.type !== 'wall') {
      errors.push('mount.type은 "wall"이어야 합니다.');
    }
    if (!['minX', 'maxX', 'minZ', 'maxZ'].includes(item.mount.side)) {
      errors.push('mount.side는 유효한 벽면이어야 합니다.');
    }
    if (typeof item.mount.u !== 'number' || isNaN(item.mount.u) || item.mount.u < 0 || item.mount.u > 1) {
      errors.push('mount.u는 0과 1 사이의 숫자여야 합니다.');
    }
    if (typeof item.mount.height !== 'number' || isNaN(item.mount.height) || item.mount.height < 0) {
      errors.push('mount.height는 0 이상의 숫자여야 합니다.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
