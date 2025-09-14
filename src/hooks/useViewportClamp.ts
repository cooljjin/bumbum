import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { getSafeTouchArea, getUIOcclusionInsets, isMobile } from '../utils/mobileHtmlConstraints';

type Options = {
  margin?: number;
  includeSafeAreas?: boolean;
  includeOcclusions?: boolean;
  enabled?: boolean;
  pollIntervalMs?: number;
};

/**
 * Computes an extra translate offset so a floating element stays fully inside the viewport.
 * Apply the returned style to an inner wrapper inside <Html> content.
 */
export function useViewportClamp(
  ref: React.RefObject<HTMLElement | null>,
  opts: Options = {}
) {
  const {
    margin = 12,
    includeSafeAreas = true,
    includeOcclusions = true,
    enabled = true,
    pollIntervalMs = 150,
  } = opts;

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastRectRef = useRef<{ l: number; t: number; r: number; b: number } | null>(null);

  const insets = useMemo(() => {
    if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
    const safe = includeSafeAreas ? getSafeTouchArea() : { top: 0, bottom: 0, left: 0, right: 0 };
    const occ = includeOcclusions ? getUIOcclusionInsets() : { top: 0, bottom: 0, left: 0, right: 0 };
    return {
      top: Math.max(safe.top, occ.top),
      bottom: Math.max(safe.bottom, occ.bottom),
      left: Math.max(safe.left, occ.left),
      right: Math.max(safe.right, occ.right),
    };
  }, [includeSafeAreas, includeOcclusions]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!enabled) return;
    if (!isMobile()) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    const el = ref.current;
    if (!el) return;

    let raf: number | null = null;
    let timer: number | null = null;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const bounds = {
        left: insets.left + margin,
        right: vw - insets.right - margin,
        top: insets.top + margin,
        bottom: vh - insets.bottom - margin,
      };

      let dx = 0;
      let dy = 0;

      if (rect.left < bounds.left) dx += bounds.left - rect.left;
      if (rect.right > bounds.right) dx -= rect.right - bounds.right;
      if (rect.top < bounds.top) dy += bounds.top - rect.top;
      if (rect.bottom > bounds.bottom) dy -= rect.bottom - bounds.bottom;

      // Avoid state updates if nothing changed meaningfully
      const lastRect = lastRectRef.current;
      const l = Math.round(rect.left), t = Math.round(rect.top), r = Math.round(rect.right), b = Math.round(rect.bottom);
      const changed = !lastRect || lastRect.l !== l || lastRect.t !== t || lastRect.r !== r || lastRect.b !== b;
      lastRectRef.current = { l, t, r, b };

      const next = { x: Math.round(dx), y: Math.round(dy) };
      if (changed) {
        setOffset(prev => (prev.x !== next.x || prev.y !== next.y ? next : prev));
      }
    };

    // Initial and on events
    compute();

    const onScroll = () => compute();
    const onResize = () => compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    // Poll periodically to react to camera-driven Html transforms
    timer = window.setInterval(compute, pollIntervalMs) as unknown as number;

    // Observe size changes of the element
    const ro = new ResizeObserver(() => compute());
    try {
      ro.observe(el);
    } catch {}

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (timer) clearInterval(timer);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [ref, insets.left, insets.right, insets.top, insets.bottom, margin, enabled, pollIntervalMs]);

  return useMemo(
    () => ({
      offset,
      style: { transform: `translate(${offset.x}px, ${offset.y}px)` } as React.CSSProperties,
    }),
    [offset]
  );
}
