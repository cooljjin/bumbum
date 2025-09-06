'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// 클라이언트 사이드에서만 실행되는 컴포넌트들
import { AdaptiveEvents } from '@react-three/drei';
// const ContactShadows = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.ContactShadows })), { 
//   ssr: false,
//   loading: () => null
// });
import { motion } from 'framer-motion';
import { Vector3, Euler } from 'three';
// 클라이언트 사이드에서만 실행되는 컴포넌트들
const Room = dynamic(() => import('./features/room/Room'), { 
  ssr: false,
  loading: () => null
});
// const RoomBoundaryVisualizer = dynamic(() => import('./features/room/RoomBoundaryVisualizer'), { 
//   ssr: false,
//   loading: () => null
// });
const RoomSizeSettings = dynamic(() => import('./features/room/RoomSizeSettings'), { 
  ssr: false,
  loading: () => null
});
const EnhancedFurnitureCatalog = dynamic(() => import('./features/furniture/EnhancedFurnitureCatalog'), { 
  ssr: false,
  loading: () => null
});
const GridSystem = dynamic(() => import('./features/editor/GridSystem'), { 
  ssr: false,
  loading: () => null
});
const DraggableFurniture = dynamic(() => import('./features/furniture/DraggableFurniture').then(mod => ({ default: mod.DraggableFurniture })), { 
  ssr: false,
  loading: () => null
});
const EditToolbar = dynamic(() => import('./layout/EditToolbar'), { 
  ssr: false,
  loading: () => null
});
const RoomTemplateSelector = dynamic(() => import('./features/room/RoomTemplateSelector'), { 
  ssr: false,
  loading: () => null
});
// const PerformanceMonitor = dynamic(() => import('./shared/PerformanceMonitor').then(mod => ({ default: mod.PerformanceMonitor })), { 
//   ssr: false,
//   loading: () => null
// });
const OutlineEffect = dynamic(() => import('./shared/OutlineEffect'), { 
  ssr: false,
  loading: () => null
});
const MiniRoom = dynamic(() => import('./3D/MiniRoom'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center">3D 룸 로딩 중...</div>
});
const UnifiedCameraControls = dynamic(() => import('./3D/UnifiedCameraControls'), { 
  ssr: false,
  loading: () => null
});

import { updateRoomDimensions, isFurnitureInRoom, constrainFurnitureToRoom, getRoomBoundaries } from '../utils/roomBoundary';
import '../utils/modelSizeAnalyzer'; // 모델 크기 분석기 로드
import { useEditorMode, setMode, usePlacedItems, useSelectedItemId, updateItem, removeItem, selectItem, addItem, clearAllItems, useIsDragging } from '../store/editorStore';
import { 
  enableScrollLock, 
  disableScrollLock, 
  preventKeyScroll,
  // isIOSSafari,
  isMobile as isMobileDevice
} from '../utils/scrollLock';

interface Real3DRoomProps {
  shadowMode?: 'baked' | 'realtime';
  isViewLocked: boolean;
  isEditMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

import { FurnitureItem } from '../types/furniture';
import { PlacedItem } from '../types/editor';
import { createPlacedItemFromFurniture, sampleFurniture } from '../data/furnitureCatalog';
import { applyRoomTemplate, RoomTemplate } from '../data/roomTemplates';

// SSR 문제 해결을 위한 로딩 상태 관리
const useClientSideReady = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      setIsReady(true);
    }
  }, []);

  return isReady;
};



