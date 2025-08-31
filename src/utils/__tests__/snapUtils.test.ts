import {
  calculateGridSnap,
  calculateRotationSnap,
  hasSnapSettingsChanged,
  generateSnapCacheKey,
  memoizedGridSnap,
  memoizedRotationSnap,
  clearSnapCache
} from '../snapUtils';

// Three.js 모듈 모킹
jest.mock('three', () => ({
  Vector3: jest.fn((x = 0, y = 0, z = 0) => ({
    x, y, z,
    set: jest.fn(),
    copy: jest.fn(),
    clone: jest.fn(),
    add: jest.fn(),
    sub: jest.fn(),
    multiply: jest.fn(),
    divide: jest.fn(),
    length: jest.fn(),
    normalize: jest.fn(),
    distanceTo: jest.fn(),
    lerp: jest.fn(),
    equals: jest.fn(),
    fromArray: jest.fn(),
    toArray: jest.fn()
  })),
  Euler: jest.fn((x = 0, y = 0, z = 0, order = 'XYZ') => ({
    x, y, z, order,
    set: jest.fn(),
    copy: jest.fn(),
    clone: jest.fn(),
    reorder: jest.fn(),
    setFromQuaternion: jest.fn(),
    setFromRotationMatrix: jest.fn(),
    setFromVector3: jest.fn(),
    equals: jest.fn(),
    fromArray: jest.fn(),
    toArray: jest.fn()
  }))
}));

