'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useOverlayRoot } from '../shared/OverlayRoot';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// 클라이언트 사이드에서만 실행되는 컴포넌트들
import { AdaptiveEvents } from '@react-three/drei';
import FurniturePerformanceMonitor from '../shared/FurniturePerformanceMonitor';
import { motion, AnimatePresence } from 'framer-motion';
import { Vector3, Euler } from 'three';
import * as THREE from 'three';

// 동적 임포트 컴포넌트들
const Room = dynamic(() => import('../features/room/Room'), { 
  ssr: false,
  loading: () => null
});

const RoomSizeSettings = dynamic(() => import('../features/room/RoomSizeSettings'), { 
  ssr: false,
  loading: () => null
});

const EnhancedFurnitureCatalog = dynamic(() => import('../features/furniture/EnhancedFurnitureCatalog'), { 
  ssr: false,
  loading: () => null
});

const FurnitureFloatingControls = dynamic(() => import('../features/furniture/FurnitureFloatingControls'), { 
  ssr: false,
  loading: () => null
});

const GridSystem = dynamic(() => import('../features/editor/GridSystem'), { 
  ssr: false,
  loading: () => null
});

// 임시로 직접 import 사용 (ChunkLoadError 해결을 위해)
import { DraggableFurniture } from '../features/furniture/DraggableFurniture';

const EditToolbar = dynamic(() => import('../layout/EditToolbar'), { 
  ssr: false,
  loading: () => null
});

const FloatingColorPalette = dynamic(() => import('../ui/FloatingColorPalette'), { 
  ssr: false,
  loading: () => null
});

const RoomTemplateSelector = dynamic(() => import('../features/room/RoomTemplateSelector'), { 
  ssr: false,
  loading: () => null
});

const OutlineEffect = dynamic(() => import('../shared/OutlineEffect'), { 
  ssr: false,
  loading: () => null
});

