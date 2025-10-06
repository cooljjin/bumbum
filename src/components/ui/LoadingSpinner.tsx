'use client';

import React from 'react';

interface LoadingSpinnerProps {
  /** 로딩 메시지 */
  message?: string;
  /** 스피너 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 전체 화면 로딩 여부 */
  fullScreen?: boolean;
  /** 배경 그라데이션 사용 여부 */
  withBackground?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = '로딩 중...',
  size = 'md',
  fullScreen = true,
  withBackground = true
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const spinnerSize = sizeClasses[size];

  const content = (
    <div className="text-center">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-2 ${spinnerSize}`} />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );

  if (fullScreen) {
    const backgroundClasses = withBackground 
      ? 'bg-gradient-to-br from-slate-50 to-slate-100' 
      : '';

    return (
      <div className={`w-full h-full flex items-center justify-center ${backgroundClasses}`}>
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
