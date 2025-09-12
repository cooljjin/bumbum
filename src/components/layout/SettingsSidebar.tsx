'use client';

import React from 'react';

interface SettingsSidebarProps {
  isViewLocked: boolean;
  isEditMode: boolean;
  onViewLockChange: (locked: boolean) => void;
  onEditModeChange: (editMode: boolean) => void;
  onClose: () => void;
}

export function SettingsSidebar({
  isViewLocked,
  isEditMode,
  onViewLockChange,
  onEditModeChange,
  onClose
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

      {/* 벽 배치 설정 제거 */}

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