const Canvas3D = dynamic(() => import('./Canvas3D'), { 
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

const UnifiedCameraControls = dynamic(() => import('./UnifiedCameraControls'), { 
  ssr: false,
  loading: () => null
});

// 유틸리티 임포트
import { updateRoomDimensions, isFurnitureInRoom, constrainFurnitureToRoom, getRoomBoundaries } from '../../utils/roomBoundary';
import '../../utils/modelSizeAnalyzer';
import { useEditorMode, setMode, usePlacedItems, useSelectedItemId, updateItem, removeItem, selectItem, addItem, clearAllItems, useIsDragging, useCurrentFloorTexture, setFloorTexture, useCurrentWallTexture, useEditorStore } from '../../store/editorStore';
import { 
  enableScrollLock, 
  disableScrollLock, 
  preventKeyScroll,
  preventWheelScroll,
  preventTouchScroll,
  isMobile as isMobileDevice
} from '../../utils/scrollLock';
import { getSafeTouchArea, getUIOcclusionInsets } from '../../utils/mobileHtmlConstraints';

// 타입 임포트
import { FurnitureItem } from '../../types/furniture';
import { PlacedItem, PerformanceOptions, RoomBounds } from '../../types/editor';
import { createPlacedItemFromFurniture, sampleFurniture } from '../../data/furnitureCatalog';
import { applyOverridesToItems } from '@/utils/furnitureOverrides';
import { getBuiltInOverrideUrls } from '@/utils/assetOverrides';
import WallFadeController from '../features/room/WallFadeController';
import { getCustomFurnitureItems } from '../../utils/customLibrary';
import { applyRoomTemplate, RoomTemplate } from '../../data/roomTemplates';
import LODController, { createLODLevels } from '../shared/LODController';

// Props 인터페이스
export interface Room3DContainerProps {
  shadowMode?: 'baked' | 'realtime' | undefined;
  isViewLocked: boolean;
  isEditMode?: boolean | undefined;
  performanceOptions?: Partial<PerformanceOptions> | undefined;
  onRoomBoundsChange?: ((bounds: RoomBounds) => void) | undefined;
}

// 성능 옵션 기본값
const DEFAULT_PERFORMANCE_OPTIONS: PerformanceOptions = {
  enableLOD: true,
  enableFrustumCulling: true,
  shadowQuality: 'medium',
  enableTextureCompression: true,
  maxFPS: 60,
  memoryLimit: 512
};

// SSR 문제 해결을 위한 로딩 상태 관리
const useClientSideReady = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
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
  const overlayRoot = useOverlayRoot();
  const [heightPx, setHeightPx] = useState(0);
  const snaps = [0.25, 0.66, 1.0];
  const isMobile = isMobileDevice();

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
    const dy = dragState.current.startY - e.clientY;
    const newH = Math.max(vh() * 0.2, Math.min(vh(), dragState.current.startH + dy));
    setHeightPx(newH);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    const ratio = heightPx / Math.max(1, vh());
    let nearest = snaps[0];
    let minDiff = Infinity;
    snaps.forEach(s => { const d = Math.abs(s - ratio); if (d < minDiff) { minDiff = d; nearest = s; } });
    if (ratio < 0.22) {
      onClose();
    } else {
      setHeightPx(Math.round(vh() * (nearest || 0.66)));
    }
  }, [heightPx]);

  const sheet = (
    <motion.div
      data-occlude-floating="bottom-sheet"
      ref={sheetRef}
      className="fixed left-0 right-0 bottom-0 w-full bg-white border-t shadow-2xl z-sheet flex flex-col furniture-library-container"
      style={{
        height: `${heightPx}px`,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
      initial={isMobile ? { y: '100%' } : { y: '100%', opacity: 0, scale: 0.95 }}
      animate={isMobile ? { y: 0 } : { y: 0, opacity: 1, scale: 1 }}
      exit={isMobile ? { y: '100%' } : { y: '100%', opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring',
        damping: isMobile ? 25 : 30,
        stiffness: isMobile ? 200 : 300,
        duration: isMobile ? 0.3 : 0.5,
        ease: isMobile ? 'easeOut' : 'easeInOut'
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
    </motion.div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(sheet, overlayRoot ?? document.body);
  }
  return sheet;
}

const Room3DContainer: React.FC<Room3DContainerProps> = React.memo(({
  shadowMode,
  isViewLocked,
  isEditMode: externalEditMode,
  performanceOptions = {},
  onRoomBoundsChange
}) => {
  // 클라이언트 사이드 준비 상태
  const isClientReady = useClientSideReady();
  
  // 성능 옵션 병합
  const mergedPerformanceOptions = useMemo(() => ({
    ...DEFAULT_PERFORMANCE_OPTIONS,
    ...performanceOptions
  }), [performanceOptions]);

  // 성능 옵션에 따른 Suspense 설정
  const suspenseConfig = useMemo(() => ({
    fallback: mergedPerformanceOptions.enableLOD ? (
      <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">3D 모델 로딩 중...</p>
        </div>
      </div>
    ) : null
  }), [mergedPerformanceOptions.enableLOD]);
  
  const searchParams = typeof window !== 'undefined' ? useSearchParams() : (null as any);
  const gestureFixScope = (searchParams && searchParams.get('gfix')) || 'canvas';
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

  // Load built-in asset override URLs
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

  const debugPos = (searchParams && (searchParams.get('dbgPos') || searchParams.get('debugPos'))) || 'bl';
  const forceFloating = !!(searchParams && searchParams.get('forceFloating') === '1');
  const [dbgPosPx, setDbgPosPx] = useState<{ x: number; y: number } | null>(null);
  const dbgDragRef = useRef<{ sx: number; sy: number; px: number; py: number; dragging: boolean } | null>(null);

  // 상태 관리
  const [showFurnitureCatalog, setShowFurnitureCatalog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showRoomSizeSettings, setShowRoomSizeSettings] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlacingFurniture, setIsPlacingFurniture] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem | null>(null);
  const [floatingControlsPosition, setFloatingControlsPosition] = useState({ x: 0, y: 0 });
  const [isTransitionInputLocked, setIsTransitionInputLocked] = useState(false);

  // 메모리 관리 상태
  const cleanupRefs = useRef<Set<() => void>>(new Set());

  // DPR 고정 범위 계산
  const deviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const minDpr = 1;
  const maxDpr = Math.min(2, Math.max(1, deviceDpr));

  // 편집 스토어에서 상태 가져오기
  const storeEditMode = useEditorMode();
  const placedItems = usePlacedItems();
  const selectedItemId = useSelectedItemId();
  const isDragging = useIsDragging();
  const currentFloorTexture = useCurrentFloorTexture();
  const currentWallTexture = useCurrentWallTexture();
  const selectItem = useEditorStore((state) => state.selectItem);

  // 카메라 컨트롤러 ref
  const cameraControlsRef = useRef<import('camera-controls').default>(null);

  // 3D 위치를 화면 좌표로 변환하는 함수
  const worldToScreen = useCallback((worldPosition: { x: number; y: number; z: number }) => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    
    const vector = new THREE.Vector3(worldPosition.x, worldPosition.y, worldPosition.z);
    const camera = cameraControlsRef.current?.camera;
    
    if (!camera) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    
    vector.project(camera);
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const x = (vector.x * 0.5 + 0.5) * width;
    const y = (vector.y * -0.5 + 0.5) * height;
    
    return { x, y };
  }, [cameraControlsRef]);

  // 가구 선택 시 플로팅 컨트롤 위치 업데이트
  useEffect(() => {
    if (selectedItemId) {
      const selectedItem = placedItems.find(item => item.id === selectedItemId);
      if (selectedItem) {
        // 가구의 상단 위치를 기준으로 화면 좌표 계산
        const furnitureTopPosition = {
          x: selectedItem.position.x,
          y: selectedItem.position.y + (selectedItem.footprint?.height || 1),
          z: selectedItem.position.z
        };
        const screenPos = worldToScreen(furnitureTopPosition);
        setFloatingControlsPosition(screenPos);
      }
    } else {
      // 선택 해제 시 기본 위치로 리셋
      setFloatingControlsPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
  }, [selectedItemId, placedItems, worldToScreen]);

  // 가구 이동 시 플로팅 컨트롤 위치 실시간 추적
  useEffect(() => {
    if (!selectedItemId) return;

    const selectedItem = placedItems.find(item => item.id === selectedItemId);
    if (!selectedItem) return;

    // 가구의 상단 위치를 기준으로 화면 좌표 계산
    const furnitureTopPosition = {
      x: selectedItem.position.x,
      y: selectedItem.position.y + (selectedItem.footprint?.height || 1),
      z: selectedItem.position.z
    };
    const screenPos = worldToScreen(furnitureTopPosition);
    setFloatingControlsPosition(screenPos);
  }, [placedItems, selectedItemId, worldToScreen]);

  // 모바일 환경 감지
  useEffect(() => {
    const checkMobile = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(navigator.userAgent) || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 편집 모드 결정
  const isEditMode = externalEditMode ?? storeEditMode;

  // 스크롤 락 관리
  useEffect(() => {
    if (isEditMode) {
      enableScrollLock();
    } else {
      disableScrollLock();
    }

    return () => {
      disableScrollLock();
    };
  }, [isEditMode]);

  // 키보드 이벤트 처리
  useEffect(() => {
    if (!isEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      preventKeyScroll(e);
    };

    const handleWheel = (e: WheelEvent) => {
      preventWheelScroll(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      preventTouchScroll(e);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isEditMode]);

  // 가구 선택 핸들러
  const handleFurnitureSelect = useCallback((furniture: FurnitureItem) => {
    setSelectedFurniture(furniture);
    setIsPlacingFurniture(true);
    // 가구 선택 후 카탈로그 닫기
    setShowFurnitureCatalog(false);
  }, []);

  // 가구 배치 핸들러
  const handleFurniturePlace = useCallback((position: Vector3) => {
    if (!selectedFurniture) return;

    const placedItem = createPlacedItemFromFurniture(selectedFurniture, position);
    addItem(placedItem);
    setIsPlacingFurniture(false);
    setSelectedFurniture(null);
  }, [selectedFurniture, addItem]);

  // 가구 회전 핸들러
  const handleRotateLeft = useCallback(() => {
    if (!selectedItemId) return;
    const item = placedItems.find(item => item.id === selectedItemId);
    if (!item) return;

    const newRotation = new Euler(
      item.rotation.x,
      item.rotation.y - Math.PI / 2,
      item.rotation.z
    );
    updateItem(selectedItemId, { rotation: newRotation });
  }, [selectedItemId, placedItems, updateItem]);

  const handleRotateRight = useCallback(() => {
    if (!selectedItemId) return;
    const item = placedItems.find(item => item.id === selectedItemId);
    if (!item) return;

    const newRotation = new Euler(
      item.rotation.x,
      item.rotation.y + Math.PI / 2,
      item.rotation.z
    );
    updateItem(selectedItemId, { rotation: newRotation });
  }, [selectedItemId, placedItems, updateItem]);

  // 가구 복제 핸들러
  const handleDuplicate = useCallback(() => {
    if (!selectedItemId) return;
    const item = placedItems.find(item => item.id === selectedItemId);
    if (!item) return;

    const duplicatedItem: PlacedItem = {
      ...item,
      id: `${item.id}_copy_${Date.now()}`,
      position: new Vector3(
        item.position.x + 0.5,
        item.position.y,
        item.position.z + 0.5
      )
    };
    addItem(duplicatedItem);
  }, [selectedItemId, placedItems, addItem]);

  // 가구 삭제 핸들러
  const handleDelete = useCallback(() => {
    if (!selectedItemId) return;
    removeItem(selectedItemId);
  }, [selectedItemId, removeItem]);

  // 템플릿 선택 핸들러
  const handleTemplateSelect = useCallback(async (template: RoomTemplate) => {
    setIsApplyingTemplate(true);
    try {
      await applyRoomTemplate(template, placedItems, addItem, clearAllItems);
    } catch (error) {
      console.error('템플릿 적용 실패:', error);
    } finally {
      setIsApplyingTemplate(false);
    }
  }, [placedItems, addItem, clearAllItems]);

  // 클라이언트 사이드 준비 상태 확인
  if (!isClientReady) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">3D 룸 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* 3D Canvas */}
      <Suspense fallback={suspenseConfig.fallback}>
        <Canvas3D
          isMobile={isMobile}
          isEditMode={isEditMode}
          minDpr={minDpr}
          maxDpr={maxDpr}
          performanceOptions={mergedPerformanceOptions}
          onCreated={(scene, gl) => {
            setSceneInfo({ scene, gl });
          }}
          onClick={() => {
            // 가구 배치 모드일 때 빈 공간 클릭 처리
            if (isPlacingFurniture && selectedFurniture) {
              // 기본 위치에 가구 배치 (실제로는 마우스 위치 기반으로 계산해야 함)
              const defaultPosition = new Vector3(0, 0, 0);
              handleFurniturePlace(defaultPosition);
            }
          }}
          onPointerMissed={(event: any) => {
            // 빈 공간 클릭 시 가구 선택 해제
            console.log('🎯 Room3DContainer onPointerMissed 이벤트 발생:', {
              type: event.type,
              pointerType: event.pointerType,
              selectedItemId,
              isDragging,
              timestamp: Date.now()
            });
            
            // 드래그 중이면 무시 (드래그 종료는 handleDragEnd에서 처리)
            if (isDragging) {
              console.log('⚠️ 드래그 중 - 빈 공간 클릭 무시');
              return;
            }
            
            // 가구 클릭과 구분하기 위한 시간 체크
            const lastFurnitureClickTime = (window as any).lastFurnitureClickTime || 0;
            const currentTime = Date.now();
            const timeDiff = currentTime - lastFurnitureClickTime;
            
            // 가구 클릭 후 150ms 이내라면 빈 공간 클릭으로 처리하지 않음
            if (timeDiff < 150) {
              console.log('⚠️ 가구 클릭 후 150ms 이내 - 빈 공간 클릭 무시');
              return;
            }
            
            if (selectedItemId) {
              console.log('✅ 빈 공간 클릭: 가구 선택 해제 실행');
              selectItem(null);
              console.log('✅ selectItem(null) 호출 완료');
            } else {
              console.log('ℹ️ 빈 공간 클릭: 선택된 가구 없음');
            }
          }}
        >
          {/* 카메라 컨트롤 */}
          <UnifiedCameraControls
            ref={cameraControlsRef}
            isViewLocked={isViewLocked}
            isDragging={isDragging}
            isEditMode={isEditMode}
            hasSelection={!!selectedItemId}
            isMobile={isMobile}
            controlsRef={cameraControlsRef}
            onTransitionLockChange={setIsTransitionInputLocked}
          />

          {/* 성능 모니터링 */}
          <FurniturePerformanceMonitor
            placedItems={placedItems}
            sceneInfo={sceneInfo}
            performanceOptions={mergedPerformanceOptions}
          />

          {/* LOD 컨트롤러 */}
          <LODController
            levels={createLODLevels(mergedPerformanceOptions)}
            placedItems={placedItems}
          />

          {/* 벽면 페이드 컨트롤러 */}
          <WallFadeController />

          {/* 룸 렌더링 */}
          <Room
            receiveShadow={shadowMode === 'realtime'}
            floorTexturePath={currentFloorTexture}
            wallTexturePath={currentWallTexture}
            onBoundsChange={onRoomBoundsChange}
          />

          {/* 그리드 시스템 */}
          {isEditMode && <GridSystem />}

          {/* 아웃라인 효과로 가구들을 감싸기 */}
          <OutlineEffect selectedItemId={selectedItemId}>
            {/* 선택된 아이템 렌더링 */}
            {selectedItemId && (
              <DraggableFurniture
                key={selectedItemId}
                item={placedItems.find(i => i.id === selectedItemId)!}
                isEditMode={isEditMode}
                onSelect={() => selectItem(selectedItemId)}
                onUpdate={(id, updates) => updateItem(id, updates)}
              />
            )}
            
            {/* 선택되지 않은 아이템들 렌더링 */}
            {placedItems.filter(i => i.id !== selectedItemId).map(item => (
              <DraggableFurniture
                key={item.id}
                item={item}
                isEditMode={isEditMode}
                onSelect={() => selectItem(item.id)}
                onUpdate={(id, updates) => updateItem(id, updates)}
              />
            ))}

            {/* Adaptive Events */}
            <AdaptiveEvents />
          </OutlineEffect>
        </Canvas3D>
      </Suspense>

      {/* 편집 툴바 */}
      {isEditMode && (
        <EditToolbar
          onToggleFurnitureCatalog={() => setShowFurnitureCatalog(!showFurnitureCatalog)}
          showFurnitureCatalog={showFurnitureCatalog}
          onToggleTemplateSelector={() => setShowTemplateSelector(!showTemplateSelector)}
          showTemplateSelector={showTemplateSelector}
          isMobileDevice={isMobile}
        />
      )}

      {/* 가구 카탈로그 */}
      <AnimatePresence>
        {showFurnitureCatalog && (
          <BottomSheetCatalog
            isOpen={showFurnitureCatalog}
            onClose={() => setShowFurnitureCatalog(false)}
          >
            <EnhancedFurnitureCatalog
              furnitureData={[...sampleFurniture, ...customFurniture]}
              onFurnitureSelect={handleFurnitureSelect}
              onClose={() => setShowFurnitureCatalog(false)}
              isMobile={isMobile}
            />
          </BottomSheetCatalog>
        )}
      </AnimatePresence>

      {/* 룸 크기 설정 */}
      {showRoomSizeSettings && (
        <RoomSizeSettings
          onClose={() => setShowRoomSizeSettings(false)}
          onRoomBoundsChange={(newBounds) => {
            updateRoomDimensions(newBounds);
            onRoomBoundsChange?.(newBounds);
            
            // 기존 가구들이 새로운 방 크기에 맞는지 검증
            placedItems.forEach(item => {
              if (!isFurnitureInRoom(item)) {
                const constrainedItem = constrainFurnitureToRoom(item);
                updateItem(item.id, { position: constrainedItem.position });
              }
            });
          }}
        />
      )}

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

      {/* 플로팅 컨트롤 */}
      {(() => {
        const shouldShow = (!!selectedItemId && !isDragging) || forceFloating;
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

      {/* 가구 배치 모드 오버레이 */}
      {isPlacingFurniture && selectedFurniture && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-overlay">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">🪑</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {selectedFurniture.nameKo || selectedFurniture.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                3D 룸의 원하는 위치를 클릭하여 가구를 배치하세요
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setIsPlacingFurniture(false);
                    setSelectedFurniture(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    // 룸 중앙에 기본 배치
                    const defaultPosition = new Vector3(0, 0, 0);
                    handleFurniturePlace(defaultPosition);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  중앙에 배치
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 색상 팔레트 */}
      <FloatingColorPalette />
    </div>
  );
});

Room3DContainer.displayName = 'Room3DContainer';

export default Room3DContainer;
