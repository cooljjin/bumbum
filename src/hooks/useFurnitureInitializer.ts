/**
 * 가구 배치 초기화 훅
 * 
 * 기존 editorStore.loadAutoSave() 활용
 */

import { useEffect, useState } from 'react';
import { useEditorStore } from '@/store/editorStore';

export const useFurnitureInitializer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  
  const loadAutoSave = useEditorStore(state => state.loadAutoSave);
  const loadSavedState = useEditorStore(state => state.loadSavedState);
  const setRoomDimensions = useEditorStore(state => state.setRoomDimensions);

  useEffect(() => {
    const initializeFurniture = async () => {
      try {
        console.log('🔄 [Initializer] 가구 배치 데이터 로드 시작...');

        // 1. bumbum_room_state (우선순위 1)
        try {
          loadSavedState();
          const items = useEditorStore.getState().placedItems;
          
          if (items && items.length > 0) {
            console.log('✅ [Initializer] bumbum_room_state에서 복원:', items.length, '개');
            setHasLoadedData(true);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn('⚠️ [Initializer] bumbum_room_state 로드 실패:', error);
        }

        // 2. bumbum_auto_save (우선순위 2)
        try {
          const autoSavedItems = loadAutoSave();
          
          if (autoSavedItems && autoSavedItems.length > 0) {
            console.log('✅ [Initializer] bumbum_auto_save에서 복원:', autoSavedItems.length, '개');
            setHasLoadedData(true);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn('⚠️ [Initializer] bumbum_auto_save 로드 실패:', error);
        }

        console.log('ℹ️ [Initializer] 저장된 데이터 없음 - 기본 상태 사용');
      } catch (error) {
        console.error('❌ [Initializer] 초기화 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // 초기화 실행 (한 번만)
    initializeFurniture();
  }, []); // 빈 배열 - 최초 1회만 실행

  return {
    isLoading,
    hasLoadedData
  };
};

