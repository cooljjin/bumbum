'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 가상화 계산
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // 보이는 아이템들만 렌더링
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      originalIndex: startIndex + index
    }));
  }, [items, startIndex, endIndex]);

  // 스크롤 핸들러
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  // 스크롤 위치 동기화
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      setScrollTop(container.scrollTop);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, originalIndex }) => (
          <div
            key={originalIndex}
            style={{
              position: 'absolute',
              top: originalIndex * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, originalIndex)}
          </div>
        ))}
      </div>
    </div>
  );
}

// 가상화된 가구 카탈로그 컴포넌트
interface VirtualFurnitureCatalogProps {
  furniture: any[];
  itemHeight: number;
  containerHeight: number;
  onFurnitureSelect: (furniture: any) => void;
  isPlacing: boolean;
  isMobile: boolean;
}

export const VirtualFurnitureCatalog: React.FC<VirtualFurnitureCatalogProps> = React.memo(({
  furniture,
  itemHeight,
  containerHeight,
  onFurnitureSelect,
  isPlacing,
  isMobile
}) => {
  const renderFurnitureItem = useCallback((item: any, index: number) => (
    <div
      key={item.id}
      className={`p-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
        isPlacing ? 'opacity-50' : ''
      }`}
      onClick={() => !isPlacing && onFurnitureSelect(item)}
    >
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
          {item.thumbnailPath ? (
            <img
              src={item.thumbnailPath}
              alt={item.nameKo || item.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-gray-500 text-lg">🪑</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {item.nameKo || item.name}
          </h3>
          <p className="text-xs text-gray-500 truncate">
            {item.category}
          </p>
        </div>
      </div>
    </div>
  ), [onFurnitureSelect, isPlacing]);

  return (
    <VirtualList
      items={furniture}
      itemHeight={itemHeight}
      containerHeight={containerHeight}
      renderItem={renderFurnitureItem}
      overscan={3}
      className="bg-white"
    />
  );
});

VirtualFurnitureCatalog.displayName = 'VirtualFurnitureCatalog';

export default VirtualList;
