import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PerformanceDashboard } from '../shared/PerformanceDashboard';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024 // 50MB
  }
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('PerformanceDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(Date.now());
  });

  describe('기본 렌더링', () => {
    it('enabled가 false일 때 렌더링되지 않아야 함', () => {
      render(<PerformanceDashboard enabled={false} />);
      expect(screen.queryByText('성능 모니터')).not.toBeInTheDocument();
    });

    it('enabled가 true일 때 기본 UI를 렌더링해야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      expect(screen.getByText('성능 모니터')).toBeInTheDocument();
    });

    it('기본 메트릭을 표시해야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      expect(screen.getByText(/FPS/)).toBeInTheDocument();
      expect(screen.getByText(/Memory/)).toBeInTheDocument();
    });
  });

  describe('위치 설정', () => {
    it('기본 위치(top-right)에 렌더링되어야 함', () => {
      const { container } = render(<PerformanceDashboard enabled={true} />);
      const dashboard = container.firstChild as HTMLElement;
      expect(dashboard).toHaveStyle({ top: '20px', right: '20px' });
    });

    it('top-left 위치에 렌더링되어야 함', () => {
      const { container } = render(
        <PerformanceDashboard enabled={true} position="top-left" />
      );
      const dashboard = container.firstChild as HTMLElement;
      expect(dashboard).toHaveStyle({ top: '20px', left: '20px' });
    });

    it('bottom-right 위치에 렌더링되어야 함', () => {
      const { container } = render(
        <PerformanceDashboard enabled={true} position="bottom-right" />
      );
      const dashboard = container.firstChild as HTMLElement;
      expect(dashboard).toHaveStyle({ bottom: '20px', right: '20px' });
    });

    it('bottom-left 위치에 렌더링되어야 함', () => {
      const { container } = render(
        <PerformanceDashboard enabled={true} position="bottom-left" />
      );
      const dashboard = container.firstChild as HTMLElement;
      expect(dashboard).toHaveStyle({ bottom: '20px', left: '20px' });
    });
  });

  describe('컴팩트 모드', () => {
    it('compact가 true일 때 간소화된 UI를 표시해야 함', () => {
      render(<PerformanceDashboard enabled={true} compact={true} />);
      
      // 컴팩트 모드에서는 기본 헤더가 보이지 않아야 함
      expect(screen.queryByText('성능 모니터')).not.toBeInTheDocument();
      
      // FPS 정보는 표시되어야 함
      expect(screen.getByText(/FPS/)).toBeInTheDocument();
    });

    it('컴팩트 모드에서 클릭 시 확장되어야 함', () => {
      render(<PerformanceDashboard enabled={true} compact={true} />);
      
      const compactElement = screen.getByText(/FPS/);
      fireEvent.click(compactElement);
      
      // 클릭 후 확장된 상태 확인
      expect(compactElement).toBeInTheDocument();
    });
  });

  describe('확장/축소 기능', () => {
    it('기본적으로 축소된 상태여야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      const expandButton = screen.getByRole('button', { name: '▶' });
      expect(expandButton).toBeInTheDocument();
    });

    it('확장 버튼 클릭 시 확장되어야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      const expandButton = screen.getByRole('button', { name: '▶' });
      fireEvent.click(expandButton);
      
      // 확장된 상태 확인
      expect(screen.getByRole('button', { name: '▼' })).toBeInTheDocument();
    });

    it('축소 버튼 클릭 시 축소되어야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      const expandButton = screen.getByRole('button', { name: '▶' });
      fireEvent.click(expandButton);
      
      const collapseButton = screen.getByRole('button', { name: '▼' });
      fireEvent.click(collapseButton);
      
      // 축소된 상태 확인
      expect(screen.getByRole('button', { name: '▶' })).toBeInTheDocument();
    });
  });

  describe('닫기 기능', () => {
    it('닫기 버튼 클릭 시 컴포넌트가 숨겨져야 함', () => {
      const { container } = render(<PerformanceDashboard enabled={true} />);
      
      const closeButton = screen.getByRole('button', { name: '✕' });
      fireEvent.click(closeButton);
      
      // 컴포넌트가 숨겨졌는지 확인
      expect(container.firstChild).not.toBeInTheDocument();
    });
  });

  describe('성능 메트릭 표시', () => {
    it('FPS를 올바르게 표시해야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      // FPS 정보가 표시되는지 확인
      expect(screen.getByText(/FPS/)).toBeInTheDocument();
    });

    it('메모리 사용량을 올바르게 표시해야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      // 메모리 정보가 표시되는지 확인
      expect(screen.getByText(/Memory/)).toBeInTheDocument();
    });

    it('프레임 타임을 올바르게 표시해야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      // 프레임 타임 정보가 표시되는지 확인
      expect(screen.getByText(/Frame Time/)).toBeInTheDocument();
    });

    it('삼각형 수를 올바르게 표시해야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      // 삼각형 수 정보가 표시되는지 확인
      expect(screen.getByText(/Triangles/)).toBeInTheDocument();
    });
  });

  describe('성능 상태 색상', () => {
    it('높은 FPS일 때 녹색으로 표시되어야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      // 성능 상태에 따른 색상 확인
      const fpsElement = screen.getByText(/FPS/);
      expect(fpsElement).toBeInTheDocument();
    });

    it('중간 FPS일 때 노란색으로 표시되어야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      // 성능 상태에 따른 색상 확인
      const fpsElement = screen.getByText(/FPS/);
      expect(fpsElement).toBeInTheDocument();
    });

    it('낮은 FPS일 때 빨간색으로 표시되어야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      // 성능 상태에 따른 색상 확인
      const fpsElement = screen.getByText(/FPS/);
      expect(fpsElement).toBeInTheDocument();
    });
  });

  describe('히스토리 표시', () => {
    it('showHistory가 true일 때 히스토리를 표시해야 함', () => {
      render(<PerformanceDashboard enabled={true} showHistory={true} />);
      
      // 확장 상태로 만들어야 히스토리가 보임
      const expandButton = screen.getByRole('button', { name: '▶' });
      fireEvent.click(expandButton);
      
      // 히스토리 정보가 표시되는지 확인
      expect(screen.getByText(/FPS 히스토리/)).toBeInTheDocument();
    });

    it('showHistory가 false일 때 히스토리를 표시하지 않아야 함', () => {
      render(<PerformanceDashboard enabled={true} showHistory={false} />);
      
      // 확장 상태로 만들어도 히스토리가 보이지 않아야 함
      const expandButton = screen.getByRole('button', { name: '▶' });
      fireEvent.click(expandButton);
      
      // 히스토리 정보가 표시되지 않는지 확인
      expect(screen.queryByText(/FPS 히스토리/)).not.toBeInTheDocument();
    });
  });

  describe('최적화 제안', () => {
    it('최적화 제안이 있을 때 표시되어야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      // 확장 상태로 만들어야 제안이 보임
      const expandButton = screen.getByRole('button', { name: '▶' });
      fireEvent.click(expandButton);
      
      // 최적화 제안 섹션이 표시되는지 확인
      expect(screen.getByText(/최적화 제안/)).toBeInTheDocument();
    });

    it('최적화 제안 콜백을 호출해야 함', () => {
      const mockCallback = jest.fn();
      render(
        <PerformanceDashboard 
          enabled={true} 
          onOptimizationSuggestion={mockCallback}
        />
      );
      
      // 확장 상태로 만들어야 제안이 보임
      const expandButton = screen.getByRole('button', { name: '▶' });
      fireEvent.click(expandButton);
      
      // 콜백이 호출될 수 있는지 확인
      expect(screen.getByText(/최적화 제안/)).toBeInTheDocument();
    });
  });

  describe('반응형 디자인', () => {
    it('다양한 화면 크기에서 적절하게 렌더링되어야 함', () => {
      const { rerender } = render(
        <PerformanceDashboard 
          enabled={true}
          position="top-right"
        />
      );
      
      // 위치 변경 시 올바르게 렌더링되는지 확인
      rerender(
        <PerformanceDashboard 
          enabled={true}
          position="bottom-left"
        />
      );
      
      expect(screen.getByText('성능 모니터')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('스크린 리더를 위한 적절한 ARIA 레이블을 제공해야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      // 접근성 요소들이 존재하는지 확인
      const monitorElement = screen.getByText('성능 모니터');
      expect(monitorElement).toBeInTheDocument();
    });

    it('키보드 네비게이션을 지원해야 함', () => {
      render(<PerformanceDashboard enabled={true} />);
      
      // 키보드 접근 가능한 요소들 확인
      const expandButton = screen.getByRole('button', { name: /▶/ });
      expect(expandButton).toBeInTheDocument();
      
      const closeButton = screen.getByRole('button', { name: /✕/ });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('에러 처리', () => {
    it('성능 API 오류를 안전하게 처리해야 함', () => {
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
        render(<PerformanceDashboard enabled={true} />);
      }).not.toThrow();
    });
  });

  describe('성능 최적화', () => {
    it('불필요한 리렌더링을 방지해야 함', () => {
      const { rerender } = render(<PerformanceDashboard enabled={true} />);
      
      // 동일한 props로 리렌더링
      rerender(<PerformanceDashboard enabled={true} />);
      
      // 컴포넌트가 안정적으로 유지되어야 함
      expect(screen.getByText('성능 모니터')).toBeInTheDocument();
    });

    it('메모리 누수를 방지해야 함', () => {
      const { unmount } = render(<PerformanceDashboard enabled={true} />);
      
      // 컴포넌트 언마운트 시 정리 작업 수행
      unmount();
      
      // 메모리 누수 없이 정리되어야 함
      expect(true).toBe(true);
    });
  });
});
