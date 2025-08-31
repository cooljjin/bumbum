'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';

interface KeyboardShortcutsProps {
  enabled?: boolean;
  onShowHelp?: () => void;
}

interface ShortcutInfo {
  key: string;
  description: string;
  action: () => void;
  category: 'tools' | 'edit' | 'navigation' | 'settings';
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  enabled = true,
  onShowHelp
}) => {
  const {
    setTool,
    undo,
    redo,
    removeItem,
    selectedItemId,
    mode,
    setMode
  } = useEditorStore();

  const [showShortcutHint, setShowShortcutHint] = useState<string>('');
  const [lastAction, setLastAction] = useState<string>('');

  // 단축키 정의
  const shortcuts: ShortcutInfo[] = [
    // 도구 선택
    { key: 'q', description: '선택 도구', action: () => setTool('select'), category: 'tools' },
    { key: 'g', description: '이동 도구', action: () => setTool('translate'), category: 'tools' },
    { key: 'r', description: '회전 도구', action: () => setTool('rotate'), category: 'tools' },
    { key: 's', description: '크기 조절 도구', action: () => setTool('scale'), category: 'tools' },
    
    // 편집 작업
    { key: 'Delete', description: '선택된 항목 삭제', action: () => {
      if (selectedItemId) {
        removeItem(selectedItemId);
        setLastAction('삭제됨');
      }
    }, category: 'edit' },
    { key: 'Escape', description: '선택 해제', action: () => {
      // 선택 해제 로직 (store에 추가 필요)
      setLastAction('선택 해제됨');
    }, category: 'edit' },
    
    // 모드 전환
    { key: 'v', description: '보기 모드', action: () => setMode('view'), category: 'navigation' },
    { key: 'e', description: '편집 모드', action: () => setMode('edit'), category: 'navigation' },
    
    // 도움말
    { key: 'F1', description: '도움말 표시', action: () => onShowHelp?.(), category: 'settings' },
    { key: '?', description: '도움말 표시', action: () => onShowHelp?.(), category: 'settings' }
  ];

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || mode !== 'edit') return;

    const { key, ctrlKey, shiftKey, metaKey } = event;

    // Ctrl+Z (실행 취소)
    if ((ctrlKey || metaKey) && key === 'z' && !shiftKey) {
      event.preventDefault();
      undo();
      setLastAction('실행 취소됨');
      showActionFeedback('실행 취소됨');
      return;
    }

    // Ctrl+Y 또는 Ctrl+Shift+Z (다시 실행)
    if ((ctrlKey || metaKey) && ((key === 'y') || (key === 'z' && shiftKey))) {
      event.preventDefault();
      redo();
      setLastAction('다시 실행됨');
      showActionFeedback('다시 실행됨');
      return;
    }

    // 일반 단축키 처리
    const shortcut = shortcuts.find(s => s.key.toLowerCase() === key.toLowerCase());
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
      setLastAction(shortcut.description);
      showActionFeedback(shortcut.description);
    }
  }, [enabled, mode, undo, redo, shortcuts]);

  // 시각적 피드백 표시
  const showActionFeedback = useCallback((message: string) => {
    setShowShortcutHint(message);
    setTimeout(() => setShowShortcutHint(''), 2000);
  }, []);

  // 이벤트 리스너 등록/해제
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  // 단축키 힌트 표시
  const renderShortcutHint = () => {
    if (!showShortcutHint) return null;

    return (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          <span className="text-sm font-medium">{showShortcutHint}</span>
        </div>
      </div>
    );
  };

  // 마지막 액션 표시
  const renderLastAction = () => {
    if (!lastAction) return null;

    return (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg opacity-80">
          <span className="text-sm">{lastAction}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderShortcutHint()}
      {renderLastAction()}
    </>
  );
};

export default KeyboardShortcuts;
