'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AppLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  showSidebar?: boolean;
}

export function AppLayout({
  children,
  header,
  sidebar,
  footer,
  showSidebar = false
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      {header}

      {/* 메인 컨텐츠 */}
      <main className="flex-1 relative">
        {children}

        {/* 사이드바 */}
        <AnimatePresence>
          {showSidebar && sidebar && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 bg-white/95 backdrop-blur-sm border-l border-gray-200/50 shadow-2xl z-40 overflow-y-auto"
            >
              {sidebar}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 푸터/네비게이션 */}
      {footer}
    </div>
  );
}
