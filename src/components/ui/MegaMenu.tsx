import React, { useState } from 'react';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  subItems: Array<{
    id: string;
    name: string;
    path: string;
  }>;
}

interface MegaMenuProps {
  items: MenuItem[];
  isOpen: boolean;
  onNavigate: (path: string) => void;
  onClose: () => void;
}

export default function MegaMenu({ items, isOpen, onNavigate, onClose }: MegaMenuProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSubItemClick = (path: string) => {
    onNavigate(path);
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">카테고리 선택</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="메뉴 닫기"
          >
            ✕
          </button>
        </div>

        {/* 메뉴 콘텐츠 */}
        <div className="overflow-y-auto max-h-[60vh] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                {/* 카테고리 헤더 */}
                <button
                  onClick={() => toggleCategory(item.id)}
                  onKeyDown={(e) => handleKeyDown(e, () => toggleCategory(item.id))}
                  className="w-full text-left mb-3 flex items-center gap-3 hover:bg-gray-100 p-2 rounded transition-colors"
                  aria-expanded={expandedCategories.has(item.id)}
                  aria-controls={`submenu-${item.id}`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <span className="ml-auto text-gray-400">
                    {expandedCategories.has(item.id) ? '▼' : '▶'}
                  </span>
                </button>

                {/* 서브 아이템들 */}
                {expandedCategories.has(item.id) && (
                  <div id={`submenu-${item.id}`} className="space-y-2 ml-8">
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleSubItemClick(subItem.path)}
                        onKeyDown={(e) => handleKeyDown(e, () => handleSubItemClick(subItem.path))}
                        className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900"
                      >
                        {subItem.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
