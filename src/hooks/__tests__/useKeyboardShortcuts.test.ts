import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockOnSave = jest.fn();
  const mockOnUndo = jest.fn();
  const mockOnRedo = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnEscape = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns keyboard shortcut handlers', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: mockOnSave,
        onUndo: mockOnUndo,
        onRedo: mockOnRedo,
        onDelete: mockOnDelete,
        onEscape: mockOnEscape,
      })
    );

    expect(result.current).toBeDefined();
    expect(typeof result.current.handleKeyDown).toBe('function');
  });

  it('calls onSave when Ctrl+S is pressed', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: mockOnSave,
        onUndo: mockOnUndo,
        onRedo: mockOnRedo,
        onDelete: mockOnDelete,
        onEscape: mockOnEscape,
      })
    );

    const mockEvent = {
      key: 's',
      ctrlKey: true,
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockOnSave).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('calls onUndo when Ctrl+Z is pressed', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: mockOnSave,
        onUndo: mockOnUndo,
        onRedo: mockOnRedo,
        onDelete: mockOnDelete,
        onEscape: mockOnEscape,
      })
    );

    const mockEvent = {
      key: 'z',
      ctrlKey: true,
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockOnUndo).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('calls onRedo when Ctrl+Y is pressed', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: mockOnSave,
        onUndo: mockOnUndo,
        onRedo: mockOnRedo,
        onDelete: mockOnDelete,
        onEscape: mockOnEscape,
      })
    );

    const mockEvent = {
      key: 'y',
      ctrlKey: true,
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockOnRedo).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('calls onDelete when Delete key is pressed', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: mockOnSave,
        onUndo: mockOnUndo,
        onRedo: mockOnRedo,
        onDelete: mockOnDelete,
        onEscape: mockOnEscape,
      })
    );

    const mockEvent = {
      key: 'Delete',
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockOnDelete).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('calls onEscape when Escape key is pressed', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: mockOnSave,
        onUndo: mockOnUndo,
        onRedo: mockOnRedo,
        onDelete: mockOnDelete,
        onEscape: mockOnEscape,
      })
    );

    const mockEvent = {
      key: 'Escape',
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockOnEscape).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('handles Backspace key for delete', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: mockOnSave,
        onUndo: mockOnUndo,
        onRedo: mockOnRedo,
        onDelete: mockOnDelete,
        onEscape: mockOnEscape,
      })
    );

    const mockEvent = {
      key: 'Backspace',
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockOnDelete).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('does not call handlers for non-matching keys', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: mockOnSave,
        onUndo: mockOnUndo,
        onRedo: mockOnRedo,
        onDelete: mockOnDelete,
        onEscape: mockOnEscape,
      })
    );

    const mockEvent = {
      key: 'a',
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnUndo).not.toHaveBeenCalled();
    expect(mockOnRedo).not.toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(mockOnEscape).not.toHaveBeenCalled();
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('handles case-insensitive key matching', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: mockOnSave,
        onUndo: mockOnUndo,
        onRedo: mockOnRedo,
        onDelete: mockOnDelete,
        onEscape: mockOnEscape,
      })
    );

    const mockEvent = {
      key: 'S',
      ctrlKey: true,
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockOnSave).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('handles multiple shortcuts in sequence', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: mockOnSave,
        onUndo: mockOnUndo,
        onRedo: mockOnRedo,
        onDelete: mockOnDelete,
        onEscape: mockOnEscape,
      })
    );

    // Ctrl+S
    const saveEvent = {
      key: 's',
      ctrlKey: true,
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleKeyDown(saveEvent);
    });

    // Ctrl+Z
    const undoEvent = {
      key: 'z',
      ctrlKey: true,
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleKeyDown(undoEvent);
    });

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnUndo).toHaveBeenCalledTimes(1);
  });

  it('prevents default behavior for all shortcuts', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: mockOnSave,
        onUndo: mockOnUndo,
        onRedo: mockOnRedo,
        onDelete: mockOnDelete,
        onEscape: mockOnEscape,
      })
    );

    const shortcuts = [
      { key: 's', ctrlKey: true },
      { key: 'z', ctrlKey: true },
      { key: 'y', ctrlKey: true },
      { key: 'Delete' },
      { key: 'Escape' },
    ];

    shortcuts.forEach(shortcut => {
      const mockEvent = {
        ...shortcut,
        preventDefault: jest.fn(),
      } as any;

      act(() => {
        result.current.handleKeyDown(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  it('handles missing callback functions gracefully', () => {
    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: undefined,
        onUndo: undefined,
        onRedo: undefined,
        onDelete: undefined,
        onEscape: undefined,
      })
    );

    const mockEvent = {
      key: 's',
      ctrlKey: true,
      preventDefault: jest.fn(),
    } as any;

    // 에러가 발생하지 않아야 함
    expect(() => {
      act(() => {
        result.current.handleKeyDown(mockEvent);
      });
    }).not.toThrow();
  });

  it('returns consistent handler reference', () => {
    const { result, rerender } = renderHook(() =>
      useKeyboardShortcuts({
        onSave: mockOnSave,
        onUndo: mockOnUndo,
        onRedo: mockOnRedo,
        onDelete: mockOnDelete,
        onEscape: mockOnEscape,
      })
    );

    const firstHandler = result.current.handleKeyDown;

    rerender();

    expect(result.current.handleKeyDown).toBe(firstHandler);
  });
});
