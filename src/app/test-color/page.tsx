'use client';

import React, { useState } from 'react';
import { Canvas, extend } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EditableFurniture } from '../../components/features/furniture/EditableFurniture';
import { PlacedItem } from '../../types/editor';
import { Vector3, Euler } from 'three';

// H3 확장 (만약 H3가 Three.js 확장 객체라면)
// extend({ H3: H3Class });

export default function TestColorPage() {
  const [selectedItem, setSelectedItem] = useState<string | null>('test-bed-1'); // 자동으로 침대 선택
  const [isEditMode, setIsEditMode] = useState(false);

  // 테스트용 침대 아이템 생성
  const testBed: PlacedItem = {
    id: 'test-bed-1',
    name: 'Cozy Bed',
    modelPath: '/models/furniture/Cozy_bed_0909043453_texture.glb',
    position: new Vector3(0, 0, 0),
    rotation: new Euler(0, 0, 0),
    scale: new Vector3(1, 1, 1),
    footprint: {
      width: 2.0,
      depth: 1.5,
      height: 0.8
    },
    metadata: {
      category: 'bedroom',
      furnitureId: 'cozybed'
    }
  };

  const handleSelect = (id: string | null) => {
    setSelectedItem(id);
    console.log('가구 선택:', id);
    console.log('테스트 침대 정보:', testBed);
    console.log('선택된 아이템 ID:', id);
    console.log('현재 선택된 아이템:', selectedItem);
    
    // 강제로 편집 모드 활성화
    if (id) {
      console.log('편집 모드 활성화');
    }
  };

  const handleUpdate = (id: string, updates: Partial<PlacedItem>) => {
    console.log('가구 업데이트:', id, updates);
  };

  const handleDelete = (id: string) => {
    console.log('가구 삭제:', id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          🎨 색상 변경 테스트
        </h1>
        
        <div className="mb-4 flex justify-center gap-4">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded ${
              isEditMode ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
            }`}
          >
            {isEditMode ? '편집 모드 ON' : '편집 모드 OFF'}
          </button>
          <div className="text-sm text-gray-600 flex items-center">
            선택된 가구: {selectedItem || '없음'}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="w-full h-96 border border-gray-300 rounded">
            <Canvas
              camera={{ position: [0, 3, 5], fov: 50 }}
              style={{ width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />
              
              <Environment preset="apartment" />
              
              <EditableFurniture
                item={testBed}
                isSelected={selectedItem === testBed.id}
                isEditMode={isEditMode}
                onSelect={handleSelect}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
              
              <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
            </Canvas>
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">사용법</h2>
          <div className="space-y-2 text-sm">
            <p>1. 침대를 클릭하여 선택합니다</p>
            <p>2. 선택된 상태에서 왼쪽 상단의 색상 팔레트를 사용합니다</p>
            <p>3. 브라우저 개발자 도구 콘솔에서 색상 변경 과정을 확인할 수 있습니다</p>
            <p>4. "원본으로 복원" 버튼을 클릭하여 원래 색상으로 되돌릴 수 있습니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}
