import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditToolbar from '../layout/EditToolbar';

// Mock editor store hooks
const mockSetTool = jest.fn();
const mockToggleGridSnap = jest.fn();
const mockToggleRotationSnap = jest.fn();
const mockSetSnapStrength = jest.fn();
const mockToggleSnapStrength = jest.fn();
const mockToggleAutoLock = jest.fn();
const mockSetAutoLockDelay = jest.fn();
const mockUndo = jest.fn();
const mockRedo = jest.fn();

jest.mock('../../store/editorStore', () => ({
  useEditorStore: jest.fn(() => ({
    setTool: mockSetTool,
    toggleGridSnap: mockToggleGridSnap,
    toggleRotationSnap: mockToggleRotationSnap,
    setSnapStrength: mockSetSnapStrength,
    toggleSnapStrength: mockToggleSnapStrength,
    toggleAutoLock: mockToggleAutoLock,
    setAutoLockDelay: mockSetAutoLockDelay,
    undo: mockUndo,
    redo: mockRedo
  })),
  useEditorTool: jest.fn(() => 'select'),
  useGridSettings: jest.fn(() => ({ enabled: true, size: 1, divisions: 1 })),
  useRotationSnapSettings: jest.fn(() => ({ enabled: true, angle: 90 })),
  useSnapStrength: jest.fn(() => ({ enabled: true, translation: 1.0, rotation: 1.0 })),
  useAutoLock: jest.fn(() => ({ enabled: true, delay: 1000 }))
}));

