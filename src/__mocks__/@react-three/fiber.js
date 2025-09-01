// @react-three/fiber 모듈 모킹
export const Canvas = () => null;
export const useFrame = () => {};
export const useThree = () => ({
  camera: {},
  scene: {},
  gl: {},
  size: { width: 800, height: 600 },
});
export const useLoader = () => null;
export const extend = () => {};
export const createRoot = () => ({
  render: () => {},
  unmount: () => {},
});