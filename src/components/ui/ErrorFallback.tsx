'use client';

import React from 'react';

interface ErrorFallbackProps {
  /** 에러 메시지 */
  error?: string;
  /** 에러 제목 */
  title?: string;
  /** 재시도 함수 */
  onRetry?: () => void;
  /** 전체 화면 에러 여부 */
  fullScreen?: boolean;
  /** 배경 그라데이션 사용 여부 */
  withBackground?: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error = '예상치 못한 오류가 발생했습니다.',
  title = '오류 발생',
  onRetry,
  fullScreen = true,
  withBackground = true
}) => {
  const content = (
    <div className="text-center max-w-md mx-auto">
      <div className="mb-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
        >
          다시 시도
        </button>
      )}
    </div>
  );

  if (fullScreen) {
    const backgroundClasses = withBackground 
      ? 'bg-gradient-to-br from-slate-50 to-slate-100' 
      : '';

    return (
      <div className={`w-full h-full flex items-center justify-center p-4 ${backgroundClasses}`}>
        {content}
      </div>
    );
  }

  return content;
};

export default ErrorFallback;
