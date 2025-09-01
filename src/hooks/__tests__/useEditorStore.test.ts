import { renderHook, act } from '@testing-library/react';
import {
  useEditorMode,
  useEditorTool,
  usePlacedItems,
  useSelectedItemId,
  useGridSettings,
  useRotationSnapSettings,
  useShowGrid,
  useShowBoundingBoxes,
  useIsDragging,
  useSnapStrength,
  useAutoLock,
  useSelectedCategory,
  useSelectedItem,
  useItemsByCategory,
  useLockedItems,
  useUnlockedItems,
  useGridState,
  useSnapState,
  useEditModeState,
  useHistoryState,
} from '../useEditorStore';

// Zustand store 모킹
const mockStore = {
  mode: 'edit' as const,
  tool: 'select' as const,
  placedItems: [
    { id: '1', name: 'Chair', category: 'seating', metadata: { category: 'seating' }, isLocked: false },
    { id: '2', name: 'Table', category: 'furniture', metadata: { category: 'furniture' }, isLocked: false }
  ],
  selectedItemId: '1',
  grid: { enabled: true, size: 10, divisions: 10, color: '#888888' },
  rotationSnap: { enabled: true, angle: 15 },
  snapStrength: { enabled: true, translation: 1.0, rotation: 1.0 },
  showGrid: true,
  showBoundingBoxes: false,
  isDragging: false,
  autoLock: { enabled: true, delay: 1000 },
  selectedCategory: 'all',
  history: {
    past: ['action1', 'action2'],
    present: 'current',
    future: ['action3']
  }
};

// 스토어 모킹
jest.mock('../../store/editorStore', () => ({
  useEditorStore: jest.fn()
}));

// 모킹된 스토어 가져오기
const { useEditorStore } = require('../../store/editorStore');

