import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../../store/editorStore';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 설정 카테고리 타입
type SettingsCategory = 'general' | 'grid' | 'shortcuts' | 'performance' | 'ui';

// UI 테마 타입
type UITheme = 'light' | 'dark' | 'auto';

// 사용자 설정 타입
interface UserSettings {
  // 일반 설정
  autoSave: boolean;
  autoSaveInterval: number;
  showTooltips: boolean;

  // 그리드 설정
  gridEnabled: boolean;
  gridSize: number;
  gridDivisions: number;
  gridColor: string;

  // 스냅 설정
  snapEnabled: boolean;
  snapStrength: number;
  rotationSnapEnabled: boolean;
  rotationSnapAngle: number;

  // UI 설정
  theme: UITheme;
  showFPS: boolean;
  showPerformanceStats: boolean;

  // 성능 설정
  enableLOD: boolean;
  enableFrustumCulling: boolean;
  maxRenderDistance: number;
}

// 기본 설정값
const DEFAULT_USER_SETTINGS: UserSettings = {
  // 일반 설정
  autoSave: true,
  autoSaveInterval: 30000,
  showTooltips: true,

  // 그리드 설정
  gridEnabled: true,
  gridSize: 10,
  gridDivisions: 10,
  gridColor: '#888888',

  // 스냅 설정
  snapEnabled: true,
  snapStrength: 1.0,
  rotationSnapEnabled: true,
  rotationSnapAngle: 15,

  // UI 설정
  theme: 'auto',
  showFPS: false,
  showPerformanceStats: false,

  // 성능 설정
  enableLOD: true,
  enableFrustumCulling: true,
  maxRenderDistance: 100
};

/**
 * ⚙️ 사용자 설정 모달 컴포넌트
 * 모든 사용자 설정을 중앙에서 관리
 */
