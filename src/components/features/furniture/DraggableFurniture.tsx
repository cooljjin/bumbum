import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import { Vector3, Euler, Group, Raycaster, Plane, Vector2 } from 'three';
import { useEditorStore, useIsItemSelected } from '../../../store/editorStore';
import { PlacedItem } from '../../../types/editor';
import { createFallbackModel, createFurnitureModel, createClockFallbackModel, createWallModel, loadModel, compareModelWithFootprint } from '../../../utils/modelLoader';
import { getFurnitureFromPlacedItem } from '../../../data/furnitureCatalog';
import { safePosition, safeRotation, safeScale } from '../../../utils/safePosition';
import { constrainFurnitureToRoom, nearestWallSide, computeWallMountedTransform, clampWallMountedItem, getWallInteriorPlanes, getCurrentRoomDimensions } from '../../../utils/roomBoundary';
import { useVisibleWalls, useWallFades } from '../../../store/wallVisibilityStore';
import { applyFadeFlagsToObject } from '@/lib/wallFadeShader';
import { checkDragCollision, moveToSafePosition, checkWallOverlapWithOthers, findNonOverlappingWallPosition } from '../../../utils/collisionDetection';
import { useFurnitureEditing } from '../../../hooks/useFurnitureEditing';
import { useColorChanger } from '../../../hooks/useColorChanger';
import * as THREE from 'three';
import { isDoorFurniture } from '@/utils/furnitureHelpers';

/**
 * 모델을 footprint 크기에 맞게 조정하는 함수
 * 벽 통과 방지를 위해 정확한 크기 매칭 구현
 */
const adjustModelToFootprint = (model: THREE.Group, footprint: { width: number; height: number; depth: number }): THREE.Group => {
  // 모델의 바운딩 박스 계산
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());

  // console.log(`📐 원본 모델 크기: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
  // console.log(`📏 목표 footprint: ${footprint.width} x ${footprint.height} x ${footprint.depth}`);
  
  // 스케일 비율 계산 (각 축별로 정확히 맞춤)
  const scaleX = footprint.width / size.x;
  const scaleY = footprint.height / size.y;
  const scaleZ = footprint.depth / size.z;
  
  const scale = new THREE.Vector3(scaleX, scaleY, scaleZ);
  
  // console.log(`🔧 적용할 스케일: ${scale.x.toFixed(3)} x ${scale.y.toFixed(3)} x ${scale.z.toFixed(3)}`);
  
  // 모델 복사 및 스케일 적용
  const adjustedModel = model.clone();
  adjustedModel.scale.copy(scale);
  
  // 스케일 적용 후 새로운 바운딩 박스 계산
  const adjustedBox = new THREE.Box3().setFromObject(adjustedModel);
  const adjustedSize = adjustedBox.getSize(new THREE.Vector3());
  const adjustedCenter = adjustedBox.getCenter(new THREE.Vector3());
  
      // console.log(`📐 스케일 적용 후 크기: ${adjustedSize.x.toFixed(2)} x ${adjustedSize.y.toFixed(2)} x ${adjustedSize.z.toFixed(2)}`);
      // console.log(`🎯 스케일 적용 후 중심점: (${adjustedCenter.x.toFixed(2)}, ${adjustedCenter.y.toFixed(2)}, ${adjustedCenter.z.toFixed(2)})`);
  
  // 모델을 바닥에 정확히 맞춤 (Y축 위치 조정)
  // 바닥이 Y=0이 되도록 모델의 하단이 Y=0에 위치하도록 조정
  const bottomY = adjustedCenter.y - adjustedSize.y / 2;
  adjustedModel.position.y = -bottomY;
  
  // X, Z축도 중심을 원점으로 맞춤 (선택적)
  adjustedModel.position.x = -adjustedCenter.x;
  adjustedModel.position.z = -adjustedCenter.z;
  
  // 최종 검증
  const finalBox = new THREE.Box3().setFromObject(adjustedModel);
  const finalSize = finalBox.getSize(new THREE.Vector3());

  // console.log(`✅ 최종 모델 크기: ${finalSize.x.toFixed(2)} x ${finalSize.y.toFixed(2)} x ${finalSize.z.toFixed(2)}`);
  
  // 크기 검증 (허용 오차 1cm)
  const tolerance = 0.01;
  const sizeMatches = Math.abs(finalSize.x - footprint.width) < tolerance &&
                     Math.abs(finalSize.y - footprint.height) < tolerance &&
                     Math.abs(finalSize.z - footprint.depth) < tolerance;
  
  if (!sizeMatches) {
    // console.warn(`⚠️ 성능: 크기 매칭 실패! 목표: ${footprint.width}x${footprint.height}x${footprint.depth}, 실제: ${finalSize.x.toFixed(2)}x${finalSize.y.toFixed(2)}x${finalSize.z.toFixed(2)}`);
  }
  
  return adjustedModel;
};

interface DraggableFurnitureProps {
  item: PlacedItem;
  isEditMode: boolean;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<PlacedItem>) => void;
}

