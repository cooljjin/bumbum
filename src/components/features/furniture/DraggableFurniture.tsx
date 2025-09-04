import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import { Vector3, Euler, Group, Raycaster, Plane, Vector2 } from 'three';
import { useEditorStore } from '../../../store/editorStore';
import { PlacedItem } from '../../../types/editor';
import { createFallbackModel, createFurnitureModel, loadModel, compareModelWithFootprint } from '../../../utils/modelLoader';
import { getFurnitureFromPlacedItem } from '../../../data/furnitureCatalog';
import { safePosition, safeRotation, safeScale } from '../../../utils/safePosition';
import { constrainFurnitureToRoom, isFurnitureInRoom } from '../../../utils/roomBoundary';
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
  
  console.log(`📐 원본 모델 크기: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
  console.log(`📏 목표 footprint: ${footprint.width} x ${footprint.height} x ${footprint.depth}`);
  console.log(`🎯 원본 모델 중심점: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
  
  // 스케일 비율 계산 (각 축별로 정확히 맞춤)
  const scaleX = footprint.width / size.x;
  const scaleY = footprint.height / size.y;
  const scaleZ = footprint.depth / size.z;
  
  const scale = new THREE.Vector3(scaleX, scaleY, scaleZ);
  
  console.log(`🔧 적용할 스케일: ${scale.x.toFixed(3)} x ${scale.y.toFixed(3)} x ${scale.z.toFixed(3)}`);
  
  // 모델 복사 및 스케일 적용
  const adjustedModel = model.clone();
  adjustedModel.scale.copy(scale);
  
  // 스케일 적용 후 새로운 바운딩 박스 계산
  const adjustedBox = new THREE.Box3().setFromObject(adjustedModel);
  const adjustedSize = adjustedBox.getSize(new THREE.Vector3());
  const adjustedCenter = adjustedBox.getCenter(new THREE.Vector3());
  
  console.log(`📐 스케일 적용 후 크기: ${adjustedSize.x.toFixed(2)} x ${adjustedSize.y.toFixed(2)} x ${adjustedSize.z.toFixed(2)}`);
  console.log(`🎯 스케일 적용 후 중심점: (${adjustedCenter.x.toFixed(2)}, ${adjustedCenter.y.toFixed(2)}, ${adjustedCenter.z.toFixed(2)})`);
  
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
  
  console.log(`✅ 최종 모델 크기: ${finalSize.x.toFixed(2)} x ${finalSize.y.toFixed(2)} x ${finalSize.z.toFixed(2)}`);
  console.log(`✅ 최종 모델 중심점: (${finalCenter.x.toFixed(2)}, ${finalCenter.y.toFixed(2)}, ${finalCenter.z.toFixed(2)})`);
  
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
  onDelete: (id: string) => void;
  onDuplicate?: (item: PlacedItem) => void;
}

