'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';

const AVATAR_MODEL_PATH = '/models/avartar/Animation_Walking_withSkin.glb';
const MIN_MOVE_THRESHOLD = 0.05;
const MIN_TARGET_DELTA = 0.01;
const MOVE_SPEED = 2.0;
const WALK_TIME_SCALE = 1.15;
const FADE_DURATION = 0.25;

function ClickToMoveAvatar() {
  const groupRef = useRef<THREE.Group>(null);
  const targetRef = useRef<THREE.Vector3 | null>(null);
  const directionRef = useRef(new THREE.Vector3());

  const { scene, animations } = useGLTF(AVATAR_MODEL_PATH);
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  const { camera, scene: threeScene, gl } = useThree();
  const { actions, mixer, names } = useAnimations(animations, groupRef);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);

  const [isMoving, setIsMoving] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentActionName, setCurrentActionName] = useState<string | null>(null);

  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const model = clonedScene;
    model.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    group.add(model);

    return () => {
      group.remove(model);
    };
  }, [clonedScene]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    group.scale.setScalar(0.8);
    group.position.set(0, 0, 0);
    group.name = 'avatar';
  }, []);

  useEffect(() => {
    if (!actions || names.length === 0) {
      idleActionRef.current = null;
      walkActionRef.current = null;
      setCurrentActionName(null);
      setIsReady(false);
      initializedRef.current = false;
      return;
    }

    const idleClipName =
      names.find(name => /idle|stand|wait|rest/i.test(name)) ?? names[0];

    const walkClipName =
      names.find(name => name !== idleClipName && /walk|run|move|locomotion/i.test(name)) ??
      (names.length > 1 ? names.find(name => name !== idleClipName) : idleClipName);

    idleActionRef.current = idleClipName ? actions[idleClipName] ?? null : null;

    const resolvedWalk =
      walkClipName && walkClipName !== idleClipName
        ? actions[walkClipName] ?? null
        : idleActionRef.current;

    walkActionRef.current = resolvedWalk ?? idleActionRef.current;

    Object.values(actions).forEach(action => {
      if (action) {
        action.enabled = true;
        action.setLoop(THREE.LoopRepeat, Infinity);
      }
    });

    if (walkActionRef.current && walkActionRef.current !== idleActionRef.current) {
      walkActionRef.current.timeScale = WALK_TIME_SCALE;
    }

    setIsReady(true);

    if (!initializedRef.current) {
      const initialAction =
        idleActionRef.current ??
        walkActionRef.current ??
        Object.values(actions)[0] ??
        null;

      if (initialAction) {
        initialAction.reset().fadeIn(FADE_DURATION).play();
        setCurrentActionName(initialAction.getClip().name);
      }

      initializedRef.current = true;
    }
  }, [actions, names]);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isReady || !groupRef.current) {
        return;
      }

      const canvasRect = gl.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
      pointer.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(threeScene.children, true);

      const floorHit = intersects.find(hit => {
        const name = hit.object.name.toLowerCase();
        return (
          name.includes('floor') ||
          name.includes('ground') ||
          hit.object.userData?.isFloor === true
        );
      });

      if (!floorHit || !floorHit.point) {
        return;
      }

      const nextTarget = floorHit.point.clone();
      nextTarget.y = groupRef.current.position.y;

      const currentPosition = groupRef.current.position;
      if (currentPosition.distanceTo(nextTarget) < MIN_TARGET_DELTA) {
        return;
      }

      targetRef.current = nextTarget;
      setIsMoving(true);
    },
    [camera, gl, isReady, pointer, raycaster, threeScene]
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [gl, handleClick, isReady]);

  useEffect(() => {
    return () => {
      if (actions) {
        Object.values(actions).forEach(action => {
          action?.stop();
        });
      }
    };
  }, [actions]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const idle = idleActionRef.current;
    const walk = walkActionRef.current;

    if (!idle && !walk) {
      return;
    }

    const nextAction = isMoving ? walk ?? idle : idle ?? walk;
    if (!nextAction) {
      return;
    }

    const nextName = nextAction.getClip().name;
    if (currentActionName === nextName && nextAction.isRunning()) {
      if (isMoving && walk && nextAction === walk && walk !== idle) {
        walk.timeScale = WALK_TIME_SCALE;
      }
      return;
    }

    const previousAction =
      currentActionName && actions ? actions[currentActionName] ?? null : null;

    if (previousAction && previousAction !== nextAction) {
      previousAction.fadeOut(FADE_DURATION);
    }

    if (isMoving && walk && nextAction === walk && walk !== idle) {
      nextAction.timeScale = WALK_TIME_SCALE;
    } else {
      nextAction.timeScale = 1;
    }

    nextAction.reset().fadeIn(FADE_DURATION).play();
    setCurrentActionName(nextName);
  }, [actions, currentActionName, isMoving, isReady]);

  useFrame((_, delta) => {
    if (mixer) {
      mixer.update(delta);
    }

    const avatar = groupRef.current;
    const target = targetRef.current;

    if (!avatar || !target) {
      return;
    }

    const current = avatar.position;
    const distance = current.distanceTo(target);
    const step = Math.min(1, delta * MOVE_SPEED);

    if (distance <= MIN_MOVE_THRESHOLD) {
      current.copy(target);
      targetRef.current = null;
      setIsMoving(false);
      return;
    }

    current.lerp(target, step);

    directionRef.current.subVectors(target, current).normalize();
    if (directionRef.current.lengthSq() > 1e-4) {
      avatar.rotation.y = Math.atan2(directionRef.current.x, directionRef.current.z);
    }
  });

  return <group ref={groupRef} />;
}

useGLTF.preload(AVATAR_MODEL_PATH);

export default ClickToMoveAvatar;
