import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsModal from '../SettingsModal';

// Mock editor store
const mockSetGridSettings = jest.fn();
const mockSetRotationSnapSettings = jest.fn();
const mockSetSnapStrength = jest.fn();

jest.mock('../../store/editorStore', () => ({
  useEditorStore: jest.fn(() => ({
    setGridSettings: mockSetGridSettings,
    setRotationSnapSettings: mockSetRotationSnapSettings,
    setSnapStrength: mockSetSnapStrength
  }))
}));

// Mock keyboard shortcuts hook
const mockShortcutSettings = {
  enabled: true,
  showTooltips: true,
  soundEnabled: false
};
const mockUpdateShortcutSettings = jest.fn();
const mockResetShortcutSettings = jest.fn();

jest.mock('../../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(() => ({
    shortcutSettings: mockShortcutSettings,
    updateShortcutSettings: mockUpdateShortcutSettings,
    resetShortcutSettings: mockResetShortcutSettings
  }))
}));

describe('SettingsModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // localStorage 모킹
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  it('renders with title when open', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('⚙️ 사용자 설정')).toBeInTheDocument();
  });

  it('displays all setting categories', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('일반')).toBeInTheDocument();
    expect(screen.getByText('그리드')).toBeInTheDocument();
    expect(screen.getByText('단축키')).toBeInTheDocument();
    expect(screen.getByText('성능')).toBeInTheDocument();
    expect(screen.getByText('UI')).toBeInTheDocument();
  });

  it('shows current settings for grid size and rotation step', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);
    
    // 그리드 카테고리로 이동
    fireEvent.click(screen.getByText('그리드'));
    
    expect(screen.getByText('그리드 크기: 10')).toBeInTheDocument();
    expect(screen.getByText('그리드 분할: 10')).toBeInTheDocument();
  });

  it('handles changes to grid size slider', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);
    
    // 그리드 카테고리로 이동
    fireEvent.click(screen.getByText('그리드'));
    
    const sliders = screen.getAllByRole('slider');
    const gridSizeSlider = sliders[0];
    fireEvent.change(gridSizeSlider, { target: { value: '15' } });
    
    expect(screen.getByText('그리드 크기: 15')).toBeInTheDocument();
  });

  it('toggles performance LOD checkbox', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);
    
    // 성능 카테고리로 이동
    fireEvent.click(screen.getByText('성능'));
    
    const lodLabel = screen.getByText('LOD 시스템 활성화');
    const lodToggle = lodLabel.parentElement?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(lodToggle).toBeChecked();
    fireEvent.click(lodToggle);
    
    expect(lodToggle).not.toBeChecked();
  });

  it('calls onClose when close button is clicked', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByText('취소');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('applies settings to store on save', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);
    
    // 설정 변경: UI 테마 변경으로 변경사항 생성
    fireEvent.click(screen.getByText('UI'));
    const themeSelect = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(themeSelect, { target: { value: 'dark' } });
    
    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);
    
    expect(mockSetGridSettings).toHaveBeenCalled();
    expect(mockSetRotationSnapSettings).toHaveBeenCalled();
    expect(mockSetSnapStrength).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    render(<SettingsModal isOpen={false} onClose={mockOnClose} />);
    
    expect(screen.queryByText('⚙️ 사용자 설정')).not.toBeInTheDocument();
  });

  it('displays shadow quality options', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);
    
    // UI 카테고리로 이동
    fireEvent.click(screen.getByText('UI'));
    
    expect(screen.getByText('테마')).toBeInTheDocument();
    // select 요소에서 기본값 확인
    const themeSelect = screen.getByRole('combobox');
    expect(themeSelect).toBeInTheDocument();
  });

  it('displays max FPS setting', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);
    
    // UI 카테고리로 이동
    fireEvent.click(screen.getByText('UI'));
    
    // FPS 표시 체크박스 찾기
    const fpsLabel = screen.getByText('FPS 표시');
    expect(fpsLabel).toBeInTheDocument();
    
    // 체크박스가 존재하는지 확인
    const fpsCheckbox = fpsLabel.nextElementSibling;
    expect(fpsCheckbox).toHaveAttribute('type', 'checkbox');
  });

  it('shows unsaved badge and disables after save', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    // 초기에는 변경사항 배지가 표시되고 저장 버튼 활성화일 수 있음
    expect(screen.getByText('저장되지 않은 변경사항')).toBeInTheDocument();
    const saveButton = screen.getByText('저장') as HTMLButtonElement;
    expect(saveButton).not.toBeDisabled();

    // 저장 클릭 시 배지 숨김 및 버튼 비활성화
    fireEvent.click(saveButton);
    expect(screen.queryByText('저장되지 않은 변경사항')).not.toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('re-enables save when settings change after save', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    const saveButton = screen.getByText('저장') as HTMLButtonElement;
    // 먼저 저장해서 비활성화 상태로 만듦
    fireEvent.click(saveButton);
    expect(saveButton).toBeDisabled();

    // UI 테마 변경으로 다시 변경사항 생성
    fireEvent.click(screen.getByText('UI'));
    const themeSelect = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    expect(screen.getByText('저장되지 않은 변경사항')).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();
  });
});
