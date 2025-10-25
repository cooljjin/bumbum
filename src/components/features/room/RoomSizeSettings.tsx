import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_ROOM_DIMENSIONS, ROOM_DIMENSION_LIMITS } from '@/constants/room';
import { RoomDimensions } from '@/types/editor';
import {
  useRoomDimensionsState,
  validateRoomDimensions,
  saveRoomDimensions,
  loadRoomDimensions
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

interface RoomSizeSettingsProps {
  isOpen?: boolean;
  onClose: () => void;
}

export default function RoomSizeSettings({ isOpen = true, onClose }: RoomSizeSettingsProps) {
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
  const [isDetecting, setIsDetecting] = useState(false);

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

  const handleFieldChange = (key: keyof RoomDimensions, value: number) => {
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

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      const detected = await loadRoomDimensions();
      originalDimensionsRef.current = detected;
      setDraft(detected);
      setHasChanges(false);
      setValidationErrors({});
    } catch (error) {
      console.error('[RoomSizeSettings] Failed to auto detect room dimensions:', error);
    } finally {
      setIsDetecting(false);
    }
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
      console.error('[RoomSizeSettings] Failed to save room dimensions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(originalDimensionsRef.current);
    setHasChanges(false);
    setValidationErrors({});
    onClose();
  };

  const hasValidationError = Object.keys(validationErrors).length > 0;
  const isApplyDisabled = !hasChanges || hasValidationError || isSaving;

  const safeMarginUpperBound = useMemo(() => {
    const half = Math.min(draft.width, draft.depth) / 2;
    return Math.min(
      ROOM_DIMENSION_LIMITS.margin.max,
      Math.max(ROOM_DIMENSION_LIMITS.margin.min, half - 0.05)
    );
  }, [draft.width, draft.depth]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-2xl p-6 w-[420px] max-w-[90vw] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">방 크기 설정</h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={isSaving}
              >
                <span className="text-gray-500">✕</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={handleAutoDetect}
                  disabled={isDetecting || isSaving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDetecting ? '감지 중...' : '자동 감지'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  기본값
                </button>
              </div>

              <div className="space-y-3">
                <DimensionInput
                  label="가로 (Width)"
                  value={draft.width}
                  min={ROOM_DIMENSION_LIMITS.width.min}
                  max={ROOM_DIMENSION_LIMITS.width.max}
                  step={0.1}
                  error={validationErrors.width}
                  onChange={(value) => handleFieldChange('width', value)}
                  disabled={isSaving}
                />
                <DimensionInput
                  label="세로 (Depth)"
                  value={draft.depth}
                  min={ROOM_DIMENSION_LIMITS.depth.min}
                  max={ROOM_DIMENSION_LIMITS.depth.max}
                  step={0.1}
                  error={validationErrors.depth}
                  onChange={(value) => handleFieldChange('depth', value)}
                  disabled={isSaving}
                />
                <DimensionInput
                  label="높이 (Height)"
                  value={draft.height}
                  min={ROOM_DIMENSION_LIMITS.height.min}
                  max={ROOM_DIMENSION_LIMITS.height.max}
                  step={0.1}
                  error={validationErrors.height}
                  onChange={(value) => handleFieldChange('height', value)}
                  disabled={isSaving}
                />
                <DimensionInput
                  label="안전 여백 (Margin)"
                  value={draft.margin}
                  min={ROOM_DIMENSION_LIMITS.margin.min}
                  max={safeMarginUpperBound}
                  step={0.1}
                  error={validationErrors.margin}
                  onChange={(value) => handleFieldChange('margin', value)}
                  disabled={isSaving}
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">현재 설정</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    전체 크기: {draft.width.toFixed(1)}m × {draft.depth.toFixed(1)}m ×{' '}
                    {draft.height.toFixed(1)}m
                  </div>
                  <div>
                    사용 가능 면적:{' '}
                    {(draft.width - draft.margin * 2).toFixed(1)}m ×{' '}
                    {(draft.depth - draft.margin * 2).toFixed(1)}m
                  </div>
                  <div>안전 여백: {draft.margin.toFixed(1)}m</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                disabled={isSaving}
              >
                취소
              </button>
              <button
                onClick={handleApply}
                disabled={isApplyDisabled}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isApplyDisabled
                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                }`}
              >
                {isSaving ? '저장 중...' : '적용'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DimensionInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  error?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function DimensionInput({
  label,
  value,
  min,
  max,
  step,
  error,
  onChange,
  disabled
}: DimensionInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-400' : 'border-gray-300'
          }`}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
        />
        <span className="text-gray-500 text-sm">m</span>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
