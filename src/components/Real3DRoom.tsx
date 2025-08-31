'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';
import {
  CameraControls,
  ContactShadows,
  AdaptiveDpr,
  AdaptiveEvents
} from '@react-three/drei';
import * as THREE from 'three';
import { Vector3, Euler } from 'three';
import Room from './features/room/Room';
import RoomBoundaryVisualizer from './features/room/RoomBoundaryVisualizer';
import RoomSizeSettings from './features/room/RoomSizeSettings';
import { updateRoomDimensions, isFurnitureInRoom, constrainFurnitureToRoom } from '../utils/roomBoundary';


import EnhancedFurnitureCatalog from './features/furniture/EnhancedFurnitureCatalog';
import GridSystem from './features/editor/GridSystem';
import DraggableFurniture from './features/furniture/DraggableFurniture';
import EditToolbar from './layout/EditToolbar';
import RoomTemplateSelector from './features/room/RoomTemplateSelector';
import { PerformanceMonitor } from './shared/PerformanceMonitor';
import TouchControls from './features/editor/TouchControls';
import { useEditorMode, setMode, usePlacedItems, useSelectedItemId, updateItem, removeItem, selectItem, addItem, clearAllItems } from '../store/editorStore';

interface Real3DRoomProps {
  shadowMode?: 'baked' | 'realtime';
  isViewLocked: boolean;
  isEditMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

import { FurnitureItem } from '../types/furniture';
import { createPlacedItemFromFurniture, sampleFurniture } from '../data/furnitureCatalog';
import { applyRoomTemplate, RoomTemplate } from '../data/roomTemplates';


// 카메라 컨트롤러 컴포넌트
function CameraController({
  isViewLocked,
  controlsRef
}: {
  isViewLocked: boolean;
  controlsRef: React.RefObject<import('camera-controls').default | null>;
}) {
  const { camera } = useThree();

  // 시점 고정 시 이동할 위치와 시점
  const lockedPosition: [number, number, number] = [8.11, 5.38, 7.02];
  const lockedLookAt: [number, number, number] = [0, 0, 0];

  // 카메라 위치 모니터링 (1초마다 콘솔에 출력)
  const lastLogTime = useRef<number>(0);

  // controlsRef를 부모 컴포넌트의 ref에 연결
  useEffect(() => {
    if (controlsRef.current) {
      // controlsRef.current를 부모의 cameraControlsRef에 연결하는 로직은 필요 없음
      // 이미 파라미터로 전달받은 controlsRef를 사용하므로
    }
  }, []);

  useFrame(() => {
    // Y축 위치 제한 (너무 낮게 내려가지 않도록)
    const minY = 0.5;
    if (camera.position.y < minY) {
      camera.position.y = minY;
      console.log('⚠️ Y축 제한: 카메라가 너무 낮게 내려가지 않도록 제한됨 (y >= 0.5)');
    }

    const now = Date.now();
    if (now - lastLogTime.current > 1000) { // 1초마다 로그
      const position = camera.position;
      const rotation = camera.rotation;

      console.log('🎥 카메라 위치:', {
        position: {
          x: position.x.toFixed(2),
          y: position.y.toFixed(2),
          z: position.z.toFixed(2)
        },
        rotation: {
          x: (rotation.x * 180 / Math.PI).toFixed(1) + '°',
          y: (rotation.y * 180 / Math.PI).toFixed(1) + '°',
          z: (rotation.z * 180 / Math.PI).toFixed(1) + '°'
        }
      });

      lastLogTime.current = now;
    }
  });

  useEffect(() => {
    if (isViewLocked && controlsRef.current) {
      // 시점 고정: 즉시 카메라 조작 비활성화
      console.log('🔒 시점 고정 모드: 카메라 조작 즉시 비활성화');
      controlsRef.current.enabled = false;

      // CameraControls 설정
      controlsRef.current.smoothTime = 1.0;        // 1초 동안 전환
      controlsRef.current.maxSpeed = 3;            // 과속 방지

      // 부드러운 전환으로 목표 위치로 이동
      controlsRef.current.setLookAt(
        lockedPosition[0], lockedPosition[1], lockedPosition[2],
        lockedLookAt[0], lockedLookAt[1], lockedLookAt[2],
        true  // 부드러운 전이 활성화
      ).then(() => {
        console.log('✅ 시점 고정 완료: 목표 위치 도달 (카메라 조작 비활성화 상태 유지)');
      });

    } else if (!isViewLocked && controlsRef.current) {
      // 시점 해제: 사용자가 자유롭게 카메라 조작 가능
      console.log('🎯 시점 자유 모드: 카메라 조작 활성화');

      // 카메라 조작 활성화
      controlsRef.current.enabled = true;
    }
  }, [isViewLocked]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      // 카메라 제한 설정
      minDistance={1.0}
      maxDistance={12}
      maxPolarAngle={Math.PI * 0.85}
      minPolarAngle={Math.PI * 0.15}
      // 부드러운 움직임 설정
      smoothTime={0.08}
      maxSpeed={3}
    />
  );
}

export default function Real3DRoom({
  shadowMode,
  isViewLocked,
  isEditMode: externalEditMode,
  onEditModeChange
}: Real3DRoomProps) {
  const [showTransitionEffect, setShowTransitionEffect] = useState(false);
  const [showFurnitureCatalog, setShowFurnitureCatalog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showRoomSizeSettings, setShowRoomSizeSettings] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

  // 모바일 환경 감지
  const [isMobile, setIsMobile] = useState(false);

  // 성능 최적화 상태
  const [performanceOptimizationEnabled] = useState(true);



  // 메모리 관리 상태
  const cleanupRefs = useRef<Set<() => void>>(new Set());

  // 가구 배치 관련 상태
  const [isPlacingFurniture, setIsPlacingFurniture] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem | null>(null);

  // DPR 고정 범위 계산 (편집 모드의 흐릿함 방지)
  const deviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const minDpr = 1;
  const maxDpr = Math.min(2, deviceDpr);

  useEffect(() => {
    const checkMobile = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(navigator.userAgent) || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 편집 스토어에서 상태 가져오기
  const storeEditMode = useEditorMode();
  const placedItems = usePlacedItems();
  const selectedItemId = useSelectedItemId();

  // 카메라 컨트롤러 ref
  const cameraControlsRef = useRef<import('camera-controls').default>(null);

  // 템플릿 적용 핸들러
  const handleTemplateSelect = async (template: RoomTemplate) => {
    try {
      setIsApplyingTemplate(true);
      console.log('🎯 템플릿 적용 시작:', template.metadata.nameKo);

      // 기존 객체들 모두 제거
      clearAllItems();

      // 템플릿 적용
      const result = await applyRoomTemplate(template);

      // 새로운 객체들 추가
      result.placedItems.forEach(item => {
        addItem(item);
      });

      // 카메라 위치 설정
      if (cameraControlsRef.current) {
        cameraControlsRef.current.setLookAt(
          template.environment.cameraPosition.x,
          template.environment.cameraPosition.y,
          template.environment.cameraPosition.z,
          template.environment.cameraTarget.x,
          template.environment.cameraTarget.y,
          template.environment.cameraTarget.z,
          true
        );
      }

      console.log(`✅ 템플릿 적용 완료: ${result.placedItems.length}개 객체 배치`);
      setShowTemplateSelector(false);

    } catch (error) {
      console.error('❌ 템플릿 적용 실패:', error);
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  // 외부 편집 모드 상태와 편집 스토어 상태를 동기화
  const [isEditMode, setIsEditMode] = useState(externalEditMode ?? (storeEditMode === 'edit'));

  // 시점 전환 시 효과 표시
  useEffect(() => {
    if (isViewLocked) {
      setShowTransitionEffect(true);
      const timer = setTimeout(() => setShowTransitionEffect(false), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isViewLocked]);

  // 편집모드 변경 시 가구 카탈로그 상태 관리 - 외부 모드 우선
  useEffect(() => {
    if (externalEditMode !== undefined) {
      // 외부에서 편집 모드 제어하는 경우
      if (externalEditMode) {
        // 편집 모드 진입 시 가구 카탈로그는 기본적으로 닫힌 상태로 시작
        setShowFurnitureCatalog(false);
      } else {
        setShowFurnitureCatalog(false);
      }
    } else {
      // 스토어 모드 사용하는 경우
      if (storeEditMode === 'edit') {
        // 편집 모드 진입 시 가구 카탈로그는 기본적으로 닫힌 상태로 시작
        setShowFurnitureCatalog(false);
      } else {
        setShowFurnitureCatalog(false);
      }
    }
  }, [externalEditMode, storeEditMode]);

  // 메모리 관리 및 정리
  useEffect(() => {
    // 메모리 사용량 모니터링 (로깅만)
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usageMB = memory.usedJSHeapSize / (1024 * 1024); // MB 단위
        console.log(`📊 현재 메모리 사용량: ${usageMB.toFixed(2)} MB`);
      }
    };

    const memoryInterval = setInterval(updateMemoryUsage, 5000); // 5초마다 업데이트

    // 컴포넌트 언마운트 시 정리 함수 등록
    const cleanup = () => {
      console.log('🧹 Real3DRoom 컴포넌트 메모리 정리 시작');

      // 등록된 정리 함수들 실행 (자기 자신은 제외)
      cleanupRefs.current.forEach(cleanupFn => {
        try {
          // cleanup 함수 자신은 이미 useEffect return에서 실행되므로 제외
          if (cleanupFn !== cleanup) {
            cleanupFn();
          }
        } catch (error) {
          console.warn('정리 함수 실행 중 오류:', error);
        }
      });

      // 메모리 사용량 로그
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('📊 최종 메모리 사용량:', {
          used: `${(memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)} MB`,
          total: `${(memory.totalJSHeapSize / (1024 * 1024)).toFixed(2)} MB`,
          limit: `${(memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)} MB`
        });
      }
    };

    // 정리 함수 등록 (cleanup 함수는 직접 실행되므로 Set에 추가하지 않음)
    // cleanupRefs.current.add(cleanup);

    return () => {
      clearInterval(memoryInterval);
      cleanup();
    };
  }, []);

  const handleEditModeToggle = () => {
    const newMode = !isEditMode;
    setIsEditMode(newMode);

    // editorStore의 mode도 함께 변경
    setMode(newMode ? 'edit' : 'view');

    if (onEditModeChange) {
      onEditModeChange(newMode);
    }

    // 편집 모드 전환 시 상태 초기화
    if (newMode) {
      // 편집 모드 진입
      if (externalEditMode !== undefined) {
        // 외부 제어 모드 사용하는 경우
        if (externalEditMode) {
          // 편집 모드 진입 시 가구 카탈로그는 기본적으로 닫힌 상태
          setShowFurnitureCatalog(false);
        }
      } else {
        // 스토어 모드 사용하는 경우
        if (storeEditMode === 'edit') {
          // 편집 모드 진입 시 가구 카탈로그는 기본적으로 닫힌 상태
          setShowFurnitureCatalog(false);
        }
      }
    } else {
      // 편집 모드 종료 시 모든 상태 초기화
      setShowFurnitureCatalog(false);
      setIsPlacingFurniture(false);
      setSelectedFurniture(null);
    }
  };

  const handleFurnitureSelect = (item: FurnitureItem) => {
    console.log('가구 선택됨:', item);

    // 메모리 사용량 확인
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usageMB = memory.usedJSHeapSize / (1024 * 1024);
      console.log(`📊 현재 메모리 사용량: ${usageMB.toFixed(2)} MB`);

      // 메모리 사용량이 높으면 경고
      if (usageMB > 100) {
        console.warn('⚠️ 메모리 사용량이 높습니다. 불필요한 객체를 정리하세요.');
      }
    }

    // 가구 배치 모드로 전환
    setIsPlacingFurniture(true);
    setSelectedFurniture(item);

    // 기존 배치된 가구들의 위치를 고려하여 적절한 위치 계산
    const existingItems = placedItems;
    let position = new Vector3(0, 0, 0);

    // 기본 위치에서 벗어난 랜덤한 위치로 배치하여 충돌 방지
    if (existingItems.length > 0) {
      console.log('🔍 기존 가구 위치 확인:', existingItems.map(item => ({
        id: item.id,
        position: { x: item.position.x, y: item.position.y, z: item.position.z }
      })));

      // 🏠 카테고리별 배치 전략
      const getPlacementStrategy = (category: string) => {
        switch (category) {
          case 'sofa':
          case 'chair':
          case 'table':
            return 'center'; // 중앙 영역
          case 'bed':
            return 'wall'; // 벽면
          case 'cabinet':
          case 'shelf':
          case 'bookcase':
            return 'wall'; // 벽면
          case 'lamp':
          case 'plant':
            return 'corner'; // 구석
          case 'rug':
            return 'center'; // 중앙
          default:
            return 'smart'; // 스마트 배치
        }
      };

      const placementStrategy = getPlacementStrategy(item.category);
      console.log(`🎯 ${item.nameKo} (${item.category}) 배치 전략: ${placementStrategy}`);

      // 기존 가구들의 평균 위치 계산 (원본 객체 변경 방지)
      const avgPosition = existingItems.reduce((acc, item) => {
        const itemPositionCopy = new Vector3().copy(item.position);
        console.log(`📐 가구 ${item.id} 위치 복사:`, {
          원본: { x: item.position.x, y: item.position.y, z: item.position.z },
          복사본: { x: itemPositionCopy.x, y: itemPositionCopy.y, z: itemPositionCopy.z }
        });
        return acc.add(itemPositionCopy);
      }, new Vector3(0, 0, 0)).divideScalar(existingItems.length);

      console.log('🎯 계산된 평균 위치:', { x: avgPosition.x, y: avgPosition.y, z: avgPosition.z });

      // 카테고리별 배치 전략에 따른 위치 계산
      if (placementStrategy === 'wall') {
        // 벽면에 배치 - 가장 가까운 벽 선택
        const wallPositions = [
          new Vector3(0, 0, -4.5), // 북쪽 벽
          new Vector3(4.5, 0, 0),  // 동쪽 벽
          new Vector3(0, 0, 4.5),  // 남쪽 벽
          new Vector3(-4.5, 0, 0)  // 서쪽 벽
        ];

        // 가장 가까운 벽 찾기
        let closestWall = wallPositions[0];
        let minWallDistance = Infinity;

        wallPositions.forEach(wall => {
          const distance = wall.distanceTo(avgPosition);
          if (distance < minWallDistance) {
            minWallDistance = distance;
            closestWall = wall;
          }
        });

        // 벽에서 약간 안쪽에 배치
        if (closestWall) {
          const wallOffset = 0.5;
          position = closestWall.clone().multiplyScalar(1 - wallOffset / 4.5);

          // 벽을 따라 랜덤하게 이동
          if (Math.abs(closestWall.x) > Math.abs(closestWall.z)) {
            // 동/서쪽 벽
            position.z = (Math.random() - 0.5) * 6;
          } else {
            // 남/북쪽 벽
            position.x = (Math.random() - 0.5) * 6;
          }
        }
      } else if (placementStrategy === 'corner') {
        // 구석에 배치 - 가장 비어있는 구석 선택
        const cornerPositions = [
          new Vector3(3.5, 0, -3.5), // 북동
          new Vector3(3.5, 0, 3.5),  // 남동
          new Vector3(-3.5, 0, 3.5), // 남서
          new Vector3(-3.5, 0, -3.5) // 북서
        ];

        // 가장 비어있는 구석 찾기
        let bestCorner = cornerPositions[0];
        let maxCornerDistance = 0;

        cornerPositions.forEach(corner => {
          const minDistance = Math.min(...existingItems.map(item =>
            corner.distanceTo(new Vector3(item.position.x, item.position.y, item.position.z))
          ));
          if (minDistance > maxCornerDistance) {
            maxCornerDistance = minDistance;
            bestCorner = corner;
          }
        });

        if (bestCorner) {
          position = bestCorner.clone();
        }
      } else {
        // 중앙 영역에 배치 (기본 로직)
        const angle = Math.random() * Math.PI * 2;
        const distance = 2 + Math.random() * 3; // 2-5m 거리
        position = new Vector3(
          avgPosition.x + Math.cos(angle) * distance,
          0, // 바닥에 배치
          avgPosition.z + Math.sin(angle) * distance
        );
      }
    } else {
      // 첫 번째 가구는 정확히 중앙에 배치
      position = new Vector3(0, 0, 0);
    }

    // 편집 스토어에 가구 추가 (createPlacedItemFromFurniture 함수 사용으로 일관성 유지)
    const newPlacedItem = createPlacedItemFromFurniture(
      item,
      position, // 계산된 적절한 위치
      new Euler(0, 0, 0),   // 기본 회전
      new Vector3(1, 1, 1)   // 기본 크기
    );

    // 기본적으로 객체는 고정되지 않은 상태로 설정
    newPlacedItem.isLocked = false;

    // 편집 스토어에 추가
    addItem(newPlacedItem);
    console.log('새 가구 배치:', newPlacedItem);
  };

  // 가구 선택 핸들러 - null 값도 처리할 수 있도록 수정
  const handleFurnitureSelectInScene = (id: string | null) => {
    if (id === null) {
      // 선택 해제
      selectItem(null);
    } else {
      // 선택
      selectItem(id);
    }
  };

  // 가구 업데이트 핸들러
  const handleFurnitureUpdate = (id: string, updates: any) => {
    updateItem(id, updates);
  };

  // 가구 삭제 핸들러
  const handleFurnitureDelete = (id: string) => {
    removeItem(id);
  };

  // 가구 배치 완료 핸들러
  const handleFurniturePlaced = () => {
    setIsPlacingFurniture(false);
    setSelectedFurniture(null);
    console.log('가구 배치가 완료되었습니다.');
  };

  const handleToggleFurnitureCatalog = () => {
    setShowFurnitureCatalog(!showFurnitureCatalog);
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 z-10">
      {/* 우측 상단 룸 편집 버튼 */}
      <motion.button
        onClick={handleEditModeToggle}
        className={`absolute top-4 right-4 z-50 px-4 py-2 rounded-lg font-medium shadow-lg transition-all duration-200 ${
          isEditMode
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }`}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <span>👁️</span>
              <span>보기 모드</span>
            </>
          ) : (
            <>
              <span>✏️</span>
              <span>룸 편집</span>
            </>
          )}
        </div>
      </motion.button>

      <Canvas
        shadows
        camera={{ position: [4.5, 3.0, 4.5], fov: 40 }}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance'
        }}
        dpr={[minDpr, maxDpr]}
        className="w-full h-full block absolute top-0 left-0"
        style={{
          backgroundColor: '#f8fafc',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#f8fafc', 1);
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          scene.background = new THREE.Color('#f8fafc');

          // 추가 배경색 설정
          const context = gl.getContext();
          if (context) {
            context.clearColor(0.973, 0.98, 0.988, 1.0);
            context.clear(context.COLOR_BUFFER_BIT);
          }
        }}
      >
        {/* 카메라 컨트롤러 */}
        <CameraController
          isViewLocked={isViewLocked}
          controlsRef={cameraControlsRef}
        />

