'use client';

import React from 'react';
import { IconButton } from '../ui/IconButton';
import { getSafeTouchArea, isMobile } from '../../utils/mobileHtmlConstraints';

interface BottomNavigationProps {
  onShowSettings: () => void;
}

export function BottomNavigation({
  onShowSettings
}: BottomNavigationProps) {
  // 모바일에서도 중요한 기능은 표시
  const isMobileDevice = isMobile();
  const safeArea = getSafeTouchArea();

  return (
    <nav
      className={`fixed left-1/2 transform -translate-x-1/2 z-30 ${
        isMobileDevice ? 'bottom-6' : 'bottom-4'
      }`}
      style={{
        // 모바일에서 안전 영역 하단 고려
        ...(isMobileDevice && {
          bottom: `${Math.max(safeArea.bottom + 24, 24)}px`
        })
      }}
    >
      <div className={`flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50 ${
        isMobileDevice ? 'px-6 py-3' : 'px-4 py-2'
      }`}>


        <div className="flex items-center gap-2">
          <IconButton
            icon="⚙️"
            onClick={onShowSettings}
            title="설정"
            variant="default"
            className={`${isMobileDevice ? 'px-6 py-3 min-w-[48px] min-h-[48px]' : 'px-4 py-2'} rounded-full`}
          />
          <span className="hidden sm:inline text-gray-700 ml-1">설정</span>
        </div>
      </div>
    </nav>
  );
}
