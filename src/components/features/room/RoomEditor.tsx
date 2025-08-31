'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stats } from '@react-three/drei';
import { useEditorStore } from '../store/editorStore';
import { PlacedItem, Tool } from '../types/editor';
import { FurnitureCatalog } from './FurnitureCatalog';
import { EditableFurniture } from './EditableFurniture';
import { GridSystem } from './GridSystem';
import { preloadAllFurnitureModels } from '../utils/modelLoader';

interface RoomEditorProps {
  className?: string;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({ className = '' }) => {
  const {
    mode,
    tool,
    placedItems,
    selectedItemId,
    updateItem,
    removeItem,
    selectItem,
    setMode,
    setTool,
    undo,
    redo,
    clearHistory,
    toggleGrid,
    toggleBoundingBoxes,
    toggleGridSnap,
    toggleRotationSnap,
    showGrid,
    showBoundingBoxes,
    saveCurrentState,
    loadSavedState,
    hasSavedState,
    lockItem,
    unlockItem,
    duplicateItem,
    cycleTool
  } = useEditorStore();

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showShortcutGuide, setShowShortcutGuide] = useState(false);

  // 모델 프리로딩
  useEffect(() => {
    const preloadModels = async () => {
      try {
        setIsLoading(true);
        await preloadAllFurnitureModels();
      } catch (error) {
        console.error('Failed to preload models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    preloadModels();
  }, []);

  // 가구 선택 처리
  const handleFurnitureSelect = useCallback((itemId: string) => {
    selectItem(itemId);
  }, [selectItem]);

  // 가구 업데이트 처리
  const handleFurnitureUpdate = useCallback((itemId: string, updates: Partial<PlacedItem>) => {
    updateItem(itemId, updates);
  }, [updateItem]);

  // 가구 삭제 처리
  const handleFurnitureDelete = useCallback((itemId: string) => {
    removeItem(itemId);
  }, [removeItem]);

  // 키보드 단축키 처리 - Blueprint3D 스타일로 확장
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 단축키 가이드 토글 (F1)
      if (event.key === 'F1') {
        event.preventDefault();
        setShowShortcutGuide(!showShortcutGuide);
        return;
      }

      // 기본 편집 단축키들
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'Z' && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      // Ctrl/Cmd + S: 현재 상태 저장
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveCurrentState();
        return;
      }

      // Ctrl/Cmd + O: 저장된 상태 불러오기
      if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        loadSavedState();
        return;
      }

      // Delete 또는 Backspace: 선택된 가구 삭제
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedItemId) {
        event.preventDefault();
        removeItem(selectedItemId);
        return;
      }

      // Escape: 선택 해제 또는 편집 모드 종료
      if (event.key === 'Escape') {
        if (selectedItemId) {
          selectItem(null);
        } else if (mode === 'edit') {
          setMode('view');
        }
        return;
      }

      // 숫자 키로 도구 변경 (1-6)
      if (event.key >= '1' && event.key <= '6') {
        const tools: Tool[] = [
          'select', 'translate', 'rotate', 'scale', 'delete', 'duplicate'
        ];
        const toolIndex = parseInt(event.key) - 1;
        if (toolIndex >= 0 && toolIndex < tools.length) {
          const selectedTool = tools[toolIndex];
          if (selectedTool) {
            setTool(selectedTool);
          }
        }
        return;
      }

      // 편집 모드 전용 단축키들
      if (mode === 'edit') {
        // G: 그리드 스냅 토글
        if (event.key === 'g' || event.key === 'G') {
          event.preventDefault();
          toggleGridSnap();
          return;
        }

        // R: 회전 스냅 토글
        if (event.key === 'r' || event.key === 'R') {
          event.preventDefault();
          toggleRotationSnap();
          return;
        }

        // H: 히스토리 초기화
        if (event.key === 'h' || event.key === 'H') {
          event.preventDefault();
          clearHistory();
          return;
        }

        // C: 선택된 가구 복제 (Ctrl/Cmd + C는 브라우저 기본 동작)
        if (event.key === 'c' || event.key === 'C') {
          event.preventDefault();
          if (selectedItemId) {
            duplicateItem(selectedItemId);
          }
          return;
        }

        // A: 모든 가구 선택 해제
        if (event.key === 'a' || event.key === 'A') {
          event.preventDefault();
          selectItem(null);
          return;
        }

        // F: 가구 카탈로그 토글
        if (event.key === 'f' || event.key === 'F') {
          event.preventDefault();
          setIsCatalogOpen(!isCatalogOpen);
          return;
        }

        // I: 그리드 표시 토글
        if (event.key === 'i' || event.key === 'I') {
          event.preventDefault();
          toggleGrid();
          return;
        }

        // B: 바운딩 박스 표시 토글
        if (event.key === 'b' || event.key === 'B') {
          event.preventDefault();
          toggleBoundingBoxes();
          return;
        }

        // Tab: 도구 순환
        if (event.key === 'Tab') {
          event.preventDefault();
          cycleTool();
          return;
        }
      }

