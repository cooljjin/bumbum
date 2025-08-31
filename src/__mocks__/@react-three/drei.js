// @react-three/drei 모듈 모킹
import React from 'react';

export const OrbitControls = ({ children, ...props }) => (
  <div data-testid="orbit-controls" {...props}>
    {children}
  </div>
);

export const Environment = ({ children, ...props }) => (
  <div data-testid="environment" {...props}>
    {children}
  </div>
);

export const useGLTF = jest.fn(() => ({
  scene: { children: [] },
  animations: [],
  nodes: {},
  materials: {},
}));

export const useTexture = jest.fn(() => ({}));
export const useProgress = jest.fn(() => ({
  progress: 100,
  loaded: 1,
  total: 1,
}));

export const Html = ({ children, ...props }) => (
  <div data-testid="html" {...props}>
    {children}
  </div>
);

export const Text = ({ children, ...props }) => (
  <div data-testid="text" {...props}>
    {children}
  </div>
);

export const Float = ({ children, ...props }) => (
  <div data-testid="float" {...props}>
    {children}
  </div>
);

export const PresentationControls = ({ children, ...props }) => (
  <div data-testid="presentation-controls" {...props}>
    {children}
  </div>
);

export const Stage = ({ children, ...props }) => (
  <div data-testid="stage" {...props}>
    {children}
  </div>
);

export default {
  OrbitControls,
  Environment,
  useGLTF,
  useTexture,
  useProgress,
  Html,
  Text,
  Float,
  PresentationControls,
  Stage,
};
