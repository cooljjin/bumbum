import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiRotateCcw,
  FiRotateCw,
  FiCopy,
  FiTrash2,
  FiX
} from 'react-icons/fi';
import { getOptimalFloatingSize, getSafeTouchArea, isMobile } from '../../../utils/mobileHtmlConstraints';

interface FurnitureFloatingControlsProps {
  isVisible: boolean;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  position?: { x: number; y: number };
}

export const FurnitureFloatingControls: React.FC<FurnitureFloatingControlsProps> = ({
  isVisible,
  onRotateLeft,
  onRotateRight,
  onDuplicate,
  onDelete,
  position = { x: 0, y: 0 }
}) => {
  console.log('🎯 FurnitureFloatingControls 렌더링:', {
    isVisible,
    position,
    positionValid: position && typeof position.x === 'number' && typeof position.y === 'number'
  });

  if (!isVisible) return null;

  // 화면 경계를 체크하여 위치 조정 - 가구 바로 위에 표시
  const getConstrainedPosition = () => {
    // 모바일 최적화된 크기 계산
    const optimalSize = getOptimalFloatingSize(320, 80);
    const panelWidth = optimalSize.width;
    const panelHeight = optimalSize.height;

    // 모바일 안전 영역 고려
    const safeArea = getSafeTouchArea();

    // 모바일에서는 더 큰 여백 사용
    const margin = isMobile() ? Math.max(safeArea.left, safeArea.right, 20) : 16;
    const offsetY = isMobile() ? 30 : 20; // 모바일에서는 더 큰 간격

    let x = position.x;
    let y = position.y - offsetY; // 가구 바로 위에 표시

    // X축 경계 체크
    const leftBound = margin;
    const rightBound = window.innerWidth - margin;

    if (x - panelWidth / 2 < leftBound) {
      x = leftBound + panelWidth / 2;
    } else if (x + panelWidth / 2 > rightBound) {
      x = rightBound - panelWidth / 2;
    }

    // Y축 경계 체크 (패널이 위쪽에 표시되므로)
    const topBound = safeArea.top + margin;
    const bottomBound = window.innerHeight - safeArea.bottom - margin;

    if (y - panelHeight < topBound) {
      y = topBound + panelHeight;
    } else if (y > bottomBound) {
      y = bottomBound;
    }

    const finalPosition = { x, y };
    console.log('🎯 getConstrainedPosition 결과:', {
      originalPosition: position,
      finalPosition,
      panelSize: { width: panelWidth, height: panelHeight },
      bounds: { leftBound, rightBound, topBound, bottomBound },
      isMobile: isMobile()
    });
    return finalPosition;
  };

  const constrainedPosition = getConstrainedPosition();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-40 pointer-events-auto"
        style={{
          left: constrainedPosition.x,
          top: constrainedPosition.y,
          transform: 'translate(-50%, -100%)'
        }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* 메인 컨트롤 패널 - 가로로 긴 디자인 */}
        <div className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-3 mb-2 ${
          isMobile() ? 'max-w-[90vw] overflow-x-auto' : ''
        }`}>
          {/* 컨트롤 버튼들 - 가로 배치 */}
          <div className="flex items-center gap-2">
            {/* 왼쪽 회전 */}
            <motion.button
              onClick={onRotateLeft}
              className={`${isMobile() ? 'p-4 min-w-[48px] min-h-[48px]' : 'p-3'} rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors`}
              whileTap={{ scale: 0.95 }}
            >
              <FiRotateCcw size={20} className="text-blue-600" />
            </motion.button>

            {/* 오른쪽 회전 */}
            <motion.button
              onClick={onRotateRight}
              className={`${isMobile() ? 'p-4 min-w-[48px] min-h-[48px]' : 'p-3'} rounded-xl bg-green-50 hover:bg-green-100 transition-colors`}
              whileTap={{ scale: 0.95 }}
            >
              <FiRotateCw size={20} className="text-green-600" />
            </motion.button>

            {/* 복제 */}
            <motion.button
              onClick={onDuplicate}
              className={`${isMobile() ? 'p-4 min-w-[48px] min-h-[48px]' : 'p-3'} rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors`}
              whileTap={{ scale: 0.95 }}
            >
              <FiCopy size={20} className="text-purple-600" />
            </motion.button>

            {/* 삭제 */}
            <motion.button
              onClick={onDelete}
              className={`${isMobile() ? 'p-4 min-w-[48px] min-h-[48px]' : 'p-3'} rounded-xl bg-red-50 hover:bg-red-100 transition-colors`}
              whileTap={{ scale: 0.95 }}
            >
              <FiTrash2 size={20} className="text-red-600" />
            </motion.button>
          </div>
        </div>

        {/* 화살표 포인터 - 가구를 가리키도록 */}
        <div className="flex justify-center">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FurnitureFloatingControls;
