'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiDownload, FiBarChart, FiEye } from 'react-icons/fi';

interface MobileMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onShowUserPreferences: () => void;
  onShowExport: () => void;
  onShowAnalytics: () => void;
  onShowAccessibility: () => void;
}

export function MobileMenu({
  isVisible,
  onClose,
  onShowUserPreferences,
  onShowExport,
  onShowAnalytics,
  onShowAccessibility
}: MobileMenuProps) {
  const menuItems = [
    {
      icon: FiUser,
      label: '내 디자인',
      action: onShowUserPreferences,
      color: 'blue'
    },
    {
      icon: FiDownload,
      label: '내보내기',
      action: onShowExport,
      color: 'green'
    },
    {
      icon: FiBarChart,
      label: '사용 분석',
      action: onShowAnalytics,
      color: 'purple'
    },
    {
      icon: FiEye,
      label: '접근성',
      action: onShowAccessibility,
      color: 'orange'
    }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 메뉴 패널 */}
          <motion.div
            className="fixed top-0 left-0 right-0 bg-white z-50 shadow-lg"
            initial={{ y: -300 }}
            animate={{ y: 0 }}
            exit={{ y: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">메뉴</h2>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <FiX size={20} />
              </motion.button>
            </div>

            {/* 메뉴 아이템들 */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.label}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${
                      item.color === 'blue' ? 'bg-blue-50 hover:bg-blue-100 text-blue-600' :
                      item.color === 'green' ? 'bg-green-50 hover:bg-green-100 text-green-600' :
                      item.color === 'purple' ? 'bg-purple-50 hover:bg-purple-100 text-purple-600' :
                      'bg-orange-50 hover:bg-orange-100 text-orange-600'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <item.icon size={24} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default MobileMenu;