        {/* 배경색 설정 */}
        <color attach="background" args={['#f8fafc']} />

        {/* 조명 */}
        <ambientLight intensity={0.6} color="#ffffff" />
        <hemisphereLight
          args={['#87CEEB', '#C0C0C0', 0.4]}
        />
        <directionalLight
          castShadow
          position={[5, 10, 5]}
          intensity={0.8}
          color="#ffffff"
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* 3D 룸 */}
        <Room receiveShadow={shadowMode === 'realtime'} />

        {/* 방 경계 시각화 - 편집 모드에서만 표시 */}
        {isEditMode && (
          <RoomBoundaryVisualizer 
            visible={true} 
            color="#ff6b6b" 
            lineWidth={2} 
          />
        )}

        {/* 성능 모니터링 */}
        <PerformanceMonitor
          enabled={performanceOptimizationEnabled}
          position={[0, 5, 0]}
          showDetails={false}
        />

        {/* 그리드 시스템 - 편집 모드에서만 표시 */}
        {isEditMode && <GridSystem size={10} divisions={10} color="#888888" />}



        {/* 배치된 가구들 - 편집 모드와 뷰 모드 모두에서 표시 */}
        {placedItems.map((item) => (
          <DraggableFurniture
            key={item.id}
            item={item}
            isSelected={selectedItemId === item.id}
            isEditMode={isEditMode}
            onSelect={handleFurnitureSelectInScene}
            onUpdate={handleFurnitureUpdate}
            onDelete={handleFurnitureDelete}
          />
        ))}

        {/* 그림자 */}
        <ContactShadows
          opacity={0.35}
          scale={10}
          blur={2.5}
          far={4.5}
        />

        {/* 편집 모드나 모바일에서는 AdaptiveDpr 비활성화하여 흐릿함 방지 */}
        {!isEditMode && !isMobile && (
          <AdaptiveDpr pixelated={false} />
        )}
        <AdaptiveEvents />
      </Canvas>

      {/* 시점 전환 효과 */}
      {showTransitionEffect && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 pointer-events-none transition-opacity duration-1000" />
      )}

      {/* 모바일 터치 컨트롤 - Canvas 외부에 배치 */}
      <TouchControls
        enabled={isMobile && isEditMode}
        onPinch={(scale) => {
          // 카메라 줌 컨트롤
          if (cameraControlsRef.current) {
            const currentDistance = cameraControlsRef.current.distance;
            cameraControlsRef.current.distance = Math.max(1, Math.min(20, currentDistance / scale));
          }
        }}
        onRotate={(angle) => {
          // 선택된 객체 회전
          if (selectedItemId) {
            const item = placedItems.find(item => item.id === selectedItemId);
            if (item) {
              const newRotation = new Euler(
                item.rotation.x,
                item.rotation.y + angle, // Y축 회전
                item.rotation.z,
                item.rotation.order
              );
              updateItem(selectedItemId, { rotation: newRotation });
            }
          }
        }}
        onPan={(x, y) => {
          // 카메라 이동 또는 객체 이동
          if (selectedItemId && isEditMode) {
            // 선택된 객체 이동
            const item = placedItems.find(item => item.id === selectedItemId);
            if (item) {
              const newPosition = new Vector3(
                item.position.x + (x - window.innerWidth / 2) * 0.01,
                item.position.y,
                item.position.z + (y - window.innerHeight / 2) * 0.01
              );
              updateItem(selectedItemId, { position: newPosition });
            }
          }
        }}
        onDoubleTap={(x, y) => {
          // 더블 탭으로 객체 선택/해제
          // 이 기능은 추후 구현
          console.log('Double tap at:', x, y);
        }}
      />

      {/* 모두 삭제 버튼 - 편집 모드에서만 표시 */}
      {isEditMode && placedItems.length > 0 && (
        <button
          onClick={() => {
            if (window.confirm(`${placedItems.length}개의 객체를 모두 삭제하시겠습니까?`)) {
              clearAllItems();
              console.log('모든 객체가 삭제되었습니다.');
            }
          }}
          className="absolute bottom-4 right-4 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold transition-all duration-300 shadow-2xl hover:from-red-700 hover:to-red-800 hover:scale-105 border-2 border-red-800 z-[9999] flex items-center gap-2"
        >
          <span className="text-lg">🗑️</span>
          <span>모든 객체 삭제 ({placedItems.length}개)</span>
        </button>
      )}

              {/* 편집 도구바 - 편집 모드에서만 표시 */}
        {isEditMode && (
          <EditToolbar
            onToggleFurnitureCatalog={handleToggleFurnitureCatalog}
            showFurnitureCatalog={showFurnitureCatalog}
            onToggleTemplateSelector={() => setShowTemplateSelector(!showTemplateSelector)}
            showTemplateSelector={showTemplateSelector}
            onToggleRoomSizeSettings={() => setShowRoomSizeSettings(!showRoomSizeSettings)}
            isMobile={isMobile}
          />
        )}

      {/* 가구 카탈로그 하단 패널 - 화면 하단 2/3 차지 */}
      {isEditMode && showFurnitureCatalog && (
        <motion.div
          initial={{ transform: 'translateY(100%)' }}
          animate={{ transform: 'translateY(0)' }}
          exit={{ transform: 'translateY(100%)' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 right-0 w-full bg-white border-t-2 border-blue-200 overflow-hidden shadow-2xl flex flex-col h-[66vh] z-[9999] bottom-0"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 border-b-2 border-blue-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-bold">
                  {isPlacingFurniture ? '🎯 가구배치중' : '🪑 가구라이브러리'}
                </h3>
                                  <p className="text-blue-100 text-xs mt-1">
                    {isPlacingFurniture
                      ? `${selectedFurniture?.nameKo || selectedFurniture?.name} 배치 (ESC취소)`
                      : '편집할 가구 선택'
                    }
                  </p>
              </div>
              <button
                onClick={handleToggleFurnitureCatalog}
                data-testid="close-furniture-catalog"
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110 ml-3"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>
          </div>
          <div className="bg-white flex-1 p-2 min-h-0">
            <EnhancedFurnitureCatalog
              furnitureData={sampleFurniture}
              onFurnitureSelect={handleFurnitureSelect}
              onClose={() => setShowFurnitureCatalog(false)}
              isMobile={true}
            />
          </div>
        </motion.div>
      )}

              {/* 가구 배치 완료 버튼 - 배치 모드에서만 표시 (우측 최상단) */}
        {isPlacingFurniture && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={handleFurniturePlaced}
            className="fixed top-4 right-4 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl font-bold transition-all duration-300 shadow-2xl hover:from-green-700 hover:to-green-800 hover:scale-105 border-2 border-green-800 z-[99999] flex items-center gap-2"
          >
            <span className="text-lg">✅</span>
            <span>배치 완료</span>
          </motion.button>
        )}

        {/* 방 크기 설정 모달 */}
        <RoomSizeSettings
          isOpen={showRoomSizeSettings}
          onClose={() => setShowRoomSizeSettings(false)}
          onRoomSizeChange={(dimensions) => {
            console.log('🏠 방 크기 변경:', dimensions);
            // 방 크기 업데이트
            updateRoomDimensions(dimensions);
            
            // 기존 가구들이 새로운 방 크기에 맞는지 검증하고 필요시 이동
            placedItems.forEach(item => {
              if (!isFurnitureInRoom(item)) {
                console.log(`🚨 방 크기 변경 후 가구가 벽 밖으로 나감: ${item.name || item.id}`);
                const constrainedItem = constrainFurnitureToRoom(item);
                updateItem(item.id, { position: constrainedItem.position });
              }
            });
          }}
        />

      {/* 하단 카테고리 탭 - 편집 모드에서만 표시 (일시적으로 비활성화) */}
      {/* {isEditMode && (
        <BottomCategoryTabs
          categoryCounts={{}}
        />
      )} */}

      {/* 룸 템플릿 선택기 */}
      {showTemplateSelector && (
        <RoomTemplateSelector
          onTemplateSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {/* 템플릿 적용 중 로딩 오버레이 */}
      {isApplyingTemplate && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <div>
              <p className="font-medium text-sm">템플릿 적용중...</p>
              <p className="text-xs text-gray-600">잠시만 기다려주세요</p>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
