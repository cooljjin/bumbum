'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiZoomIn, FiRotateCw, FiMove, FiTrash2 } from 'react-icons/fi';

interface MobileUIProps {
  onShowSettings: () => void;
  selectedItemId: string | null;
  onDeleteSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const MobileUI: React.FC<MobileUIProps> = ({
  onShowSettings,
  selectedItemId,
  onDeleteSelected,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showToolPanel, setShowToolPanel] = useState(false);

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
      {/* 모바일용 하단 툴바 - 기존 BottomNavigation과 겹치지 않도록 조정 */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200/50 shadow-lg z-40"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* 왼쪽: 메뉴 버튼 */}
          <motion.button
            onClick={() => setShowToolPanel(!showToolPanel)}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            {showToolPanel ? <FiX size={20} /> : <FiMenu size={20} />}
          </motion.button>

          {/* 오른쪽: 설정 버튼 */}
          <motion.button
            onClick={onShowSettings}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            ⚙️
          </motion.button>
        </div>
      </motion.div>

      {/* 선택된 객체가 있을 때 표시되는 퀵 액션 바 (확장 패널이 열리지 않았을 때만) */}
      <AnimatePresence>
        {selectedItemId && !showToolPanel && (
          <motion.div
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
                className={`p-3 rounded-xl transition-colors ${
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
                className={`p-3 rounded-xl transition-colors ${
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
                className="p-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
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
            className="fixed bottom-24 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 z-35 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">편집 도구</h3>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <FiMove size={24} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">이동</span>
                </motion.button>

                <motion.button
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <FiRotateCw size={24} className="text-green-600" />
                  <span className="text-sm font-medium text-green-600">회전</span>
                </motion.button>

                <motion.button
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <FiZoomIn size={24} className="text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">크기</span>
                </motion.button>

                <motion.button
                  onClick={onDeleteSelected}
                  disabled={!selectedItemId}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${
                    selectedItemId
                      ? 'bg-red-50 hover:bg-red-100 text-red-600'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                  whileTap={{ scale: selectedItemId ? 0.95 : 1 }}
                >
                  <FiTrash2 size={24} />
                  <span className="text-sm font-medium">삭제</span>
                </motion.button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  💡 두 손가락으로 확대/축소 및 회전 가능
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileUI;
