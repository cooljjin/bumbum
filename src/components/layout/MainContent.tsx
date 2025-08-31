'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Real3DRoom 컴포넌트를 동적으로 로드
const Real3DRoom = dynamic(() => import('../Real3DRoom'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3" />
        <p className="text-gray-600">3D 룸을 로딩 중입니다...</p>
      </div>
    </div>
  )
});

interface MainContentProps {
  isViewLocked: boolean;
  isEditMode: boolean;
  onEditModeChange: (editMode: boolean) => void;
}

export function MainContent({
  isViewLocked,
  isEditMode,
  onEditModeChange
}: MainContentProps) {
  return (
    <div className="h-[calc(100vh-4rem)] relative">
      <Real3DRoom
        isViewLocked={isViewLocked}
        isEditMode={isEditMode}
        onEditModeChange={onEditModeChange}
      />


    </div>
  );
}
