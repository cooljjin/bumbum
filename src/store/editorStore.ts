import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { Vector3, Euler } from 'three';
import {
  EditorStore,
  EditorState,
  Mode,
  Tool,
  PlacedItem,
  GridSettings,
  RotationSnapSettings,
  SnapStrengthSettings,
  EditHistory,
  CompressedState
} from '../types/editor';
import { 
  storageManager,
  saveLayout as saveLayoutUtil,
  loadLayout as loadLayoutUtil,
  loadAllLayouts as loadAllLayoutsUtil,
  deleteLayout as deleteLayoutUtil,
  loadAutoSave as loadAutoSaveUtil,
  getStorageUsage as getStorageUsageUtil,
  cleanupStorage as cleanupStorageUtil
} from '../utils/storageManager';
import { isFurnitureInRoom, constrainFurnitureToRoom, clampWallMountedItem } from '../utils/roomBoundary';
import { checkCollisionWithOthers, moveToSafePosition, checkWallOverlapWithOthers, findNonOverlappingWallPosition } from '../utils/collisionDetection';

// 성능 최적화를 위한 상수
const PERFORMANCE_CONSTANTS = {
  MAX_HISTORY_SIZE: 30, // 히스토리 크기 제한 (50 → 30으로 최적화)
  BATCH_UPDATE_DELAY: 16, // 배치 업데이트 지연 시간 (60fps에 맞춤)
  MEMORY_CLEANUP_THRESHOLD: 100, // 메모리 정리 임계값
  DEBOUNCE_DELAY: 150 // 디바운스 지연 시간
} as const;

// 초기 상태 정의
const initialState: EditorState = {
  // 기본 상태
  mode: 'view',  // 기본적으로 보기 모드로 시작
  tool: 'select',

  // 가구 관리
  placedItems: [],
  selectedItemId: null,

  // 그리드 및 스냅 설정
  grid: {
    enabled: true,
    size: 10,
    divisions: 10,
    color: '#888888'
  },
  rotationSnap: {
    enabled: true,
    angle: 15
  },
  snapStrength: {
    enabled: true,
    translation: 1.0,
    rotation: 1.0
  },

  // 히스토리 관리
  history: {
    past: [],
    present: [],
    future: []
  },

  // UI 상태
  isDragging: false,
  draggingItemId: null,
  showGrid: true,
  showBoundingBoxes: false,

  // 카테고리 선택
  selectedCategory: 'all',

  // 자동 고정 설정
  autoLock: {
    enabled: true,
    delay: 1000 // 1초 후 자동 고정
  },

  // 스크롤 락 설정 (모바일 편집모드용)
  scrollLockEnabled: false,

  // 바닥 텍스처 설정
  currentFloorTexture: '/models/floor/floor_wooden.png',

  // 벽 텍스처 설정
  currentWallTexture: '/models/wall/wall_beige.png'
};