describe('snapUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearSnapCache();
  });

  describe('calculateGridSnap', () => {
    it('should snap position to grid correctly', () => {
      const mockPosition = { x: 1.7, y: 2.3, z: 3.8 };
      const gridSize = 2;
      const gridDivisions = 4;

      const result = calculateGridSnap(mockPosition as any, gridSize, gridDivisions);

      expect(result.x).toBeCloseTo(1.5, 1);
      expect(result.y).toBeCloseTo(2.5, 1);
      expect(result.z).toBeCloseTo(4.0, 1);
    });

    it('should handle zero position', () => {
      const mockPosition = { x: 0, y: 0, z: 0 };
      const gridSize = 1;
      const gridDivisions = 2;

      const result = calculateGridSnap(mockPosition as any, gridSize, gridDivisions);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });

    it('should handle negative position', () => {
      const mockPosition = { x: -1.7, y: -2.3, z: -3.8 };
      const gridSize = 2;
      const gridDivisions = 4;

      const result = calculateGridSnap(mockPosition as any, gridSize, gridDivisions);

      expect(result.x).toBeCloseTo(-1.5, 1);
      expect(result.y).toBeCloseTo(-2.5, 1);
      expect(result.z).toBeCloseTo(-4.0, 1);
    });
  });

  describe('calculateRotationSnap', () => {
    it('should snap rotation to angle correctly', () => {
      const mockRotation = { x: 0.3, y: 0.7, z: 1.2 };
      const snapAngle = 45; // 45도

      const result = calculateRotationSnap(mockRotation as any, snapAngle);

      expect(result.x).toBeCloseTo(0, 1);
      expect(result.y).toBeCloseTo(0.785, 3); // 45도 = π/4
      expect(result.z).toBeCloseTo(1.571, 3); // 90도 = π/2
    });

    it('should handle zero rotation', () => {
      const mockRotation = { x: 0, y: 0, z: 0 };
      const snapAngle = 90;

      const result = calculateRotationSnap(mockRotation as any, snapAngle);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });

    it('should handle custom snap angle', () => {
      const mockRotation = { x: 0.5, y: 1.0, z: 1.5 };
      const snapAngle = 30; // 30도

      const result = calculateRotationSnap(mockRotation as any, snapAngle);

      expect(result.x).toBeCloseTo(0.524, 3); // 30도 = π/6
      expect(result.y).toBeCloseTo(1.047, 3); // 60도 = π/3
      expect(result.z).toBeCloseTo(1.571, 3); // 90도 = π/2
    });
  });

  describe('hasSnapSettingsChanged', () => {
    it('should detect grid settings changes', () => {
      const currentGrid = { enabled: true, size: 2, divisions: 4 };
      const currentRotationSnap = { enabled: true, angle: 45 };
      const previousGrid = { enabled: true, size: 1, divisions: 4 };
      const previousRotationSnap = { enabled: true, angle: 45 };

      const result = hasSnapSettingsChanged(
        currentGrid,
        currentRotationSnap,
        previousGrid,
        previousRotationSnap
      );

      expect(result).toBe(true);
    });

    it('should detect rotation snap settings changes', () => {
      const currentGrid = { enabled: true, size: 2, divisions: 4 };
      const currentRotationSnap = { enabled: true, angle: 90 };
      const previousGrid = { enabled: true, size: 2, divisions: 4 };
      const previousRotationSnap = { enabled: true, angle: 45 };

      const result = hasSnapSettingsChanged(
        currentGrid,
        currentRotationSnap,
        previousGrid,
        previousRotationSnap
      );

      expect(result).toBe(true);
    });

    it('should detect enabled/disabled changes', () => {
      const currentGrid = { enabled: false, size: 2, divisions: 4 };
      const currentRotationSnap = { enabled: true, angle: 45 };
      const previousGrid = { enabled: true, size: 2, divisions: 4 };
      const previousRotationSnap = { enabled: true, angle: 45 };

      const result = hasSnapSettingsChanged(
        currentGrid,
        currentRotationSnap,
        previousGrid,
        previousRotationSnap
      );

      expect(result).toBe(true);
    });

    it('should return false when no changes', () => {
      const currentGrid = { enabled: true, size: 2, divisions: 4 };
      const currentRotationSnap = { enabled: true, angle: 45 };
      const previousGrid = { enabled: true, size: 2, divisions: 4 };
      const previousRotationSnap = { enabled: true, angle: 45 };

      const result = hasSnapSettingsChanged(
        currentGrid,
        currentRotationSnap,
        previousGrid,
        previousRotationSnap
      );

      expect(result).toBe(false);
    });
  });

  describe('generateSnapCacheKey', () => {
    it('should generate grid cache key correctly', () => {
      const mockPosition = { x: 1, y: 2, z: 3 };
      const values = [2, 4];

      const result = generateSnapCacheKey('grid', values, mockPosition as any);

      expect(result).toBe('grid_2_4_1_2_3');
    });

    it('should generate rotation cache key correctly', () => {
      const mockRotation = { x: 0.5, y: 1.0, z: 1.5 };
      const values = [45];

      const result = generateSnapCacheKey('rotation', values, undefined, mockRotation as any);

      expect(result).toBe('rotation_45_0.5_1_1.5');
    });

    it('should handle undefined position and rotation', () => {
      const values = [1, 2];

      const result = generateSnapCacheKey('grid', values);

      expect(result).toBe('grid_1_2_undefined_undefined_undefined');
    });
  });

  describe('memoizedGridSnap', () => {
    it('should return cached result for same inputs', () => {
      const mockPosition = { x: 1.7, y: 2.3, z: 3.8 };
      const gridSize = 2;
      const gridDivisions = 4;

      const result1 = memoizedGridSnap(mockPosition as any, gridSize, gridDivisions);
      const result2 = memoizedGridSnap(mockPosition as any, gridSize, gridDivisions);

      expect(result1).toBe(result2);
    });

    it('should calculate new result for different inputs', () => {
      const mockPosition1 = { x: 1.7, y: 2.3, z: 3.8 };
      const mockPosition2 = { x: 2.1, y: 3.4, z: 4.5 };
      const gridSize = 2;
      const gridDivisions = 4;

      const result1 = memoizedGridSnap(mockPosition1 as any, gridSize, gridDivisions);
      const result2 = memoizedGridSnap(mockPosition2 as any, gridSize, gridDivisions);

      expect(result1).not.toBe(result2);
    });
  });

  describe('memoizedRotationSnap', () => {
    it('should return cached result for same inputs', () => {
      const mockRotation = { x: 0.3, y: 0.7, z: 1.2 };
      const snapAngle = 45;

      const result1 = memoizedRotationSnap(mockRotation as any, snapAngle);
      const result2 = memoizedRotationSnap(mockRotation as any, snapAngle);

      expect(result1).toBe(result2);
    });

    it('should calculate new result for different inputs', () => {
      const mockRotation1 = { x: 0.3, y: 0.7, z: 1.2 };
      const mockRotation2 = { x: 0.5, y: 1.0, z: 1.5 };
      const snapAngle = 45;

      const result1 = memoizedRotationSnap(mockRotation1 as any, snapAngle);
      const result2 = memoizedRotationSnap(mockRotation2 as any, snapAngle);

      expect(result1).not.toBe(result2);
    });
  });

  describe('clearSnapCache', () => {
    it('should clear the snap cache', () => {
      const mockPosition = { x: 1.7, y: 2.3, z: 3.8 };
      const gridSize = 2;
      const gridDivisions = 4;

      // 캐시에 데이터 추가
      memoizedGridSnap(mockPosition as any, gridSize, gridDivisions);

      // 캐시 클리어
      clearSnapCache();

      // 새로운 계산으로 캐시 재생성
      const result = memoizedGridSnap(mockPosition as any, gridSize, gridDivisions);

      expect(result).toBeDefined();
    });
  });
});
