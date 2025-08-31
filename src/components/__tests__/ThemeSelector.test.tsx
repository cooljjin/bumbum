import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeSelector from '../ThemeSelector';
import { themes } from '../../constants/themes';

describe('ThemeSelector', () => {
  const mockOnThemeChange = jest.fn();
  const calmTheme = themes.calm;
  const cozyTheme = themes.cozy;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders theme selector with current theme', () => {
    render(<ThemeSelector currentTheme={calmTheme} onThemeChange={mockOnThemeChange} />);
    
    expect(screen.getByText('테마 선택')).toBeInTheDocument();
    expect(screen.getByText('Calm')).toBeInTheDocument();
  });

  it('displays all available theme options', () => {
    render(<ThemeSelector currentTheme={cozyTheme} onThemeChange={mockOnThemeChange} />);
    
    const themeButtons = screen.getAllByRole('button');
    expect(themeButtons.length).toBeGreaterThan(1);
    
    // 모든 테마가 표시되는지 확인
    Object.values(themes).forEach(theme => {
      expect(screen.getByText(theme.name)).toBeInTheDocument();
    });
  });

  it('calls onThemeChange when theme is selected', () => {
    render(<ThemeSelector currentTheme={calmTheme} onThemeChange={mockOnThemeChange} />);
    
    const cozyButton = screen.getByText('Cozy');
    fireEvent.click(cozyButton);
    
    expect(mockOnThemeChange).toHaveBeenCalledWith(cozyTheme);
  });

  it('highlights current theme correctly', () => {
    render(<ThemeSelector currentTheme={calmTheme} onThemeChange={mockOnThemeChange} />);
    
    const calmButton = screen.getByText('Calm');
    expect(calmButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('displays current theme description', () => {
    render(<ThemeSelector currentTheme={calmTheme} onThemeChange={mockOnThemeChange} />);
    
    expect(screen.getByText('Calm 테마')).toBeInTheDocument();
    expect(screen.getByText('차분하고 평화로운 분위기')).toBeInTheDocument();
  });

  it('handles theme change correctly', () => {
    const { rerender } = render(
      <ThemeSelector currentTheme={calmTheme} onThemeChange={mockOnThemeChange} />
    );
    
    expect(screen.getByText('Calm 테마')).toBeInTheDocument();
    
    rerender(<ThemeSelector currentTheme={cozyTheme} onThemeChange={mockOnThemeChange} />);
    
    expect(screen.getByText('Cozy 테마')).toBeInTheDocument();
  });

  it('applies correct styling to theme buttons', () => {
    render(<ThemeSelector currentTheme={calmTheme} onThemeChange={mockOnThemeChange} />);
    
    const themeButtons = screen.getAllByRole('button');
    themeButtons.forEach(button => {
      expect(button).toHaveClass('px-4', 'py-2', 'rounded-full', 'font-medium');
    });
  });

  it('maintains accessibility for theme buttons', () => {
    render(<ThemeSelector currentTheme={calmTheme} onThemeChange={mockOnThemeChange} />);
    
    const themeButtons = screen.getAllByRole('button');
    themeButtons.forEach(button => {
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('role', 'button');
    });
  });
});
