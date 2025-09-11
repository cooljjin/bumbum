'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { IconButton } from '../ui/IconButton';
import { FiLock, FiUnlock, FiSettings, FiSave, FiHelpCircle, FiShare2, FiBarChart2, FiEdit3, FiCheck } from 'react-icons/fi';
import packageJson from '../../../package.json';

interface AppHeaderProps {
  isViewLocked: boolean;
  onViewLockToggle: () => void;
  onShowSettings: () => void;
  onShowUserPreferences: () => void;
  onShowAccessibility: () => void;
  onShowExport: () => void;
  onShowAnalytics: () => void;
  isEditMode?: boolean;
  onEditModeToggle?: () => void;
}

export function AppHeader({
  isViewLocked,
  onViewLockToggle,
  onShowSettings,
  onShowUserPreferences,
  onShowAccessibility,
  onShowExport,
  onShowAnalytics,
  isEditMode = false,
  onEditModeToggle
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
          <div className="flex items-center gap-0">
            <div className="flex items-center gap-0">
              {/* 로고 - SVG 아이콘 또는 이미지 파일 사용 */}
              <div className="w-[60px] h-[60px] flex items-center justify-center">
                {/* 방법 1: 이미지 파일 사용 (권장) */}
                <Image
                  src="/logo.png"
                  alt="bumbum 로고"
                  width={60}
                  height={60}
                  className="w-[60px] h-[60px] object-contain"
                />
                
                {/* 방법 2: SVG 아이콘 직접 사용 (이미지 파일이 없을 때) */}
                {/* 
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 32 32" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-blue-600"
                >
                  <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.1"/>
                  <path d="M8 12h16v8H8z" fill="currentColor"/>
                  <circle cx="12" cy="16" r="2" fill="white"/>
                  <circle cx="20" cy="16" r="2" fill="white"/>
                </svg>
                */}
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                bumbum
              </h1>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              v{packageJson.version}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 편집 모드 토글 버튼 */}
            {onEditModeToggle && (
              <IconButton
                icon={isEditMode ? <FiCheck size={18} /> : <FiEdit3 size={18} />}
                onClick={onEditModeToggle}
                title={isEditMode ? '편집 모드 종료' : '편집 모드 시작'}
                ariaLabel={isEditMode ? '편집 모드 종료' : '편집 모드 시작'}
                dataTestId="edit-toggle"
                variant={isEditMode ? 'primary' : 'default'}
              />
            )}

            <IconButton
              icon={isViewLocked ? <FiLock size={18} /> : <FiUnlock size={18} />}
              onClick={onViewLockToggle}
              title={isViewLocked ? '시점 고정 해제' : '시점 고정'}
              ariaLabel={isViewLocked ? '시점 고정 해제' : '시점 고정'}
              dataTestId="view-lock-toggle"
              variant={isViewLocked ? 'danger' : 'default'}
            />

            <IconButton
              icon={<FiSettings size={18} />}
              onClick={onShowSettings}
              title="설정"
              ariaLabel="설정"
              dataTestId="settings-button"
              variant="default"
            />

            <IconButton
              icon={<FiSave size={18} />}
              onClick={onShowUserPreferences}
              title="내 디자인"
              ariaLabel="사용자 디자인 관리"
              dataTestId="design-manage-button"
              variant="default"
            />

            <IconButton
              icon={<FiHelpCircle size={18} />}
              onClick={onShowAccessibility}
              title="접근성 설정"
              ariaLabel="접근성 설정 열기"
              dataTestId="accessibility-button"
              variant="default"
            />

            <IconButton
              icon={<FiShare2 size={18} />}
              onClick={onShowExport}
              title="내보내기 및 공유"
              ariaLabel="디자인 내보내기 및 공유"
              dataTestId="export-share-button"
              variant="default"
            />

            <IconButton
              icon={<FiBarChart2 size={18} />}
              onClick={onShowAnalytics}
              title="사용 분석"
              ariaLabel="사용 분석 대시보드"
              dataTestId="analytics-button"
              variant="default"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