export const DraggableFurniture: React.FC<DraggableFurnitureProps> = React.memo(({
  item,
  isEditMode,
  onSelect,
  onUpdate
}) => {
  // 내부에서 선택 상태 직접 구독
  const isSelected = useIsItemSelected(item.id);
  // 공통 편집 로직 사용
  const {
    isHovered,
    isColliding,
    meshRef,
    setIsHovered,
    setIsColliding,
    handlePointerEnter,
    handlePointerLeave,
    handleClick,
    disposeModel
  } = useFurnitureEditing(item);

  // 색상 변경 기능
  const { setModelRef } = useColorChanger();

  const [model, setModel] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const originalEmissiveRef = useRef<Map<THREE.Material, THREE.Color>>(new Map());
  // const originalOpacityRef = useRef<Map<THREE.Material, number>>(new Map());

  // 🖱️ 드래그 앤 드롭 관련 상태 변수들
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<Vector3 | null>(null);
  const [dragStartMousePosition, setDragStartMousePosition] = useState<Vector2 | null>(null);
  const dragIntentRef = useRef<{ active: boolean; startX: number; startY: number } | null>(null);
  const fromPointerDownRef = useRef(false);
  const suppressClickRef = useRef(false);

  // 모델 로딩 로직
  React.useLayoutEffect(() => {
    const loadFurnitureModel = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const furniture = getFurnitureFromPlacedItem(item);

        if (!furniture) {
          // 카탈로그에 없더라도 PlacedItem.modelPath가 있으면 직접 로드 시도
          if (item.modelPath && (item.modelPath.startsWith('blob:') || item.modelPath.endsWith('.glb'))) {
            try {
              const gltfModel = await loadModel(item.modelPath, { useCache: false, priority: 'normal' });
              const adjustedModel = adjustModelToFootprint(gltfModel, item.footprint);
              setModel(adjustedModel);
              setIsLoading(false);
              return;
            } catch (e) {
              // 실패 시 폴백으로 진행
            }
          }

          setLoadError('가구 정보를 찾을 수 없습니다');
          setIsLoading(false);
          return;
        }

        // 벽 카테고리는 GLB 로드 시도하지 않고 바로 폴백 모델 생성
        if (furniture.category === 'wall') {
          // 바로 폴백 모델 생성으로 넘어가기
        } else {
          // 벽이 아닌 경우에만 GLTF 로드 시도
          if (furniture.modelPath) {
            try {
              const gltfModel = await loadModel(furniture.modelPath, {
                // 캐시 활용으로 동일 모델 다수 배치 시 로딩/파싱 비용 절감
                useCache: true,
                priority: 'normal'
              });

              if (gltfModel) {
                // 원본 모델과 footprint 크기 비교
                compareModelWithFootprint(gltfModel, furniture.footprint, furniture.nameKo);

                // 모델 크기를 footprint에 맞게 조정
                const adjustedModel = adjustModelToFootprint(gltfModel, furniture.footprint);
                setModel(adjustedModel);
                setIsLoading(false);
                return; // 성공적으로 로드했으므로 여기서 종료
              } else {
                throw new Error('GLTF 모델 로드 실패');
              }
            } catch (gltfError) {
              // GLTF 로드 실패 시 폴백 모델 생성으로 넘어감
            }
          }
        }

        // GLTF 로드 실패 또는 벽 카테고리인 경우 폴백 모델 생성
        setIsLoading(false);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Unknown error');

        // 에러 발생 시 폴백 모델 사용
        // 카탈로그가 없을 때도 폴백 생성
        const fallbackModel = createFallbackModel();
        setModel(fallbackModel);
        setIsLoading(false);
      }
    };

    loadFurnitureModel();
  }, [item.id]);

  // 🎯 드래그 앤 드롭 관련 ref들
  const raycaster = useRef<Raycaster>(new Raycaster());
  const dragPlane = useRef<Plane>(new Plane(new Vector3(0, 1, 0), 0));
  const activeWallSideRef = useRef<'minX' | 'maxX' | 'minZ' | 'maxZ' | null>(null);

  const { grid, setDragging, placedItems } = useEditorStore();
  const { camera, gl } = useThree();
  const visibleWalls = useVisibleWalls();
  const wallFades = useWallFades();
  // const isOnVisibleWall = React.useMemo(() => {
  //   if (!item.mount || item.mount.type !== 'wall') return true;
  //   return visibleWalls.includes(item.mount.side);
  // }, [visibleWalls, item.mount]);
  const currentWallFade = React.useMemo(() => {
    if (!item.mount || item.mount.type !== 'wall') return 1;
    return wallFades[item.mount.side] ?? 1;
  }, [wallFades, item.mount]);
  
  // 문(door) 여부 판별 (isDoorFurniture 유틸리티 사용)
  const isDoor = React.useMemo(() => {
    try {
      const f = getFurnitureFromPlacedItem(item);
      return isDoorFurniture(f);
    } catch { 
      return false; 
    }
  }, [item]);

  // 벽 부착 아이템은 셰이더 패치 없이 플래그/opacity만 동기화 (벽과 동일 임계치)

  // 안전한 preventDefault 래퍼 (r3f PointerEvent에는 preventDefault가 없을 수 있음)
  // const safePreventDefault = (ev: any) => {
  //   try {
  //     const e = ev?.nativeEvent ?? ev;
  //     // 패시브 리스너에서 발생한 이벤트는 cancelable === false 여서
  //     // preventDefault를 호출하면 경고가 발생한다. 이 경우 건너뜀.
  //     if (e && e.cancelable === false) return;
  //     if (typeof e?.preventDefault === 'function') e.preventDefault();
  //   } catch {}
  // };


  // 🖱️ 드래그 시작 핸들러 (간소화된 버전)
  const handleDragStart = useCallback((event: any) => {
    if (!isEditMode || item.isLocked) {
      return;
    }

    // 선택되지 않은 상태에서도 바로 드래그 시작 가능
    if (!isSelected) {
      onSelect(item.id);
    }

    // 전역 단일 드래그 락 시도: 다른 아이템이 이미 드래그 중이면 시작하지 않음
    try {
      const st = useEditorStore.getState();
      if (st.draggingItemId && st.draggingItemId !== item.id) return;
      const ok = st.beginDraggingItem(item.id);
      if (!ok) return;
    } catch {}

    // 실제 드래그 시작 여부는 이동 임계치 통과 시 결정
    setIsDragging(false);
    setIsHovered(false);

    // 드래그 시작 위치 저장
    setDragStartPosition(item.position.clone());

    // 드래그 평면 설정
    if (item.mount?.type === 'wall') {
      const planes = getWallInteriorPlanes();
      const side = item.mount?.side ?? nearestWallSide(item.position);
      activeWallSideRef.current = side;
      if (side === 'minX') dragPlane.current.set(new Vector3(1, 0, 0), -planes.minX.constant);
      if (side === 'maxX') dragPlane.current.set(new Vector3(-1, 0, 0), planes.maxX.constant);
      if (side === 'minZ') dragPlane.current.set(new Vector3(0, 0, 1), -planes.minZ.constant);
      if (side === 'maxZ') dragPlane.current.set(new Vector3(0, 0, -1), planes.maxZ.constant);
    } else {
      dragPlane.current.set(new Vector3(0, 1, 0), -item.position.y);
    }

    // 마우스 위치 계산
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const rect = gl?.domElement?.getBoundingClientRect?.();
    const width = rect?.width ?? window.innerWidth;
    const height = rect?.height ?? window.innerHeight;
    const offsetX = rect ? clientX - rect.left : clientX;
    const offsetY = rect ? clientY - rect.top : clientY;
    const mouseX = (offsetX / width) * 2 - 1;
    const mouseY = -(offsetY / height) * 2 + 1;

    setDragStartMousePosition(new Vector2(mouseX, mouseY));

    // 드래그 의도 설정 및 클릭 억제 초기화
    dragIntentRef.current = { active: true, startX: clientX, startY: clientY };
    suppressClickRef.current = false; // 드래그 시작 시점에서는 클릭 허용

    // 카메라 시점 즉시 고정: 의도 감지 시 전역 드래그 플래그를 선반영하여
    // CameraControls enabled를 즉시 false로 만들어 초기 흔들림을 방지
    try {
      setDragging(true);
    } catch {}

  }, [isEditMode, isSelected, item.isLocked, item.id, item.position, gl, setDragging]);

  // 🔄 드래그 중 핸들러 (마우스 및 터치 지원)
  const handleDrag = useCallback((event: any) => {
    // 드래그 의도가 없으면 무시
    if (!dragIntentRef.current?.active) return;

    // 전역 락 소유자만 드래그 처리
    try {
      const { draggingItemId } = useEditorStore.getState();
      if (draggingItemId && draggingItemId !== item.id) return;
    } catch {}

    // 마우스 또는 터치 위치 계산
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
      // 터치 이벤트
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      // 마우스 이벤트
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // 드래그 의도 단계: 임계치 넘으면 실제 드래그 시작
    if (!isDragging && dragIntentRef.current?.active) {
      const dx = clientX - dragIntentRef.current.startX;
      const dy = clientY - dragIntentRef.current.startY;
      const dist = Math.hypot(dx, dy);
      // 터치와 마우스에 따라 다른 임계치 적용 (더 관대하게)
      const isTouch = event.touches || event.pointerType === 'touch';
      const threshold = isTouch ? 15 : 8; // 터치: 15px, 마우스: 8px

      if (dist > threshold) {
        setIsDragging(true);
        setDragging(true); // 전역 드래그 상태는 실제 드래그 시작 시에만 true
        suppressClickRef.current = true; // 실제 드래그 시작 시에만 클릭 억제
      } else {
        return; // 아직 드래그 시작 전이면 무시
      }
    }

    // 실제 드래그 중이 아니면 무시
    if (!isDragging || !dragStartPosition || !dragStartMousePosition) return;

    // 스크롤 방지는 전역(window) 리스너(passive: false)에서 처리

    const rect = gl?.domElement?.getBoundingClientRect?.();
    const width = rect?.width ?? window.innerWidth;
    const height = rect?.height ?? window.innerHeight;
    const offsetX = rect ? clientX - rect.left : clientX;
    const offsetY = rect ? clientY - rect.top : clientY;
    const mouseX = (offsetX / width) * 2 - 1;
    const mouseY = -(offsetY / height) * 2 + 1;

    // 레이캐스터로 3D 공간의 위치 계산
    raycaster.current.setFromCamera(new Vector2(mouseX, mouseY), camera);

    // 드래그 평면과의 교차점 계산 또는 벽 선택 로직
    // 벽 부착 아이템의 경우: 포인터 레이를 네 개의 벽면과 모두 교차시켜
    // 가장 가까운 교차점을 가진 벽을 선택하여 동적으로 side를 전환한다.
    if (item.mount?.type === 'wall') {
      const planes = getWallInteriorPlanes();

      const candidates: Array<{ side: 'minX'|'maxX'|'minZ'|'maxZ'; point: Vector3; t: number }> = [];
      const tmpPoint = new Vector3();
      const ray = raycaster.current.ray;
      const dir = ray.direction.clone().normalize();
      const origin = ray.origin.clone();

      // 각 벽면에 대한 Plane 구성 (n·x + c = 0 형태)
      const planeMinX = new Plane(new Vector3(1, 0, 0), -planes.minX.constant);
      const planeMaxX = new Plane(new Vector3(-1, 0, 0), planes.maxX.constant);
      const planeMinZ = new Plane(new Vector3(0, 0, 1), -planes.minZ.constant);
      const planeMaxZ = new Plane(new Vector3(0, 0, -1), planes.maxZ.constant);

      // 사용자 시점에서 보이는 벽만 허용: 카메라에 가장 가까운 두 벽은 숨김 처리되므로 제외한다
      const dims = getCurrentRoomDimensions();
      const halfW = dims.width / 2;
      const halfD = dims.depth / 2;
      const camPos = camera.position;

      const wallCenters: Array<{ name: 'left'|'right'|'back'|'front'; pos: Vector3; side: 'minX'|'maxX'|'minZ'|'maxZ'; plane: Plane }>= [
        { name: 'left',  pos: new Vector3(-halfW, dims.height/2, 0), side: 'minX', plane: planeMinX },
        { name: 'right', pos: new Vector3( halfW, dims.height/2, 0), side: 'maxX', plane: planeMaxX },
        { name: 'back',  pos: new Vector3(0, dims.height/2, -halfD), side: 'minZ', plane: planeMinZ },
        { name: 'front', pos: new Vector3(0, dims.height/2,  halfD), side: 'maxZ', plane: planeMaxZ },
      ];
      // 실제 화면에서 보이는 벽 목록을 우선 사용
      let allowedSides = new Set(visibleWalls as ('minX'|'maxX'|'minZ'|'maxZ')[]);
      if (allowedSides.size === 0) {
        // 폴백: 카메라 거리 기반(이 경우는 거의 발생하지 않음)
        const sortedByDistance = wallCenters
          .map(w => ({ ...w, dist: camPos.distanceTo(w.pos) }))
          .sort((a, b) => a.dist - b.dist);
        const fallback = new Set(sortedByDistance.slice(2).map(w => w.side));
        allowedSides = fallback as any;
      }

      const checks: Array<{ side: 'minX'|'maxX'|'minZ'|'maxZ'; plane: Plane }> = wallCenters
        .filter(w => allowedSides.has(w.side))
        .map(w => ({ side: w.side, plane: w.plane }));

      const eps = 1e-4;
      for (const { side, plane } of checks) {
        if (ray.intersectPlane(plane, tmpPoint)) {
          // 벽 면의 유한 영역(사각형) 안에 교차점이 있는지 검사
          let onFace = false;
          if (side === 'minX' || side === 'maxX') {
            // x 고정, 유효 범위: z in [-halfDepth, +halfDepth], y in [0, height]
            onFace = (Math.abs(tmpPoint.z) <= halfD + eps) && (tmpPoint.y >= -eps && tmpPoint.y <= dims.height + eps);
          } else {
            // z 고정, 유효 범위: x in [-halfWidth, +halfWidth], y in [0, height]
            onFace = (Math.abs(tmpPoint.x) <= halfW + eps) && (tmpPoint.y >= -eps && tmpPoint.y <= dims.height + eps);
          }
          if (!onFace) continue;

          const t = tmpPoint.clone().sub(origin).dot(dir); // 레이 파라미터 (양수만 유효)
          if (t > 0) {
            candidates.push({ side, point: tmpPoint.clone(), t });
          }
        }
      }

      if (candidates.length > 0) {
        // 가장 가까운 교차점 선택 → 해당 벽으로 스냅
        candidates.sort((a, b) => a.t - b.t);
        const best = candidates[0];
        if (!best) return;
        
        const side = best.side;
        activeWallSideRef.current = side;

        let u = (side === 'minX' || side === 'maxX') ? best.point.z : best.point.x;
        let height = best.point.y;
        if (grid.enabled && grid.divisions > 0) {
          const cell = grid.size / grid.divisions;
          u = Math.round(u / cell) * cell;
          height = Math.round(height / cell) * cell;
        }

        // 문은 항상 바닥 높이(0)에 맞춘다
        if (isDoor) height = 0;

        const offset = item.mount?.offset ?? 0;
        const { position, rotationY } = computeWallMountedTransform(item, side, u, height, offset);

        // 같은 벽면 겹침 검사
        const others = placedItems.filter(p => p.id !== item.id);
        const testItem: PlacedItem = {
          ...item,
          position: position.clone() as any,
          rotation: new Euler(item.rotation.x, rotationY, item.rotation.z) as any,
          mount: { ...(item.mount || { type: 'wall', side }), side, u, height, offset } as any
        };
        const overlap = checkWallOverlapWithOthers(testItem, others);
        setIsColliding(overlap.hasOverlap);

        onUpdate(item.id, {
          position: position.clone() as any,
          rotation: new Euler(item.rotation.x, rotationY, item.rotation.z) as any,
          mount: { ...(item.mount || { type: 'wall', side }), side, u, height, offset } as any
        });
        return;
      }
      // 교차점이 없다면 기존 평면 로직으로 폴백
    }

    // 폴백: 드래그 평면과의 교차점
    const intersectionPoint = new Vector3();
    if (!raycaster.current.ray.intersectPlane(dragPlane.current, intersectionPoint)) return;

    // 일반 바닥 드래그
    const newPosition = intersectionPoint.clone();
    if (grid.enabled && grid.divisions > 0) {
      const gridSize = grid.size / grid.divisions;
      newPosition.x = Math.round(newPosition.x / gridSize) * gridSize;
      newPosition.z = Math.round(newPosition.z / gridSize) * gridSize;
    }
    newPosition.y = dragStartPosition.y;

    // 1차 그리드 스냅 후, 즉시 룸 경계로 클램핑하여 시각적 침투 방지
    const constrained = constrainFurnitureToRoom({ ...item, position: newPosition } as PlacedItem);
    
    // 드래그 중 충돌 감지
    const otherItems = placedItems.filter(placedItem => placedItem.id !== item.id);
    const collisionCheck = checkDragCollision(constrained, otherItems, constrained.position);
    
    // 충돌 상태 업데이트 (시각적 피드백용)
    setIsColliding(collisionCheck.hasCollision);
    
    if (collisionCheck.hasCollision) {
      // console.warn(`⚠️ 성능: 드래그 중 충돌 감지 - ${item.name || item.id}이(가) ${collisionCheck.collidingItems.length}개의 가구와 충돌`);
    }
    
    onUpdate(item.id, { position: constrained.position });
  }, [isDragging, dragStartPosition, dragStartMousePosition, camera, grid, item.id, onUpdate, placedItems]);

  // ✅ 드래그 종료 핸들러
  const handleDragEnd = useCallback((_event: any) => {
    // 드래그 의도가 있었던 경우 모두 처리 (실제 드래그 여부와 관계없이)
    const hadDragIntent = dragIntentRef.current?.active;
    const wasDragging = isDragging; // 드래그 상태 캡처
    
    if (!wasDragging && !hadDragIntent) return;

    console.log('🎯 드래그 종료:', { wasDragging, hadDragIntent, itemId: item.id });

    // 전역 드래그 상태를 먼저 해제 (플로팅 UI가 나타나도록)
    if (hadDragIntent || wasDragging) {
      setDragging(false);
    }

    // 로컬 상태 업데이트
    setIsDragging(false);
    setDragStartPosition(null);
    setDragStartMousePosition(null);
    setIsColliding(false); // 충돌 상태 초기화
    dragIntentRef.current = null;
    fromPointerDownRef.current = false;
    
    // 드래그 종료 후 가구 선택 (플로팅 UI가 나타나도록)
    if (wasDragging) {
      // 드래그가 완료되면 가구를 선택 상태로 만들기
      // 약간의 지연을 주어 상태 업데이트가 제대로 반영되도록 함
      requestAnimationFrame(() => {
        onSelect(item.id);
        setIsHovered(true);
        console.log('✅ 드래그 종료 후 가구 선택:', item.id);
      });
    } else if (isSelected) {
      // 드래그 의도만 있었던 경우에도 호버 효과 복원
      setIsHovered(true);
    }

    // 드래그 종료 시 위치 보정
    if (isDragging) {
      if (item.mount?.type === 'wall') {
        // 우선 클램프
        let next = clampWallMountedItem({ ...item });

        // 문은 항상 높이 0으로 고정
        if (isDoor && next.mount) {
          next = clampWallMountedItem({
            ...next,
            mount: { ...next.mount, height: 0 }
          });
        }

        // 같은 벽면 겹침이 있으면 빈 u를 탐색
        const others = placedItems.filter(p => p.id !== item.id);
        const overlap = checkWallOverlapWithOthers(next, others);
        if (overlap.hasOverlap && next.mount) {
          // 스텝은 그리드 셀 크기 사용
          const cell = (grid.enabled && grid.divisions > 0) ? (grid.size / grid.divisions) : 0.1;
          const found = findNonOverlappingWallPosition(next, others, cell, 300);
          if (found) {
            next = clampWallMountedItem({
              ...next,
              mount: { ...next.mount, u: found.u }
            });
          }
        }
        onUpdate(item.id, { position: next.position, rotation: next.rotation as any, mount: next.mount } as any);
      } else {
        const otherItems = placedItems.filter(placedItem => placedItem.id !== item.id);
        const collisionCheck = checkDragCollision(item, otherItems, item.position);
        if (collisionCheck.hasCollision) {
          const safeItem = moveToSafePosition(item, otherItems);
          // 방 경계 보정 추가
          const constrained = constrainFurnitureToRoom(safeItem as PlacedItem);
          if (constrained.position !== item.position) {
            onUpdate(item.id, { position: constrained.position });
          }
        }
      }
    }

    // 드래그 종료 즉시 클릭 억제 플래그 해제
    suppressClickRef.current = false;

    // 전역 단일 드래그 락 해제
    try { useEditorStore.getState().endDraggingItem(item.id); } catch {}
  }, [isDragging, item, setDragging, placedItems, onUpdate]);

  // 🖱️ 마우스 이벤트 핸들러
  // 포인터 다운(마우스/터치 공통)
  const handlePointerDown = useCallback((event: any) => {
    // 편집 모드가 아니거나 고정된 아이템이면 무시
    if (!isEditMode || item.isLocked) return;
    
    // 이벤트 전파 중지
    try { event.stopPropagation?.(); } catch {}
    
    const isTouch = event.pointerType === 'touch' || !!event.touches;
    const isLeft = event.button === 0 || event.button === undefined;

    if (isTouch || isLeft) {
      try {
        event.currentTarget?.setPointerCapture?.(event.pointerId);
      } catch (e) {
        // 포인터 캡처 실패 무시
      }

      // handleDragStart 직접 호출
      handleDragStart(event);
    }
  }, [handleDragStart, isEditMode, item.isLocked]);

  const handlePointerMove = useCallback((event: any) => {
    if (isDragging) {
      handleDrag(event);
    } else if (dragIntentRef.current?.active) {
      handleDrag(event);
    }
  }, [isDragging, handleDrag, item.id]);

  const handlePointerUp = useCallback((event: any) => {
    try { event.stopPropagation?.(); } catch {}
    if (isDragging || dragIntentRef.current?.active) {
      handleDragEnd(event);
    }
  }, [isDragging, handleDragEnd, item.id]);

  const handlePointerCancel = useCallback((event: any) => {
    if (isDragging || dragIntentRef.current?.active) {
      handleDragEnd(event);
    }
  }, [isDragging, handleDragEnd]);


  // 전역 마우스 및 터치 이벤트 리스너
  useEffect((): (() => void) | void => {
    if (isDragging) {
      // 마우스/포인터 이벤트
      window.addEventListener('pointermove', handlePointerMove as any, { passive: false });
      window.addEventListener('pointerup', handlePointerUp as any, { passive: false });
      window.addEventListener('pointercancel', handlePointerCancel as any, { passive: false });
      // 레거시 폴백
      window.addEventListener('mousemove', handlePointerMove as any);
      window.addEventListener('mouseup', handlePointerUp as any);
      // 터치
      window.addEventListener('touchmove', handlePointerMove as any, { passive: false });
      window.addEventListener('touchend', handlePointerUp as any, { passive: false });

      return () => {
        window.removeEventListener('pointermove', handlePointerMove as any);
        window.removeEventListener('pointerup', handlePointerUp as any);
        window.removeEventListener('pointercancel', handlePointerCancel as any);
        window.removeEventListener('mousemove', handlePointerMove as any);
        window.removeEventListener('mouseup', handlePointerUp as any);
        window.removeEventListener('touchmove', handlePointerMove as any);
        window.removeEventListener('touchend', handlePointerUp as any);
      };
    }
    return undefined;
  }, [isDragging, handlePointerMove, handlePointerUp, handlePointerCancel]);

  // 🆕 DOM 이벤트 리스너 추가 (React Three Fiber 이벤트 우회)
  useEffect(() => {
    if (!isEditMode || item.isLocked) return;

    const handleDOMPointerDown = (event: PointerEvent) => {
      // 3D 캔버스 내의 이벤트인지 확인
      const canvas = gl?.domElement;
      if (!canvas || !canvas.contains(event.target as Node)) return;

      // 가구 위에서의 이벤트인지 확인 (간단한 히트 테스트)
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // 레이캐스터로 가구 히트 테스트
      if (!meshRef.current) return;
      raycaster.current.setFromCamera(new Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.current.intersectObject(meshRef.current, true);

      if (intersects.length > 0) {
        // 가구 클릭 시간 기록 (빈 공간 클릭 판별용)
        if (typeof window !== 'undefined') {
          (window as any).lastFurnitureClickTime = Date.now();
        }

        // 카메라 컨트롤에 이벤트가 전달되어 시점이 움직이지 않도록 즉시 차단
        try { event.preventDefault(); } catch {}
        try { event.stopPropagation(); } catch {}
        
        // 가상 이벤트 객체 생성
        const virtualEvent = {
          clientX: event.clientX,
          clientY: event.clientY,
          pointerType: event.pointerType,
          button: event.button,
          touches: null,
          pointerId: event.pointerId,
          currentTarget: event.target,
          type: 'pointerdown',
          stopPropagation: () => event.stopPropagation(),
          preventDefault: () => event.preventDefault()
        };

        // handleDragStart 직접 호출
        handleDragStart(virtualEvent);
      }
    };

    // 캡처 단계에서 가구 히트 감지 → 카메라 컨트롤보다 먼저 가로채기
    window.addEventListener('pointerdown', handleDOMPointerDown, { passive: false, capture: true });

    return () => {
      // 캡처 단계 등록과 동일하게 캡처 단계에서 해제
      window.removeEventListener('pointerdown', handleDOMPointerDown, true);
    };
  }, [isEditMode, item.isLocked, isSelected, camera, gl, handleDragStart, onSelect]);

  // 드래그 상태 변화 감지: 자동 재선택 로직 제거
  // - 드래그 종료 시 선택 처리는 handleDragEnd 또는 클릭 핸들러에서 수행
  // - 불필요한 자동 선택은 빈 공간 클릭 시 선택 해제를 방해할 수 있음
  // 유지 목적: 과거의 자동 선택 부작용 제거를 위한 설명 주석

  // 컴포넌트가 언마운트될 때 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove as any);
      window.removeEventListener('pointerup', handlePointerUp as any);
      window.removeEventListener('pointercancel', handlePointerCancel as any);
      window.removeEventListener('mousemove', handlePointerMove as any);
      window.removeEventListener('mouseup', handlePointerUp as any);
      window.removeEventListener('touchmove', handlePointerMove as any);
      window.removeEventListener('touchend', handlePointerUp as any);

      // 전역 단일 드래그 락 보정: 언마운트 시 내 락이면 해제
      try {
        const { draggingItemId, endDraggingItem } = useEditorStore.getState();
        if (draggingItemId === item.id) endDraggingItem(item.id);
      } catch {}
    };
  }, [handlePointerMove, handlePointerUp, handlePointerCancel]);

  // 클릭 이벤트 처리 - 공통 로직 사용
  const handleClickEvent = useCallback((event: any) => {
    // 드래그 중이거나 클릭이 억제된 상태라면 무시
    if (isDragging || suppressClickRef.current) {
      console.log('🚫 클릭 무시:', { isDragging, suppressClick: suppressClickRef.current });
      return;
    }

    // 이벤트 전파 방지 (빈 공간 클릭으로 전달되지 않도록)
    try {
      event?.stopPropagation?.();
      event?.nativeEvent?.stopPropagation?.();
    } catch {}

    // 가구 클릭 시간 기록 (빈 공간 클릭 판별용)
    if (typeof window !== 'undefined') {
      (window as any).lastFurnitureClickTime = Date.now();
      console.log('🎯 가구 클릭 시간 기록:', (window as any).lastFurnitureClickTime);
    }

    // 선택 토글: 이미 선택된 경우에도 클릭 시 유지 (해제하지 않음)
    if (!isSelected) {
      console.log('✅ 가구 선택:', item.id);
      handleClick(onSelect);
    } else {
      console.log('ℹ️ 이미 선택된 가구:', item.id);
    }
  }, [isDragging, isSelected, handleClick, onSelect, item.id]);

  // 모델 로딩 - 강제 실행
  useEffect(() => {
    // console.log(`🔄 useEffect 실행됨 - item.id: ${item.id}, item.name: ${item.name}`);
    // console.log(`🔄 useEffect dependency 체크:`, { 
    //   itemId: item.id, 
    //   itemName: item.name, 
    //   itemModelPath: item.modelPath 
    // });
    
    const loadFurnitureModel = async () => {
      try {
        // console.log(`🚀 loadFurnitureModel 시작 - item.id: ${item.id}`);
        setIsLoading(true);
        setLoadError(null);

        const furniture = getFurnitureFromPlacedItem(item);
        // console.log(`🔍 furniture 정보:`, furniture);
        
        if (!furniture) {
          // 카탈로그에 없는 임시 에셋: PlacedItem.modelPath로 직접 로드 시도
          if (item.modelPath && (item.modelPath.startsWith('blob:') || item.modelPath.endsWith('.glb'))) {
            try {
              const gltfModel = await loadModel(item.modelPath, { useCache: true, priority: 'normal' });
              const adjustedModel = adjustModelToFootprint(gltfModel, item.footprint);
              setModel(adjustedModel);
              setIsLoading(false);
              return;
            } catch (e) {
              // 실패 시 폴백 생성으로 진행
            }
          }
          setLoadError('가구 정보를 찾을 수 없습니다');
          setIsLoading(false);
          return;
        }

        // console.log(`🎯 가구 모델 로딩 시작: ${furniture.nameKo} (ID: ${item.id})`);
        // console.log(`📁 모델 경로: ${furniture.modelPath}`);
        // console.log(`📏 크기: ${furniture.footprint.width}x${furniture.footprint.height}x${furniture.footprint.depth}`);

        // 벽 카테고리는 GLB 로드 시도하지 않고 바로 폴백 모델 생성
        if (furniture.category === 'wall') {
          // console.log(`🏗️ 벽 카테고리 감지, GLB 로드 생략 및 폴백 모델 생성: ${furniture.nameKo}`);
        } else {
          // 벽이 아닌 경우에만 GLB 로드 시도
          if (furniture.modelPath) {
            // console.log(`🔄 GLTF 모델 로딩 시작: ${furniture.modelPath}`);
            try {
              const gltfModel = await loadModel(furniture.modelPath, {
                useCache: false,
                priority: 'normal'
              });

              if (gltfModel) {
                // console.info(`✅ GLTF 모델 로드 성공: ${furniture.nameKo}`);
                // console.log(`📦 로드된 모델 정보:`, {
                //   childrenCount: gltfModel.children.length,
                //   position: gltfModel.position,
                //   rotation: gltfModel.rotation,
                //   scale: gltfModel.scale
                // });

                // 원본 모델과 footprint 크기 비교
                compareModelWithFootprint(gltfModel, furniture.footprint, furniture.nameKo);

                // 모델 크기를 footprint에 맞게 조정
                const adjustedModel = adjustModelToFootprint(gltfModel, furniture.footprint);
                // console.log(`🔧 크기 조정 완료:`, {
                //   originalChildren: gltfModel.children.length,
                //   adjustedChildren: adjustedModel.children.length
                // });
                setModel(adjustedModel);
                setIsLoading(false);
                return;
              } else {
                // console.warn(`⚠️ GLTF 모델이 null입니다: ${furniture.nameKo}`);
              }
            } catch (gltfError) {
              // console.warn(`⚠️ GLTF 모델 로드 실패, 폴백 모델 사용: ${furniture.nameKo}`);
              // console.warn(`❌ 오류 상세:`, gltfError);
              // console.warn(`📁 시도한 경로: ${furniture.modelPath}`);
            }
          } else {
            // console.warn(`⚠️ 모델 경로가 없습니다: ${furniture.nameKo}`);
          }
        }

        // GLTF 로드 실패 시 폴백 모델 생성
        // console.info(`폴백 모델 생성: ${furniture.nameKo}`);
        
        // 카테고리별 색상 선택 (더 현실적인 색상으로 개선)
        const getCategoryColor = (category: string, subcategory?: string) => {
          switch (category) {
            case 'living':
              if (subcategory === 'sofa') return 0x8B4513; // 갈색
              if (subcategory === 'table') return 0xD2691E; // 초콜릿색
              if (subcategory === 'chair') return 0x8B4513; // 갈색
              return 0x8B4513;
            case 'bedroom':
              if (subcategory === 'bed') return 0x8B4513; // 갈색
              if (subcategory === 'storage') return 0xD2691E; // 초콜릿색
              return 0x8B4513;
            case 'kitchen':
              return 0xD2691E; // 초콜릿색
            case 'office':
              return 0x696969; // 회색
            case 'storage':
              return 0xD2691E; // 초콜릿색
            case 'decorative':
              if (subcategory === 'clock') return 0xFFFFFF; // 흰색
              return 0xD2691E; // 초콜릿색
            case 'wall':
              return 0xF5F5DC; // 베이지 (벽 기본 색상)
            default:
              return 0x8B4513; // 기본 갈색
          }
        };
        
        // 벽이나 시계는 전용 모델 사용
        let fallbackModel;
        if (furniture.category === 'wall') {
          // console.log(`🏗️ 벽 모델 생성: ${furniture.nameKo}`);
          // 벽 텍스처 경로 사용 (이미 PNG 경로로 설정됨)
          const texturePath = furniture.modelPath || '/models/wall/wall_beige.png';
          // console.log(`🖼️ 벽 텍스처 경로: ${texturePath}`);

          fallbackModel = createWallModel(
            texturePath,
            furniture.footprint.width,
            furniture.footprint.height,
            furniture.footprint.depth
          );
        } else if (furniture.subcategory === 'clock') {
          // console.log(`🕐 시계 전용 모델 생성: ${furniture.nameKo}`);
          fallbackModel = createClockFallbackModel();
        } else {
          // console.log(`🪑 가구 모델 생성: ${furniture.nameKo} (${furniture.category}/${furniture.subcategory})`);
          // console.log(`📏 크기: ${furniture.footprint.width}x${furniture.footprint.height}x${furniture.footprint.depth}`);
          const color = getCategoryColor(furniture.category, furniture.subcategory);
          // console.log(`🎨 색상: 0x${color.toString(16)}`);
          
          fallbackModel = createFurnitureModel(
            furniture.footprint.width,
            furniture.footprint.height,
            furniture.footprint.depth,
            color
          );
          
          // console.log(`✅ 폴백 모델 생성 완료:`, fallbackModel);
        }
        setModel(fallbackModel);
        // console.log(`✅ 폴백 모델 설정 완료: ${furniture.nameKo}`);
        setIsLoading(false);
      } catch (error) {
        // console.error('Failed to load furniture model:', error);
        setLoadError(error instanceof Error ? error.message : 'Unknown error');

        const fallbackModel = createFallbackModel();
        setModel(fallbackModel);
        setIsLoading(false);
      }
    };

    loadFurnitureModel();

    // 컴포넌트 언마운트 시 모델 정리
    return () => {
      if (model) {
        disposeModel(model);
      }
    };
  }, [item.id]);

  // 모델 변경 시 이전 모델 정리
  useEffect(() => {
    return () => {
      if (model) {
        disposeModel(model);
      }
    };
  }, [model, disposeModel]);

  // 위치, 회전, 크기 동기화
  useEffect(() => {
    if (!meshRef.current || item.isLocked) return;

    try {
      const currentPos = meshRef.current.position;
      const currentRot = meshRef.current.rotation;
      const currentScale = meshRef.current.scale;

      const itemPosition = new Vector3(item.position.x, item.position.y, item.position.z);
      const itemRotation = new Euler(item.rotation.x, item.rotation.y, item.rotation.z);
      const itemScale = new Vector3(item.scale.x, item.scale.y, item.scale.z);

      const TOLERANCE = 0.0001;

      const needsPositionUpdate = !currentPos.equals(itemPosition) &&
        Math.abs(currentPos.distanceTo(itemPosition)) > TOLERANCE;
      const needsRotationUpdate = !currentRot.equals(itemRotation) &&
        (Math.abs(currentRot.x - itemRotation.x) > TOLERANCE ||
         Math.abs(currentRot.y - itemRotation.y) > TOLERANCE ||
         Math.abs(currentRot.z - itemRotation.z) > TOLERANCE);
      const needsScaleUpdate = !currentScale.equals(itemScale) &&
        Math.abs(currentScale.distanceTo(itemScale)) > TOLERANCE;

      if (needsPositionUpdate) {
        meshRef.current.position.copy(itemPosition);
      }
      if (needsRotationUpdate) {
        meshRef.current.rotation.copy(itemRotation);
      }
      if (needsScaleUpdate) {
        meshRef.current.scale.copy(itemScale);
      }
    } catch (error) {
      // console.warn('Position/Rotation/Scale sync failed:', error);
    }
  }, [item.id, item.isLocked, item.position, item.rotation, item.scale]);

  // userData에 식별자 설정: 캔버스 전역 터치에서 가구 여부 판별용
  useEffect(() => {
    if (meshRef.current) {
      try {
        (meshRef.current as any).userData = {
          ...(meshRef.current as any).userData,
          isFurniture: true,
          itemId: item.id,
        };
      } catch {}
    }
    if (model) {
      try {
        (model as any).userData = {
          ...(model as any).userData,
          isFurniture: true,
          itemId: item.id,
        };
      } catch {}
    }
  }, [model, item.id]);

  // 모델 분석 및 디버깅
  useEffect(() => {
    if (model) {
      // console.log(`🔍 모델 분석: ${item.id}, 자식 요소 수: ${model.children.length}`);

      // 모델의 바운딩 박스 확인
      // console.log(`📐 모델 바운딩 박스 확인됨`);
    }
  }, [model, item.id]);

  // 선택 상태에 따른 하이라이트 효과
  useFrame(() => {
    if (model) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach((material) => {
            // emissive가 없는 머티리얼은 건드리지 않음 (원본 색상 보존)
            if ((material as any).emissive) {
              if (isSelected) {
                // 선택된 상태: 하이라이트 효과 적용 (원본 색 저장 후 미세 가산)
                if (!originalEmissiveRef.current.has(material)) {
                  originalEmissiveRef.current.set(material, (material as any).emissive.clone());
                }
                (material as any).emissive.setHex(0x444444);
              } else {
                // 선택 해제: 저장된 원본이 있으면 복원, 없으면 변경하지 않음
                const originalEmissive = originalEmissiveRef.current.get(material);
                if (originalEmissive) {
                  (material as any).emissive.copy(originalEmissive);
                }
              }
            }
            // 벽 페이드: 유니폼 값만 업데이트, 플래그는 그룹 대상으로 일괄 적용
          });
        }
      });
    }
  });

  // 그룹 단위로 페이드 플래그 적용 (유니폼은 벽에만 적용)
  useFrame(() => {
    if (item.mount?.type !== 'wall') return;
    if (!meshRef.current) return;
    const fade = currentWallFade;
    applyFadeFlagsToObject(meshRef.current, fade);
  });

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <group
        name={item.id}
        ref={meshRef}
        position={safePosition(item.position)}
        rotation={safeRotation(item.rotation)}
        scale={safeScale(item.scale)}
        // 벽 부착 아이템은 편집 모드와 관계없이 currentWallFade 값에 따라 페이드 적용
        visible={item.mount?.type !== 'wall' ? true : currentWallFade > 0.02}
      >
        <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]} userData={{ skipWallFade: true }}>
          <meshBasicMaterial color="#cccccc" transparent opacity={0.5} />
        </Box>
      </group>
    );
  }

  // 에러 상태 표시
  if (loadError && !model) {
    return (
      <group
        name={item.id}
        ref={meshRef}
        position={safePosition(item.position)}
        rotation={safeRotation(item.rotation)}
        scale={safeScale(item.scale)}
        // 벽 부착 아이템은 편집 모드와 관계없이 currentWallFade 값에 따라 페이드 적용
        visible={item.mount?.type !== 'wall' ? true : currentWallFade > 0.02}
      >
        <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]} userData={{ skipWallFade: true }}>
          <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
        </Box>
      </group>
    );
  }

  return (
    <>
      {/* 실제 오브젝트 그룹 - 드래그 앤 드롭 이벤트 활성화 */}
      <group
        name={item.id}
        ref={meshRef}
        position={safePosition(item.position)}
        rotation={safeRotation(item.rotation)}
        scale={safeScale(item.scale)}
        // 벽 부착 아이템은 편집 모드와 관계없이 currentWallFade 값에 따라 페이드 적용
        visible={item.mount?.type !== 'wall' ? true : currentWallFade > 0.02}
        onClick={handleClickEvent}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={() => {
            // console.log('🎯 onLostPointerCapture 호출:', {
            //   isDragging,
            //   itemId: item.id,
            //   timestamp: new Date().toISOString()
            // });
          if (isDragging) {
            // console.log('🎯 포인터 캡처 손실 - handleDragEnd 호출');
            try {
              handleDragEnd({ stopPropagation: () => {} });
            } catch (error) {
              // console.log('🎯 handleDragEnd 오류:', error);
              setDragging(false);
            }
          }
        }}
        onPointerOver={handlePointerEnter}
        onPointerOut={handlePointerLeave}
        onWheel={(_e) => {/* e.stopPropagation(); */}}
        userData={{ isFurniture: true, itemId: item.id }}
      >
        {/* 3D 모델 */}
        {model && (
          <>
            {/* console.log(`🎨 모델 렌더링: ${item.id}, 컴포넌트 수: ${model.children.length}`) */}
            <primitive
              ref={(ref: THREE.Group | null) => {
                if (isSelected && ref) {
                  setModelRef(ref);
                }
              }}
              object={model}
              onClick={(e: any) => { try { e.stopPropagation?.(); } catch {}; handleClickEvent(e); }}
              onPointerDown={(e: any) => { handlePointerDown(e); }}
              onPointerMove={(e: any) => { handlePointerMove(e); }}
              onPointerUp={(e: any) => { handlePointerUp(e); }}
              onPointerCancel={(e: any) => { handlePointerCancel(e); }}
              onPointerOver={(_e: any) => { /* noop */ }}
              onPointerOut={(_e: any) => { /* noop */ }}
              onWheel={(_e: any) => { /* noop */ }}
            />
          </>
        )}
        
        {/* 폴백 모델이 없을 때 기본 박스 표시 */}
        {!model && !isLoading && !loadError && (
          <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]} userData={{ skipWallFade: true }}>
            <meshPhongMaterial color="#8B4513" />
          </Box>
        )}

        {/* 드래그/선택 히트박스 확장 - 조건부 활성화 */}
        {isEditMode && !item.isLocked && (isSelected || isDragging) && (
          <Box
            args={[item.footprint.width + 0.6, item.footprint.height + 0.6, item.footprint.depth + 0.6]}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            userData={{ skipWallFade: true }}
          >
            {/* 완전 투명 히트박스가 깊이 버퍼에 쓰여 모델을 가리지 않도록 설정 */}
            <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} colorWrite={false} />
          </Box>
        )}

        {/* 드래그 중일 때 시각적 피드백 */}
        {isDragging && (
          <>
            {/* 드래그 중 그림자 */}
            <Box args={[item.footprint.width, 0.01, item.footprint.depth]} position={[0, -0.01, 0]}>
              <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} depthTest={false} />
            </Box>
            {/* 드래그 중 하이라이트 - 충돌 시 빨간색, 정상 시 파란색 */}
            <Box args={[item.footprint.width + 0.2, item.footprint.height + 0.2, item.footprint.depth + 0.2]}>
              <meshBasicMaterial
                color={isColliding ? "#ef4444" : "#3b82f6"}
                transparent
                opacity={item.mount?.type === 'wall' ? 0.15 : 0.25}
                depthWrite={false}
                depthTest={false}
                toneMapped={false}
              />
            </Box>
            {/* 충돌 시 추가 경고 표시 */}
            {isColliding && (
              <Box args={[item.footprint.width + 0.4, item.footprint.height + 0.4, item.footprint.depth + 0.4]}>
                <meshBasicMaterial 
                  color="#ef4444" 
                  transparent 
                  opacity={item.mount?.type === 'wall' ? 0.08 : 0.18} 
                  depthWrite={false} 
                  depthTest={false} 
                />
              </Box>
            )}
          </>
        )}

        {/* 호버 효과 */}
        {isHovered && !isDragging && (
          <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
            <meshBasicMaterial 
              color="#ffff00" 
              transparent 
              opacity={item.mount?.type === 'wall' ? 0.08 : 0.18} 
              depthWrite={false} 
              depthTest={false} 
              toneMapped={false} 
            />
          </Box>
        )}

        {/* 선택 표시기 - 개선된 버전 */}
        {isSelected && (
          <Box
            args={[item.footprint.width + 0.1, item.footprint.height + 0.1, item.footprint.depth + 0.1]}
          >
            <meshBasicMaterial 
              color="#3b82f6" 
              transparent 
              opacity={item.mount?.type === 'wall' ? 0.12 : 0.22} 
              depthWrite={false} 
              depthTest={false} 
              toneMapped={false} 
            />
          </Box>
        )}

        {/* 고정 표시기 */}
        {item.isLocked && (
          <Box args={[item.footprint.width + 0.2, item.footprint.height + 0.2, item.footprint.depth + 0.2]}>
            <meshBasicMaterial 
              color="#ffd700" 
              transparent 
              opacity={item.mount?.type === 'wall' ? 0.12 : 0.22} 
              depthWrite={false} 
              depthTest={false} 
              toneMapped={false} 
            />
          </Box>
        )}
      </group>
    </>
  );
});
