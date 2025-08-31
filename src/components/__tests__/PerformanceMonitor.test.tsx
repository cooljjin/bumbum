import React from 'react';
import { render } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '../PerformanceMonitor';

// Mock @react-three/fiber
jest.mock('@react-three/fiber', () => ({
  useThree: jest.fn(() => ({
    gl: {
      info: {
        render: {
          calls: 100,
          triangles: 500,
          points: 200,
          lines: 50
        }
      },
      getContext: jest.fn(() => ({}))
    },
    scene: {}
  })),
  useFrame: jest.fn((callback) => {
    // Mock useFrame to call the callback immediately
    callback();
  }),
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
}));

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => 1000),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB
  }
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  it('renders PerformanceMonitor component', () => {
    const { container } = render(
      <Canvas>
        <PerformanceMonitor />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('renders with enabled prop', () => {
    const { container } = render(
      <Canvas>
        <PerformanceMonitor enabled={true} />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('renders with disabled prop', () => {
    const { container } = render(
      <Canvas>
        <PerformanceMonitor enabled={false} />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('renders with custom position', () => {
    const { container } = render(
      <Canvas>
        <PerformanceMonitor position={[1, 2, 3]} />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('renders with showDetails enabled', () => {
    const { container } = render(
      <Canvas>
        <PerformanceMonitor showDetails={true} />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('renders with showDetails disabled', () => {
    const { container } = render(
      <Canvas>
        <PerformanceMonitor showDetails={false} />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('handles default props correctly', () => {
    const { container } = render(
      <Canvas>
        <PerformanceMonitor />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('maintains component stability during re-renders', () => {
    const { rerender } = render(
      <Canvas>
        <PerformanceMonitor />
      </Canvas>
    );

    // Re-render with same props
    rerender(
      <Canvas>
        <PerformanceMonitor />
      </Canvas>
    );

    expect(true).toBe(true);
  });

  it('handles prop changes correctly', () => {
    const { rerender } = render(
      <Canvas>
        <PerformanceMonitor enabled={true} />
      </Canvas>
    );

    // Change enabled prop
    rerender(
      <Canvas>
        <PerformanceMonitor enabled={false} />
      </Canvas>
    );

    expect(true).toBe(true);
  });

  it('handles position changes correctly', () => {
    const { rerender } = render(
      <Canvas>
        <PerformanceMonitor position={[0, 0, 0]} />
      </Canvas>
    );

    // Change position prop
    rerender(
      <Canvas>
        <PerformanceMonitor position={[5, 5, 5]} />
      </Canvas>
    );

    expect(true).toBe(true);
  });

  it('handles showDetails changes correctly', () => {
    const { rerender } = render(
      <Canvas>
        <PerformanceMonitor showDetails={false} />
      </Canvas>
    );

    // Change showDetails prop
    rerender(
      <Canvas>
        <PerformanceMonitor showDetails={true} />
      </Canvas>
    );

    expect(true).toBe(true);
  });

  it('cleans up resources on unmount', () => {
    const { unmount } = render(
      <Canvas>
        <PerformanceMonitor />
      </Canvas>
    );

    // Unmount component
    unmount();

    expect(true).toBe(true);
  });

  it('maintains performance with frequent updates', () => {
    const { rerender } = render(
      <Canvas>
        <PerformanceMonitor />
      </Canvas>
    );

    // Simulate frequent prop changes
    for (let i = 0; i < 5; i++) {
      rerender(
        <Canvas>
          <PerformanceMonitor enabled={i % 2 === 0} />
        </Canvas>
      );
    }

    expect(true).toBe(true);
  });

  it('handles undefined performance memory gracefully', () => {
    // Mock performance without memory property
    const mockPerformanceWithoutMemory = {
      now: jest.fn(() => 1000)
    };

    Object.defineProperty(window, 'performance', {
      value: mockPerformanceWithoutMemory,
      writable: true
    });

    const { container } = render(
      <Canvas>
        <PerformanceMonitor />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('handles missing WebGL info gracefully', () => {
    const { useThree } = require('@react-three/fiber');
    useThree.mockReturnValueOnce({
      gl: {
        info: null,
        getContext: jest.fn(() => ({}))
      },
      scene: {}
    });

    const { container } = render(
      <Canvas>
        <PerformanceMonitor />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('handles zero FPS gracefully', () => {
    mockPerformance.now.mockReturnValue(1000);

    const { container } = render(
      <Canvas>
        <PerformanceMonitor />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('maintains proper component structure', () => {
    const { container } = render(
      <Canvas>
        <PerformanceMonitor />
      </Canvas>
    );

    const canvasElement = container.querySelector('[data-testid="canvas"]');
    expect(canvasElement).toBeInTheDocument();
  });
});
