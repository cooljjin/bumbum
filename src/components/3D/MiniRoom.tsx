'use client';

import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CameraControls, PresentationControls, TransformControls, Html } from "@react-three/drei";
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
  addZoom: (dz) => set((s) => ({ zoom: Math.min(Math.max(s.zoom + dz, -5), 5) })),
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
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} castShadow />
    </>
  );
}

function CuteBox(props: React.ComponentProps<"mesh">) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.2;
  });
  return (
    <mesh ref={ref} castShadow receiveShadow {...props}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#7ccfff" metalness={0.1} roughness={0.6} />
    </mesh>
  );
}

// ---------- Camera Controller (Canvas 내부) ----------
function CameraController({ controls }: { controls: React.RefObject<CameraControls | null> }) {
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

// ---------- Gesture Overlay ----------
function GestureOverlay({ }: { controls: React.RefObject<CameraControls | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const addTruck = useCam((s) => s.addTruck);
  const addZoom = useCam((s) => s.addZoom);
  const [isDragging, setIsDragging] = React.useState(false);
  const [lastMouseX, setLastMouseX] = React.useState(0);
  const [lastMouseY, setLastMouseY] = React.useState(0);

  // 직접 이벤트 리스너 사용
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setLastMouseX(e.clientX);
      setLastMouseY(e.clientY);
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;
      
      const speed = 0.01;
      addTruck(-deltaX * speed, deltaY * speed);
      console.log('🖱️ 마우스 드래그:', { deltaX, deltaY, speed });
      
      setLastMouseX(e.clientX);
      setLastMouseY(e.clientY);
      e.preventDefault();
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      e.preventDefault();
    };

    const handleWheel = (e: WheelEvent) => {
      const deltaY = e.deltaY;
      const zoomSpeed = 0.1;
      addZoom(deltaY * zoomSpeed);
      console.log('🎡 휠 이벤트:', { deltaY });
      e.preventDefault();
    };

    // 터치 이벤트
    let lastTouchDistance = 0;
    let lastTouchX = 0, lastTouchY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - lastTouchX;
        const deltaY = e.touches[0].clientY - lastTouchY;
        
        const speed = 0.01;
        addTruck(-deltaX * speed, deltaY * speed);
        console.log('👆 터치 드래그:', { deltaX, deltaY, speed });
        
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        const deltaDistance = currentDistance - lastTouchDistance;
        const zoomSpeed = 0.01;
        addZoom(-deltaDistance * zoomSpeed);
        console.log('🤏 핀치 줌:', { deltaDistance, zoomSpeed });
        
        lastTouchDistance = currentDistance;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
    };

    // 이벤트 리스너 등록
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('wheel', handleWheel);
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('wheel', handleWheel);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, lastMouseX, lastMouseY, addTruck, addZoom]);

  // 컴포넌트 마운트 확인
  React.useEffect(() => {
    console.log('🎯 GestureOverlay 마운트됨');
    return () => console.log('🎯 GestureOverlay 언마운트됨');
  }, []);

  return (
    <div
      ref={ref}
      style={{ 
        position: "absolute", 
        inset: 0, 
        touchAction: "none",
        zIndex: 30, // UI 요소들보다 낮지만 Canvas보다는 높게 설정
        pointerEvents: "auto",
        // 디버깅을 위한 배경색 (개발 시에만)
        backgroundColor: "rgba(255, 0, 0, 0.1)" // 디버깅용 반투명 배경
      }}
      // Use a transparent overlay to capture gestures without blocking clicks on UI
    />
  );
}

// ---------- Edit Mode wrapper ----------
function Editable({ enabled }: { enabled: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  return enabled ? (
    <TransformControls mode="translate" object={meshRef as any}>
      <CuteBox ref={meshRef as any} position={[0, 0.5, 0]} />
    </TransformControls>
  ) : (
    <CuteBox ref={meshRef as any} position={[0, 0.5, 0]} />
  );
}

// ---------- Main Component ----------
interface MiniRoomProps {
  isEditMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  useExternalControls?: boolean; // 외부 카메라 컨트롤 사용 여부
}

export default function MiniRoom({ 
  isEditMode: externalEditMode, 
  onEditModeChange,
  children,
  className = "",
  style = {},
  useExternalControls = false
}: MiniRoomProps) {
  const [edit, setEdit] = useState(externalEditMode ?? false);
  const camRef = useRef<CameraControls>(null);

  const handleEditToggle = () => {
    const newEditMode = !edit;
    setEdit(newEditMode);
    onEditModeChange?.(newEditMode);
  };

  return (
    <div 
      style={{ width: "100%", height: "100%", position: "relative", ...style }}
      className={className}
    >
      {/* Top UI */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 60, // GestureOverlay보다 높게 설정
          display: "flex",
          gap: 8,
          alignItems: "center",
          padding: "8px 10px",
          borderRadius: 12,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(6px)",
          color: "white",
          userSelect: "none",
          pointerEvents: "auto", // 클릭 이벤트는 허용
        }}
      >
        <button
          onClick={handleEditToggle}
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            border: 0,
            background: edit ? "#60a5fa" : "#374151",
            color: "white",
            fontSize: 14,
          }}
        >
          {edit ? "Edit: ON" : "Edit: OFF"}
        </button>
        <button
          onClick={() => useCam.getState().reset()}
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            border: 0,
            background: "#374151",
            color: "white",
            fontSize: 14,
          }}
        >
          Reset View
        </button>
        <span style={{ opacity: 0.8, fontSize: 12 }}>
          • Drag = Pan • Pinch/Wheel = Zoom
        </span>
      </div>

      {/* Canvas */}
      <Canvas
        shadows
        camera={{ position: [4, 3, 6], fov: 45 }}
        gl={{ antialias: true }}
        style={{ touchAction: "none" }} // 터치 이벤트 활성화
        onCreated={({ gl }) => {
          gl.setClearColor(0x0e1116);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          // gl.physicallyCorrectLights = true; // 이 속성은 더 이상 사용되지 않음
        }}
      >
        <LightRig />
        <Floor />

        {/* PresentationControls 비활성화 - 우리의 제스처 핸들러와 충돌 방지 */}
        <Editable enabled={edit} />

        {/* CameraControls 비활성화 - 직접 이벤트 처리로 대체 */}
        {/* <CameraControls 
          ref={camRef} 
          makeDefault 
          dollyToCursor={true} 
          minDistance={2} 
          maxDistance={20}
        /> */}

        {/* Camera Controller for gesture handling */}
        <CameraController controls={camRef} />

        {/* Fallback OrbitControls (disabled by default) */}
        {/* <OrbitControls /> */}

        {/* Small helper HUD */}
        <Html position={[0, 1.6, 0]} center>
          <div style={{
            padding: "4px 8px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#e5e7eb",
            fontSize: 12,
            whiteSpace: "nowrap",
            userSelect: "none",
            pointerEvents: "none", // 터치 이벤트 차단하지 않도록
          }}>
            Touch: pinch = zoom, drag = pan
          </div>
        </Html>

        {/* Custom children (for existing 3D content) */}
        {children}
      </Canvas>

      {/* Full-screen transparent overlay to capture gestures - 외부 컨트롤 사용 시 비활성화 */}
      {!useExternalControls && <GestureOverlay controls={camRef} />}
    </div>
  );
}