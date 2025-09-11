import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiRotateCcw,
  FiRotateCw,
  FiCopy,
  FiTrash2,
  FiX
} from 'react-icons/fi';
import { getOptimalFloatingSize, getSafeTouchArea, getUIOcclusionInsets, isMobile } from '../../../utils/mobileHtmlConstraints';

interface FurnitureFloatingControlsProps {
  isVisible: boolean;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  position?: { x: number; y: number };
}

export const FurnitureFloatingControls: React.FC<FurnitureFloatingControlsProps> = ({
  isVisible,
  onRotateLeft,
  onRotateRight,
  onDuplicate,
  onDelete,
  position = { x: 0, y: 0 }
}) => {
  // console.log('🎯 FurnitureFloatingControls 렌더링:', {
  //   isVisible,
  //   position,
  //   positionValid: position && typeof position.x === 'number' && typeof position.y === 'number'
  // });

  if (!isVisible) return null;

  // 실제 렌더 크기 측정을 위한 ref/상태
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelSize, setPanelSize] = useState<{ width: number; height: number }>(() => getOptimalFloatingSize(320, 80));

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      // 가끔 0이 나오는 초기 렌더를 보완하기 위해 최소값 적용
      setPanelSize({ width: Math.max( rect.width, 240), height: Math.max(rect.height, 60) });
    };
    measure();
    // 리사이즈/폰트 로딩 등 레이아웃 변화에 대응
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  // 화면 경계를 체크하여 위치 조정 + 스마트 배치(위/아래/좌/우 자동 선택)
  const getConstrainedPosition = () => {
    // 측정된 실제 크기(초기엔 추정값 사용)
    const panelWidth = panelSize.width;
    const panelHeight = panelSize.height;

    // 모바일 안전 영역 + 다른 고정 UI 차단 영역 고려
    const safeArea = getSafeTouchArea();
    const occlude = getUIOcclusionInsets();

    // 모바일에서는 더 큰 여백 사용
    const margin = isMobile() ? Math.max(safeArea.left, safeArea.right, 20) : 16;
    const offsetY = isMobile() ? 30 : 20; // 세로 간격
    const offsetX = isMobile() ? 12 : 10; // 가로 간격

    let x = position.x;

    // 경계 및 가용공간
    const leftBound = margin + occlude.left;
    const rightBound = window.innerWidth - margin - occlude.right;
    const topBound = safeArea.top + occlude.top + margin;
    const bottomBound = window.innerHeight - safeArea.bottom - occlude.bottom - margin;
    const availableWidth = Math.max(0, rightBound - leftBound);
    const availableHeight = Math.max(0, bottomBound - topBound);
    const effectivePanelWidth = Math.min(panelWidth, availableWidth);
    const effectivePanelHeight = Math.min(panelHeight, availableHeight);

    // 좌/우 공간 비교: 객체가 가장자리 근처면 반대쪽에 배치
    const leftSpace = x - leftBound;
    const rightSpace = rightBound - x;
    const preferSide = Math.max(leftSpace, rightSpace) >= effectivePanelWidth + offsetX + 8;

    type Placement = 'above' | 'below' | 'left' | 'right';
    let placement: Placement = 'above';

    // 가용 높이가 사실상 0인 경우: 좌/우 배치로 강제하고 중앙 정렬로 폴백
    if (availableHeight <= 0.5) {
      const leftSpace = x - leftBound;
      const rightSpace = rightBound - x;
      placement = rightSpace >= leftSpace ? 'right' : 'left';
      const centerY = (topBound + bottomBound) / 2;
      const halfH = effectivePanelHeight / 2;
      // y를 중앙에 두되 경계 내로 클램프
      let yFallback = centerY;
      if (yFallback - halfH < topBound) yFallback = topBound + halfH;
      if (yFallback + halfH > bottomBound) yFallback = bottomBound - halfH;
      // x는 선택된 측면에 맞게 배치
      if (placement === 'left') {
        const rightEdge = position.x - offsetX;
        const leftEdge = rightEdge - effectivePanelWidth;
        x = leftEdge < leftBound ? (leftBound + effectivePanelWidth) : rightEdge;
      } else {
        const leftEdge = position.x + offsetX;
        const rightEdge = leftEdge + effectivePanelWidth;
        x = rightEdge > rightBound ? (rightBound - effectivePanelWidth) : leftEdge;
      }
      return { x, y: yFallback, placement, maxWidthPx: Math.max(120, Math.min(availableWidth, (placement === 'left' ? (x - leftBound) : (rightBound - x)))) } as const;
    }

    if (preferSide) {
      // 가로 배치 선호: 우측 공간이 부족하면 좌측, 반대도 동일
      if (rightSpace < effectivePanelWidth + offsetX && leftSpace >= rightSpace) {
        placement = 'left';
      } else if (leftSpace < effectivePanelWidth + offsetX && rightSpace > leftSpace) {
        placement = 'right';
      } else {
        placement = rightSpace >= leftSpace ? 'right' : 'left';
      }
    } else {
      // 세로 배치 판단
      const aboveAnchorY = position.y - offsetY;
      const belowAnchorY = position.y + offsetY;
      const canAbove = (aboveAnchorY - effectivePanelHeight) >= topBound;
      const canBelow = (belowAnchorY + effectivePanelHeight) <= bottomBound;
      placement = canAbove ? 'above' : canBelow ? 'below' : (rightSpace >= leftSpace ? 'right' : 'left');
    }

    // 좌표 계산/클램프
    let y: number = position.y;
    if (placement === 'left' || placement === 'right') {
      const halfH = effectivePanelHeight / 2;
      if (y - halfH < topBound) y = topBound + halfH;
      if (y + halfH > bottomBound) y = bottomBound - halfH;
      if (placement === 'left') {
        const rightEdge = position.x - offsetX;
        const leftEdge = rightEdge - effectivePanelWidth;
        x = leftEdge < leftBound ? (leftBound + effectivePanelWidth) : rightEdge;
      } else {
        const leftEdge = position.x + offsetX;
        const rightEdge = leftEdge + effectivePanelWidth;
        x = rightEdge > rightBound ? (rightBound - effectivePanelWidth) : leftEdge;
      }
    } else {
      // above/below
      y = placement === 'above' ? (position.y - offsetY) : (position.y + offsetY);
      const halfW = effectivePanelWidth / 2;
      if (x - halfW < leftBound) x = leftBound + halfW;
      if (x + halfW > rightBound) x = rightBound - halfW;
      // y 클램프
      if (placement === 'above' && (y - effectivePanelHeight) < topBound) y = topBound + effectivePanelHeight;
      if (placement === 'below' && (y + effectivePanelHeight) > bottomBound) y = bottomBound - effectivePanelHeight;
    }

    let maxWidthPx = availableWidth;
    if (placement === 'left') maxWidthPx = Math.max(120, Math.min(availableWidth, leftSpace - offsetX));
    if (placement === 'right') maxWidthPx = Math.max(120, Math.min(availableWidth, rightSpace - offsetX));
    const finalPosition = { x, y, placement, maxWidthPx } as const;
    // console.log('🎯 getConstrainedPosition 결과:', {
    //   originalPosition: position,
    //   finalPosition,
    //   panelSize: { width: panelWidth, height: panelHeight },
    //   bounds: { leftBound, rightBound, topBound, bottomBound },
    //   isMobile: isMobile()
    // });
    return finalPosition;
  };

  const constrainedPosition = getConstrainedPosition();

  // 2차 안전장치: 렌더 후 실제 DOM 크기를 기준으로 좌/우/상/하 오버플로우가 있으면 미세 보정
  const [correctedPos, setCorrectedPos] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const correct = () => {
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const safe = getSafeTouchArea();
      const occ = getUIOcclusionInsets();
      const margin = isMobile() ? Math.max(safe.left, safe.right, 20) : 16;
      const leftBound = margin + occ.left;
      const rightBound = vw - margin - occ.right;
      const topBound = safe.top + occ.top + margin;
      const bottomBound = vh - safe.bottom - occ.bottom - margin;

      let dx = 0;
      if (rect.left < leftBound) dx += (leftBound - rect.left);
      if (rect.right > rightBound) dx -= (rect.right - rightBound);

      let dy = 0;
      if (rect.top < topBound) dy += (topBound - rect.top);
      if (rect.bottom > bottomBound) dy -= (rect.bottom - bottomBound);

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        setCorrectedPos({ x: constrainedPosition.x + dx, y: constrainedPosition.y + dy });
      } else {
        // 작은 차이는 유지하여 보정값이 즉시 사라지는 깜빡임을 방지
        // setCorrectedPos(null);
      }
    };

    // 초기 보정 + 레이아웃 변화에 반응
    correct();
    const ro = new ResizeObserver(() => correct());
    ro.observe(el);
    window.addEventListener('resize', correct);
    window.addEventListener('orientationchange', correct);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', correct);
      window.removeEventListener('orientationchange', correct);
    };
  }, [constrainedPosition.x, constrainedPosition.y, panelSize.width, panelSize.height]);

  const panel = (
    <div
      data-floating-controls="true"
      className="fixed z-[99999] pointer-events-auto"
      style={{
        left: correctedPos?.x ?? constrainedPosition.x,
        top: correctedPos?.y ?? constrainedPosition.y,
        transform:
          constrainedPosition.placement === 'above' ? 'translate(-50%, -100%)' :
          constrainedPosition.placement === 'below' ? 'translate(-50%, 0)' :
          constrainedPosition.placement === 'left' ? 'translate(-100%, -50%)' :
          'translate(0, -50%)' // right
      }}
    >
      <AnimatePresence>
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
        {/* 상단 화살표 (아래 배치일 때) */}
        {constrainedPosition.placement === 'below' && (
          <div className="flex justify-center mb-2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white/95"></div>
          </div>
        )}

        {/* 좌측/우측 배치 화살표 */}
        {constrainedPosition.placement === 'left' && (
          <div className="absolute right-[-4px] top-1/2 -translate-y-1/2">
            <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-white/95" />
          </div>
        )}
        {constrainedPosition.placement === 'right' && (
          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2">
            <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-white/95" />
          </div>
        )}

        {/* 메인 컨트롤 패널 - 가로로 긴 디자인 */}
        <div
          ref={panelRef}
          className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-3 ${
            isMobile() ? 'overflow-x-auto' : ''
          }`}
          style={{ maxWidth: Math.floor(constrainedPosition.maxWidthPx) + 'px', boxSizing: 'border-box' }}
        >
          {/* 컨트롤 버튼들 - 가로 배치 */}
          <div className="flex items-center gap-2">
            {/* 왼쪽 회전 */}
            <motion.button
              onClick={onRotateLeft}
              className={`${isMobile() ? 'p-4 min-w-[48px] min-h-[48px]' : 'p-3'} rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors`}
              whileTap={{ scale: 0.95 }}
            >
              <FiRotateCcw size={20} className="text-blue-600" />
            </motion.button>

            {/* 오른쪽 회전 */}
            <motion.button
              onClick={onRotateRight}
              className={`${isMobile() ? 'p-4 min-w-[48px] min-h-[48px]' : 'p-3'} rounded-xl bg-green-50 hover:bg-green-100 transition-colors`}
              whileTap={{ scale: 0.95 }}
            >
              <FiRotateCw size={20} className="text-green-600" />
            </motion.button>

            {/* 복제 */}
            <motion.button
              onClick={onDuplicate}
              className={`${isMobile() ? 'p-4 min-w-[48px] min-h-[48px]' : 'p-3'} rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors`}
              whileTap={{ scale: 0.95 }}
            >
              <FiCopy size={20} className="text-purple-600" />
            </motion.button>

            {/* 삭제 */}
            <motion.button
              onClick={onDelete}
              className={`${isMobile() ? 'p-4 min-w-[48px] min-h-[48px]' : 'p-3'} rounded-xl bg-red-50 hover:bg-red-100 transition-colors`}
              whileTap={{ scale: 0.95 }}
            >
              <FiTrash2 size={20} className="text-red-600" />
            </motion.button>
          </div>
        </div>

          {/* 하단 화살표 (위 배치일 때) */}
          {constrainedPosition.placement === 'above' && (
            <div className="flex justify-center mt-2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  // transform이 적용된 조상 요소의 영향을 피하기 위해 Portal로 body에 렌더링
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(panel, document.body);
  }
  return panel;
};

export default FurnitureFloatingControls;
