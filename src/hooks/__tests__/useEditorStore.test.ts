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
    { id: '2', name: 'Table', category: 'tables', metadata: { category: 'tables' }, isLocked: true },
  ],
  selectedItemId: '1',
  gridSettings: {
    size: 1,
    divisions: 10,
    color: '#ffffff',
    opacity: 0.5,
  },
  rotationSnapSettings: {
    enabled: true,
    angle: 15,
  },
  showGrid: true,
  showBoundingBoxes: false,
  isDragging: false,
  snapStrength: 0.5,
  autoLock: false,
  selectedCategory: 'seating',
  selectedItem: { id: '1', name: 'Chair', category: 'seating', metadata: { category: 'seating' }, isLocked: false },
  itemsByCategory: {
    seating: [{ id: '1', name: 'Chair', category: 'seating', metadata: { category: 'seating' }, isLocked: false }],
    tables: [{ id: '2', name: 'Table', category: 'tables', metadata: { category: 'tables' }, isLocked: true }],
  },
  lockedItems: [{ id: '2', name: 'Table', category: 'tables', metadata: { category: 'tables' }, isLocked: true }],
  unlockedItems: [{ id: '1', name: 'Chair', category: 'seating', metadata: { category: 'seating' }, isLocked: false }],
  gridState: {
    size: 1,
    divisions: 10,
    color: '#ffffff',
    opacity: 0.5,
  },
  snapState: {
    enabled: true,
    strength: 0.5,
  },
  editModeState: {
    isEditMode: true,
    isViewMode: false,
  },
  historyState: {
    historyCount: 2,
    futureCount: 1,
  },
};

// @testing-library/react 모킹
jest.mock('@testing-library/react', () => ({
  renderHook: jest.fn(),
  act: jest.fn(),
}));

// Zustand store 모킹
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
      expect(result.current[0].name).toBe('Chair');
    });
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
      expect(result.current.size).toBe(1);
      expect(result.current.divisions).toBe(10);
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
    it('returns dragging state', () => {
      const { result } = renderHook(() => useIsDragging());
      expect(result.current).toBe(false);
    });
  });

  describe('useSnapStrength', () => {
    it('returns snap strength', () => {
      const { result } = renderHook(() => useSnapStrength());
      expect(result.current).toBe(0.5);
    });
  });

  describe('useAutoLock', () => {
    it('returns auto lock state', () => {
      const { result } = renderHook(() => useAutoLock());
      expect(result.current).toBe(false);
    });
  });

  describe('useSelectedCategory', () => {
    it('returns selected category', () => {
      const { result } = renderHook(() => useSelectedCategory());
      expect(result.current).toBe('seating');
    });
  });

  describe('useSelectedItem', () => {
    it('returns selected item', () => {
      const { result } = renderHook(() => useSelectedItem());
      expect(result.current?.name).toBe('Chair');
    });
  });

  describe('useItemsByCategory', () => {
    it('returns items by category', () => {
      const { result } = renderHook(() => useItemsByCategory());
      expect(result.current.seating).toHaveLength(1);
      expect(result.current.tables).toHaveLength(1);
    });
  });

  describe('useLockedItems', () => {
    it('returns locked items', () => {
      const { result } = renderHook(() => useLockedItems());
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Table');
    });
  });

  describe('useUnlockedItems', () => {
    it('returns unlocked items', () => {
      const { result } = renderHook(() => useUnlockedItems());
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Chair');
    });
  });

  describe('useGridState', () => {
    it('returns grid state', () => {
      const { result } = renderHook(() => useGridState());
      expect(result.current.size).toBe(1);
      expect(result.current.divisions).toBe(10);
    });
  });

  describe('useSnapState', () => {
    it('returns snap state', () => {
      const { result } = renderHook(() => useSnapState());
      expect(result.current.enabled).toBe(true);
      expect(result.current.strength).toBe(0.5);
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