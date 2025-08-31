import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorModal, { useErrorModal } from '../features/modals/ErrorModal';
import { ErrorType, ErrorSeverity } from '../../utils/errorHandler';

// Mock error handler
jest.mock('../../utils/errorHandler', () => ({
  ErrorType: {
    MODEL_LOADING: 'MODEL_LOADING',
    MEMORY_LOW: 'MEMORY_LOW',
    NETWORK_ERROR: 'NETWORK_ERROR',
    RENDER_ERROR: 'RENDER_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  },
  ErrorSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  },
  attemptRecovery: jest.fn()
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

describe('ErrorModal', () => {
  const mockOnClose = jest.fn();
  const mockOnRecoveryAttempt = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    error: new Error('Test error message'),
    errorType: ErrorType.MODEL_LOADING,
    severity: ErrorSeverity.MEDIUM,
    context: { component: 'TestComponent', action: 'loadModel' },
    onRecoveryAttempt: mockOnRecoveryAttempt
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
    mockConfirm.mockReturnValue(true);
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ErrorModal {...defaultProps} isOpen={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when error is null', () => {
    const { container } = render(
      <ErrorModal {...defaultProps} error={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders error modal with correct content when open', () => {
    render(<ErrorModal {...defaultProps} />);

    expect(screen.getByText('모델 로딩 오류')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('📦')).toBeInTheDocument();
  });

  it('displays correct error icon based on error type', () => {
    const { rerender } = render(<ErrorModal {...defaultProps} />);

    expect(screen.getByText('📦')).toBeInTheDocument();

    rerender(<ErrorModal {...defaultProps} errorType={ErrorType.NETWORK_ERROR} />);
    expect(screen.getByText('🌐')).toBeInTheDocument();

    rerender(<ErrorModal {...defaultProps} errorType={ErrorType.MEMORY_LOW} />);
    expect(screen.getByText('💾')).toBeInTheDocument();
  });

  it('displays correct error title based on error type', () => {
    const { rerender } = render(<ErrorModal {...defaultProps} />);

    expect(screen.getByText('모델 로딩 오류')).toBeInTheDocument();

    rerender(<ErrorModal {...defaultProps} errorType={ErrorType.NETWORK_ERROR} />);
    expect(screen.getByText('네트워크 연결 오류')).toBeInTheDocument();
  });

  it('applies correct styling based on severity', () => {
    const { rerender } = render(<ErrorModal {...defaultProps} />);

    // Default medium severity should be yellow
    const header = screen.getByText('모델 로딩 오류').closest('div');
    expect(header).toHaveClass('bg-yellow-500');

    rerender(<ErrorModal {...defaultProps} severity={ErrorSeverity.CRITICAL} />);
    expect(header).toHaveClass('bg-red-500');

    rerender(<ErrorModal {...defaultProps} severity={ErrorSeverity.LOW} />);
    expect(header).toHaveClass('bg-blue-500');
  });

  it('calls onClose when close button is clicked', () => {
    render(<ErrorModal {...defaultProps} />);

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles auto recovery attempt', async () => {
    const { attemptRecovery } = require('../../utils/errorHandler');
    attemptRecovery.mockResolvedValue(true);

    render(<ErrorModal {...defaultProps} />);

    const recoveryButton = screen.getByText('🔄 자동 복구 시도');
    fireEvent.click(recoveryButton);

    expect(attemptRecovery).toHaveBeenCalledWith(ErrorType.MODEL_LOADING);

    await waitFor(() => {
      expect(screen.getByText(/복구가 완료되었습니다/)).toBeInTheDocument();
    });

    expect(mockOnRecoveryAttempt).toHaveBeenCalledWith(true);
  });

  it('handles recovery failure', async () => {
    const { attemptRecovery } = require('../../utils/errorHandler');
    attemptRecovery.mockResolvedValue(false);

    render(<ErrorModal {...defaultProps} />);

    const recoveryButton = screen.getByText('🔄 자동 복구 시도');
    fireEvent.click(recoveryButton);

    await waitFor(() => {
      expect(screen.getByText(/자동 복구에 실패했습니다/)).toBeInTheDocument();
    });

    expect(mockOnRecoveryAttempt).toHaveBeenCalledWith(false);
  });

  it('shows loading state during recovery', () => {
    const { attemptRecovery } = require('../../utils/errorHandler');
    attemptRecovery.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

    render(<ErrorModal {...defaultProps} />);

    const recoveryButton = screen.getByText('🔄 자동 복구 시도');
    fireEvent.click(recoveryButton);

    expect(screen.getByText('자동 복구를 시도하고 있습니다...')).toBeInTheDocument();
  });

  it('handles page refresh', () => {
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    render(<ErrorModal {...defaultProps} />);

    const refreshButton = screen.getByText('🔄 페이지 새로고침');
    fireEvent.click(refreshButton);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockReload).toHaveBeenCalled();
  });

  it('cancels page refresh when user declines', () => {
    mockConfirm.mockReturnValue(false);
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    render(<ErrorModal {...defaultProps} />);

    const refreshButton = screen.getByText('🔄 페이지 새로고침');
    fireEvent.click(refreshButton);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockReload).not.toHaveBeenCalled();
  });

  it('sends error report to localStorage', () => {
    render(<ErrorModal {...defaultProps} />);

    const reportButton = screen.getByText('📧 에러 리포트 전송');
    fireEvent.click(reportButton);

    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'bondidi_error_reports',
      expect.any(String)
    );
  });

  it('toggles error details visibility', () => {
    render(<ErrorModal {...defaultProps} />);

    const toggleButton = screen.getByText('▶ 상세 정보 보기');
    fireEvent.click(toggleButton);

    expect(screen.getByText('▶ 상세 정보 숨기기')).toBeInTheDocument();

    // Should show error details
    expect(screen.getByText('상세 정보:')).toBeInTheDocument();
    expect(screen.getByText('에러 타입:')).toBeInTheDocument();
    expect(screen.getByText('심각도:')).toBeInTheDocument();
  });

  it('displays context information when provided', () => {
    render(<ErrorModal {...defaultProps} />);

    const toggleButton = screen.getByText('▶ 상세 정보 보기');
    fireEvent.click(toggleButton);

    expect(screen.getByText('컨텍스트:')).toBeInTheDocument();
    expect(screen.getByText(JSON.stringify(defaultProps.context, null, 2))).toBeInTheDocument();
  });

  it('displays error stack trace when available', () => {
    const errorWithStack = new Error('Test error');
    errorWithStack.stack = 'Error: Test error\n    at TestFunction (test.js:1:1)';

    render(<ErrorModal {...defaultProps} error={errorWithStack} />);

    const toggleButton = screen.getByText(/상세 정보 보기/);
    fireEvent.click(toggleButton);

    expect(screen.getByText('스택 트레이스:')).toBeInTheDocument();
  });

  it('handles error report storage failure gracefully', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    const mockAlert = jest.fn();
    global.alert = mockAlert;

    render(<ErrorModal {...defaultProps} />);

    const reportButton = screen.getByText('📧 에러 리포트 전송');
    fireEvent.click(reportButton);

    expect(mockAlert).toHaveBeenCalledWith('에러 리포트 저장에 실패했습니다.');
  });

  it('closes modal automatically after successful recovery', async () => {
    const { attemptRecovery } = require('../../utils/errorHandler');
    attemptRecovery.mockResolvedValue(true);

    jest.useFakeTimers();

    render(<ErrorModal {...defaultProps} />);

    const recoveryButton = screen.getByText('🔄 자동 복구 시도');
    fireEvent.click(recoveryButton);

    await waitFor(() => {
      expect(screen.getByText('복구가 완료되었습니다!')).toBeInTheDocument();
    });

    // Fast-forward 2 seconds
    jest.advanceTimersByTime(2000);

    expect(mockOnClose).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('resets recovery state when error changes', () => {
    const { rerender } = render(<ErrorModal {...defaultProps} />);

    // Simulate recovery attempt
    const recoveryButton = screen.getByText('🔄 자동 복구 시도');
    fireEvent.click(recoveryButton);

    // Change error
    const newError = new Error('New error');
    rerender(<ErrorModal {...defaultProps} error={newError} />);

    // Recovery state should be reset
    expect(screen.queryByText(/복구가 완료되었습니다/)).not.toBeInTheDocument();
  });

  it('handles all error types correctly', () => {
    Object.values(ErrorType).forEach(errorType => {
      const { rerender } = render(<ErrorModal {...defaultProps} errorType={errorType} />);

      // Should render without crashing
      expect(screen.getByText('Test error message')).toBeInTheDocument();

      if (errorType !== ErrorType.MODEL_LOADING) {
        rerender(<ErrorModal {...defaultProps} errorType={errorType} />);
      }
    });
  });

  it('handles all severity levels correctly', () => {
    Object.values(ErrorSeverity).forEach(severity => {
      const { rerender } = render(<ErrorModal {...defaultProps} severity={severity} />);

      // Should render without crashing
      expect(screen.getByText('Test error message')).toBeInTheDocument();

      if (severity !== ErrorSeverity.MEDIUM) {
        rerender(<ErrorModal {...defaultProps} severity={severity} />);
      }
    });
  });

  it('displays help tips in footer', () => {
    render(<ErrorModal {...defaultProps} />);

    expect(screen.getByText('💡 문제 해결 팁:')).toBeInTheDocument();
    expect(screen.getByText('• 자동 복구를 먼저 시도해보세요')).toBeInTheDocument();
    expect(screen.getByText('• 문제가 지속되면 페이지를 새로고침해보세요')).toBeInTheDocument();
  });

  it('handles missing onRecoveryAttempt callback gracefully', () => {
    const { attemptRecovery } = require('../../utils/errorHandler');
    attemptRecovery.mockResolvedValue(true);

    render(<ErrorModal {...defaultProps} onRecoveryAttempt={undefined} />);

    const recoveryButton = screen.getByText('🔄 자동 복구 시도');
    fireEvent.click(recoveryButton);

    // Should not throw error when callback is missing
    expect(attemptRecovery).toHaveBeenCalled();
  });
});

describe('useErrorModal', () => {
  const TestComponent = () => {
    const {
      isOpen,
      error,
      errorType,
      severity,
      context,
      showError,
      hideError
    } = useErrorModal();

    return (
      <div>
        <button onClick={() => showError(new Error('Test error'), ErrorType.NETWORK_ERROR, ErrorSeverity.HIGH)}>
          Show Error
        </button>
        <button onClick={hideError}>Hide Error</button>

        {isOpen && (
          <ErrorModal
            isOpen={isOpen}
            onClose={hideError}
            error={error}
            errorType={errorType}
            severity={severity}
            context={context}
          />
        )}
      </div>
    );
  };

  it('provides error modal state and controls', () => {
    render(<TestComponent />);

    expect(screen.getByText('Show Error')).toBeInTheDocument();
    expect(screen.getByText('Hide Error')).toBeInTheDocument();
  });

  it('shows error modal when showError is called', () => {
    render(<TestComponent />);

    const showButton = screen.getByText('Show Error');
    fireEvent.click(showButton);

    expect(screen.getByText('네트워크 연결 오류')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('hides error modal when hideError is called', () => {
    render(<TestComponent />);

    const showButton = screen.getByText('Show Error');
    fireEvent.click(showButton);

    expect(screen.getByText('네트워크 연결 오류')).toBeInTheDocument();

    const hideButton = screen.getByText('Hide Error');
    fireEvent.click(hideButton);

    expect(screen.queryByText('네트워크 연결 오류')).not.toBeInTheDocument();
  });

  it('manages error state correctly', () => {
    render(<TestComponent />);

    const showButton = screen.getByText('Show Error');
    fireEvent.click(showButton);

    expect(screen.getByText('Test error')).toBeInTheDocument();

    const hideButton = screen.getByText('Hide Error');
    fireEvent.click(hideButton);

    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
  });
});
