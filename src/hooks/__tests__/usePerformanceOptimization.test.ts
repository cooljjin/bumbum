import { renderHook, act } from '@testing-library/react';
import { usePerformanceOptimization } from '../usePerformanceOptimization';

// Three.js 모듈 모킹
jest.mock('three', () => ({
  Frustum: jest.fn(() => ({})),
  Matrix4: jest.fn(() => ({})),
  Vector3: jest.fn(() => ({})),
}));

// @react-three/fiber 모킹
jest.mock('@react-three/fiber', () => ({
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({
    camera: { position: { distanceTo: jest.fn(() => 10) } },
    gl: {},
    scene: { traverse: jest.fn() },
  })),
}));

describe('usePerformanceOptimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns initial performance optimization state', () => {
    const { result } = renderHook(() => usePerformanceOptimization());

    expect(result.current.calculateLODLevel).toBeDefined();
    expect(result.current.adjustQualityDynamically).toBeDefined();
    expect(result.current.isInFrustum).toBeDefined();
    expect(result.current.cleanupMemory).toBeDefined();
    expect(result.current.lodSettings).toBeDefined();
  });

  it('calculates LOD level correctly', () => {
    const { result } = renderHook(() => usePerformanceOptimization());

    const mockPosition = { x: 0, y: 0, z: 0 };
    const lodLevel = result.current.calculateLODLevel(mockPosition as any);

    expect(lodLevel).toBeDefined();
    expect(['high', 'medium', 'low', 'cull']).toContain(lodLevel);
  });

  it('adjusts quality dynamically', () => {
    const { result } = renderHook(() => usePerformanceOptimization());

    const qualitySettings = result.current.adjustQualityDynamically();

    expect(qualitySettings).toBeDefined();
    expect(qualitySettings.near).toBeDefined();
    expect(qualitySettings.medium).toBeDefined();
    expect(qualitySettings.far).toBeDefined();
    expect(qualitySettings.cull).toBeDefined();
  });

  it('checks if object is in frustum', () => {
    const { result } = renderHook(() => usePerformanceOptimization());

    const mockObject = {};
    const isVisible = result.current.isInFrustum(mockObject as any);

    expect(typeof isVisible).toBe('boolean');
  });

  it('cleans up memory', () => {
    const { result } = renderHook(() => usePerformanceOptimization());

    expect(() => {
      result.current.cleanupMemory();
    }).not.toThrow();
  });

  it('provides LOD settings', () => {
    const { result } = renderHook(() => usePerformanceOptimization());

    const settings = result.current.lodSettings;
    expect(settings.near).toBe(5);
    expect(settings.medium).toBe(15);
    expect(settings.far).toBe(30);
    expect(settings.cull).toBe(50);
  });

  it('handles custom LOD settings', () => {
    const customSettings = {
      near: 10,
      medium: 20,
      far: 40,
      cull: 60
    };

    const { result } = renderHook(() => usePerformanceOptimization(customSettings));

    const settings = result.current.lodSettings;
    expect(settings.near).toBe(10);
    expect(settings.medium).toBe(20);
    expect(settings.far).toBe(40);
    expect(settings.cull).toBe(60);
  });

  it('handles performance monitoring', () => {
    const { result } = renderHook(() => usePerformanceOptimization(undefined, true));

    expect(result.current.calculateLODLevel).toBeDefined();
    expect(result.current.adjustQualityDynamically).toBeDefined();
  });

  it('handles disabled performance monitoring', () => {
    const { result } = renderHook(() => usePerformanceOptimization(undefined, false));

    expect(result.current.calculateLODLevel).toBeDefined();
    expect(result.current.adjustQualityDynamically).toBeDefined();
  });

  it('maintains consistent function references', () => {
    const { result, rerender } = renderHook(() => usePerformanceOptimization());

    const firstCalculateLOD = result.current.calculateLODLevel;
    const firstAdjustQuality = result.current.adjustQualityDynamically;

    rerender();

    expect(result.current.calculateLODLevel).toBe(firstCalculateLOD);
    expect(result.current.adjustQualityDynamically).toBe(firstAdjustQuality);
  });

  it('handles edge cases gracefully', () => {
    const { result } = renderHook(() => usePerformanceOptimization());

    // 빈 객체로 테스트
    const emptyObject = {};
    expect(() => {
      result.current.isInFrustum(emptyObject as any);
    }).not.toThrow();

    // null 값으로 테스트
    const nullPosition = null;
    expect(() => {
      result.current.calculateLODLevel(nullPosition as any);
    }).not.toThrow();
  });
});
