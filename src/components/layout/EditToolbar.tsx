'use client';

import React from 'react';
import { useEditorStore } from '../../store/editorStore';

interface EditToolbarProps {
  onToggleFurnitureCatalog?: () => void;
  showFurnitureCatalog?: boolean;
  onToggleTemplateSelector?: () => void;
  showTemplateSelector?: boolean;
  isMobile?: boolean;
}

export default function EditToolbar({
  onToggleFurnitureCatalog,
  showFurnitureCatalog,
  onToggleTemplateSelector,
  showTemplateSelector,
  isMobile = false
}: EditToolbarProps) {
  const {
    undo,
    redo
  } = useEditorStore();

  return (
    <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 ${
      isMobile ? 'p-8 max-w-[95vw]' : 'p-6'
    }`} style={{ zIndex: 100 }}>
      <div className={`flex items-center ${isMobile ? 'gap-8 flex-wrap justify-center' : 'gap-6'}`}>
        {/* 편집 도구 - 핵심 기능만 */}
        <div className={`flex ${isMobile ? 'gap-4' : 'gap-3'}`}>
          <button
            onClick={undo}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-300 border-2 border-gray-300 hover:border-gray-400"
            title="실행 취소 (Ctrl+Z)"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">↶</span>
              <span className="text-sm font-medium">실행취소</span>
            </div>
          </button>

          <button
            onClick={redo}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-300 border-2 border-gray-300 hover:border-gray-400"
            title="다시 실행 (Ctrl+Y)"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">↷</span>
              <span className="text-sm font-medium">다시실행</span>
            </div>
          </button>
        </div>

        {/* 구분선 */}
        <div className="w-0.5 h-12 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full" />

        {/* 가구 카탈로그 토글 */}
        <button
          onClick={onToggleFurnitureCatalog}
          className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 border-2 ${
            showFurnitureCatalog
              ? 'bg-blue-600 text-white border-blue-700 shadow-lg'
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
          }`}
          title="가구 카탈로그"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🪑</span>
            <span className="text-sm font-medium">가구</span>
          </div>
        </button>

        {/* 룸 템플릿 토글 */}
        <button
          onClick={onToggleTemplateSelector}
          className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 border-2 ${
            showTemplateSelector
              ? 'bg-purple-600 text-white border-purple-700 shadow-lg'
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
          }`}
          title="룸 템플릿"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🏠</span>
            <span className="text-sm font-medium">템플릿</span>
          </div>
        </button>
      </div>
    </div>
  );
}
