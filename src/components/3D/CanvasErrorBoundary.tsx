import React from 'react';

interface CanvasErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class CanvasErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ReactNode }>
> {
  override state: CanvasErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[CanvasErrorBoundary] Caught error:', error);
    console.debug('[CanvasErrorBoundary] Component stack:', info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            3D 렌더러 로드 실패 (Blob 복구 중)
          </div>
        )
      );
    }
    return this.props.children;
  }
}
