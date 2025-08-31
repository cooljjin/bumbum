import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

const NormalComponent = () => <div>Normal component</div>;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal component')).toBeInTheDocument();
  });

  it('renders error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('예상치 못한 오류가 발생했습니다')).toBeInTheDocument();
  });

  it('renders custom error message when provided', () => {
    const customError = 'Custom error message';
    render(
      <ErrorBoundary fallback={<div>{customError}</div>}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(customError)).toBeInTheDocument();
  });

  it('renders error details when in development mode', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('에러 세부 정보:')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders retry button when provided', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    const retryButton = screen.getByText('🔄 다시 시도');
    expect(retryButton).toBeInTheDocument();
  });

  it('resets error state when retry button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    const retryButton = screen.getByText('🔄 다시 시도');
    fireEvent.click(retryButton);
    expect(screen.queryByText('예상치 못한 오류가 발생했습니다')).not.toBeInTheDocument();
  });

  it('renders all action buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('🔄 다시 시도')).toBeInTheDocument();
    expect(screen.getByText('🔄 페이지 새로고침')).toBeInTheDocument();
    expect(screen.getByText('📧 에러 리포트 전송')).toBeInTheDocument();
  });

  it('renders error ID', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/에러 ID:/)).toBeInTheDocument();
  });

  it('renders troubleshooting tips', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('💡 문제 해결 팁:')).toBeInTheDocument();
    expect(screen.getByText('• 페이지를 새로고침해보세요')).toBeInTheDocument();
  });

  it('handles error logging correctly', () => {
    const consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(consoleGroupSpy).toHaveBeenCalledWith('🚨 ErrorBoundary 에러 정보');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleGroupEndSpy).toHaveBeenCalled();
    
    consoleGroupSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  it('handles multiple errors correctly', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Normal component')).toBeInTheDocument();
    
    rerender(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('예상치 못한 오류가 발생했습니다')).toBeInTheDocument();
  });

  it('maintains error state across re-renders', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('예상치 못한 오류가 발생했습니다')).toBeInTheDocument();
    
    rerender(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );
    
    // 에러 상태가 유지되어야 함
    expect(screen.getByText('예상치 못한 오류가 발생했습니다')).toBeInTheDocument();
  });
});
