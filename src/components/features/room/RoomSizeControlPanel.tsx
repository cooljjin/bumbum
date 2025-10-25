'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from '../../shared/Slider';
import { DEFAULT_ROOM_DIMENSIONS, ROOM_DIMENSION_LIMITS } from '../../../constants/room';
import { RoomDimensions } from '@/types/editor';
import {
  useRoomDimensionsState,
  validateRoomDimensions,
  saveRoomDimensions
} from '@/store/editorStore';

type ValidationErrors = Partial<Record<keyof RoomDimensions, string>>;

const areDimensionsEqual = (a: RoomDimensions, b: RoomDimensions) => {
  return (
    a.width === b.width &&
    a.depth === b.depth &&
    a.height === b.height &&
    a.margin === b.margin &&
    a.wallThickness === b.wallThickness
  );
};

interface RoomSizeControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RoomSizeControlPanel({ isOpen, onClose }: RoomSizeControlPanelProps) {
  const roomDimensions = useRoomDimensionsState();
  const originalDimensionsRef = useRef<RoomDimensions>(roomDimensions);
  const defaultDimensions = useMemo<RoomDimensions>(
    () => ({ ...DEFAULT_ROOM_DIMENSIONS }),
    []
  );

  const [draft, setDraft] = useState<RoomDimensions>(roomDimensions);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    originalDimensionsRef.current = roomDimensions;
    setDraft(roomDimensions);
    setHasChanges(false);
    setValidationErrors({});
  }, [isOpen, roomDimensions]);

  const applyValidation = (dimensions: RoomDimensions) => {
    const result = validateRoomDimensions(dimensions);
    setValidationErrors(result.errors);
    return result;
  };

  const handleDimensionChange = (key: keyof RoomDimensions, value: number) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setHasChanges(!areDimensionsEqual(next, originalDimensionsRef.current));
    applyValidation(next);
  };

  const handleReset = () => {
    setDraft(defaultDimensions);
    setHasChanges(!areDimensionsEqual(defaultDimensions, originalDimensionsRef.current));
    applyValidation(defaultDimensions);
  };

  const handleCancel = () => {
    setDraft(originalDimensionsRef.current);
    setHasChanges(false);
    setValidationErrors({});
    onClose();
  };

  const handleApply = async () => {
    const validation = applyValidation(draft);
    if (!validation.isValid) {
      return;
    }

    try {
      setIsSaving(true);
      const saved = await saveRoomDimensions(draft);
      originalDimensionsRef.current = saved;
      setDraft(saved);
      setHasChanges(false);
      setValidationErrors({});
      onClose();
    } catch (error) {
      console.error('[RoomSizeControlPanel] Failed to save room dimensions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasValidationError = Object.keys(validationErrors).length > 0;

  const effectiveMargin =
    Math.min(
      ROOM_DIMENSION_LIMITS.margin.max,
      Math.max(
        ROOM_DIMENSION_LIMITS.margin.min,
        Math.min(draft.width, draft.depth) / 2 - 0.05
      )
    );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-occlude-floating="room-size-panel"
          initial={{ opacity: 0, x: 50, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 50, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 right-6 z-50 max-h-[calc(100vh-80px)] flex flex-col"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-gray-200 w-80 max-w-[90vw] flex flex-col max-h-full overflow-hidden">
            {/* 고정 헤더 */}
            <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏠</span>
                <h3 className="text-lg font-bold text-gray-800">방 크기 조절</h3>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                title="닫기"
                disabled={isSaving}
              >
              <span className="text-gray-500">✕</span>
            </button>
          </div>

          {/* 스크롤 가능한 콘텐츠 영역 */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar">
            <Slider
                label="가로 (Width)"
                value={draft.width}
                min={ROOM_DIMENSION_LIMITS.width.min}
                max={ROOM_DIMENSION_LIMITS.width.max}
                step={0.1}
                unit="m"
                onChange={(value) => handleDimensionChange('width', value)}
              />
              {validationErrors.width && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.width}</p>
              )}

              <Slider
                label="세로 (Depth)"
                value={draft.depth}
                min={ROOM_DIMENSION_LIMITS.depth.min}
                max={ROOM_DIMENSION_LIMITS.depth.max}
                step={0.1}
                unit="m"
                onChange={(value) => handleDimensionChange('depth', value)}
              />
              {validationErrors.depth && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.depth}</p>
              )}

              <Slider
                label="높이 (Height)"
                value={draft.height}
                min={ROOM_DIMENSION_LIMITS.height.min}
                max={ROOM_DIMENSION_LIMITS.height.max}
                step={0.1}
                unit="m"
                onChange={(value) => handleDimensionChange('height', value)}
              />
              {validationErrors.height && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.height}</p>
              )}

            {/* 현재 크기 정보 */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-1">현재 예상 크기</div>
              <div className="text-sm text-blue-900 font-mono">
                {draft.width.toFixed(1)}m × {draft.depth.toFixed(1)}m × {draft.height.toFixed(1)}m
              </div>
              <div className="text-xs text-blue-600 mt-1">
                바닥 면적: {(draft.width * draft.depth).toFixed(1)}m², 안전 여백: {draft.margin.toFixed(1)}m
              </div>
              <div className="text-xs text-blue-500">
                최대 여백 허용치: {effectiveMargin.toFixed(2)}m
              </div>
            </div>

            {/* 도움말 */}
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-600 space-y-1">
                <div>💡 슬라이더를 움직여 가로·세로·높이를 조절할 수 있어요.</div>
                <div>⚠️ 안전 여백은 높이/벽 두께에 따라 자동으로 검증됩니다.</div>
              </div>
            </div>
          </div>

          {/* 고정 버튼 영역 */}
          <div className="px-6 py-4 flex gap-2 flex-shrink-0 border-t border-gray-100">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 border-2 border-gray-300 disabled:opacity-50"
                title="기본 크기로 초기화"
                disabled={isSaving}
              >
                기본값
              </button>
              <button
                onClick={handleApply}
                disabled={!hasChanges || hasValidationError || isSaving}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 border-2 ${
                  !hasChanges || hasValidationError || isSaving
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-lg'
                }`}
                title={hasValidationError ? '입력 값이 올바른지 확인해 주세요.' : '변경 사항 적용'}
              >
                {isSaving ? '저장 중...' : '적용'}
              </button>
            </div>
          </div>

          {/* 커스텀 스크롤바 스타일 */}
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #F3F4F6;
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #D1D5DB;
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #9CA3AF;
            }
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: #D1D5DB #F3F4F6;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
