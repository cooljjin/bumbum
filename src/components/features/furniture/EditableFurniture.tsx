import React, { useRef, useEffect, useState, useCallback } from 'react';

import { TransformControls, Box, Html, useGLTF, Edges } from '@react-three/drei';
import { Vector3, Euler, Group } from 'three';
import { useEditorStore } from '../../../store/editorStore';
import { PlacedItem } from '../../../types/editor';
import { createFallbackModel, createFurnitureModel, loadModel, adjustModelToFootprint } from '../../../utils/modelLoader';
import { getFurnitureFromPlacedItem } from '../../../data/furnitureCatalog';
import { safePosition, safeRotation, safeScale } from '../../../utils/safePosition';
// import MobileTouchHandler from '../ui/MobileTouchHandler';
import { constrainFurnitureToRoom, isFurnitureInRoom } from '../../../utils/roomBoundary';
import { FurnitureColorChanger } from '../../../utils/colorChanger';
import { useColorChanger } from '../../../hooks/useColorChanger';
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
  
  return adjustedModel;
};

interface EditableFurnitureProps {
  item: PlacedItem;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<PlacedItem>) => void;
  onDelete: (id: string) => void;
}

export const EditableFurniture: React.FC<EditableFurnitureProps> = ({
  item,
  isSelected,
  isEditMode,
  onSelect,
  onUpdate,
  onDelete
}) => {
  // 컴포넌트 마운트 확인

  const meshRef = useRef<Group>(null);
  const transformControlsRef = useRef<any>(null);



  const [model, setModel] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // useGLTF 훅으로 직접 모델 로드
  const furniture = getFurnitureFromPlacedItem(item);
  const gltf = furniture?.modelPath ? useGLTF(furniture.modelPath, true) : null; // draco 옵션 활성화
  const lastUpdateTime = useRef<number>(0);

  // 색상 변경 기능
  const {
    currentColor,
    predefinedColors,
    handleColorChange,
    handleColorReset,
    isColorPanelExpanded,
    toggleColorPanel
  } = useColorChanger();



  const { mode, tool, grid, rotationSnap, snapStrength } = useEditorStore();


  // 모바일 환경 감지
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchMode, setIsTouchMode] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(navigator.userAgent) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);

      // 모바일 환경에서는 터치 모드 활성화
      if (isMobileDevice && isSelected && isEditMode && !item.isLocked) {
        setIsTouchMode(true);
      } else {
        setIsTouchMode(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [isSelected, isEditMode, item.isLocked]);

  // 터치 변환 핸들러
  const handleTouchTransform = useCallback((position: Vector3, rotation: Euler, scale: Vector3) => {
    onUpdate(item.id, { position, rotation, scale });
  }, [item.id, onUpdate]);

  // 색상 변경 핸들러 (모델에 적용)
  const handleModelColorChange = useCallback((color: string) => {
    if (model) {
      FurnitureColorChanger.changeBlanketColor(model, color);
    }
  }, [model]);

  // 색상 초기화 핸들러 (모델에 적용)
  const handleModelColorReset = useCallback(() => {
    if (model) {
      FurnitureColorChanger.resetToOriginalColors(model);
    }
  }, [model]);

  // 색상 변경 시 모델에 적용
  useEffect(() => {
    if (model && currentColor) {
      handleModelColorChange(currentColor);
    }
  }, [currentColor, model, handleModelColorChange]);

  // useGLTF로 로드된 모델 처리
  useEffect(() => {
    if (gltf && gltf.scene && furniture) {
      console.log(`✅ useGLTF로 모델 로드 완료: ${item.name}`);
      console.log(`📦 모델 자식 요소 수: ${gltf.scene.children.length}`);
      
      // 모델 크기를 footprint에 맞게 조정
      const adjustedModel = adjustModelToFootprint(gltf.scene, furniture.footprint);

      // 알파 에지(하얀/파란 테두리) 보정: 도어 및 투명 텍스처에 대한 안전 설정
      try {
        adjustedModel.traverse((obj: any) => {
          if (obj && obj.isMesh && obj.material) {
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            materials.forEach((mat: any) => {
              // 텍스처 색 공간 및 프리멀티플라이 알파
              if (mat.map) {
                if (mat.map.colorSpace !== (THREE as any).SRGBColorSpace) {
                  mat.map.colorSpace = (THREE as any).SRGBColorSpace;
                }
                // 투명 텍스처의 가장자리 헤일로 방지에 도움
                if (mat.map.premultiplyAlpha !== true) {
                  mat.map.premultiplyAlpha = true;
                }
                mat.map.needsUpdate = true;
              }

              // 기본 보정: 투명도/알파맵이 있는 경우 약한 alphaTest 적용 + 알파투커버리지
              const hasAlpha = !!mat.alphaMap || (typeof mat.opacity === 'number' && mat.opacity < 1) || !!mat.transparent;
              if (hasAlpha) {
                if (typeof mat.alphaTest !== 'number' || mat.alphaTest < 0.1) {
                  mat.alphaTest = 0.1; // 부드러운 가장자리 보존하며 헤일로 완화
                }
                if ('alphaToCoverage' in mat) {
                  mat.alphaToCoverage = true; // WebGL2 MSAA 환경에서 가장자리 품질 개선
                }
                mat.needsUpdate = true;
              }

              // 도어 전용 강한 보정: 테두리 헤일로가 두드러져서 더 강하게 처리
              if (furniture.subcategory === 'door') {
                // 도어는 투명 유리 재질이 아닌 경우가 많아 alphaTest를 더 높이고 블렌딩 해제
                if (typeof mat.alphaTest !== 'number' || mat.alphaTest < 0.3) {
                  mat.alphaTest = 0.3;
                }
                // 유리/투명 의도 재질로 추정되는 이름은 보존
                const name: string = (mat.name || '').toLowerCase();
                const looksGlass = name.includes('glass') || name.includes('transparent') || name.includes('window');
                if (!looksGlass) {
                  mat.transparent = false; // 알파테스트(디스카드) 기반으로 프린지 제거
                  mat.depthWrite = true;
                }
                if ('alphaToCoverage' in mat) {
                  mat.alphaToCoverage = true;
                }
                mat.needsUpdate = true;
              }
            });
          }
        });
      } catch (e) {
        console.warn('알파/텍스처 보정 중 경고:', e);
      }
      setModel(adjustedModel);
      setIsLoading(false);
      setLoadError(null);
    } else if (furniture?.modelPath) {
      console.log(`⏳ 모델 로딩 중: ${furniture.modelPath}`);
    } else if (!furniture) {
      console.warn('가구 정보를 찾을 수 없어 기본 박스로 표시합니다:', item);
      setLoadError('가구 정보를 찾을 수 없습니다');
      const fallbackModel = createFallbackModel();
      setModel(fallbackModel);
      setIsLoading(false);
    }
  }, [gltf, furniture, item.name]);

  // 위치, 회전, 크기 동기화 - 최적화된 의존성 배열
  useEffect(() => {
    if (!meshRef.current || item.isLocked) return;

    try {
      // Three.js 객체의 속성들을 직접 비교하여 변경된 경우에만 업데이트
      const currentPos = meshRef.current.position;
      const currentRot = meshRef.current.rotation;
      const currentScale = meshRef.current.scale;

      const [x, y, z] = safePosition(item.position);
      const itemPosition = new Vector3(x, y, z);
      const itemRotation = new Euler(item.rotation.x, item.rotation.y, item.rotation.z);
      const itemScale = new Vector3(item.scale.x, item.scale.y, item.scale.z);

      // 더 엄격한 오차 허용 범위 적용
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
            // console.log(`📍 가구 ${item.id} 위치 동기화:`, {
            //   x: itemPosition.x.toFixed(3),
            //   y: itemPosition.y.toFixed(3),
            //   z: itemPosition.z.toFixed(3)
            // });
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
  }, [item.id, item.isLocked]); // 최적화된 의존성 배열

  // TransformControls 스냅 설정 적용 - Blueprint3D 스타일 개선
  useEffect(() => {
    if (transformControlsRef.current && isSelected && mode === 'edit' && !item.isLocked) {
      // 그리드 스냅 설정 - 스냅 강도에 따라 조절
      if (grid.enabled && snapStrength.enabled) {
        const cellSize = grid.size / grid.divisions;
        // 스냅 강도에 따라 TransformControls 스냅 설정
        const snapValue = cellSize * snapStrength.translation;
        transformControlsRef.current.setTranslationSnap(snapValue);
      } else {
        transformControlsRef.current.setTranslationSnap(null);
      }

      // 회전 스냅 설정 - 스냅 강도에 따라 조절
      if (rotationSnap.enabled && snapStrength.enabled) {
        const snapAngle = (rotationSnap.angle * Math.PI) / 180; // 도를 라디안으로 변환
        // 스냅 강도에 따라 회전 스냅 설정
        const snapValue = snapAngle * snapStrength.rotation;
        transformControlsRef.current.setRotationSnap(snapValue);
      } else {
        transformControlsRef.current.setRotationSnap(null);
      }

      // TransformControls의 키보드 이벤트 방지 및 개선된 단축키 처리
      const originalAddEventListener = transformControlsRef.current.addEventListener;
      if (originalAddEventListener) {
        // L, G, R 키 이벤트 차단 및 개선된 단축키 지원
        transformControlsRef.current.addEventListener = function(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) {
          if (type === 'keydown' || type === 'keyup' || type === 'keypress') {
            const blockedKeys = ['l', 'L', 'g', 'G', 'r', 'R'];
            const originalListener = listener;
            listener = function(this: any, event: Event) {
              if ('key' in event && blockedKeys.includes((event as KeyboardEvent).key)) {
                // event.stopPropagation(); // 이벤트 전파 허용
                return;
              }
              return originalListener.apply(this, [event]);
            };
          }
          return originalAddEventListener.call(this, type, listener, options);
        };
      }
    }
  }, [isSelected, mode, grid.enabled, grid.size, grid.divisions, rotationSnap.enabled, rotationSnap.angle, snapStrength, item.isLocked]);

  // 스냅 함수들 - Blueprint3D 스타일 개선
  const snapToGrid = React.useCallback((value: number, snapSize: number = 0.25): number => {
    return Math.round(value / snapSize) * snapSize;
  }, []);

  const snapPosition = React.useCallback((position: Vector3, snapSize: number = 0.25): Vector3 => {
    return new Vector3(
      snapToGrid(position.x, snapSize),
      position.y, // Y축은 바닥에 고정 (스냅하지 않음)
      snapToGrid(position.z, snapSize)
    );
  }, [snapToGrid]);

  const snapRotation = React.useCallback((rotation: Euler, snapAngle: number = 15): Euler => {
    const snapAngleRad = (snapAngle * Math.PI) / 180;
    return new Euler(
      Math.round(rotation.x / snapAngleRad) * snapAngleRad,
      Math.round(rotation.y / snapAngleRad) * snapAngleRad,
      Math.round(rotation.z / snapAngleRad) * snapAngleRad
    );
  }, []);

  // TransformControls 변경 이벤트 처리 - 스냅 기능 및 벽 충돌 감지 포함
  const handleTransformChange = React.useCallback(() => {
    if (!meshRef.current || !transformControlsRef.current) return;

    // 단일 드래그 락: 내가 소유한 드래그만 처리
    try {
      const { draggingItemId } = useEditorStore.getState();
      if (draggingItemId && draggingItemId !== item.id) {
        return;
      }
    } catch {}

    const now = Date.now();
    // 최소 16ms (약 60fps) 간격으로 업데이트 제한
    if (now - lastUpdateTime.current < 16) return;
    lastUpdateTime.current = now;
    
    // TransformControls 사용 중에는 호버 효과 제거
    setIsHovered(false);

    try {
      let currentPosition = meshRef.current.position.clone();
      let currentRotation = meshRef.current.rotation.clone();
      const currentScale = meshRef.current.scale.clone();

      // 그리드 스냅 적용 (편집 모드에서만)
      if (grid.enabled && mode === 'edit') {
        const cellSize = grid.size / grid.divisions;
        currentPosition = snapPosition(currentPosition, cellSize);
      }

      // 회전 스냅 적용 (편집 모드에서만)
      if (rotationSnap.enabled && mode === 'edit') {
        currentRotation = snapRotation(currentRotation, rotationSnap.angle);
      }

      // 🔥 벽 충돌 감지 추가
      const tempItem = {
        ...item,
        position: currentPosition,
        rotation: currentRotation,
        scale: currentScale
      };

      // 방 경계 내에 있는지 확인
      if (!isFurnitureInRoom(tempItem)) {
        // 방 밖에 있으면 제한된 위치로 이동
        const constrainedItem = constrainFurnitureToRoom(tempItem);
        currentPosition = constrainedItem.position;
        
        // TransformControls의 위치도 즉시 업데이트
        if (meshRef.current) {
          meshRef.current.position.copy(currentPosition);
        }
        
        // console.log('🚫 TransformControls: 벽 충돌 감지, 위치 제한:', currentPosition);
      }

      // 현재 값과 이전 값을 비교하여 실제 변경된 경우에만 업데이트
      const [x, y, z] = safePosition(item.position);
      const itemPosition = new Vector3(x, y, z);
      const itemRotation = new Euler(item.rotation.x, item.rotation.y, item.rotation.z);
      const itemScale = new Vector3(item.scale.x, item.scale.y, item.scale.z);

      // 값이 실제로 변경된 경우에만 업데이트 (약간의 오차 허용)
      const TOLERANCE = 0.001;
      const positionChanged = !currentPosition.equals(itemPosition) &&
        Math.abs(currentPosition.distanceTo(itemPosition)) > TOLERANCE;
      const rotationChanged = !currentRotation.equals(itemRotation) &&
        (Math.abs(currentRotation.x - itemRotation.x) > TOLERANCE ||
         Math.abs(currentRotation.y - itemRotation.y) > TOLERANCE ||
         Math.abs(currentRotation.z - itemRotation.z) > TOLERANCE);
      const scaleChanged = !currentScale.equals(itemScale) &&
        Math.abs(currentScale.distanceTo(itemScale)) > TOLERANCE;

      if (positionChanged || rotationChanged || scaleChanged) {
        // 스냅된 값으로 업데이트
        onUpdate(item.id, {
          position: currentPosition,
          rotation: currentRotation,
          scale: currentScale
        });
      }
    } catch (error) {
      // console.warn('Transform update failed:', error);
    }
  }, [item.id, item.position, item.rotation, item.scale, onUpdate, grid, rotationSnap, mode, snapPosition, snapRotation]);

  // TransformControls 드래그 종료 시 자동 고정
  const handleTransformEnd = React.useCallback(() => {
    if (!isSelected || item.isLocked) return;

    // console.log('🎯 드래그 종료 - 객체 위치 조정 완료:', item.id);
    
    // TransformControls 종료 시 호버 효과 복원
    setIsHovered(true);

    // 자동 고정 설정 확인
    const { autoLock } = useEditorStore.getState();

    if (autoLock.enabled) {
      // console.log(`⏱️ ${autoLock.delay}ms 후 자동 고정 예정...`);

      // 설정된 지연 시간 후 자동 고정
      setTimeout(() => {
        // 현재 위치를 확실히 저장
        if (meshRef.current && isSelected && !item.isLocked) {
          const currentPosition = meshRef.current.position.clone();
          const currentRotation = meshRef.current.rotation.clone();
          const currentScale = meshRef.current.scale.clone();

          // 현재 값으로 업데이트 (고정 전에 위치 확정)
          onUpdate(item.id, {
            position: currentPosition,
            rotation: currentRotation,
            scale: currentScale
          });

          // console.log(`📍 자동 고정 준비: (${currentPosition.x.toFixed(2)}, ${currentPosition.z.toFixed(2)})`);

          // 자동 고정 실행
          useEditorStore.getState().lockItem(item.id);
          // console.log('🔒 자동 고정 완료!');
        }
      }, autoLock.delay);
    } else {
      // console.log('🔓 자동 고정이 비활성화되어 있습니다. 수동으로 L키를 눌러 고정하세요.');
    }

    // 드래그 락 해제
    try { useEditorStore.getState().endDraggingItem(item.id); } catch {}
  }, [isSelected, item.id, item.isLocked, onUpdate]);

  // 컴포넌트 언마운트 시 드래그 락 정리
  useEffect(() => {
    return () => {
      try {
        const { draggingItemId, endDraggingItem } = useEditorStore.getState();
        if (draggingItemId === item.id) endDraggingItem(item.id);
      } catch {}
    };
  }, [item.id]);

  // 객체 표시 상태 관리 - 고정 상태 변경 시에도 객체가 사라지지 않도록
  const [isVisible, setIsVisible] = React.useState(true);
  const [isPlacementMode, setIsPlacementMode] = React.useState(false);

  // 고정 상태 변경 애니메이션을 위한 상태
  const [lockAnimation, setLockAnimation] = React.useState(false);
  const [previousLockState, setPreviousLockState] = React.useState(item.isLocked);

  // 고정 상태 변경 감지 및 애니메이션 실행
  React.useEffect(() => {
    setIsVisible(true); // 항상 표시 상태 유지

    // 고정 상태가 변경되었는지 확인
    if (previousLockState !== item.isLocked) {
      // console.log(`🔒 고정 상태 변경: ${previousLockState ? '고정됨' : '해제됨'} → ${item.isLocked ? '고정됨' : '해제됨'}`);

      // 애니메이션 실행
      setLockAnimation(true);

      // 애니메이션 완료 후 상태 정리
      setTimeout(() => {
        setLockAnimation(false);
      }, 1000); // 1초 애니메이션

      // 이전 상태 업데이트
      setPreviousLockState(item.isLocked);
    }
  }, [item.isLocked, previousLockState]);

  // 새로운 객체 배치 모드 감지 (최근 추가된 객체)
  React.useEffect(() => {
    // item이 새로 추가되었고 아직 고정되지 않은 경우 배치 모드로 설정
    if (!item.isLocked && isSelected && isEditMode) {
      setIsPlacementMode(true);
    } else {
      setIsPlacementMode(false);
    }
  }, [item.isLocked, isSelected, isEditMode, item.id]);

  // 호버 이벤트 처리
  const handlePointerEnter = useCallback(() => {
    if (isEditMode && !item.isLocked && isSelected) {
      setIsHovered(true);
    }
  }, [isEditMode, item.isLocked, isSelected]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // 클릭 이벤트 처리 - 선택/해제 토글 (고정된 객체는 선택 불가)
  const handleClick = (event: any) => {
    // event.stopPropagation(); // 이벤트 전파 허용

    // 고정된 객체는 선택할 수 없음
    if (item.isLocked) {
      // console.log('고정된 객체는 선택할 수 없습니다:', item.id);
      return;
    }

    // 단일 선택만 허용 - 다른 객체를 클릭하면 이전 선택이 자동으로 해제됨
    // 이미 선택된 객체를 다시 클릭해도 선택 유지
    // console.log(`🎯 가구 클릭: ${item.id} (현재 선택됨: ${isSelected})`);
    onSelect(item.id);
    
    // 선택 시 호버 효과 활성화
    if (isEditMode && !item.isLocked) {
      setIsHovered(true);
    }
  };

  // 키보드 단축키 처리 - 이벤트 리스너 중복 등록 방지
  useEffect(() => {
    if (!isSelected || !isEditMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          onDelete(item.id);
          break;
        case 'Escape':
          event.preventDefault();
          onSelect(item.id); // 선택 해제
          break;
        case 'g':
        case 'G':
          event.preventDefault();
          // 이동 도구로 전환
          useEditorStore.getState().setTool('translate');
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          // 회전 도구로 전환
          useEditorStore.getState().setTool('rotate');
          break;
        case 'l':
        case 'L':
          event.preventDefault();
          // event.stopPropagation(); // TransformControls에 이벤트가 전달되지 않도록

          // 객체 고정/해제 토글 - 현재 위치 확실히 저장
          if (item.isLocked) {
            useEditorStore.getState().unlockItem(item.id);
            // console.log('🔓 객체 고정 해제됨:', item.id);
          } else {
            // 고정하기 전에 현재 위치를 확실히 저장
            if (meshRef.current && isSelected) {
              const currentPosition = meshRef.current.position.clone();
              const currentRotation = meshRef.current.rotation.clone();
              const currentScale = meshRef.current.scale.clone();

              // 현재 값으로 업데이트 (고정 전에 위치 확정)
              onUpdate(item.id, {
                position: currentPosition,
                rotation: currentRotation,
                scale: currentScale
              });

              // console.log(`📍 현재 위치에 고정 준비: (${currentPosition.x.toFixed(2)}, ${currentPosition.z.toFixed(2)})`);
            }

            // 잠시 후에 고정 설정 (위치 저장 완료 대기)
            setTimeout(() => {
              useEditorStore.getState().lockItem(item.id);
              // console.log('🔒 객체 고정됨 - 현재 위치에 고정되었습니다!');
            }, 100);
          }
          break;
        case 's':
        case 'S':
          event.preventDefault();
          // 크기 조정 도구로 전환
          useEditorStore.getState().setTool('scale');
          break;
        case 'q':
        case 'Q':
          event.preventDefault();
          // 선택 도구로 전환
          useEditorStore.getState().setTool('select');
          break;

        case 'g':
        case 'G':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // 그리드 스냅 토글
            useEditorStore.getState().toggleGridSnap();
            // console.log('그리드 스냅 토글:', useEditorStore.getState().grid.enabled ? 'ON' : 'OFF');
          } else {
            event.preventDefault();
            // 이동 도구로 전환
            useEditorStore.getState().setTool('translate');
          }
          break;
        case 'r':
        case 'R':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // 회전 스냅 토글
            useEditorStore.getState().toggleRotationSnap();
            // console.log('회전 스냅 토글:', useEditorStore.getState().rotationSnap.enabled ? 'ON' : 'OFF');
          } else {
            event.preventDefault();
            // 회전 도구로 전환
            useEditorStore.getState().setTool('rotate');
          }
          break;
      }
    };

    // 캡처 단계에서 이벤트 리스너 추가하여 TransformControls의 기본 동작을 먼저 차단
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isSelected, onDelete, onSelect, item.id]);

  // 바운딩 박스 렌더링 (고정된 객체는 표시하지 않음)
  const renderBoundingBox = () => {
    if (!isSelected || !isEditMode || !model || item.isLocked) return null;

    return (
      <Box
        args={[item.footprint.width, item.footprint.height, item.footprint.depth]}
        position={[0, item.footprint.height / 2, 0]}
        visible={true}
      >
        <meshBasicMaterial
          color="#00ff00"
          wireframe={true}
          transparent={true}
          opacity={0.5}
        />
      </Box>
    );
  };

  // 고정 표시기 렌더링 (개선된 버전)
  const renderLockIndicator = () => {
    if (!item.isLocked || !model) return null;

    // 애니메이션 효과 적용
    const animationScale = lockAnimation ? 1.2 : 1.0;
    const animationOpacity = lockAnimation ? 1.0 : 0.95;

    return (
      <group>
        {/* 고정 바운딩 박스 - 더 두드러진 황금색 테두리 */}
        <Box
          args={[item.footprint.width + 0.3, item.footprint.height + 0.3, item.footprint.depth + 0.3]}
          position={[0, item.footprint.height / 2, 0]}
          visible={true}
          scale={[animationScale, animationScale, animationScale]}
        >
          <meshBasicMaterial
            color="#ffd700" // 밝은 황금색
            wireframe={true}
            transparent={true}
            opacity={animationOpacity}
          />
        </Box>

        {/* 고정 상태 강조 표시 - 바닥에 황금 원형 마커 */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[item.footprint.width / 2 + 0.2, item.footprint.width / 2 + 0.2, 0.1, 16]} />
          <meshBasicMaterial
            color="#ffd700"
            transparent={true}
            opacity={0.8}
          />
        </mesh>

        {/* 고정 아이콘 표시 - 더 큰 크기 */}
        <mesh position={[0, item.footprint.height + 0.6, 0]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>

        {/* 자물쇠 아이콘 (개선된 디자인) */}
        <group position={[0, item.footprint.height + 0.9, 0]}>
          {/* 자물쇠 몸체 */}
          <Box args={[0.25, 0.2, 0.12]} position={[0, 0, 0]}>
            <meshBasicMaterial color="#333333" />
          </Box>
          {/* 자물쇠 구멍 */}
          <Box args={[0.1, 0.1, 0.06]} position={[0, 0, 0]}>
            <meshBasicMaterial color="#666666" />
          </Box>
          {/* 자물쇠 고리 */}
          <Box args={[0.15, 0.05, 0.05]} position={[0, 0.15, 0]}>
            <meshBasicMaterial color="#333333" />
          </Box>
        </group>

        {/* 고정 상태 텍스트 표시 */}
        <Box args={[0.8, 0.08, 0.01]} position={[0, item.footprint.height + 1.2, 0]}>
          <meshBasicMaterial color="#ffd700" transparent opacity={0.9} />
        </Box>
      </group>
    );
  };

    // 선택 표시기 렌더링 (개선된 버전)
  const renderSelectionIndicator = () => {
    if (!isSelected || !isEditMode || item.isLocked) return null;

    const isTouching = isTouchMode;
    const indicatorColor = isTouching ? '#f97316' : '#3b82f6'; // 터치 중 주황색, 일반 선택 파란색
    const indicatorOpacity = isTouching ? 1.0 : 0.8; // 일반 선택은 약간 투명도 유지

    return (
      <group>
        {/* 선택 바운딩 박스 - 윤곽선만 표기 (면 비표시) */}
        <mesh
          position={[0, item.footprint.height / 2, 0]}
          renderOrder={2}
        >
          <boxGeometry args={[item.footprint.width + 0.05, item.footprint.height + 0.05, item.footprint.depth + 0.05]} />
          {/* 면은 투명 처리 */}
          <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
          {/* 윤곽선만 그리기 */}
          <Edges color={indicatorColor} />
        </mesh>

        {/* 편집 가능 표시 - 더 큰 크기 */}
        <mesh position={[0, item.footprint.height + 0.4, 0]}>
          <sphereGeometry args={[isTouching ? 0.18 : 0.12, 10, 10]} />
          <meshBasicMaterial color={isTouching ? '#f97316' : '#10b981'} />
        </mesh>

        {/* 편집 상태 강조 표시 - 바닥에 원형 마커 */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[item.footprint.width / 2 + 0.15, item.footprint.width / 2 + 0.15, 0.08, 12]} />
          <meshBasicMaterial
            color={isTouching ? '#f97316' : '#10b981'}
            transparent={true}
            opacity={0.6}
          />
        </mesh>

        {/* 터치 모드 표시 (모바일 전용) */}
        {isMobile && (
          <group position={[0, item.footprint.height + 0.7, 0]}>
            <Box args={[0.4, 0.03, 0.01]} position={[0, 0, 0]}>
              <meshBasicMaterial color="#f97316" transparent opacity={0.8} />
            </Box>
            <Box args={[0.1, 0.1, 0.01]} position={[0.15, 0, 0]}>
              <meshBasicMaterial color="#f97316" transparent opacity={0.8} />
            </Box>
          </group>
        )}

        {/* 편집 모드 텍스트 표시를 위한 마커 */}
        <Box args={[0.4, 0.06, 0.01]} position={[0, item.footprint.height + 0.6, 0]}>
          <meshBasicMaterial color={isTouching ? '#f97316' : '#10b981'} transparent opacity={0.7} />
        </Box>
      </group>
    );
  };

  // 배치 모드 표시기 렌더링
  const renderPlacementModeIndicator = () => {
    if (!isPlacementMode || !model) return null;

    return (
      <group>
        {/* 배치 모드 바운딩 박스 (주황색) */}
        <Box
          args={[item.footprint.width + 0.15, item.footprint.height + 0.15, item.footprint.depth + 0.15]}
          position={[0, item.footprint.height / 2, 0]}
          visible={true}
        >
          <meshBasicMaterial
            color="#f97316" // 주황색
            wireframe={true}
            transparent={true}
            opacity={0.7}
          />
        </Box>

        {/* 배치 중 표시 (주황색 원) */}
        <mesh position={[0, item.footprint.height + 0.4, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>

        {/* 움직이는 화살표 표시 */}
        <group position={[0, item.footprint.height + 0.6, 0]}>
          <Box args={[0.4, 0.03, 0.01]} position={[0, 0, 0]}>
            <meshBasicMaterial color="#f97316" transparent opacity={0.8} />
          </Box>
          <Box args={[0.1, 0.1, 0.01]} position={[0.15, 0, 0]}>
            <meshBasicMaterial color="#f97316" transparent opacity={0.8} />
          </Box>
        </group>
      </group>
    );
  };

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <group
        ref={meshRef}
        position={safePosition(item.position)}
        rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
        scale={[item.scale.x, item.scale.y, item.scale.z]}
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
        rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
        scale={[item.scale.x, item.scale.y, item.scale.z]}
      >
        <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
          <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
        </Box>
      </group>
    );
  }

  return (
    <>
      {/* 실제 오브젝트 그룹 - 포인터 이벤트 전파 방지 및 범위 최소화 */}
      <group
        ref={meshRef}
        onClick={handleClick}
        onPointerDown={(e) => { /* e.stopPropagation() */ }}
        onPointerMove={(e) => { /* e.stopPropagation() */ }}
        onPointerUp={(e) => { /* e.stopPropagation() */ }}
        onPointerOver={handlePointerEnter}
        onPointerOut={handlePointerLeave}
        onWheel={(e) => { /* e.stopPropagation() */ }}
        visible={isVisible}
      >
        {/* 3D 모델 - 실제 조작이 필요한 요소에만 포인터 이벤트 활성화 */}
        {model && (
          <primitive
            object={model}
            onPointerDown={(e: any) => { /* e.stopPropagation() */ }}
            onPointerMove={(e: any) => { /* e.stopPropagation() */ }}
            onPointerUp={(e: any) => { /* e.stopPropagation() */ }}
            onPointerOver={(e: any) => { /* e.stopPropagation() */ }}
            onPointerOut={(e: any) => { /* e.stopPropagation() */ }}
            onWheel={(e: any) => { /* e.stopPropagation() */ }}
          />
        )}

        {/* 배치 모드 표시기 */}
        {renderPlacementModeIndicator()}

        {/* 선택 표시기 */}
        {renderSelectionIndicator()}

        {/* 바운딩 박스 */}
        {renderBoundingBox()}

        {/* 고정 표시기 */}
        {renderLockIndicator()}
        
        {/* 호버 효과 */}
        {isHovered && !isPlacementMode && (
          <Box args={[item.footprint.width, item.footprint.height, item.footprint.depth]}>
            <meshBasicMaterial color="#ffff00" transparent opacity={0.2} />
          </Box>
        )}
      </group>

      {/* 모바일 터치 핸들러 - 모바일 환경에서만 활성화 */}
      {/* {isTouchMode && meshRef.current && (
        <MobileTouchHandler
          target={meshRef.current}
          enabled={isSelected && isEditMode && !item.isLocked}
          onTransform={handleTouchTransform}
          sensitivity={{ pan: 1, pinch: 1, rotate: 1 }}
        />
      )} */}

      {/* TransformControls - 데스크톱 환경에서만 활성화 */}
      {!isMobile && isSelected && isEditMode && !item.isLocked && meshRef.current && (
        <TransformControls
          ref={transformControlsRef}
          object={meshRef.current}
          mode={tool === 'rotate' ? 'rotate' : tool === 'scale' ? 'scale' : 'translate'}
          onObjectChange={handleTransformChange}
          onMouseUp={handleTransformEnd}
          onMouseDown={() => {
            try { useEditorStore.getState().beginDraggingItem(item.id); } catch {}
          }}
          // 키보드 단축키 비활성화
          showX={true}
          showY={true}
          showZ={true}
          space="world"
          size={0.75}
        />
      )}

      {/* 색상 변경 UI - 선택된 상태에서만 표시 */}
      {isSelected && isEditMode && (
        <Html>
          <div className={`absolute top-4 left-4 bg-white rounded-lg shadow-lg z-50 transition-all duration-300 ${
            isColorPanelExpanded ? 'p-4 min-w-[200px]' : 'p-2 min-w-[40px]'
          }`}>
            {/* 색상 패널 헤더 - 접기/펼치기 버튼 */}
            <button
              onClick={toggleColorPanel}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-all duration-200 w-full"
              title={isColorPanelExpanded ? '색상 패널 접기' : '색상 패널 펼치기'}
            >
              <span className="text-base">🎨</span>
              {isColorPanelExpanded && (
                <span className="transition-all duration-200">색상 변경</span>
              )}
              <span className={`text-xs transition-transform duration-200 ${isColorPanelExpanded ? 'rotate-0' : 'rotate-180'}`}>
                ▼
              </span>
            </button>
            
            {/* 색상 선택 영역 - 접기/펼치기 상태에 따라 표시 */}
            <div className={`overflow-hidden transition-all duration-300 ${isColorPanelExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
              <div className="flex flex-wrap gap-2 mb-2">
                {predefinedColors.map((colorOption) => (
                  <button
                    key={colorOption.color}
                    onClick={() => handleColorChange(colorOption.color)}
                    className={`w-8 h-8 rounded border-2 transition-all duration-200 ${
                      currentColor === colorOption.color ? 'border-blue-500 scale-110' : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: colorOption.color }}
                    title={colorOption.name}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  handleColorReset();
                  handleModelColorReset();
                }}
                className="text-xs text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                🔄 원본으로 복원
              </button>
            </div>
          </div>
        </Html>
      )}
    </>
  );
};

export default EditableFurniture;
