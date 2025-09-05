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
import { storageManager } from '../utils/storageManager';
import { isFurnitureInRoom, constrainFurnitureToRoom } from '../utils/roomBoundary';

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
  mode: 'view',
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
  scrollLockEnabled: false
};

// 성능 최적화를 위한 유틸리티 함수들
const performanceUtils = {
  // 깊은 비교를 통한 불필요한 업데이트 방지
  deepEqual: (a: any, b: any): boolean => {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a == null || b == null) return a === b;
    
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, index) => performanceUtils.deepEqual(val, b[index]));
    }
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => performanceUtils.deepEqual(a[key], b[key]));
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
  debounce: <T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): T => {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
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
            console.warn(`히스토리 복원 중 원본 아이템을 찾을 수 없음: ${compressedItem.id}`);
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
          console.log('🎯 편집 모드 진입: 그리드 및 스냅 자동 활성화, 스크롤 락 적용');
        } else {
          set({
            mode,
            tool: mode === 'view' ? 'select' : get().tool,
            scrollLockEnabled: false // 뷰 모드 진입 시 스크롤 락 해제
          });
          console.log('👁️ 뷰 모드 진입: 스크롤 락 해제');
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
          console.warn('중복된 ID의 아이템을 추가할 수 없습니다:', item.id);
          return;
        }

        // 가구가 방 안에 있는지 검증하고, 벽 밖에 있다면 자동으로 이동
        let validatedItem = item;
        if (!isFurnitureInRoom(item)) {
          console.log(`🚨 가구가 벽 밖에 배치됨: ${item.name || item.id}`);
          validatedItem = constrainFurnitureToRoom(item);
          console.log(`✅ 가구를 방 안으로 이동: ${validatedItem.position.x.toFixed(2)}, ${validatedItem.position.y.toFixed(2)}, ${validatedItem.position.z.toFixed(2)}`);
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
        const updatedItem: PlacedItem = { ...currentItem, ...(updates as any) };

        // 실제 변경사항이 있는지 확인
        if (performanceUtils.deepEqual(currentItem, updatedItem)) {
          return;
        }

        // 위치/회전/스케일 변경 시 벽 안에 있는지 검증 (회전/스케일도 경계에 영향)
        let validatedItem: PlacedItem = updatedItem;
        const affectsBounds = !!(updates.position || updates.rotation || updates.scale);
        if (affectsBounds) {
          const isInRoom = isFurnitureInRoom(updatedItem);
          console.log(`🔍 editorStore updateItem: ${updatedItem.name || updatedItem.id}`, {
            새위치: `(${updatedItem.position.x.toFixed(2)}, ${updatedItem.position.y.toFixed(2)}, ${updatedItem.position.z.toFixed(2)})`,
            새회전: `(${updatedItem.rotation.x.toFixed(2)}, ${updatedItem.rotation.y.toFixed(2)}, ${updatedItem.rotation.z.toFixed(2)})`,
            새스케일: `(${updatedItem.scale.x.toFixed(2)}, ${updatedItem.scale.y.toFixed(2)}, ${updatedItem.scale.z.toFixed(2)})`,
            방안에있음: isInRoom ? '✅ 예' : '❌ 아니오'
          });

          if (!isInRoom) {
            console.log(`🚨 가구 변경으로 벽 밖 조건 발생: ${updatedItem.name || updatedItem.id}`);
            validatedItem = constrainFurnitureToRoom(updatedItem);
            console.log(`✅ 가구를 방 안으로 보정: ${validatedItem.position.x.toFixed(2)}, ${validatedItem.position.y.toFixed(2)}, ${validatedItem.position.z.toFixed(2)}`);
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
        set({ selectedItemId: id });
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
        console.log('객체 고정됨 (스냅 설정 저장):', id);
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
        console.log('객체 고정 해제됨:', id);
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
          localStorage.setItem('bondidi_snap_settings', JSON.stringify(snapSettings));
        } catch (error) {
          console.error('스냅 설정 저장 실패:', error);
        }
      },

      loadSnapSettings: () => {
        try {
          const savedSettings = localStorage.getItem('bondidi_snap_settings');
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
          console.warn('스냅 설정 로드 실패:', error);
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

        console.log('↩️ 실행 취소됨');
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

        console.log('↪️ 재실행됨');
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

          localStorage.setItem('bondidi_room_state', JSON.stringify(saveData));
          console.log('🗂️ 룸 상태가 저장되었습니다');
        } catch (error) {
          console.error('룸 상태 저장 실패:', error);
        }
      },

      // 저장된 상태 불러오기 (최적화)
      loadSavedState: () => {
        try {
          const savedData = localStorage.getItem('bondidi_room_state');
          if (!savedData) {
            console.warn('저장된 룸 상태가 없습니다');
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

          console.log('🗂️ 룸 상태가 불러와졌습니다');
        } catch (error) {
          console.error('룸 상태 불러오기 실패:', error);
        }
      },

      // 저장된 상태 존재 여부 확인
      hasSavedState: () => {
        return localStorage.getItem('bondidi_room_state') !== null;
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
        console.log(`🔒 자동 고정 ${!autoLock.enabled ? '활성화' : '비활성화'}`);
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
        console.log(`⏱️ 자동 고정 지연 시간: ${delay}ms`);
      },

      // 레이아웃 저장 (최적화)
      saveLayout: (name: string, description?: string, tags?: string[]) => {
        try {
          const { placedItems } = get();
          const layoutId = storageManager.saveLayout(name, placedItems, description, tags);

          console.log('✅ 레이아웃 저장 완료:', { name, layoutId, itemCount: placedItems.length });
          return layoutId;
        } catch (error) {
          console.error('❌ 레이아웃 저장 실패:', error);
          throw error;
        }
      },

      // 레이아웃 불러오기 (최적화)
      loadLayout: (layoutId: string) => {
        try {
          const items = storageManager.loadLayout(layoutId);
          if (!items) {
            throw new Error('레이아웃을 찾을 수 없습니다.');
          }

          // 히스토리 캡처를 다음 프레임으로 지연
          requestAnimationFrame(() => get().captureHistory(`레이아웃 불러오기: ${layoutId}`));

          set({
            placedItems: items,
            selectedItemId: null
          });

          console.log('✅ 레이아웃 불러오기 완료:', { layoutId, itemCount: items.length });
          return items;
        } catch (error) {
          console.error('❌ 레이아웃 불러오기 실패:', error);
          throw error;
        }
      },

      // 모든 레이아웃 목록 가져오기
      getAllLayouts: () => {
        try {
          return storageManager.loadAllLayouts();
        } catch (error) {
          console.error('❌ 레이아웃 목록 로드 실패:', error);
          return [];
        }
      },

      // 레이아웃 삭제
      deleteLayout: (layoutId: string) => {
        try {
          const success = storageManager.deleteLayout(layoutId);
          if (success) {
            console.log('✅ 레이아웃 삭제 완료:', layoutId);
          }
          return success;
        } catch (error) {
          console.error('❌ 레이아웃 삭제 실패:', error);
          return false;
        }
      },

      // 자동 저장된 레이아웃 복구 (최적화)
      loadAutoSave: () => {
        try {
          const items = storageManager.loadAutoSave();
          if (!items) {
            console.log('ℹ️ 자동 저장된 레이아웃이 없습니다.');
            return null;
          }

          requestAnimationFrame(() => get().captureHistory('자동 저장 레이아웃 복구'));

          set({
            placedItems: items,
            selectedItemId: null
          });

          console.log('✅ 자동 저장 레이아웃 복구 완료:', { itemCount: items.length });
          return items;
        } catch (error) {
          console.error('❌ 자동 저장 레이아웃 복구 실패:', error);
          return null;
        }
      },

      // 자동 저장 실행
      triggerAutoSave: () => {
        try {
          const { placedItems } = get();
          storageManager.autoSave(placedItems);
        } catch (error) {
          console.error('❌ 자동 저장 실패:', error);
        }
      },

      // 저장소 사용량 확인
      getStorageUsage: () => {
        try {
          return storageManager.getStorageUsage();
        } catch (error) {
          console.error('❌ 저장소 사용량 확인 실패:', error);
          return { used: 0, total: 0, percentage: 0 };
        }
      },

      // 저장소 정리
      cleanupStorage: () => {
        try {
          const result = storageManager.cleanupStorage();
          console.log('🧹 저장소 정리 완료:', result);
          return result;
        } catch (error) {
          console.error('❌ 저장소 정리 실패:', error);
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

          console.log('🏷️ 카테고리 변경:', {
            from: prevCategory,
            to: category,
            timestamp: new Date().toISOString()
          });

          requestAnimationFrame(() => get().captureHistory(`카테고리 변경: ${prevCategory} → ${category}`));
        } catch (error) {
          console.error('❌ 카테고리 변경 실패:', error);
        }
      },

      // 스크롤 락 토글 (최적화)
      toggleScrollLock: () => {
        const currentScrollLock = get().scrollLockEnabled;
        set({ scrollLockEnabled: !currentScrollLock });
        console.log(`🔒 스크롤 락 ${!currentScrollLock ? '활성화' : '비활성화'}`);
      },

      // 스크롤 락 설정 (최적화)
      setScrollLockEnabled: (enabled: boolean) => {
        const currentScrollLock = get().scrollLockEnabled;
        if (currentScrollLock === enabled) return; // 불필요한 업데이트 방지
        set({ scrollLockEnabled: enabled });
        console.log(`🔒 스크롤 락 ${enabled ? '활성화' : '비활성화'}`);
      }
    })),
    {
      name: 'bondidi-editor-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

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

// 액션 함수들
export const {
  setMode,
  setTool,
  addItem,
  updateItem,
  removeItem,
  duplicateItem,
  selectItem,
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
  toggleScrollLock,
  setScrollLockEnabled
} = useEditorStore.getState();
