import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiRotateCcw, 
  FiRotateCw, 
  FiCopy, 
  FiTrash2, 
  FiX 
} from 'react-icons/fi';

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
  if (!isVisible) return null;

  // 화면 경계를 체크하여 위치 조정
  const getConstrainedPosition = () => {
    const panelWidth = 320; // 패널의 대략적인 너비
    const panelHeight = 80; // 패널의 대략적인 높이
    const margin = 16; // 화면 가장자리에서의 여백

    let x = position.x;
    let y = position.y;

    // X축 경계 체크
    if (x - panelWidth / 2 < margin) {
      x = margin + panelWidth / 2;
    } else if (x + panelWidth / 2 > window.innerWidth - margin) {
      x = window.innerWidth - margin - panelWidth / 2;
    }

    // Y축 경계 체크 (패널이 위쪽에 표시되므로)
    if (y - panelHeight < margin) {
      y = margin + panelHeight;
    } else if (y > window.innerHeight - margin) {
      y = window.innerHeight - margin;
    }

    return { x, y };
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
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-3 mb-2">
          {/* 컨트롤 버튼들 - 가로 배치 */}
          <div className="flex items-center gap-2">
            {/* 왼쪽 회전 */}
            <motion.button
              onClick={onRotateLeft}
              className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <FiRotateCcw size={20} className="text-blue-600" />
            </motion.button>

            {/* 오른쪽 회전 */}
            <motion.button
              onClick={onRotateRight}
              className="p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <FiRotateCw size={20} className="text-green-600" />
            </motion.button>

            {/* 복제 */}
            <motion.button
              onClick={onDuplicate}
              className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <FiCopy size={20} className="text-purple-600" />
            </motion.button>

            {/* 삭제 */}
            <motion.button
              onClick={onDelete}
              className="p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <FiTrash2 size={20} className="text-red-600" />
            </motion.button>
          </div>
        </div>

        {/* 화살표 포인터 */}
        <div className="flex justify-center">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FurnitureFloatingControls;
