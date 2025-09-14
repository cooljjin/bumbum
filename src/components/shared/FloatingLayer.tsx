"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { OverlayPortal, useOverlayRoot } from './OverlayRoot';
import { getSafeTouchArea, getUIOcclusionInsets, isMobile } from '../../utils/mobileHtmlConstraints';

export type FloatingPlacement = 'above' | 'below' | 'left' | 'right';

export interface FloatingLayerProps {
  anchor: { x: number; y: number } | null; // screen pixel coords
  children: React.ReactNode;
  placement?: FloatingPlacement;
  offset?: number;
  crossOffset?: number;
  className?: string;
  style?: React.CSSProperties;
  zClass?: string; // e.g., 'z-floating'
  constrainToViewport?: boolean;
}

/**
 * Generic floating portal positioned by screen pixel coordinates with viewport-aware clamping.
 * No external deps; good enough replacement for basic Floating UI behavior.
 */
export function FloatingLayer({
  anchor,
  children,
  placement = 'above',
  offset = 12,
  crossOffset = 0,
  className = '',
  style,
  zClass = 'z-floating',
  constrainToViewport = true,
}: FloatingLayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number; placement: FloatingPlacement } | null>(null);
  const overlayRoot = useOverlayRoot();

  const bounds = useMemo(() => {
    if (!constrainToViewport || typeof window === 'undefined') {
      return { left: 0, right: Number.POSITIVE_INFINITY, top: 0, bottom: Number.POSITIVE_INFINITY };
    }
    const safe = getSafeTouchArea();
    const occ = getUIOcclusionInsets();
    const pad = isMobile() ? 16 : 8;
    return {
      left: (occ.left || 0) + pad,
      right: window.innerWidth - (occ.right || 0) - pad,
      top: (occ.top || 0) + (isMobile() ? 100 : 16), // give space for headers/toolbars on mobile
      bottom: window.innerHeight - (occ.bottom || 0) - pad,
    };
  }, [constrainToViewport]);

  useLayoutEffect(() => {
    if (!anchor || !containerRef.current || typeof window === 'undefined') return;
    const el = containerRef.current;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      let x = anchor.x + crossOffset;
      let y = anchor.y;
      let plc: FloatingPlacement = placement;

      const ensureInside = (nx: number, ny: number, plcNow: FloatingPlacement) => {
        const halfW = rect.width / 2;
        const halfH = rect.height / 2;

        // coarse clamp depending on placement
        if (plcNow === 'above') ny = ny - offset - rect.height;
        if (plcNow === 'below') ny = ny + offset;
        if (plcNow === 'left') nx = nx - offset - rect.width;
        if (plcNow === 'right') nx = nx + offset;

        // center translate for above/below
        if (plcNow === 'above' || plcNow === 'below') {
          if (nx - halfW < bounds.left) nx = bounds.left + halfW;
          if (nx + halfW > bounds.right) nx = bounds.right - halfW;
          // vertical clamp
          if (ny < bounds.top && plcNow === 'above') {
            plcNow = 'below';
            ny = anchor.y + offset;
          }
          if (ny + rect.height > bounds.bottom && plcNow === 'below') {
            plcNow = 'above';
            ny = anchor.y - offset - rect.height;
          }
        } else {
          // left/right vertical centering
          if (ny - halfH < bounds.top) ny = bounds.top + halfH;
          if (ny + halfH > bounds.bottom) ny = bounds.bottom - halfH;
          // horizontal clamp and flip if needed
          if (nx < bounds.left && plcNow === 'left') {
            plcNow = 'right';
            nx = anchor.x + offset;
          }
          if (nx + rect.width > bounds.right && plcNow === 'right') {
            plcNow = 'left';
            nx = anchor.x - offset - rect.width;
          }
        }
        return { nx, ny, plcNow };
      };

      let r = ensureInside(x, y, plc);
      setPos({ x: r.nx, y: r.ny, placement: r.plcNow });
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
  }, [anchor?.x, anchor?.y, placement, offset, crossOffset, bounds.left, bounds.right, bounds.top, bounds.bottom]);

  if (!anchor) return null;

  const transform = useMemo(() => {
    if (!pos) return 'translate(-50%, -50%)';
    switch (pos.placement) {
      case 'above':
        return 'translate(-50%, 0)';
      case 'below':
        return 'translate(-50%, 0)';
      case 'left':
        return 'translate(0, -50%)';
      case 'right':
        return 'translate(0, -50%)';
      default:
        return 'translate(-50%, -50%)';
    }
  }, [pos?.placement]);

  const left = pos?.x ?? anchor.x;
  const top = pos?.y ?? anchor.y;

  const node = (
    <div
      ref={containerRef}
      className={`fixed pointer-events-auto ${zClass} ${className}`}
      style={{ left, top, transform, ...style }}
    >
      {children}
    </div>
  );

  // Render inside overlay root
  if (typeof document !== 'undefined') {
    return overlayRoot ? (
      <OverlayPortal>{node}</OverlayPortal>
    ) : (
      node
    );
  }
  return null;
}

