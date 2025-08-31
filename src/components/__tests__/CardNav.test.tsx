import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardNav from '../ui/CardNav';

describe('CardNav', () => {
  const mockOnNavigate = jest.fn();
  const mockOnClose = jest.fn();

  const mockItems = [
    { id: '1', title: '홈', icon: '🏠', path: '/' },
    { id: '2', title: '방 편집', icon: '✏️', path: '/edit' },
    { id: '3', title: '설정', icon: '⚙️', path: '/settings' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation items', () => {
    render(
      <CardNav
        items={mockItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('방 편집')).toBeInTheDocument();
    expect(screen.getByText('설정')).toBeInTheDocument();
  });

  it('displays navigation icons', () => {
    render(
      <CardNav
        items={mockItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('✏️')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('calls onNavigate when item is clicked', () => {
    render(
      <CardNav
        items={mockItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const homeButton = screen.getByText('홈');
    fireEvent.click(homeButton);

    expect(mockOnNavigate).toHaveBeenCalledWith('/');
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <CardNav
        items={mockItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /닫기/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('applies correct styling to navigation items', () => {
    render(
      <CardNav
        items={mockItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const navItems = screen.getAllByRole('button');
    navItems.forEach(item => {
      expect(item).toHaveClass('flex', 'items-center', 'gap-3');
    });
  });

  it('handles empty items array', () => {
    render(
      <CardNav
        items={[]}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies hover effects to navigation items', () => {
    render(
      <CardNav
        items={mockItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const homeButton = screen.getByText('홈');
    expect(homeButton).toHaveClass('hover:bg-gray-100');
  });

  it('maintains accessibility for navigation items', () => {
    render(
      <CardNav
        items={mockItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const navItems = screen.getAllByRole('button');
    navItems.forEach(item => {
      expect(item).toBeInTheDocument();
      expect(item).toHaveAttribute('role', 'button');
    });
  });

  it('displays correct item count', () => {
    render(
      <CardNav
        items={mockItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const navItems = screen.getAllByRole('button');
    expect(navItems).toHaveLength(3);
  });

  it('handles navigation with different paths', () => {
    render(
      <CardNav
        items={mockItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const editButton = screen.getByText('방 편집');
    fireEvent.click(editButton);

    expect(mockOnNavigate).toHaveBeenCalledWith('/edit');
  });
});
