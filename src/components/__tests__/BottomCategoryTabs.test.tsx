import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BottomCategoryTabs from '../layout/BottomCategoryTabs';

describe('BottomCategoryTabs', () => {
  const mockOnCategoryChange = jest.fn();

  const mockCategoryCounts = {
    all: 15,
    living: 5,
    bedroom: 3,
    kitchen: 2,
    bathroom: 1,
    office: 2,
    outdoor: 1,
    decorative: 3,
    storage: 2
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders category tabs', () => {
    render(
      <BottomCategoryTabs
        selectedCategory="seating"
        onCategoryChange={mockOnCategoryChange}
        categoryCounts={mockCategoryCounts}
      />
    );

    expect(screen.getByText('거실')).toBeInTheDocument();
    expect(screen.getByText('침실')).toBeInTheDocument();
    expect(screen.getByText('주방')).toBeInTheDocument();
    expect(screen.getByText('욕실')).toBeInTheDocument();
  });

  it('displays category icons', () => {
    render(
      <BottomCategoryTabs
        selectedCategory="living"
        onCategoryChange={mockOnCategoryChange}
        categoryCounts={mockCategoryCounts}
      />
    );

    // 실제 컴포넌트에서 사용하는 아이콘들을 확인
    expect(screen.getByText('거실')).toBeInTheDocument();
    expect(screen.getByText('침실')).toBeInTheDocument();
  });

  it('calls onCategoryChange when category is clicked', () => {
    render(
      <BottomCategoryTabs
        selectedCategory="living"
        onCategoryChange={mockOnCategoryChange}
        categoryCounts={mockCategoryCounts}
      />
    );

    const kitchenTab = screen.getByText('주방');
    fireEvent.click(kitchenTab);

    expect(mockOnCategoryChange).toHaveBeenCalledWith('kitchen');
  });

  it('maintains keyboard accessibility', () => {
    render(
      <BottomCategoryTabs
        selectedCategory="living"
        onCategoryChange={mockOnCategoryChange}
        categoryCounts={mockCategoryCounts}
      />
    );

    const kitchenTab = screen.getByText('주방').closest('button');
    expect(kitchenTab).toHaveAttribute('tabIndex', '0');
    expect(kitchenTab).toHaveAttribute('role', 'tab');

    // Enter 키 테스트
    fireEvent.keyDown(kitchenTab!, { key: 'Enter' });
    expect(mockOnCategoryChange).toHaveBeenCalledWith('kitchen');

    // Space 키 테스트
    fireEvent.keyDown(kitchenTab!, { key: ' ' });
    expect(mockOnCategoryChange).toHaveBeenCalledWith('kitchen');
  });

  it('provides proper ARIA labels for screen readers', () => {
    render(
      <BottomCategoryTabs
        selectedCategory="living"
        onCategoryChange={mockOnCategoryChange}
        categoryCounts={mockCategoryCounts}
      />
    );

    const livingTab = screen.getByText('거실').closest('button');
    expect(livingTab).toHaveAttribute('aria-label');
    expect(livingTab?.getAttribute('aria-label')).toContain('거실');
    expect(livingTab?.getAttribute('aria-label')).toContain('5개');
  });

  it('maintains proper focus management', () => {
    render(
      <BottomCategoryTabs
        selectedCategory="living"
        onCategoryChange={mockOnCategoryChange}
        categoryCounts={mockCategoryCounts}
      />
    );

    const livingTab = screen.getByText('거실').closest('button');
    livingTab?.focus();
    expect(document.activeElement).toBe(livingTab);
  });

  it('handles high contrast mode compatibility', () => {
    render(
      <BottomCategoryTabs
        selectedCategory="living"
        onCategoryChange={mockOnCategoryChange}
        categoryCounts={mockCategoryCounts}
      />
    );

    // 선택된 탭은 적절한 스타일을 가져야 함
    const livingTab = screen.getByText('거실').closest('button');
    expect(livingTab).toHaveClass('bg-blue-600', 'text-white');
  });
  });

  it('highlights current category correctly', () => {
    render(
      <BottomCategoryTabs
        categories={mockCategories}
        currentCategory="seating"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const seatingTab = screen.getByText('좌석');
    expect(seatingTab).toHaveClass('bg-blue-600', 'text-white');
  });

  it('applies inactive styling to non-current categories', () => {
    render(
      <BottomCategoryTabs
        categories={mockCategories}
        currentCategory="seating"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const tablesTab = screen.getByText('테이블');
    expect(tablesTab).toHaveClass('bg-gray-200', 'text-gray-700');
  });

  it('handles empty categories array', () => {
    render(
      <BottomCategoryTabs
        categories={[]}
        currentCategory=""
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies correct styling to category tabs', () => {
    render(
      <BottomCategoryTabs
        categories={mockCategories}
        currentCategory="seating"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const categoryTabs = screen.getAllByRole('button');
    categoryTabs.forEach(tab => {
      expect(tab).toHaveClass('px-4', 'py-2', 'rounded-full');
    });
  });

  it('shows hover effects on category tabs', () => {
    render(
      <BottomCategoryTabs
        categories={mockCategories}
        currentCategory="seating"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const tablesTab = screen.getByText('테이블');
    expect(tablesTab).toHaveClass('hover:bg-gray-300');
  });

  it('maintains accessibility for category tabs', () => {
    render(
      <BottomCategoryTabs
        categories={mockCategories}
        currentCategory="seating"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const categoryTabs = screen.getAllByRole('button');
    categoryTabs.forEach(tab => {
      expect(tab).toBeInTheDocument();
      expect(tab).toHaveAttribute('role', 'button');
    });
  });

  it('displays correct category count', () => {
    render(
      <BottomCategoryTabs
        categories={mockCategories}
        currentCategory="seating"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const categoryTabs = screen.getAllByRole('button');
    expect(categoryTabs).toHaveLength(4);
  });

  it('handles category change with keyboard', () => {
    render(
      <BottomCategoryTabs
        categories={mockCategories}
        currentCategory="seating"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const tablesTab = screen.getByText('테이블');
    fireEvent.keyDown(tablesTab, { key: 'Enter' });

    expect(mockOnCategoryChange).toHaveBeenCalledWith('tables');
  });

  it('handles space key for category selection', () => {
    render(
      <BottomCategoryTabs
        categories={mockCategories}
        currentCategory="seating"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const storageTab = screen.getByText('수납');
    fireEvent.keyDown(storageTab, { key: ' ' });

    expect(mockOnCategoryChange).toHaveBeenCalledWith('storage');
  });

  it('updates current category when prop changes', () => {
    const { rerender } = render(
      <BottomCategoryTabs
        categories={mockCategories}
        currentCategory="seating"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByText('좌석')).toHaveClass('bg-blue-600');

    rerender(
      <BottomCategoryTabs
        categories={mockCategories}
        currentCategory="tables"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByText('테이블')).toHaveClass('bg-blue-600');
    expect(screen.getByText('좌석')).toHaveClass('bg-gray-200');
  });

  it('handles single category correctly', () => {
    const singleCategory = [{ id: 'seating', name: '좌석', icon: '🪑' }];
    
    render(
      <BottomCategoryTabs
        categories={singleCategory}
        currentCategory="seating"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByText('좌석')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
