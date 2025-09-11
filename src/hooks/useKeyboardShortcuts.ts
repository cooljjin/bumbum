import { useEffect, useCallback, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useState } from 'react';

// 단축키 타입 정의
export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  modifier?: 'ctrl' | 'shift' | 'alt';
  category: 'tool' | 'action' | 'view' | 'help';
}

// 단축키 설정 타입
export interface ShortcutSettings {
  enabled: boolean;
  showTooltips: boolean;
  soundEnabled: boolean;
  customShortcuts: Record<string, string>;
}

// 기본 단축키 설정
const DEFAULT_SHORTCUTS: ShortcutSettings = {
  enabled: true,
  showTooltips: true,
  soundEnabled: false,
  customShortcuts: {}
};

/**
 * ⌨️ 키보드 단축키 커스텀 훅
 * 편집 모드에서 키보드 단축키를 처리하고 사용자 설정을 관리
 */
export function useKeyboardShortcuts() {
  const {
    mode,
    setTool,
    selectedItemId,
    removeItem,
    duplicateItem,
    undo,
    redo,
    toggleGrid,
    toggleBoundingBoxes,
    clearSelection
  } = useEditorStore();

  // 단축키 설정 상태
  const shortcutSettings = useRef<ShortcutSettings>(DEFAULT_SHORTCUTS);

  // 단축키 도움말 표시 상태
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  /**
   * 🎯 기본 단축키 정의
   */
  const defaultShortcuts: KeyboardShortcut[] = [
    // 도구 관련 단축키
    {
      key: 'q',
      description: '선택 도구',
      action: () => setTool('select'),
      category: 'tool'
    },
    {
      key: 'Escape',
      description: '선택 해제',
      action: () => {
        if (selectedItemId !== null) {
          clearSelection();
        }
      },
      category: 'action'
    },
    {
      key: 't',
      description: '이동 도구',
      action: () => setTool('translate'),
      category: 'tool'
    },
    {
      key: 'r',
      description: '회전 도구',
      action: () => setTool('rotate'),
      category: 'tool'
    },
    {
      key: 's',
      description: '크기 조절 도구',
      action: () => setTool('scale'),
      category: 'tool'
    },
    {
      key: 'd',
      description: '복제 도구',
      action: () => setTool('duplicate'),
      category: 'tool'
    },

    // 액션 관련 단축키
    {
      key: 'Delete',
      description: '선택된 가구 삭제',
      action: () => {
        if (selectedItemId) {
          removeItem(selectedItemId);
        }
      },
      category: 'action'
    },
    {
      key: 'c',
      description: '선택된 가구 복제',
      action: () => {
        if (selectedItemId) {
          duplicateItem(selectedItemId);
        }
      },
      modifier: 'ctrl',
      category: 'action'
    },
    {
      key: 'z',
      description: '실행 취소',
      action: () => undo(),
      modifier: 'ctrl',
      category: 'action'
    },
    {
      key: 'y',
      description: '다시 실행',
      action: () => redo(),
      modifier: 'ctrl',
      category: 'action'
    },
    {
      key: 'a',
      description: '모든 가구 선택',
      action: () => {
        // 모든 가구 선택 로직 (구현 필요)
        // console.log('모든 가구 선택');
      },
      modifier: 'ctrl',
      category: 'action'
    },

    // 뷰 관련 단축키
    {
      key: 'g',
      description: '그리드 토글',
      action: () => toggleGrid(),
      category: 'view'
    },
    {
      key: 'b',
      description: '바운딩 박스 토글',
      action: () => toggleBoundingBoxes(),
      category: 'view'
    },
    {
      key: 'f',
      description: '선택된 가구에 포커스',
      action: () => {
        if (selectedItemId) {
          // 카메라를 선택된 가구에 포커스하는 로직 (구현 필요)
          // console.log('선택된 가구에 포커스');
        }
      },
      category: 'view'
    },
    {
      key: 'h',
      description: '홈 뷰로 리셋',
      action: () => {
        // 카메라를 기본 위치로 리셋하는 로직 (구현 필요)
        // console.log('홈 뷰로 리셋');
      },
      category: 'view'
    },

    // 도움말 단축키
    {
      key: 'F1',
      description: '단축키 도움말',
      action: () => setShowShortcutHelp(prev => !prev),
      category: 'help'
    },
    {
      key: '?',
      description: '단축키 도움말',
      action: () => setShowShortcutHelp(prev => !prev),
      category: 'help'
    }
  ];

  /**
   * 🎮 단축키 이벤트 핸들러
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 편집 모드가 아니면 단축키 비활성화
    if (mode !== 'edit' || !shortcutSettings.current.enabled) return;

    // 입력 필드에 포커스가 있으면 단축키 비활성화
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = event.key.toLowerCase();
    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const isAlt = event.altKey;

    // 단축키 매칭 및 실행
    const shortcut = defaultShortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === key;
      const modifierMatch =
        (shortcut.modifier === 'ctrl' && isCtrl) ||
        (shortcut.modifier === 'shift' && isShift) ||
        (shortcut.modifier === 'alt' && isAlt) ||
        (!shortcut.modifier && !isCtrl && !isShift && !isAlt);

      return keyMatch && modifierMatch;
    });

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();

      try {
        shortcut.action();

        // 단축키 실행 피드백
        if (shortcutSettings.current.showTooltips) {
          showShortcutFeedback(shortcut.description);
        }

        if (shortcutSettings.current.soundEnabled) {
          playShortcutSound();
        }

        // console.log(`⌨️ 단축키 실행: ${shortcut.key} - ${shortcut.description}`);
      } catch (error) {
        console.error('단축키 실행 실패:', error);
      }
    }
  }, [mode, setTool, selectedItemId, removeItem, duplicateItem, undo, redo, toggleGrid, toggleBoundingBoxes]);

  /**
   * 💡 단축키 피드백 표시
   */
  const showShortcutFeedback = useCallback((description: string) => {
    // 간단한 토스트 메시지 표시
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      animation: fadeInOut 2s ease-in-out;
    `;
    toast.textContent = description;

    // CSS 애니메이션 추가
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-10px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // 2초 후 자동 제거
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 2000);
  }, []);

  /**
   * 🔊 단축키 사운드 재생
   */
  const playShortcutSound = useCallback(() => {
    try {
      // 간단한 비프음 생성 (Web Audio API 사용)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('사운드 재생 실패:', error);
    }
  }, []);

  /**
   * ⚙️ 단축키 설정 업데이트
   */
  const updateShortcutSettings = useCallback((newSettings: Partial<ShortcutSettings>) => {
    shortcutSettings.current = { ...shortcutSettings.current, ...newSettings };

    // localStorage에 설정 저장
    try {
      localStorage.setItem('bumbum_shortcut_settings', JSON.stringify(shortcutSettings.current));
      // console.log('✅ 단축키 설정 저장 완료');
    } catch (error) {
      console.error('❌ 단축키 설정 저장 실패:', error);
    }
  }, []);

  /**
   * 📂 단축키 설정 로드
   */
  const loadShortcutSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem('bumbum_shortcut_settings');
      if (saved) {
        shortcutSettings.current = { ...DEFAULT_SHORTCUTS, ...JSON.parse(saved) };
        // console.log('✅ 단축키 설정 로드 완료');
      }
    } catch (error) {
      console.error('❌ 단축키 설정 로드 실패:', error);
    }
  }, []);

  /**
   * 🔄 단축키 설정 리셋
   */
  const resetShortcutSettings = useCallback(() => {
    shortcutSettings.current = { ...DEFAULT_SHORTCUTS };
    updateShortcutSettings({});
    // console.log('🔄 단축키 설정 리셋 완료');
  }, [updateShortcutSettings]);

  // 컴포넌트 마운트 시 설정 로드 및 이벤트 리스너 등록
  useEffect(() => {
    loadShortcutSettings();

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, loadShortcutSettings]);

  return {
    // 단축키 상태
    showShortcutHelp,
    setShowShortcutHelp,

    // 단축키 목록
    shortcuts: defaultShortcuts,

    // 설정 관리
    shortcutSettings: shortcutSettings.current,
    updateShortcutSettings,
    resetShortcutSettings,

    // 도움말
    getShortcutsByCategory: () => {
      const categories = ['tool', 'action', 'view', 'help'];
      return categories.map(category => ({
        category,
        shortcuts: defaultShortcuts.filter(s => s.category === category)
      }));
    }
  };
}
