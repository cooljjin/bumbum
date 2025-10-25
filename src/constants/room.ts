import { RoomDimensions } from '@/types/editor';

/**
 * Default room size used across the 3D editor.
 * Values are expressed in meters.
 */
export const DEFAULT_ROOM_DIMENSIONS: RoomDimensions = {
  width: 10,
  depth: 10,
  height: 5,
  wallThickness: 0.3,
  margin: 0.3,
};

/**
 * Recommended limits for user-facing room size controls.
 * These bounds are enforced by the validation helper in the editor store.
 */
export const ROOM_DIMENSION_LIMITS = {
  width: { min: 3, max: 15 },
  depth: { min: 3, max: 15 },
  height: { min: 2.4, max: 6 },
  margin: { min: 0, max: 1.5 },
} as const;

export const ROOM_DIMENSION_STORAGE_KEY = 'bumbum_room_dimensions';
