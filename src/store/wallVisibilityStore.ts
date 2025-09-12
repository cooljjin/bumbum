import { create } from 'zustand';
import type { WallSide } from '../utils/roomBoundary';

type WallVisibilityState = {
  visibleWalls: WallSide[]; // e.g., ['minX','maxZ']
  wallFades: Record<WallSide, number>; // 0..1 per side
  setVisibleWalls: (walls: WallSide[]) => void;
  setWallFades: (fades: Partial<Record<WallSide, number>>) => void;
};

export const useWallVisibilityStore = create<WallVisibilityState>((set, get) => ({
  visibleWalls: ['minX', 'maxX', 'minZ', 'maxZ'],
  wallFades: { minX: 1, maxX: 1, minZ: 1, maxZ: 1 },
  setVisibleWalls: (walls: WallSide[]) => {
    // 정렬된 고유 목록으로 저장하여 참조 변화를 최소화
    const unique = Array.from(new Set(walls));
    const sorted = unique.sort();
    const prev = get().visibleWalls.join(',');
    const next = sorted.join(',');
    if (prev === next) return;
    set({ visibleWalls: sorted as WallSide[] });
  },
  setWallFades: (fades) => {
    const current = get().wallFades;
    const next = { ...current, ...fades } as Record<WallSide, number>;
    // Shallow compare
    const equal = (['minX','maxX','minZ','maxZ'] as WallSide[]).every(k => current[k] === next[k]);
    if (equal) return;
    set({ wallFades: next });
  }
}));

export const useVisibleWalls = () => useWallVisibilityStore(s => s.visibleWalls);
export const useWallFades = () => useWallVisibilityStore(s => s.wallFades);

// 편의 액션 직접 export
export const { setVisibleWalls, setWallFades } = useWallVisibilityStore.getState();
