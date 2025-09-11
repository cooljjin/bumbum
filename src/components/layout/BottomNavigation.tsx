'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { IconButton } from '../ui/IconButton';
import { getSafeTouchArea, isMobile } from '../../utils/mobileHtmlConstraints';

interface BottomNavigationProps {
  onShowSettings: () => void;
}

export function BottomNavigation({
  onShowSettings
}: BottomNavigationProps) {
  // SSR과의 hydration mismatch 방지를 위해
  // 초기 렌더(서버/클라이언트 첫 페인트)는 고정값으로 렌더링하고,
  // 마운트 이후에만 환경 값(모바일/세이프영역)을 반영한다.
  const [mounted, setMounted] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [bottomPx, setBottomPx] = useState<number | null>(null);

  useEffect(() => {
    const compute = () => {
      const mobile = isMobile();
      const safe = getSafeTouchArea();
      setIsMobileDevice(mobile);
      // 안전 영역 + 여백 24px
      setBottomPx(mobile ? Math.max(safe.bottom + 24, 24) : null);
    };
    setMounted(true);
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
  }, []);

  return (
    <nav
      data-occlude-floating="bottom-nav"
      className={`fixed left-1/2 transform -translate-x-1/2 z-30 ${
        mounted && isMobileDevice ? 'bottom-6' : 'bottom-4'
      }`}
      style={mounted && isMobileDevice && bottomPx !== null ? { bottom: `${bottomPx}px` } : {}}
    >
      <div className={`flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50 ${
        mounted && isMobileDevice ? 'px-6 py-3' : 'px-4 py-2'
      }`}>


        <div className="flex items-center gap-2">
          <IconButton
            icon="⚙️"
            onClick={onShowSettings}
            title="설정"
            variant="default"
            className={`${mounted && isMobileDevice ? 'px-6 py-3 min-w-[48px] min-h-[48px]' : 'px-4 py-2'} rounded-full`}
          />
          <span className="hidden sm:inline text-gray-700 ml-1">설정</span>
        </div>
      </div>
    </nav>
  );
}
