'use client';

import React, { useMemo, useRef, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
// import { useGesture } from "@use-gesture/react"; // 직접 이벤트 리스너 사용으로 변경
import { create } from "zustand";
import { useEditorStore } from "../../store/editorStore";

// ---------- Helpers: simple store for camera transforms ----------
type CamState = {
  zoom: number;              // perspective dolly amount
  truck: [number, number];   // pan (x, y)
  addTruck: (dx: number, dy: number) => void;
  addZoom: (dz: number) => void;
  reset: () => void;
};

const useCam = create<CamState>((set) => ({
  zoom: 0,
  truck: [0, 0],
  addTruck: (dx, dy) => set((s) => ({ truck: [s.truck[0] + dx, s.truck[1] + dy] })),
  addZoom: (dz) => set((s) => ({ zoom: Math.min(Math.max(s.zoom + dz, -15), 15) })),
  reset: () => set({ zoom: 0, truck: [0, 0] }),
}));

// ---------- Scene content ----------
function Floor() {
  const grid = useMemo(() => new THREE.GridHelper(20, 20, 0x888888, 0x444444), []);
  // 빈 공간 클릭을 onPointerMissed로 처리하기 위해 GridHelper는 레이캐스트에서 제외
  // three@0.179 + r3f@9에서는 raycast에 null을 넣으면 TypeError가 발생할 수 있어 no-op 함수 사용
  return <primitive object={grid} position={[0, -0.01, 0]} raycast={() => undefined} />;
}

function LightRig() {
  return (
    <>
      <ambientLight intensity={0.4} color="#ffffff" />
      <hemisphereLight
        args={['#87CEEB', '#C0C0C0', 0.6]}
      />
      <directionalLight 
        position={[5, 8, 5]} 
        intensity={1.2} 
        color="#ffffff"
        castShadow 
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* 추가 조명 - 더 부드러운 그림자 */}
      <directionalLight
        position={[-5, 6, -5]}
        intensity={0.3}
        color="#ffffff"
      />
    </>
  );
}


// ---------- Camera Controller (Canvas 내부) ----------
function CameraController() {
  const { camera } = useThree();
  
  // Apply camera movements each frame
  useFrame(() => {
    const { truck, zoom } = useCam.getState();
    if (truck[0] !== 0 || truck[1] !== 0) {
      // 직접 카메라 위치 조정
      camera.position.x += truck[0];
      camera.position.z += truck[1];
      camera.lookAt(0, 0, 0);
      useCam.setState({ truck: [0, 0] });
    }
    if (zoom !== 0) {
      // 직접 카메라 거리 조정
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      camera.position.addScaledVector(direction, zoom);
      useCam.setState({ zoom: 0 });
    }
  });

  return null; // 이 컴포넌트는 렌더링하지 않음
}

// ---------- 초기 렌더링 강제 실행 컴포넌트 제거됨 ----------

// ---------- 렌더링 품질 일정 유지 컴포넌트 (최적화됨) ----------
function RenderQualityStabilizer() {
  const { gl } = useThree();

  useFrame(() => {
    // DPR이 1보다 작으면 최소값으로 설정 (뿌옇게 보이는 문제 방지)
    const currentPixelRatio = gl.getPixelRatio();
    if (currentPixelRatio < 1) {
      gl.setPixelRatio(1);
    }
  });

  return null;
}

