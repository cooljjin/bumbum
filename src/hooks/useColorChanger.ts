import { useState, useCallback, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { FurnitureColorChanger } from '../utils/colorChanger';
import * as THREE from 'three';

export const useColorChanger = () => {
  const [currentColor, setCurrentColor] = useState<string>('#FF6B6B');
  const [isColorPanelExpanded, setIsColorPanelExpanded] = useState<boolean>(true);
  const { selectedItemId, placedItems, updateItem } = useEditorStore();
  const modelRef = useRef<THREE.Group | null>(null);

  const selectedItem = selectedItemId ? placedItems.find(item => item.id === selectedItemId) : null;

  // 3D 모델 참조 설정
  const setModelRef = useCallback((ref: THREE.Group | null) => {
    modelRef.current = ref;
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setCurrentColor(color);
    
    // 선택된 가구의 색상 변경
    if (selectedItem && modelRef.current) {
      // 3D 모델의 머티리얼 색상 변경
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach((material) => {
            if (material.color) {
              // 원본 색상 저장 (복원용)
              if (!material.userData.originalColor) {
                material.userData.originalColor = material.color.clone();
              }
              
              // 색상 변경
              const hexColor = parseInt(color.replace('#', ''), 16);
              material.color.setHex(hexColor);
              material.needsUpdate = true;
            }
          });
        }
      });
      
      // 아이템 상태에 색상 정보 저장
      updateItem(selectedItem.id, { 
        userData: { 
          ...selectedItem.userData, 
          customColor: color 
        } 
      });
      
      console.log(`🎨 색상 변경: ${selectedItem.name} -> ${color}`);
    }
  }, [selectedItem, updateItem]);

  const handleColorReset = useCallback(() => {
    if (selectedItem && modelRef.current) {
      // 3D 모델의 원본 색상으로 복원
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach((material) => {
            if (material.userData.originalColor) {
              material.color.copy(material.userData.originalColor);
              material.needsUpdate = true;
            }
          });
        }
      });
      
      // 아이템 상태에서 색상 정보 제거
      updateItem(selectedItem.id, { 
        userData: { 
          ...selectedItem.userData, 
          customColor: undefined 
        } 
      });
      
      setCurrentColor('#FF6B6B');
      console.log('🔄 색상 초기화');
    }
  }, [selectedItem, updateItem]);

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
    toggleColorPanel,
    setModelRef
  };
};
