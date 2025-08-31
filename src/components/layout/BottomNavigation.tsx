'use client';

import React, { useState, useEffect } from 'react';
import { IconButton } from '../ui/IconButton';

interface BottomNavigationProps {
  onShowSettings: () => void;
}

export function BottomNavigation({
  onShowSettings
}: BottomNavigationProps) {
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

  // 모바일에서는 MobileUI가 표시되므로 BottomNavigation은 숨김
  if (isMobile) return null;

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200/50">


        <div className="flex items-center gap-2">
          <IconButton
            icon="⚙️"
            onClick={onShowSettings}
            title="설정"
            variant="default"
            className="px-4 py-2 rounded-full"
          />
          <span className="hidden sm:inline text-gray-700 ml-1">설정</span>
        </div>
      </div>
    </nav>
  );
}
