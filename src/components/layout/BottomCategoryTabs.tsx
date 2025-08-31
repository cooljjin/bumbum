'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FurnitureCategory } from '../types/furniture';

interface BottomCategoryTabsProps {
  selectedCategory?: FurnitureCategory | 'all';
  onCategoryChange?: (category: FurnitureCategory | 'all') => void;
  categoryCounts: Record<FurnitureCategory | 'all', number>;
}

// 카테고리 데이터 구조 정의 (더 많은 카테고리 추가)
const categories = [
  { id: 'all' as const, name: '전체', nameKo: '전체' },
  { id: 'living' as const, name: 'Living Room', nameKo: '거실' },
  { id: 'bedroom' as const, name: 'Bedroom', nameKo: '침실' },
  { id: 'kitchen' as const, name: 'Kitchen', nameKo: '주방' },
  { id: 'bathroom' as const, name: 'Bathroom', nameKo: '욕실' },
  { id: 'office' as const, name: 'Office', nameKo: '사무실' },
  { id: 'outdoor' as const, name: 'Outdoor', nameKo: '실외' },
  { id: 'decorative' as const, name: 'Decorative', nameKo: '장식품' },
  { id: 'storage' as const, name: 'Storage', nameKo: '수납' }
];

export default function BottomCategoryTabs({
  selectedCategory = 'all',
  onCategoryChange,
  categoryCounts
}: BottomCategoryTabsProps) {
  // 모바일 환경 감지
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(navigator.userAgent) || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 카테고리 변경 핸들러 (터치 최적화)
  const handleCategoryChange = (category: FurnitureCategory | 'all') => {
    // 터치 피드백을 위한 haptic feedback (모바일에서 지원하는 경우)
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(50);
    }

    // 상위 컴포넌트에 카테고리 변경 알림
    if (onCategoryChange) {
      onCategoryChange(category);
    }

    console.log('🏷️ 카테고리 선택:', category);
  };

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        {/* 모바일: 세로 스크롤, 데스크톱: 가로 스크롤 */}
        <div className={`flex gap-2 overflow-auto pb-2 scrollbar-hide ${
          isMobile
            ? 'flex-col max-h-32'
            : 'flex-row space-x-2 max-h-20'
        }`}>
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`flex-shrink-0 rounded-full font-medium transition-all duration-300 whitespace-nowrap ${
                isMobile
                  ? 'px-3 py-2 text-sm min-h-[44px]' // 모바일: 터치 최적화 (44px 이상)
                  : 'px-4 py-2 text-sm' // 데스크톱: 일반 크기
              } ${
                category.id === selectedCategory
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
              }`}
              whileHover={{ y: isMobile ? 0 : -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: categories.indexOf(category) * 0.1 }}
              // 접근성 개선
              aria-label={`${category.nameKo} 카테고리 선택 (${categoryCounts[category.id] || 0}개 아이템)`}
              role="tab"
              tabIndex={0}
            >
              <span className={`flex items-center gap-2 ${
                isMobile ? 'justify-center' : 'justify-start'
              }`}>
                <span className="text-sm sm:text-base">{category.nameKo}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  category.id === 'all'
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {categoryCounts[category.id] || 0}
                </span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 스크롤 표시기 (데스크톱에서만) */}
      {!isMobile && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <motion.div
            className="w-2 h-2 bg-gray-300 rounded-full"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      )}

      {/* 모바일 터치 가이드 */}
      {isMobile && (
        <div className="absolute top-2 right-2">
          <motion.div
            className="w-3 h-3 bg-blue-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            title="터치로 카테고리를 선택하세요"
          />
        </div>
      )}
    </motion.div>
  );
}
