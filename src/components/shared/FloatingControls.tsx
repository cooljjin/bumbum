import React from 'react';
import { Html } from '@react-three/drei';
import { Vector3 } from 'three';
import {
  getMobileHtmlStyle,
  getMobileDistanceFactor,
  getMobileZIndexRange,
  constrainHtmlPosition,
  getOptimalFloatingSize,
  isMobile
} from '../../utils/mobileHtmlConstraints';

interface FloatingControlsProps {
  position: Vector3;
  isVisible: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onClose: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  position,
  isVisible,
  onUndo,
  onRedo,
  onRotateLeft,
  onRotateRight,
  onDelete,
  onDuplicate,
  onClose
}) => {
  if (!isVisible) return null;

  // 모바일에서 최적화된 크기 계산
  const optimalSize = getOptimalFloatingSize(400, 60);
  const elementWidth = optimalSize.width;
  const elementHeight = optimalSize.height;

  // 모바일에서 위치 제약 적용
  const basePosition: [number, number, number] = [position.x, position.y + 1.5, position.z];
  const constrainedPosition = constrainHtmlPosition(basePosition, elementWidth, elementHeight);

  return (
    <Html
      position={constrainedPosition}
      center
      distanceFactor={getMobileDistanceFactor(8)}
      zIndexRange={getMobileZIndexRange([200, 0])}
      style={getMobileHtmlStyle(elementWidth)}
    >
      <div
        className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 p-3 flex items-center gap-2 flex-wrap mobile-floating-ui ${
          isMobile() ? 'max-w-full overflow-x-auto' : ''
        }`}
        style={getMobileHtmlStyle(elementWidth)}
      >
        {/* 실행 취소 */}
        <button
          onClick={onUndo}
          className={`${isMobile() ? 'w-12 h-12' : 'w-10 h-10'} bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 border border-gray-300`}
          title="실행 취소"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7v6h6" />
            <path d="M3 13a9 9 0 1 0 3-6.7" />
          </svg>
        </button>

        {/* 다시 실행 */}
        <button
          onClick={onRedo}
          className={`${isMobile() ? 'w-12 h-12' : 'w-10 h-10'} bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 border border-gray-300`}
          title="다시 실행"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 7v6h-6" />
            <path d="M21 13a9 9 0 1 1-3-6.7" />
          </svg>
        </button>

        {/* 구분선 */}
        <div className="w-px h-8 bg-gray-300" />
        {/* 좌회전 버튼 */}
        <button
          onClick={onRotateLeft}
          className={`${isMobile() ? 'w-12 h-12' : 'w-10 h-10'} bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105`}
          title="좌회전 (90°)"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        {/* 우회전 버튼 */}
        <button
          onClick={onRotateRight}
          className={`${isMobile() ? 'w-12 h-12' : 'w-10 h-10'} bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105`}
          title="우회전 (90°)"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>

        {/* 구분선 */}
        <div className="w-px h-8 bg-gray-300" />

        {/* 복제 버튼 */}
        <button
          onClick={onDuplicate}
          className={`${isMobile() ? 'w-12 h-12' : 'w-10 h-10'} bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105`}
          title="복제"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>

        {/* 삭제 버튼 */}
        <button
          onClick={onDelete}
          className={`${isMobile() ? 'w-12 h-12' : 'w-10 h-10'} bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105`}
          title="삭제"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3,6 5,6 21,6" />
            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>

        {/* 구분선 */}
        <div className="w-px h-8 bg-gray-300" />

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className={`${isMobile() ? 'w-12 h-12' : 'w-10 h-10'} bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105`}
          title="닫기"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </Html>
  );
};

export default FloatingControls;
