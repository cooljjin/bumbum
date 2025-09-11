'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiMenu, FiSettings, FiLock, FiUnlock, FiEdit3, FiCheck } from 'react-icons/fi';
import packageJson from '../../../package.json';

interface MobileHeaderProps {
  isViewLocked: boolean;
  onViewLockToggle: () => void;
  onShowSettings: () => void;
  onShowMenu: () => void;
  isEditMode?: boolean;
  onEditModeToggle?: () => void;
}

export function MobileHeader({
  isViewLocked,
  onViewLockToggle,
  onShowSettings,
  onShowMenu,
  isEditMode = false,
  onEditModeToggle
}: MobileHeaderProps) {
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

  // 모바일이 아니면 MobileHeader를 숨김
  if (!isMobile) return null;

  return (
    <motion.header
      data-occlude-floating="mobile-header"
      className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* 왼쪽: 앱 이름과 메뉴 버튼 */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onShowMenu}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <FiMenu size={18} />
          </motion.button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {/* 로고 이미지 - public/logo.svg 또는 public/logo.png 파일을 추가하세요 */}
              <Image
                src="/logo.png"
                alt="bumbum 로고"
                width={24}
                height={24}
                className="w-12 h-12"
              />
              <h1 className="text-lg font-bold text-gray-800">bumbum</h1>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              v{packageJson.version}
            </span>
          </div>
        </div>

        {/* 오른쪽: 핵심 기능만 */}
        <div className="flex items-center gap-2">
          {/* 편집 모드 토글 버튼 */}
          {onEditModeToggle && (
            <motion.button
              onClick={onEditModeToggle}
              className={`p-2 rounded-full transition-colors ${
                isEditMode 
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              whileTap={{ scale: 0.95 }}
              title={isEditMode ? '편집 모드 종료' : '편집 모드 시작'}
            >
              {isEditMode ? <FiCheck size={18} /> : <FiEdit3 size={18} />}
            </motion.button>
          )}

          <motion.button
            onClick={onViewLockToggle}
            className={`p-2 rounded-full transition-colors ${
              isViewLocked 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            whileTap={{ scale: 0.95 }}
            title={isViewLocked ? '시점 고정 해제' : '시점 고정'}
          >
            {isViewLocked ? <FiLock size={18} /> : <FiUnlock size={18} />}
          </motion.button>

          <motion.button
            onClick={onShowSettings}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            whileTap={{ scale: 0.95 }}
            title="설정"
          >
            <FiSettings size={18} />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}

export default MobileHeader;
