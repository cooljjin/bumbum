"use client";

import React, { useEffect } from 'react';
import { useFloating, flip, shift, offset as fuiOffset, size, Placement } from '@floating-ui/react';
import { OverlayPortal } from './OverlayRoot';
import { getSafeTouchArea, getUIOcclusionInsets, isMobile } from '../../utils/mobileHtmlConstraints';

export type FloatingPlacement = Placement;

export interface FloatingLayerFUIProps {
  anchor: { x: number; y: number } | null; // screen pixel coords
  children: React.ReactNode;
  placement?: FloatingPlacement;
  offset?: number;
  className?: string;
  style?: React.CSSProperties;
  zClass?: string; // e.g., 'z-floating'
}

/**
 * Floating UI based layer positioned by screen pixel coordinates (virtual element).
 */
export function FloatingLayerFUI({
  anchor,
  children,
  placement = 'top',
  offset = 10,
  className = '',
  style,
  zClass = 'z-floating',
}: FloatingLayerFUIProps) {
  const safe = getSafeTouchArea();
  const occ = getUIOcclusionInsets();
  const pad = isMobile() ? 16 : 8;

  const { refs, floatingStyles, update, placement: resolvedPlacement } = useFloating({
    placement,
    elements: {
      reference: anchor
        ? {
            getBoundingClientRect: () =>
              ({
                x: anchor.x,
                y: anchor.y,
                top: anchor.y,
                left: anchor.x,
                right: anchor.x,
                bottom: anchor.y,
                width: 0,
                height: 0,
              } as DOMRect),
          }
        : null,
    },
    middleware: [
      fuiOffset(offset),
      flip(),
      shift({ padding: pad }),
      size({
        apply({ elements, availableWidth, availableHeight }) {
          Object.assign((elements.floating as HTMLElement).style, {
            maxWidth: `${availableWidth}px`,
            maxHeight: `${availableHeight}px`,
          });
        },
        padding: {
          top: pad + (occ.top || 0) + (isMobile() ? 84 : 0) + safe.top,
          bottom: pad + (occ.bottom || 0) + safe.bottom,
          left: pad + (occ.left || 0) + safe.left,
          right: pad + (occ.right || 0) + safe.right,
        },
      }),
    ],
    strategy: 'fixed',
  });

  useEffect(() => {
    const onResize = () => update?.();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [update]);

  if (!anchor) return null;

  return (
    <OverlayPortal>
      <div ref={refs.setFloating} className={`pointer-events-auto ${zClass} ${className}`} style={{ ...floatingStyles, ...style }}>
        {children}
      </div>
    </OverlayPortal>
  );
}

