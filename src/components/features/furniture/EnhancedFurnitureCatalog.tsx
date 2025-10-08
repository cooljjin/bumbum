'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiGrid, FiList, FiHeart, FiShoppingCart, FiSync, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { FurnitureItem, CustomFurnitureItem } from '../../../types/furniture';
import { setFloorTexture, setWallTexture } from '../../../store/editorStore';
import { HybridStorage } from '../../../services/storage/hybridStorage';
import { SyncEvent } from '../../../types/storage';

interface EnhancedFurnitureCatalogProps {
  furnitureData: FurnitureItem[];
  onFurnitureSelect: (furniture: FurnitureItem) => void;
  onClose: () => void;
  isMobile?: boolean;
}

type SortOption = 'name' | 'price-low' | 'price-high' | 'newest' | 'popular';
type ViewMode = 'grid' | 'list';

export const EnhancedFurnitureCatalog: React.FC<EnhancedFurnitureCatalogProps> = ({
  furnitureData,
  onFurnitureSelect,
  onClose,
  isMobile = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<FurnitureItem[]>([]);
  const [isLoadingFloorTexture, setIsLoadingFloorTexture] = useState(false);
  const [isLoadingWallTexture, setIsLoadingWallTexture] = useState(false);
  const [customItems, setCustomItems] = useState<CustomFurnitureItem[]>([]);
  const [showCustomSection, setShowCustomSection] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // 스크롤 컨테이너 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hybridStorage = new HybridStorage();

  // 커스텀 가구 로드
  const loadCustomItems = async () => {
    try {
      const items = await hybridStorage.getFurnitureList();
      setCustomItems(items);
    } catch (error) {
      console.error('Failed to load custom items:', error);
    }
  };

  // 동기화 이벤트 리스너
  const handleSyncEvent = (event: SyncEvent) => {
    console.log('[UI] Sync event:', event);
    
    switch (event.type) {
      case 'start':
        setSyncing(true);
        break;
      case 'complete':
        setSyncing(false);
        loadCustomItems(); // 목록 새로고침
        break;
      case 'error':
        setSyncing(false);
        console.error('[UI] Sync error:', event.error);
        break;
    }
  };

  // 컴포넌트 마운트 시 커스텀 가구 로드
  useEffect(() => {
    loadCustomItems();
    hybridStorage.addSyncEventListener(handleSyncEvent);
    
    return () => {
      hybridStorage.removeSyncEventListener(handleSyncEvent);
    };
  }, []);

  // 네이티브 스크롤 사용 (iOS 모멘텀 스크롤 포함)

  // 카테고리 및 서브카테고리 추출
  const categories = useMemo(() => {
    const cats = new Set<string>();
    const subs = new Map<string, Set<string>>();

    furnitureData.forEach(item => {
      cats.add(item.category);
      if (!subs.has(item.category)) {
        subs.set(item.category, new Set());
      }
      subs.get(item.category)!.add(item.subcategory || "기타");
    });

    return {
      categories: Array.from(cats),
      subcategories: Object.fromEntries(
        Array.from(subs.entries()).map(([cat, subSet]) => [cat, Array.from(subSet)])
      )
    };
  }, [furnitureData]);

  // 가격 범위 계산
  const priceStats = useMemo(() => {
    const prices = furnitureData
      .map(item => item.metadata?.price || 0)
      .filter(price => price > 0);

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
    };
  }, [furnitureData]);

  // 필터링된 가구 데이터
  const filteredFurniture = useMemo(() => {
    let filtered = furnitureData.filter(item => {
      // 검색어 필터링
      const matchesSearch = searchTerm === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nameKo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // 카테고리 필터링
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      // 서브카테고리 필터링
      const matchesSubcategory = selectedSubcategory === 'all' || item.subcategory || "기타" === selectedSubcategory;

      // 가격 범위 필터링
      const itemPrice = item.metadata?.price || 0;
      const matchesPrice = itemPrice >= priceRange[0] && itemPrice <= priceRange[1];

      return matchesSearch && matchesCategory && matchesSubcategory && matchesPrice;
    });

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.metadata?.price || 0) - (b.metadata?.price || 0);
        case 'price-high':
          return (b.metadata?.price || 0) - (a.metadata?.price || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          // ID를 기준으로 정렬 (더 큰 ID가 최신이라고 가정)
          return b.id.localeCompare(a.id);
        case 'popular':
          // 인기도는 임시로 이름으로 정렬
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [furnitureData, searchTerm, selectedCategory, selectedSubcategory, priceRange, sortBy]);

  // 즐겨찾기 토글
  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
  };

  // 최근 본 항목 추가
  const addToRecentlyViewed = (item: FurnitureItem) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(recent => recent.id !== item.id);
      return [item, ...filtered].slice(0, 10); // 최대 10개 유지
    });
  };

  // 가구 선택 핸들러
  const handleFurnitureSelect = (item: FurnitureItem) => {
    addToRecentlyViewed(item);
    
    // 바닥 메테리얼인 경우 즉시 바닥 텍스처 적용
    if (item.category === 'floor' && item.modelPath) {
      setIsLoadingFloorTexture(true);
      
      try {
        setFloorTexture(item.modelPath);
        console.log('✅ 바닥 텍스처 적용:', item.modelPath);
        
        // 로딩 완료 후 상태 업데이트
        setTimeout(() => {
          setIsLoadingFloorTexture(false);
        }, 500); // 텍스처 로딩 시간 고려
      } catch (error) {
        console.error('❌ 바닥 텍스처 적용 실패:', error);
        // 기본 바닥 텍스처로 폴백
        setFloorTexture('/models/floor/floor_wooden.png');
        console.log('🔄 기본 바닥 텍스처로 폴백');
        setIsLoadingFloorTexture(false);
      }
      
      // 바닥 메테리얼은 가구가 아니므로 onFurnitureSelect 호출하지 않음
      if (isMobile) {
        onClose(); // 모바일에서는 선택 후 카탈로그 닫기
      }
      return;
    }
    
    // 벽면 메테리얼인 경우 즉시 벽면 텍스처 적용
    if (item.category === 'wall' && item.modelPath) {
      setIsLoadingWallTexture(true);
      
      try {
        setWallTexture(item.modelPath);
        console.log('✅ 벽면 텍스처 적용:', item.modelPath);
        
        // 로딩 완료 후 상태 업데이트
        setTimeout(() => {
          setIsLoadingWallTexture(false);
        }, 500); // 텍스처 로딩 시간 고려
      } catch (error) {
        console.error('❌ 벽면 텍스처 적용 실패:', error);
        // 기본 벽면 텍스처로 폴백
        setWallTexture('/models/wall/wall_beige.png');
        console.log('🔄 기본 벽면 텍스처로 폴백');
        setIsLoadingWallTexture(false);
      }
      
      // 벽면 메테리얼은 가구가 아니므로 onFurnitureSelect 호출하지 않음
      if (isMobile) {
        onClose(); // 모바일에서는 선택 후 카탈로그 닫기
      }
      return;
    }
    
    onFurnitureSelect(item);
    if (isMobile) {
      onClose(); // 모바일에서는 선택 후 카탈로그 닫기
    }
  };

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <motion.div
      className="bg-white overflow-hidden flex flex-col h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* 헤더 - 모바일에서는 표시하지 않음 */}
      {!isMobile && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">🛋️ 가구 라이브러리</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustomSection(!showCustomSection)}
                className="px-3 py-1 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-colors"
              >
                {showCustomSection ? '기본 가구' : `커스텀 가구 (${customItems.length})`}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          
          {/* 바닥 텍스처 로딩 상태 표시 */}
          {isLoadingFloorTexture && (
            <div className="bg-blue-400/20 border border-blue-300/30 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="text-sm">바닥 텍스처를 적용하는 중...</span>
              </div>
            </div>
          )}

          {/* 벽면 텍스처 로딩 상태 표시 */}
          {isLoadingWallTexture && (
            <div className="bg-green-400/20 border border-green-300/30 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="text-sm">벽면 텍스처를 적용하는 중...</span>
              </div>
            </div>
          )}

          {/* 커스텀 가구 동기화 상태 표시 */}
          {showCustomSection && (
            <div className="bg-purple-400/20 border border-purple-300/30 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span className="text-sm">Mock API로 동기화 시뮬레이션 중</span>
                </div>
                <div className="text-xs text-purple-100">
                  {syncing ? '동기화 중...' : '대기 중'}
                </div>
              </div>
            </div>
          )}

        {/* 검색 바 */}
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="가구 검색... (이름, 설명, 태그)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
          />
        </div>
        </div>
      )}

      {/* 필터 및 정렬 바 - 모바일에서는 간소화 */}
      {!isMobile && (
        <div className="p-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 카테고리 필터 */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('all');
              }}
              className="px-1.5 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs min-w-16"
            >
              <option value="all">전체 카테고리</option>
              {categories.categories.map(category => (
                <option key={category} value={category}>
                  {category === 'living' ? '거실' :
                   category === 'bedroom' ? '침실' :
                   category === 'dining' ? '식당' :
                   category === 'office' ? '사무실' :
                   category === 'floor' ? '바닥' :
                   category === 'wall' ? '벽면' :
                   category}
                </option>
              ))}
            </select>

            {/* 서브카테고리 필터 */}
            {selectedCategory !== 'all' && (
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="px-1.5 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs min-w-16"
              >
                <option value="all">전체 서브카테고리</option>
                {categories.subcategories[selectedCategory]?.map(subcategory => (
                  <option key={subcategory} value={subcategory}>{subcategory}</option>
                ))}
              </select>
            )}

            {/* 가격 범위 필터 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-600">가격:</span>
              <input
                type="range"
                min={priceStats.min}
                max={priceStats.max}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-16"
              />
              <span className="text-xs text-gray-600 min-w-[60px]">
                ~{formatPrice(priceRange[1])}
              </span>
            </div>

            {/* 정렬 옵션 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-1.5 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs min-w-16"
            >
              <option value="name">이름순</option>
              <option value="price-low">가격 낮은순</option>
              <option value="price-high">가격 높은순</option>
              <option value="newest">최신순</option>
              <option value="popular">인기순</option>
            </select>

            {/* 뷰 모드 토글 */}
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                <FiGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                <FiList size={14} />
              </button>
            </div>
          </div>

          {/* 필터 요약 */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-600">
              {filteredFurniture.length}개의 가구
            </span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <FiFilter size={14} />
              고급 필터
            </button>
          </div>
        </div>
      )}

      {/* 모바일용 간단한 검색 및 카테고리 */}
      {isMobile && (
        <div className="p-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 py-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs flex-1"
            >
              <option value="all">전체 카테고리</option>
              {categories.categories.map(category => (
                <option key={category} value={category}>
                  {category === 'living' ? '거실' :
                   category === 'bedroom' ? '침실' :
                   category === 'dining' ? '식당' :
                   category === 'office' ? '사무실' :
                   category === 'floor' ? '바닥' :
                   category === 'wall' ? '벽면' :
                   category}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-600">
              {filteredFurniture.length}개
            </span>
          </div>
        </div>
      )}

      {/* 가구 그리드/리스트 - 스크롤 컨테이너로 개선 */}
      <div 
        ref={scrollContainerRef}
        className="p-2 flex-1 overflow-y-auto min-h-0 furniture-catalog-scroll" 
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 #F1F5F9',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {showCustomSection ? (
          // 커스텀 가구 섹션
          customItems.length === 0 ? (
            <div className="text-center py-12">
              <FiSearch size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">커스텀 가구가 없습니다</h3>
              <p className="text-gray-500">새로운 가구를 추가해보세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customItems.map((item) => (
                <motion.div
                  key={item.storage.localId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-800 text-sm">
                          {item.nameKo || item.name}
                        </h3>
                        {item.sync.status === 'synced' ? (
                          <FiCheck className="text-green-500" size={16} />
                        ) : item.sync.status === 'pending' ? (
                          <FiSync className="text-yellow-500 animate-spin" size={16} />
                        ) : (
                          <FiAlertCircle className="text-red-500" size={16} />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        상태: {item.sync.status === 'synced' ? '동기화됨' : 
                               item.sync.status === 'pending' ? '동기화 중' : '동기화 실패'}
                        {item.sync.lastSynced && (
                          <span className="ml-2">
                            (마지막 동기화: {new Date(item.sync.lastSynced).toLocaleTimeString()})
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>카테고리: {item.category}</span>
                        <span>•</span>
                        <span>크기: {item.footprint.width}×{item.footprint.depth}×{item.footprint.height}m</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          // CustomFurnitureItem을 FurnitureItem으로 변환
                          const furnitureItem: FurnitureItem = {
                            id: item.id,
                            name: item.name,
                            nameKo: item.nameKo,
                            category: item.category,
                            subcategory: item.subcategory,
                            modelPath: URL.createObjectURL(item.files.model.local),
                            thumbnailPath: item.files.thumbnail.local.size > 0 ? 
                              URL.createObjectURL(item.files.thumbnail.local) : undefined,
                            footprint: item.footprint,
                            placement: item.placement,
                            metadata: item.metadata,
                            renderSettings: item.renderSettings,
                            editSettings: item.editSettings
                          };
                          onFurnitureSelect(furnitureItem);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                      >
                        선택
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          // 기본 가구 섹션
          filteredFurniture.length === 0 ? (
            <div className="text-center py-12">
              <FiSearch size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500">다른 검색어로 시도해보세요</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? `grid gap-2 ${isMobile ? 'grid-cols-5' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'}`
                : 'space-y-2'
            }>
              {filteredFurniture.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className={
                    viewMode === 'grid'
                      ? `bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 overflow-hidden ${isMobile ? 'text-sm' : 'text-xs'}`
                      : `bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 p-2 flex gap-2 ${isMobile ? 'text-xs' : 'p-3'}`
                  }
                  onClick={() => handleFurnitureSelect(item)}
                >
                {/* 썸네일 */}
                <div className={
                  viewMode === 'grid'
                    ? `aspect-square bg-gray-100 flex items-center justify-center ${isMobile ? 'text-xl' : 'text-2xl'}`
                    : `bg-gray-100 rounded flex items-center justify-center text-lg flex-shrink-0 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`
                }>
                  {item.thumbnailPath ? (
                    <img
                      src={item.thumbnailPath}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    item.category === 'floor' ? '🏠' : 
                    item.category === 'wall' ? '🧱' : '🛋️'
                  )}
                </div>

                {/* 정보 */}
                <div className={viewMode === 'grid' ? 'p-2' : 'flex-1'}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-medium text-gray-800 text-xs">
                        {item.nameKo || item.name}
                      </h3>
                      <p className="text-xs text-gray-500">{item.metadata?.brand}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        // e.stopPropagation(); // 이벤트 전파 허용
                        toggleFavorite(item.id);
                      }}
                      className={`p-0.5 rounded-full ${
                        favorites.has(item.id)
                          ? 'text-red-500 bg-red-50'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <FiHeart size={12} fill={favorites.has(item.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-600">
                      {item.metadata?.price ? formatPrice(item.metadata.price) : '가격 미정'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">
                        {item.footprint.width}×{item.footprint.depth}m
                      </span>
                      <FiShoppingCart size={12} className="text-gray-400" />
                    </div>
                  </div>

                  {viewMode === 'list' && item.metadata?.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {item.metadata.description}
                    </p>
                  )}
                </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>

      {/* 최근 본 가구 (모바일에서만 표시) */}
      {isMobile && recentlyViewed.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">최근 본 가구</h3>
          <div className="flex gap-2 overflow-x-auto">
            {recentlyViewed.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleFurnitureSelect(item)}
                className="flex-shrink-0 w-16 h-16 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-xl"
                whileTap={{ scale: 0.95 }}
              >
                {item.thumbnailPath ? (
                  <img
                    src={item.thumbnailPath}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  item.category === 'floor' ? '🏠' : 
                  item.category === 'wall' ? '🧱' : '🛋️'
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedFurnitureCatalog;
