// @react-three/fiber 모듈 모킹
import React from 'react';

export const Canvas = ({ children, ...props }) => (
  <div data-testid="canvas" {...props}>
    {children}
  </div>
);

export const useFrame = jest.fn();
export const useThree = jest.fn(() => ({
  camera: { position: { x: 0, y: 0, z: 5 } },
  scene: { children: [] },
  gl: { domElement: document.createElement('canvas') },
  raycaster: { set: jest.fn(), intersectObjects: jest.fn(() => []) },
  mouse: { x: 0, y: 0 },
  viewport: { width: 800, height: 600 },
  size: { width: 800, height: 600 },
  clock: { getElapsedTime: jest.fn(() => 0) },
}));

export const extend = jest.fn();
export const createRoot = jest.fn(() => ({
  render: jest.fn(),
  unmount: jest.fn(),
}));

export default {
  Canvas,
  useFrame,
  useThree,
  extend,
  createRoot,
};
