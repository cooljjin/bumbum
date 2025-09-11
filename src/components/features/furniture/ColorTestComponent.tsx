import React, { useState, useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ModelAnalyzer } from '../../../utils/modelAnalyzer';
import { FurnitureColorChanger } from '../../../utils/colorChanger';

interface ColorTestComponentProps {
  modelPath: string;
}

export const ColorTestComponent: React.FC<ColorTestComponentProps> = ({ modelPath }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [blanketColor, setBlanketColor] = useState('#FF6B6B');
  const [model, setModel] = useState<THREE.Group | null>(null);
  
  const gltf = useGLTF(modelPath);

  useEffect(() => {
    if (gltf && gltf.scene) {
      const clonedModel = gltf.scene.clone();
      setModel(clonedModel);
      
      // 모델 분석
      console.log('🔍 Cozy Bed 모델 분석 중...');
      ModelAnalyzer.analyzeModel(clonedModel);
      setIsAnalyzed(true);
    }
  }, [gltf]);

  const handleColorChange = (color: string) => {
    if (model) {
      setBlanketColor(color);
      FurnitureColorChanger.changeBlanketColor(model, color);
    }
  };

  const resetColors = () => {
    if (model) {
      FurnitureColorChanger.resetToOriginalColors(model);
    }
  };

  const predefinedColors = [
    { name: '빨간색', color: '#FF6B6B' },
    { name: '파란색', color: '#4ECDC4' },
    { name: '초록색', color: '#45B7D1' },
    { name: '보라색', color: '#96CEB4' },
    { name: '주황색', color: '#FFEAA7' },
    { name: '핑크색', color: '#DDA0DD' },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🛏️ Cozy Bed 색상 변경 테스트</h2>
      
      {!isAnalyzed && (
        <div className="mb-4 p-3 bg-yellow-100 rounded">
          모델을 분석 중입니다... 브라우저 콘솔을 확인해주세요.
        </div>
      )}
      
      {isAnalyzed && (
        <div className="mb-4 p-3 bg-green-100 rounded">
          ✅ 모델 분석 완료! 브라우저 콘솔에서 상세 정보를 확인하세요.
        </div>
      )}
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">이불 색상 선택</h3>
        <div className="flex flex-wrap gap-2">
          {predefinedColors.map((colorOption) => (
            <button
              key={colorOption.color}
              onClick={() => handleColorChange(colorOption.color)}
              className={`px-4 py-2 rounded text-white font-medium ${
                blanketColor === colorOption.color ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: colorOption.color }}
            >
              {colorOption.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <button
          onClick={resetColors}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          🔄 원본 색상으로 복원
        </button>
      </div>
      
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <h4 className="font-semibold mb-2">사용법:</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>위의 색상 버튼을 클릭하여 이불 색상을 변경합니다</li>
          <li>브라우저 개발자 도구 콘솔에서 변경 과정을 확인할 수 있습니다</li>
          <li>3D 뷰에서 변경된 색상을 확인하세요</li>
          <li>원본 색상으로 복원하려면 "원본 색상으로 복원" 버튼을 클릭하세요</li>
        </ol>
      </div>
      
      {/* 3D 모델 렌더링 */}
      {model && (
        <primitive object={model} ref={groupRef} />
      )}
    </div>
  );
};
