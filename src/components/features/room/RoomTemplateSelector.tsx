'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  roomTemplates,
  getTemplatesByCategory,
  searchTemplates,
  getTemplateCategories,
  RoomTemplate
} from '../../../data/roomTemplates';

interface RoomTemplateSelectorProps {
  onTemplateSelect: (template: RoomTemplate) => void;
  onClose: () => void;
  className?: string;
}

export const RoomTemplateSelector: React.FC<RoomTemplateSelectorProps> = ({
  onTemplateSelect,
  onClose,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<RoomTemplate | null>(null);

  // 카테고리 목록
  const categories = getTemplateCategories();

  // 필터링된 템플릿 목록
  const filteredTemplates = useMemo(() => {
    let templates = roomTemplates;

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      templates = getTemplatesByCategory(selectedCategory as any);
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    return templates;
  }, [selectedCategory, searchQuery]);

  // 난이도별 색상
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 템플릿 선택 핸들러
  const handleTemplateSelect = (template: RoomTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelect(template);
  };

  return (
    <div className={`room-template-selector fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/98 backdrop-blur-lg rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden"
        style={{ zIndex: 100 }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">룸 템플릿 선택</h2>
            <p className="text-gray-600 mt-1">미리 구성된 템플릿으로 빠르게 룸을 만들어 보세요</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 검색 입력 */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="템플릿 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.nameKo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 템플릿 그리드 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">템플릿을 찾을 수 없습니다</h3>
              <p className="text-gray-500">다른 검색어로 시도해보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <motion.div
                  key={template.metadata.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-white border-2 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                    selectedTemplate?.metadata.id === template.metadata.id
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 shadow-md'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  {/* 썸네일 */}
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    {template.metadata.thumbnailPath ? (
                      <img
                        src={template.metadata.thumbnailPath}
                        alt={template.metadata.nameKo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl">
                        {template.metadata.category === 'living' && '🏠'}
                        {template.metadata.category === 'bedroom' && '🛏️'}
                        {template.metadata.category === 'kitchen' && '🍳'}
                        {template.metadata.category === 'office' && '💼'}
                        {template.metadata.category === 'dining' && '🍽️'}
                      </div>
                    )}
                  </div>

                  {/* 템플릿 정보 */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">{template.metadata.nameKo}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.metadata.difficulty)}`}>
                        {template.metadata.difficulty === 'beginner' && '초급'}
                        {template.metadata.difficulty === 'intermediate' && '중급'}
                        {template.metadata.difficulty === 'advanced' && '고급'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{template.metadata.descriptionKo}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>🪑 {template.furniture.length}개 가구</span>
                      <span>⏱️ {template.metadata.estimatedTime}분</span>
                    </div>

                    {/* 태그 */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {template.metadata.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {template.metadata.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{template.metadata.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              총 {filteredTemplates.length}개의 템플릿
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                취소
              </button>
              {selectedTemplate && (
                <button
                  onClick={() => handleTemplateSelect(selectedTemplate)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  {selectedTemplate.metadata.nameKo} 적용
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RoomTemplateSelector;