// 바텀시트: 카탈로그용 스냅 포인트(25/66/100%)
function BottomSheetCatalog({
  isOpen,
  onClose,
  initialSnap = 0.66,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  initialSnap?: 0.25 | 0.66 | 1.0;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [heightPx, setHeightPx] = useState(0);
  const snaps = [0.25, 0.66, 1.0];

  const vh = () => (typeof window !== 'undefined' ? window.innerHeight : 0);

  useEffect(() => {
    if (!isOpen) return;
    setHeightPx(Math.round(vh() * initialSnap));
  }, [isOpen, initialSnap]);

  // 드래그 핸들
  const dragState = useRef<{ startY: number; startH: number; dragging: boolean }>({ startY: 0, startH: 0, dragging: false });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragState.current = { startY: e.clientY, startH: heightPx, dragging: true };
  }, [heightPx]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const dy = dragState.current.startY - e.clientY; // 위로 끌면 +
    const newH = Math.max(vh() * 0.2, Math.min(vh(), dragState.current.startH + dy));
    setHeightPx(newH);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    // 스냅
    const ratio = heightPx / Math.max(1, vh());
    let nearest = snaps[0];
    let minDiff = Infinity;
    snaps.forEach(s => { const d = Math.abs(s - ratio); if (d < minDiff) { minDiff = d; nearest = s; } });
    // 아주 낮게 내리면 닫기
    if (ratio < 0.22) {
      onClose();
    } else {
      setHeightPx(Math.round(vh() * (nearest || 0.66)));
    }
  }, [heightPx]);

  if (!isOpen) return null;

  return (
    <div
      ref={sheetRef}
      className="fixed left-0 right-0 bottom-0 w-full bg-white border-t shadow-2xl z-[9999] flex flex-col"
      style={{
        height: `${heightPx}px`,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="w-full py-2 cursor-grab active:cursor-grabbing select-none"
        aria-label="시트를 드래그해서 열고 닫기"
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300" />
      </div>
      <div className="border-t border-gray-200" />
      <div className="flex-1 min-h-0 overflow-y-auto" data-scrollable="true" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' as any }}>
        {children}
      </div>
    </div>
  );
}

const Real3DRoomComponent = React.memo(({
  shadowMode,
  isViewLocked,
  isEditMode: externalEditMode,
  onEditModeChange
}: Real3DRoomProps) => {
  // isViewLocked 상태 디버깅
  console.log('🏠 Real3DRoom isViewLocked 상태:', isViewLocked);
  
  // 클라이언트 사이드 준비 상태
  const isClientReady = useClientSideReady();
  const searchParams = typeof window !== 'undefined' ? useSearchParams() : (null as any);
  const debugFreeCam = !!(searchParams && searchParams.get('freecam') === '1');
  const gestureFixScope = (searchParams && searchParams.get('gfix')) || 'canvas'; // 'canvas' | 'global'

  // 모든 useState 훅들은 항상 호출되어야 함 (React Hooks 규칙)
  // const [showTransitionEffect, setShowTransitionEffect] = useState(false); // 파란색 오버레이 효과 제거
  const [showFurnitureCatalog, setShowFurnitureCatalog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showRoomSizeSettings, setShowRoomSizeSettings] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

  // 모바일 환경 감지
  const [isMobile, setIsMobile] = useState(false);

  // 성능 최적화 상태
  // const [performanceOptimizationEnabled] = useState(true);

  // 메모리 관리 상태
  const cleanupRefs = useRef<Set<() => void>>(new Set());

  // 가구 배치 관련 상태
  const [isPlacingFurniture, setIsPlacingFurniture] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem | null>(null);

  // DPR 고정 범위 계산은 MiniRoom에서 처리됨

  // 편집 스토어에서 상태 가져오기
  const storeEditMode = useEditorMode();
  const placedItems = usePlacedItems();
  const selectedItemId = useSelectedItemId();
  const isDragging = useIsDragging();

  // 시점 고정 전환 중 입력 락 상태
  const [isTransitionInputLocked, setIsTransitionInputLocked] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // iOS Safari: 전역 제스처 차단은 opt-in (gfix=global). 기본은 캔버스 내부에서만 차단
  useEffect(() => {
    if (!isMobile || gestureFixScope !== 'global') return undefined;
    const prevent = (e: Event) => { e.preventDefault(); };
    const opts = { passive: false, capture: true } as AddEventListenerOptions;
    document.addEventListener('gesturestart', prevent, opts);
    document.addEventListener('gesturechange', prevent, opts);
    document.addEventListener('gestureend', prevent, opts);
    return () => {
      document.removeEventListener('gesturestart', prevent, { capture: true } as any);
      document.removeEventListener('gesturechange', prevent, { capture: true } as any);
      document.removeEventListener('gestureend', prevent, { capture: true } as any);
    };
  }, [isMobile, gestureFixScope]);

  // 스크롤 락 처리 - MiniRoom의 GestureOverlay가 자동으로 처리
  useEffect(() => {
    if (!isMobile) return undefined;

    if (isDragging) {
      enableScrollLock();
      document.addEventListener('keydown', preventKeyScroll, { passive: false, capture: true });

      console.log('🔒 드래그 중 스크롤 락 활성화');

      return () => {
        document.removeEventListener('keydown', preventKeyScroll, { capture: true });
        disableScrollLock();
        console.log('🔓 드래그 종료 스크롤 락 해제');
      };
    } else {
      // 드래그가 아닌 상태에서 혹시 잠겨 있으면 해제
      disableScrollLock();
      return undefined;
    }
  }, [isDragging, isMobile]);

  // 시점 전환 중 전역 입력 락 (마우스/휠/터치 모두 차단)
  useEffect(() => {
    if (!isTransitionInputLocked) return undefined;

    const prevent = (e: Event) => {
      e.preventDefault();
      // e.stopPropagation(); // 이벤트 전파 허용
    };

    enableScrollLock();
    const opts = { passive: false, capture: true } as AddEventListenerOptions;
    document.addEventListener('wheel', prevent, opts);
    document.addEventListener('touchstart', prevent as any, opts);
    document.addEventListener('touchmove', prevent as any, opts);
    document.addEventListener('touchend', prevent as any, opts);
    document.addEventListener('pointerdown', prevent as any, opts);
    document.addEventListener('pointermove', prevent as any, opts);
    document.addEventListener('pointerup', prevent as any, opts);
    document.addEventListener('gesturestart', prevent as any, opts);
    document.addEventListener('gesturechange', prevent as any, opts);
    document.addEventListener('gestureend', prevent as any, opts);

    return () => {
      document.removeEventListener('wheel', prevent as any, { capture: true } as any);
      document.removeEventListener('touchstart', prevent as any, { capture: true } as any);
      document.removeEventListener('touchmove', prevent as any, { capture: true } as any);
      document.removeEventListener('touchend', prevent as any, { capture: true } as any);
      document.removeEventListener('pointerdown', prevent as any, { capture: true } as any);
      document.removeEventListener('pointermove', prevent as any, { capture: true } as any);
      document.removeEventListener('pointerup', prevent as any, { capture: true } as any);
      document.removeEventListener('gesturestart', prevent as any, { capture: true } as any);
      document.removeEventListener('gesturechange', prevent as any, { capture: true } as any);
      document.removeEventListener('gestureend', prevent as any, { capture: true } as any);
      disableScrollLock();
    };
  }, [isTransitionInputLocked]);

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

  // 시점 전환 시 효과 표시 (파란색 오버레이 제거)
  useEffect(() => {
    if (isViewLocked) {
      // 시점 잠금 시 파란색 오버레이 효과 제거
      // setShowTransitionEffect(true);
      // const timer = setTimeout(() => setShowTransitionEffect(false), 1000);
      // return () => clearTimeout(timer);
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
    // 메모리 사용량 모니터링 (로깅 제거)
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        // const memory = (performance as any).memory;
        // const usageMB = memory.usedJSHeapSize / (1024 * 1024); // MB 단위
        // console.log(`📊 현재 메모리 사용량: ${usageMB.toFixed(2)} MB`);
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

      // 메모리 사용량 로그 제거
      // if ('memory' in performance) {
      //   const memory = (performance as any).memory;
      //   console.log('📊 최종 메모리 사용량:', {
      //     used: `${(memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)} MB`,
      //     total: `${(memory.totalJSHeapSize / (1024 * 1024)).toFixed(2)} MB`,
      //     limit: `${(memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)} MB`
      //   });
      // }
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

    // 메모리 사용량 확인 제거
    // if ('memory' in performance) {
    //   const memory = (performance as any).memory;
    //   const usageMB = memory.usedJSHeapSize / (1024 * 1024);
    //   console.log(`📊 현재 메모리 사용량: ${usageMB.toFixed(2)} MB`);

    //   // 메모리 사용량이 높으면 경고
    //   if (usageMB > 100) {
    //     console.warn('⚠️ 메모리 사용량이 높습니다. 불필요한 객체를 정리하세요.');
    //   }
    // }

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
      const getPlacementStrategy = (category: string, subcategory?: string) => {
        // 시계는 항상 벽면에 배치
        if (subcategory === 'clock') {
          return 'wall';
        }
        
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

      const placementStrategy = getPlacementStrategy(item.category, item.subcategory);
      console.log(`🎯 ${item.nameKo} (${item.category}/${item.subcategory}) 배치 전략: ${placementStrategy}`);

      // 기존 가구들의 평균 위치 계산 (원본 객체 변경 방지)
      const avgPosition = existingItems.reduce((acc, item) => {
        // NaN 값 검증 및 기본값 설정
        const safePosition = {
          x: isNaN(item.position.x) ? 0 : item.position.x,
          y: isNaN(item.position.y) ? 0 : item.position.y,
          z: isNaN(item.position.z) ? 0 : item.position.z
        };
        
        const itemPositionCopy = new Vector3(safePosition.x, safePosition.y, safePosition.z);
        console.log(`📐 가구 ${item.id} 위치 복사:`, {
          원본: { x: item.position.x, y: item.position.y, z: item.position.z },
          안전한위치: safePosition,
          복사본: { x: itemPositionCopy.x, y: itemPositionCopy.y, z: itemPositionCopy.z }
        });
        return acc.add(itemPositionCopy);
      }, new Vector3(0, 0, 0)).divideScalar(existingItems.length);

      console.log('🎯 계산된 평균 위치:', { x: avgPosition.x, y: avgPosition.y, z: avgPosition.z });

      // 카테고리별 배치 전략에 따른 위치 계산
      if (placementStrategy === 'wall') {
        // 벽면에 배치 - 가장 가까운 벽 선택 (10x10 방에 맞게 조정)
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

        // 벽면에 완전히 붙도록 배치
        if (closestWall) {
          // 벽면에 정확히 붙도록 위치 설정 (오프셋 없음)
          position = closestWall.clone();

          // 벽을 따라 랜덤하게 이동 (벽면에서 벗어나지 않도록)
          if (Math.abs(closestWall.x) > Math.abs(closestWall.z)) {
            // 동/서쪽 벽 (x축 고정, z축만 변경)
            position.z = (Math.random() - 0.5) * 8.8; // 벽면 끝까지 사용
          } else {
            // 남/북쪽 벽 (z축 고정, x축만 변경)
            position.x = (Math.random() - 0.5) * 8.8; // 벽면 끝까지 사용
          }

          // 벽면 에셋의 경우 Y축을 적절한 높이로 설정
          if (item.subcategory === 'clock' && item.placement.wallHeight) {
            position.y = item.placement.wallHeight;
            console.log(`🕐 시계 Y축 위치 설정: ${position.y}m (벽 높이)`);
          } else if (item.placement.wallOnly) {
            // 벽면 전용 에셋의 경우 기본 벽 높이 설정
            position.y = item.placement.wallHeight || 1.5; // 기본 1.5m 높이
            console.log(`🏠 벽면 에셋 Y축 위치 설정: ${position.y}m`);
          } else {
            // 일반 벽면 가구의 경우 바닥에 배치
            position.y = 0;
          }
        }
      } else if (placementStrategy === 'corner') {
        // 구석에 배치 - 가장 비어있는 구석 선택 (10x10 방에 맞게 조정)
        const cornerPositions = [
          new Vector3(4, 0, -4), // 북동
          new Vector3(4, 0, 4),  // 남동
          new Vector3(-4, 0, 4), // 남서
          new Vector3(-4, 0, -4) // 북서
        ];

        // 가장 비어있는 구석 찾기
        let bestCorner = cornerPositions[0];
        let maxCornerDistance = 0;

        cornerPositions.forEach(corner => {
          const minDistance = Math.min(...existingItems.map(item => {
            // NaN 값 검증 및 기본값 설정
            const safePosition = {
              x: isNaN(item.position.x) ? 0 : item.position.x,
              y: isNaN(item.position.y) ? 0 : item.position.y,
              z: isNaN(item.position.z) ? 0 : item.position.z
            };
            return corner.distanceTo(new Vector3(safePosition.x, safePosition.y, safePosition.z));
          }));
          if (minDistance > maxCornerDistance) {
            maxCornerDistance = minDistance;
            bestCorner = corner;
          }
        });

        if (bestCorner) {
          position = bestCorner.clone();
        }
      } else {
        // 중앙 영역에 배치 (기본 로직, 10x10 방에 맞게 조정)
        const angle = Math.random() * Math.PI * 2;
        const distance = 1.5 + Math.random() * 3; // 1.5-4.5m 거리
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

    // NaN 값 검증 및 기본값 설정
    const safePosition = {
      x: isNaN(position.x) ? 0 : position.x,
      y: isNaN(position.y) ? 0 : position.y,
      z: isNaN(position.z) ? 0 : position.z
    };
    
    const finalPosition = new Vector3(safePosition.x, safePosition.y, safePosition.z);
    
    // 시계의 경우 벽에 걸리는 형태로 회전값 설정 + 벽을 바라보도록 Y축 회전 적용
    let initialRotation = new Euler(0, 0, 0);
    const boundariesForYaw = getRoomBoundaries();
    // 기본 Z축 회전(시계) 유지
    if (item.subcategory === 'clock') {
      initialRotation = new Euler(0, 0, Math.PI / 2);
    }
    // 벽 배치일 경우, 위치 기준으로 정면이 실내를 향하도록 Y축 회전
    if (position) {
      try {
        // boundaries가 유효하면 경계 기준으로 더 명확히 판정
        if (boundariesForYaw) {
          const dxMin = Math.abs(position.x - boundariesForYaw.minX);
          const dxMax = Math.abs(position.x - boundariesForYaw.maxX);
          const dzMin = Math.abs(position.z - boundariesForYaw.minZ);
          const dzMax = Math.abs(position.z - boundariesForYaw.maxZ);
          const minXDist = Math.min(dxMin, dxMax);
          const minZDist = Math.min(dzMin, dzMax);
          if (minXDist <= minZDist) {
            // 동/서쪽 벽
            initialRotation.y = dxMin < dxMax ? Math.PI / 2 : -Math.PI / 2; // 서쪽(+X), 동쪽(-X)
          } else {
            // 남/북쪽 벽
            initialRotation.y = dzMin < dzMax ? 0 : Math.PI; // 북쪽(+Z), 남쪽(-Z)
          }
        } else {
          // 경계 정보가 없다면 좌표값 부호로 간단 판정
          if (Math.abs(position.x) > Math.abs(position.z)) {
            initialRotation.y = position.x < 0 ? Math.PI / 2 : -Math.PI / 2;
          } else {
            initialRotation.y = position.z < 0 ? 0 : Math.PI;
          }
        }
      } catch {}
    }

    // 편집 스토어에 가구 추가 (createPlacedItemFromFurniture 함수 사용으로 일관성 유지)
    const newPlacedItem = createPlacedItemFromFurniture(
      item,
      finalPosition, // 안전한 위치
      initialRotation, // 시계는 벽에 걸리는 형태로 회전
      new Vector3(1, 1, 1)   // 기본 크기
    );

    // 기본적으로 객체는 고정되지 않은 상태로 설정
    newPlacedItem.isLocked = false;

    // 🔥 가구 배치 시 벽 충돌 감지 및 위치 제한 적용
    const constrainedItem = constrainFurnitureToRoom(newPlacedItem);
    if (!constrainedItem.position.equals(newPlacedItem.position)) {
      console.log('🚫 가구 배치 시 벽 충돌 감지, 위치 제한:', {
        원래위치: `(${newPlacedItem.position.x.toFixed(2)}, ${newPlacedItem.position.y.toFixed(2)}, ${newPlacedItem.position.z.toFixed(2)})`,
        제한위치: `(${constrainedItem.position.x.toFixed(2)}, ${constrainedItem.position.y.toFixed(2)}, ${constrainedItem.position.z.toFixed(2)})`
      });
    }

    // 편집 스토어에 추가 (제한된 위치로)
    addItem(constrainedItem);
    console.log('새 가구 배치:', constrainedItem);
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

  // 가구 복제 핸들러
  const handleFurnitureDuplicate = (item: PlacedItem) => {
    addItem(item);
    console.log('가구 복제됨:', item.name);
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

  // 클라이언트 사이드가 준비되지 않은 경우 로딩 표시
  if (!isClientReady) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">3D 룸을 로딩 중입니다...</p>
        </div>
      </div>
    );
  }

  // iOS Safari 감지 (현재 사용하지 않음)
  // const isIOS = isIOSSafari();

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 z-0 overscroll-contain">
      {/* MiniRoom 컴포넌트 사용 */}
      <MiniRoom
        isEditMode={isEditMode}
        onEditModeChange={handleEditModeToggle}
        className="w-full h-full"
        useExternalControls={true} // 외부 카메라 컨트롤 사용
      >
        {/* 통합 카메라 컨트롤러 */}
        <UnifiedCameraControls
          isViewLocked={isViewLocked}
          isDragging={isDragging}
          isEditMode={isEditMode}
          hasSelection={!!selectedItemId}
          isMobile={isMobile}
          controlsRef={cameraControlsRef}
          onTransitionLockChange={setIsTransitionInputLocked}
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
          shadow-mapSize-width={isMobile ? 1024 : 2048}
          shadow-mapSize-height={isMobile ? 1024 : 2048}
        />

        {/* 3D 룸 */}
        <Room receiveShadow={shadowMode === 'realtime'} />

        {/* 그리드 시스템 - 항상 렌더링하되 편집모드에서만 표시 (최적화) */}
        {isClientReady && (
          <GridSystem 
            size={10} 
            divisions={10} 
            color="#ffffff" 
            isEditMode={isEditMode}
          />
        )}

        {/* 윤곽선 효과 - 편집 모드에서만 활성화 */}
        {isEditMode && (
          <OutlineEffect
            selectedObjects={selectedItemId ? [selectedItemId] : []}
            edgeStrength={2.0}
            pulseSpeed={0.0}
            visibleEdgeColor={0x3b82f6}
            hiddenEdgeColor={0x1e40af}
            enabled={false}
          >
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
                onDuplicate={handleFurnitureDuplicate}
              />
            ))}
          </OutlineEffect>
        )}

        {/* 편집 모드가 아닐 때는 윤곽선 없이 렌더링 */}
        {!isEditMode && placedItems.map((item) => (
          <DraggableFurniture
            key={item.id}
            item={item}
            isSelected={selectedItemId === item.id}
            isEditMode={isEditMode}
            onSelect={handleFurnitureSelectInScene}
            onUpdate={handleFurnitureUpdate}
            onDelete={handleFurnitureDelete}
            onDuplicate={handleFurnitureDuplicate}
          />
        ))}

        <AdaptiveEvents />
      </MiniRoom>

      {/* 상태 HUD (디버그용) - 입력 차단 방지 위해 pointer-events:none */}
      <div
        className="absolute top-5 left-5 md:top-3 md:left-3 z-50 text-xs bg-black/60 text-white rounded-md px-2 py-1"
        style={{ pointerEvents: 'none' }}
      >
        <div>Mode: {isEditMode ? 'Edit' : 'View'}</div>
        <div>Selected: {selectedItemId ? 'Yes' : 'No'}</div>
        <div>Dragging: {isDragging ? 'Yes' : 'No'}</div>
        <div>ViewLock: {isViewLocked ? 'Yes' : 'No'}</div>
        {debugFreeCam && <div>FreeCam: ON</div>}
      </div>

      {/* 전환 중 입력 락 오버레이 */}
      {isTransitionInputLocked && (
        <div
          className="absolute inset-0 z-[9999]"
          style={{ cursor: 'wait' }}
          onWheel={(e) => { e.preventDefault(); /* e.stopPropagation(); */ }}
          onPointerDown={(e) => { e.preventDefault(); /* e.stopPropagation(); */ }}
          onPointerMove={(e) => { e.preventDefault(); /* e.stopPropagation(); */ }}
          onPointerUp={(e) => { e.preventDefault(); /* e.stopPropagation(); */ }}
          onTouchStart={(e) => { e.preventDefault(); /* e.stopPropagation(); */ }}
          onTouchMove={(e) => { e.preventDefault(); /* e.stopPropagation(); */ }}
          onTouchEnd={(e) => { e.preventDefault(); /* e.stopPropagation(); */ }}
        />
      )}

      {/* 시점 전환 효과 제거 - 파란색 오버레이로 인한 사용자 혼란 방지 */}
      {/* {showTransitionEffect && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 pointer-events-none transition-opacity duration-1000" />
      )} */}



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
            isMobile={isMobile}
          />
        )}

      {/* 가구 카탈로그 하단 패널 - 화면 하단 2/3 차지 */}
      {isEditMode && (
        <BottomSheetCatalog
          isOpen={showFurnitureCatalog}
          onClose={() => setShowFurnitureCatalog(false)}
          initialSnap={0.66}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 border-b-2 border-blue-300 sticky top-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-bold">
                  {isPlacingFurniture ? '🎯 가구배치중' : '🪑 가구라이브러리'}
                </h3>
                <p className="text-blue-100 text-xs mt-1">
                  {isPlacingFurniture
                    ? `${selectedFurniture?.nameKo || selectedFurniture?.name} 배치 (ESC취소)`
                    : '편집할 가구 선택'}
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
          <div className="bg-white p-2">
            <EnhancedFurnitureCatalog
              furnitureData={sampleFurniture}
              onFurnitureSelect={handleFurnitureSelect}
              onClose={() => setShowFurnitureCatalog(false)}
              isMobile={true}
            />
          </div>
        </BottomSheetCatalog>
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

      {/* 모바일 전용 편집/보기 토글은 MiniRoom 내부에서 처리됨 */}

    </div>
  );
});

// Next.js 15 호환성을 위한 export
export default Real3DRoomComponent;
