'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiSync, FiCheck, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { CustomFurnitureItem } from '../../../types/furniture';
import { HybridStorage } from '../../../services/storage/hybridStorage';
import { SyncEvent } from '../../../types/storage';

interface HybridFurnitureCatalogProps {
  onFurnitureSelect: (furniture: CustomFurnitureItem) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export const HybridFurnitureCatalog: React.FC<HybridFurnitureCatalogProps> = ({
  onFurnitureSelect,
  onClose,
  isMobile = false
}) => {
  const [items, setItems] = useState<CustomFurnitureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncStatus, setSyncStatus] = useState<{
    queueLength: number;
    isProcessing: boolean;
    nextSyncIn: number;
  }>({ queueLength: 0, isProcessing: false, nextSyncIn: 0 });
  
  const hybridStorage = new HybridStorage();

  // 동기화 이벤트 리스너
  const handleSyncEvent = useCallback((event: SyncEvent) => {
    console.log('[UI] Sync event:', event);
    
    switch (event.type) {
      case 'start':
        setSyncing(true);
        break;
      case 'complete':
        setSyncing(false);
        loadItems(); // 목록 새로고침
        break;
      case 'error':
        setSyncing(false);
        console.error('[UI] Sync error:', event.error);
        break;
    }
  }, []);

  // 컴포넌트 마운트 시 이벤트 리스너 등록
  useEffect(() => {
    hybridStorage.addSyncEventListener(handleSyncEvent);
    
    return () => {
      hybridStorage.removeSyncEventListener(handleSyncEvent);
    };
  }, [handleSyncEvent]);

  // 아이템 목록 로드
  const loadItems = async () => {
    try {
      setLoading(true);
      const furnitureItems = await hybridStorage.getFurnitureList();
      setItems(furnitureItems);
    } catch (error) {
      console.error('Failed to load furniture items:', error);
    } finally {
      setLoading(false);
    }
  };

  // 동기화 상태 업데이트
  const updateSyncStatus = async () => {
    try {
      const status = await hybridStorage.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to get sync status:', error);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadItems();
    updateSyncStatus();
    
    // 주기적으로 동기화 상태 업데이트
    const interval = setInterval(updateSyncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // 개별 아이템 동기화
  const handleSyncItem = async (item: CustomFurnitureItem) => {
    try {
      setSyncing(true);
      await hybridStorage.updateFurnitureItem(item.storage.localId, {
        sync: { ...item.sync, status: 'pending' }
      });
      await loadItems(); // 목록 새로고침
    } catch (error) {
      console.error('Failed to sync item:', error);
    } finally {
      setSyncing(false);
    }
  };

  // 즉시 동기화 실행
  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      await hybridStorage.syncNow();
    } catch (error) {
      console.error('Failed to sync now:', error);
    } finally {
      setSyncing(false);
    }
  };

  // 검색 필터링
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nameKo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 동기화 상태 아이콘
  const getSyncIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <FiCheck className="text-green-500" size={16} />;
      case 'pending':
        return <FiRefreshCw className="text-yellow-500 animate-spin" size={16} />;
      case 'error':
        return <FiAlertCircle className="text-red-500" size={16} />;
      default:
        return <FiSync className="text-gray-400" size={16} />;
    }
  };

  // 동기화 상태 텍스트
  const getSyncText = (status: string) => {
    switch (status) {
      case 'synced':
        return '동기화됨';
      case 'pending':
        return '동기화 중';
      case 'error':
        return '동기화 실패';
      default:
        return '대기 중';
    }
  };

  if (loading) {
    return (
      <div className="bg-white overflow-hidden flex flex-col h-full w-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">가구 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white overflow-hidden flex flex-col h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* 헤더 */}
      {!isMobile && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">🪑 커스텀 가구 라이브러리 (MVP)</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* 동기화 상태 표시 */}
          <div className="bg-blue-400/20 border border-blue-300/30 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="text-sm">Mock API로 동기화 시뮬레이션 중</span>
              </div>
              <div className="text-xs text-blue-100">
                큐: {syncStatus.queueLength} | 처리중: {syncStatus.isProcessing ? '예' : '아니오'}
              </div>
            </div>
          </div>

          {/* 검색 바 */}
          <div className="relative">
            <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="가구 검색... (이름, 태그)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            />
          </div>
        </div>
      )}

      {/* 모바일용 간단한 헤더 */}
      {isMobile && (
        <div className="p-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">커스텀 가구 ({filteredItems.length}개)</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      )}

      {/* 가구 목록 */}
      <div className="p-2 flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <FiSearch size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '커스텀 가구가 없습니다'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? '다른 검색어로 시도해보세요' : '새로운 가구를 추가해보세요'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
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
                      {getSyncIcon(item.sync.status)}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      상태: {getSyncText(item.sync.status)}
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
                      onClick={() => onFurnitureSelect(item)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                    >
                      선택
                    </button>
                    <button
                      onClick={() => handleSyncItem(item)}
                      disabled={item.sync.status === 'synced' || syncing}
                      className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {item.sync.status === 'synced' ? '동기화됨' : '동기화'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 액션 바 */}
      {!isMobile && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              총 {items.length}개 항목 | 동기화 대기: {syncStatus.queueLength}개
            </div>
            <button
              onClick={handleSyncNow}
              disabled={syncing || syncStatus.queueLength === 0}
              className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <FiSync size={14} />
              {syncing ? '동기화 중...' : '지금 동기화'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HybridFurnitureCatalog;

