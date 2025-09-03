'use client';

import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Outline } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

interface OutlineEffectProps {
  children: React.ReactNode;
  selectedObjects: string[];
  edgeStrength?: number;
  pulseSpeed?: number;
  visibleEdgeColor?: number;
  hiddenEdgeColor?: number;
  enabled?: boolean;
}

const OutlineEffect: React.FC<OutlineEffectProps> = ({
  children,
  selectedObjects,
  edgeStrength = 2.0,
  pulseSpeed = 0.0,
  visibleEdgeColor = 0xffffff,
  hiddenEdgeColor = 0x22090a,
  enabled = true
}) => {
  const { gl, scene, camera } = useThree();
  const selectionRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  // 선택된 객체들에 윤곽선 효과 적용
  useEffect(() => {
    if (!selectionRef.current) return;

    // 기존 선택된 객체들 제거
    selectionRef.current.clear();

    // 선택된 객체들을 selection에 추가
    selectedObjects.forEach(objectId => {
      const object = scene.getObjectByName(objectId);
      if (object) {
        selectionRef.current?.add(object);
      }
    });
  }, [selectedObjects, scene]);

  // 펄스 효과를 위한 시간 업데이트
  useFrame((state) => {
    if (pulseSpeed > 0) {
      timeRef.current = state.clock.getElapsedTime() * pulseSpeed;
    }
  });

  if (!enabled || selectedObjects.length === 0) {
    return <>{children}</>;
  }

  return (
    <>
      <EffectComposer>
        <Outline
          selection={selectionRef.current}
          selectionLayer={10}
          edgeStrength={edgeStrength}
          pulseSpeed={pulseSpeed}
          visibleEdgeColor={visibleEdgeColor}
          hiddenEdgeColor={hiddenEdgeColor}
          width={gl.domElement.width}
          height={gl.domElement.height}
          blendFunction={BlendFunction.ALPHA}
        />
      </EffectComposer>
      
      {children}
    </>
  );
};

export default OutlineEffect;
