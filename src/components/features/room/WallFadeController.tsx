'use client';

import React from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { getCurrentRoomDimensions } from '../../../utils/roomBoundary';
import { setVisibleWalls, setWallFades } from '../../../store/wallVisibilityStore';

const tmp = new Vector3();

export default function WallFadeController() {
  const { camera } = useThree();

  const dims = React.useMemo(() => getCurrentRoomDimensions(), []);
  const halfW = dims.width / 2;
  const halfD = dims.depth / 2;
  const height = dims.height;

  const fadesRef = React.useRef<{ minX: number; maxX: number; minZ: number; maxZ: number }>(
    { minX: 1, maxX: 1, minZ: 1, maxZ: 1 }
  );

  useFrame(() => {
    const cam = camera.position;

    // Determine which walls should hide based on camera orientation & distance
    const forward = camera.getWorldDirection(tmp).clone();
    forward.y = 0;
    if (forward.lengthSq() > 0) forward.normalize();
    const ax = Math.abs(forward.x);
    const az = Math.abs(forward.z);
    const axisAligned = (ax < 0.35 && az > 0.65) || (az < 0.35 && ax > 0.65);
    const hideCount = axisAligned ? 1 : 2;

    const centers: Array<{ side: 'minX'|'maxX'|'minZ'|'maxZ'; pos: Vector3 }>= [
      { side: 'minX', pos: new Vector3(-halfW, height/2, 0) },
      { side: 'maxX', pos: new Vector3( halfW, height/2, 0) },
      { side: 'minZ', pos: new Vector3(0, height/2, -halfD) },
      { side: 'maxZ', pos: new Vector3(0, height/2,  halfD) },
    ];
    const sorted = centers
      .map(w => ({ ...w, dist: cam.distanceTo(w.pos) }))
      .sort((a, b) => a.dist - b.dist);

    const hiddenSides = new Set(sorted.slice(0, hideCount).map(w => w.side));
    const target: Record<'minX'|'maxX'|'minZ'|'maxZ', number> = {
      minX: hiddenSides.has('minX') ? 0 : 1,
      maxX: hiddenSides.has('maxX') ? 0 : 1,
      minZ: hiddenSides.has('minZ') ? 0 : 1,
      maxZ: hiddenSides.has('maxZ') ? 0 : 1,
    };

    // ease towards target (same easing as Room previously)
    const ease = 0.15;
    const next = { ...fadesRef.current } as typeof fadesRef.current;
    (['minX','maxX','minZ','maxZ'] as const).forEach((k) => {
      next[k] = next[k] + (target[k] - next[k]) * ease;
    });
    fadesRef.current = next;

    // publish to store
    setWallFades(next);
    const visibleWalls: ('minX'|'maxX'|'minZ'|'maxZ')[] = (['minX','maxX','minZ','maxZ'] as const)
      .filter(k => target[k] > 0.5);
    setVisibleWalls(visibleWalls);
  });

  return null;
}