// 성능 최적화를 위한 유틸리티 함수들
const performanceUtils = {
  // 깊은 비교를 통한 불필요한 업데이트 방지
  deepEqual: (a: unknown, b: unknown): boolean => {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a == null || b == null) return a === b;
    
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, index) => performanceUtils.deepEqual(val, b[index]));
    }
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a as Record<string, unknown>);
      const keysB = Object.keys(b as Record<string, unknown>);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => performanceUtils.deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
    }
    
    return false;
  },

  // 메모리 효율적인 히스토리 압축
  compressState: (items: PlacedItem[]): CompressedState => {
    return {
      items: items.map(item => ({
        id: item.id,
        pos: [item.position.x, item.position.y, item.position.z],
        rot: [item.rotation.x, item.rotation.y, item.rotation.z],
        scl: [item.scale.x, item.scale.y, item.scale.z],
        locked: item.isLocked || false
      })),
      timestamp: Date.now(),
      description: 'state_change'
    };
  },

  // 배치 업데이트를 위한 디바운스
  debounce: <T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
  ): T => {
    let timeoutId: NodeJS.Timeout;
    return ((...args: unknown[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  }
};

// 편집 스토어 생성 (성능 최적화 적용)
export const useEditorStore = create<EditorStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // 최적화된 히스토리 캡처 함수
      captureHistory: () => {
        const { placedItems, history } = get();
        const currentState = performanceUtils.compressState(placedItems);

        // 이전 상태와 동일한지 확인하여 불필요한 히스토리 저장 방지
        if (history.present && performanceUtils.deepEqual(history.present, currentState)) {
          return;
        }

        // 메모리 최적화: 히스토리 크기 제한
        let newPast = [...history.past, history.present];
        if (newPast.length > PERFORMANCE_CONSTANTS.MAX_HISTORY_SIZE) {
          newPast = newPast.slice(-PERFORMANCE_CONSTANTS.MAX_HISTORY_SIZE);
        }

        const newHistory: EditHistory = {
          past: newPast,
          present: currentState,
          future: [] // 새로운 액션으로 인해 future는 초기화
        };

        set({ history: newHistory });
      },

      // 최적화된 압축 상태 복원 함수
      restoreFromCompressedState: (compressedState: CompressedState): PlacedItem[] => {
        const { placedItems } = get();

        return compressedState.items.map((compressedItem) => {
          const originalItem = placedItems.find(item => item.id === compressedItem.id);

          if (!originalItem) {
            // console.warn(`⚠️ 성능: 히스토리 복원 중 원본 아이템을 찾을 수 없음 - ${compressedItem.id}`);
            return null;
          }

          return {
            ...originalItem,
            position: new Vector3(...compressedItem.pos),
            rotation: new Euler(...compressedItem.rot),
            scale: new Vector3(...compressedItem.scl),
            isLocked: compressedItem.locked
          };
        }).filter(Boolean) as PlacedItem[];
      },

      // 모드 및 도구 변경 (최적화)
      setMode: (mode: Mode) => {
        const { grid, rotationSnap } = get();
        const currentMode = get().mode;

        // 동일한 모드로 변경하는 경우 불필요한 업데이트 방지
        if (currentMode === mode) return;

        if (mode === 'edit') {
          set({
            mode,
            grid: { ...grid, enabled: true },
            rotationSnap: { ...rotationSnap, enabled: true },
            scrollLockEnabled: true // 편집 모드 진입 시 스크롤 락 활성화
          });
        } else {
          set({
            mode,
            tool: mode === 'view' ? 'select' : get().tool,
            scrollLockEnabled: false // 뷰 모드 진입 시 스크롤 락 해제
          });
        }
      },

      setTool: (tool: Tool) => {
        const currentTool = get().tool;
        if (currentTool === tool) return; // 불필요한 업데이트 방지
        set({ tool });
      },

      

      // 최적화된 가구 관리 함수들
      addItem: (item: PlacedItem) => {
        const { placedItems, captureHistory } = get();
        
        // 중복 ID 체크
        if (placedItems.some(existing => existing.id === item.id)) {
          // console.warn('중복된 ID의 아이템을 추가할 수 없습니다:', item.id);
          return;
        }

        // 벽 부착 아이템은 벽 전용 클램프로 처리, 일반 아이템은 방 경계 클램프
        let validatedItem = item.mount?.type === 'wall' ? clampWallMountedItem(item) : item;
        if (!item.mount?.type) {
          if (!isFurnitureInRoom(validatedItem)) {
            validatedItem = constrainFurnitureToRoom(validatedItem);
          }
        }

        // 가구 간 충돌 검사 및 해결
        // 벽 부착 아이템은 기본 충돌 검사에서 제외(동일 벽 간 2D 충돌은 향후 추가)
        const shouldCheckCollision = validatedItem.mount?.type !== 'wall';
        const collisionCheck = shouldCheckCollision ? checkCollisionWithOthers(validatedItem, placedItems) : { hasCollision: false, collidingItems: [] };
        if (shouldCheckCollision && collisionCheck.hasCollision) {
          // console.warn(`⚠️ 성능: 가구 충돌 감지 - ${validatedItem.name || validatedItem.id}이(가) ${collisionCheck.collidingItems.length}개의 가구와 충돌`);
          
          // 충돌을 피할 수 있는 안전한 위치로 이동
          validatedItem = moveToSafePosition(validatedItem, placedItems);
          // 안전 위치가 방 경계 밖으로 나갈 수 있으므로 재클램프
          if (!isFurnitureInRoom(validatedItem)) {
            validatedItem = constrainFurnitureToRoom(validatedItem);
          }
          // console.log(`✅ 성능: 충돌 해결 - ${validatedItem.name || validatedItem.id}을(를) 안전한 위치로 이동`);
        }

        // 같은 벽면 아이템 겹침 해결
        if (validatedItem.mount?.type === 'wall') {
          const { hasOverlap } = checkWallOverlapWithOthers(validatedItem, placedItems);
          if (hasOverlap) {
            const found = findNonOverlappingWallPosition(validatedItem, placedItems);
            if (found) {
              validatedItem = {
                ...validatedItem,
                mount: { ...validatedItem.mount, u: found.u }
              };
            }
          }
        }

        const newItems = [...placedItems, validatedItem];
        
        // 배치 업데이트로 성능 향상
        set({
          placedItems: newItems,
          selectedItemId: validatedItem.id
        });

        // 히스토리 캡처를 다음 프레임으로 지연
        requestAnimationFrame(() => captureHistory(`item_added_${validatedItem.id}`));
      },

      updateItem: (id: string, updates: Partial<PlacedItem>) => {
        const { placedItems, captureHistory } = get();
        const itemIndex = placedItems.findIndex(item => item.id === id);

        if (itemIndex === -1) return;

        const currentItem = placedItems[itemIndex];
        const updatedItem: PlacedItem = { ...currentItem, ...updates } as PlacedItem;

        // 실제 변경사항이 있는지 확인
        if (performanceUtils.deepEqual(currentItem, updatedItem)) {
          return;
        }

        // 위치/회전/스케일 변경 시 벽 안에 있는지 검증 (회전/스케일도 경계에 영향)
        let validatedItem: PlacedItem = updatedItem.mount?.type === 'wall' ? clampWallMountedItem(updatedItem) : updatedItem;
        const affectsBounds = !!(updates.position || updates.rotation || updates.scale);
        const { isDragging, draggingItemId } = get();
        const skipCollisions = isDragging && draggingItemId === id;
        if (affectsBounds) {
          if (!updatedItem.mount?.type) {
            const isInRoom = isFurnitureInRoom(updatedItem);
            if (!isInRoom) {
              validatedItem = constrainFurnitureToRoom(updatedItem);
            }
          }

          if (!skipCollisions) {
            // 가구 간 충돌 검사 (위치/회전/스케일 변경 시에만)
            const otherItems = placedItems.filter(item => item.id !== id);
            const shouldCheckCollision = validatedItem.mount?.type !== 'wall';
            const collisionCheck = shouldCheckCollision ? checkCollisionWithOthers(validatedItem, otherItems) : { hasCollision: false, collidingItems: [] };
            if (shouldCheckCollision && collisionCheck.hasCollision) {
              // 충돌을 피할 수 있는 안전한 위치로 이동
              validatedItem = moveToSafePosition(validatedItem, otherItems);
              // 안전 위치가 방 경계 밖으로 나갈 수 있으므로 재클램프
              if (!validatedItem.mount?.type && !isFurnitureInRoom(validatedItem)) {
                validatedItem = constrainFurnitureToRoom(validatedItem);
              }
            }
            // 벽 부착 오버랩 해결
            if (validatedItem.mount?.type === 'wall') {
              const { hasOverlap } = checkWallOverlapWithOthers(validatedItem, otherItems);
              if (hasOverlap) {
                const found = findNonOverlappingWallPosition(validatedItem, otherItems);
                if (found && validatedItem.mount) {
                  validatedItem = {
                    ...validatedItem,
                    mount: { ...validatedItem.mount, u: found.u }
                  } as PlacedItem;
                }
              }
            }
          }

          // 마지막으로 방 경계 보정 한 번 더 수행
          if (!validatedItem.mount?.type && !isFurnitureInRoom(validatedItem)) {
            validatedItem = constrainFurnitureToRoom(validatedItem);
          }
        }

        const updatedItems = [...placedItems];
        updatedItems[itemIndex] = validatedItem;

        set({ placedItems: updatedItems });

        // 히스토리 캡처를 다음 프레임으로 지연
        requestAnimationFrame(() => captureHistory(`item_updated_${id}`));
      },

      removeItem: (id: string) => {
        const { placedItems, captureHistory, selectedItemId } = get();
        const filteredItems = placedItems.filter(item => item.id !== id);

        // 아이템이 실제로 존재하지 않는 경우
        if (filteredItems.length === placedItems.length) {
          return;
        }

        const newSelectedId = selectedItemId === id ? null : selectedItemId;

        set({
          placedItems: filteredItems,
          selectedItemId: newSelectedId
        });

        requestAnimationFrame(() => captureHistory(`item_removed_${id}`));
      },

      duplicateItem: (id: string) => {
        const { placedItems, captureHistory } = get();
        const originalItem = placedItems.find(item => item.id === id);

        if (!originalItem) return;

        const newId = `${originalItem.id}_copy_${Date.now()}`;
        const newPosition = new Vector3(
          originalItem.position.x + 1,
          originalItem.position.y,
          originalItem.position.z + 1
        );

        const duplicatedItem: PlacedItem = {
          ...originalItem,
          id: newId,
          position: newPosition
        };

        const newItems = [...placedItems, duplicatedItem];

        set({
          placedItems: newItems,
          selectedItemId: newId
        });

        requestAnimationFrame(() => captureHistory(`item_duplicated_${id}_to_${newId}`));
      },

      selectItem: (id: string | null) => {
        const currentSelectedId = get().selectedItemId;
        if (currentSelectedId === id) return; // 불필요한 업데이트 방지
        
        // 단일 선택만 허용 - 이전 선택을 명시적으로 해제
        set({ selectedItemId: id });
      },

      // 선택 해제(표준 액션)
      clearSelection: () => {
        const currentSelectedId = get().selectedItemId;
        if (currentSelectedId !== null) {
          set({ selectedItemId: null });
        }
      },

      lockItem: (id: string) => {
        const { placedItems, captureHistory, grid, rotationSnap } = get();
        const itemIndex = placedItems.findIndex(item => item.id === id);

        if (itemIndex === -1) return;

        const currentItem = placedItems[itemIndex];
        if (!currentItem || currentItem.isLocked) return; // 이미 고정된 경우

        const updatedItems = [...placedItems];
        updatedItems[itemIndex] = {
          ...currentItem,
          isLocked: true,
          snapSettings: {
            gridEnabled: grid.enabled,
            rotationSnapEnabled: rotationSnap.enabled,
            rotationSnapAngle: rotationSnap.angle,
            gridSize: grid.size,
            gridDivisions: grid.divisions
          }
        };

        set({ placedItems: updatedItems });
        requestAnimationFrame(() => captureHistory(`item_locked_${id}`));
      },

      unlockItem: (id: string) => {
        const { placedItems, captureHistory } = get();
        const itemIndex = placedItems.findIndex(item => item.id === id);

        if (itemIndex === -1) return;

        const currentItem = placedItems[itemIndex];
        if (!currentItem || !currentItem.isLocked) return; // 이미 고정 해제된 경우

        const updatedItems = [...placedItems];
        updatedItems[itemIndex] = { ...currentItem, isLocked: false };

        set({ placedItems: updatedItems });
        requestAnimationFrame(() => captureHistory(`item_unlocked_${id}`));
      },

      // 최적화된 그리드 설정 함수들
      setGridSettings: (settings: Partial<GridSettings>) => {
        const { grid } = get();
        const newGrid = { ...grid, ...settings };
        
        if (performanceUtils.deepEqual(grid, newGrid)) return;
        set({ grid: newGrid });
      },

      setRotationSnapSettings: (settings: Partial<RotationSnapSettings>) => {
        const { rotationSnap } = get();
        const newRotationSnap = { ...rotationSnap, ...settings };
        
        if (performanceUtils.deepEqual(rotationSnap, newRotationSnap)) return;
        set({ rotationSnap: newRotationSnap });
      },

      // 스냅 설정 토글 (최적화)
      toggleGridSnap: () => {
        const { grid } = get();
        set({ grid: { ...grid, enabled: !grid.enabled } });
      },

      toggleRotationSnap: () => {
        const { rotationSnap } = get();
        set({ rotationSnap: { ...rotationSnap, enabled: !rotationSnap.enabled } });
      },

      // 스냅 강도 조절 (최적화)
      setSnapStrength: (settings: Partial<SnapStrengthSettings>) => {
        const { snapStrength } = get();
        const newSnapStrength = { ...snapStrength, ...settings };
        
        if (performanceUtils.deepEqual(snapStrength, newSnapStrength)) return;
        set({ snapStrength: newSnapStrength });
      },

      toggleSnapStrength: () => {
        const { snapStrength } = get();
        set({ snapStrength: { ...snapStrength, enabled: !snapStrength.enabled } });
      },

      // 빠른 도구 전환 (최적화)
      cycleTool: () => {
        const { tool } = get();
        const tools: Tool[] = ['select', 'translate', 'rotate', 'scale'];
        const currentIndex = tools.indexOf(tool);
        const nextIndex = (currentIndex + 1) % tools.length;
        const nextTool = tools[nextIndex];

        if (nextTool && tool !== nextTool) {
          set({ tool: nextTool });
        }
      },

      // 스냅 설정 저장 및 복원 (최적화)
      saveSnapSettings: () => {
        try {
          const { grid, rotationSnap } = get();
          const snapSettings = { grid, rotationSnap };
          localStorage.setItem('bumbum_snap_settings', JSON.stringify(snapSettings));
        } catch (error) {
          // console.error('스냅 설정 저장 실패:', error);
        }
      },

      loadSnapSettings: () => {
        try {
          const savedSettings = localStorage.getItem('bumbum_snap_settings');
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            const { grid, rotationSnap } = get();
            
            const newGrid = { ...grid, ...settings.grid };
            const newRotationSnap = { ...rotationSnap, ...settings.rotationSnap };
            
            if (!performanceUtils.deepEqual(grid, newGrid) || 
                !performanceUtils.deepEqual(rotationSnap, newRotationSnap)) {
              set({
                grid: newGrid,
                rotationSnap: newRotationSnap
              });
            }
          }
        } catch (error) {
          // console.warn('스냅 설정 로드 실패:', error);
        }
      },

      // 최적화된 히스토리 관리
      undo: () => {
        const { history, restoreFromCompressedState } = get();
        if (history.past.length === 0) return;

        const previousCompressed = history.past[history.past.length - 1];

        if (!previousCompressed) return; // 실행 취소할 항목이 없음

        const newPast = history.past.slice(0, -1);
        const newFuture = [history.present, ...history.future];

        let restoredItems: PlacedItem[];
        if (Array.isArray(previousCompressed)) {
          restoredItems = previousCompressed;
        } else {
          restoredItems = restoreFromCompressedState(previousCompressed);
        }

        set({
          placedItems: restoredItems,
          history: {
            past: newPast,
            present: previousCompressed,
            future: newFuture
          }
        });

        // console.log('✅ 성능: 실행 취소됨');
      },

      redo: () => {
        const { history, restoreFromCompressedState } = get();
        if (history.future.length === 0) return;

        const nextCompressed = history.future[0];

        if (!nextCompressed) return; // 재실행할 항목이 없음

        const newFuture = history.future.slice(1);
        const newPast = [...history.past, history.present];

        let restoredItems: PlacedItem[];
        if (Array.isArray(nextCompressed)) {
          restoredItems = nextCompressed;
        } else {
          restoredItems = restoreFromCompressedState(nextCompressed);
        }

        set({
          placedItems: restoredItems,
          history: {
            past: newPast,
            present: nextCompressed,
            future: newFuture
          }
        });

        // console.log('✅ 성능: 재실행됨');
      },

      clearHistory: () => {
        const { placedItems } = get();
        set({
          history: {
            past: [],
            present: placedItems,
            future: []
          }
        });
      },

      // UI 상태 관리 (최적화)
      setDragging: (isDragging: boolean) => {
        const currentDragging = get().isDragging;
        if (currentDragging === isDragging) return;
        
        set({ isDragging });
      },

      // 단일 드래그 락: 아이템별 드래그 소유권 관리
      beginDraggingItem: (id: string) => {
        const { draggingItemId } = get();
        // 이미 누군가 드래그 중이면 실패
        if (draggingItemId && draggingItemId !== id) return false;
        // 소유권 획득
        set({ draggingItemId: id, isDragging: true });
        return true;
      },
      endDraggingItem: (id: string) => {
        const { draggingItemId } = get();
        if (draggingItemId === id) {
          set({ draggingItemId: null, isDragging: false });
        }
      },

      toggleGrid: () => {
        const { showGrid } = get();
        set({ showGrid: !showGrid });
      },

      toggleBoundingBoxes: () => {
        const { showBoundingBoxes } = get();
        set({ showBoundingBoxes: !showBoundingBoxes });
      },

      // 전체 상태 리셋 (최적화)
      reset: () => {
        set(initialState);
      },

      // 객체만 삭제 (기타 설정은 유지)
      clearAllItems: () => {
        set(state => ({
          ...state,
          placedItems: [],
          selectedItemId: null,
          history: {
            past: [],
            present: [],
            future: []
          }
        }));
      },

      // 현재 상태 저장 (최적화)
      saveCurrentState: () => {
        try {
          const { placedItems, grid, rotationSnap, snapStrength } = get();
          const saveData = {
            placedItems,
            grid,
            rotationSnap,
            snapStrength,
            timestamp: new Date().toISOString()
          };

          localStorage.setItem('bumbum_room_state', JSON.stringify(saveData));
          // console.log('✅ 성능: 룸 상태가 저장되었습니다');
        } catch (error) {
          // console.error('룸 상태 저장 실패:', error);
        }
      },

      // 저장된 상태 불러오기 (최적화)
      loadSavedState: () => {
        try {
          const savedData = localStorage.getItem('bumbum_room_state');
          if (!savedData) {
            // console.warn('저장된 룸 상태가 없습니다');
            return;
          }

          const { placedItems, grid, rotationSnap, snapStrength } = JSON.parse(savedData);

          // 히스토리에 현재 상태 저장
          const { history } = get();
          const newHistory: EditHistory = {
            past: [...history.past, get().placedItems],
            present: placedItems,
            future: []
          };

          set({
            placedItems,
            grid: { ...get().grid, ...grid },
            rotationSnap: { ...get().rotationSnap, ...rotationSnap },
            snapStrength: { ...get().snapStrength, ...snapStrength },
            history: newHistory,
            selectedItemId: null
          });

          // console.log('✅ 성능: 룸 상태가 불러와졌습니다');
        } catch (error) {
          // console.error('룸 상태 불러오기 실패:', error);
        }
      },

      // 저장된 상태 존재 여부 확인
      hasSavedState: () => {
        return localStorage.getItem('bumbum_room_state') !== null;
      },

      // 자동 고정 설정 토글 (최적화)
      toggleAutoLock: () => {
        const { autoLock } = get();
        set({
          autoLock: {
            ...autoLock,
            enabled: !autoLock.enabled
          }
        });
        // console.log(`✅ 성능: 자동 고정 ${!autoLock.enabled ? '활성화' : '비활성화'}`);
      },

      // 자동 고정 지연 시간 설정 (최적화)
      setAutoLockDelay: (delay: number) => {
        const { autoLock } = get();
        if (autoLock.delay === delay) return;
        
        set({
          autoLock: {
            ...autoLock,
            delay
          }
        });
        // console.log(`✅ 성능: 자동 고정 지연 시간 - ${delay}ms`);
      },

      // 레이아웃 저장 (최적화)
      saveLayout: (name: string, description?: string, tags?: string[]) => {
        try {
          const { placedItems } = get();
          const layoutId = saveLayoutUtil(name, placedItems, description, tags);

          // console.log('✅ 성능: 레이아웃 저장 완료 -', { name, layoutId, itemCount: placedItems.length });
          return layoutId;
        } catch (error) {
          // console.error('❌ 레이아웃 저장 실패:', error);
          throw error;
        }
      },

      // 레이아웃 불러오기 (최적화)
      loadLayout: (layoutId: string) => {
        try {
          const items = loadLayoutUtil(layoutId);
          if (!items) {
            throw new Error('레이아웃을 찾을 수 없습니다.');
          }

          // 히스토리 캡처를 다음 프레임으로 지연
          requestAnimationFrame(() => get().captureHistory(`레이아웃 불러오기: ${layoutId}`));

          set({
            placedItems: items,
            selectedItemId: null
          });

          // console.log('✅ 성능: 레이아웃 불러오기 완료 -', { layoutId, itemCount: items.length });
          return items;
        } catch (error) {
          // console.error('❌ 레이아웃 불러오기 실패:', error);
          throw error;
        }
      },

      // 모든 레이아웃 목록 가져오기
      getAllLayouts: () => {
        try {
          return loadAllLayoutsUtil();
        } catch (error) {
          // console.error('❌ 레이아웃 목록 로드 실패:', error);
          return [];
        }
      },

      // 레이아웃 삭제
      deleteLayout: (layoutId: string) => {
        try {
          const success = deleteLayoutUtil(layoutId);
          if (success) {
            // console.log('✅ 성능: 레이아웃 삭제 완료 -', layoutId);
          }
          return success;
        } catch (error) {
          // console.error('❌ 레이아웃 삭제 실패:', error);
          return false;
        }
      },

      // 자동 저장된 레이아웃 복구 (최적화)
      loadAutoSave: () => {
        try {
          const items = loadAutoSaveUtil();
          if (!items) {
            // console.log('ℹ️ 자동 저장된 레이아웃이 없습니다.');
            return null;
          }

          requestAnimationFrame(() => get().captureHistory('자동 저장 레이아웃 복구'));

          set({
            placedItems: items,
            selectedItemId: null
          });

          // console.log('✅ 성능: 자동 저장 레이아웃 복구 완료 -', { itemCount: items.length });
          return items;
        } catch (error) {
          // console.error('❌ 자동 저장 레이아웃 복구 실패:', error);
          return null;
        }
      },

      // 자동 저장 실행
      triggerAutoSave: () => {
        try {
          const { placedItems } = get();
          storageManager.autoSave(placedItems);
        } catch (error) {
          // console.error('❌ 자동 저장 실패:', error);
        }
      },

      // 저장소 사용량 확인
      getStorageUsage: () => {
        try {
          return getStorageUsageUtil();
        } catch (error) {
          // console.error('❌ 저장소 사용량 확인 실패:', error);
          return { used: 0, total: 0, percentage: 0 };
        }
      },

      // 저장소 정리
      cleanupStorage: () => {
        try {
          const result = cleanupStorageUtil();
          // console.log('🧹 저장소 정리 완료:', result);
          return result;
        } catch (error) {
          // console.error('❌ 저장소 정리 실패:', error);
          return { removed: 0, freed: 0 };
        }
      },

      // 히스토리 가능 여부 확인 함수들
      canUndo: () => {
        const { history } = get();
        return history.past.length > 0;
      },

      canRedo: () => {
        const { history } = get();
        return history.future.length > 0;
      },

      // 카테고리 선택 (최적화)
      setSelectedCategory: (category: string | 'all') => {
        try {
          const prevCategory = get().selectedCategory;
          if (prevCategory === category) return; // 불필요한 업데이트 방지

          set({ selectedCategory: category });

          // console.log('✅ 성능: 카테고리 변경 -', { from: prevCategory, to: category });

          requestAnimationFrame(() => get().captureHistory(`카테고리 변경: ${prevCategory} → ${category}`));
        } catch (error) {
          // console.error('❌ 카테고리 변경 실패:', error);
        }
      },

      // 바닥 텍스처 설정
      setFloorTexture: (texturePath: string) => {
        const currentTexture = get().currentFloorTexture;
        if (currentTexture === texturePath) return; // 불필요한 업데이트 방지

        set({ currentFloorTexture: texturePath });
      },

      // 벽 텍스처 설정
      setWallTexture: (texturePath: string) => {
        const currentTexture = get().currentWallTexture;
        if (currentTexture === texturePath) return; // 불필요한 업데이트 방지

        set({ currentWallTexture: texturePath });
        // console.log('✅ 성능: 벽 텍스처 변경 -', { from: currentTexture, to: texturePath });
      },

      // 스크롤 락 토글 (최적화)
      toggleScrollLock: () => {
        const currentScrollLock = get().scrollLockEnabled;
        set({ scrollLockEnabled: !currentScrollLock });
        // console.log(`✅ 성능: 스크롤 락 ${!currentScrollLock ? '활성화' : '비활성화'}`);
      },

      // 스크롤 락 설정 (최적화)
      setScrollLockEnabled: (enabled: boolean) => {
        const currentScrollLock = get().scrollLockEnabled;
        if (currentScrollLock === enabled) return; // 불필요한 업데이트 방지
        set({ scrollLockEnabled: enabled });
        // console.log(`✅ 성능: 스크롤 락 ${enabled ? '활성화' : '비활성화'}`);
      }
    })),
    {
      name: 'bumbum-editor-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// 개발 편의를 위한 전역 디버그 노출 (브라우저 콘솔에서 상태 확인)
declare global {
  interface Window {
    __editorStore?: typeof useEditorStore;
    __s?: () => { selected: string | null; dragging: boolean };
  }
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  try {
    (window as Window & typeof globalThis & {
      __editorStore?: typeof useEditorStore;
      __s?: () => { selected: string | null; dragging: boolean };
    }).__editorStore = useEditorStore;
    (window as Window & typeof globalThis & {
      __editorStore?: typeof useEditorStore;
      __s?: () => { selected: string | null; dragging: boolean };
    }).__s = () => {
      const s = useEditorStore.getState();
      return { selected: s.selectedItemId, dragging: s.isDragging };
    };
  } catch {
    // 개발 환경에서만 사용되는 디버그 기능이므로 에러 무시
  }
}

// 성능 최적화된 선택자 함수들
export const useEditorMode = () => useEditorStore(state => state.mode);
export const useEditorTool = () => useEditorStore(state => state.tool);
export const usePlacedItems = () => useEditorStore(state => state.placedItems);
export const useSelectedItemId = () => useEditorStore(state => state.selectedItemId);
export const useGridSettings = () => useEditorStore(state => state.grid);
export const useRotationSnapSettings = () => useEditorStore(state => state.rotationSnap);
export const useShowGrid = () => useEditorStore(state => state.showGrid);
export const useShowBoundingBoxes = () => useEditorStore(state => state.showBoundingBoxes);
export const useIsDragging = () => useEditorStore(state => state.isDragging);
export const useSnapStrength = () => useEditorStore(state => state.snapStrength);
export const useAutoLock = () => useEditorStore(state => state.autoLock);
export const useSelectedCategory = () => useEditorStore(state => state.selectedCategory);
export const useScrollLockEnabled = () => useEditorStore(state => state.scrollLockEnabled);
export const useCurrentFloorTexture = () => useEditorStore(state => state.currentFloorTexture);
export const useCurrentWallTexture = () => useEditorStore(state => state.currentWallTexture);

// 액션 함수들
export const {
  setMode,
  setTool,
  addItem,
  updateItem,
  removeItem,
  duplicateItem,
  selectItem,
  clearSelection,
  lockItem,
  unlockItem,
  setGridSettings,
  setRotationSnapSettings,
  toggleGridSnap,
  toggleRotationSnap,
  setSnapStrength,
  toggleSnapStrength,
  cycleTool,
  saveSnapSettings,
  loadSnapSettings,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory,
  setDragging,
  toggleGrid,
  toggleBoundingBoxes,
  reset,
  clearAllItems,
  saveCurrentState,
  loadSavedState,
  hasSavedState,
  toggleAutoLock,
  setAutoLockDelay,
  saveLayout,
  loadLayout,
  getAllLayouts,
  deleteLayout,
  loadAutoSave,
  triggerAutoSave,
  getStorageUsage,
  cleanupStorage,
  setSelectedCategory,
  setFloorTexture,
  setWallTexture,
  toggleScrollLock,
  setScrollLockEnabled
} = useEditorStore.getState();
