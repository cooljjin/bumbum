'use client';

import React, { useState } from 'react';

interface FurnitureItem {
  id: string;
  name: string;
  icon: string;
  count: number;
  category: string;
}

interface FurnitureLibraryProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectFurniture: (item: FurnitureItem) => void;
}

const furnitureData: FurnitureItem[] = [
  // 가구 카테고리
  { id: 'furniture-1', name: '의자', icon: '🪑', count: 5, category: '가구' },
  { id: 'furniture-2', name: '테이블', icon: '🪑', count: 3, category: '가구' },
  { id: 'furniture-3', name: '소파', icon: '🛋️', count: 2, category: '가구' },
  { id: 'cozy_sofa_0911122807_texture', name: '코지 소파', icon: '🛋️', count: 1, category: '가구' },
  { id: 'furniture-4', name: '침대', icon: '🛏️', count: 1, category: '가구' },
  { id: 'furniture-5', name: '옷장', icon: '🗄️', count: 2, category: '가구' },

  // 장식품 카테고리
  { id: 'decoration-1', name: '화분', icon: '🪴', count: 4, category: '장식품' },
  { id: 'decoration-2', name: '램프', icon: '💡', count: 3, category: '장식품' },
  { id: 'decoration-3', name: '커튼', icon: '🪟', count: 2, category: '장식품' },
  { id: 'decoration-4', name: '러그', icon: '🟫', count: 3, category: '장식품' },

  // 벽걸이 아이템
  { id: 'wall-1', name: '그림', icon: '🖼️', count: 2, category: '벽걸이 아이템' },
  { id: 'wall-2', name: '시계', icon: '🕐', count: 1, category: '벽걸이 아이템' },
  { id: 'wall-3', name: '선반', icon: '📚', count: 3, category: '벽걸이 아이템' },

  // 전자제품
  { id: 'electronics-1', name: 'TV', icon: '📺', count: 1, category: '전자제품' },
  { id: 'electronics-2', name: '컴퓨터', icon: '💻', count: 2, category: '전자제품' },
  { id: 'electronics-3', name: '스피커', icon: '🔊', count: 1, category: '전자제품' }
];

const categories = [
  { id: 'all', name: '전체', icon: '🏠' },
  { id: 'furniture', name: '가구', icon: '🪑' },
  { id: 'decoration', name: '장식품', icon: '🎨' },
  { id: 'wall', name: '벽걸이 아이템', icon: '🖼️' },
  { id: 'electronics', name: '전자제품', icon: '📱' }
];

export default function FurnitureLibrary({ isVisible, onClose, onSelectFurniture }: FurnitureLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!isVisible) return null;

  const filteredFurniture = selectedCategory === 'all'
    ? furnitureData
    : furnitureData.filter(item => {
        switch (selectedCategory) {
          case 'furniture': return item.category === '가구';
          case 'decoration': return item.category === '장식품';
          case 'wall': return item.category === '벽걸이 아이템';
          case 'electronics': return item.category === '전자제품';
          default: return true;
        }
      });

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      {/* 상단 컨트롤 바 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            ✕
          </button>
          <span className="text-sm font-medium text-gray-700">룸 편집 모드</span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
        >
          완료
        </button>
      </div>

      {/* 카테고리 네비게이션 */}
      <div className="flex space-x-1 p-3 bg-white overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg">{category.icon}</span>
            <span className="text-xs font-medium">{category.name}</span>
          </button>
        ))}
      </div>

      {/* 가구 그리드 */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
          {filteredFurniture.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectFurniture(item)}
              className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <span className="text-2xl mb-2">{item.icon}</span>
              <span className="text-xs text-gray-600 text-center mb-1">{item.name}</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