export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const {
    setGridSettings,
    setRotationSnapSettings,
    setSnapStrength
  } = useEditorStore();

  const {
    shortcutSettings,
    updateShortcutSettings,
    resetShortcutSettings
  } = useKeyboardShortcuts();

  // 설정 로드
  useEffect(() => {
    loadUserSettings();
  }, []);

  // 설정 변경 감지
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [settings]);

  /**
   * 📂 사용자 설정 로드
   */
  const loadUserSettings = () => {
    try {
      const saved = localStorage.getItem('bondidi_user_settings');
      if (saved) {
        const loadedSettings = { ...DEFAULT_USER_SETTINGS, ...JSON.parse(saved) };
        setSettings(loadedSettings);
        console.log('✅ 사용자 설정 로드 완료');
      }
    } catch (error) {
      console.error('❌ 사용자 설정 로드 실패:', error);
    }
  };

  /**
   * 💾 사용자 설정 저장
   */
  const saveUserSettings = () => {
    try {
      localStorage.setItem('bondidi_user_settings', JSON.stringify(settings));

      // editorStore에 설정 적용
      setGridSettings({
        enabled: settings.gridEnabled,
        size: settings.gridSize,
        divisions: settings.gridDivisions,
        color: settings.gridColor
      });

      setRotationSnapSettings({
        enabled: settings.rotationSnapEnabled,
        angle: settings.rotationSnapAngle
      });

      setSnapStrength({
        enabled: settings.snapEnabled,
        translation: settings.snapStrength,
        rotation: settings.snapStrength
      });

      setHasUnsavedChanges(false);
      console.log('✅ 사용자 설정 저장 완료');
    } catch (error) {
      console.error('❌ 사용자 설정 저장 실패:', error);
    }
  };

  /**
   * 🔄 설정 리셋
   */
  const resetSettings = () => {
    if (confirm('모든 설정을 기본값으로 되돌리시겠습니까?')) {
      setSettings(DEFAULT_USER_SETTINGS);
      resetShortcutSettings();
      setHasUnsavedChanges(true);
    }
  };

  /**
   * 🎨 테마 변경
   */
  const applyTheme = (theme: UITheme) => {
    const root = document.documentElement;

    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // 테마 변경 시 즉시 적용
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ⚙️ 사용자 설정
          </h2>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600 dark:text-orange-400">
                저장되지 않은 변경사항
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex">
          {/* 사이드바 - 카테고리 선택 */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 p-4">
            <nav className="space-y-2">
              {[
                { id: 'general', label: '일반', icon: '⚙️' },
                { id: 'grid', label: '그리드', icon: '🔲' },
                { id: 'shortcuts', label: '단축키', icon: '⌨️' },
                { id: 'performance', label: '성능', icon: '🚀' },
                { id: 'ui', label: 'UI', icon: '🎨' }
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id as SettingsCategory)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* 일반 설정 */}
            {activeCategory === 'general' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  일반 설정
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      자동 저장
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  {settings.autoSave && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        자동 저장 간격 (초)
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="300"
                        step="10"
                        value={settings.autoSaveInterval / 1000}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          autoSaveInterval: parseInt(e.target.value) * 1000
                        }))}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">
                        {settings.autoSaveInterval / 1000}초
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      툴팁 표시
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.showTooltips}
                      onChange={(e) => setSettings(prev => ({ ...prev, showTooltips: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 그리드 설정 */}
            {activeCategory === 'grid' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  그리드 설정
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      그리드 활성화
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.gridEnabled}
                      onChange={(e) => setSettings(prev => ({ ...prev, gridEnabled: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  {settings.gridEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          그리드 크기: {settings.gridSize}
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="5"
                          value={settings.gridSize}
                          onChange={(e) => setSettings(prev => ({ ...prev, gridSize: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          그리드 분할: {settings.gridDivisions}
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="20"
                          step="1"
                          value={settings.gridDivisions}
                          onChange={(e) => setSettings(prev => ({ ...prev, gridDivisions: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          그리드 색상
                        </label>
                        <input
                          type="color"
                          value={settings.gridColor}
                          onChange={(e) => setSettings(prev => ({ ...prev, gridColor: e.target.value }))}
                          className="w-20 h-10 rounded border"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 단축키 설정 */}
            {activeCategory === 'shortcuts' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  단축키 설정
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      단축키 활성화
                    </label>
                    <input
                      type="checkbox"
                      checked={shortcutSettings.enabled}
                      onChange={(e) => updateShortcutSettings({ enabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      툴팁 표시
                    </label>
                    <input
                      type="checkbox"
                      checked={shortcutSettings.showTooltips}
                      onChange={(e) => updateShortcutSettings({ showTooltips: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      사운드 효과
                    </label>
                    <input
                      type="checkbox"
                      checked={shortcutSettings.soundEnabled}
                      onChange={(e) => updateShortcutSettings({ soundEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={resetShortcutSettings}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    단축키 설정 리셋
                  </button>
                </div>
              </div>
            )}

            {/* 성능 설정 */}
            {activeCategory === 'performance' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  성능 설정
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      LOD 시스템 활성화
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.enableLOD}
                      onChange={(e) => setSettings(prev => ({ ...prev, enableLOD: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      프러스텀 컬링 활성화
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.enableFrustumCulling}
                      onChange={(e) => setSettings(prev => ({ ...prev, enableFrustumCulling: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      최대 렌더링 거리: {settings.maxRenderDistance}m
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="10"
                      value={settings.maxRenderDistance}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxRenderDistance: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* UI 설정 */}
            {activeCategory === 'ui' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  UI 설정
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      테마
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as UITheme }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">밝은 테마</option>
                      <option value="dark">어두운 테마</option>
                      <option value="auto">시스템 설정 따름</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      FPS 표시
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.showFPS}
                      onChange={(e) => setSettings(prev => ({ ...prev, showFPS: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      성능 통계 표시
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.showPerformanceStats}
                      onChange={(e) => setSettings(prev => ({ ...prev, showPerformanceStats: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 - 액션 버튼 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            🔄 기본값으로 리셋
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={saveUserSettings}
              disabled={!hasUnsavedChanges}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                hasUnsavedChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
