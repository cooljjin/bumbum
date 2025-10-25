'use client';

import React from 'react';
import { FiPlayCircle, FiSave, FiHelpCircle, FiShare2, FiBarChart2 } from 'react-icons/fi';

interface SettingsSidebarProps {
  isViewLocked: boolean;
  isEditMode: boolean;
  onViewLockChange: (locked: boolean) => void;
  onEditModeChange: (editMode: boolean) => void;
  onClose: () => void;
  // 온보딩 관련
  hasCompletedOnboarding: boolean;
  onStartOnboarding: () => void;
  // 제거된 헤더 기능들
  onShowUserPreferences: () => void;
  onShowAccessibility: () => void;
  onShowExport: () => void;
  onShowAnalytics: () => void;
}

export function SettingsSidebar({
  isViewLocked,
  isEditMode,
  onViewLockChange,
  onEditModeChange,
  onClose,
  hasCompletedOnboarding,
  onStartOnboarding,
  onShowUserPreferences,
  onShowAccessibility,
  onShowExport,
  onShowAnalytics
}: SettingsSidebarProps) {
  return (
    <div className="p-6" data-testid="settings-panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800" data-testid="settings-title">설정</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="설정 닫기"
          data-testid="settings-close"
        >
          ✕
        </button>
      </div>

      {/* 룸 설정 */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4" data-testid="room-settings-title">룸 설정</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isViewLocked}
              onChange={(e) => onViewLockChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              aria-label="시점 고정"
              data-testid="lock-view-checkbox"
            />
            <span className="text-gray-700">시점 고정</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isEditMode}
              onChange={(e) => onEditModeChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              aria-label="편집 모드"
              data-testid="edit-mode-checkbox"
            />
            <span className="text-gray-700">편집 모드</span>
          </label>
        </div>
      </div>

      {/* 온보딩 섹션 */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">시작하기</h3>
        <button
          onClick={onStartOnboarding}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
        >
          <FiPlayCircle size={20} />
          <div className="flex-1 text-left">
            <div className="font-semibold">
              {hasCompletedOnboarding ? '튜토리얼 다시 보기' : '튜토리얼 시작'}
            </div>
            <div className="text-xs text-blue-100">
              주요 기능을 빠르게 배워보세요
            </div>
          </div>
        </button>
      </div>

      {/* 추가 기능 섹션 */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">기능</h3>
        <div className="space-y-2">
          <button
            onClick={onShowUserPreferences}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiSave size={18} />
            <span>내 디자인 관리</span>
          </button>

          <button
            onClick={onShowAccessibility}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiHelpCircle size={18} />
            <span>접근성 설정</span>
          </button>

          <button
            onClick={onShowExport}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiShare2 size={18} />
            <span>디자인 내보내기 및 공유</span>
          </button>

          <button
            onClick={onShowAnalytics}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiBarChart2 size={18} />
            <span>사용 분석 대시보드</span>
          </button>
        </div>
      </div>

      {/* 도움말 */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-4" data-testid="help-title">도움말</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• 마우스로 드래그하여 카메라 이동</p>
          <p>• 휠로 확대/축소</p>
          <p>• 편집 모드에서 가구 배치 가능</p>
        </div>

        {/* 키보드 단축키 */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-700 mb-3" data-testid="shortcuts-title">키보드 단축키</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="space-y-1">
              <p><span className="font-mono bg-gray-100 px-2 py-1 rounded">Q</span> 선택 도구</p>
              <p><span className="font-mono bg-gray-100 px-2 py-1 rounded">G</span> 이동 도구</p>
              <p><span className="font-mono bg-gray-100 px-2 py-1 rounded">R</span> 회전 도구</p>
              <p><span className="font-mono bg-gray-100 px-2 py-1 rounded">S</span> 크기 조절 도구</p>
            </div>
            <div className="space-y-1">
              <p><span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl+Z</span> 실행 취소</p>
              <p><span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl+Y</span> 다시 실행</p>
              <p><span className="font-mono bg-gray-100 px-2 py-1 rounded">Delete</span> 선택된 항목 삭제</p>
              <p><span className="font-mono bg-gray-100 px-2 py-1 rounded">Escape</span> 선택 해제</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
