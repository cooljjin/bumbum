import React, { Component, ErrorInfo, ReactNode } from 'react';
import { handleError, ErrorType, ErrorSeverity } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * 🛡️ React 에러 바운더리 컴포넌트
 * 컴포넌트 트리에서 발생하는 JavaScript 에러를 포착하고 처리
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 에러가 발생했을 때 상태를 업데이트
    return {
      hasError: true,
      error
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 정보를 상태에 저장
    this.setState({
      errorInfo,
      errorId: `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // 에러 처리 및 로깅
    const result = handleError(
      error,
      ErrorType.RENDER_ERROR,
      ErrorSeverity.HIGH,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
        errorId: this.state.errorId
      }
    );

    // 사용자 정의 에러 핸들러 호출
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('사용자 정의 에러 핸들러 실패:', handlerError);
      }
    }

    // 에러 통계 로깅
    console.group('🚨 ErrorBoundary 에러 정보');
    console.error('에러:', error);
    console.error('에러 정보:', errorInfo);
    console.error('에러 ID:', this.state.errorId);
    console.error('복구 가능:', result.recovered);
    console.error('사용자 액션 필요:', result.userActionRequired);
    console.groupEnd();
  }

  override componentDidUpdate(prevProps: Props) {
    // props가 변경되면 에러 상태를 리셋 (선택적)
    if (this.props.resetOnPropsChange && this.state.hasError) {
      const propsChanged = JSON.stringify(prevProps) !== JSON.stringify(this.props);
      if (propsChanged) {
        this.resetError();
      }
    }
  }

  /**
   * 🔄 에러 상태 리셋
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  /**
   * 🔄 페이지 새로고침
   */
  refreshPage = () => {
    window.location.reload();
  };

  /**
   * 📧 에러 리포트 전송 (선택적)
   */
  sendErrorReport = () => {
    if (!this.state.error || !this.state.errorInfo) return;

    try {
      const errorReport = {
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        error: {
          name: this.state.error.name,
          message: this.state.error.message,
          stack: this.state.error.stack
        },
        errorInfo: {
          componentStack: this.state.errorInfo.componentStack
        }
      };

      // 에러 리포트를 localStorage에 저장 (나중에 서버로 전송 가능)
      const reports = JSON.parse(localStorage.getItem('bondidi_error_reports') || '[]');
      reports.push(errorReport);
      localStorage.setItem('bondidi_error_reports', JSON.stringify(reports));

      alert('에러 리포트가 저장되었습니다. 문제 해결을 위해 개발팀에 전달하겠습니다.');
    } catch (error) {
      console.error('에러 리포트 저장 실패:', error);
      alert('에러 리포트 저장에 실패했습니다.');
    }
  };

  override render() {
    if (this.state.hasError) {
      // 사용자 정의 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            {/* 에러 아이콘 */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl text-red-600">🚨</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                예상치 못한 오류가 발생했습니다
              </h2>
              <p className="text-gray-600 text-sm">
                애플리케이션에서 문제가 발생했습니다. 아래 옵션 중 하나를 선택해주세요.
              </p>
            </div>

            {/* 에러 세부 정보 (개발 모드에서만 표시) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">에러 세부 정보:</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>에러 ID:</strong> {this.state.errorId}</p>
                  <p><strong>에러 타입:</strong> {this.state.error.name}</p>
                  <p><strong>에러 메시지:</strong> {this.state.error.message}</p>
                  {this.state.errorInfo && (
                    <p><strong>컴포넌트 스택:</strong></p>
                  )}
                </div>
                {this.state.errorInfo && (
                  <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap overflow-auto max-h-32">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* 복구 옵션 */}
            <div className="space-y-3">
              <button
                onClick={this.resetError}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🔄 다시 시도
              </button>

              <button
                onClick={this.refreshPage}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                🔄 페이지 새로고침
              </button>

              <button
                onClick={this.sendErrorReport}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                📧 에러 리포트 전송
              </button>
            </div>

            {/* 도움말 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">💡 문제 해결 팁:</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 페이지를 새로고침해보세요</li>
                <li>• 브라우저 캐시를 정리해보세요</li>
                <li>• 다른 브라우저로 시도해보세요</li>
                <li>• 문제가 지속되면 관리자에게 문의해주세요</li>
              </ul>
            </div>

            {/* 에러 ID 표시 */}
            {this.state.errorId && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  에러 ID: <code className="bg-gray-200 px-1 rounded">{this.state.errorId}</code>
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 에러가 없으면 자식 컴포넌트를 정상적으로 렌더링
    return this.props.children;
  }
}

/**
 * 🎣 에러 바운더리 훅
 * 함수형 컴포넌트에서 에러 상태를 관리할 수 있는 훅
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = React.useState<ErrorInfo | null>(null);

  const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    setError(error);
    setErrorInfo(errorInfo);

    // 에러 로깅 (콘솔에 출력)
    console.error('🚨 ErrorBoundary 에러 발생:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      hook: 'useErrorBoundary'
    });
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
    setErrorInfo(null);
  }, []);

  return {
    error,
    errorInfo,
    hasError: !!error,
    handleError,
    resetError
  };
}

/**
 * 🎯 특정 컴포넌트를 감싸는 에러 바운더리 HOC
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
                <ErrorBoundary fallback={fallback} {...(onError && { onError })}>
        <Component {...props} />
      </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
