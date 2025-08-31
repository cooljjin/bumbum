import React from 'react';
import { render } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import Avatar from '../ui/Avatar';

// Mock @react-three/fiber
jest.mock('@react-three/fiber', () => ({
  useFrame: jest.fn(),
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
}));

// Mock three.js
jest.mock('three', () => ({
  Group: jest.fn().mockImplementation(() => ({
    position: { set: jest.fn() },
    add: jest.fn(),
    remove: jest.fn(),
  })),
  Mesh: jest.fn().mockImplementation(() => ({
    position: { set: jest.fn(), copy: jest.fn() },
    rotation: { set: jest.fn() },
    scale: { set: jest.fn() },
    geometry: {},
    material: {},
    castShadow: false,
    receiveShadow: false,
  })),
  CylinderGeometry: jest.fn(),
  SphereGeometry: jest.fn(),
  ConeGeometry: jest.fn(),
  TorusGeometry: jest.fn(),
  BoxGeometry: jest.fn(),
  MeshStandardMaterial: jest.fn(),
}));

describe('Avatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders avatar with default props', () => {
    const { container } = render(
      <Canvas>
        <Avatar />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('renders avatar with castShadow enabled', () => {
    const { container } = render(
      <Canvas>
        <Avatar castShadow={true} />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('renders avatar with castShadow disabled', () => {
    const { container } = render(
      <Canvas>
        <Avatar castShadow={false} />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('renders all avatar parts correctly', () => {
    const { container } = render(
      <Canvas>
        <Avatar castShadow={true} />
      </Canvas>
    );

    // Canvas가 렌더링되는지 확인
    const canvas = container.querySelector('[data-testid="canvas"]');
    expect(canvas).toBeInTheDocument();

    // Avatar 컴포넌트가 렌더링되는지 확인 (간접적으로 확인)
    expect(container.firstChild).toBeTruthy();
  });

  it('handles animation frame updates', () => {
    const mockUseFrame = require('@react-three/fiber').useFrame;
    const mockCallback = jest.fn();

    mockUseFrame.mockImplementation((callback: any) => {
      callback({
        clock: {
          elapsedTime: 1.0
        }
      });
    });

    render(
      <Canvas>
        <Avatar />
      </Canvas>
    );

    // useFrame이 호출되었는지 확인
    expect(mockUseFrame).toHaveBeenCalled();
  });

  it('applies correct materials and colors', () => {
    const { container } = render(
      <Canvas>
        <Avatar castShadow={true} />
      </Canvas>
    );

    // 컴포넌트가 정상적으로 렌더링되는지 확인
    expect(container).toBeInTheDocument();

    // Three.js 객체들이 생성되었는지 확인 (간접적으로)
    const MeshStandardMaterial = require('three').MeshStandardMaterial;
    expect(MeshStandardMaterial).toHaveBeenCalled();
  });

  it('renders jacket with correct color and properties', () => {
    const { container } = render(
      <Canvas>
        <Avatar castShadow={true} />
      </Canvas>
    );

    expect(container).toBeInTheDocument();

    // 검은색 재킷을 위한 MeshStandardMaterial이 호출되었는지 확인
    const MeshStandardMaterial = require('three').MeshStandardMaterial;
    expect(MeshStandardMaterial).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '#000000'
      })
    );
  });

  it('renders head with correct skin color', () => {
    const { container } = render(
      <Canvas>
        <Avatar />
      </Canvas>
    );

    expect(container).toBeInTheDocument();

    // 피부색 머리를 위한 MeshStandardMaterial이 호출되었는지 확인
    const MeshStandardMaterial = require('three').MeshStandardMaterial;
    expect(MeshStandardMaterial).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '#FFE4B5'
      })
    );
  });

  it('renders buttons on jacket', () => {
    const { container } = render(
      <Canvas>
        <Avatar />
      </Canvas>
    );

    expect(container).toBeInTheDocument();

    // 흰색 단추들을 위한 MeshStandardMaterial이 여러 번 호출되었는지 확인
    const MeshStandardMaterial = require('three').MeshStandardMaterial;
    const calls = MeshStandardMaterial.mock.calls.filter(call =>
      call[0] && call[0].color === '#FFFFFF'
    );
    expect(calls.length).toBeGreaterThan(0); // 단추들이 렌더링됨
  });

  it('renders pants with correct color', () => {
    const { container } = render(
      <Canvas>
        <Avatar />
      </Canvas>
    );

    expect(container).toBeInTheDocument();

    // 흰색 바지를 위한 MeshStandardMaterial이 호출되었는지 확인
    const MeshStandardMaterial = require('three').MeshStandardMaterial;
    expect(MeshStandardMaterial).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '#FFFFFF'
      })
    );
  });

  it('renders shoes with correct colors', () => {
    const { container } = render(
      <Canvas>
        <Avatar />
      </Canvas>
    );

    expect(container).toBeInTheDocument();

    // 신발과 밑창을 위한 MeshStandardMaterial이 호출되었는지 확인
    const MeshStandardMaterial = require('three').MeshStandardMaterial;
    expect(MeshStandardMaterial).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '#FFFFFF' // 신발
      })
    );
    expect(MeshStandardMaterial).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '#E0E0E0' // 밑창
      })
    );
  });

  it('renders facial features correctly', () => {
    const { container } = render(
      <Canvas>
        <Avatar />
      </Canvas>
    );

    expect(container).toBeInTheDocument();

    // 눈, 코, 입을 위한 검은색 재질이 호출되었는지 확인
    const MeshStandardMaterial = require('three').MeshStandardMaterial;
    expect(MeshStandardMaterial).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '#000000' // 눈
      })
    );
    expect(MeshStandardMaterial).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '#FF69B4' // 입
      })
    );
  });

  it('renders arms and hands in yoga pose', () => {
    const { container } = render(
      <Canvas>
        <Avatar />
      </Canvas>
    );

    expect(container).toBeInTheDocument();

    // 팔과 손이 렌더링되는지 확인 (기하학적 객체들이 생성되는지 간접적으로 확인)
    const CylinderGeometry = require('three').CylinderGeometry;
    expect(CylinderGeometry).toHaveBeenCalled(); // 팔을 위한 실린더

    const SphereGeometry = require('three').SphereGeometry;
    expect(SphereGeometry).toHaveBeenCalled(); // 손을 위한 구체
  });

  it('handles missing castShadow prop gracefully', () => {
    // castShadow prop 없이 렌더링되는지 확인
    const { container } = render(
      <Canvas>
        <Avatar />
      </Canvas>
    );

    expect(container).toBeInTheDocument();
  });

  it('applies shadow properties correctly when castShadow is true', () => {
    const { container } = render(
      <Canvas>
        <Avatar castShadow={true} />
      </Canvas>
    );

    expect(container).toBeInTheDocument();

    // Shadow 속성이 적용되는지 확인 (간접적으로)
    const Mesh = require('three').Mesh;
    expect(Mesh).toHaveBeenCalled();
  });

  it('maintains proper component structure', () => {
    const { container } = render(
      <Canvas>
        <Avatar />
      </Canvas>
    );

    expect(container).toBeInTheDocument();

    // 컴포넌트가 정상적으로 마운트되는지 확인
    const canvasElement = container.querySelector('[data-testid="canvas"]');
    expect(canvasElement).toBeInTheDocument();
    expect(canvasElement?.children.length).toBeGreaterThan(0);
  });
});
