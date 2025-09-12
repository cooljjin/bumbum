'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
  active?: 'uploader' | 'library';
  className?: string;
};

export default function DevNavbar({ active, className = '' }: Props) {
  const itemClass = (isActive: boolean) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <nav
      className={`sticky top-0 z-50 w-full bg-white/90 backdrop-blur border-b border-gray-200 ${className}`}
      aria-label="Dev navigation"
    >
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2">
        <div className="text-sm font-semibold text-gray-800 mr-4">Dev Tools</div>
        <Link href="/dev/asset-uploader" className={itemClass(active === 'uploader')}>
          가구 에셋 추가
        </Link>
        <Link href="/dev/library" className={itemClass(active === 'library')}>
          가구 라이브러리 관리
        </Link>
      </div>
    </nav>
  );
}

