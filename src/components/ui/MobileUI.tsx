'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiMove, FiTrash2, FiTarget } from 'react-icons/fi';
// MobileFurnitureControls는 MiniRoom으로 대체됨
import MobileFurnitureSelector from '../features/editor/MobileFurnitureSelector';
import { usePlacedItems } from '../../store/editorStore';

interface MobileUIProps {
  selectedItemId: string | null;
  onDeleteSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onItemSelect?: (id: string | null) => void;
}

export const MobileUI: React.FC<MobileUIProps> = ({
  selectedItemId,
  onDeleteSelected,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onItemSelect
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [showFurnitureSelector, setShowFurnitureSelector] = useState(false);
  
  const placedItems = usePlacedItems();

  useEffect(() => {
    const checkMobile = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(navigator.userAgent) || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 모바일 감지 시퀀스

  if (!isMobile) return null;

  return (
    <>
      {/* 모바일용 하단 툴바 - 간소화된 버전 */}
      <motion.div
        data-occlude-floating="mobile-bottom-bar"
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200/50 shadow-lg z-40"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
      >
        <div className="flex items-center justify-center px-4 py-3">
          {/* 중앙: 편집 도구 토글 버튼 */}
          <motion.button
            onClick={() => setShowToolPanel(!showToolPanel)}
            className={`px-6 py-3 rounded-full transition-colors min-h-[44px] ${
              showToolPanel 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-2">
              {showToolPanel ? <FiX size={18} /> : <FiMenu size={18} />}
              <span className="text-sm font-medium">
                {showToolPanel ? '닫기' : '편집 도구'}
              </span>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* 선택된 객체가 있을 때 표시되는 퀵 액션 바 (확장 패널이 열리지 않았을 때만) */}
      <AnimatePresence>
        {selectedItemId && !showToolPanel && (
          <motion.div
            data-occlude-floating="mobile-quick-action"
            className="fixed bottom-20 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 z-30"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="flex items-center justify-around p-4">
              <motion.button
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-3 rounded-xl transition-colors min-w-[44px] min-h-[44px] ${
                  canUndo
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                whileTap={{ scale: canUndo ? 0.95 : 1 }}
              >
                ↶
              </motion.button>

              <motion.button
                onClick={onRedo}
                disabled={!canRedo}
                className={`p-3 rounded-xl transition-colors min-w-[44px] min-h-[44px] ${
                  canRedo
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                whileTap={{ scale: canRedo ? 0.95 : 1 }}
              >
                ↷
              </motion.button>

              <motion.button
                onClick={onDeleteSelected}
                className="p-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors min-w-[44px] min-h-[44px]"
                whileTap={{ scale: 0.95 }}
              >
                <FiTrash2 size={20} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 편집 모드용 확장 패널 */}
      <AnimatePresence>
        {showToolPanel && (
          <motion.div
            data-occlude-floating="mobile-tool-panel"
            className="fixed bottom-24 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 z-35 overflow-hidden max-w-[calc(100vw-2rem)]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              // 화면 경계를 벗어나지 않도록 보장
              maxWidth: 'calc(100vw - 2rem)',
              left: '1rem',
              right: '1rem'
            }}
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">편집 도구</h3>
              
              {/* 주요 도구들 - 3개만 표시 */}
              <div className="flex justify-center gap-4 mb-4">
                <motion.button
                  onClick={() => setShowFurnitureSelector(true)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors min-w-[64px] min-h-[64px]"
                  whileTap={{ scale: 0.95 }}
                >
                  <FiTarget size={20} className="text-orange-600" />
                  <span className="text-xs font-medium text-orange-600">가구 선택</span>
                </motion.button>

                <motion.button
                  onClick={() => {
                    // 가구가 선택된 경우 편집 모드 토글
                    if (selectedItemId) {
                      // console.log('가구 편집 모드 토글');
                    }
                  }}
                  disabled={!selectedItemId}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors min-w-[64px] min-h-[64px] ${
                    selectedItemId
                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                  whileTap={{ scale: selectedItemId ? 0.95 : 1 }}
                >
                  <FiMove size={20} />
                  <span className="text-xs font-medium">이동/회전</span>
                </motion.button>

                <motion.button
                  onClick={onDeleteSelected}
                  disabled={!selectedItemId}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors min-w-[64px] min-h-[64px] ${
                    selectedItemId
                      ? 'bg-red-50 hover:bg-red-100 text-red-600'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                  whileTap={{ scale: selectedItemId ? 0.95 : 1 }}
                >
                  <FiTrash2 size={20} />
                  <span className="text-xs font-medium">삭제</span>
                </motion.button>
              </div>

              {/* 히스토리 버튼들 */}
              <div className="flex justify-center gap-3">
                <motion.button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    canUndo
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                  whileTap={{ scale: canUndo ? 0.95 : 1 }}
                >
                  ↶ 되돌리기
                </motion.button>

                <motion.button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    canRedo
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                  whileTap={{ scale: canRedo ? 0.95 : 1 }}
                >
                  다시실행 ↷
                </motion.button>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  💡 두 손가락으로 확대/축소 및 회전 가능
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 모바일 가구 컨트롤은 MiniRoom에서 처리됨 */}

      {/* 모바일 가구 선택기 */}
      <MobileFurnitureSelector
        isVisible={showFurnitureSelector}
        onSelect={(id) => {
          onItemSelect?.(id);
          setShowFurnitureSelector(false);
        }}
        onClose={() => setShowFurnitureSelector(false)}
        placedItems={placedItems.map(item => ({
          id: item.id,
          name: item.name,
          position: item.position,
          isLocked: item.isLocked || false
        }))}
        selectedItemId={selectedItemId}
      />
    </>
  );
};

export default MobileUI;
