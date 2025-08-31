import { useCallback, useMemo } from 'react';
import { useEditorStore } from '../store/editorStore';
import { PlacedItem, Mode, Tool } from '../types/editor';

// 성능 최적화된 선택자 훅들
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

// 최적화된 선택된 아이템 훅
export const useSelectedItem = () => {
  const selectedItemId = useSelectedItemId();
  const placedItems = usePlacedItems();
  
  return useMemo(() => {
    if (!selectedItemId) return null;
    return placedItems.find(item => item.id === selectedItemId) || null;
  }, [selectedItemId, placedItems]);
};

// 최적화된 카테고리별 아이템 훅
export const useItemsByCategory = (category: string) => {
  const placedItems = usePlacedItems();
  
  return useMemo(() => {
    if (category === 'all') return placedItems;
    return placedItems.filter(item => item.metadata?.category === category);
  }, [placedItems, category]);
};

// 최적화된 잠긴 아이템 훅
export const useLockedItems = () => {
  const placedItems = usePlacedItems();
  
  return useMemo(() => {
    return placedItems.filter(item => item.isLocked);
  }, [placedItems]);
};

// 최적화된 잠금 해제된 아이템 훅
export const useUnlockedItems = () => {
  const placedItems = usePlacedItems();
  
  return useMemo(() => {
    return placedItems.filter(item => !item.isLocked);
  }, [placedItems]);
};

// 최적화된 그리드 상태 훅
export const useGridState = () => {
  const grid = useGridSettings();
  const showGrid = useShowGrid();
  
  return useMemo(() => ({
    ...grid,
    visible: showGrid && grid.enabled
  }), [grid, showGrid]);
};

// 최적화된 스냅 상태 훅
export const useSnapState = () => {
  const grid = useGridSettings();
  const rotationSnap = useRotationSnapSettings();
  const snapStrength = useSnapStrength();
  
  return useMemo(() => ({
    grid: grid.enabled,
    rotation: rotationSnap.enabled,
    strength: snapStrength.enabled ? {
      translation: snapStrength.translation,
      rotation: snapStrength.rotation
    } : null
  }), [grid.enabled, rotationSnap.enabled, snapStrength]);
};

// 최적화된 편집 모드 상태 훅
export const useEditModeState = () => {
  const mode = useEditorMode();
  const tool = useEditorTool();
  
  return useMemo(() => ({
    isEditMode: mode === 'edit',
    isViewMode: mode === 'view',
    currentTool: tool,
    canEdit: mode === 'edit' && tool !== 'select'
  }), [mode, tool]);
};

// 최적화된 히스토리 상태 훅
export const useHistoryState = () => {
  const history = useEditorStore(state => state.history);
  
  return useMemo(() => ({
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    historyCount: history.past.length,
    futureCount: history.future.length
  }), [history.past.length, history.future.length]);
};

// 최적화된 액션 훅들
export const useEditorActions = () => {
  const store = useEditorStore();
  
  return useMemo(() => ({
    setMode: store.setMode,
    setTool: store.setTool,
    addItem: store.addItem,
    updateItem: store.updateItem,
    removeItem: store.removeItem,
    duplicateItem: store.duplicateItem,
    selectItem: store.selectItem,
    lockItem: store.lockItem,
    unlockItem: store.unlockItem,
    undo: store.undo,
    redo: store.redo,
    clearHistory: store.clearHistory,
    reset: store.reset,
    clearAllItems: store.clearAllItems,
    saveCurrentState: store.saveCurrentState,
    loadSavedState: store.loadSavedState,
    saveLayout: store.saveLayout,
    loadLayout: store.loadLayout,
    getAllLayouts: store.getAllLayouts,
    deleteLayout: store.deleteLayout,
    loadAutoSave: store.loadAutoSave,
    triggerAutoSave: store.triggerAutoSave,
    cleanupStorage: store.cleanupStorage
  }), [store]);
};

// 최적화된 설정 액션 훅들
export const useSettingsActions = () => {
  const store = useEditorStore();
  
  return useMemo(() => ({
    setGridSettings: store.setGridSettings,
    setRotationSnapSettings: store.setRotationSnapSettings,
    toggleGridSnap: store.toggleGridSnap,
    toggleRotationSnap: store.toggleRotationSnap,
    setSnapStrength: store.setSnapStrength,
    toggleSnapStrength: store.toggleSnapStrength,
    toggleGrid: store.toggleGrid,
    toggleBoundingBoxes: store.toggleBoundingBoxes,
    toggleAutoLock: store.toggleAutoLock,
    setAutoLockDelay: store.setAutoLockDelay,
    saveSnapSettings: store.saveSnapSettings,
    loadSnapSettings: store.loadSnapSettings,
    setSelectedCategory: store.setSelectedCategory
  }), [store]);
};