// ---------- 빈 공간 클릭 핸들러 ----------
function EmptySpaceHandler() {
  const { selectItem, selectedItemId } = useEditorStore();
  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const lastClickTime = useRef(0);

  const handleEmptySpaceClick = useCallback((e: React.PointerEvent) => {
    // 더블 클릭 방지 (200ms 이내 클릭 무시)
    const now = Date.now();
    if (now - lastClickTime.current < 200) {
      return;
    }
    lastClickTime.current = now;

    // console.log('🎯 빈 공간 핸들러 클릭 감지:', { clientX: e.clientX, clientY: e.clientY });

    // Canvas 요소 확인
    const canvas = gl?.domElement;
    if (!canvas) return;

    // 클릭 위치를 정규화된 디바이스 좌표로 변환
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // console.log('🎯 변환된 좌표:', { mouseX, mouseY });

    // 레이캐스터 설정
    raycaster.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    // 씬의 모든 객체와의 교차점 찾기 (더 깊게 검색)
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    // console.log('🎯 교차점 개수:', intersects.length);

    // 가구 객체와의 충돌 확인 (더 정확하게)
    let isFurnitureHit = false;
    let closestDistance = Infinity;

    for (const intersect of intersects) {
      const object = intersect.object;
      // console.log('🎯 검사 중인 객체:', {
      //   name: object.name,
      //   type: object.type,
      //   userData: object.userData,
      //   distance: intersect.distance
      // });

      // 가구 객체인지 확인 (여러 방법으로)
      if (object.userData?.isFurniture ||
          object.parent?.userData?.isFurniture ||
          object.name?.includes('furniture') ||
          object.name?.includes('DraggableFurniture')) {
        if (intersect.distance < closestDistance) {
          closestDistance = intersect.distance;
          isFurnitureHit = true;
          // console.log('🎯 가구 객체 감지됨:', object.name || 'unnamed');
        }
      }
    }

    // console.log('🎯 최종 판정:', { isFurnitureHit, selectedItemId });

    // 가구 객체와 충돌하지 않았다면 빈 공간 클릭으로 처리
    if (!isFurnitureHit) {
      // 빈 공간 클릭 시 선택된 객체 해제
      if (selectedItemId) {
        // console.log('✅ 빈 공간 클릭: 객체 선택 해제');
        selectItem(null);
      } else {
        // console.log('ℹ️ 빈 공간 클릭: 선택된 객체 없음');
      }
    } else {
      // console.log('❌ 가구 객체 클릭: 빈 공간 처리 무시');
    }

    // 이벤트 전파 중단 (중요!)
    e.stopPropagation();
    e.preventDefault();
  }, [camera, gl, scene, selectedItemId, selectItem]);

  // 터치 이벤트 처리
  const handleEmptySpaceTouch = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // 싱글 터치만 처리

    const touch = e.touches[0];
    const simulatedEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      pointerType: 'touch',
      button: 0,
    } as React.PointerEvent;

    handleEmptySpaceClick(simulatedEvent);
  }, [handleEmptySpaceClick]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1, // 더 낮은 z-index로 3D 객체 이벤트 우선
        cursor: 'default',
        pointerEvents: 'auto'
      }}
      onPointerDown={handleEmptySpaceClick}
      onTouchStart={handleEmptySpaceTouch}
      data-empty-space-handler
    />
  );
}

// ---------- Gesture Overlay ----------
// function GestureOverlay() {
//   const ref = useRef<HTMLDivElement>(null);
//   const addTruck = useCam((s) => s.addTruck);
//   const addZoom = useCam((s) => s.addZoom);
//   const [isDragging, setIsDragging] = React.useState(false);
//   const [lastMouseX, setLastMouseX] = React.useState(0);
//   const [lastMouseY, setLastMouseY] = React.useState(0);

//   // 직접 이벤트 리스너 사용
//   React.useEffect(() => {
//     const element = ref.current;
//     if (!element) return;

//     const handleMouseDown = (e: MouseEvent) => {
//       // 가구 드래그를 방해하지 않도록 이벤트 전파 확인
//       const target = e.target as HTMLElement;
//       if (target && target.closest('[data-furniture]')) {
//         return; // 가구 요소에서는 카메라 드래그 비활성화
//       }
      
//       // 3D 객체와의 충돌 감지를 위해 약간의 지연 추가
//       setTimeout(() => {
//         setIsDragging(true);
//         setLastMouseX(e.clientX);
//         setLastMouseY(e.clientY);
//       }, 10);
      
//       e.preventDefault();
//     };

//     const handleMouseMove = (e: MouseEvent) => {
//       if (!isDragging) return;
      
//       const deltaX = e.clientX - lastMouseX;
//       const deltaY = e.clientY - lastMouseY;
      
//       const speed = 0.01;
//       addTruck(-deltaX * speed, deltaY * speed);
//       // console.log('🖱️ 마우스 드래그:', { deltaX, deltaY, speed });
      
//       setLastMouseX(e.clientX);
//       setLastMouseY(e.clientY);
//       e.preventDefault();
//     };

//     const handleMouseUp = (e: MouseEvent) => {
//       setIsDragging(false);
//       e.preventDefault();
//     };

//     const handleWheel = (e: WheelEvent) => {
//       const deltaY = e.deltaY;
//       const zoomSpeed = 0.5; // 5배 증가 (0.1 → 0.5)
//       addZoom(-deltaY * zoomSpeed); // 방향 반전으로 직관적인 줌
//       // console.log('🎡 휠 이벤트:', { deltaY, zoomSpeed });
//       e.preventDefault();
//     };

