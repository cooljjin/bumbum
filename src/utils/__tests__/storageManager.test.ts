import { storageManager } from '../storageManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    get store() {
      return { ...store };
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('storageManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Layout Management', () => {
    it('should save and load layout data correctly', () => {
      const testItems = [
        {
          id: 'item-1',
          name: 'Test Item 1',
          modelPath: '/models/test1.glb',
          position: { x: 0, y: 0, z: 0 } as any,
          rotation: { x: 0, y: 0, z: 0 } as any,
          scale: { x: 1, y: 1, z: 1 } as any,
          footprint: { width: 1, depth: 1, height: 1 }
        },
        {
          id: 'item-2',
          name: 'Test Item 2',
          modelPath: '/models/test2.glb',
          position: { x: 1, y: 1, z: 1 } as any,
          rotation: { x: 0, y: 0, z: 0 } as any,
          scale: { x: 1, y: 1, z: 1 } as any,
          footprint: { width: 1, depth: 1, height: 1 }
        }
      ];

      const layoutId = storageManager.saveLayout('test-layout-1', testItems);
      expect(layoutId).toBeDefined();

      const loadedLayoutData = storageManager.loadLayout(layoutId);
      expect(loadedLayoutData).toBeDefined();
      expect(loadedLayoutData).toHaveLength(2);
    });

    it('should return null for non-existent layout', () => {
      const loadedLayoutData = storageManager.loadLayout('non-existent-layout');
      expect(loadedLayoutData).toBeNull();
    });

    it('should list all saved layouts', () => {
      const items1 = [{
        id: 'item-1',
        name: 'Test Item 1',
        modelPath: '/models/test1.glb',
        position: { x: 0, y: 0, z: 0 } as any,
        rotation: { x: 0, y: 0, z: 0 } as any,
        scale: { x: 1, y: 1, z: 1 } as any,
        footprint: { width: 1, depth: 1, height: 1 }
      }];
      const items2 = [{
        id: 'item-2',
        name: 'Test Item 2',
        modelPath: '/models/test2.glb',
        position: { x: 1, y: 1, z: 1 } as any,
        rotation: { x: 0, y: 0, z: 0 } as any,
        scale: { x: 1, y: 1, z: 1 } as any,
        footprint: { width: 1, depth: 1, height: 1 }
      }];

      storageManager.saveLayout('layout-1', items1);
      storageManager.saveLayout('layout-2', items2);

      const savedLayouts = storageManager.loadAllLayouts();
      expect(savedLayouts).toHaveLength(2);
      expect(savedLayouts[0].metadata.name).toBe('layout-1');
      expect(savedLayouts[1].metadata.name).toBe('layout-2');
    });

    it('should delete layout data correctly', () => {
      const testItems = [{
        id: 'test-item',
        name: 'Test Item',
        modelPath: '/models/test.glb',
        position: { x: 0, y: 0, z: 0 } as any,
        rotation: { x: 0, y: 0, z: 0 } as any,
        scale: { x: 1, y: 1, z: 1 } as any,
        footprint: { width: 1, depth: 1, height: 1 }
      }];

      const layoutId = storageManager.saveLayout('test-layout', testItems);
      expect(storageManager.loadLayout(layoutId)).toBeDefined();

      const deleteResult = storageManager.deleteLayout(layoutId);
      expect(deleteResult).toBe(true);
      expect(storageManager.loadLayout(layoutId)).toBeNull();
    });
  });

  describe('Auto Save', () => {
    it('should auto save items when compression is enabled', () => {
      const testItems = [
        {
          id: 'item-1',
          name: 'Test Item 1',
          modelPath: '/models/test1.glb',
          position: { x: 0, y: 0, z: 0 } as any,
          rotation: { x: 0, y: 0, z: 0 } as any,
          scale: { x: 1, y: 1, z: 1 } as any,
          footprint: { width: 1, depth: 1, height: 1 }
        }
      ];

      storageManager.autoSave(testItems);

      // auto save data가 저장되었는지 확인
      const autoSaveData = localStorageMock.getItem('bondidi_auto_save');
      expect(autoSaveData).toBeTruthy();
    });
  });

  describe('Storage Usage', () => {
    it('should calculate storage usage correctly', () => {
      const testItems = [{
        id: 'test',
        name: 'Test Item',
        modelPath: '/models/test.glb',
        position: { x: 0, y: 0, z: 0 } as any,
        rotation: { x: 0, y: 0, z: 0 } as any,
        scale: { x: 1, y: 1, z: 1 } as any,
        footprint: { width: 1, depth: 1, height: 1 }
      }];

      storageManager.saveLayout('test-layout', testItems);

      const usage = storageManager.getStorageUsage();
      expect(usage.used).toBeGreaterThan(0);
      expect(usage.total).toBeGreaterThan(0);
      expect(usage.percentage).toBeGreaterThan(0);
    });

    it('should cleanup old data when storage is high', () => {
      // 오래된 데이터를 시뮬레이션하기 위해 타임스탬프를 조작
      const oldTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000); // 31일 전
      
      // localStorage에 직접 오래된 데이터 저장
      const oldLayouts = [{
        metadata: {
          id: 'old-layout',
          name: 'Old Layout',
          timestamp: oldTimestamp,
          itemCount: 1
        },
        data: {
          items: [{
            id: 'old-item',
            pos: [0, 0, 0],
            rot: [0, 0, 0],
            scl: [1, 1, 1],
            locked: false
          }],
          timestamp: oldTimestamp,
          description: 'manual_save'
        }
      }];

      localStorageMock.setItem('bondidi_room_layouts', JSON.stringify(oldLayouts));

      const cleanupResult = storageManager.cleanupStorage();

      expect(cleanupResult.removed).toBeGreaterThan(0);
      expect(cleanupResult.freed).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Simulate localStorage error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not crash
      expect(() => {
        const testItems = [{
          id: 'test-item',
          name: 'Test Item',
          modelPath: '/models/test.glb',
          position: { x: 0, y: 0, z: 0 } as any,
          rotation: { x: 0, y: 0, z: 0 } as any,
          scale: { x: 1, y: 1, z: 1 } as any,
          footprint: { width: 1, depth: 1, height: 1 }
        }];
        storageManager.saveLayout('test-layout', testItems);
      }).toThrow('레이아웃 저장에 실패했습니다.');

      // Restore original function
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeItems = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Test Item ${i}`,
        modelPath: `/models/test${i}.glb`,
        position: { x: i, y: i, z: i } as any,
        rotation: { x: 0, y: 0, z: 0 } as any,
        scale: { x: 1, y: 1, z: 1 } as any,
        footprint: { width: 1, depth: 1, height: 1 }
      }));

      const startTime = performance.now();
      storageManager.autoSave(largeItems);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // 1초 이내
    });
  });
});
