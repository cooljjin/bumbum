'use client';

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../../store/editorStore';

interface EditModeTransitionProps {
  children: React.ReactNode;
  duration?: number;
  showTransitionGuide?: boolean;
}

export const EditModeTransition: React.FC<EditModeTransitionProps> = ({
  children,
  duration = 500,
  showTransitionGuide = true
}) => {
  const { mode, tool } = useEditorStore();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousMode, setPreviousMode] = useState(mode);
  const [showGuide, setShowGuide] = useState(false);

  // 모드 변경 감지
  useEffect(() => {
    if (previousMode !== mode) {
      setIsTransitioning(true);
      setPreviousMode(mode);

      // 전환 완료 후 상태 초기화
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [mode, previousMode, duration]);

  // 도구 변경 시 가이드 표시
  useEffect(() => {
    if (showTransitionGuide && mode === 'edit') {
      setShowGuide(true);
      const timer = setTimeout(() => setShowGuide(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [tool, mode, showTransitionGuide]);

  // 전환 애니메이션 스타일
  const getTransitionStyles = () => {
    if (!isTransitioning) return {};

    const baseStyles = {
      transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      transform: mode === 'edit' ? 'scale(1.02)' : 'scale(0.98)',
      opacity: 0.8
    };

    return baseStyles;
  };

  // 모드별 배경 그라데이션
  const getBackgroundGradient = () => {
    switch (mode) {
      case 'edit':
        return 'from-blue-50 to-indigo-50';
      case 'view':
        return 'from-gray-50 to-slate-50';
      default:
        return 'from-white to-gray-50';
    }
  };

  // 도구별 색상 테마
  const getToolTheme = () => {
    switch (tool) {
      case 'select':
        return 'border-blue-200 bg-blue-50';
      case 'translate':
        return 'border-green-200 bg-green-50';
      case 'rotate':
        return 'border-purple-200 bg-purple-50';
      case 'scale':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  // 전환 가이드 렌더링
  const renderTransitionGuide = () => {
    if (!showGuide || mode !== 'edit') return null;

    const toolInfo = {
      select: { name: '선택', icon: '🖱️', description: '객체를 선택하고 속성을 편집합니다' },
      translate: { name: '이동', icon: '➡️', description: '객체를 드래그하여 이동합니다' },
      rotate: { name: '회전', icon: '🔄', description: '객체를 회전시킵니다' },
      scale: { name: '크기 조절', icon: '📏', description: '객체의 크기를 조절합니다' }
    };

    const currentTool = toolInfo[tool as keyof typeof toolInfo];

    return (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
        <div className={`px-6 py-4 rounded-xl shadow-xl border-2 ${getToolTheme()} max-w-md`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{currentTool.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{currentTool.name} 도구</h3>
              <p className="text-sm text-gray-600">{currentTool.description}</p>
            </div>
          </div>
          
          {/* 단축키 힌트 */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>🖱️ 클릭: 선택</span>
              <span>⌨️ Q/G/R/S: 도구 변경</span>
              <span>⌨️ Ctrl+Z: 실행 취소</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 모드 전환 오버레이
  const renderTransitionOverlay = () => {
    if (!isTransitioning) return null;

    return (
      <div className="fixed inset-0 z-40 pointer-events-none">
        <div 
          className={`w-full h-full bg-gradient-to-br ${getBackgroundGradient()} opacity-50`}
          style={{
            transition: `opacity ${duration}ms ease-in-out`
          }}
        />
        
        {/* 전환 메시지 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-white px-6 py-4 rounded-xl shadow-xl border-2 border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {mode === 'edit' ? '✏️' : '👁️'}
              </span>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  {mode === 'edit' ? '편집 모드' : '보기 모드'}
                </h3>
                <p className="text-sm text-gray-600">
                  {mode === 'edit' ? '객체를 편집할 수 있습니다' : '3D 룸을 탐색할 수 있습니다'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="relative w-full h-full"
      style={getTransitionStyles()}
    >
      {/* 전환 오버레이 */}
      {renderTransitionOverlay()}
      
      {/* 전환 가이드 */}
      {renderTransitionGuide()}
      
      {/* 메인 콘텐츠 */}
      <div className={`w-full h-full bg-gradient-to-br ${getBackgroundGradient()} transition-all duration-300`}>
        {children}
      </div>
      
      {/* 모드 표시기 */}
      <div className="fixed top-4 left-4 z-30">
        <div className={`px-3 py-2 rounded-lg shadow-lg border-2 ${getToolTheme()} transition-all duration-300`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {mode === 'edit' ? '✏️ 편집' : '👁️ 보기'}
            </span>
            {mode === 'edit' && (
              <span className="text-xs text-gray-500">
                {tool === 'select' ? '선택' : tool === 'translate' ? '이동' : tool === 'rotate' ? '회전' : '크기'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModeTransition;
