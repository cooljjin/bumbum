'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';

const WALK_MODEL_PATH = '/models/avartar/Animation_Walking_withSkin.glb';
const IDLE_MODEL_PATH = '/models/avartar/Animation_stop.glb';

// Movement thresholds; tweak per device if necessary to avoid jitter.
const MIN_MOVE_THRESHOLD = 0.05;
const MIN_TARGET_DELTA = 0.01;
const MOVE_SPEED = 1.0;
const WALK_TIME_SCALE = 1.15;
const FADE_DURATION = 0.3;

const IDLE_NAME_REGEX = /idle|stand|wait|rest|pose|still|breath|calm/i;
const WALK_NAME_REGEX = /walk|run|move|locomotion|jog/i;

interface SimpleAvatarProps {
  targetPosition?: THREE.Vector3 | null;
  idleActionOverride?: string | RegExp;
  debugAnimations?: boolean;
}

function SimpleAvatar({
  targetPosition,
  idleActionOverride,
  debugAnimations = false,
}: SimpleAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRef = useRef<THREE.Vector3 | null>(null);
  const directionRef = useRef(new THREE.Vector3());
  const logTimerRef = useRef(0);

  const { scene: walkScene, animations: walkAnimations } = useGLTF(WALK_MODEL_PATH);
  const { scene: idleScene, animations: idleAnimations } = useGLTF(IDLE_MODEL_PATH);

  const clonedScene = useMemo<THREE.Group | null>(() => {
    const sourceScene = (walkScene ?? idleScene) as THREE.Group | undefined;
    if (!sourceScene) {
      return null;
    }

    return SkeletonUtils.clone(sourceScene);
  }, [walkScene, idleScene]);

  const mergedAnimations = useMemo<THREE.AnimationClip[]>(() => {
    const allClips = [...(walkAnimations ?? []), ...(idleAnimations ?? [])];
    const unique = new Map<string, THREE.AnimationClip>();
    allClips.forEach(clip => {
      if (!unique.has(clip.name)) {
        unique.set(clip.name, clip);
      }
    });
    return Array.from(unique.values());
  }, [walkAnimations, idleAnimations]);

  const { actions, mixer, names, clips } = useAnimations(mergedAnimations, groupRef);

  const [isMoving, setIsMoving] = useState(false);
  const [currentActionName, setCurrentActionName] = useState<string | null>(null);
  const currentActionNameRef = useRef<string | null>(null);

  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const singleClipModeRef = useRef(false);

  const shouldDebug = debugAnimations || process.env.NODE_ENV !== 'production';
  const debugLog = useCallback(
    (...args: unknown[]) => {
      if (shouldDebug) {
        // eslint-disable-next-line no-console
        console.log(...args);
      }
    },
    [shouldDebug]
  );

  useEffect(() => {
    currentActionNameRef.current = currentActionName;
  }, [currentActionName]);

  const playIdle = useCallback(() => {
    const idle = idleActionRef.current;
    if (!idle) {
      return false;
    }

    const idleName = idle.getClip().name;
    if (currentActionNameRef.current === idleName && idle.isRunning()) {
      idle.timeScale = 1;
      return true;
    }

    const walk = walkActionRef.current;
    if (walk && walk !== idle && walk.isRunning()) {
      walk.fadeOut(FADE_DURATION);
    }

    idle.enabled = true;
    idle.timeScale = 1;
    idle.reset().fadeIn(FADE_DURATION).play();

    if (currentActionNameRef.current !== idleName) {
      setCurrentActionName(idleName);
      currentActionNameRef.current = idleName;
    }

    debugLog('[Avatar] Forced idle action', idleName);
    return true;
  }, [debugLog]);

  useEffect(() => {
    if (!groupRef.current) return;

    const root = groupRef.current;
    const model = clonedScene ?? null;
    if (!model) {
      return;
    }

    debugLog('[Avatar] GLB loaded', {
      walkModel: walkScene
        ? { url: WALK_MODEL_PATH, sceneName: walkScene.name ?? '(unnamed)' }
        : null,
      idleModel: idleScene
        ? { url: IDLE_MODEL_PATH, sceneName: idleScene.name ?? '(unnamed)' }
        : null,
    });

    model.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    root.add(model);

    return () => {
      root.remove(model);
    };
  }, [clonedScene, debugLog, idleScene, walkScene]);

  useEffect(() => {
    const avatarGroup = groupRef.current;
    if (!avatarGroup) return;

    avatarGroup.scale.setScalar(1);
    avatarGroup.position.set(0, 0, 0);
    avatarGroup.name = 'avatar';
  }, []);

  useEffect(() => {
    if (!actions || names.length === 0) {
      idleActionRef.current = null;
      walkActionRef.current = null;
      singleClipModeRef.current = false;
      setCurrentActionName(null);
      return;
    }

    debugLog('[Avatar] Animation clips found', names);

    const clipMap = new Map<string, THREE.AnimationClip>();
    clips.forEach(clip => {
      clipMap.set(clip.name, clip);
    });

    const resolveIdleClip = (): string | undefined => {
      let overrideMatch: string | undefined;

      if (idleActionOverride) {
        if (idleActionOverride instanceof RegExp) {
          overrideMatch = names.find(name => idleActionOverride.test(name));
        } else {
          overrideMatch =
            names.find(name => name === idleActionOverride) ??
            names.find(name => {
              try {
                return new RegExp(idleActionOverride, 'i').test(name);
              } catch {
                return false;
              }
            });
        }

        if (overrideMatch) {
          return overrideMatch;
        }
      }

      const keywordMatch = names.find(name => IDLE_NAME_REGEX.test(name));
      if (keywordMatch) {
        return keywordMatch;
      }

      const shortLoopCandidates = names
        .map(name => {
          const clip = clipMap.get(name);
          return clip && clip.duration <= 5 ? { name, clip } : null;
        })
        .filter((entry): entry is { name: string; clip: THREE.AnimationClip } => Boolean(entry));

      if (shortLoopCandidates.length > 0) {
        const scoreClip = (clipName: string) => {
          const score =
            (IDLE_NAME_REGEX.test(clipName) ? 4 : 0) +
            (/stand/i.test(clipName) ? 2 : 0) +
            (/pose|still|rest/i.test(clipName) ? 1 : 0) -
            (WALK_NAME_REGEX.test(clipName) ? 3 : 0) -
            (clipName.length > 16 ? 1 : 0);
          return score;
        };

        shortLoopCandidates.sort((a, b) => scoreClip(b.name) - scoreClip(a.name));
        return shortLoopCandidates[0]?.name;
      }

      return names[0];
    };

    const idleClipName = resolveIdleClip();
    const walkClipName =
      names.find(name => name !== idleClipName && WALK_NAME_REGEX.test(name)) ??
      names.find(name => name !== idleClipName) ??
      idleClipName;

    debugLog('[Avatar] Detected clip mapping', {
      idle: idleClipName ?? null,
      walk: walkClipName ?? null,
    });

    const idleAction = idleClipName ? actions[idleClipName] ?? null : null;
    const walkAction = walkClipName ? actions[walkClipName] ?? null : null;
    const singleClip = Boolean(idleClipName && walkClipName && idleClipName === walkClipName);

    singleClipModeRef.current = singleClip;
    idleActionRef.current = idleAction;
    walkActionRef.current = singleClip ? idleAction : walkAction ?? idleAction;

    Object.values(actions).forEach(action => {
      if (action) {
        action.enabled = true;
        action.setLoop(THREE.LoopRepeat, Infinity);
      }
    });

    if (idleAction) {
      idleAction.timeScale = 1;
    }

    if (!singleClip && walkAction && walkAction !== idleAction) {
      walkAction.timeScale = WALK_TIME_SCALE;
    }

    const initialAction = singleClip
      ? idleAction ?? walkAction ?? Object.values(actions)[0] ?? null
      : idleAction ?? walkAction ?? Object.values(actions)[0] ?? null;

    if (initialAction) {
      initialAction.reset().fadeIn(FADE_DURATION).play();
      initialAction.timeScale =
        !singleClip && walkAction && initialAction === walkAction ? WALK_TIME_SCALE : 1;
      setCurrentActionName(initialAction.getClip().name);

      if (idleAction && initialAction === idleAction) {
        debugLog('[Avatar] Initial idle playing', idleAction.getClip().name);
      }
    } else {
      setCurrentActionName(null);
    }

    return () => {
      debugLog('[Avatar] Cleanup -> stop all actions');
      if (mixer) {
        mixer.stopAllAction();
        if (groupRef.current) {
          mixer.uncacheRoot(groupRef.current);
        }
      }
      idleActionRef.current = null;
      walkActionRef.current = null;
      singleClipModeRef.current = false;
      setCurrentActionName(null);
    };
  }, [actions, clips, debugLog, idleActionOverride, mixer, names]);

  useEffect(() => {
    debugLog('[Avatar] targetPosition changed', targetPosition);

    if (!targetPosition) {
      targetRef.current = null;
      setIsMoving(prev => {
        if (prev) {
          debugLog('[Avatar] Movement cancelled -> idle');
        }
        return false;
      });
      return;
    }

    const avatar = groupRef.current;
    if (!avatar) {
      debugLog('[Avatar] No avatar group, ignoring target');
      return;
    }

    const nextTarget = targetPosition.clone();
    nextTarget.y = avatar.position.y;

    const distance = avatar.position.distanceTo(nextTarget);
    debugLog('[Avatar] Target distance', distance, {
      minTargetDelta: MIN_TARGET_DELTA,
      avatar: {
        x: avatar.position.x,
        y: avatar.position.y,
        z: avatar.position.z,
      },
      target: { x: nextTarget.x, y: nextTarget.y, z: nextTarget.z },
    });

    if (distance < MIN_TARGET_DELTA) {
      debugLog('[Avatar] Target too close -> stay idle');
      return;
    }

    targetRef.current = nextTarget;
    setIsMoving(prev => {
      if (!prev) {
        debugLog('[Avatar] Movement started');
      }
      return true;
    });
  }, [debugLog, targetPosition]);

  useEffect(() => {
    const idle = idleActionRef.current;
    const walk = walkActionRef.current;
    const singleClip = singleClipModeRef.current;

    if (!idle && !walk) {
      return;
    }

    const nextAction = singleClip ? idle ?? walk : isMoving ? walk ?? idle : idle ?? walk;
    if (!nextAction) {
      return;
    }

    const nextName = nextAction.getClip().name;
    if (currentActionNameRef.current === nextName && nextAction.isRunning()) {
      if (!singleClip && walk && nextAction === walk) {
        walk.timeScale = WALK_TIME_SCALE;
      } else if (idle && nextAction === idle) {
        idle.timeScale = 1;
      }
      return;
    }

    const previousAction =
      currentActionNameRef.current && actions
        ? actions[currentActionNameRef.current] ?? null
        : null;

    if (previousAction && previousAction !== nextAction) {
      previousAction.fadeOut(FADE_DURATION);
    }

    nextAction.enabled = true;
    nextAction.timeScale =
      !singleClip && walk && nextAction === walk ? WALK_TIME_SCALE : 1;
    nextAction.reset().fadeIn(FADE_DURATION).play();
    setCurrentActionName(nextName);
    currentActionNameRef.current = nextName;

    debugLog('[Avatar] Action transition', {
      from: previousAction?.getClip().name ?? null,
      to: nextName,
      moving: isMoving,
      singleClip,
    });
  }, [actions, debugLog, isMoving]);

  useFrame((_, delta) => {
    if (mixer) {
      mixer.update(delta);
      logTimerRef.current += delta;
      if (shouldDebug && logTimerRef.current > 3) {
        debugLog('[Avatar] Mixer time', mixer.time.toFixed(2));
        logTimerRef.current = 0;
      }
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
      playIdle();
      setIsMoving(prev => {
        if (prev) {
          debugLog('[Avatar] Movement complete -> idle');
        }
        return false;
      });
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

useGLTF.preload(WALK_MODEL_PATH);
useGLTF.preload(IDLE_MODEL_PATH);

export default SimpleAvatar;
