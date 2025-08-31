'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiSettings, FiEye, FiType, FiMousePointer, FiVolume2 } from 'react-icons/fi';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  isOpen,
  onClose
}) => {
  const {
    highContrastMode,
    toggleHighContrast,
    fontSize,
    setFontSize,
    enableKeyboardNavigation,
    toggleKeyboardNavigation,
    announceToScreenReader
  } = useAccessibility();

  if (!isOpen) return null;

  const handleSettingChange = (settingName: string, value: any) => {
    announceToScreenReader(`${settingName}이(가) ${value}으로 변경되었습니다.`, 'polite');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-title"
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 id="accessibility-title" className="text-xl font-bold flex items-center gap-2">
              <FiSettings size={24} />
              접근성 설정
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              aria-label="접근성 설정 닫기"
            >
              ✕
            </button>
          </div>
          <p className="text-purple-100 mt-2 text-sm">
            화면 읽기, 고대비 모드 등 접근성 기능을 설정하세요
          </p>
        </div>

        {/* 설정 목록 */}
        <div className="p-6 space-y-6">
          {/* 고대비 모드 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FiEye size={20} className="text-gray-600" />
              <div>
                <h3 className="font-medium text-gray-800">고대비 모드</h3>
                <p className="text-sm text-gray-600">배경과 텍스트의 대비를 높입니다</p>
              </div>
            </div>
            <button
              onClick={() => {
                toggleHighContrast();
                handleSettingChange('고대비 모드', highContrastMode ? '끄기' : '켜기');
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                highContrastMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-pressed={highContrastMode}
              aria-label={`고대비 모드 ${highContrastMode ? '끄기' : '켜기'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  highContrastMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 글자 크기 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <FiType size={20} className="text-gray-600" />
              <div>
                <h3 className="font-medium text-gray-800">글자 크기</h3>
                <p className="text-sm text-gray-600">텍스트 크기를 조정합니다</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { value: 'small', label: '작게', ariaLabel: '작은 글자 크기' },
                { value: 'medium', label: '보통', ariaLabel: '보통 글자 크기' },
                { value: 'large', label: '크게', ariaLabel: '큰 글자 크기' }
              ].map(({ value, label, ariaLabel }) => (
                <button
                  key={value}
                  onClick={() => {
                    setFontSize(value as any);
                    handleSettingChange('글자 크기', label);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    fontSize === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                  aria-pressed={fontSize === value}
                  aria-label={ariaLabel}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 키보드 네비게이션 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FiMousePointer size={20} className="text-gray-600" />
              <div>
                <h3 className="font-medium text-gray-800">키보드 네비게이션</h3>
                <p className="text-sm text-gray-600">Tab 키로 요소 간 이동 가능</p>
              </div>
            </div>
            <button
              onClick={() => {
                toggleKeyboardNavigation();
                handleSettingChange('키보드 네비게이션', enableKeyboardNavigation ? '끄기' : '켜기');
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enableKeyboardNavigation ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-pressed={enableKeyboardNavigation}
              aria-label={`키보드 네비게이션 ${enableKeyboardNavigation ? '끄기' : '켜기'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enableKeyboardNavigation ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 화면 읽기 테스트 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <FiVolume2 size={20} className="text-gray-600" />
              <div>
                <h3 className="font-medium text-gray-800">화면 읽기 테스트</h3>
                <p className="text-sm text-gray-600">스크린 리더 작동 확인</p>
              </div>
            </div>
            <button
              onClick={() => {
                announceToScreenReader('화면 읽기 테스트가 실행되었습니다. 이 메시지가 들리면 정상 작동 중입니다.', 'assertive');
              }}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              aria-label="화면 읽기 테스트 실행"
            >
              테스트 실행
            </button>
          </div>

          {/* 단축키 안내 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">키보드 단축키</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div className="flex justify-between">
                <span>고대비 모드 토글:</span>
                <kbd className="px-2 py-1 bg-white rounded border">Alt + H</kbd>
              </div>
              <div className="flex justify-between">
                <span>글자 크기 증가:</span>
                <kbd className="px-2 py-1 bg-white rounded border">Alt + =</kbd>
              </div>
              <div className="flex justify-between">
                <span>글자 크기 감소:</span>
                <kbd className="px-2 py-1 bg-white rounded border">Alt + -</kbd>
              </div>
              <div className="flex justify-between">
                <span>포커스 표시 토글:</span>
                <kbd className="px-2 py-1 bg-white rounded border">Alt + F</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex gap-3">
            <button
              onClick={() => {
                // 기본값으로 리셋
                setFontSize('medium');
                if (highContrastMode) toggleHighContrast();
                if (!enableKeyboardNavigation) toggleKeyboardNavigation();
                announceToScreenReader('접근성 설정이 기본값으로 초기화되었습니다.', 'polite');
              }}
              className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              aria-label="접근성 설정 초기화"
            >
              초기화
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              aria-label="접근성 설정 적용 및 닫기"
            >
              적용
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccessibilitySettings;
