'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  // 화면 읽기 지원
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;

  // 고대비 모드
  highContrastMode: boolean;
  toggleHighContrast: () => void;

  // 글자 크기
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;

  // 포커스 관리
  focusTrap: (element: HTMLElement | null) => void;
  releaseFocusTrap: () => void;

  // 키보드 네비게이션
  enableKeyboardNavigation: boolean;
  toggleKeyboardNavigation: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [enableKeyboardNavigation, setEnableKeyboardNavigation] = useState(true);
  const [focusTrapElement, setFocusTrapElement] = useState<HTMLElement | null>(null);
  const [announcements, setAnnouncements] = useState<Array<{message: string, priority: 'polite' | 'assertive'}>>([]);

  // 화면 읽기 지원 - 라이브 리전 사용
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, { message, priority }]);
  };

  // 고대비 모드 토글
  const toggleHighContrast = () => {
    setHighContrastMode(prev => !prev);
  };

  // 글자 크기 변경
  const handleSetFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
  };

  // 포커스 트랩
  const focusTrap = (element: HTMLElement | null) => {
    setFocusTrapElement(element);
  };

  const releaseFocusTrap = () => {
    setFocusTrapElement(null);
  };

  // 키보드 네비게이션 토글
  const toggleKeyboardNavigation = () => {
    setEnableKeyboardNavigation(prev => !prev);
  };

  // CSS 클래스 적용
  useEffect(() => {
    const root = document.documentElement;

    // 고대비 모드
    if (highContrastMode) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // 글자 크기
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${fontSize}`);

    // 키보드 네비게이션
    if (enableKeyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }
  }, [highContrastMode, fontSize, enableKeyboardNavigation]);

  // 포커스 트랩 효과
  useEffect(() => {
    if (!focusTrapElement || !enableKeyboardNavigation) return;

    const focusableElements = focusTrapElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }

      if (e.key === 'Escape') {
        releaseFocusTrap();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusTrapElement, enableKeyboardNavigation]);

  const contextValue: AccessibilityContextType = {
    announceToScreenReader,
    highContrastMode,
    toggleHighContrast,
    fontSize,
    setFontSize: handleSetFontSize,
    focusTrap,
    releaseFocusTrap,
    enableKeyboardNavigation,
    toggleKeyboardNavigation
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}

      {/* 화면 읽기 알림을 위한 숨겨진 라이브 리전 */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcements
          .filter(announcement => announcement.priority === 'polite')
          .map((announcement, index) => (
            <div key={`polite-${index}`}>{announcement.message}</div>
          ))}
      </div>

      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {announcements
          .filter(announcement => announcement.priority === 'assertive')
          .map((announcement, index) => (
            <div key={`assertive-${index}`}>{announcement.message}</div>
          ))}
      </div>

      {/* 스킵 링크 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        메인 콘텐츠로 건너뛰기
      </a>
    </AccessibilityContext.Provider>
  );
};

// 접근성 훅
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// 접근성 있는 버튼 컴포넌트
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label'?: string;
  'aria-describedby'?: string;
  children: ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  children,
  ...props
}) => {
  return (
    <button
      {...props}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </button>
  );
};

// 접근성 있는 모달 컴포넌트
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const { focusTrap, releaseFocusTrap } = useAccessibility();

  useEffect(() => {
    if (isOpen) {
      focusTrap(document.getElementById('modal-content'));
    } else {
      releaseFocusTrap();
    }
  }, [isOpen, focusTrap, releaseFocusTrap]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div
        id="modal-content"
        className={`bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-full overflow-y-auto`}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="modal-title" className="text-xl font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="모달 닫기"
            className="p-2 rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AccessibilityProvider;
