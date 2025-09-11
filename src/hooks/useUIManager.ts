import { useState } from 'react';
import { useEditorActions } from './useEditorStore';

export interface UIManagerState {
  // View states
  isViewLocked: boolean;
  isEditMode: boolean;

  // Modal states
  showSettings: boolean;
  showUserPreferences: boolean;
  showAccessibilitySettings: boolean;
  showExportTools: boolean;
  showAnalytics: boolean;
}

export interface UIManagerActions {
  // View actions
  setViewLocked: (locked: boolean) => void;
  toggleViewLock: () => void;
  setEditMode: (editMode: boolean) => void;
  toggleEditMode: () => void;

  // Modal actions
  setShowSettings: (show: boolean) => void;
  toggleShowSettings: () => void;
  setShowUserPreferences: (show: boolean) => void;
  setShowAccessibilitySettings: (show: boolean) => void;
  setShowExportTools: (show: boolean) => void;
  setShowAnalytics: (show: boolean) => void;

  // Close all modals
  closeAllModals: () => void;

  // Modal priority management - 한 번에 하나의 모달만 표시
  openModal: (modalType: 'settings' | 'userPreferences' | 'accessibility' | 'export' | 'analytics') => void;
}

export interface UIManager extends UIManagerState, UIManagerActions {}

const initialState: UIManagerState = {
  isViewLocked: false,
  isEditMode: false,  // 기본적으로 보기 모드로 시작
  showSettings: false,
  showUserPreferences: false,
  showAccessibilitySettings: false,
  showExportTools: false,
  showAnalytics: false,
};

export function useUIManager(): UIManager {
  // Editor store에서 setMode 함수 가져오기
  const { setMode } = useEditorActions();

  // View states
  const [isViewLocked, setIsViewLocked] = useState(initialState.isViewLocked);
  const [isEditMode, setIsEditMode] = useState(initialState.isEditMode);

  // Modal states
  const [showSettings, setShowSettings] = useState(initialState.showSettings);
  const [showUserPreferences, setShowUserPreferences] = useState(initialState.showUserPreferences);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(initialState.showAccessibilitySettings);
  const [showExportTools, setShowExportTools] = useState(initialState.showExportTools);
  const [showAnalytics, setShowAnalytics] = useState(initialState.showAnalytics);

  // Actions
  const toggleViewLock = () => setIsViewLocked(!isViewLocked);
  
  // 편집 모드 토글 시 editorStore의 mode도 함께 변경
  const toggleEditMode = () => {
    const newEditMode = !isEditMode;
    setIsEditMode(newEditMode);
    
    // editorStore의 mode도 함께 변경
    setMode(newEditMode ? 'edit' : 'view');
    
    // console.log('🎯 편집 모드 토글:', { newEditMode, mode: newEditMode ? 'edit' : 'view' });
  };
  
  const toggleShowSettings = () => setShowSettings(!showSettings);

  // 편집 모드 설정 시에도 editorStore의 mode 함께 변경
  const setEditMode = (editMode: boolean) => {
    setIsEditMode(editMode);
    setMode(editMode ? 'edit' : 'view');
    // console.log('🎯 편집 모드 설정:', { editMode, mode: editMode ? 'edit' : 'view' });
  };

  // Modal priority management - 한 번에 하나의 모달만 표시
  const openModal = (modalType: 'settings' | 'userPreferences' | 'accessibility' | 'export' | 'analytics') => {
    // 먼저 모든 모달 닫기
    closeAllModals();

    // 지정된 모달 열기
    switch (modalType) {
      case 'settings':
        setShowSettings(true);
        break;
      case 'userPreferences':
        setShowUserPreferences(true);
        break;
      case 'accessibility':
        setShowAccessibilitySettings(true);
        break;
      case 'export':
        setShowExportTools(true);
        break;
      case 'analytics':
        setShowAnalytics(true);
        break;
    }
  };

  const closeAllModals = () => {
    setShowSettings(false);
    setShowUserPreferences(false);
    setShowAccessibilitySettings(false);
    setShowExportTools(false);
    setShowAnalytics(false);
  };

  // 기존 함수들을 우선순위 적용으로 수정
  const setShowSettingsWithPriority = (show: boolean) => {
    if (show) {
      openModal('settings');
    } else {
      setShowSettings(false);
    }
  };

  const setShowUserPreferencesWithPriority = (show: boolean) => {
    if (show) {
      openModal('userPreferences');
    } else {
      setShowUserPreferences(false);
    }
  };

  const setShowAccessibilitySettingsWithPriority = (show: boolean) => {
    if (show) {
      openModal('accessibility');
    } else {
      setShowAccessibilitySettings(false);
    }
  };

  const setShowExportToolsWithPriority = (show: boolean) => {
    if (show) {
      openModal('export');
    } else {
      setShowExportTools(false);
    }
  };

  const setShowAnalyticsWithPriority = (show: boolean) => {
    if (show) {
      openModal('analytics');
    } else {
      setShowAnalytics(false);
    }
  };

  return {
    // State
    isViewLocked,
    isEditMode,
    showSettings,
    showUserPreferences,
    showAccessibilitySettings,
    showExportTools,
    showAnalytics,

    // Actions
    setViewLocked: setIsViewLocked,
    toggleViewLock,
    setEditMode,
    toggleEditMode,
    setShowSettings: setShowSettingsWithPriority,
    toggleShowSettings,
    setShowUserPreferences: setShowUserPreferencesWithPriority,
    setShowAccessibilitySettings: setShowAccessibilitySettingsWithPriority,
    setShowExportTools: setShowExportToolsWithPriority,
    setShowAnalytics: setShowAnalyticsWithPriority,
    closeAllModals,
    openModal,
  };
}
