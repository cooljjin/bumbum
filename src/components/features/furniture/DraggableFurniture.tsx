import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import { Vector3, Euler, Group, Raycaster, Plane, Vector2 } from 'three';
import { useEditorStore } from '../../../store/editorStore';
import { PlacedItem } from '../../../types/editor';
import { createFallbackModel, createFurnitureModel, createClockFallbackModel, createWallModel, loadModel, compareModelWithFootprint } from '../../../utils/modelLoader';
import { getFurnitureFromPlacedItem } from '../../../data/furnitureCatalog';
import { safePosition, safeRotation, safeScale } from '../../../utils/safePosition';
import { constrainFurnitureToRoom } from '../../../utils/roomBoundary';
import { checkDragCollision, moveToSafePosition } from '../../../utils/collisionDetection';
import * as THREE from 'three';

/**
 * 모델을 footprint 크기에 맞게 조정하는 함수
 * 벽 통과 방지를 위해 정확한 크기 매칭 구현
 */
const adjustModelToFootprint = (model: THREE.Group, footprint: { width: number; height: number; depth: number }): THREE.Group => {
  // 모델의 바운딩 박스 계산
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  
  // console.log(`📐 원본 모델 크기: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
  // console.log(`📏 목표 footprint: ${footprint.width} x ${footprint.height} x ${footprint.depth}`);
  // console.log(`🎯 원본 모델 중심점: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
  
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
  const finalCenter = finalBox.getCenter(new THREE.Vector3());
  
  // console.log(`✅ 최종 모델 크기: ${finalSize.x.toFixed(2)} x ${finalSize.y.toFixed(2)} x ${finalSize.z.toFixed(2)}`);
  // console.log(`✅ 최종 모델 중심점: (${finalCenter.x.toFixed(2)}, ${finalCenter.y.toFixed(2)}, ${finalCenter.z.toFixed(2)})`);
  
  // 크기 검증 (허용 오차 1cm)
  const tolerance = 0.01;
  const sizeMatches = Math.abs(finalSize.x - footprint.width) < tolerance &&
                     Math.abs(finalSize.y - footprint.height) < tolerance &&
                     Math.abs(finalSize.z - footprint.depth) < tolerance;
  
  if (!sizeMatches) {
    console.warn(`⚠️ 크기 매칭 실패! 목표: ${footprint.width}x${footprint.height}x${footprint.depth}, 실제: ${finalSize.x.toFixed(2)}x${finalSize.y.toFixed(2)}x${finalSize.z.toFixed(2)}`);
  } else {
    console.log(`✅ 크기 매칭 성공!`);
  }
  
  return adjustedModel;
};

interface DraggableFurnitureProps {
  item: PlacedItem;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<PlacedItem>) => void;
}

