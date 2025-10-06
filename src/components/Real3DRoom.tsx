'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import LoadingSpinner from './ui/LoadingSpinner';

// Room3DContainer를 동적으로 임포트
const Room3DContainer = dynamic(() => import('./3D/Room3DContainer'), {
  ssr: false,
  loading: () => <LoadingSpinner message="3D 룸 로딩 중..." />
});

// 타입 임포트
import { PerformanceOptions, RoomBounds } from '../types/editor';

// Props 인터페이스
interface Real3DRoomProps {
  shadowMode?: 'baked' | 'realtime';
  isViewLocked: boolean;
  isEditMode?: boolean;
  /** 성능 옵션 설정 */
  performanceOptions?: Partial<PerformanceOptions>;
  /** 룸 경계 정보 콜백 */
  onRoomBoundsChange?: (bounds: RoomBounds) => void;
}

const Real3DRoomComponent = React.memo(({
  shadowMode,
  isViewLocked,
  isEditMode,
  performanceOptions,
  onRoomBoundsChange
}: Real3DRoomProps) => {
  return (
    <Room3DContainer
      shadowMode={shadowMode ?? undefined}
      isViewLocked={isViewLocked}
      isEditMode={isEditMode ?? undefined}
      performanceOptions={performanceOptions ?? undefined}
      onRoomBoundsChange={onRoomBoundsChange ?? undefined}
    />
  );
});

Real3DRoomComponent.displayName = 'Real3DRoomComponent';

// Next.js 15 호환성을 위한 export
export default Real3DRoomComponent;