// 최적화된 유틸리티 훅들
export const useEditorUtils = () => {
  const store = useEditorStore();
  
  return useMemo(() => ({
    cycleTool: store.cycleTool,
    setDragging: store.setDragging,
    hasSavedState: store.hasSavedState,
    getStorageUsage: store.getStorageUsage
  }), [store]);
};

// 최적화된 배치 업데이트 훅
export const useBatchUpdate = () => {
  const updateItem = useEditorStore(state => state.updateItem);
  
  return useCallback((updates: Array<{ id: string; updates: Partial<PlacedItem> }>) => {
    // requestAnimationFrame을 사용하여 배치 업데이트 최적화
    requestAnimationFrame(() => {
      updates.forEach(({ id, updates: itemUpdates }) => {
        updateItem(id, itemUpdates);
      });
    });
  }, [updateItem]);
};

// 최적화된 선택 관리 훅
export const useSelectionManager = () => {
  const selectItem = useEditorStore(state => state.selectItem);
  const selectedItemId = useSelectedItemId();
  const placedItems = usePlacedItems();
  
  const selectNext = useCallback(() => {
    if (placedItems.length === 0) return;
    
    if (!selectedItemId) {
      if (placedItems.length > 0 && placedItems[0]) {
        selectItem(placedItems[0].id);
      }
      return;
    }
    
    const currentIndex = placedItems.findIndex(item => item.id === selectedItemId);
    const nextIndex = (currentIndex + 1) % placedItems.length;
    if (placedItems[nextIndex]) {
      selectItem(placedItems[nextIndex].id);
    }
  }, [placedItems, selectedItemId, selectItem]);
  
  const selectPrevious = useCallback(() => {
    if (placedItems.length === 0) return;
    
    if (!selectedItemId) {
      if (placedItems.length > 0) {
        const lastItem = placedItems[placedItems.length - 1];
        if (lastItem) {
          selectItem(lastItem.id);
        }
      }
      return;
    }
    
    const currentIndex = placedItems.findIndex(item => item.id === selectedItemId);
    const prevIndex = currentIndex === 0 ? placedItems.length - 1 : currentIndex - 1;
    if (placedItems[prevIndex]) {
      selectItem(placedItems[prevIndex].id);
    }
  }, [placedItems, selectedItemId, selectItem]);
  
  const selectAll = useCallback(() => {
    // 다중 선택은 향후 구현 예정
    console.log('다중 선택 기능은 향후 구현 예정입니다.');
  }, []);
  
  const clearSelection = useCallback(() => {
    selectItem(null);
  }, [selectItem]);
  
  return useMemo(() => ({
    selectNext,
    selectPrevious,
    selectAll,
    clearSelection,
    selectedCount: selectedItemId ? 1 : 0,
    totalCount: placedItems.length
  }), [selectNext, selectPrevious, selectAll, clearSelection, selectedItemId, placedItems.length]);
};

// 최적화된 검색 및 필터링 훅
export const useItemSearch = () => {
  const placedItems = usePlacedItems();
  
  const searchByName = useCallback((query: string) => {
    if (!query.trim()) return placedItems;
    
    const lowerQuery = query.toLowerCase();
    return placedItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.metadata?.description?.toLowerCase().includes(lowerQuery)
    );
  }, [placedItems]);
  
  const filterByCategory = useCallback((category: string) => {
    if (category === 'all') return placedItems;
    return placedItems.filter(item => item.metadata?.category === category);
  }, [placedItems]);
  
  const filterByLockStatus = useCallback((locked: boolean) => {
    return placedItems.filter(item => item.isLocked === locked);
  }, [placedItems]);
  
  return useMemo(() => ({
    searchByName,
    filterByCategory,
    filterByLockStatus,
    getUniqueCategories: () => {
      const categories = new Set(placedItems.map(item => item.metadata?.category).filter(Boolean));
      return Array.from(categories);
    }
  }), [searchByName, filterByCategory, filterByLockStatus, placedItems]);
};