export const DraggableFurniture: React.FC<DraggableFurnitureProps> = React.memo(({
  item,
  isSelected,
  isEditMode,
  onSelect,
  onUpdate
}) => {
  // console.log(`🚀 DraggableFurniture 렌더링 - item.id: ${item.id}, item.name: ${item.name}`);
  // console.log('[DraggableFurniture] mounted', item?.id);

  // 강제로 모델 로딩 실행 (useEffect 대신)
  React.useLayoutEffect(() => {
    // console.log(`🔥 useLayoutEffect 강제 실행 - item.id: ${item.id}`);

    const loadFurnitureModel = async () => {
      try {
        // console.log(`🚀 loadFurnitureModel 시작 - item.id: ${item.id}`);
        setIsLoading(true);
        setLoadError(null);

        const furniture = getFurnitureFromPlacedItem(item);
        // console.log(`🔍 furniture 정보:`, furniture);

        if (!furniture) {
          console.warn('가구 정보를 찾을 수 없어 기본 박스로 표시합니다:', item);
          setLoadError('가구 정보를 찾을 수 없습니다');
          setIsLoading(false);
          return;
        }

        // console.log(`🎯 가구 모델 로딩 시작: ${furniture.nameKo} (ID: ${item.id})`);
        // console.log(`📁 모델 경로: ${furniture.modelPath}`);
        // console.log(`📏 크기: ${furniture.footprint.width}x${furniture.footprint.height}x${furniture.footprint.depth}`);

        // 벽 카테고리는 GLB 로드 시도하지 않고 바로 폴백 모델 생성
        if (furniture.category === 'wall') {
          console.log(`🏗️ 벽 카테고리 감지, GLB 로드 생략 및 폴백 모델 생성: ${furniture.nameKo}`);
          // 바로 폴백 모델 생성으로 넘어가기
        } else {
          // 벽이 아닌 경우에만 GLTF 로드 시도
          if (furniture.modelPath) {
            // console.log(`🔄 GLTF 모델 로딩 시작: ${furniture.modelPath}`);
            try {
              const gltfModel = await loadModel(furniture.modelPath, {
                useCache: false,
                priority: 'normal'
              });

              if (gltfModel) {
                console.info(`✅ GLTF 모델 로드 성공: ${furniture.nameKo}`);
                console.log(`📦 로드된 모델 정보:`, {
                  childrenCount: gltfModel.children.length,
                  position: gltfModel.position,
                  rotation: gltfModel.rotation,
                  scale: gltfModel.scale
                });

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
                return; // 성공적으로 로드했으므로 여기서 종료
              } else {
                throw new Error('GLTF 모델 로드 실패');
              }
            } catch (gltfError) {
              console.warn('GLTF 모델 로드 실패, 폴백 모델 사용:', gltfError);
              // GLTF 로드 실패 시 폴백 모델 생성으로 넘어감
            }
          } else {
            // 모델 경로가 없는 경우 폴백 모델 생성으로 넘어감
          }
        }

        // GLTF 로드 실패 또는 벽 카테고리인 경우 폴백 모델 생성
        console.info(`폴백 모델 생성: ${furniture.nameKo}`);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to create furniture model:', error);
        setLoadError(error instanceof Error ? error.message : 'Unknown error');

        // 에러 발생 시 폴백 모델 사용
        const furniture = getFurnitureFromPlacedItem(item);
        if (furniture) {
          const fallbackModel = createFallbackModel();
          setModel(fallbackModel);
        }
        setIsLoading(false);
      }
    };

    loadFurnitureModel();
  }, [item.id]);

  const meshRef = useRef<Group>(null);
  const [model, setModel] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const originalEmissiveRef = useRef<Map<THREE.Material, THREE.Color>>(new Map());

  // 🖱️ 드래그 앤 드롭 관련 상태 변수들
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<Vector3 | null>(null);
  const [dragStartMousePosition, setDragStartMousePosition] = useState<Vector2 | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isColliding, setIsColliding] = useState(false);
  const dragIntentRef = useRef<{ active: boolean; startX: number; startY: number } | null>(null);
  const fromPointerDownRef = useRef(false);
  const suppressClickRef = useRef(false);

  // 🎯 드래그 앤 드롭 관련 ref들
  const raycaster = useRef<Raycaster>(new Raycaster());
  const dragPlane = useRef<Plane>(new Plane(new Vector3(0, 1, 0), 0));

  const { grid, setDragging, placedItems } = useEditorStore();
  const { camera, gl } = useThree();

  // 안전한 preventDefault 래퍼 (r3f PointerEvent에는 preventDefault가 없을 수 있음)
  const safePreventDefault = (ev: any) => {
    try {
      if (typeof ev?.preventDefault === 'function') ev.preventDefault();
      else if (typeof ev?.nativeEvent?.preventDefault === 'function') ev.nativeEvent.preventDefault();
    } catch {}
  };

  // 3D 모델 메모리 정리 함수
  const disposeModel = useCallback((modelToDispose: Group | null) => {
    if (!modelToDispose) return;

    try {
      // 모든 자식 객체들을 재귀적으로 dispose
      const disposeObject = (obj: any) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat: any) => {
              if (mat.map) mat.map.dispose();
              if (mat.normalMap) mat.normalMap.dispose();
              if (mat.aoMap) mat.aoMap.dispose();
              if (mat.emissiveMap) mat.emissiveMap.dispose();
              if (mat.specularMap) mat.specularMap.dispose();
              mat.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            if (obj.material.normalMap) obj.material.normalMap.dispose();
            if (obj.material.aoMap) obj.material.aoMap.dispose();
            if (obj.material.emissiveMap) obj.material.emissiveMap.dispose();
            if (obj.material.specularMap) obj.material.specularMap.dispose();
            obj.material.dispose();
          }
        }

        // 자식 객체들도 재귀적으로 처리
        if (obj.children && obj.children.length > 0) {
          obj.children.forEach((child: any) => disposeObject(child));
        }
      };

      disposeObject(modelToDispose);
      console.log('🧹 3D 모델 메모리 정리 완료:', item.name);
    } catch (error) {
      console.warn('3D 모델 dispose 중 오류:', error);
    }
  }, [item.name]);

  // 🖱️ 드래그 시작 핸들러 (간소화된 버전)
  const handleDragStart = useCallback((event: any) => {
    console.log('🎯 드래그 시작 시도 (간소화 버전):', {
      isEditMode,
      isLocked: item.isLocked,
      itemId: item.id,
      itemName: item.name
    });

    if (!isEditMode || item.isLocked) {
      console.log('❌ 드래그 시작 실패: 편집 모드가 아니거나 잠긴 객체');
      return;
    }

    // 즉시 드래그 모드로 전환
    console.log('🔄 드래그 모드 즉시 활성화');
    setIsDragging(true);
    setDragging(true);

    // 가구 선택
    onSelect(item.id);
    setIsHovered(false);

    // 드래그 시작 위치 저장
    setDragStartPosition(item.position.clone());

    // 드래그 평면 설정
    dragPlane.current.set(new Vector3(0, 1, 0), -item.position.y);

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

    console.log('✅ 드래그 시작 완료:', { clientX, clientY, mouseX, mouseY });

  }, [isEditMode, item.isLocked, item.id, item.position, onSelect, gl, setDragging]);

  // 🔄 드래그 중 핸들러 (마우스 및 터치 지원)
  const handleDrag = useCallback((event: any) => {
    // 드래그 의도가 없으면 무시
    if (!dragIntentRef.current?.active) return;

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
      // 터치와 마우스에 따라 다른 임계치 적용
      const isTouch = event.touches || event.pointerType === 'touch';
      const threshold = isTouch ? 10 : 6; // 터치: 10px, 마우스: 6px

      console.log('🎯 드래그 거리 체크:', { dist, threshold, isTouch, isDragging });

      if (dist > threshold) {
        console.log('✅ 실제 드래그 시작! (카메라는 이미 고정됨)');
        setIsDragging(true);
        suppressClickRef.current = true; // 실제 드래그 시작 시에만 클릭 억제
        console.log('🔒 클릭 억제 활성화 (드래그 중)');
      } else {
        return; // 아직 드래그 시작 전이면 무시
      }
    }

    // 실제 드래그 중이 아니면 무시
    if (!isDragging || !dragStartPosition || !dragStartMousePosition) return;

    // 드래그 중에는 터치 이벤트의 기본 동작 방지 (스크롤 등)
    if (event?.touches || event?.pointerType === 'touch') {
      safePreventDefault(event);
    }

    const rect = gl?.domElement?.getBoundingClientRect?.();
    const width = rect?.width ?? window.innerWidth;
    const height = rect?.height ?? window.innerHeight;
    const offsetX = rect ? clientX - rect.left : clientX;
    const offsetY = rect ? clientY - rect.top : clientY;
    const mouseX = (offsetX / width) * 2 - 1;
    const mouseY = -(offsetY / height) * 2 + 1;

    // 레이캐스터로 3D 공간의 위치 계산
    raycaster.current.setFromCamera(new Vector2(mouseX, mouseY), camera);

    // 드래그 평면과의 교차점 계산
    const intersectionPoint = new Vector3();
    raycaster.current.ray.intersectPlane(dragPlane.current, intersectionPoint);

    // 그리드 스냅 적용
    const newPosition = intersectionPoint.clone();

    if (grid.enabled && grid.divisions > 0) {
      const gridSize = grid.size / grid.divisions;
      newPosition.x = Math.round(newPosition.x / gridSize) * gridSize;
      newPosition.z = Math.round(newPosition.z / gridSize) * gridSize;
    }

    // Y 위치는 원래 높이 유지
    newPosition.y = dragStartPosition.y;

    // 1차 그리드 스냅 후, 즉시 룸 경계로 클램핑하여 시각적 침투 방지
    const constrained = constrainFurnitureToRoom({ ...item, position: newPosition } as PlacedItem);
    
    // 드래그 중 충돌 감지
    const otherItems = placedItems.filter(placedItem => placedItem.id !== item.id);
    const collisionCheck = checkDragCollision(constrained, otherItems, constrained.position);
    
    // 충돌 상태 업데이트 (시각적 피드백용)
    setIsColliding(collisionCheck.hasCollision);
    
    if (collisionCheck.hasCollision) {
      console.log(`🚨 드래그 중 충돌 감지: ${item.name || item.id}이(가) ${collisionCheck.collidingItems.length}개의 가구와 충돌`);
    }
    
    onUpdate(item.id, { position: constrained.position });
    console.log('🖱️ 드래그 중 위치 업데이트:', newPosition, event.touches ? '(터치)' : '(마우스)', collisionCheck.hasCollision ? '(충돌!)' : '');
  }, [isDragging, dragStartPosition, dragStartMousePosition, camera, grid, item.id, onUpdate, placedItems]);

  // ✅ 드래그 종료 핸들러
  const handleDragEnd = useCallback((_event: any) => {
    // 드래그 의도가 있었던 경우 모두 처리 (실제 드래그 여부와 관계없이)
    const hadDragIntent = dragIntentRef.current?.active;
    
    if (!isDragging && !hadDragIntent) return;

    // event.stopPropagation(); // 이벤트 전파 허용

    console.log('🎯 DraggableFurniture 드래그 종료 시작:', {
      itemId: item.id,
      itemName: item.name,
      wasDragging: isDragging,
      hadDragIntent,
      timestamp: new Date().toISOString()
    });

    // 로컬 상태와 전역 상태를 동시에 업데이트
    setIsDragging(false);
    setDragStartPosition(null);
    setDragStartMousePosition(null);
    setIsColliding(false); // 충돌 상태 초기화
    dragIntentRef.current = null;
    fromPointerDownRef.current = false;
    
    // 드래그 종료 시 가구 선택 및 호버 효과 복원
    if (isDragging) {
      // 드래그가 완료되면 가구를 선택 상태로 만들기
      console.log('🎯 드래그 완료 - 가구 선택:', item.id);
      onSelect(item.id);
      setIsHovered(true);
    } else if (isSelected) {
      setIsHovered(true);
    }

    // 전역 드래그 상태 업데이트 (드래그 의도가 있었던 경우 카메라 시점 해제)
    if (hadDragIntent || isDragging) {
      console.log('🔓 드래그 종료 - 카메라 시점 해제');
      setDragging(false);
    }

    // 드래그 종료 시 충돌 검사 및 자동 이동
    if (isDragging) {
      const otherItems = placedItems.filter(placedItem => placedItem.id !== item.id);
      const collisionCheck = checkDragCollision(item, otherItems, item.position);
      
      if (collisionCheck.hasCollision) {
        console.log(`🚨 드래그 종료 시 충돌 감지: ${item.name || item.id}이(가) ${collisionCheck.collidingItems.length}개의 가구와 충돌`);
        console.log(`   충돌하는 가구들: ${collisionCheck.collidingItems.map(collidingItem => collidingItem.name || collidingItem.id).join(', ')}`);
        
        // 충돌을 피할 수 있는 안전한 위치로 자동 이동
        const safeItem = moveToSafePosition(item, otherItems);
        
        if (safeItem.position !== item.position) {
          console.log(`✅ 충돌 해결: ${item.name || item.id}을(를) 안전한 위치로 자동 이동`);
          console.log(`   원래 위치: (${item.position.x.toFixed(2)}, ${item.position.y.toFixed(2)}, ${item.position.z.toFixed(2)})`);
          console.log(`   새 위치: (${safeItem.position.x.toFixed(2)}, ${safeItem.position.y.toFixed(2)}, ${safeItem.position.z.toFixed(2)})`);
          onUpdate(item.id, { position: safeItem.position });
        }
      }
    }

    // 드래그 종료 즉시 클릭 억제 플래그 해제
    suppressClickRef.current = false;
    console.log('🔓 클릭 억제 해제 (드래그 종료)');
    
    console.log('✅ DraggableFurniture 드래그 종료 완료:', {
      itemId: item.id,
      itemName: item.name,
      localDragging: false,
      globalDragging: false
    });
  }, [isDragging, item, setDragging, placedItems, onUpdate]);

  // 🖱️ 마우스 이벤트 핸들러
  // 포인터 다운(마우스/터치 공통)
  const handlePointerDown = useCallback((event: any) => {
    console.log('🖱️ 포인터 다운 이벤트 - 시작:', {
      target: event.target?.tagName || 'unknown',
      currentTarget: event.currentTarget?.tagName || 'unknown',
      pointerType: event.pointerType,
      button: event.button,
      touches: !!event.touches,
      itemId: item.id,
      itemName: item.name,
      isEditMode,
      isLocked: item.isLocked,
      eventType: event.type,
      clientX: event.clientX,
      clientY: event.clientY,
      bubbles: event.bubbles,
      cancelable: event.cancelable
    });
    
    const isTouch = event.pointerType === 'touch' || !!event.touches;
    const isLeft = event.button === 0 || event.button === undefined;

    console.log('🎯 포인터 다운 조건 체크:', {
      isTouch,
      isLeft,
      pointerType: event.pointerType,
      button: event.button,
      touches: !!event.touches
    });

    if (isTouch || isLeft) {
      console.log('✅ 드래그 조건 만족 - handleDragStart 호출');
      try {
        console.log('🎯 포인터 캡처 시도:', {
          pointerId: event.pointerId,
          currentTarget: !!event.currentTarget,
          setPointerCapture: !!event.currentTarget?.setPointerCapture
        });
        event.currentTarget?.setPointerCapture?.(event.pointerId);
        console.log('✅ 포인터 캡처 성공');
      } catch (e) {
        console.log('❌ 포인터 캡처 실패:', e);
      }

      // handleDragStart 직접 호출
      console.log('🎯 handleDragStart 호출 시도...');
      handleDragStart(event);
      console.log('🎯 handleDragStart 호출 완료');
    } else {
      console.log('❌ 포인터 다운 무시: 터치나 왼쪽 버튼이 아님');
    }
  }, [handleDragStart, item.id]);

  const handlePointerMove = useCallback((event: any) => {
    console.log('🖱️ 포인터 무브 이벤트:', { 
      isDragging, 
      dragIntentActive: dragIntentRef.current?.active,
      itemId: item.id 
    });
    
    if (isDragging) {
      if (event?.touches || event?.type === 'touchmove' || event?.nativeEvent?.touches) {
        safePreventDefault(event);
      }
      handleDrag(event);
    } else if (dragIntentRef.current?.active) {
      handleDrag(event);
    }
  }, [isDragging, handleDrag, item.id]);

  const handlePointerUp = useCallback((event: any) => {
    console.log('🎯 DraggableFurniture 포인터 업 이벤트:', {
      isDragging,
      itemId: item.id,
      eventType: event.type,
      button: event.button,
      timestamp: new Date().toISOString()
    });
    if (isDragging) {
      console.log('🎯 드래그 중이므로 handleDragEnd 호출');
      handleDragEnd(event);
    } else {
      console.log('🎯 드래그 중이 아니므로 handleDragEnd 호출하지 않음');
    }
  }, [isDragging, handleDragEnd, item.id]);

  const handlePointerCancel = useCallback((event: any) => {
    if (isDragging) {
      handleDragEnd(event);
    }
  }, [isDragging, handleDragEnd]);

  // 🎯 호버 효과 - 선택된 상태에서만 호버 표시
  const handlePointerEnter = useCallback(() => {
    if (isEditMode && !item.isLocked && isSelected) {
      setIsHovered(true);
    }
  }, [isEditMode, item.isLocked, isSelected]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // 전역 마우스 및 터치 이벤트 리스너
  useEffect((): (() => void) | void => {
    if (isDragging) {
      console.log('🎯 전역 이벤트 리스너 등록:', item.id);
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
        console.log('🧹 전역 이벤트 리스너 정리:', item.id);
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

      console.log('🎯 DOM 포인터 다운 감지:', {
        target: (event.target as Element)?.tagName,
        clientX: event.clientX,
        clientY: event.clientY,
        pointerType: event.pointerType,
        button: event.button
      });

      // 가구 위에서의 이벤트인지 확인 (간단한 히트 테스트)
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // 레이캐스터로 가구 히트 테스트
      raycaster.current.setFromCamera(new Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.current.intersectObject(meshRef.current, true);

      if (intersects.length > 0) {
        console.log('🎯 가구 히트 감지! 드래그 시작 시도');

        // handleDragStart 직접 호출 (더 간단한 방법)
        console.log('🎯 handleDragStart 직접 호출 시도');

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

        // handleDragStart 직접 호출 (더 간단하게)
        console.log('🎯 handleDragStart 호출 시도...');
        handleDragStart(virtualEvent);
        console.log('✅ handleDragStart 호출 완료');
      }
    };

    console.log('🎯 DOM 이벤트 리스너 등록:', item.id);
    window.addEventListener('pointerdown', handleDOMPointerDown, { passive: false });

    return () => {
      console.log('🧹 DOM 이벤트 리스너 정리:', item.id);
      window.removeEventListener('pointerdown', handleDOMPointerDown);
    };
  }, [isEditMode, item.isLocked, camera, gl, handlePointerDown]);

  // 드래그 상태 변화 감지 - 드래그가 끝나면 가구 선택
  useEffect(() => {
    console.log('🎯 드래그 상태 변화 감지:', {
      isDragging,
      dragIntentActive: dragIntentRef.current?.active,
      itemId: item.id
    });
    
    // 드래그가 끝났고, 드래그 의도가 있었던 경우 가구 선택
    if (!isDragging && dragIntentRef.current?.active) {
      console.log('🎯 드래그 완료 감지 - 가구 선택:', item.id);
      onSelect(item.id);
      dragIntentRef.current = null;
    }
    // 드래그가 끝났지만 드래그 의도가 없는 경우도 가구 선택 (웹 환경 대응)
    else if (!isDragging && dragIntentRef.current === null) {
      console.log('🎯 드래그 완료 감지 (웹 환경) - 가구 선택:', item.id);
      onSelect(item.id);
    }
  }, [isDragging, item.id, onSelect]);

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
    };
  }, [handlePointerMove, handlePointerUp, handlePointerCancel]);

  // 클릭 이벤트 처리 - 개선된 버전
  const handleClick = useCallback((event: any) => {
    console.log('🎯 handleClick 호출:', {
      itemId: item.id,
      itemName: item.name,
      isDragging,
      isLocked: item.isLocked,
      isEditMode,
      isSelected,
      suppressClick: suppressClickRef.current,
      timestamp: new Date().toISOString()
    });

    // 드래그 중이거나 클릭이 억제된 상태라면 무시
    if (isDragging || suppressClickRef.current) {
      console.log('❌ 클릭 무시됨 (드래그 중 또는 억제 상태):', {
        isDragging,
        suppressClick: suppressClickRef.current
      });
      return;
    }

    // 고정된 객체는 선택할 수 없음
    if (item.isLocked) {
      console.log('❌ 고정된 객체 선택 불가:', item.id);
      return;
    }

    // 가구 클릭 시간 기록 (빈 공간 클릭 판별용)
    if (typeof window !== 'undefined') {
      (window as any).lastFurnitureClickTime = Date.now();
    }

    // 이벤트 전파는 허용하되, 가구 선택은 지연 처리
    console.log(`✅ 가구 선택 처리: ${item.id} (현재 선택됨: ${isSelected})`);

    // 선택 처리 - 약간의 지연을 주어 이벤트 순서 보장
    setTimeout(() => {
      onSelect(item.id);
      console.log(`✅ 가구 선택 완료: ${item.id}`);
    }, 10);

    // 선택 시 호버 효과 활성화
    if (isEditMode && !item.isLocked) {
      setIsHovered(true);
    }
  }, [isDragging, item.id, item.isLocked, isEditMode, isSelected, onSelect]);

  // 모델 로딩 - 강제 실행
  useEffect(() => {
    console.log(`🔄 useEffect 실행됨 - item.id: ${item.id}, item.name: ${item.name}`);
    console.log(`🔄 useEffect dependency 체크:`, { 
      itemId: item.id, 
      itemName: item.name, 
      itemModelPath: item.modelPath 
    });
    
    const loadFurnitureModel = async () => {
      try {
        console.log(`🚀 loadFurnitureModel 시작 - item.id: ${item.id}`);
        setIsLoading(true);
        setLoadError(null);

        const furniture = getFurnitureFromPlacedItem(item);
        console.log(`🔍 furniture 정보:`, furniture);
        
        if (!furniture) {
          console.warn('가구 정보를 찾을 수 없어 기본 박스로 표시합니다:', item);
          setLoadError('가구 정보를 찾을 수 없습니다');
          setIsLoading(false);
          return;
        }

        console.log(`🎯 가구 모델 로딩 시작: ${furniture.nameKo} (ID: ${item.id})`);
        console.log(`📁 모델 경로: ${furniture.modelPath}`);
        console.log(`📏 크기: ${furniture.footprint.width}x${furniture.footprint.height}x${furniture.footprint.depth}`);

        // 벽 카테고리는 GLB 로드 시도하지 않고 바로 폴백 모델 생성
        if (furniture.category === 'wall') {
          console.log(`🏗️ 벽 카테고리 감지, GLB 로드 생략 및 폴백 모델 생성: ${furniture.nameKo}`);
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
                console.info(`✅ GLTF 모델 로드 성공: ${furniture.nameKo}`);
                console.log(`📦 로드된 모델 정보:`, {
                  childrenCount: gltfModel.children.length,
                  position: gltfModel.position,
                  rotation: gltfModel.rotation,
                  scale: gltfModel.scale
                });

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
                console.warn(`⚠️ GLTF 모델이 null입니다: ${furniture.nameKo}`);
              }
            } catch (gltfError) {
              console.warn(`⚠️ GLTF 모델 로드 실패, 폴백 모델 사용: ${furniture.nameKo}`);
              console.warn(`❌ 오류 상세:`, gltfError);
              console.warn(`📁 시도한 경로: ${furniture.modelPath}`);
            }
          } else {
            console.warn(`⚠️ 모델 경로가 없습니다: ${furniture.nameKo}`);
          }
        }

        // GLTF 로드 실패 시 폴백 모델 생성
        console.info(`폴백 모델 생성: ${furniture.nameKo}`);
        
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
          console.log(`🏗️ 벽 모델 생성: ${furniture.nameKo}`);
          // 벽 텍스처 경로 사용 (이미 PNG 경로로 설정됨)
          const texturePath = furniture.modelPath;
          console.log(`🖼️ 벽 텍스처 경로: ${texturePath}`);

          fallbackModel = createWallModel(
            texturePath,
            furniture.footprint.width,
            furniture.footprint.height,
            furniture.footprint.depth
          );
        } else if (furniture.subcategory === 'clock') {
          console.log(`🕐 시계 전용 모델 생성: ${furniture.nameKo}`);
          fallbackModel = createClockFallbackModel();
        } else {
          console.log(`🪑 가구 모델 생성: ${furniture.nameKo} (${furniture.category}/${furniture.subcategory})`);
          console.log(`📏 크기: ${furniture.footprint.width}x${furniture.footprint.height}x${furniture.footprint.depth}`);
          const color = getCategoryColor(furniture.category, furniture.subcategory);
          console.log(`🎨 색상: 0x${color.toString(16)}`);
          
          fallbackModel = createFurnitureModel(
            furniture.footprint.width,
            furniture.footprint.height,
            furniture.footprint.depth,
            color
          );
          
          console.log(`✅ 폴백 모델 생성 완료:`, fallbackModel);
        }
        setModel(fallbackModel);
        console.log(`✅ 폴백 모델 설정 완료: ${furniture.nameKo}`);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load furniture model:', error);
        setLoadError(error instanceof Error ? error.message : 'Unknown error');

        const furniture = getFurnitureFromPlacedItem(item);
        if (furniture) {
          const fallbackModel = createFallbackModel();
          setModel(fallbackModel);
        }
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
      console.warn('Position/Rotation/Scale sync failed:', error);
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
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      // console.log(`📐 모델 크기: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
      // console.log(`🎯 모델 중심: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
    }
  }, [model, item.id]);

  // 선택 상태에 따른 하이라이트 효과
  useFrame(() => {
    if (model) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach((material) => {
            if (material.emissive) {
              if (isSelected) {
                // 선택된 상태: 하이라이트 효과 적용
                if (!originalEmissiveRef.current.has(material)) {
                  // 원본 emissive 색상 저장
                  originalEmissiveRef.current.set(material, material.emissive.clone());
                }
                material.emissive.setHex(0x444444);
              } else {
                // 선택 해제된 상태: 원본 색상으로 복원
                const originalEmissive = originalEmissiveRef.current.get(material);
                if (originalEmissive) {
                  material.emissive.copy(originalEmissive);
                } else {
                  // 원본 색상이 저장되지 않은 경우 검은색으로 설정
                  material.emissive.setHex(0x000000);
                }
              }
            }
          });
        }
      });
    }
  });

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <group
        ref={meshRef}
        position={safePosition(item.position)}
        rotation={safeRotation(item.rotation)}
        scale={safeScale(item.scale)}
      >
        <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
          <meshBasicMaterial color="#cccccc" transparent opacity={0.5} />
        </Box>
      </group>
    );
  }

  // 에러 상태 표시
  if (loadError && !model) {
    return (
      <group
        ref={meshRef}
        position={safePosition(item.position)}
        rotation={safeRotation(item.rotation)}
        scale={safeScale(item.scale)}
      >
        <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
          <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
        </Box>
      </group>
    );
  }

  return (
    <>
      {/* 실제 오브젝트 그룹 - 드래그 앤 드롭 이벤트 활성화 */}
      <group
        ref={meshRef}
        position={safePosition(item.position)}
        rotation={safeRotation(item.rotation)}
        scale={safeScale(item.scale)}
        onClick={handleClick}
        onPointerDown={undefined}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={() => {
          console.log('🎯 onLostPointerCapture 호출:', {
            isDragging,
            itemId: item.id,
            timestamp: new Date().toISOString()
          });
          if (isDragging) {
            console.log('🎯 포인터 캡처 손실 - handleDragEnd 호출');
            try {
              handleDragEnd({ stopPropagation: () => {} });
            } catch (error) {
              console.log('🎯 handleDragEnd 오류:', error);
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
              object={model}
              onClick={(e: any) => { /* e.stopPropagation(); */ handleClick(e); }}
              onPointerDown={(e: any) => { /* e.stopPropagation(); */ handlePointerDown(e); }}
              onPointerMove={(e: any) => { /* e.stopPropagation(); */ handlePointerMove(e); }}
              onPointerUp={(e: any) => { /* e.stopPropagation(); */ handlePointerUp(e); }}
              onPointerCancel={(e: any) => { /* e.stopPropagation(); */ handlePointerCancel(e); }}
              onPointerOver={(_e: any) => { /* e.stopPropagation() */ }}
              onPointerOut={(_e: any) => { /* e.stopPropagation() */ }}
              onWheel={(_e: any) => { /* e.stopPropagation() */ }}
            />
          </>
        )}
        
        {/* 폴백 모델이 없을 때 기본 박스 표시 */}
        {!model && !isLoading && !loadError && (
          <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
            <meshPhongMaterial color="#8B4513" />
          </Box>
        )}

        {/* 드래그/선택 히트박스 확장 - 모바일 터치 신뢰성 향상 */}
        {isEditMode && !item.isLocked && !isDragging && (
          <Box
            args={[item.footprint.width + 0.6, item.footprint.height + 0.6, item.footprint.depth + 0.6]}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <meshBasicMaterial transparent opacity={0} />
          </Box>
        )}

        {/* 드래그 중일 때 시각적 피드백 */}
        {isDragging && (
          <>
            {/* 드래그 중 그림자 */}
            <Box args={[item.footprint.width, 0.01, item.footprint.depth]} position={[0, -0.01, 0]}>
              <meshBasicMaterial color="#000000" transparent opacity={0.3} />
            </Box>
            {/* 드래그 중 하이라이트 - 충돌 시 빨간색, 정상 시 파란색 */}
            <Box args={[item.footprint.width + 0.2, item.footprint.height + 0.2, item.footprint.depth + 0.2]}>
              <meshBasicMaterial 
                color={isColliding ? "#ef4444" : "#3b82f6"} 
                transparent 
                opacity={0.4} 
              />
            </Box>
            {/* 충돌 시 추가 경고 표시 */}
            {isColliding && (
              <Box args={[item.footprint.width + 0.4, item.footprint.height + 0.4, item.footprint.depth + 0.4]}>
                <meshBasicMaterial color="#ef4444" transparent opacity={0.2} />
              </Box>
            )}
          </>
        )}

        {/* 호버 효과 */}
        {isHovered && !isDragging && (
          <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
            <meshBasicMaterial color="#ffff00" transparent opacity={0.2} />
          </Box>
        )}

        {/* 선택 표시기 - 개선된 버전 */}
        {isSelected && (
          <Box
            args={[item.footprint.width + 0.1, item.footprint.height + 0.1, item.footprint.depth + 0.1]}
            position={[0, item.footprint.height / 2, 0]}
          >
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
          </Box>
        )}

        {/* 고정 표시기 */}
        {item.isLocked && (
          <Box args={[item.footprint.width + 0.2, item.footprint.height + 0.2, item.footprint.depth + 0.2]}>
            <meshBasicMaterial color="#ffd700" transparent opacity={0.4} />
          </Box>
        )}
      </group>
    </>
  );
});
