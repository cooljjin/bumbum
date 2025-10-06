'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';

interface Props {
  children: ReactNode;
  /** 에러 발생 시 표시할 제목 */
  errorTitle?: string;
  /** 에러 발생 시 표시할 메시지 */
  errorMessage?: string;
  /** 에러 발생 시 콜백 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 에러 콜백 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          title={this.props.errorTitle}
          error={this.props.errorMessage || this.state.error?.message}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
