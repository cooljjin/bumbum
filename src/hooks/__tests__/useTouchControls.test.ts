import { renderHook, act } from '@testing-library/react';
import { useTouchControls } from '../useTouchControls';

// Touch 이벤트 모킹
const createTouchEvent = (touches: Array<{ clientX: number; clientY: number }>) => ({
  touches,
  changedTouches: touches,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn()
});

describe('useTouchControls', () => {
  const mockCallbacks = {
    onPinch: jest.fn(),
    onRotate: jest.fn(),
    onPan: jest.fn(),
    onTap: jest.fn(),
    onDoubleTap: jest.fn(),
    onDragStart: jest.fn(),
    onDragMove: jest.fn(),
    onDragEnd: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // 모바일 환경 모킹
    Object.defineProperty(navigator, 'userAgent', {
      value: 'iPhone',
      configurable: true
    });
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      configurable: true
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTouchControls({
      enabled: true,
      callbacks: mockCallbacks
    }));

    expect(result.current.touchState).toEqual({
      isPinching: false,
      isDragging: false,
      startPosition: null,
      startDistance: 0,
      startAngle: 0,
      lastTapTime: 0
    });
    expect(result.current.isMobile).toBe(true);
  });

  it('should detect mobile environment', () => {
    const { result } = renderHook(() => useTouchControls({
      enabled: true,
      callbacks: mockCallbacks
    }));

    expect(result.current.isMobile).toBe(true);
  });

  it('should handle single touch start', () => {
    const { result } = renderHook(() => useTouchControls({
      enabled: true,
      callbacks: mockCallbacks
    }));

    const touchEvent = createTouchEvent([{ clientX: 100, clientY: 200 }]);

    act(() => {
      result.current.touchHandlers.onTouchStart(touchEvent as any);
    });

    expect(result.current.touchState.isDragging).toBe(true);
    expect(result.current.touchState.startPosition).toEqual({ x: 100, y: 200 });
    expect(mockCallbacks.onDragStart).toHaveBeenCalledWith(100, 200);
  });

  it('should handle two finger touch start', () => {
    const { result } = renderHook(() => useTouchControls({
      enabled: true,
      callbacks: mockCallbacks
    }));

    const touchEvent = createTouchEvent([
      { clientX: 100, clientY: 200 },
      { clientX: 200, clientY: 300 }
    ]);

    act(() => {
      result.current.touchHandlers.onTouchStart(touchEvent as any);
    });

    expect(result.current.touchState.isPinching).toBe(true);
    expect(result.current.touchState.startDistance).toBeGreaterThan(0);
    expect(result.current.touchState.startAngle).toBeDefined();
  });

  it('should calculate touch distance correctly', () => {
    const { result } = renderHook(() => useTouchControls({
      enabled: true,
      callbacks: mockCallbacks
    }));

    const touch1 = { clientX: 0, clientY: 0 } as Touch;
    const touch2 = { clientX: 3, clientY: 4 } as Touch;

    const distance = result.current.getTouchDistance(touch1, touch2);
    expect(distance).toBe(5); // 3-4-5 삼각형
  });

  it('should not process touches when disabled', () => {
    const { result } = renderHook(() => useTouchControls({
      enabled: false,
      callbacks: mockCallbacks
    }));

    const touchEvent = createTouchEvent([{ clientX: 100, clientY: 200 }]);

    act(() => {
      result.current.touchHandlers.onTouchStart(touchEvent as any);
    });

    expect(result.current.touchState.isDragging).toBe(false);
    expect(mockCallbacks.onDragStart).not.toHaveBeenCalled();
  });

  it('should handle touch end correctly', () => {
    const { result } = renderHook(() => useTouchControls({
      enabled: true,
      callbacks: mockCallbacks
    }));

    // 먼저 드래그 시작
    const startEvent = createTouchEvent([{ clientX: 100, clientY: 200 }]);
    act(() => {
      result.current.touchHandlers.onTouchStart(startEvent as any);
    });

    // 터치 종료
    const endEvent = createTouchEvent([]);
    act(() => {
      result.current.touchHandlers.onTouchEnd(endEvent as any);
    });

    expect(result.current.touchState.isDragging).toBe(false);
    expect(result.current.touchState.startPosition).toBeNull();
    expect(mockCallbacks.onDragEnd).toHaveBeenCalled();
  });
});
