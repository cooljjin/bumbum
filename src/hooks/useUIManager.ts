import { useState, useEffect } from 'react';
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

  // Onboarding states
  showOnboarding: boolean;
  onboardingStep: number;
  hasCompletedOnboarding: boolean;
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

  // Onboarding actions
  setShowOnboarding: (show: boolean) => void;
  setOnboardingStep: (step: number) => void;
  nextOnboardingStep: () => void;
  prevOnboardingStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  startOnboarding: () => void;

  // Close all modals
  closeAllModals: () => void;

  // Modal priority management - 한 번에 하나의 모달만 표시
  openModal: (modalType: 'settings' | 'userPreferences' | 'accessibility' | 'export' | 'analytics') => void;
}

export interface UIManager extends UIManagerState, UIManagerActions {}

const ONBOARDING_COMPLETED_KEY = 'bumbum_onboarding_completed';
const TOTAL_ONBOARDING_STEPS = 5;

const initialState: UIManagerState = {
  isViewLocked: false,
  isEditMode: false,  // 기본적으로 보기 모드로 시작
  showSettings: false,
  showUserPreferences: false,
  showAccessibilitySettings: false,
  showExportTools: false,
  showAnalytics: false,
  showOnboarding: false,
  onboardingStep: 0,
  hasCompletedOnboarding: false,
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

  // Onboarding states
  const [showOnboarding, setShowOnboarding] = useState(initialState.showOnboarding);
  const [onboardingStep, setOnboardingStep] = useState(initialState.onboardingStep);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(initialState.hasCompletedOnboarding);

  // localStorage에서 온보딩 완료 상태 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
      if (completed === 'true') {
        setHasCompletedOnboarding(true);
      } else {
        // 첫 방문자는 자동으로 온보딩 표시
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('[useUIManager] Failed to load onboarding state:', error);
    }
  }, []);

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

  // Onboarding actions
  const nextOnboardingStep = () => {
    setOnboardingStep((prev) => Math.min(prev + 1, TOTAL_ONBOARDING_STEPS - 1));
  };

  const prevOnboardingStep = () => {
    setOnboardingStep((prev) => Math.max(prev - 1, 0));
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingStep(0);
    completeOnboarding();
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingStep(0);
    setHasCompletedOnboarding(true);
    
    // localStorage에 완료 상태 저장
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      } catch (error) {
        console.error('[useUIManager] Failed to save onboarding completion:', error);
      }
    }
  };

  const startOnboarding = () => {
    setOnboardingStep(0);
    setShowOnboarding(true);
  };

  const closeAllModals = () => {
    setShowSettings(false);
    setShowUserPreferences(false);
    setShowAccessibilitySettings(false);
    setShowExportTools(false);
    setShowAnalytics(false);
    setShowOnboarding(false);
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
    showOnboarding,
    onboardingStep,
    hasCompletedOnboarding,

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
    setShowOnboarding,
    setOnboardingStep,
    nextOnboardingStep,
    prevOnboardingStep,
    skipOnboarding,
    completeOnboarding,
    startOnboarding,
    closeAllModals,
    openModal,
  };
}
