'use client';

import React, { useState, useEffect } from 'react';
import { IconButton } from '../ui/IconButton';

interface AppHeaderProps {
  isViewLocked: boolean;
  onViewLockToggle: () => void;
  onShowSettings: () => void;
  onShowUserPreferences: () => void;
  onShowAccessibility: () => void;
  onShowExport: () => void;
  onShowAnalytics: () => void;
}

export function AppHeader({
  isViewLocked,
  onViewLockToggle,
  onShowSettings,
  onShowUserPreferences,
  onShowAccessibility,
  onShowExport,
  onShowAnalytics
}: AppHeaderProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(navigator.userAgent) || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 모바일에서는 MobileHeader가 표시되므로 AppHeader는 숨김
  if (isMobile) return null;

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🏠 미니룸
          </h1>

                    <div className="flex items-center gap-2">
            <IconButton
              icon={isViewLocked ? '🔒' : '🔓'}
              onClick={onViewLockToggle}
              title={isViewLocked ? '시점 고정 해제' : '시점 고정'}
              variant={isViewLocked ? 'danger' : 'default'}
            />

            <IconButton
              icon="⚙️"
              onClick={onShowSettings}
              title="설정"
              variant="default"
            />

            <IconButton
              icon="💾"
              onClick={onShowUserPreferences}
              title="내 디자인"
              ariaLabel="사용자 디자인 관리"
              variant="default"
            />

            <IconButton
              icon="♿"
              onClick={onShowAccessibility}
              title="접근성 설정"
              ariaLabel="접근성 설정 열기"
              variant="default"
            />

            <IconButton
              icon="📤"
              onClick={onShowExport}
              title="내보내기 및 공유"
              ariaLabel="디자인 내보내기 및 공유"
              variant="default"
            />

            <IconButton
              icon="📊"
              onClick={onShowAnalytics}
              title="사용 분석"
              ariaLabel="사용 분석 대시보드"
              variant="default"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
