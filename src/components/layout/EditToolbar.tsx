'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEditorStore } from '../../store/editorStore';
import { getSafeTouchArea, isMobile } from '../../utils/mobileHtmlConstraints';
import { useColorChanger } from '../../hooks/useColorChanger';

interface EditToolbarProps {
  onToggleFurnitureCatalog?: () => void;
  showFurnitureCatalog?: boolean;
  onToggleTemplateSelector?: () => void;
  showTemplateSelector?: boolean;
  // 새 prop
  isMobileDevice?: boolean;
  // 하위 호환: 기존 테스트/호출부가 사용하는 이름
  isMobile?: boolean;
}

export default function EditToolbar({
  onToggleFurnitureCatalog,
  showFurnitureCatalog,
  onToggleTemplateSelector,
  showTemplateSelector,
  isMobileDevice = false,
  isMobile: isMobileLegacy
}: EditToolbarProps) {
  const {
    undo,
    redo,
    selectedItemId,
    isDragging
  } = useEditorStore();

  // 색상 변경 기능
  const {
    currentColor,
    selectedItem,
    predefinedColors,
    handleColorChange,
    handleColorReset,
    isColorChangerVisible
  } = useColorChanger();

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

  // 모바일 안전 영역 계산
  // Hydration mismatch 방지: 초기 렌더는 고정 상태, 마운트 후 기기/세이프영역 반영
  const [mounted, setMounted] = useState(false);
  const [isMobileCheck, setIsMobileCheck] = useState<boolean>(!!isMobileDevice);
  const [topPx, setTopPx] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const compute = () => {
      const explicit = typeof isMobileDevice === 'boolean' ? isMobileDevice : (typeof isMobileLegacy === 'boolean' ? isMobileLegacy : undefined);
      const mobile = typeof explicit === 'boolean' ? explicit : isMobile();
      setIsMobileCheck(mobile);
      if (mobile) {
        const safe = getSafeTouchArea();
        setTopPx(Math.max(safe.top + 16, 80));
      } else {
        setTopPx(null);
      }
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
  }, [isMobileDevice, isMobileLegacy]);

  // 위치: 초기에는 고정 클래스(top-16), 마운트 후 모바일이면 style.top을 사용
  const toolbarTopClass = 'top-16';

  return (
    <motion.div
      data-occlude-floating="edit-toolbar"
      className={`fixed ${toolbarTopClass} left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 ${
        isMobileCheck ? 'max-w-[95vw]' : ''
      }`}
      style={{
        zIndex: 100,
        ...(mounted && isMobileCheck && topPx !== null ? { top: `${topPx}px` } : {}),
        // 모바일에서 추가적인 스타일 적용
        ...(isMobileCheck && {
          maxWidth: '95vw',
          marginLeft: 'auto',
          marginRight: 'auto'
        })
      }}
      animate={{
        padding: currentMode === 'normal' ? (isMobileCheck ? '32px' : '24px') :
                currentMode === 'compact' ? (isMobileCheck ? '20px' : '16px') :
                (isMobileCheck ? '16px' : '12px')
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className={`flex items-center ${isMobileCheck ? 'gap-2 justify-center' : 'gap-4'}`}>
        {/* 편집 도구 - 모바일에서는 아이콘만, 데스크톱에서는 텍스트 포함 */}
        <div className={`flex ${isMobileCheck ? 'gap-2' : 'gap-2'}`}>
          <motion.button
            onClick={undo}
            className={`${isMobileCheck ? 'p-2' : 'px-3 py-2'} bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-300 border-2 border-gray-300 hover:border-gray-400 ${isMobileCheck ? 'min-w-[48px] min-h-[48px]' : 'min-w-[80px]'} overflow-hidden`}
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
              {!isMobileCheck && (
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
            className={`${isMobileCheck ? 'p-2' : 'px-3 py-2'} bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-300 border-2 border-gray-300 hover:border-gray-400 ${isMobileCheck ? 'min-w-[48px] min-h-[48px]' : 'min-w-[80px]'} overflow-hidden`}
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
              {!isMobileCheck && (
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
        {!isMobileCheck && (
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
          className={`${isMobileCheck ? 'p-2' : 'px-3 py-2'} rounded-xl font-medium transition-all duration-300 border-2 ${isMobileCheck ? 'min-w-[48px] min-h-[48px]' : 'min-w-[70px]'} overflow-hidden ${
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
            {!isMobileCheck && (
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
          className={`${isMobileCheck ? 'p-2' : 'px-3 py-2'} rounded-xl font-medium transition-all duration-300 border-2 ${isMobileCheck ? 'min-w-[48px] min-h-[48px]' : 'min-w-[70px]'} overflow-hidden ${
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
            {!isMobileCheck && (
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

        {/* 색상 변경 UI - 가구가 선택된 경우에만 표시 */}
        {isColorChangerVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-lg border-2 border-gray-200"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">🎨</span>
              <span className="text-xs text-gray-600">
                {selectedItem?.name || '선택된 가구'}
              </span>
            </div>
            
            <div className="flex gap-1">
              {predefinedColors.map((colorOption) => (
                <button
                  key={colorOption.color}
                  onClick={() => handleColorChange(colorOption.color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                    currentColor === colorOption.color 
                      ? 'border-blue-500 scale-110' 
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: colorOption.color }}
                  title={colorOption.name}
                />
              ))}
            </div>
            
            <button
              onClick={handleColorReset}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
              title="원본 색상으로 복원"
            >
              🔄
            </button>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}
