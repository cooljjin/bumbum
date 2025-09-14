'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useOverlayRoot } from './shared/OverlayRoot';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// 클라이언트 사이드에서만 실행되는 컴포넌트들
import { AdaptiveEvents } from '@react-three/drei';
import FurniturePerformanceMonitor from './shared/FurniturePerformanceMonitor';
// const ContactShadows = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.ContactShadows })), { 
//   ssr: false,
//   loading: () => null
// });
import { motion } from 'framer-motion';
import { Vector3, Euler } from 'three';
import * as THREE from 'three';
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
const FurnitureFloatingControls = dynamic(() => import('./features/furniture/FurnitureFloatingControls'), { 
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
const FloatingColorPalette = dynamic(() => import('./ui/FloatingColorPalette'), { 
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
const Canvas3D = dynamic(() => import('./3D/Canvas3D'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">3D 룸 로딩 중...</p>
      </div>
    </div>
  )
});
const UnifiedCameraControls = dynamic(() => import('./3D/UnifiedCameraControls'), { 
  ssr: false,
  loading: () => null
});

import { updateRoomDimensions, isFurnitureInRoom, constrainFurnitureToRoom, getRoomBoundaries } from '../utils/roomBoundary';
import '../utils/modelSizeAnalyzer'; // 모델 크기 분석기 로드
import { useEditorMode, setMode, usePlacedItems, useSelectedItemId, updateItem, removeItem, selectItem, addItem, clearAllItems, useIsDragging, useCurrentFloorTexture, setFloorTexture, useEditorStore } from '../store/editorStore';
import { 
  enableScrollLock, 
  disableScrollLock, 
  preventKeyScroll,
  preventWheelScroll,
  preventTouchScroll,
  // isIOSSafari,
  isMobile as isMobileDevice
} from '../utils/scrollLock';
import { getSafeTouchArea, getUIOcclusionInsets } from '../utils/mobileHtmlConstraints';

interface Real3DRoomProps {
  shadowMode?: 'baked' | 'realtime';
  isViewLocked: boolean;
  isEditMode?: boolean;
}

import { FurnitureItem } from '../types/furniture';
import { PlacedItem } from '../types/editor';
import { createPlacedItemFromFurniture, sampleFurniture } from '../data/furnitureCatalog';
import { applyOverridesToItems } from '@/utils/furnitureOverrides';
import { getBuiltInOverrideUrls } from '@/utils/assetOverrides';
import WallFadeController from './features/room/WallFadeController';
import { getCustomFurnitureItems } from '../utils/customLibrary';
import { applyRoomTemplate, RoomTemplate } from '../data/roomTemplates';

// SSR 문제 해결을 위한 로딩 상태 관리
const useClientSideReady = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      // 즉시 설정하여 렌더링 지연 최소화
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
  const overlayRoot = useOverlayRoot();
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

  const sheet = (
    <div
      data-occlude-floating="bottom-sheet"
      ref={sheetRef}
      className="fixed left-0 right-0 bottom-0 w-full bg-white border-t shadow-2xl z-sheet flex flex-col furniture-library-container"
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

  // 오버레이 루트로 포털 렌더링 (fallback: body)
  if (typeof document !== 'undefined') {
    return createPortal(sheet, overlayRoot ?? document.body);
  }
  return sheet;
}

const Real3DRoomComponent = React.memo(({
  shadowMode,
  isViewLocked,
  isEditMode: externalEditMode
}: Real3DRoomProps) => {
  // isViewLocked 상태 디버깅
  // console.log('🏠 Real3DRoom isViewLocked 상태:', isViewLocked);
  
  // 클라이언트 사이드 준비 상태
  const isClientReady = useClientSideReady();
  
  const searchParams = typeof window !== 'undefined' ? useSearchParams() : (null as any);
  // const debugFreeCam = !!(searchParams && searchParams.get('freecam') === '1');
  const gestureFixScope = (searchParams && searchParams.get('gfix')) || 'canvas'; // 'canvas' | 'global'
  const debugFloating = !!(searchParams && searchParams.get('debugFloating') === '1');

  // 커스텀 라이브러리 로드 후 카탈로그에 병합
  const [customFurniture, setCustomFurniture] = useState<any[]>([]);
  const [assetOverrides, setAssetOverrides] = useState<Record<string, { modelUrl?: string; thumbUrl?: string }>>({});
  
  // 성능 모니터링을 위한 3D 씬 정보
  const [sceneInfo, setSceneInfo] = useState<{ scene: any; gl: any } | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await getCustomFurnitureItems();
        if (mounted) setCustomFurniture(list);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Load built-in asset override URLs (GLB/thumbnail) for all known items
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const combinedIds = [...sampleFurniture, ...customFurniture].map((i) => i.id);
        const urls = await getBuiltInOverrideUrls(combinedIds);
        if (mounted) setAssetOverrides(urls);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [customFurniture]);
  const debugPos = (searchParams && (searchParams.get('dbgPos') || searchParams.get('debugPos'))) || 'bl'; // tl|tr|bl|br
  const forceFloating = !!(searchParams && searchParams.get('forceFloating') === '1');
  const [dbgPosPx, setDbgPosPx] = useState<{ x: number; y: number } | null>(null);
  const dbgDragRef = useRef<{ sx: number; sy: number; px: number; py: number; dragging: boolean } | null>(null);

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
  
  // 플로팅 컨트롤 상태
  const [floatingControlsPosition, setFloatingControlsPosition] = useState({ x: 0, y: 0 });
  

  // DPR 고정 범위 계산 (편집 모드의 흐릿함 방지)
  const deviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const minDpr = 1;
  const maxDpr = Math.min(2, Math.max(1, deviceDpr)); // 최소 1, 최대 2로 제한

  // 편집 스토어에서 상태 가져오기
  const storeEditMode = useEditorMode();
  const placedItems = usePlacedItems();
  const selectedItemId = useSelectedItemId();
  const isDragging = useIsDragging();
  const currentFloorTexture = useCurrentFloorTexture();

  // 시점 고정 전환 중 입력 락 상태
  const [isTransitionInputLocked, setIsTransitionInputLocked] = useState(false);

  // 카메라 컨트롤러 ref
  const cameraControlsRef = useRef<import('camera-controls').default>(null);

  // 3D 위치를 화면 좌표로 변환하는 함수
  const worldToScreen = useCallback((worldPosition: { x: number; y: number; z: number }) => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    
    const vector = new THREE.Vector3(worldPosition.x, worldPosition.y, worldPosition.z);
    // 카메라 컨트롤러를 통해 카메라에 접근
    const camera = cameraControlsRef.current?.camera;
    
    // console.log('🎯 worldToScreen 호출:', {
    //   worldPosition,
    //   cameraExists: !!camera,
    //   cameraControlsRefExists: !!cameraControlsRef.current,
    //   windowSize: { width: window.innerWidth, height: window.innerHeight },
    //   userAgent: navigator.userAgent,
    //   isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    // });
    
    if (!camera) {
      // console.log('⚠️ 카메라가 없음 - 기본 위치 반환');
      // 카메라가 없을 때도 플로팅 컨트롤이 보이도록 화면 중앙에 위치
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    
    vector.project(camera);
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const x = (vector.x * 0.5 + 0.5) * width;
    const y = (vector.y * -0.5 + 0.5) * height;
    
    // console.log('🎯 worldToScreen 결과:', {
    //   worldPosition,
    //   projectedVector: { x: vector.x, y: vector.y, z: vector.z },
    //   screenPosition: { x, y },
    //   windowSize: { width, height }
    // });
    
    return { x, y };
  }, [cameraControlsRef]);

  // 드래그 상태 변화 감지
  useEffect(() => {
    // console.log('🎯 드래그 상태 변화 감지:', {
    //   isDragging,
    //   selectedItemId,
    //   timestamp: new Date().toISOString()
    // });
  }, [isDragging, selectedItemId]);

  // 선택된 가구가 있을 때 플로팅 컨트롤 위치 업데이트
  // - 초기 선택 시 한 번
  // - 카메라 이동/줌/윈도우 리사이즈 동안 지속적으로 추적 (RAF)
  useEffect(() => {
    if (!selectedItemId) return;

    const selectedItem = placedItems.find(item => item.id === selectedItemId);
    if (!selectedItem) return;

    // 즉시 한 번 계산
    const furnitureTopPosition = {
      x: selectedItem.position.x,
      y: selectedItem.position.y + selectedItem.footprint.height,
      z: selectedItem.position.z
    };
    setFloatingControlsPosition(worldToScreen(furnitureTopPosition));

    // 카메라가 움직이거나 줌 되는 동안, 혹은 기기 회전/리사이즈 시 계속 추적
    let raf = 0;
    const prev = { x: -9999, y: -9999 };
    const update = () => {
      // 드래그 중에는 플로팅을 숨기므로 업데이트하지 않음
      if (!isDragging) {
        const pos = worldToScreen(furnitureTopPosition);
        // 불필요한 렌더를 줄이기 위해 변화가 있을 때만 갱신
        if (Math.abs(pos.x - prev.x) > 0.5 || Math.abs(pos.y - prev.y) > 0.5) {
          prev.x = pos.x; prev.y = pos.y;
          setFloatingControlsPosition(pos);
        }
      }
      raf = window.requestAnimationFrame(update);
    };

    raf = window.requestAnimationFrame(update);

    const handleResize = () => {
      const pos = worldToScreen(furnitureTopPosition);
      setFloatingControlsPosition(pos);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [selectedItemId, placedItems, worldToScreen, isDragging]);

  // 웹 환경에서의 대안: 카메라가 없을 때도 플로팅 컨트롤을 표시
  useEffect(() => {
    if (selectedItemId && !isDragging) {
      // 카메라가 없을 때는 화면 중앙에 플로팅 컨트롤 표시
      const camera = cameraControlsRef.current?.camera;
      if (!camera) {
        // console.log('🎯 카메라 없음 - 화면 중앙에 플로팅 컨트롤 표시');
        setFloatingControlsPosition({ 
          x: window.innerWidth / 2, 
          y: window.innerHeight / 2 
        });
      }
    }
  }, [selectedItemId, isDragging]);

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

  // 편집 모드에서 스크롤 락 처리
  useEffect(() => {
    if (externalEditMode) {
      enableScrollLock();
      
      // 모든 스크롤 관련 이벤트 리스너 등록
      const eventOptions = { passive: false, capture: true } as AddEventListenerOptions;
      
      document.addEventListener('keydown', preventKeyScroll, eventOptions);
      document.addEventListener('wheel', preventWheelScroll, eventOptions);
      document.addEventListener('touchstart', preventTouchScroll, eventOptions);
      document.addEventListener('touchmove', preventTouchScroll, eventOptions);
      document.addEventListener('touchend', preventTouchScroll, eventOptions);
      
      // console.log('🔒 편집 모드 진입: 스크롤 락 활성화');
    } else {
      disableScrollLock();
      
      // 모든 이벤트 리스너 제거
      document.removeEventListener('keydown', preventKeyScroll, { capture: true });
      document.removeEventListener('wheel', preventWheelScroll, { capture: true });
      document.removeEventListener('touchstart', preventTouchScroll, { capture: true });
      document.removeEventListener('touchmove', preventTouchScroll, { capture: true });
      document.removeEventListener('touchend', preventTouchScroll, { capture: true });
      
      // console.log('🔓 편집 모드 종료: 스크롤 락 해제');
    }

    return () => {
      // 컴포넌트 언마운트 시 정리
      disableScrollLock();
      document.removeEventListener('keydown', preventKeyScroll, { capture: true });
      document.removeEventListener('wheel', preventWheelScroll, { capture: true });
      document.removeEventListener('touchstart', preventTouchScroll, { capture: true });
      document.removeEventListener('touchmove', preventTouchScroll, { capture: true });
      document.removeEventListener('touchend', preventTouchScroll, { capture: true });
    };
  }, [externalEditMode]);

  // 드래그 중 추가 스크롤 락 처리 (편집 모드와 별도)
  useEffect(() => {
    if (!isMobile || !externalEditMode) return undefined;

    if (isDragging) {
      // 편집 모드에서 이미 스크롤 락이 적용되어 있으므로 추가 처리만
      // console.log('🔒 드래그 중 추가 스크롤 락 처리');
      return undefined;
    } else {
      return undefined;
    }
  }, [isDragging, isMobile, externalEditMode]);

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

  // 템플릿 적용 핸들러
  const handleTemplateSelect = async (template: RoomTemplate) => {
    try {
      setIsApplyingTemplate(true);
      // console.log('🎯 템플릿 적용 시작:', template.metadata.nameKo);

      // 기존 객체들 모두 제거
      clearAllItems();

      // 템플릿 적용
      const result = await applyRoomTemplate(template);

      // 새로운 객체들 추가
      result.placedItems.forEach(item => {
        addItem(item);
      });

      // 카메라 위치 설정 (회전 상태 초기화 후 최단거리 이동)
      if (cameraControlsRef.current) {
        // 1. 카메라 회전 상태 초기화
        const { forceResetCameraRotation, moveCameraToTarget } = await import('@/utils/cameraUtils');
        forceResetCameraRotation(cameraControlsRef.current);
        
        // 2. 최단 경로로 목표 위치로 이동
        moveCameraToTarget(
          cameraControlsRef.current.camera,
          cameraControlsRef.current,
          [template.environment.cameraPosition.x, template.environment.cameraPosition.y, template.environment.cameraPosition.z],
          [template.environment.cameraTarget.x, template.environment.cameraTarget.y, template.environment.cameraTarget.z],
          false  // 즉시 적용
        );
      }

      // console.log(`✅ 템플릿 적용 완료: ${result.placedItems.length}개 객체 배치`);
      setShowTemplateSelector(false);

    } catch (error) {
      // console.error('❌ 템플릿 적용 실패:', error);
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
        // console.log('🧹 Real3DRoom 컴포넌트 메모리 정리 시작');

      // 등록된 정리 함수들 실행 (자기 자신은 제외)
      cleanupRefs.current.forEach(cleanupFn => {
        try {
          // cleanup 함수 자신은 이미 useEffect return에서 실행되므로 제외
          if (cleanupFn !== cleanup) {
            cleanupFn();
          }
        } catch (error) {
          // console.warn('정리 함수 실행 중 오류:', error);
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

  // 외부에서 편집 모드 변경 시 상태 동기화
  useEffect(() => {
    if (externalEditMode !== undefined) {
      setIsEditMode(externalEditMode);
      
      // editorStore의 mode도 함께 변경
      setMode(externalEditMode ? 'edit' : 'view');
      
      // 편집 모드 전환 시 상태 초기화
      if (externalEditMode) {
        // 편집 모드 진입 시 가구 카탈로그는 기본적으로 닫힌 상태
        setShowFurnitureCatalog(false);
      } else {
        // 편집 모드 종료 시 모든 상태 초기화
        setShowFurnitureCatalog(false);
        setIsPlacingFurniture(false);
        setSelectedFurniture(null);
      }
    }
  }, [externalEditMode, setMode]);

  const handleFurnitureSelect = (item: FurnitureItem) => {
    // console.log('가구 선택됨:', item);

    // 바닥 카테고리의 경우 텍스처 변경 처리
    if (item.category === 'floor') {
      // console.log('🏠 바닥 텍스처 변경:', item);
      // 바닥 텍스처 변경 (modelPath에 텍스처 경로가 저장됨)
      const floorTexturePath = item.modelPath || '/models/floor/floor_wooden.png';
      setFloorTexture(floorTexturePath);
      return; // 바닥은 배치하지 않음
    }

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
      // console.log('🔍 기존 가구 위치 확인:', existingItems.map(item => ({
      //   id: item.id,
      //   position: { x: item.position.x, y: item.position.y, z: item.position.z }
      // })));

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
      // console.log(`🎯 ${item.nameKo} (${item.category}/${item.subcategory}) 배치 전략: ${placementStrategy}`);

      // 기존 가구들의 평균 위치 계산 (원본 객체 변경 방지)
      const avgPosition = existingItems.reduce((acc, item) => {
        // NaN 값 검증 및 기본값 설정
        const safePosition = {
          x: isNaN(item.position.x) ? 0 : item.position.x,
          y: isNaN(item.position.y) ? 0 : item.position.y,
          z: isNaN(item.position.z) ? 0 : item.position.z
        };
        
        const itemPositionCopy = new Vector3(safePosition.x, safePosition.y, safePosition.z);
        // console.log(`📐 가구 ${item.id} 위치 복사:`, {
        //   원본: { x: item.position.x, y: item.position.y, z: item.position.z },
        //   안전한위치: safePosition,
        //   복사본: { x: itemPositionCopy.x, y: itemPositionCopy.y, z: itemPositionCopy.z }
        // });
        return acc.add(itemPositionCopy);
      }, new Vector3(0, 0, 0)).divideScalar(existingItems.length);

      // console.log('🎯 계산된 평균 위치:', { x: avgPosition.x, y: avgPosition.y, z: avgPosition.z });

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
            // console.log(`🕐 시계 Y축 위치 설정: ${position.y}m (벽 높이)`);
          } else if (item.placement.wallOnly) {
            // 벽면 전용 에셋의 경우 기본 벽 높이 설정
            position.y = item.placement.wallHeight || 1.5; // 기본 1.5m 높이
            // console.log(`🏠 벽면 에셋 Y축 위치 설정: ${position.y}m`);
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
      // console.log('🚫 가구 배치 시 벽 충돌 감지, 위치 제한:', {
      //   원래위치: `(${newPlacedItem.position.x.toFixed(2)}, ${newPlacedItem.position.y.toFixed(2)}, ${newPlacedItem.position.z.toFixed(2)})`,
      //   제한위치: `(${constrainedItem.position.x.toFixed(2)}, ${constrainedItem.position.y.toFixed(2)}, ${constrainedItem.position.z.toFixed(2)})`
      // });
    }

    // 편집 스토어에 추가 (제한된 위치로)
    addItem(constrainedItem);
    // console.log('새 가구 배치:', constrainedItem);
  };

  // 가구 선택 핸들러 - 단일 선택만 허용
  const handleFurnitureSelectInScene = (id: string | null) => {
    // console.log(`🎯 가구 선택 요청: ${id} (현재 선택됨: ${selectedItemId})`);
    // console.log(`📊 선택 상태:`, {
    //   requestedId: id,
    //   currentSelectedId: selectedItemId,
    //   isEditMode,
    //   placedItemsCount: placedItems.length
    // });
    
    if (id === null) {
      // 선택 해제
      if (typeof useEditorStore !== 'undefined') {
        // 안전하게 스토어의 clearSelection 사용
        try {
          const { clearSelection } = useEditorStore.getState();
          clearSelection();
        } catch (_) {
          selectItem(null);
        }
      } else {
        selectItem(null);
      }
    } else {
      // 단일 선택 - 다른 가구를 선택하면 이전 선택이 자동으로 해제됨
      selectItem(id);
      
      // 선택된 가구의 3D 위치를 화면 좌표로 변환하여 플로팅 컨트롤 표시
      const selectedItem = placedItems.find(item => item.id === id);
      if (selectedItem) {
        // 가구의 상단 위치 계산 (Y축에 가구 높이 추가)
        const furnitureTopPosition = {
          x: selectedItem.position.x,
          y: selectedItem.position.y + selectedItem.footprint.height,
          z: selectedItem.position.z
        };
        
        // 3D 위치를 화면 좌표로 변환
        const screenPosition = worldToScreen(furnitureTopPosition);
        
        setFloatingControlsPosition(screenPosition);
      }
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
    // console.log('가구 복제됨:', item.name);
  };

  // 플로팅 컨트롤 액션 핸들러들
  const handleRotateLeft = () => {
    if (selectedItemId) {
      const selectedItem = placedItems.find(item => item.id === selectedItemId);
      if (selectedItem) {
        const newRotation = new Euler(
          selectedItem.rotation.x,
          selectedItem.rotation.y - Math.PI / 2, // 90도 왼쪽 회전
          selectedItem.rotation.z,
          selectedItem.rotation.order
        );
        updateItem(selectedItemId, { rotation: newRotation });
        // console.log('가구 왼쪽 회전:', selectedItem.name);
      }
    }
  };

  const handleRotateRight = () => {
    if (selectedItemId) {
      const selectedItem = placedItems.find(item => item.id === selectedItemId);
      if (selectedItem) {
        const newRotation = new Euler(
          selectedItem.rotation.x,
          selectedItem.rotation.y + Math.PI / 2, // 90도 오른쪽 회전
          selectedItem.rotation.z,
          selectedItem.rotation.order
        );
        updateItem(selectedItemId, { rotation: newRotation });
        // console.log('가구 오른쪽 회전:', selectedItem.name);
      }
    }
  };

  const handleDuplicate = () => {
    if (selectedItemId) {
      const selectedItem = placedItems.find(item => item.id === selectedItemId);
      if (selectedItem) {
        handleFurnitureDuplicate(selectedItem);
        // 복제 후에도 컨트롤 유지
      }
    }
  };

  const handleDelete = () => {
    if (selectedItemId) {
      handleFurnitureDelete(selectedItemId);
 // 삭제 후에만 컨트롤 닫기
    }
  };


  // 가구 배치 완료 핸들러
  const handleFurniturePlaced = () => {
    setIsPlacingFurniture(false);
    setSelectedFurniture(null);
    // console.log('가구 배치가 완료되었습니다.');
  };

  const handleToggleFurnitureCatalog = () => {
    setShowFurnitureCatalog(!showFurnitureCatalog);
  };

  // 클라이언트 사이드가 준비되지 않은 경우 로딩 표시
  if (!isClientReady) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-50 to-slate-100">
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
      {/* Canvas3D 컴포넌트 직접 사용 - 중복 렌더링 방지 */}
      <Canvas3D
        isMobile={isMobile}
        isEditMode={isEditMode}
        minDpr={minDpr}
        maxDpr={maxDpr}
        onCreated={(scene, gl) => {
          // 3D 씬 정보를 성능 모니터링을 위해 저장
          setSceneInfo({ scene, gl });
        }}
        onClick={() => {
          // 빈 공간 클릭 시 선택 해제 (가구 클릭 직후에는 무시)
          try {
            const last = (window as any).lastFurnitureClickTime as number | undefined;
            if (last && Date.now() - last < 200) {
              // 가구 클릭 직후 발생한 빈 공간 이벤트로 간주하고 무시
              return;
            }
          } catch {}

          if (selectedItemId) {
            try {
              const { clearSelection } = useEditorStore.getState();
              clearSelection();
            } catch (_) {
              selectItem(null);
            }
          }
        }}
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

        {/* 조명 (개선된 설정) */}
        <ambientLight intensity={0.4} color="#ffffff" />
        <hemisphereLight
          args={['#87CEEB', '#C0C0C0', 0.6]}
        />
        <directionalLight
          castShadow
          position={[5, 10, 5]}
          intensity={1.2}
          color="#ffffff"
          shadow-mapSize-width={isMobile ? 1024 : 2048}
          shadow-mapSize-height={isMobile ? 1024 : 2048}
          shadow-camera-near={0.1}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        {/* 추가 조명 - 더 부드러운 그림자 */}
        <directionalLight
          position={[-5, 8, -5]}
          intensity={0.3}
          color="#ffffff"
        />

        {/* 3D 룸 */}
        <WallFadeController />
        <Room
          receiveShadow={shadowMode === 'realtime'}
          floorTexturePath={currentFloorTexture}
        />

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
          />
        ))}

        <AdaptiveEvents />
      </Canvas3D>

      {/* 성능 모니터링 - 개발 모드에서만 표시 (Canvas 밖에 위치) */}
      {process.env.NODE_ENV === 'development' && (
        <FurniturePerformanceMonitor
          enabled={true}
          showUI={true}
          scene={sceneInfo?.scene}
          gl={sceneInfo?.gl}
          onMetricsUpdate={(metrics) => {
            // 성능 지표를 콘솔에 출력 (선택사항)
            if (metrics.fps < 30) {
              console.warn('성능 저하 감지:', metrics);
            }
          }}
        />
      )}

      {/* 전환 중 입력 락 오버레이 */}
      {isTransitionInputLocked && (
        <div
          className="absolute inset-0 z-overlay"
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

      {/* 가구 드래그 중 시각적 피드백 */}
      {isDragging && (
        <div className="absolute top-4 left-4 z-hud bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          <span className="text-sm font-medium">가구 이동 중 - 시점 고정됨</span>
        </div>
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
              // console.log('모든 객체가 삭제되었습니다.');
            }
          }}
          className="absolute bottom-4 right-4 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold transition-all duration-300 shadow-2xl hover:from-red-700 hover:to-red-800 hover:scale-105 border-2 border-red-800 z-hud flex items-center gap-2"
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
            isMobileDevice={isMobile}
          />
        )}

      {/* 가구 카탈로그 하단 패널 - 화면 하단 2/3 차지 */}
      {isEditMode && (
        <BottomSheetCatalog
          isOpen={showFurnitureCatalog}
          onClose={() => setShowFurnitureCatalog(false)}
          initialSnap={0.66}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 border-b-2 border-blue-300 furniture-library-header">
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
              furnitureData={applyOverridesToItems([...sampleFurniture, ...customFurniture]).map((it) => {
                const o = assetOverrides[it.id];
                if (!o) return it;
                return {
                  ...it,
                  modelPath: o.modelUrl || it.modelPath,
                  thumbnailPath: o.thumbUrl || it.thumbnailPath,
                };
              })}
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
            className="fixed top-4 right-4 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl font-bold transition-all duration-300 shadow-2xl hover:from-green-700 hover:to-green-800 hover:scale-105 border-2 border-green-800 z-hud flex items-center gap-2"
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
            // console.log('🏠 방 크기 변경:', dimensions);
            // 방 크기 업데이트
            updateRoomDimensions(dimensions);
            
            // 기존 가구들이 새로운 방 크기에 맞는지 검증하고 필요시 이동
            placedItems.forEach(item => {
              if (!isFurnitureInRoom(item)) {
                // console.log(`🚨 방 크기 변경 후 가구가 벽 밖으로 나감: ${item.name || item.id}`);
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
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-overlay">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <div>
              <p className="font-medium text-sm">템플릿 적용중...</p>
              <p className="text-xs text-gray-600">잠시만 기다려주세요</p>
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 컨트롤 - 가구가 선택되면 무조건 표시 */}
      {(() => {
        const shouldShow = (!!selectedItemId && !isDragging) || forceFloating;
        // console.log('🎯 플로팅 컨트롤 렌더링 조건:', {
        //   selectedItemId,
        //   isDragging,
        //   shouldShow,
        //   floatingControlsPosition
        // });
        return shouldShow;
      })() && (
        <FurnitureFloatingControls
          isVisible={true}
          onRotateLeft={handleRotateLeft}
          onRotateRight={handleRotateRight}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          position={{
            x: Number.isFinite(floatingControlsPosition.x) ? floatingControlsPosition.x : window.innerWidth / 2,
            y: Number.isFinite(floatingControlsPosition.y) ? floatingControlsPosition.y : window.innerHeight / 2
          }}
        />
      )}

      {/* 디버그: 플로팅 앵커 위치 점 표시 및 상태 패널 */}
      {debugFloating && (
        <>
          <div
            style={{
              position: 'fixed',
              left: floatingControlsPosition.x,
              top: floatingControlsPosition.y,
              width: 8,
              height: 8,
              background: 'red',
              borderRadius: 9999,
              transform: 'translate(-50%, -50%)',
              zIndex: 20
            }}
          />
          {(() => {
            const pad = 8;
            const occ = getUIOcclusionInsets();
            const posStyle: React.CSSProperties = { position: 'fixed' } as any;

            if (dbgPosPx) {
              // 드래그된 좌표를 우선 적용
              posStyle.left = dbgPosPx.x;
              posStyle.top = dbgPosPx.y;
              posStyle.transform = 'translate(-50%, -50%)';
            } else {
              // 기본 위치는 파라미터 + 차단영역 반영
              if (debugPos.includes('t')) posStyle.top = (occ?.top || 0) + pad;
              if (debugPos.includes('b')) posStyle.bottom = (occ?.bottom || 0) + pad;
              if (debugPos.includes('l')) posStyle.left = pad;
              if (debugPos.includes('r')) posStyle.right = pad;
              // 기본은 bottom-left
              if (!('top' in posStyle) && !('bottom' in posStyle)) posStyle.bottom = (occ?.bottom || 0) + pad;
              if (!('left' in posStyle) && !('right' in posStyle)) posStyle.left = pad;
            }
            return (
              <div
                style={{
                  ...posStyle,
                  zIndex: 20,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  lineHeight: 1.4,
                  pointerEvents: 'auto',
                  cursor: 'move'
                }}
                onPointerDown={(e) => {
                  try { (e as any).preventDefault?.(); } catch {}
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const cx = dbgPosPx ? dbgPosPx.x : rect.left + rect.width / 2;
                  const cy = dbgPosPx ? dbgPosPx.y : rect.top + rect.height / 2;
                  dbgDragRef.current = { sx: e.clientX, sy: e.clientY, px: cx, py: cy, dragging: true };
                  const onMove = (ev: PointerEvent) => {
                    if (!dbgDragRef.current?.dragging) return;
                    const dx = ev.clientX - dbgDragRef.current.sx;
                    const dy = ev.clientY - dbgDragRef.current.sy;
                    setDbgPosPx({ x: dbgDragRef.current.px + dx, y: dbgDragRef.current.py + dy });
                  };
                  const onUp = () => {
                    if (dbgDragRef.current) dbgDragRef.current.dragging = false;
                    window.removeEventListener('pointermove', onMove);
                    window.removeEventListener('pointerup', onUp);
                    window.removeEventListener('pointercancel', onUp);
                  };
                  window.addEventListener('pointermove', onMove, { passive: true });
                  window.addEventListener('pointerup', onUp, { passive: true });
                  window.addEventListener('pointercancel', onUp, { passive: true });
                }}
              >
                <div>selected: {String(selectedItemId)}</div>
                <div>dragging: {String(isDragging)}</div>
                <div>x: {Math.round(floatingControlsPosition.x)}, y: {Math.round(floatingControlsPosition.y)}</div>
                <div>safe: {(() => { const s = getSafeTouchArea(); return `${s.top}/${s.bottom}/${s.left}/${s.right}`; })()}</div>
                <div>occ: {(() => { const o = getUIOcclusionInsets(); return `${o.top}/${o.bottom}/${o.left}/${o.right}`; })()}</div>
              </div>
            );
          })()}
        </>
      )}

      {/* 디버깅용 고정 플로팅 컨트롤 - 웹 환경 테스트용 */}
      {/*
      {selectedItemId && !isDragging && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            background: 'red',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px'
          }}
        >
          DEBUG: 플로팅 컨트롤 테스트
        </div>
      )}
      */}

      {/* 플로팅 색상 팔레트 */}
      <FloatingColorPalette />

      {/* 모바일 전용 편집/보기 토글은 MiniRoom 내부에서 처리됨 */}

    </div>
  );
});

// Next.js 15 호환성을 위한 export
export default Real3DRoomComponent;