      // 모드 전환 단축키들
      // V: 보기 모드
      if (event.key === 'v' || event.key === 'V') {
        event.preventDefault();
        setMode('view');
        return;
      }

      // E: 편집 모드
      if (event.key === 'e' || event.key === 'E') {
        event.preventDefault();
        setMode('edit');
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, mode, undo, redo, removeItem, selectItem, setMode, setTool, saveCurrentState, loadSavedState, duplicateItem, toggleGridSnap, toggleRotationSnap, clearHistory, setIsCatalogOpen, toggleGrid, toggleBoundingBoxes, cycleTool, showShortcutGuide, setShowShortcutGuide]);

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className={`room-editor-loading ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">가구 모델을 로딩 중입니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`room-editor ${className}`}>
      {/* 편집 도구바 */}
      <div className="editor-toolbar bg-white border-b border-gray-200 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          {/* 모드 전환 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMode('view')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                mode === 'view'
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              👁️ 보기 모드
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                mode === 'edit'
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              ✏️ 편집 모드
            </button>
          </div>

          {/* 도구 선택 */}
          {mode === 'edit' && (
            <div className="flex items-center space-x-3">
              {[
                { key: 'select', icon: '👆', label: '선택' },
                { key: 'move', icon: '↔️', label: '이동' },
                { key: 'rotate', icon: '🔄', label: '회전' },
                { key: 'scale', icon: '📏', label: '크기' },
                { key: 'delete', icon: '🗑️', label: '삭제' }
              ].map((toolOption) => (
                <button
                  key={toolOption.key}
                  onClick={() => setTool(toolOption.key as any)}
                  className={`p-3 rounded-lg transition-all duration-300 ${
                    tool === toolOption.key
                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                  title={`${toolOption.label} (${toolOption.key === 'select' ? '1' : toolOption.key === 'move' ? '2' : toolOption.key === 'rotate' ? '3' : toolOption.key === 'scale' ? '4' : '5'})`}
                >
                  <span className="text-lg">{toolOption.icon}</span>
                </button>
              ))}
            </div>
          )}

          {/* 유틸리티 버튼 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleGrid}
              className={`p-3 rounded-lg transition-all duration-300 ${
                showGrid ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
              title="그리드 표시/숨김"
            >
              📐
            </button>
            <button
              onClick={toggleBoundingBoxes}
              className={`p-3 rounded-lg transition-all duration-300 ${
                showBoundingBoxes ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
              title="바운딩 박스 표시/숨김"
            >
              📦
            </button>
            <button
              onClick={() => setIsCatalogOpen(!isCatalogOpen)}
              className={`p-3 rounded-lg transition-all duration-300 ${
                isCatalogOpen ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
              title="가구 카탈로그"
            >
              🪑
            </button>

            {/* 선택된 객체 고정/해제 버튼 */}
            {selectedItemId && (
              <button
                onClick={() => {
                  const selectedItem = placedItems.find(item => item.id === selectedItemId);
                  if (selectedItem) {
                    if (selectedItem.isLocked) {
                      unlockItem(selectedItemId);
                    } else {
                      lockItem(selectedItemId);
                    }
                  }
                }}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  placedItems.find(item => item.id === selectedItemId)?.isLocked
                    ? 'bg-yellow-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
                title={
                  placedItems.find(item => item.id === selectedItemId)?.isLocked
                    ? '객체 고정 해제 (L)'
                    : '객체 고정 (L)'
                }
              >
                {placedItems.find(item => item.id === selectedItemId)?.isLocked ? '🔒' : '🔓'}
              </button>
            )}
          </div>

          {/* 히스토리 관리 및 저장/불러오기 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={undo}
              className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 hover:shadow-md transition-all duration-300"
              title="실행 취소 (Ctrl+Z)"
            >
              ↩️
            </button>
            <button
              onClick={redo}
              className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 hover:shadow-md transition-all duration-300"
              title="재실행 (Ctrl+Shift+Z)"
            >
              ↪️
            </button>
            <button
              onClick={clearHistory}
              className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 hover:shadow-md transition-all duration-300"
              title="히스토리 초기화"
            >
              🗑️
            </button>

            {/* 저장/불러오기 버튼 */}
            <div className="w-px h-8 bg-gray-300 mx-2" />
            <button
              onClick={saveCurrentState}
              className="p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 hover:shadow-md transition-all duration-300"
              title="현재 상태 저장"
            >
              💾
            </button>
            <button
              onClick={loadSavedState}
              disabled={!hasSavedState()}
              className={`p-3 rounded-lg transition-all duration-300 ${
                hasSavedState()
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-md'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={hasSavedState() ? '저장된 상태 불러오기' : '저장된 상태가 없습니다'}
            >
              📁
            </button>
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <span className="mr-6">모드: {mode === 'view' ? '보기' : '편집'}</span>
          <span className="mr-6">도구: {tool}</span>
          <span className="mr-6">배치된 가구: {placedItems.length}개</span>
          {selectedItemId && (
            <span className="mr-6">
              선택됨: {selectedItemId}
              {(() => {
                const selectedItem = placedItems.find(item => item.id === selectedItemId);
                return selectedItem ? (
                  <span className={`ml-2 px-3 py-1 rounded-full text-xs ${
                    selectedItem.isLocked
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedItem.isLocked ? '🔒 고정됨' : '🔓 이동가능'}
                  </span>
                ) : null;
              })()}
            </span>
          )}
        </div>

        {/* 고정 관련 안내 메시지 */}
        {selectedItemId && mode === 'edit' && (() => {
          const selectedItem = placedItems.find(item => item.id === selectedItemId);
          if (!selectedItem) return null;

          return (
            <div className="mt-3 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
              {selectedItem.isLocked ? (
                <span>🔒 고정된 가구입니다. 'L' 키를 눌러 고정을 해제하고 이동시키세요.</span>
              ) : (
                <span>📍 가구를 원하는 위치로 이동시킨 후 'L' 키를 눌러 현재 위치에 고정하세요!</span>
              )}
            </div>
          );
        })()}
      </div>

      {/* 단축키 가이드 */}
      {showShortcutGuide && (
        <div className="shortcut-guide bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">키보드 단축키 가이드</h3>
            <button
              onClick={() => setShowShortcutGuide(false)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-blue-600">기본 편집</h4>
              <div className="space-y-1 text-sm">
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl+Z</kbd> 실행 취소</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl+Shift+Z</kbd> 재실행</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl+S</kbd> 상태 저장</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl+O</kbd> 상태 불러오기</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">Delete</kbd> 선택 항목 삭제</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">Escape</kbd> 선택 해제/모드 종료</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-blue-600">도구 선택</h4>
              <div className="space-y-1 text-sm">
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">1</kbd> 선택 도구</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">2</kbd> 이동 도구</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">3</kbd> 회전 도구</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">4</kbd> 크기 조정</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">5</kbd> 삭제 도구</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">Tab</kbd> 도구 순환</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-blue-600">편집 모드</h4>
              <div className="space-y-1 text-sm">
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">G</kbd> 그리드 스냅 토글</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">R</kbd> 회전 스냅 토글</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">C</kbd> 선택 항목 복제</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">A</kbd> 전체 선택 해제</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">F</kbd> 가구 카탈로그</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">H</kbd> 히스토리 초기화</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-blue-600">보기 설정</h4>
              <div className="space-y-1 text-sm">
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">I</kbd> 그리드 표시 토글</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">B</kbd> 바운딩 박스 토글</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">V</kbd> 보기 모드</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">E</kbd> 편집 모드</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-blue-600">TransformControls</h4>
              <div className="space-y-1 text-sm">
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">L</kbd> 객체 고정/해제</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">G</kbd> 이동 모드</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">R</kbd> 회전 모드</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">S</kbd> 크기 조정 모드</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-blue-600">기타</h4>
              <div className="space-y-1 text-sm">
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">F1</kbd> 이 가이드 토글</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">마우스 휠</kbd> 줌 인/아웃</div>
                <div><kbd className="bg-gray-100 px-2 py-1 rounded">우클릭+드래그</kbd> 카메라 회전</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
            <strong>팁:</strong> 편집 모드에서만 대부분의 단축키가 작동합니다.
            TransformControls가 활성화된 상태에서는 일부 키보드 이벤트가 제한될 수 있습니다.
          </div>
        </div>
      )}

      {/* 메인 편집 영역 */}
      <div className="editor-main flex h-full">
        {/* 3D 뷰포트 */}
        <div className="flex-1 relative">
          <Canvas
            camera={{ position: [5, 5, 5], fov: 75 }}
            shadows
            className="w-full h-full"
          >
            {/* 환경 설정 */}
            <Environment preset="apartment" />

            {/* 조명 */}
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />

            {/* 그리드 시스템 */}
            <GridSystem
              size={10}
              divisions={10}
              color="#888888"
              showGrid={showGrid}
            />

            {/* 배치된 가구들 */}
            {placedItems.map((item) => (
              <EditableFurniture
                key={item.id}
                item={item}
                isSelected={selectedItemId === item.id}
                isEditMode={mode === 'edit'}
                onSelect={() => handleFurnitureSelect(item.id)}
                onUpdate={(id, updates) => handleFurnitureUpdate(id, updates)}
                onDelete={() => handleFurnitureDelete(item.id)}
              />
            ))}

            {/* 카메라 컨트롤 */}
            <OrbitControls
              enabled={mode === 'view'}
              makeDefault
              maxPolarAngle={Math.PI / 2}
              minDistance={2}
              maxDistance={20}
            />

            {/* 성능 모니터링 (개발 모드에서만) */}
            {process.env.NODE_ENV === 'development' && <Stats />}
          </Canvas>
        </div>

        {/* 가구 카탈로그 사이드바 */}
        {isCatalogOpen && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">가구 카탈로그</h3>
                <button
                  onClick={() => setIsCatalogOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              <FurnitureCatalog />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomEditor;