//     // 터치 이벤트
//     let lastTouchDistance = 0;
//     let lastTouchX = 0, lastTouchY = 0;

//     const handleTouchStart = (e: TouchEvent) => {
//       e.preventDefault();
      
//       if (e.touches.length === 1) {
//         const touch = e.touches[0];
//         if (touch) {
//           lastTouchX = touch.clientX;
//           lastTouchY = touch.clientY;
//         }
//       } else if (e.touches.length === 2) {
//         const touch1 = e.touches[0];
//         const touch2 = e.touches[1];
//         if (touch1 && touch2) {
//           lastTouchDistance = Math.sqrt(
//             Math.pow(touch2.clientX - touch1.clientX, 2) + 
//             Math.pow(touch2.clientY - touch1.clientY, 2)
//           );
//         }
//       }
//     };

//     const handleTouchMove = (e: TouchEvent) => {
//       e.preventDefault();
      
//       if (e.touches.length === 1) {
//         const touch = e.touches[0];
//         if (touch) {
//           const deltaX = touch.clientX - lastTouchX;
//           const deltaY = touch.clientY - lastTouchY;
          
//           const speed = 0.01;
//           addTruck(-deltaX * speed, deltaY * speed);
//           // console.log('👆 터치 드래그:', { deltaX, deltaY, speed });
          
//           lastTouchX = touch.clientX;
//           lastTouchY = touch.clientY;
//         }
//       } else if (e.touches.length === 2) {
//         const touch1 = e.touches[0];
//         const touch2 = e.touches[1];
//         if (touch1 && touch2) {
//           const currentDistance = Math.sqrt(
//             Math.pow(touch2.clientX - touch1.clientX, 2) + 
//             Math.pow(touch2.clientY - touch1.clientY, 2)
//           );
          
//           const deltaDistance = currentDistance - lastTouchDistance;
//           const zoomSpeed = 0.1; // 10배 증가 (0.01 → 0.1)
//           addZoom(-deltaDistance * zoomSpeed);
//           // console.log('🤏 핀치 줌:', { deltaDistance, zoomSpeed });
          
//           lastTouchDistance = currentDistance;
//         }
//       }
//     };

//     const handleTouchEnd = (e: TouchEvent) => {
//       e.preventDefault();
//     };

//     // 이벤트 리스너 등록
//     element.addEventListener('mousedown', handleMouseDown);
//     element.addEventListener('mousemove', handleMouseMove);
//     element.addEventListener('mouseup', handleMouseUp);
//     element.addEventListener('wheel', handleWheel);
//     element.addEventListener('touchstart', handleTouchStart);
//     element.addEventListener('touchmove', handleTouchMove);
//     element.addEventListener('touchend', handleTouchEnd);

//     return () => {
//       element.removeEventListener('mousedown', handleMouseDown);
//       element.removeEventListener('mousemove', handleMouseMove);
//       element.removeEventListener('mouseup', handleMouseUp);
//       element.removeEventListener('wheel', handleWheel);
//       element.removeEventListener('touchstart', handleTouchStart);
//       element.removeEventListener('touchmove', handleTouchMove);
//       element.removeEventListener('touchend', handleTouchEnd);
//     };
//   }, [isDragging, lastMouseX, lastMouseY, addTruck, addZoom]);

//   // 컴포넌트 마운트 확인
//   React.useEffect(() => {
//     // console.log('🎯 GestureOverlay 마운트됨');
//     return () => // console.log('🎯 GestureOverlay 언마운트됨');
//   }, []);

//   return (
//     <div
//       ref={ref}
//       style={{ 
//         position: "absolute", 
//         inset: 0, 
//         touchAction: "none",
//         zIndex: 30, // UI 요소들보다 낮지만 Canvas보다는 높게 설정
//         pointerEvents: "auto",
//         // 디버깅을 위한 배경색 (개발 시에만)
//         backgroundColor: "rgba(255, 0, 0, 0.05)" // 디버깅용 반투명 배경
//       }}
//       // Use a transparent overlay to capture gestures without blocking clicks on UI
//     />
//   );
// }


// ---------- Main Component ----------
interface MiniRoomProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  minDpr?: number;
  maxDpr?: number;
}

