'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTarget, FiCheck, FiX } from 'react-icons/fi';

interface MobileFurnitureSelectorProps {
  isVisible: boolean;
  onSelect: (itemId: string | null) => void;
  onClose: () => void;
  placedItems: Array<{
    id: string;
    name: string;
    position: { x: number; y: number; z: number };
    isLocked?: boolean;
  }>;
  selectedItemId: string | null;
}

export const MobileFurnitureSelector: React.FC<MobileFurnitureSelectorProps> = ({
  isVisible,
  onSelect,
  onClose,
  placedItems,
  selectedItemId
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(navigator.userAgent) || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FiTarget className="text-blue-600" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">가구 선택</h3>
                  <p className="text-sm text-gray-500">이동할 가구를 선택하세요</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <FiX size={20} />
              </motion.button>
            </div>

            {/* 가구 목록 */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {placedItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">🏠</div>
                  <p className="text-gray-500">배치된 가구가 없습니다</p>
                  <p className="text-sm text-gray-400 mt-1">먼저 가구를 배치해주세요</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {placedItems.map((item) => (
                    <motion.div
                      key={item.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedItemId === item.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      } ${item.isLocked ? 'opacity-50' : ''}`}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (!item.isLocked) {
                          onSelect(item.id);
                          onClose();
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedItemId === item.id ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <div>
                            <h4 className="font-medium text-gray-800">{item.name}</h4>
                            <p className="text-sm text-gray-500">
                              위치: ({item.position.x.toFixed(1)}, {item.position.z.toFixed(1)})
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {item.isLocked && (
                            <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
                              🔒 고정됨
                            </span>
                          )}
                          {selectedItemId === item.id && (
                            <FiCheck className="text-blue-600" size={20} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* 하단 액션 */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-3">
                <motion.button
                  onClick={() => onSelect(null)}
                  className="flex-1 p-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  선택 해제
                </motion.button>
                
                <motion.button
                  onClick={onClose}
                  className="flex-1 p-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  완료
                </motion.button>
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-3">
                💡 가구를 선택한 후 이동 버튼을 눌러 위치를 조정할 수 있습니다
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileFurnitureSelector;
