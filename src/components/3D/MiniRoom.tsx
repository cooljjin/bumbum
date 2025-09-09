'use client';

import React, { useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
// import { useGesture } from "@use-gesture/react"; // 직접 이벤트 리스너 사용으로 변경
import { create } from "zustand";

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
  return <primitive object={grid} position={[0, -0.01, 0]} />;
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
//       console.log('🖱️ 마우스 드래그:', { deltaX, deltaY, speed });
      
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
//       console.log('🎡 휠 이벤트:', { deltaY, zoomSpeed });
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
//           console.log('👆 터치 드래그:', { deltaX, deltaY, speed });
          
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
//           console.log('🤏 핀치 줌:', { deltaDistance, zoomSpeed });
          
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
//     console.log('🎯 GestureOverlay 마운트됨');
//     return () => console.log('🎯 GestureOverlay 언마운트됨');
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
          
          console.log(`🎨 MiniRoom 렌더링 품질 설정:`, {
            devicePixelRatio: window.devicePixelRatio,
            pixelRatio: gl.getPixelRatio(),
            canvasSize: size,
            antialias: true
          });
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

      {/* Full-screen transparent overlay to capture gestures - 외부 컨트롤 사용 시 비활성화 */}
      {/* <GestureOverlay /> */}
    </div>
  );
}