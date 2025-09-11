'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useColorChanger } from '../../hooks/useColorChanger';

interface FloatingColorPaletteProps {
  className?: string;
}

export const FloatingColorPalette: React.FC<FloatingColorPaletteProps> = ({ 
  className = '' 
}) => {
  const {
    currentColor,
    selectedItem,
    predefinedColors,
    handleColorChange,
    handleColorReset,
    isColorChangerVisible,
    isColorPanelExpanded,
    toggleColorPanel
  } = useColorChanger();

  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();
  const paletteRef = useRef<HTMLDivElement>(null);

  // 화면 경계 내에서 제한
  const constrainToViewport = (x: number, y: number) => {
    if (!paletteRef.current) return { x, y };
    
    const rect = paletteRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const minX = 0;
    const maxX = viewportWidth - rect.width;
    const minY = 0;
    const maxY = viewportHeight - rect.height;
    
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y))
    };
  };

  // 드래그 시작
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // 드래그 중
  const handleDrag = (event: any, info: any) => {
    const newPosition = constrainToViewport(
      position.x + info.delta.x,
      position.y + info.delta.y
    );
    setPosition(newPosition);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 색상 변경 핸들러 (실제 3D 모델에 적용)
  const handleModelColorChange = (color: string) => {
    handleColorChange(color);
    // TODO: 실제 3D 모델에 색상 적용 로직 추가
    console.log(`🎨 색상 변경: ${selectedItem?.name} -> ${color}`);
  };

  // 색상 초기화 핸들러 (실제 3D 모델에 적용)
  const handleModelColorReset = () => {
    handleColorReset();
    // TODO: 실제 3D 모델에 색상 초기화 로직 추가
    console.log('🔄 색상 초기화');
  };

  // 가구가 선택되지 않았을 때는 표시하지 않음
  if (!isColorChangerVisible || !selectedItem) {
    return null;
  }

  return (
    <motion.div
      ref={paletteRef}
      className={`fixed z-50 ${className}`}
      style={{
        x: position.x,
        y: position.y,
      }}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      dragConstraints={{
        left: 0,
        right: typeof window !== 'undefined' ? window.innerWidth - 200 : 0,
        top: 0,
        bottom: typeof window !== 'undefined' ? window.innerHeight - 200 : 0,
      }}
      animate={{
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging 
          ? '0 20px 40px rgba(0,0,0,0.3)' 
          : '0 10px 25px rgba(0,0,0,0.15)'
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className={`bg-white rounded-xl shadow-lg border-2 border-gray-200 transition-all duration-300 ${
        isColorPanelExpanded ? 'p-4 min-w-[200px]' : 'p-2 min-w-[40px]'
      }`}>
        {/* 드래그 핸들 */}
        <div 
          className="cursor-move flex items-center gap-2 mb-2"
          onMouseDown={(e) => dragControls.start(e)}
        >
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>

        {/* 색상 패널 헤더 - 접기/펼치기 버튼 */}
        <button
          onClick={toggleColorPanel}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-all duration-200 w-full"
          title={isColorPanelExpanded ? '색상 패널 접기' : '색상 패널 펼치기'}
        >
          <span className="text-base">🎨</span>
          {isColorPanelExpanded && (
            <span className="transition-all duration-200">
              {selectedItem?.name || '선택된 가구'}
            </span>
          )}
          <span className={`text-xs transition-transform duration-200 ${isColorPanelExpanded ? 'rotate-0' : 'rotate-180'}`}>
            ▼
          </span>
        </button>
        
        {/* 색상 선택 영역 - 접기/펼치기 상태에 따라 표시 */}
        <div className={`overflow-hidden transition-all duration-300 ${isColorPanelExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-wrap gap-2 mb-2">
            {predefinedColors.map((colorOption) => (
              <button
                key={colorOption.color}
                onClick={() => handleModelColorChange(colorOption.color)}
                className={`w-8 h-8 rounded border-2 transition-all duration-200 ${
                  currentColor === colorOption.color ? 'border-blue-500 scale-110' : 'border-gray-300 hover:scale-105'
                }`}
                style={{ backgroundColor: colorOption.color }}
                title={colorOption.name}
              />
            ))}
          </div>
          <button
            onClick={handleModelColorReset}
            className="text-xs text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            🔄 원본으로 복원
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FloatingColorPalette;
