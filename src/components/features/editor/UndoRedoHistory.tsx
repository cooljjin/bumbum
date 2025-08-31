'use client';

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../../store/editorStore';

interface UndoRedoHistoryProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  maxVisible?: number;
}

export const UndoRedoHistory: React.FC<UndoRedoHistoryProps> = ({
  position = 'bottom-right'
}) => {
  const { history, canUndo: canUndoFn, canRedo: canRedoFn } = useEditorStore();
  const [isExpanded, setIsExpanded] = useState(false); // 기본적으로 축소 상태
  const [lastAction, setLastAction] = useState<string>('');

  // 위치별 스타일 계산
  const getPositionStyles = () => {
    const baseStyles = 'fixed z-50 transition-all duration-300';
    
    switch (position) {
      case 'top-right':
        return `${baseStyles} top-6 right-6`;
      case 'bottom-right':
        return `${baseStyles} bottom-6 right-6`;
      case 'top-left':
        return `${baseStyles} top-6 left-6`;
      case 'bottom-left':
        return `${baseStyles} bottom-6 left-6`;
      default:
        return `${baseStyles} bottom-6 right-6`;
    }
  };

  // 히스토리 항목 렌더링
  const renderHistoryItem = (item: any, index: number, isPast: boolean = false) => {
    const isSelected = isPast ? index === history.past.length - 1 : false;
    
    return (
      <div
        key={`${isPast ? 'past' : 'future'}-${index}`}
        className={`px-3 py-2 text-sm border-l-2 transition-all duration-200 cursor-pointer ${
          isSelected
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        }`}
        title={item.description || `작업 ${index + 1}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-60">
            {isPast ? '↶' : '↷'}
          </span>
          <span className="truncate">
            {item.description || `작업 ${index + 1}`}
          </span>
        </div>
        {item.timestamp && (
          <div className="text-xs text-gray-400 mt-1">
            {new Date(item.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  };

  // 축약된 히스토리 표시
  const renderCollapsedHistory = (): React.ReactElement => {
    const pastCount = history.past.length;
    const futureCount = history.future.length;
    
    if (pastCount === 0 && futureCount === 0) {
      return (
        <div className="text-center text-gray-500 text-xs py-4">
          작업 히스토리가 없습니다
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {/* 과거 히스토리 (최근 3개) */}
        {history.past.slice(-3).reverse().map((item, index) => 
          renderHistoryItem(item, history.past.length - 3 + index, true)
        )}
        
        {/* 현재 상태 표시 */}
        {Array.isArray(history.present) && history.present.length > 0 && (
          <div className="px-3 py-2 text-sm border-l-2 border-green-500 bg-green-50 text-green-700">
            <div className="flex items-center gap-2">
              <span className="text-xs">●</span>
              <span className="truncate">현재 상태</span>
            </div>
          </div>
        )}
        
        {/* 미래 히스토리 (최근 2개) */}
        {history.future.slice(0, 2).map((item, index) => 
          renderHistoryItem(item, index, false)
        )}
      </div>
    );
  };

  // 확장된 히스토리 표시
  const renderExpandedHistory = (): React.ReactElement => {
    return (
      <div className="space-y-2">
        {/* 과거 히스토리 */}
        {history.past.length > 0 && (
          <div>
            <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100">
              과거 작업 ({history.past.length})
            </div>
            {history.past.slice().reverse().map((item, index) => 
              renderHistoryItem(item, index, true)
            )}
          </div>
        )}
        
        {/* 현재 상태 */}
        {Array.isArray(history.present) && history.present.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100">
              현재 상태
            </div>
            {history.present.map((item, index) => (
              <div
                key={`present-${index}`}
                className="px-3 py-2 text-sm border-l-2 border-green-500 bg-green-50 text-green-700"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs">●</span>
                  <span className="truncate">{item.name || `현재 상태 ${index + 1}`}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 미래 히스토리 */}
        {history.future.length > 0 && (
          <div>
            <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100">
              미래 작업 ({history.future.length})
            </div>
            {history.future.map((item, index) => 
              renderHistoryItem(item, index, false)
            )}
          </div>
        )}
      </div>
    );
  };

  // 마지막 액션 표시
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    
    if (history.past.length > 0) {
      const lastItem: any = history.past[history.past.length - 1];
      if (lastItem && lastItem.description || "작업") {
        setLastAction(lastItem.description || "작업");
        timer = setTimeout(() => setLastAction(""), 3000);
      }
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [history.past]);

  // 히스토리가 없으면 표시하지 않음 (Hook 호출 후로 이동)
  const hasHistory = history.past.length > 0 || history.future.length > 0 || history.present.length > 0;
  if (!hasHistory) return null;
  return (
    <div className={getPositionStyles()}>
      {/* 마지막 액션 알림 */}
      {lastAction && (
        <div className="mb-3 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          <span className="text-sm font-medium">{lastAction}</span>
        </div>
      )}
      
      {/* 히스토리 패널 */}
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">작업 히스토리</h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={isExpanded ? '축소' : '확장'}
            >
              {isExpanded ? '−' : '+'}
            </button>
          </div>
          
          {/* 상태 표시 */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>실행 취소: {canUndoFn() ? '가능' : '불가능'}</span>
            <span>다시 실행: {canRedoFn() ? '가능' : '불가능'}</span>
          </div>
        </div>
        
        {/* 히스토리 내용 */}
        <div className="p-2">
          {isExpanded ? renderExpandedHistory() : renderCollapsedHistory()}
        </div>
      </div>
    </div>
  );
};

export default UndoRedoHistory;
