'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowUp, 
  FiArrowDown, 
  FiArrowLeft, 
  FiArrowRight,
  FiRotateCw,
  FiZoomIn,
  FiZoomOut,
  FiMove,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { useEditorStore } from '../../../store/editorStore';
import { Vector3 } from 'three';

interface MobileFurnitureControlsProps {
  selectedItemId: string | null;
  onClose: () => void;
  isVisible: boolean;
}

export const MobileFurnitureControls: React.FC<MobileFurnitureControlsProps> = ({
  selectedItemId,
  onClose,
  isVisible
}) => {
  const { updateItem, placedItems } = useEditorStore();
  const [moveStep, setMoveStep] = useState(0.5); // 이동 단위
  const [rotateStep, setRotateStep] = useState(15); // 회전 단위 (도)
  const [scaleStep, setScaleStep] = useState(0.1); // 크기 단위

  // 선택된 아이템 정보
  const selectedItem = selectedItemId ? placedItems.find(item => item.id === selectedItemId) : null;

  // 모바일 환경 감지
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

  if (!isMobile || !isVisible || !selectedItem) return null;

  // 가구 이동 함수들
  const moveFurniture = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedItem) return;

    const currentPos = selectedItem.position;
    const newPosition = new Vector3(currentPos.x, currentPos.y, currentPos.z);

    switch (direction) {
      case 'up':
        newPosition.z += moveStep;
        break;
      case 'down':
        newPosition.z -= moveStep;
        break;
      case 'left':
        newPosition.x -= moveStep;
        break;
      case 'right':
        newPosition.x += moveStep;
        break;
    }

    updateItem(selectedItem.id, { position: newPosition });
    console.log(`🔄 가구 이동: ${direction}`, newPosition);
  };

  // 가구 회전 함수
  const rotateFurniture = (direction: 'left' | 'right') => {
    if (!selectedItem) return;

    const currentRot = selectedItem.rotation;
    const newRotation = { ...currentRot };

    if (direction === 'left') {
      newRotation.y -= (rotateStep * Math.PI) / 180;
    } else {
      newRotation.y += (rotateStep * Math.PI) / 180;
    }

    updateItem(selectedItem.id, { rotation: newRotation as any });
    console.log(`🔄 가구 회전: ${direction}`, newRotation);
  };

  // 가구 크기 조절 함수
  const scaleFurniture = (direction: 'up' | 'down') => {
    if (!selectedItem) return;

    const currentScale = selectedItem.scale;
    const newScale = { ...currentScale };

    if (direction === 'up') {
      newScale.x = Math.min(newScale.x + scaleStep, 3); // 최대 3배
      newScale.y = Math.min(newScale.y + scaleStep, 3);
      newScale.z = Math.min(newScale.z + scaleStep, 3);
    } else {
      newScale.x = Math.max(newScale.x - scaleStep, 0.1); // 최소 0.1배
      newScale.y = Math.max(newScale.y - scaleStep, 0.1);
      newScale.z = Math.max(newScale.z - scaleStep, 0.1);
    }

    updateItem(selectedItem.id, { scale: newScale as any });
    console.log(`🔄 가구 크기 조절: ${direction}`, newScale);
  };

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
            className="w-full bg-white rounded-t-3xl shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            data-mobile-furniture-control
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FiMove className="text-blue-600" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">가구 조작</h3>
                  <p className="text-sm text-gray-500">{selectedItem.name}</p>
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

            <div className="p-4 space-y-6">
              {/* 이동 컨트롤 */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FiMove size={18} />
                  이동 (단위: {moveStep}m)
                </h4>
                <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                  <div></div>
                  <motion.button
                    onClick={() => moveFurniture('up')}
                    className="p-4 rounded-xl bg-blue-100 hover:bg-blue-200 transition-colors flex items-center justify-center"
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiArrowUp size={24} className="text-blue-600" />
                  </motion.button>
                  <div></div>
                  
                  <motion.button
                    onClick={() => moveFurniture('left')}
                    className="p-4 rounded-xl bg-blue-100 hover:bg-blue-200 transition-colors flex items-center justify-center"
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiArrowLeft size={24} className="text-blue-600" />
                  </motion.button>
                  
                  <div className="p-4 rounded-xl bg-gray-100 flex items-center justify-center">
                    <span className="text-sm text-gray-600">중심</span>
                  </div>
                  
                  <motion.button
                    onClick={() => moveFurniture('right')}
                    className="p-4 rounded-xl bg-blue-100 hover:bg-blue-200 transition-colors flex items-center justify-center"
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiArrowRight size={24} className="text-blue-600" />
                  </motion.button>
                  
                  <div></div>
                  <motion.button
                    onClick={() => moveFurniture('down')}
                    className="p-4 rounded-xl bg-blue-100 hover:bg-blue-200 transition-colors flex items-center justify-center"
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiArrowDown size={24} className="text-blue-600" />
                  </motion.button>
                  <div></div>
                </div>
              </div>

              {/* 회전 컨트롤 */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FiRotateCw size={18} />
                  회전 (단위: {rotateStep}°)
                </h4>
                <div className="flex gap-3 justify-center">
                  <motion.button
                    onClick={() => rotateFurniture('left')}
                    className="flex-1 p-4 rounded-xl bg-green-100 hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiRotateCw size={20} className="text-green-600" />
                    <span className="text-sm font-medium text-green-600">좌회전</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => rotateFurniture('right')}
                    className="flex-1 p-4 rounded-xl bg-green-100 hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiRotateCw size={20} className="text-green-600 rotate-180" />
                    <span className="text-sm font-medium text-green-600">우회전</span>
                  </motion.button>
                </div>
              </div>

              {/* 크기 조절 컨트롤 */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FiZoomIn size={18} />
                  크기 조절 (단위: {scaleStep})
                </h4>
                <div className="flex gap-3 justify-center">
                  <motion.button
                    onClick={() => scaleFurniture('down')}
                    className="flex-1 p-4 rounded-xl bg-purple-100 hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiZoomOut size={20} className="text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">축소</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => scaleFurniture('up')}
                    className="flex-1 p-4 rounded-xl bg-purple-100 hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiZoomIn size={20} className="text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">확대</span>
                  </motion.button>
                </div>
              </div>

              {/* 설정 옵션 */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-700 mb-3">설정</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">이동 단위</label>
                    <select
                      value={moveStep}
                      onChange={(e) => setMoveStep(parseFloat(e.target.value))}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value={0.1}>0.1m</option>
                      <option value={0.25}>0.25m</option>
                      <option value={0.5}>0.5m</option>
                      <option value={1}>1m</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">회전 단위</label>
                    <select
                      value={rotateStep}
                      onChange={(e) => setRotateStep(parseInt(e.target.value))}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value={5}>5°</option>
                      <option value={15}>15°</option>
                      <option value={30}>30°</option>
                      <option value={45}>45°</option>
                      <option value={90}>90°</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">크기 단위</label>
                    <select
                      value={scaleStep}
                      onChange={(e) => setScaleStep(parseFloat(e.target.value))}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value={0.05}>0.05</option>
                      <option value={0.1}>0.1</option>
                      <option value={0.2}>0.2</option>
                      <option value={0.5}>0.5</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 완료 버튼 */}
              <motion.button
                onClick={onClose}
                className="w-full p-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                whileTap={{ scale: 0.95 }}
              >
                <FiCheck size={20} />
                완료
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileFurnitureControls;