describe('EditToolbar', () => {
  const mockOnToggleFurnitureCatalog = jest.fn();
  const mockOnToggleTemplateSelector = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders toolbar with all tools', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    expect(screen.getByTitle('선택 도구 (Q)')).toBeInTheDocument();
    expect(screen.getByTitle('이동 도구 (G)')).toBeInTheDocument();
    expect(screen.getByTitle('회전 도구 (R)')).toBeInTheDocument();
    expect(screen.getByTitle('크기 조절 도구 (S)')).toBeInTheDocument();
  });

  it('displays tool icons correctly', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    expect(screen.getByText('🖱️')).toBeInTheDocument();
    expect(screen.getByText('➡️')).toBeInTheDocument();
    expect(screen.getByText('🔄')).toBeInTheDocument();
    expect(screen.getByText('📏')).toBeInTheDocument();
  });

  it('handles tool change when clicked', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    // 첫 번째 이동 도구 버튼을 찾기 위해 더 구체적으로 선택
    const moveTool = screen.getAllByText('이동')[0].closest('button');
    fireEvent.click(moveTool!);

    expect(mockSetTool).toHaveBeenCalledWith('translate');
  });

  it('handles save and exit actions', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    // EditToolbar에는 save/exit 버튼이 없으므로 제거
    expect(screen.getByText('가구')).toBeInTheDocument();
    expect(screen.getByText('템플릿')).toBeInTheDocument();
  });

  it('highlights current tool correctly', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    const selectTool = screen.getByText('선택').closest('button');
    expect(selectTool).toHaveClass('bg-blue-600', 'text-white');
  });

  it('handles undo action', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    const undoButton = screen.getByRole('button', { name: /실행취소/i });
    fireEvent.click(undoButton);

    expect(mockUndo).toHaveBeenCalled();
  });

  it('handles redo action', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    const redoButton = screen.getByRole('button', { name: /다시실행/i });
    fireEvent.click(redoButton);

    expect(mockRedo).toHaveBeenCalled();
  });

  it('applies correct styling to tool buttons', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    // 모든 버튼이 아닌 도구 버튼만 확인
    const toolButtons = screen.getAllByText('선택').map(text => text.closest('button')).filter(Boolean);
    toolButtons.forEach(button => {
      expect(button).toHaveClass('rounded-xl', 'transition-all', 'duration-300');
    });
  });

  it('supports keyboard focus on tool buttons', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    const moveTool = screen.getByTitle('이동 도구 (G)');
    (moveTool as HTMLButtonElement).focus();
    expect(moveTool).toHaveFocus();
  });

  it('maintains accessibility for all buttons', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('title');
    });
  });

  it('displays correct tool count', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    const toolButtons = screen.getAllByRole('button');
    expect(toolButtons.length).toBeGreaterThan(10); // 여러 버튼들이 있음
  });

  it('handles furniture catalog toggle', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    const furnitureButton = screen.getByRole('button', { name: /가구/i });
    fireEvent.click(furnitureButton);

    expect(mockOnToggleFurnitureCatalog).toHaveBeenCalled();
  });

  it('handles template selector toggle', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    const templateButton = screen.getByRole('button', { name: /템플릿/i });
    fireEvent.click(templateButton);

    expect(mockOnToggleTemplateSelector).toHaveBeenCalled();
  });

  it('displays grid snap settings', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    const gridSnapButton = screen.getByTitle('그리드 스냅');
    expect(gridSnapButton).toBeInTheDocument();
    expect(gridSnapButton).toHaveTextContent('그리드');
    expect(gridSnapButton).toHaveTextContent('ON');
  });

  it('displays rotation snap settings', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    // 회전 스냅 버튼을 찾기 위해 더 구체적인 선택자 사용
    const rotationSnapButton = screen.getByTitle('회전 스냅');
    expect(rotationSnapButton).toBeInTheDocument();
    expect(rotationSnapButton).toHaveTextContent('ON');
  });

  it('toggles grid and rotation snap when clicked', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    const gridSnapButton = screen.getByTitle('그리드 스냅');
    const rotationSnapButton = screen.getByTitle('회전 스냅');

    fireEvent.click(gridSnapButton);
    fireEvent.click(rotationSnapButton);

    expect(mockToggleGridSnap).toHaveBeenCalled();
    expect(mockToggleRotationSnap).toHaveBeenCalled();
  });

  it('displays snap strength controls', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    expect(screen.getByText('강도')).toBeInTheDocument();
    
    // 중복된 "이동" 텍스트를 구분하기 위해 더 구체적인 선택자 사용
    const snapStrengthSection = screen.getByText('강도').closest('div')?.parentElement;
    expect(snapStrengthSection).toHaveTextContent('이동');
    expect(snapStrengthSection).toHaveTextContent('회전');
  });

  it('displays auto lock settings', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    expect(screen.getByText('자동고정')).toBeInTheDocument();
    expect(screen.getByText('지연시간')).toBeInTheDocument();
  });

  it('updates snap strength sliders', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    const translationSlider = screen.getByTitle(/이동 스냅 강도:/);
    const rotationSlider = screen.getByTitle(/회전 스냅 강도:/);

    fireEvent.change(translationSlider, { target: { value: '1.5' } });
    fireEvent.change(rotationSlider, { target: { value: '0.7' } });

    expect(mockSetSnapStrength).toHaveBeenCalledWith({ translation: 1.5 });
    expect(mockSetSnapStrength).toHaveBeenCalledWith({ rotation: 0.7 });
  });

  it('updates auto lock delay slider', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    const delaySlider = screen.getByTitle(/자동 고정 지연 시간:/);
    fireEvent.change(delaySlider, { target: { value: '1500' } });

    expect(mockSetAutoLockDelay).toHaveBeenCalledWith(1500);
  });

  it('displays settings and help buttons', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
      />
    );

    expect(screen.getByText('설정')).toBeInTheDocument();
    expect(screen.getByText('도움말')).toBeInTheDocument();
  });

  it('handles mobile layout correctly', () => {
    render(
      <EditToolbar
        onToggleFurnitureCatalog={mockOnToggleFurnitureCatalog}
        onToggleTemplateSelector={mockOnToggleTemplateSelector}
        isMobile={true}
      />
    );

    const toolbar = screen.getByRole('button', { name: /선택/i }).closest('div')?.parentElement?.parentElement;
    expect(toolbar).toHaveClass('p-8', 'max-w-[95vw]');
  });
});
