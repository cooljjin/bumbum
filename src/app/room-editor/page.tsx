'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useEditorActions } from '../../hooks/useEditorStore';
import { enableScrollLock, disableScrollLock, preventKeyScroll, preventWheelScroll, preventTouchScroll } from '../../utils/scrollLock';

// Real3DRoom 컴포넌트를 동적으로 로드 (SSR 문제 방지)
const Real3DRoom = dynamic(() => import('../../components/Real3DRoom').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-xl text-gray-600">3D 룸을 로딩 중입니다...</p>
      </div>
    </div>
  )
});

// 로딩 컴포넌트
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4" />
      <p className="text-xl text-gray-600">3D 룸을 로딩 중입니다...</p>
    </div>
  </div>
);

export default function RoomEditorPage() {
  const [isViewLocked, setIsViewLocked] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Editor store에서 setMode 함수 가져오기
  const { setMode } = useEditorActions();

  useEffect(() => {
    // 페이지 로드 완료 후 로딩 상태 해제
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 편집 모드에서 스크롤 락 처리
  useEffect(() => {
    if (isEditMode) {
      enableScrollLock();
      
      // 모든 스크롤 관련 이벤트 리스너 등록
      const eventOptions = { passive: false, capture: true } as AddEventListenerOptions;
      
      document.addEventListener('keydown', preventKeyScroll, eventOptions);
      document.addEventListener('wheel', preventWheelScroll, eventOptions);
      document.addEventListener('touchstart', preventTouchScroll, eventOptions);
      document.addEventListener('touchmove', preventTouchScroll, eventOptions);
      document.addEventListener('touchend', preventTouchScroll, eventOptions);
      
      console.log('🔒 편집 모드 진입: 스크롤 락 활성화');
    } else {
      disableScrollLock();
      
      // 모든 이벤트 리스너 제거
      document.removeEventListener('keydown', preventKeyScroll, { capture: true });
      document.removeEventListener('wheel', preventWheelScroll, { capture: true });
      document.removeEventListener('touchstart', preventTouchScroll, { capture: true });
      document.removeEventListener('touchmove', preventTouchScroll, { capture: true });
      document.removeEventListener('touchend', preventTouchScroll, { capture: true });
      
      console.log('🔓 편집 모드 종료: 스크롤 락 해제');
    }

    return () => {
      // 컴포넌트 언마운트 시 정리
      disableScrollLock();
      document.removeEventListener('keydown', preventKeyScroll, { capture: true });
      document.removeEventListener('wheel', preventWheelScroll, { capture: true });
      document.removeEventListener('touchstart', preventTouchScroll, { capture: true });
      document.removeEventListener('touchmove', preventTouchScroll, { capture: true });
      document.removeEventListener('touchend', preventTouchScroll, { capture: true });
    };
  }, [isEditMode]);



  const handleEditModeChange = (editMode: boolean) => {
    setIsEditMode(editMode);
    
    // editorStore의 mode도 함께 변경
    setMode(editMode ? 'edit' : 'view');
    
    console.log('🎯 편집 모드 상태:', { editMode, mode: editMode ? 'edit' : 'view' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">bumbum 에디터</h1>
          <p className="text-lg text-gray-600">3D 룸을 준비하고 있습니다...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">🏠 bumbum 에디터</h1>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isEditMode
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {isEditMode ? '✏️ 편집 모드' : '👁️ 뷰 모드'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isViewLocked
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {isViewLocked ? '🔒 시점 고정' : '🔓 시점 자유'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsViewLocked(!isViewLocked)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isViewLocked
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                {isViewLocked ? '🔓 시점 해제' : '🔒 시점 고정'}
              </button>

              <button
                onClick={() => handleEditModeChange(!isEditMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isEditMode
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isEditMode ? '👁️ 뷰 모드' : '✏️ 편집 모드'}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 메인 컨텐츠 */}
      <main className="relative">
        {/* 3D 룸 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full h-[calc(100vh-80px)]"
        >
          <Suspense fallback={<LoadingFallback />}>
            <Real3DRoom
              shadowMode="realtime"
              isViewLocked={isViewLocked}
              isEditMode={isEditMode}
            />
          </Suspense>
        </motion.div>
      </main>

      {/* 푸터 */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="bg-white/80 backdrop-blur-md border-t border-blue-200 py-6 mt-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            🚀 고급 3D 미니룸 에디터 | 드래그 앤 드롭으로 가구를 자유롭게 배치하세요
          </p>
          <div className="mt-2 text-sm text-gray-500">
            <span className="mr-4">🎯 그리드 스냅</span>
            <span className="mr-4">🔄 회전 스냅</span>
            <span className="mr-4">📱 모바일 지원</span>
            <span>🎨 실시간 렌더링</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
