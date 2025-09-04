'use client';

import React from 'react';
import { AccessibilityProvider } from '../components/shared/AccessibilityProvider';
import { AppLayout } from '../components/layout/AppLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { MobileHeader } from '../components/layout/MobileHeader';
import { MobileMenu } from '../components/layout/MobileMenu';
import { MainContent } from '../components/layout/MainContent';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { SettingsSidebar } from '../components/layout/SettingsSidebar';
import KeyboardShortcuts from '../components/shared/KeyboardShortcuts';
import UndoRedoHistory from '../components/features/editor/UndoRedoHistory';
import MobileUI from '../components/ui/MobileUI';
import UserPreferences from '../components/features/modals/UserPreferences';
import AccessibilitySettings from '../components/shared/AccessibilitySettings';
import ExportShareTools from '../components/features/modals/ExportShareTools';
import AnalyticsDashboard from '../components/shared/AnalyticsDashboard';
import { useSelectedItemId, removeItem, undo, redo, canUndo, canRedo, selectItem } from '../store/editorStore';
import { useUIManager } from '../hooks/useUIManager';

export default function HomePage() {
  // UI 상태 관리 훅 사용
  const uiManager = useUIManager();

  // Zustand store에서 상태 가져오기
  const selectedItemId = useSelectedItemId();

  // 모바일 메뉴 상태
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  return (
    <AccessibilityProvider>
      <div
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
        id="main-content"
        role="main"
        aria-label="3D 가구 라이브러리 및 룸 에디터"
      >
        {/* 모바일 헤더 */}
        <MobileHeader
          isViewLocked={uiManager.isViewLocked}
          onViewLockToggle={uiManager.toggleViewLock}
          onShowSettings={uiManager.toggleShowSettings}
          onShowMenu={() => setShowMobileMenu(true)}
          isEditMode={uiManager.isEditMode}
          onEditModeToggle={uiManager.toggleEditMode}
        />

        <AppLayout
          header={
            <AppHeader
              isViewLocked={uiManager.isViewLocked}
              onViewLockToggle={uiManager.toggleViewLock}
              onShowSettings={uiManager.toggleShowSettings}
              onShowUserPreferences={() => uiManager.openModal('userPreferences')}
              onShowAccessibility={() => uiManager.openModal('accessibility')}
              onShowExport={() => uiManager.openModal('export')}
              onShowAnalytics={() => uiManager.openModal('analytics')}
              isEditMode={uiManager.isEditMode}
              onEditModeToggle={uiManager.toggleEditMode}
            />
          }
          sidebar={
            uiManager.showSettings ? (
              <SettingsSidebar
                isViewLocked={uiManager.isViewLocked}
                isEditMode={uiManager.isEditMode}
                onViewLockChange={uiManager.setViewLocked}
                onEditModeChange={uiManager.setEditMode}
                onClose={() => uiManager.setShowSettings(false)}
              />
            ) : undefined
          }
          footer={
            <BottomNavigation
              onShowSettings={uiManager.toggleShowSettings}
            />
          }
          showSidebar={uiManager.showSettings}
        >
          <MainContent
            isViewLocked={uiManager.isViewLocked}
            isEditMode={uiManager.isEditMode}
            onEditModeChange={uiManager.setEditMode}
          />
        </AppLayout>

        {/* 키보드 단축키 시스템 */}
        <KeyboardShortcuts
          enabled={uiManager.isEditMode}
          onShowHelp={uiManager.toggleShowSettings}
        />

        {/* Undo/Redo 히스토리 */}
        {uiManager.isEditMode && (
          <UndoRedoHistory position="top-left" />
        )}

        {/* 모바일 메뉴 */}
        <MobileMenu
          isVisible={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          onShowUserPreferences={() => uiManager.openModal('userPreferences')}
          onShowExport={() => uiManager.openModal('export')}
          onShowAnalytics={() => uiManager.openModal('analytics')}
          onShowAccessibility={() => uiManager.openModal('accessibility')}
        />

        {/* 모바일 UI */}
        <MobileUI
          selectedItemId={selectedItemId}
          onDeleteSelected={() => selectedItemId && removeItem(selectedItemId)}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo()}
          canRedo={canRedo()}
          onItemSelect={selectItem}
        />

        {/* 사용자 환경 설정 */}
        <UserPreferences
          isOpen={uiManager.showUserPreferences}
          onClose={() => uiManager.setShowUserPreferences(false)}
          isMobile={false}
        />

        {/* 접근성 설정 */}
        <AccessibilitySettings
          isOpen={uiManager.showAccessibilitySettings}
          onClose={() => uiManager.setShowAccessibilitySettings(false)}
        />

        {/* 내보내기 및 공유 도구 */}
        <ExportShareTools
          isOpen={uiManager.showExportTools}
          onClose={() => uiManager.setShowExportTools(false)}
          isMobile={false}
        />

        {/* 사용 분석 대시보드 */}
        <AnalyticsDashboard
          isOpen={uiManager.showAnalytics}
          onClose={() => uiManager.setShowAnalytics(false)}
          isMobile={false}
        />
      </div>
    </AccessibilityProvider>
  );
}

