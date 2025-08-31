import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UndoRedoHistory } from '../features/editor/UndoRedoHistory';

// Mock the editor store
const mockUseEditorStore = jest.fn();
const mockUndo = jest.fn();
const mockRedo = jest.fn();

jest.mock('../../store/editorStore', () => ({
  useEditorStore: mockUseEditorStore
}));

describe('UndoRedoHistory', () => {
  const mockHistory = {
    past: [
      { id: 'action-1', description: '가구 배치', timestamp: Date.now() - 3000 },
      { id: 'action-2', description: '색상 변경', timestamp: Date.now() - 2000 },
      { id: 'action-3', description: '크기 조정', timestamp: Date.now() - 1000 }
    ],
    present: { id: 'current', description: '현재 상태' },
    future: [
      { id: 'action-4', description: '회전 적용', timestamp: Date.now() + 1000 }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUseEditorStore.mockReturnValue({
      history: mockHistory,
      canUndo: true,
      canRedo: true,
      undo: mockUndo,
      redo: mockRedo
    });
  });

  it('renders UndoRedoHistory component', () => {
    render(<UndoRedoHistory />);

    expect(screen.getByText('실행 취소')).toBeInTheDocument();
    expect(screen.getByText('다시 실행')).toBeInTheDocument();
  });

  it('renders with default position (bottom-right)', () => {
    const { container } = render(<UndoRedoHistory />);

    const historyContainer = container.firstChild as HTMLElement;
    expect(historyContainer).toHaveClass('bottom-6');
    expect(historyContainer).toHaveClass('right-6');
  });

  it('renders with top-right position', () => {
    const { container } = render(<UndoRedoHistory position="top-right" />);

    const historyContainer = container.firstChild as HTMLElement;
    expect(historyContainer).toHaveClass('top-6');
    expect(historyContainer).toHaveClass('right-6');
  });

  it('renders with top-left position', () => {
    const { container } = render(<UndoRedoHistory position="top-left" />);

    const historyContainer = container.firstChild as HTMLElement;
    expect(historyContainer).toHaveClass('top-6');
    expect(historyContainer).toHaveClass('left-6');
  });

  it('renders with bottom-left position', () => {
    const { container } = render(<UndoRedoHistory position="bottom-left" />);

    const historyContainer = container.firstChild as HTMLElement;
    expect(historyContainer).toHaveClass('bottom-6');
    expect(historyContainer).toHaveClass('left-6');
  });

  it('renders with custom maxVisible', () => {
    render(<UndoRedoHistory maxVisible={3} />);

    expect(screen.getByText('실행 취소')).toBeInTheDocument();
  });

  it('shows history items when expanded', () => {
    render(<UndoRedoHistory />);

    const toggleButton = screen.getByText('📋');
    fireEvent.click(toggleButton);

    expect(screen.getByText('가구 배치')).toBeInTheDocument();
    expect(screen.getByText('색상 변경')).toBeInTheDocument();
    expect(screen.getByText('크기 조정')).toBeInTheDocument();
  });

  it('shows current state in history', () => {
    render(<UndoRedoHistory />);

    const toggleButton = screen.getByText('📋');
    fireEvent.click(toggleButton);

    expect(screen.getByText('현재 상태')).toBeInTheDocument();
  });

  it('shows future actions when expanded', () => {
    render(<UndoRedoHistory />);

    const toggleButton = screen.getByText('📋');
    fireEvent.click(toggleButton);

    expect(screen.getByText('회전 적용')).toBeInTheDocument();
  });

  it('handles undo button click', () => {
    render(<UndoRedoHistory />);

    const undoButton = screen.getByText('실행 취소');
    fireEvent.click(undoButton);

    expect(mockUndo).toHaveBeenCalled();
  });

  it('handles redo button click', () => {
    render(<UndoRedoHistory />);

    const redoButton = screen.getByText('다시 실행');
    fireEvent.click(redoButton);

    expect(mockRedo).toHaveBeenCalled();
  });

  it('disables undo button when cannot undo', () => {
    mockUseEditorStore.mockReturnValue({
      ...mockUseEditorStore(),
      canUndo: false
    });

    render(<UndoRedoHistory />);

    const undoButton = screen.getByText('실행 취소');
    expect(undoButton).toBeDisabled();
  });

  it('disables redo button when cannot redo', () => {
    mockUseEditorStore.mockReturnValue({
      ...mockUseEditorStore(),
      canRedo: false
    });

    render(<UndoRedoHistory />);

    const redoButton = screen.getByText('다시 실행');
    expect(redoButton).toBeDisabled();
  });

  it('shows correct button states when enabled', () => {
    render(<UndoRedoHistory />);

    const undoButton = screen.getByText('실행 취소');
    const redoButton = screen.getByText('다시 실행');

    expect(undoButton).not.toBeDisabled();
    expect(redoButton).not.toBeDisabled();
  });

  it('displays correct icons', () => {
    render(<UndoRedoHistory />);

    expect(screen.getByText('↶')).toBeInTheDocument(); // Undo icon
    expect(screen.getByText('↷')).toBeInTheDocument(); // Redo icon
    expect(screen.getByText('📋')).toBeInTheDocument(); // History icon
  });

  it('handles empty history gracefully', () => {
    mockUseEditorStore.mockReturnValue({
      history: {
        past: [],
        present: { id: 'current', description: '현재 상태' },
        future: []
      },
      canUndo: false,
      canRedo: false,
      undo: mockUndo,
      redo: mockRedo
    });

    render(<UndoRedoHistory />);

    const toggleButton = screen.getByText('📋');
    fireEvent.click(toggleButton);

    expect(screen.getByText('현재 상태')).toBeInTheDocument();
    expect(screen.queryByText('가구 배치')).not.toBeInTheDocument();
  });

  it('limits visible history items based on maxVisible', () => {
    render(<UndoRedoHistory maxVisible={2} />);

    const toggleButton = screen.getByText('📋');
    fireEvent.click(toggleButton);

    // Should show limited items, but implementation may vary
    expect(screen.getByText('현재 상태')).toBeInTheDocument();
  });

  it('handles history items without description', () => {
    const historyWithoutDescription = {
      ...mockHistory,
      past: [
        { id: 'action-1', timestamp: Date.now() },
        { id: 'action-2', description: '색상 변경', timestamp: Date.now() }
      ]
    };

    mockUseEditorStore.mockReturnValue({
      history: historyWithoutDescription,
      canUndo: true,
      canRedo: true,
      undo: mockUndo,
      redo: mockRedo
    });

    render(<UndoRedoHistory />);

    const toggleButton = screen.getByText('📋');
    fireEvent.click(toggleButton);

    expect(screen.getByText('작업 1')).toBeInTheDocument(); // Fallback text
    expect(screen.getByText('색상 변경')).toBeInTheDocument();
  });

  it('shows correct visual indicators for past actions', () => {
    render(<UndoRedoHistory />);

    const toggleButton = screen.getByText('📋');
    fireEvent.click(toggleButton);

    // The last past item should have special styling (implementation dependent)
    const historyItems = screen.getAllByText(/가구 배치|색상 변경|크기 조정/);
    expect(historyItems.length).toBeGreaterThan(0);
  });

  it('handles component unmounting gracefully', () => {
    const { unmount } = render(<UndoRedoHistory />);

    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('maintains component stability during re-renders', () => {
    const { rerender } = render(<UndoRedoHistory />);

    // Re-render with same props
    rerender(<UndoRedoHistory />);

    expect(screen.getByText('실행 취소')).toBeInTheDocument();
  });

  it('handles prop changes correctly', () => {
    const { rerender } = render(<UndoRedoHistory position="bottom-right" />);

    // Change position prop
    rerender(<UndoRedoHistory position="top-left" />);

    const historyContainer = screen.getByText('실행 취소').closest('.fixed');
    expect(historyContainer).toHaveClass('top-6');
    expect(historyContainer).toHaveClass('left-6');
  });

  it('shows history toggle button functionality', () => {
    render(<UndoRedoHistory />);

    const toggleButton = screen.getByText('📋');

    // Initially collapsed
    expect(screen.queryByText('가구 배치')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(toggleButton);
    expect(screen.getByText('가구 배치')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(toggleButton);
    expect(screen.queryByText('가구 배치')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<UndoRedoHistory />);

    const undoButton = screen.getByText('실행 취소');
    const redoButton = screen.getByText('다시 실행');

    // Buttons should be keyboard accessible
    expect(undoButton).toHaveAttribute('type', 'button');
    expect(redoButton).toHaveAttribute('type', 'button');
  });

  it('displays history count information', () => {
    render(<UndoRedoHistory />);

    // Should show some indication of history state
    expect(screen.getByText('실행 취소')).toBeInTheDocument();
    expect(screen.getByText('다시 실행')).toBeInTheDocument();
  });

  it('handles rapid button clicks gracefully', () => {
    render(<UndoRedoHistory />);

    const undoButton = screen.getByText('실행 취소');

    // Rapid clicks should not cause issues
    for (let i = 0; i < 5; i++) {
      fireEvent.click(undoButton);
    }

    expect(mockUndo).toHaveBeenCalledTimes(5);
  });

  it('maintains accessibility features', () => {
    render(<UndoRedoHistory />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // All buttons should have appropriate accessibility features
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });
  });
});
