'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Real3DRoom 컴포넌트를 동적으로 로드
const Real3DRoom = dynamic(() => import('../../components/Real3DRoom'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3" />
        <p className="text-gray-600">3D 룸을 로딩 중입니다...</p>
      </div>
    </div>
  )
});

export default function CleanUIPage() {
  const [isViewLocked, setIsViewLocked] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 단순화된 헤더 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 backdrop-blur-md shadow-sm border-b border-blue-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 로고와 제목 */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-800">🏠 미니룸</h1>
              <div className="hidden sm:flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isEditMode ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {isEditMode ? '편집' : '보기'}
                </span>
              </div>
            </div>

            {/* 핵심 컨트롤만 표시 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsViewLocked(!isViewLocked)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isViewLocked
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isViewLocked ? '시점 고정 해제' : '시점 고정'}
              >
                {isViewLocked ? '🔒' : '🔓'}
              </button>

              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isEditMode
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
                title={isEditMode ? '편집 모드 종료' : '편집 모드 시작'}
              >
                {isEditMode ? '✏️' : '👁️'}
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  showSettings
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="설정"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 메인 컨텐츠 - 3D 룸에 집중 */}
      <main className="relative flex-1">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full h-[calc(100vh-80px)] rounded-lg overflow-hidden shadow-lg border border-blue-200 bg-white"
        >
          <Real3DRoom
            shadowMode="realtime"
            isViewLocked={isViewLocked}
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
          />
        </motion.div>
      </main>

      {/* 설정 사이드바 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            key="settings-sidebar"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">설정</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* 설정 옵션들 */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">룸 설정</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isViewLocked}
                        onChange={(e) => setIsViewLocked(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">시점 고정</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isEditMode}
                        onChange={(e) => setIsEditMode(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">편집 모드</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">도움말</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• 마우스로 드래그하여 카메라 이동</p>
                    <p>• 휠로 확대/축소</p>
                    <p>• 편집 모드에서 가구 배치 가능</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 모바일 하단 네비게이션 */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around py-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isEditMode ? 'text-orange-600' : 'text-gray-600'
            }`}
          >
            <span className="text-lg">{isEditMode ? '✏️' : '👁️'}</span>
            <span className="text-xs">{isEditMode ? '편집' : '보기'}</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              showSettings ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <span className="text-lg">⚙️</span>
            <span className="text-xs">설정</span>
          </button>
        </div>
      </div>
    </div>
  );
}
