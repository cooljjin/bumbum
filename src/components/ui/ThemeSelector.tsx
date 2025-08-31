'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { themes, Theme } from '../../constants/themes';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export default function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  const themeOptions = Object.values(themes);

  return (
    <div className="flex flex-col items-center space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">테마 선택</h3>
      <div className="flex space-x-3">
        {themeOptions.map((theme) => (
          <motion.button
            key={theme.name}
            onClick={() => onThemeChange(theme)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
              currentTheme.name === theme.name
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {theme.name}
          </motion.button>
        ))}
      </div>

      {/* 현재 테마 설명 */}
      <motion.div
        className="text-center p-3 bg-gray-50 rounded-lg max-w-xs"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-sm text-gray-600">
          <span className="font-medium">{currentTheme.name}</span> 테마
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {currentTheme.mood}
        </p>
      </motion.div>
    </div>
  );
}
