'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    redo,
    selectedItemId,
    isDragging
  } = useEditorStore();

  // UI 상태 관리
  const [isCompact, setIsCompact] = useState(false);
  const [isMinimal, setIsMinimal] = useState(false);

  // 가구 선택 상태에 따른 UI 크기 조절
  useEffect(() => {
    if (selectedItemId) {
      // 가구가 선택되면 최소화 모드로 전환
      setIsMinimal(true);
      setIsCompact(false);
    } else {
      // 가구 선택 해제 시 기본 크기로 복원
      setIsMinimal(false);
      setIsCompact(false);
    }
  }, [selectedItemId]);

  // 드래그 상태에 따른 UI 크기 조절
  useEffect(() => {
    if (isDragging) {
      // 가구를 옮길 때는 컴팩트 모드로 전환
      setIsCompact(true);
    } else {
      // 드래그 종료 시 이전 상태로 복원
      if (!selectedItemId) {
        setIsCompact(false);
      }
    }
  }, [isDragging, selectedItemId]);

  // 현재 UI 모드 결정
  const currentMode = isMinimal ? 'minimal' : isCompact ? 'compact' : 'normal';

  return (
    <motion.div
      className={`absolute ${isMobile ? 'top-20' : 'top-16'} left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 ${
        isMobile ? 'max-w-[95vw]' : ''
      }`}
      style={{ zIndex: 100 }}
      animate={{
        padding: currentMode === 'normal' ? (isMobile ? '32px' : '24px') : 
                currentMode === 'compact' ? (isMobile ? '20px' : '16px') : 
                (isMobile ? '16px' : '12px')
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className={`flex items-center ${isMobile ? 'gap-2 justify-center' : 'gap-4'}`}>
        {/* 편집 도구 - 모바일에서는 아이콘만, 데스크톱에서는 텍스트 포함 */}
        <div className={`flex ${isMobile ? 'gap-2' : 'gap-2'}`}>
          <motion.button
            onClick={undo}
            className={`${isMobile ? 'p-2' : 'px-3 py-2'} bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-300 border-2 border-gray-300 hover:border-gray-400 ${isMobile ? 'min-w-[44px] min-h-[44px]' : 'min-w-[80px]'} overflow-hidden`}
            title="실행 취소 (Ctrl+Z)"
            animate={{
              scale: currentMode === 'normal' ? 1 : currentMode === 'compact' ? 0.95 : 0.9
            }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-1 justify-center">
              <span className="text-base">↶</span>
              {!isMobile && (
                <motion.span 
                  className="text-xs font-medium whitespace-nowrap"
                  animate={{
                    opacity: currentMode === 'normal' ? 1 : currentMode === 'compact' ? 0.8 : 0,
                    width: currentMode === 'minimal' ? 0 : 'auto'
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  실행취소
                </motion.span>
              )}
            </div>
          </motion.button>

          <motion.button
            onClick={redo}
            className={`${isMobile ? 'p-2' : 'px-3 py-2'} bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-300 border-2 border-gray-300 hover:border-gray-400 ${isMobile ? 'min-w-[44px] min-h-[44px]' : 'min-w-[80px]'} overflow-hidden`}
            title="다시 실행 (Ctrl+Y)"
            animate={{
              scale: currentMode === 'normal' ? 1 : currentMode === 'compact' ? 0.95 : 0.9
            }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-1 justify-center">
              <span className="text-base">↷</span>
              {!isMobile && (
                <motion.span 
                  className="text-xs font-medium whitespace-nowrap"
                  animate={{
                    opacity: currentMode === 'normal' ? 1 : currentMode === 'compact' ? 0.8 : 0,
                    width: currentMode === 'minimal' ? 0 : 'auto'
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  다시실행
                </motion.span>
              )}
            </div>
          </motion.button>
        </div>

        {/* 구분선 - 모바일에서는 숨김 */}
        {!isMobile && (
          <motion.div 
            className="w-0.5 h-12 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full"
            animate={{
              opacity: currentMode === 'normal' ? 1 : currentMode === 'compact' ? 0.7 : 0.3,
              scale: currentMode === 'normal' ? 1 : currentMode === 'compact' ? 0.9 : 0.8
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        )}

        {/* 가구 카탈로그 토글 */}
        <motion.button
          onClick={onToggleFurnitureCatalog}
          className={`${isMobile ? 'p-2' : 'px-3 py-2'} rounded-xl font-medium transition-all duration-300 border-2 ${isMobile ? 'min-w-[44px] min-h-[44px]' : 'min-w-[70px]'} overflow-hidden ${
            showFurnitureCatalog
              ? 'bg-blue-600 text-white border-blue-700 shadow-lg'
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
          }`}
          title="가구 카탈로그"
          animate={{
            scale: currentMode === 'normal' ? 1 : currentMode === 'compact' ? 0.95 : 0.9
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center gap-1 justify-center">
            <span className="text-base">🪑</span>
            {!isMobile && (
              <motion.span 
                className="text-xs font-medium whitespace-nowrap"
                animate={{
                  opacity: currentMode === 'normal' ? 1 : currentMode === 'compact' ? 0.8 : 0,
                  width: currentMode === 'minimal' ? 0 : 'auto'
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                가구
              </motion.span>
            )}
          </div>
        </motion.button>

        {/* 룸 템플릿 토글 */}
        <motion.button
          onClick={onToggleTemplateSelector}
          className={`${isMobile ? 'p-2' : 'px-3 py-2'} rounded-xl font-medium transition-all duration-300 border-2 ${isMobile ? 'min-w-[44px] min-h-[44px]' : 'min-w-[70px]'} overflow-hidden ${
            showTemplateSelector
              ? 'bg-purple-600 text-white border-purple-700 shadow-lg'
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
          }`}
          title="룸 템플릿"
          animate={{
            scale: currentMode === 'normal' ? 1 : currentMode === 'compact' ? 0.95 : 0.9
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center gap-1 justify-center">
            <span className="text-base">🏠</span>
            {!isMobile && (
              <motion.span 
                className="text-xs font-medium whitespace-nowrap"
                animate={{
                  opacity: currentMode === 'normal' ? 1 : currentMode === 'compact' ? 0.8 : 0,
                  width: currentMode === 'minimal' ? 0 : 'auto'
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                템플릿
              </motion.span>
            )}
          </div>
        </motion.button>


      </div>
    </motion.div>
  );
}
