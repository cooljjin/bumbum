import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ROOM_DIMENSIONS, detectRoomSize } from '../../../utils/roomBoundary';

interface RoomSizeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomSizeChange?: (dimensions: typeof ROOM_DIMENSIONS) => void;
}

export default function RoomSizeSettings({ 
  isOpen, 
  onClose, 
  onRoomSizeChange 
}: RoomSizeSettingsProps) {
  const [dimensions, setDimensions] = useState(ROOM_DIMENSIONS);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 현재 방 크기 감지
      const currentDimensions = detectRoomSize();
      setDimensions(currentDimensions);
    }
  }, [isOpen]);

  const handleDimensionChange = (key: keyof typeof ROOM_DIMENSIONS, value: number) => {
    const newDimensions = { ...dimensions, [key]: value };
    setDimensions(newDimensions);
    
    if (onRoomSizeChange) {
      onRoomSizeChange(newDimensions);
    }
  };

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    
    try {
      // 실제 방 크기 감지 로직 (향후 구현)
      // 현재는 시뮬레이션된 지연
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const detectedDimensions = detectRoomSize();
      setDimensions(detectedDimensions);
      
      if (onRoomSizeChange) {
        onRoomSizeChange(detectedDimensions);
      }
      
      console.log('🔍 방 크기 자동 감지 완료:', detectedDimensions);
    } catch (error) {
      console.error('❌ 방 크기 감지 실패:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleReset = () => {
    setDimensions(ROOM_DIMENSIONS);
    if (onRoomSizeChange) {
      onRoomSizeChange(ROOM_DIMENSIONS);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">🏠 방 크기 설정</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* 자동 감지 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleAutoDetect}
              disabled={isDetecting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDetecting ? '🔍 감지 중...' : '🔍 자동 감지'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              🔄 초기화
            </button>
          </div>

          {/* 수동 설정 */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                너비 (X축)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="50"
                  step="0.5"
                />
                <span className="text-gray-500">m</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                깊이 (Z축)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={dimensions.depth}
                  onChange={(e) => handleDimensionChange('depth', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="50"
                  step="0.5"
                />
                <span className="text-gray-500">m</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                높이 (Y축)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="20"
                  step="0.5"
                />
                <span className="text-gray-500">m</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                벽 여백
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={dimensions.margin}
                  onChange={(e) => handleDimensionChange('margin', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="2"
                  step="0.1"
                />
                <span className="text-gray-500">m</span>
              </div>
            </div>
          </div>

          {/* 현재 설정 정보 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">현재 설정</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>방 크기: {dimensions.width}m × {dimensions.depth}m × {dimensions.height}m</div>
              <div>사용 가능 공간: {(dimensions.width - dimensions.margin * 2).toFixed(1)}m × {(dimensions.depth - dimensions.margin * 2).toFixed(1)}m</div>
              <div>벽 여백: {dimensions.margin}m</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            닫기
          </button>
          <button
            onClick={() => {
              if (onRoomSizeChange) {
                onRoomSizeChange(dimensions);
              }
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            적용
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
