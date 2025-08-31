import React, { useState, useRef } from 'react';
import { IoChevronUp, IoChevronDown } from 'react-icons/io5';

interface NavLink {
  label: string;
  ariaLabel?: string;
  href?: string;
}

interface NavItem {
  label: string;
  links?: NavLink[];
}

interface CardNavProps {
  logo: string;
  logoAlt?: string;
  items?: NavItem[];
  className?: string;
  defaultExpanded?: boolean;
}

const CardNav: React.FC<CardNavProps> = ({
  items = [],
  className = '',
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // 기본 네비게이션 아이템
  const defaultItems: NavItem[] = [
    {
      label: 'About',
      links: [
        { label: 'Company', ariaLabel: 'About Company' },
        { label: 'Careers', ariaLabel: 'About Careers' }
      ]
    },
    {
      label: 'Projects',
      links: [
        { label: 'Featured', ariaLabel: 'Featured Projects' },
        { label: 'Case Studies', ariaLabel: 'Project Case Studies' }
      ]
    },
    {
      label: 'Contact',
      links: [
        { label: 'Email', ariaLabel: 'Email us' },
        { label: 'Twitter', ariaLabel: 'Twitter' },
        { label: 'LinkedIn', ariaLabel: 'LinkedIn' }
      ]
    }
  ];

  const navItems = items.length > 0 ? items : defaultItems;

  const toggleExpanded = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setIsExpanded(!isExpanded);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpanded();
    }
  };

  return (
    <div className={`fixed left-1/2 -translate-x-1/2 w-[90%] max-w-[900px] top-6 z-50 ${className}`}>
      <nav className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* 상단 네비게이션 바 - React Bits와 정확히 동일한 크기와 간격 */}
        <div className="flex items-center justify-between h-20 px-8">
          {/* 로고와 제목 */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-black rounded-2xl flex items-center justify-center relative">
              <div className="w-3 h-3 bg-white rounded-lg absolute top-1 left-1" />
              <div className="w-2 h-2 bg-white rounded-lg absolute bottom-1 right-1" />
              <div className="w-1 h-1 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="text-xl font-semibold text-black font-sans">
              React Bits
            </span>
          </div>

          {/* 우측 버튼들 */}
          <div className="flex items-center gap-3">
            {/* 접기/펴기 버튼 */}
            <button
              type="button"
              className="w-10 h-10 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
              onClick={toggleExpanded}
              onKeyDown={handleKeyDown}
              aria-label={isExpanded ? '네비게이션 접기' : '네비게이션 펴기'}
              aria-expanded={isExpanded}
              disabled={isAnimating}
            >
              {isExpanded ? (
                <IoChevronUp className="w-5 h-5" />
              ) : (
                <IoChevronDown className="w-5 h-5" />
              )}
            </button>

            {/* Get Started 버튼 */}
            <button
              type="button"
              className="px-6 py-2 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 transition-colors duration-200 font-sans"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* 네비게이션 카드들 - React Bits와 정확히 동일한 크기와 색상 */}
        <div
          ref={cardsContainerRef}
          className={`px-8 pb-8 overflow-hidden transition-all duration-300 ease-out ${
            isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-row items-center justify-center gap-6">
            {navItems.slice(0, 3).map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="bg-gray-900 text-white rounded-3xl p-6 w-40 h-40 flex flex-col cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg"
              >
                {/* 카드 제목 */}
                <div className="text-lg font-semibold mb-4 font-sans">
                  {item.label}
                </div>

                {/* 카드 링크들 */}
                <div className="mt-auto flex flex-col gap-3">
                  {item.links?.map((link, i) => (
                    <button
                      key={`${link.label}-${i}`}
                      className="text-left text-sm font-medium hover:bg-white/10 rounded-xl px-3 py-2 transition-colors duration-200 font-sans"
                      aria-label={link.ariaLabel || link.label}
                      onClick={() => console.log(`클릭됨: ${link.label}`)}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
