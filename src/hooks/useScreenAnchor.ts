import { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function useScreenAnchor(getWorldPosition: () => THREE.Vector3 | null) {
  const { camera, size } = useThree();
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let raf = 0;

    const project = () => {
      const wp = getWorldPosition();
      if (!wp) {
        setAnchor(null);
      } else {
        const v = wp.clone();
        v.project(camera as THREE.Camera);
        const x = (v.x * 0.5 + 0.5) * size.width;
        const y = (v.y * -0.5 + 0.5) * size.height;
        setAnchor({ x, y });
      }
      raf = window.requestAnimationFrame(project);
    };
    project();
    const onResize = () => setTimeout(project, 0);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [camera, size.width, size.height, getWorldPosition]);

  return anchor;
}

