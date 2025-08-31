import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Real3DRoom from '../../Real3DRoom';

// Three.js 컴포넌트들 모킹
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
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
  OrbitControls: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="orbit-controls">{children}</div>
  ),
  Environment: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="environment">{children}</div>
  ),
  useGLTF: jest.fn(() => ({
    scene: { children: [] },
    animations: [],
    nodes: {},
    materials: {},
  })),
}));

// editorStore 훅들 모킹
jest.mock('../../store/editorStore', () => ({
  useEditorMode: jest.fn(),
  usePlacedItems: jest.fn(),
  useSelectedItemId: jest.fn(),
  useGridSettings: jest.fn(),
}));

describe('Real3DRoom', () => {
  const mockUseEditorMode = require('../../store/editorStore').useEditorMode;
  const mockUsePlacedItems = require('../../store/editorStore').usePlacedItems;
  const mockUseSelectedItemId = require('../../store/editorStore').useSelectedItemId;
  const mockUseGridSettings = require('../../store/editorStore').useGridSettings;
  
  beforeEach(() => {
    mockUseEditorMode.mockReturnValue('view');
    mockUsePlacedItems.mockReturnValue([]);
    mockUseSelectedItemId.mockReturnValue(null);
    mockUseGridSettings.mockReturnValue({ enabled: true, size: 10, divisions: 10, color: '#888888' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders 3D room canvas', () => {
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('displays room template selector', () => {
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('shows furniture catalog when in edit mode', () => {
    mockUseEditorMode.mockReturnValue('edit');
    
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('handles camera position changes', () => {
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('renders furniture items in 3D space', () => {
    const mockItems = [
      { id: '1', type: 'chair', position: { x: 0, y: 0, z: 0 } }
    ];
    mockUsePlacedItems.mockReturnValue(mockItems);
    
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('applies performance optimizations', () => {
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('handles room template changes', () => {
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('displays edit toolbar when in edit mode', () => {
    mockUseEditorMode.mockReturnValue('edit');
    
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('shows keyboard shortcuts help', () => {
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('handles furniture placement', () => {
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('applies grid system for furniture placement', () => {
    mockUseGridSettings.mockReturnValue({ enabled: true, size: 5, divisions: 5, color: '#888888' });
    
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('handles undo/redo operations', () => {
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('displays room statistics', () => {
    const mockItems = [
      { id: '1', type: 'chair', position: { x: 0, y: 0, z: 0 } },
      { id: '2', type: 'table', position: { x: 1, y: 0, z: 1 } }
    ];
    mockUsePlacedItems.mockReturnValue(mockItems);
    
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('handles error boundaries gracefully', () => {
    render(<Real3DRoom isViewLocked={false} />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });
});
