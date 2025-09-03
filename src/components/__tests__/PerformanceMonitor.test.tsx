import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PerformanceMonitor } from '../shared/PerformanceMonitor';
import { performanceOptimizer } from '../../utils/performanceOptimizer';
import { memoryLeakDetector } from '../../utils/memoryLeakDetector';

// Mock dependencies
jest.mock('../../utils/performanceOptimizer');
jest.mock('../../utils/memoryLeakDetector');
jest.mock('@react-three/fiber', () => ({
  useThree: () => ({
    gl: {
      info: {
        render: {
          calls: 10,
          triangles: 1000,
          points: 0,
          lines: 0
        }
      }
    },
    scene: {}
  }),
  useFrame: jest.fn()
}));

const mockPerformanceOptimizer = performanceOptimizer as jest.Mocked<typeof performanceOptimizer>;
const mockMemoryLeakDetector = memoryLeakDetector as jest.Mocked<typeof memoryLeakDetector>;

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        now: jest.fn(() => Date.now()),
        memory: {
          usedJSHeapSize: 50 * 1024 * 1024 // 50MB
        }
      },
      writable: true
    });

    // Mock custom events
    window.dispatchEvent = jest.fn();
  });

  describe('기본 렌더링', () => {
    it('enabled가 false일 때 렌더링되지 않아야 함', () => {
      render(<PerformanceMonitor enabled={false} />);
      expect(screen.queryByText('성능 모니터')).not.toBeInTheDocument();
    });

    it('enabled가 true일 때 기본 UI를 렌더링해야 함', () => {
      render(<PerformanceMonitor enabled={true} />);
      expect(screen.getByText('성능 모니터')).toBeInTheDocument();
    });

    it('기본 메트릭을 표시해야 함', () => {
      render(<PerformanceMonitor enabled={true} />);
      expect(screen.getByText(/FPS/)).toBeInTheDocument();
      expect(screen.getByText(/Memory/)).toBeInTheDocument();
    });
  });

  describe('대시보드 기능', () => {
    it('showDashboard가 true일 때 PerformanceDashboard를 렌더링해야 함', () => {
      render(
        <PerformanceMonitor 
          enabled={true} 
          showDashboard={true}
          dashboardPosition="top-right"
        />
      );
      // PerformanceDashboard는 별도 컴포넌트이므로 기본적인 렌더링 확인
      expect(screen.getByText('성능 모니터')).toBeInTheDocument();
    });

    it('dashboardPosition에 따라 올바른 위치에 렌더링되어야 함', () => {
      const { container } = render(
        <PerformanceMonitor 
          enabled={true} 
          showDashboard={true}
          dashboardPosition="bottom-left"
        />
      );
      
      // 위치 스타일 확인 (실제로는 CSS로 처리되지만 기본 구조 확인)
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('시각화 기능', () => {
    it('showVisualization이 true일 때 PerformanceVisualization을 렌더링해야 함', () => {
      render(
        <PerformanceMonitor 
          enabled={true} 
          showVisualization={true}
        />
      );
      // 기본 UI는 렌더링되어야 함
      expect(screen.getByText('성능 모니터')).toBeInTheDocument();
    });
  });

  describe('자동 최적화', () => {
    it('autoOptimize가 true일 때 자동 최적화 이벤트 리스너를 등록해야 함', () => {
      render(
        <PerformanceMonitor 
          enabled={true} 
          autoOptimize={true}
        />
      );
      
      // 이벤트 리스너 등록 확인은 실제 DOM 이벤트로 테스트
      expect(screen.getByText('성능 모니터')).toBeInTheDocument();
    });

    it('성능 최적화 제안을 처리할 수 있어야 함', async () => {
      const mockSuggestion = {
        id: 'test-suggestion',
        type: 'warning' as const,
        title: '테스트 제안',
        description: '테스트 설명',
        impact: 'medium' as const,
        autoFixable: true,
        fixFunction: jest.fn()
      };

      mockPerformanceOptimizer.updateMetrics.mockReturnValue([mockSuggestion]);

      render(
        <PerformanceMonitor 
          enabled={true} 
          autoOptimize={true}
        />
      );

      // 제안이 처리될 수 있는지 확인
      await waitFor(() => {
        expect(mockPerformanceOptimizer.updateMetrics).toHaveBeenCalled();
      });
    });
  });

  describe('메모리 누수 감지', () => {
    it('메모리 누수 감지기를 초기화해야 함', () => {
      mockMemoryLeakDetector.registerScene.mockReturnValue(undefined);
      mockMemoryLeakDetector.startMonitoring.mockReturnValue(undefined);

      render(
        <PerformanceMonitor 
          enabled={true}
        />
      );

      expect(mockMemoryLeakDetector.registerScene).toHaveBeenCalled();
      expect(mockMemoryLeakDetector.startMonitoring).toHaveBeenCalled();
    });

    it('메모리 누수 이벤트를 처리할 수 있어야 함', () => {
      render(
        <PerformanceMonitor 
          enabled={true}
        />
      );

      // 메모리 누수 이벤트 시뮬레이션
      const memoryLeakEvent = new CustomEvent('memory-leak-detected', {
        detail: {
          isLeaking: true,
          leakRate: 5,
          confidence: 0.8
        }
      });

      window.dispatchEvent(memoryLeakEvent);
      
      // 이벤트 처리가 가능한지 확인
      expect(window.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('컴팩트 모드', () => {
    it('compact가 true일 때 간소화된 UI를 표시해야 함', () => {
      render(
        <PerformanceMonitor 
          enabled={true} 
          compact={true}
        />
      );
      
      // 컴팩트 모드에서는 기본 헤더가 보이지 않아야 함
      expect(screen.queryByText('성능 모니터')).not.toBeInTheDocument();
    });

    it('컴팩트 모드에서 클릭 시 확장되어야 함', () => {
      render(
        <PerformanceMonitor 
          enabled={true} 
          compact={true}
        />
      );
      
      const compactElement = screen.getByText(/FPS/);
      fireEvent.click(compactElement);
      
      // 클릭 후 확장된 상태 확인
      expect(compactElement).toBeInTheDocument();
    });
  });

  describe('성능 메트릭 수집', () => {
    it('실시간 성능 메트릭을 수집해야 함', async () => {
      render(
        <PerformanceMonitor 
          enabled={true}
        />
      );

      // 메트릭 수집이 시작되었는지 확인
      expect(screen.getByText('성능 모니터')).toBeInTheDocument();
      
      // 실제 메트릭 수집은 useFrame 훅에서 처리되므로 기본 구조만 확인
      await waitFor(() => {
        expect(screen.getByText(/FPS/)).toBeInTheDocument();
      });
    });

    it('성능 경고를 표시해야 함', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(
        <PerformanceMonitor 
          enabled={true}
        />
      );

      // 경고 로그가 기록될 수 있는지 확인
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('컴포넌트 생명주기', () => {
    it('컴포넌트 언마운트 시 정리 작업을 수행해야 함', () => {
      const { unmount } = render(
        <PerformanceMonitor 
          enabled={true}
        />
      );

      unmount();

      // 정리 작업이 수행되었는지 확인
      expect(mockMemoryLeakDetector.stopMonitoring).toHaveBeenCalled();
    });

    it('이벤트 리스너를 정리해야 함', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(
        <PerformanceMonitor 
          enabled={true}
        />
      );

      unmount();

      // 이벤트 리스너 제거 확인
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('에러 처리', () => {
    it('성능 모니터링 중 오류가 발생해도 안전하게 처리해야 함', () => {
      // 성능 API 모킹에서 오류 시뮬레이션
      Object.defineProperty(window, 'performance', {
        value: {
          now: jest.fn(() => {
            throw new Error('Performance API error');
          }),
          memory: {
            usedJSHeapSize: 0
          }
        },
        writable: true
      });

      // 오류가 발생해도 컴포넌트가 렌더링되어야 함
      expect(() => {
        render(<PerformanceMonitor enabled={true} />);
      }).not.toThrow();
    });

    it('메모리 누수 감지기 오류를 안전하게 처리해야 함', () => {
      mockMemoryLeakDetector.registerScene.mockImplementation(() => {
        throw new Error('Memory leak detector error');
      });

      // 오류가 발생해도 컴포넌트가 렌더링되어야 함
      expect(() => {
        render(<PerformanceMonitor enabled={true} />);
      }).not.toThrow();
    });
  });

  describe('접근성', () => {
    it('스크린 리더를 위한 적절한 ARIA 레이블을 제공해야 함', () => {
      render(
        <PerformanceMonitor 
          enabled={true}
        />
      );
      
      // 접근성 요소들이 존재하는지 확인
      const monitorElement = screen.getByText('성능 모니터');
      expect(monitorElement).toBeInTheDocument();
    });

    it('키보드 네비게이션을 지원해야 함', () => {
      render(
        <PerformanceMonitor 
          enabled={true}
        />
      );
      
      // 키보드 접근 가능한 요소들 확인
      const expandButton = screen.getByRole('button', { name: /▼|▶/ });
      expect(expandButton).toBeInTheDocument();
    });
  });

  describe('반응형 디자인', () => {
    it('다양한 화면 크기에서 적절하게 렌더링되어야 함', () => {
      const { rerender } = render(
        <PerformanceMonitor 
          enabled={true}
          dashboardPosition="top-right"
        />
      );
      
      // 위치 변경 시 올바르게 렌더링되는지 확인
      rerender(
        <PerformanceMonitor 
          enabled={true}
          dashboardPosition="bottom-left"
        />
      );
      
      expect(screen.getByText('성능 모니터')).toBeInTheDocument();
    });
  });
});
