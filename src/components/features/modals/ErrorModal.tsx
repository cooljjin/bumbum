import React, { useState, useEffect } from 'react';
import { ErrorType, ErrorSeverity, attemptRecovery } from '../../../utils/errorHandler';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: Error | null;
  errorType?: ErrorType;
  severity?: ErrorSeverity;
  context?: Record<string, any>;
  onRecoveryAttempt?: (success: boolean) => void;
}

// 에러 아이콘 매핑
const ERROR_ICONS: Record<ErrorType, string> = {
  [ErrorType.MODEL_LOADING]: '📦',
  [ErrorType.MEMORY_LOW]: '💾',
  [ErrorType.NETWORK_ERROR]: '🌐',
  [ErrorType.RENDER_ERROR]: '🎨',
  [ErrorType.VALIDATION_ERROR]: '✅',
  [ErrorType.UNKNOWN_ERROR]: '❓'
};

// 에러 색상 매핑
const ERROR_COLORS: Record<ErrorSeverity, string> = {
  [ErrorSeverity.LOW]: 'blue',
  [ErrorSeverity.MEDIUM]: 'yellow',
  [ErrorSeverity.HIGH]: 'orange',
  [ErrorSeverity.CRITICAL]: 'red'
};

// 에러 제목 매핑
const ERROR_TITLES: Record<ErrorType, string> = {
  [ErrorType.MODEL_LOADING]: '모델 로딩 오류',
  [ErrorType.MEMORY_LOW]: '메모리 부족',
  [ErrorType.NETWORK_ERROR]: '네트워크 연결 오류',
  [ErrorType.RENDER_ERROR]: '렌더링 오류',
  [ErrorType.VALIDATION_ERROR]: '데이터 검증 오류',
  [ErrorType.UNKNOWN_ERROR]: '알 수 없는 오류'
};

// 에러 설명 매핑
const ERROR_DESCRIPTIONS: Record<ErrorType, string> = {
  [ErrorType.MODEL_LOADING]: '가구 모델을 불러오는 중 문제가 발생했습니다.',
  [ErrorType.MEMORY_LOW]: '시스템 메모리가 부족하여 성능이 저하될 수 있습니다.',
  [ErrorType.NETWORK_ERROR]: '인터넷 연결에 문제가 있어 일부 기능이 제한될 수 있습니다.',
  [ErrorType.RENDER_ERROR]: '화면 렌더링에 문제가 발생했습니다.',
  [ErrorType.VALIDATION_ERROR]: '입력된 데이터에 문제가 있습니다.',
  [ErrorType.UNKNOWN_ERROR]: '예상치 못한 오류가 발생했습니다.'
};

/**
 * 🚨 사용자 친화적 에러 표시 모달
 * 에러 상황을 명확히 전달하고 복구 방법을 제시
 */
