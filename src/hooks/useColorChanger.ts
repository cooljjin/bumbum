import { useState, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { FurnitureColorChanger } from '../utils/colorChanger';

export const useColorChanger = () => {
  const [currentColor, setCurrentColor] = useState<string>('#FF6B6B');
  const [isColorPanelExpanded, setIsColorPanelExpanded] = useState<boolean>(true);
  const { selectedItemId, placedItems } = useEditorStore();

  const selectedItem = selectedItemId ? placedItems.find(item => item.id === selectedItemId) : null;

  const handleColorChange = useCallback((color: string) => {
    setCurrentColor(color);
    
    // 선택된 가구의 색상 변경
    if (selectedItem) {
      // 실제로는 3D 모델에 접근해야 하지만, 여기서는 상태만 업데이트
      console.log(`🎨 색상 변경: ${selectedItem.name} -> ${color}`);
    }
  }, [selectedItem]);

  const handleColorReset = useCallback(() => {
    console.log('🔄 색상 초기화');
    setCurrentColor('#FF6B6B');
  }, []);

  const toggleColorPanel = useCallback(() => {
    setIsColorPanelExpanded(prev => !prev);
  }, []);

  const predefinedColors = [
    { name: '빨간색', color: '#FF6B6B' },
    { name: '파란색', color: '#4ECDC4' },
    { name: '초록색', color: '#45B7D1' },
    { name: '보라색', color: '#96CEB4' },
    { name: '주황색', color: '#FFEAA7' },
    { name: '핑크색', color: '#DDA0DD' },
  ];

  return {
    currentColor,
    selectedItem,
    predefinedColors,
    handleColorChange,
    handleColorReset,
    isColorChangerVisible: !!selectedItem,
    isColorPanelExpanded,
    toggleColorPanel
  };
};
