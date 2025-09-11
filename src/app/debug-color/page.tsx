'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EditableFurniture } from '../../components/features/furniture/EditableFurniture';
import { PlacedItem } from '../../types/editor';
import { Vector3, Euler } from 'three';
import EditToolbar from '../../components/layout/EditToolbar';

export default function DebugColorPage() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [showFurnitureCatalog, setShowFurnitureCatalog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // 테스트용 침대 아이템들 생성
  const testBeds: PlacedItem[] = [
    {
      id: 'test-bed-1',
      name: 'Cozy Bed 1',
      modelPath: '/models/furniture/Cozy_bed_0909043453_texture.glb',
      position: new Vector3(-2, 0, 0),
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
    },
    {
      id: 'test-bed-2',
      name: 'Cozy Bed 2',
      modelPath: '/models/furniture/Cozy_bed_0909043453_texture.glb',
      position: new Vector3(2, 0, 0),
      rotation: new Euler(0, Math.PI, 0),
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
    }
  ];

  const handleSelect = (id: string | null) => {
    setSelectedItem(id);
    console.log('가구 선택:', id);
  };

  const handleUpdate = (id: string, updates: Partial<PlacedItem>) => {
    console.log('가구 업데이트:', id, updates);
  };

  const handleDelete = (id: string) => {
    console.log('가구 삭제:', id);
  };

  const handleToggleFurnitureCatalog = () => {
    setShowFurnitureCatalog(!showFurnitureCatalog);
  };

  const handleToggleTemplateSelector = () => {
    setShowTemplateSelector(!showTemplateSelector);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* 상단 툴바 */}
      <div className="absolute top-4 left-4 z-50">
        <EditToolbar
          onToggleFurnitureCatalog={handleToggleFurnitureCatalog}
          showFurnitureCatalog={showFurnitureCatalog}
          onToggleTemplateSelector={handleToggleTemplateSelector}
          showTemplateSelector={showTemplateSelector}
          isMobile={false}
        />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            🎨 색상 변경 디버깅 페이지
          </h1>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded ${
                isEditMode ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
              }`}
            >
              {isEditMode ? '편집 모드 ON' : '편집 모드 OFF'}
            </button>
            <div className="text-sm text-gray-600">
              선택된 가구: {selectedItem || '없음'}
            </div>
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
              
              {/* 테스트용 침대들 */}
              {testBeds.map((bed) => (
                <EditableFurniture
                  key={bed.id}
                  item={bed}
                  isSelected={selectedItem === bed.id}
                  isEditMode={isEditMode}
                  onSelect={handleSelect}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
              
              <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
            </Canvas>
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">디버깅 정보</h2>
          <div className="space-y-2 text-sm">
            <p><strong>편집 모드:</strong> {isEditMode ? 'ON' : 'OFF'}</p>
            <p><strong>선택된 가구:</strong> {selectedItem || '없음'}</p>
            <p><strong>가구 수:</strong> {testBeds.length}개</p>
            <p><strong>색상 변경 UI:</strong> 가구 선택 시 상단 툴바에 표시</p>
          </div>
        </div>

        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">사용법:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>침대를 클릭하여 선택합니다</li>
            <li>선택된 상태에서 상단 툴바의 색상 팔레트를 사용합니다</li>
            <li>브라우저 개발자 도구 콘솔에서 색상 변경 과정을 확인할 수 있습니다</li>
            <li>여러 침대를 배치하여 각각 다른 색상으로 변경할 수 있습니다</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
