"use client";

import React from 'react';
import { createPortal } from 'react-dom';

const OverlayContext = React.createContext<HTMLElement | null>(null);

export function OverlayRoot() {
  const [el, setEl] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    let node = document.getElementById('overlay-root') as HTMLElement | null;
    if (!node) {
      node = document.createElement('div');
      node.id = 'overlay-root';
      // Create a top-level stacking context well above app UI.
      Object.assign(node.style, {
        position: 'fixed',
        inset: '0px',
        zIndex: '2147483647', // top-most container; children layer among themselves
        pointerEvents: 'none', // children decide with pointer-events: auto
      } as CSSStyleDeclaration);
      document.body.appendChild(node);
    }
    setEl(node);
    return () => {
      // Keep node for app lifetime; no removal to avoid remounting overlays
    };
  }, []);

  return <OverlayContext.Provider value={el}>{null}</OverlayContext.Provider>;
}

export function useOverlayRoot(): HTMLElement | null {
  return React.useContext(OverlayContext);
}

export function OverlayPortal({ children }: { children: React.ReactNode }) {
  const target = useOverlayRoot();
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>{children}</div>,
    target ?? document.body
  );
}

