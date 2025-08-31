import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MegaMenu from '../ui/MegaMenu';

describe('MegaMenu', () => {
  const mockOnNavigate = jest.fn();
  const mockOnClose = jest.fn();

  const mockMenuItems = [
    {
      id: 'furniture',
      title: '가구',
      icon: '🪑',
      description: '다양한 가구를 선택하세요',
      subItems: [
        { id: 'chairs', name: '의자', path: '/furniture/chairs' },
        { id: 'tables', name: '테이블', path: '/furniture/tables' },
        { id: 'storage', name: '수납장', path: '/furniture/storage' }
      ]
    },
    {
      id: 'rooms',
      title: '방',
      icon: '🏠',
      description: '방 템플릿을 선택하세요',
      subItems: [
        { id: 'living', name: '거실', path: '/rooms/living' },
        { id: 'bedroom', name: '침실', path: '/rooms/bedroom' },
        { id: 'kitchen', name: '부엌', path: '/rooms/kitchen' }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mega menu with main categories', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('가구')).toBeInTheDocument();
    expect(screen.getByText('방')).toBeInTheDocument();
  });

  it('displays category icons', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('🪑')).toBeInTheDocument();
    expect(screen.getByText('🏠')).toBeInTheDocument();
  });

  it('shows category descriptions', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnNavigate}
      />
    );

    expect(screen.getByText('다양한 가구를 선택하세요')).toBeInTheDocument();
    expect(screen.getByText('방 템플릿을 선택하세요')).toBeInTheDocument();
  });

  it('displays sub-items when category is expanded', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const furnitureCategory = screen.getByText('가구');
    fireEvent.click(furnitureCategory);

    expect(screen.getByText('의자')).toBeInTheDocument();
    expect(screen.getByText('테이블')).toBeInTheDocument();
    expect(screen.getByText('수납장')).toBeInTheDocument();
  });

  it('calls onNavigate when sub-item is clicked', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const furnitureCategory = screen.getByText('가구');
    fireEvent.click(furnitureCategory);

    const chairItem = screen.getByText('의자');
    fireEvent.click(chairItem);

    expect(mockOnNavigate).toHaveBeenCalledWith('/furniture/chairs');
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /닫기/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('toggles category expansion state', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const furnitureCategory = screen.getByText('가구');
    
    // 처음에는 접혀있음
    expect(screen.queryByText('의자')).not.toBeInTheDocument();
    
    // 클릭하면 펼쳐짐
    fireEvent.click(furnitureCategory);
    expect(screen.getByText('의자')).toBeInTheDocument();
    
    // 다시 클릭하면 접힘
    fireEvent.click(furnitureCategory);
    expect(screen.queryByText('의자')).not.toBeInTheDocument();
  });

  it('handles multiple category expansions', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const furnitureCategory = screen.getByText('가구');
    const roomsCategory = screen.getByText('방');

    // 가구 카테고리 펼치기
    fireEvent.click(furnitureCategory);
    expect(screen.getByText('의자')).toBeInTheDocument();
    
    // 방 카테고리 펼치기
    fireEvent.click(roomsCategory);
    expect(screen.getByText('거실')).toBeInTheDocument();
    
    // 두 카테고리 모두 펼쳐져 있어야 함
    expect(screen.getByText('의자')).toBeInTheDocument();
    expect(screen.getByText('거실')).toBeInTheDocument();
  });

  it('applies correct styling to category headers', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const categoryHeaders = screen.getAllByRole('button');
    categoryHeaders.forEach(header => {
      expect(header).toHaveClass('text-lg', 'font-semibold');
    });
  });

  it('shows hover effects on sub-items', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const furnitureCategory = screen.getByText('가구');
    fireEvent.click(furnitureCategory);

    const chairItem = screen.getByText('의자');
    expect(chairItem).toHaveClass('hover:bg-gray-100');
  });

  it('handles empty items array', () => {
    render(
      <MegaMenu
        items={[]}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('maintains accessibility for all interactive elements', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    // 닫기 버튼은 role="button"을 가짐
    const closeButton = screen.getByLabelText('메뉴 닫기');
    expect(closeButton).toHaveAttribute('aria-label', '메뉴 닫기');

    // 카테고리 버튼들은 aria-expanded 속성을 가짐
    const categoryButtons = screen.getAllByRole('button').filter(button =>
      button !== closeButton
    );
    categoryButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-expanded');
      expect(button).toHaveAttribute('aria-controls');
    });
  });

  it('displays correct item counts', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const categoryHeaders = screen.getAllByRole('button');
    expect(categoryHeaders).toHaveLength(2);
  });

  it('handles keyboard navigation for categories', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const furnitureCategory = screen.getByText('가구');
    fireEvent.keyDown(furnitureCategory, { key: 'Enter' });

    expect(screen.getByText('의자')).toBeInTheDocument();
  });

  it('handles keyboard navigation for sub-items', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    const furnitureCategory = screen.getByText('가구');
    fireEvent.click(furnitureCategory);

    const chairItem = screen.getByText('의자');
    fireEvent.keyDown(chairItem, { key: 'Enter' });

    expect(mockOnNavigate).toHaveBeenCalledWith('/furniture/chairs');
  });

  it('closes menu when clicking outside', () => {
    render(
      <MegaMenu
        items={mockMenuItems}
        isOpen={true}
        onNavigate={mockOnNavigate}
        onClose={mockOnClose}
      />
    );

    // 외부 클릭 시뮬레이션
    fireEvent.click(document.body);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