export default function ErrorModal({
  isOpen,
  onClose,
  error,
  errorType = ErrorType.UNKNOWN_ERROR,
  severity = ErrorSeverity.MEDIUM,
  context,
  onRecoveryAttempt
}: ErrorModalProps) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState<boolean | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // 에러가 변경되면 복구 상태 리셋
  useEffect(() => {
    if (error) {
      setRecoverySuccess(null);
      setIsRecovering(false);
    }
  }, [error]);

  if (!isOpen || !error) return null;

  const icon = ERROR_ICONS[errorType];
  const color = ERROR_COLORS[severity];
  const title = ERROR_TITLES[errorType];
  const description = ERROR_DESCRIPTIONS[errorType];

  /**
   * 🔄 자동 복구 시도
   */
  const handleAutoRecovery = async () => {
    setIsRecovering(true);
    setRecoverySuccess(null);

    try {
      const success = await attemptRecovery(errorType);
      setRecoverySuccess(success);

      if (onRecoveryAttempt) {
        onRecoveryAttempt(success);
      }

      if (success) {
        // 복구 성공 시 잠시 후 모달 닫기
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('복구 시도 실패:', error);
      setRecoverySuccess(false);
    } finally {
      setIsRecovering(false);
    }
  };

  /**
   * 🔄 페이지 새로고침
   */
  const handleRefresh = () => {
    if (confirm('페이지를 새로고침하시겠습니까? 현재 작업 내용이 저장되지 않을 수 있습니다.')) {
      window.location.reload();
    }
  };

  /**
   * 📧 에러 리포트 전송
   */
  const handleSendReport = () => {
    try {
      const errorReport = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorType,
        severity,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context
      };

      // 에러 리포트를 localStorage에 저장
      const reports = JSON.parse(localStorage.getItem('bondidi_error_reports') || '[]');
      reports.push(errorReport);
      localStorage.setItem('bondidi_error_reports', JSON.stringify(reports));

      alert('에러 리포트가 저장되었습니다. 문제 해결을 위해 개발팀에 전달하겠습니다.');
    } catch (error) {
      console.error('에러 리포트 저장 실패:', error);
      alert('에러 리포트 저장에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className={`bg-${color}-500 text-white p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{icon}</span>
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-sm opacity-90">{description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {/* 에러 메시지 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">오류 내용</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{error.message}</p>
            </div>
          </div>

          {/* 복구 상태 표시 */}
          {isRecovering && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                <span className="text-blue-700 font-medium">자동 복구를 시도하고 있습니다...</span>
              </div>
            </div>
          )}

          {recoverySuccess !== null && (
            <div className={`mb-6 p-4 rounded-lg ${
              recoverySuccess ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {recoverySuccess ? '✅' : '❌'}
                </span>
                <span className={`font-medium ${
                  recoverySuccess ? 'text-green-700' : 'text-red-700'
                }`}>
                  {recoverySuccess
                    ? '복구가 완료되었습니다! 잠시 후 모달이 닫힙니다.'
                    : '자동 복구에 실패했습니다. 수동으로 복구해주세요.'
                  }
                </span>
              </div>
            </div>
          )}

          {/* 복구 옵션 */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleAutoRecovery}
              disabled={isRecovering}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                isRecovering
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              🔄 자동 복구 시도
            </button>

            <button
              onClick={handleRefresh}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              🔄 페이지 새로고침
            </button>
          </div>

          {/* 상세 정보 토글 */}
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
            >
              <span>{showDetails ? '▼' : '▶'}</span>
              {showDetails ? '상세 정보 숨기기' : '상세 정보 보기'}
            </button>
          </div>

          {/* 상세 정보 */}
          {showDetails && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">상세 정보:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>에러 타입:</strong> {errorType}</p>
                <p><strong>심각도:</strong> {severity}</p>
                <p><strong>에러 이름:</strong> {error.name}</p>
                <p><strong>발생 시간:</strong> {new Date().toLocaleString()}</p>
                {context && Object.keys(context).length > 0 && (
                  <div>
                    <p><strong>컨텍스트:</strong></p>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {JSON.stringify(context, null, 2)}
                    </pre>
                  </div>
                )}
                {error.stack && (
                  <div>
                    <p><strong>스택 트레이스:</strong></p>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 추가 액션 */}
          <div className="flex gap-3">
            <button
              onClick={handleSendReport}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              📧 에러 리포트 전송
            </button>

            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              닫기
            </button>
          </div>
        </div>

        {/* 푸터 - 도움말 */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-2">💡 문제 해결 팁:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 자동 복구를 먼저 시도해보세요</li>
            <li>• 문제가 지속되면 페이지를 새로고침해보세요</li>
            <li>• 브라우저 캐시를 정리해보세요</li>
            <li>• 다른 브라우저로 시도해보세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * 🎣 에러 모달 훅
 * 함수형 컴포넌트에서 에러 모달을 쉽게 사용할 수 있는 훅
 */
export function useErrorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(ErrorType.UNKNOWN_ERROR);
  const [severity, setSeverity] = useState<ErrorSeverity>(ErrorSeverity.MEDIUM);
  const [context, setContext] = useState<Record<string, any> | undefined>();

  const showError = (
    error: Error,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    sev: ErrorSeverity = ErrorSeverity.MEDIUM,
    ctx?: Record<string, any>
  ) => {
    setError(error);
    setErrorType(type);
    setSeverity(sev);
    setContext(ctx);
    setIsOpen(true);
  };

  const hideError = () => {
    setIsOpen(false);
    setError(null);
    setContext(undefined);
  };

  return {
    isOpen,
    error,
    errorType,
    severity,
    context,
    showError,
    hideError
  };
}
