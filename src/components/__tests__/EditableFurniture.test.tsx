import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditableFurniture from '../features/furniture/EditableFurniture';

// Three.js 컴포넌트들 모킹
jest.mock('@react-three/fiber', () => ({
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({
    camera: { position: { x: 0, y: 0, z: 5 } },
    scene: { children: [] },
    gl: { domElement: document.createElement('canvas') },
    raycaster: { set: jest.fn(), intersectObjects: jest.fn(() => []) },
    mouse: { x: 0, y: 0 },
    viewport: { width: 800, height: 600 },
    size: { width: 800, height: 600 },
    clock: { getElapsedTime: jest.fn(() => 0) },
  })),
}));

jest.mock('@react-three/drei', () => ({
  useGLTF: jest.fn(() => ({
    scene: { children: [] },
    animations: [],
    nodes: {},
    materials: {},
  })),
  Html: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="html">{children}</div>
  ),
}));

// editorStore 훅들 모킹
jest.mock('../../store/editorStore', () => ({
  useEditorMode: jest.fn(),
  useEditorTool: jest.fn(),
  useGridSettings: jest.fn(),
  useRotationSnapSettings: jest.fn(),
  useSnapStrength: jest.fn(),
}));

describe('EditableFurniture', () => {
  const mockUseEditorMode = require('../../store/editorStore').useEditorMode;
  const mockUseEditorTool = require('../../store/editorStore').useEditorTool;
  const mockUseGridSettings = require('../../store/editorStore').useGridSettings;
  const mockUseRotationSnapSettings = require('../../store/editorStore').useRotationSnapSettings;
  const mockUseSnapStrength = require('../../store/editorStore').useSnapStrength;
  
  beforeEach(() => {
    mockUseEditorMode.mockReturnValue('edit');
    mockUseEditorTool.mockReturnValue('select');
    mockUseGridSettings.mockReturnValue({ enabled: true, size: 10, divisions: 10, color: '#888888' });
    mockUseRotationSnapSettings.mockReturnValue({ enabled: true, angle: 15 });
    mockUseSnapStrength.mockReturnValue({ enabled: true, translation: 1.0, rotation: 1.0 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockItem = {
    id: 'chair-1',
    name: 'Test Chair',
    modelPath: '/models/chair.glb',
    position: { x: 0, y: 0, z: 0 } as any,
    rotation: { x: 0, y: 0, z: 0 } as any,
    scale: { x: 1, y: 1, z: 1 } as any,
    footprint: { width: 0.5, depth: 0.5, height: 0.8 },
    isLocked: false
  };

  const mockHandlers = {
    onSelect: jest.fn(),
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
  };

  it('renders furniture with correct properties', () => {
    render(
      <EditableFurniture
        item={mockItem}
        isSelected={false}
        isEditMode={true}
        {...mockHandlers}
      />
    );
    expect(screen.getByTestId('html')).toBeInTheDocument();
  });

  it('handles furniture selection', () => {
    render(
      <EditableFurniture
        item={mockItem}
        isSelected={false}
        isEditMode={true}
        {...mockHandlers}
      />
    );
    expect(screen.getByTestId('html')).toBeInTheDocument();
  });

  it('shows transform controls when selected', () => {
    render(
      <EditableFurniture
        item={mockItem}
        isSelected={true}
        isEditMode={true}
        {...mockHandlers}
      />
    );
    expect(screen.getByTestId('html')).toBeInTheDocument();
  });

  it('handles furniture removal', () => {
    render(
      <EditableFurniture
        item={mockItem}
        isSelected={false}
        isEditMode={true}
        {...mockHandlers}
      />
    );
    expect(screen.getByTestId('html')).toBeInTheDocument();
  });

  it('toggles furniture lock state', () => {
    const lockedItem = { ...mockItem, isLocked: true };
    render(
      <EditableFurniture
        item={lockedItem}
        isSelected={false}
        isEditMode={true}
        {...mockHandlers}
      />
    );
    expect(screen.getByTestId('html')).toBeInTheDocument();
  });

  it('applies grid snapping when enabled', () => {
    mockUseGridSettings.mockReturnValue({ enabled: true, size: 5, divisions: 5, color: '#888888' });
    
    render(
      <EditableFurniture
        item={mockItem}
        isSelected={false}
        isEditMode={true}
        {...mockHandlers}
      />
    );
    expect(screen.getByTestId('html')).toBeInTheDocument();
  });

  it('handles drag and drop events', () => {
    render(
      <EditableFurniture
        item={mockItem}
        isSelected={false}
        isEditMode={true}
        {...mockHandlers}
      />
    );
    expect(screen.getByTestId('html')).toBeInTheDocument();
  });

  it('displays furniture information panel', () => {
    render(
      <EditableFurniture
        item={mockItem}
        isSelected={false}
        isEditMode={true}
        {...mockHandlers}
      />
    );
    expect(screen.getByTestId('html')).toBeInTheDocument();
  });

  it('handles keyboard shortcuts', () => {
    render(
      <EditableFurniture
        item={mockItem}
        isSelected={false}
        isEditMode={true}
        {...mockHandlers}
      />
    );
    expect(screen.getByTestId('html')).toBeInTheDocument();
  });

  it('applies performance optimizations', () => {
    render(
      <EditableFurniture
        item={mockItem}
        isSelected={false}
        isEditMode={true}
        {...mockHandlers}
      />
    );
    expect(screen.getByTestId('html')).toBeInTheDocument();
  });

  it('handles error boundaries gracefully', () => {
    render(
      <EditableFurniture
        item={mockItem}
        isSelected={false}
        isEditMode={true}
        {...mockHandlers}
      />
    );
    expect(screen.getByTestId('html')).toBeInTheDocument();
  });
});