export const DraggableFurniture: React.FC<DraggableFurnitureProps> = React.memo(({
  item,
  isSelected,
  isEditMode,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate
}) => {
  console.log('[DraggableFurniture] mounted', item?.id);

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

  // 🎯 드래그 앤 드롭 관련 ref들
  const raycaster = useRef<Raycaster>(new Raycaster());
  const dragPlane = useRef<Plane>(new Plane(new Vector3(0, 1, 0), 0));

  const { grid, setDragging } = useEditorStore();
  const { camera } = useThree();

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

  // 🖱️ 드래그 시작 핸들러 (마우스 및 터치 지원)
  const handleDragStart = useCallback((event: any) => {
    if (!isEditMode || item.isLocked) return;

    event.stopPropagation();

    // 선택 상태로 만들기
    onSelect(item.id);

    setIsDragging(true);
    setDragStartPosition(item.position.clone());

    // 마우스 또는 터치 위치 저장
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

    const mouseX = (clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(clientY / window.innerHeight) * 2 + 1;
    setDragStartMousePosition(new Vector2(mouseX, mouseY));

    // 전역 드래그 상태 업데이트
    setDragging(true);

    console.log('🖱️ 드래그 시작:', item.name, event.touches ? '(터치)' : '(마우스)');
  }, [isEditMode, item.isLocked, item.id, item.position, item.name, onSelect, setDragging]);

  // 🔄 드래그 중 핸들러 (마우스 및 터치 지원)
  const handleDrag = useCallback((event: any) => {
    if (!isDragging || !dragStartPosition || !dragStartMousePosition) return;

    // r3f Pointer 이벤트는 passive일 수 있으므로 touch 이벤트에서만 default 차단
    if (event?.touches || event?.type === 'touchmove' || event?.nativeEvent?.touches) {
      safePreventDefault(event);
    }
    event.stopPropagation();

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

    const mouseX = (clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(clientY / window.innerHeight) * 2 + 1;

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

    // 임시 아이템으로 충돌 감지
    const tempItem = { ...item, position: newPosition };
    
    // 방 경계 내에 있는지 확인
    if (isFurnitureInRoom(tempItem)) {
      // 방 안에 있으면 위치 업데이트
      onUpdate(item.id, { position: newPosition });
      console.log('✅ 드래그 중 (방 안):', newPosition, event.touches ? '(터치)' : '(마우스)');
    } else {
      // 방 밖에 있으면 제한된 위치로 이동
      const constrainedItem = constrainFurnitureToRoom(tempItem);
      onUpdate(item.id, { position: constrainedItem.position });
      console.log('🚫 드래그 중 (방 밖, 제한됨):', constrainedItem.position, event.touches ? '(터치)' : '(마우스)');
    }
  }, [isDragging, dragStartPosition, dragStartMousePosition, camera, grid, item.id, onUpdate]);

  // ✅ 드래그 종료 핸들러
  const handleDragEnd = useCallback((event: any) => {
    if (!isDragging) return;

    event.stopPropagation();

    // 최종 위치 검증 및 제한
    const finalItem = constrainFurnitureToRoom(item);
    if (!finalItem.position.equals(item.position)) {
      onUpdate(item.id, { position: finalItem.position });
      console.log('🔧 드래그 종료 시 위치 제한 적용:', finalItem.position);
    }

    setIsDragging(false);
    setDragStartPosition(null);
    setDragStartMousePosition(null);

    // 전역 드래그 상태 업데이트
    setDragging(false);

    console.log('✅ 드래그 종료:', item.name);
  }, [isDragging, item, onUpdate, setDragging]);

  // 🖱️ 마우스 이벤트 핸들러
  // 포인터 다운(마우스/터치 공통)
  const handlePointerDown = useCallback((event: any) => {
    const isTouch = event.pointerType === 'touch' || !!event.touches;
    const isLeft = event.button === 0 || event.button === undefined;
    if (isTouch || isLeft) {
      try { event.currentTarget?.setPointerCapture?.(event.pointerId); } catch {}
      handleDragStart(event);
    }
  }, [handleDragStart]);

  const handlePointerMove = useCallback((event: any) => {
    if (isDragging) {
      if (event?.touches || event?.type === 'touchmove' || event?.nativeEvent?.touches) {
        safePreventDefault(event);
      }
      handleDrag(event);
    }
  }, [isDragging, handleDrag]);

  const handlePointerUp = useCallback((event: any) => {
    if (isDragging) {
      handleDragEnd(event);
    }
  }, [isDragging, handleDragEnd]);

  // 🎯 호버 효과
  const handlePointerEnter = useCallback(() => {
    if (isEditMode && !item.isLocked) {
      setIsHovered(true);
    }
  }, [isEditMode, item.isLocked]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // 전역 마우스 및 터치 이벤트 리스너
  useEffect((): (() => void) | void => {
    if (isDragging) {
      // 마우스/포인터 이벤트
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      // 터치
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp, { passive: false });

      return () => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
      };
    }
    return undefined;
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // 컴포넌트가 언마운트될 때 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // 클릭 이벤트 처리
  const handleClick = useCallback((event: any) => {
    event.stopPropagation();

    if (item.isLocked) {
      console.log('고정된 객체는 선택할 수 없습니다:', item.id);
      return;
    }

    if (isSelected) {
      onSelect(null);
      console.log('객체 선택 해제:', item.id);
    } else {
      onSelect(item.id);
      console.log('객체 선택:', item.id);
    }
  }, [isSelected, item.id, item.isLocked, onSelect]);

  // 모델 로딩
  useEffect(() => {
    const loadFurnitureModel = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const furniture = getFurnitureFromPlacedItem(item);
        if (!furniture) {
          console.warn('가구 정보를 찾을 수 없어 기본 박스로 표시합니다:', item);
          setLoadError('가구 정보를 찾을 수 없습니다');
          setIsLoading(false);
          return;
        }

        console.info(`🎯 가구 모델 로딩 시작: ${furniture.nameKo} (${furniture.category})`);
        console.info(`📁 모델 경로: ${furniture.modelPath}`);
        console.info(`🆔 가구 ID: ${furniture.id}`);
        console.info(`📏 크기: ${furniture.footprint.width}x${furniture.footprint.height}x${furniture.footprint.depth}`);

        // 실제 GLTF 모델 로드 시도
        if (furniture.modelPath) {
          try {
            const gltfModel = await loadModel(furniture.modelPath, {
              useCache: true,
              priority: 'normal'
            });
            
            if (gltfModel) {
              console.info(`✅ GLTF 모델 로드 성공: ${furniture.nameKo}`);
              
              // 원본 모델과 footprint 크기 비교
              compareModelWithFootprint(gltfModel, furniture.footprint, furniture.nameKo);
              
              // 모델 크기를 footprint에 맞게 조정
              const adjustedModel = adjustModelToFootprint(gltfModel, furniture.footprint);
              setModel(adjustedModel);
              setIsLoading(false);
              return;
            }
          } catch (gltfError) {
            console.warn(`⚠️ GLTF 모델 로드 실패, 폴백 모델 사용: ${furniture.nameKo}`);
            console.warn(`❌ 오류 상세:`, gltfError);
            console.warn(`📁 시도한 경로: ${furniture.modelPath}`);
          }
        }

        // GLTF 로드 실패 시 폴백 모델 생성
        console.info(`폴백 모델 생성: ${furniture.nameKo}`);
        
        // 카테고리별 색상 선택
        const getCategoryColor = (category: string, subcategory?: string) => {
          switch (category) {
            case 'living':
              if (subcategory === 'sofa') return 0x8B4513; // 갈색
              if (subcategory === 'table') return 0xDEB887; // 버건디
              if (subcategory === 'chair') return 0x8B4513; // 갈색
              return 0x8B4513;
            case 'bedroom':
              if (subcategory === 'bed') return 0x8B4513; // 갈색
              if (subcategory === 'storage') return 0xDEB887; // 버건디
              return 0x8B4513;
            case 'kitchen':
              return 0xDEB887; // 버건디
            case 'office':
              return 0x696969; // 회색
            case 'storage':
              return 0xDEB887; // 버건디
            case 'decorative':
              if (subcategory === 'clock') return 0xFFFFFF; // 흰색
              return 0xDEB887; // 버건디
            default:
              return 0x8B4513; // 기본 갈색
          }
        };
        
        const fallbackModel = createFurnitureModel(
          furniture.footprint.width,
          furniture.footprint.height,
          furniture.footprint.depth,
          getCategoryColor(furniture.category, furniture.subcategory)
        );
        setModel(fallbackModel);
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
  }, [item.id, disposeModel]);

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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerEnter}
        onPointerOut={handlePointerLeave}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* 3D 모델 */}
        {model && (
          <primitive
            object={model}
            onPointerDown={(e: any) => { e.stopPropagation(); handlePointerDown(e); }}
            onPointerMove={(e: any) => { e.stopPropagation(); handlePointerMove(e); }}
            onPointerUp={(e: any) => { e.stopPropagation(); handlePointerUp(e); }}
            onPointerOver={(e: any) => e.stopPropagation()}
            onPointerOut={(e: any) => e.stopPropagation()}
            onWheel={(e: any) => e.stopPropagation()}
          />
        )}

        {/* 드래그/선택 히트박스 확장 - 모바일 터치 신뢰성 향상 */}
        {isEditMode && !item.isLocked && !isDragging && (
          <Box
            args={[item.footprint.width + 0.6, item.footprint.height + 0.6, item.footprint.depth + 0.6]}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <meshBasicMaterial transparent opacity={0} />
          </Box>
        )}

        {/* 드래그 중일 때 시각적 피드백 */}
        {isDragging && (
          <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
            <meshBasicMaterial color="#00ff00" transparent opacity={0.3} />
          </Box>
        )}

        {/* 호버 효과 */}
        {isHovered && !isDragging && (
          <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
            <meshBasicMaterial color="#ffff00" transparent opacity={0.2} />
          </Box>
        )}

        {/* 선택 표시기 - 개선된 버전 */}
        {isSelected && (
          <Box n            args={[item.footprint.width + 0.1, item.footprint.height + 0.1, item.footprint.depth + 0.1]}n            position={[0, item.footprint.height / 2, 0]}n          >
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