export default function MiniRoom({
  children,
  className = "",
  style = {},
  minDpr = 1,
  maxDpr = 2
}: MiniRoomProps) {
  // 편집 모드 토글은 메뉴바에서 처리
  const { selectItem, selectedItemId } = useEditorStore();

  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative", ...style }}
      className={className}
    >
      {/* 편집 모드 토글 버튼은 메뉴바에서 처리 */}

      {/* Canvas */}
      <Canvas
        shadows
        camera={{ position: [4, 3, 6], fov: 45 }}
          gl={{
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
            depth: true,
            stencil: false,
            logarithmicDepthBuffer: false,
            outputColorSpace: THREE.SRGBColorSpace,
            precision: 'highp' // 고정밀도 렌더링
          }}
        dpr={[minDpr, maxDpr]} // DPR 범위 설정
        style={{ touchAction: "none" }} // 터치 이벤트 활성화
        onCreated={({ gl, size }) => {
          // 초기 렌더링 품질 설정
          gl.setClearColor(0x0e1116);
          gl.outputColorSpace = THREE.SRGBColorSpace;

          // 렌더링 품질 최적화
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;

          // 물리적으로 정확한 조명 활성화
          gl.physicallyCorrectLights = true;

          // console.log(`🎨 MiniRoom 렌더링 품질 설정:`, {
          //   devicePixelRatio: window.devicePixelRatio,
          //   pixelRatio: gl.getPixelRatio(),
          //   canvasSize: size,
          //   antialias: true
          // });
        }}
        onPointerMissed={(event) => {
          // React Three Fiber의 onPointerMissed 이벤트 사용
          // 3D 객체를 클릭하지 않았을 때 호출됨
          console.log('🎯 MiniRoom onPointerMissed 이벤트 발생:', {
            type: event.type,
            pointerType: event.pointerType,
            clientX: event.clientX,
            clientY: event.clientY,
            selectedItemId,
            timestamp: Date.now(),
            target: event.target?.constructor?.name || 'unknown'
          });

          // 가구 클릭과 구분하기 위한 시간 체크
          const lastFurnitureClickTime = (window as any).lastFurnitureClickTime || 0;
          const currentTime = Date.now();
          const timeDiff = currentTime - lastFurnitureClickTime;
          
          // 가구 클릭 후 100ms 이내라면 빈 공간 클릭으로 처리하지 않음
          if (timeDiff < 100) {
            console.log('⚠️ MiniRoom 가구 클릭 후 100ms 이내 - 빈 공간 클릭 무시');
            return;
          }

          if (selectedItemId) {
            console.log('✅ MiniRoom 빈 공간 클릭: 객체 선택 해제 실행');
            selectItem(null);
            console.log('✅ MiniRoom selectItem(null) 호출 완료');
          } else {
            console.log('ℹ️ MiniRoom 빈 공간 클릭: 선택된 객체 없음');
          }
        }}
        onPointerDown={(event) => {
          // 3D 객체가 아닌 빈 공간을 클릭했을 때도 처리
          // console.log('🎯 Canvas 포인터 다운 이벤트:', {
          //   type: event.type,
          //   pointerType: event.pointerType,
          //   clientX: event.clientX,
          //   clientY: event.clientY,
          //   selectedItemId,
          //   timestamp: Date.now()
          // });
        }}
      >
        <LightRig />
        <Floor />

        {/* PresentationControls 비활성화 - 우리의 제스처 핸들러와 충돌 방지 */}
        {/* <Editable enabled={edit} /> */}

        {/* CameraControls 비활성화 - 직접 이벤트 처리로 대체 */}
        {/* <CameraControls 
          ref={camRef} 
          makeDefault 
          dollyToCursor={true} 
          minDistance={2} 
          maxDistance={20}
        /> */}

        {/* Camera Controller for gesture handling */}
        <CameraController />

        {/* 렌더링 품질 일정 유지 컴포넌트 */}
        <RenderQualityStabilizer />

        {/* Fallback OrbitControls (disabled by default) */}
        {/* <OrbitControls /> */}

        {/* Small helper HUD - 제거됨 */}

        {/* Custom children (for existing 3D content) */}
        {children}
      </Canvas>

      {/* 빈 공간 클릭 핸들러 - Canvas의 onPointerMissed로 대체 */}
      {/* <EmptySpaceHandler /> */}

      {/* Full-screen transparent overlay to capture gestures - 외부 컨트롤 사용 시 비활성화 */}
      {/* <GestureOverlay /> */}
    </div>
  );
}
