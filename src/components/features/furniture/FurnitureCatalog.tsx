import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAllFurnitureItems,
  getFurnitureByCategory,
  searchFurniture
} from '../../../data/furnitureCatalog';

import { FurnitureItem } from '../../../types/furniture';

interface FurnitureCatalogProps {
  onFurnitureSelect?: (furniture: FurnitureItem) => void;
  onCategoryChange?: (category: string) => void;
  selectedCategory?: string;
  className?: string;
  isVisible?: boolean;
  isPlacing?: boolean;
}

export const FurnitureCatalog: React.FC<FurnitureCatalogProps> = ({
  onFurnitureSelect,
  selectedCategory = 'all',
  className = '',
  isVisible = true,
  isPlacing = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dragItem, setDragItem] = useState<FurnitureItem | null>(null);

  // 모바일 환경 감지
  const [isMobile, setIsMobile] = useState(false);

  // 이미지 lazy loading을 위한 상태
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());
  const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Intersection Observer 설정
  const imageObserver = useRef<IntersectionObserver | null>(null);

  // 스크롤 컨테이너 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 휠스크롤 이벤트 처리
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scrollAmount = e.deltaY;
      scrollContainer.scrollTop += scrollAmount;
    };

    // 휠스크롤 이벤트 리스너 추가
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  React.useEffect(() => {
    const checkMobile = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(navigator.userAgent) || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intersection Observer 설정
  React.useEffect(() => {
    imageObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const imageId = entry.target.getAttribute('data-image-id');
            if (imageId) {
              setVisibleImages(prev => new Set(prev).add(imageId));
            }
          }
        });
      },
      {
        rootMargin: '50px', // 50px 전에 미리 로드
        threshold: 0.1
      }
    );

    return () => {
      if (imageObserver.current) {
        imageObserver.current.disconnect();
      }
    };
  }, []);

  // 애니메이션 변수
  const slideUpVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 25,
        stiffness: 200,
        duration: 0.6
      }
    },
    exit: { 
      y: '100%', 
      opacity: 0,
      transition: {
        type: 'spring' as const,
        damping: 20,
        stiffness: 300,
        duration: 0.4
      }
    }
  };

  const slideDownVariants = {
    hidden: { y: 0, opacity: 1 },
    visible: { 
      y: '100%', 
      opacity: 0.8,
      transition: {
        type: 'spring' as const,
        damping: 30,
        stiffness: 400,
        duration: 0.5
      }
    }
  };

  // 필터링된 가구 목록
  const filteredFurniture = useMemo(() => {
    let items = getAllFurnitureItems();

    // 카테고리 필터링
    if (selectedCategory && selectedCategory !== 'all') {
      items = getFurnitureByCategory(selectedCategory);
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      items = searchFurniture(searchQuery);
    }

    return items;
  }, [searchQuery, selectedCategory]);

  // 가구 선택 - Real3DRoom에서 배치 처리
  const handleFurnitureSelect = (furniture: FurnitureItem) => {
    if (onFurnitureSelect) {
      onFurnitureSelect(furniture);
    }

    // 모바일에서 터치 피드백
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(100);
    }

    console.log('🎯 가구 선택됨:', furniture.nameKo || furniture.name);
  };

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, furniture: FurnitureItem) => {
    setDragItem(furniture);
    e.dataTransfer.setData('application/json', JSON.stringify(furniture));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDragItem(null);
  };

  // 썸네일 이미지 로드 실패 시 기본 아이콘 표시
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const fallbackIcon = target.nextElementSibling as HTMLElement;
    if (fallbackIcon) {
      fallbackIcon.style.display = 'flex';
    }
  };

  // 카테고리별 기본 아이콘
  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'living': '🛋️',
      'bedroom': '🛏️',
      'kitchen': '🍳',
      'bathroom': '🚿',
      'office': '💼',
      'outdoor': '🌳',
      'decorative': '🎨',
      'storage': '📦'
    };
    return icons[category] || '🪑';
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={isPlacing ? 'placing' : 'visible'}
          variants={isPlacing ? slideDownVariants : slideUpVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`bg-white text-gray-800 rounded-2xl shadow-2xl border-2 border-gray-300 overflow-hidden ${
            className
          }`} 
          style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4" style={{ backgroundColor: 'rgba(37, 99, 235, 1)' }}>
            <h2 className="text-base sm:text-lg font-bold mb-1">🪑 가구 카탈로그</h2>
            <p className="text-blue-100 text-xs sm:text-sm">
              {isPlacing ? '가구를 배치 중입니다...' : '원하는 가구를 선택하여 배치하세요'}
            </p>
          </div>

          {/* Search */}
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50" style={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}>
            <div className="relative">
              <input
                type="text"
                placeholder="가구 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-8 sm:pl-10 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-gray-700 placeholder-gray-400 text-sm sm:text-base"
                style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}
                aria-label="가구 검색"
                role="searchbox"
                disabled={isPlacing}
              />
              <span className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base sm:text-lg">🔍</span>
            </div>
          </div>

          {/* Furniture Grid */}
          <div className="max-h-96 overflow-y-auto p-3 sm:p-4 bg-gray-50" style={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}>
            {filteredFurniture.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-3xl sm:text-4xl mb-2">🔍</div>
                <p className="text-sm sm:text-base">검색 결과가 없습니다</p>
                <p className="text-xs sm:text-sm">다른 키워드로 검색해보세요</p>
              </div>
            ) : (
              <div className={`grid gap-3 ${
                isMobile
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : 'grid-cols-4'
              }`}>
                {filteredFurniture.map((furniture) => (
                  <motion.div
                    key={furniture.id}
                    data-testid="furniture-item"
                    draggable={!isPlacing}
                    onDragStart={(event) => handleDragStart(event as any, furniture)}
                    onDragEnd={handleDragEnd}
                    onClick={() => !isPlacing && handleFurnitureSelect(furniture)}
                    className={`group cursor-pointer rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white shadow-sm ${
                      dragItem?.id === furniture.id ? 'scale-95 opacity-90' : ''
                    } ${
                      isMobile ? 'min-h-[120px]' : 'min-h-[100px]'
                    } ${
                      isPlacing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}
                    role="button"
                    tabIndex={isPlacing ? -1 : 0}
                    aria-label={`${furniture.nameKo || furniture.name} 가구 선택`}
                    onKeyDown={(e) => {
                      if (!isPlacing && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleFurnitureSelect(furniture);
                      }
                    }}
                    whileHover={!isPlacing ? { scale: 1.05 } : {}}
                    whileTap={!isPlacing ? { scale: 0.95 } : {}}
                  >
                    <div className="p-2 sm:p-3">
                      {/* Thumbnail Image with Lazy Loading */}
                      <div
                        ref={(el) => {
                          if (el) {
                            imageRefs.current.set(furniture.id, el);
                            if (imageObserver.current) {
                              imageObserver.current.observe(el);
                            }
                          }
                        }}
                        data-image-id={furniture.id}
                        className={`relative w-full mb-2 bg-gray-100 rounded-lg overflow-hidden ${
                          isMobile ? 'h-16 sm:h-20' : 'h-20'
                        }`}
                      >
                        {furniture.thumbnailPath && visibleImages.has(furniture.id) ? (
                          <>
                            <img
                              src={furniture.thumbnailPath}
                              alt={furniture.nameKo || furniture.name}
                              className="w-full h-full object-cover transition-opacity duration-300"
                              onError={handleImageError}
                              loading="lazy"
                            />
                            <div
                              className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl bg-gray-100"
                              style={{ display: 'none' }}
                            >
                              {getCategoryIcon(furniture.category)}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl bg-gray-100">
                            {getCategoryIcon(furniture.category)}
                          </div>
                        )}
                      </div>

                      {/* Furniture Name */}
                      <div className="text-center">
                        <h3 className="font-medium text-gray-800 text-xs sm:text-sm leading-tight line-clamp-2">
                          {furniture.nameKo || furniture.name}
                        </h3>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-2 sm:p-3 border-t border-gray-200" style={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}>
            <div className="text-center text-xs sm:text-sm text-gray-600">
              <p>총 {filteredFurniture.length}개의 가구</p>
              {isPlacing && (
                <p className="text-blue-600 font-medium mt-1">가구 배치 중...</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FurnitureCatalog;
