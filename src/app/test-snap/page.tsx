'use client';

import React, { useState } from 'react';
import BottomCategoryTabs from '../../components/layout/BottomCategoryTabs';
import FurnitureCatalog from '../../components/features/furniture/FurnitureCatalog';
import { FurnitureCategory } from '../../types/furniture';

export default function TestSnapPage() {
  const [selectedCategory, setSelectedCategory] = useState<FurnitureCategory | 'all'>('all');

  // 테스트용 카테고리별 아이템 수 (모든 카테고리 포함)
  const categoryCounts: Record<FurnitureCategory | 'all', number> = {
    all: 156,
    living: 45,
    bedroom: 32,
    kitchen: 28,
    bathroom: 15,
    office: 18,
    outdoor: 8,
    decorative: 10,
    storage: 0
  };

  // 가구 선택 핸들러
  const handleFurnitureSelect = (furniture: any) => {
    console.log('가구 선택됨:', furniture);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          가구 카탈로그 UI 테스트
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽: 현재 선택된 카테고리 정보 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">현재 선택된 카테고리</h2>
            <p className="text-lg text-blue-600 font-medium">
              {selectedCategory === 'all' ? '전체' :
               selectedCategory === 'living' ? '거실' :
               selectedCategory === 'bedroom' ? '침실' :
               selectedCategory === 'kitchen' ? '주방' :
               selectedCategory === 'bathroom' ? '욕실' :
               selectedCategory === 'office' ? '사무실' :
               selectedCategory === 'outdoor' ? '실외' :
               selectedCategory === 'decorative' ? '장식품' :
               selectedCategory === 'storage' ? '수납' : selectedCategory}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              아이템 수: {categoryCounts[selectedCategory]}
            </p>
          </div>

          {/* 오른쪽: 카테고리별 아이템 수 요약 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">카테고리별 아이템 수</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(categoryCounts).map(([category, count]) => (
                <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-800">
                    {category === 'all' ? '전체' :
                     category === 'living' ? '거실' :
                     category === 'bedroom' ? '침실' :
                     category === 'kitchen' ? '주방' :
                     category === 'bathroom' ? '욕실' :
                     category === 'office' ? '사무실' :
                     category === 'outdoor' ? '실외' :
                     category === 'decorative' ? '장식품' :
                     category === 'storage' ? '수납' : category}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 가구 카탈로그 */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">가구 카탈로그 (이미지 중심 그리드)</h2>
          <div className="flex justify-center">
            <FurnitureCatalog
              selectedCategory={selectedCategory}
              onCategoryChange={(category) => setSelectedCategory(category as FurnitureCategory | 'all')}
              onFurnitureSelect={handleFurnitureSelect}
              className="w-full max-w-4xl"
            />
          </div>
        </div>
      </div>

      {/* 하단 카테고리 탭 */}
      <BottomCategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoryCounts={categoryCounts}
      />
    </div>
  );
}