describe('useEditorStore Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 각 테스트 전에 스토어 모킹 설정
    (useEditorStore as jest.Mock).mockImplementation((selector: any) => selector(mockStore));
  });

  describe('useEditorMode', () => {
    it('returns editor mode', () => {
      const { result } = renderHook(() => useEditorMode());
      expect(result.current).toBe('edit');
    });
  });

  describe('useEditorTool', () => {
    it('returns editor tool', () => {
      const { result } = renderHook(() => useEditorTool());
      expect(result.current).toBe('select');
    });
  });

  describe('usePlacedItems', () => {
    it('returns placed items', () => {
      const { result } = renderHook(() => usePlacedItems());
      expect(result.current).toHaveLength(2);
      expect(result.current?.[0]?.name).toBe('Chair');
  });

  describe('useSelectedItemId', () => {
    it('returns selected item id', () => {
      const { result } = renderHook(() => useSelectedItemId());
      expect(result.current).toBe('1');
    });
  });

  describe('useGridSettings', () => {
    it('returns grid settings', () => {
      const { result } = renderHook(() => useGridSettings());
      expect(result.current.enabled).toBe(true);
      expect(result.current.size).toBe(10);
    });
  });

  describe('useRotationSnapSettings', () => {
    it('returns rotation snap settings', () => {
      const { result } = renderHook(() => useRotationSnapSettings());
      expect(result.current.enabled).toBe(true);
      expect(result.current.angle).toBe(15);
    });
  });

  describe('useShowGrid', () => {
    it('returns show grid state', () => {
      const { result } = renderHook(() => useShowGrid());
      expect(result.current).toBe(true);
    });
  });

  describe('useShowBoundingBoxes', () => {
    it('returns show bounding boxes state', () => {
      const { result } = renderHook(() => useShowBoundingBoxes());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsDragging', () => {
    it('returns is dragging state', () => {
      const { result } = renderHook(() => useIsDragging());
      expect(result.current).toBe(false);
    });
  });

  describe('useSnapStrength', () => {
    it('returns snap strength settings', () => {
      const { result } = renderHook(() => useSnapStrength());
      expect(result.current.enabled).toBe(true);
      expect(result.current.translation).toBe(1.0);
    });
  });

  describe('useAutoLock', () => {
    it('returns auto lock state', () => {
      const { result } = renderHook(() => useAutoLock());
      expect(result.current.enabled).toBe(true);
      expect(result.current.delay).toBe(1000);
    });
  });

  describe('useSelectedCategory', () => {
    it('returns selected category', () => {
      const { result } = renderHook(() => useSelectedCategory());
      expect(result.current).toBe('all');
    });
  });

  describe('useSelectedItem', () => {
    it('returns selected item', () => {
      const { result } = renderHook(() => useSelectedItem());
      expect(result.current?.name).toBe('Chair');
    });

    it('returns null when no item is selected', () => {
      const { useEditorStore } = require('../../store/editorStore');
      useEditorStore.mockImplementation((selector: any) => selector({
        ...mockStore,
        selectedItemId: null
      }));

      const { result } = renderHook(() => useSelectedItem());
      expect(result.current).toBeNull();
    });
  });

  describe('useItemsByCategory', () => {
    it('returns items by specific category', () => {
      const { result } = renderHook(() => useItemsByCategory('seating'));
      expect(result.current).toHaveLength(1);
      expect(result.current?.[0]?.name).toBe('Chair');
    });

    it('returns all items when category is "all"', () => {
      const { result } = renderHook(() => useItemsByCategory('all'));
      expect(result.current).toHaveLength(2);
    });

    it('returns empty array for non-existent category', () => {
      const { result } = renderHook(() => useItemsByCategory('nonexistent'));
      expect(result.current).toHaveLength(0);
    });
  });

  describe('useLockedItems', () => {
    it('returns locked items only', () => {
      const { result } = renderHook(() => useLockedItems());
      expect(result.current).toHaveLength(0);
    });
  });

  describe('useUnlockedItems', () => {
    it('returns unlocked items only', () => {
      const { result } = renderHook(() => useUnlockedItems());
      expect(result.current).toHaveLength(2);
    });
  });

  describe('useGridState', () => {
    it('returns combined grid state', () => {
      const { result } = renderHook(() => useGridState());
      expect(result.current.enabled).toBe(true);
      expect(result.current.visible).toBe(true);
    });

    it('returns visible false when grid is disabled', () => {
      const { useEditorStore } = require('../../store/editorStore');
      useEditorStore.mockImplementation((selector: any) => selector({
        ...mockStore,
        grid: { ...mockStore.grid, enabled: false }
      }));

      const { result } = renderHook(() => useGridState());
      expect(result.current.visible).toBe(false);
    });
  });

  describe('useSnapState', () => {
    it('returns combined snap state', () => {
      const { result } = renderHook(() => useSnapState());
      expect(result.current.grid).toBe(true);
      expect(result.current.rotation).toBe(true);
      expect(result.current.strength).toEqual({
        translation: 1.0,
        rotation: 1.0
      });
    });

    it('returns null strength when snap strength is disabled', () => {
      const { useEditorStore } = require('../../store/editorStore');
      useEditorStore.mockImplementation((selector: any) => selector({
        ...mockStore,
        snapStrength: { ...mockStore.snapStrength, enabled: false }
      }));

      const { result } = renderHook(() => useSnapState());
      expect(result.current.strength).toBeNull();
    });
  });

  describe('useEditModeState', () => {
    it('returns edit mode state', () => {
      const { result } = renderHook(() => useEditModeState());
      expect(result.current.isEditMode).toBe(true);
      expect(result.current.isViewMode).toBe(false);
    });

    it('returns view mode state', () => {
      const { useEditorStore } = require('../../store/editorStore');
      useEditorStore.mockImplementation((selector: any) => selector({
        ...mockStore,
        mode: 'view'
      }));

      const { result } = renderHook(() => useEditModeState());
      expect(result.current.isEditMode).toBe(false);
      expect(result.current.isViewMode).toBe(true);
    });
  });

  describe('useHistoryState', () => {
    it('returns history state', () => {
      const { result } = renderHook(() => useHistoryState());
      expect(result.current.historyCount).toBe(2);
      expect(result.current.futureCount).toBe(1);
    });
  });
});


