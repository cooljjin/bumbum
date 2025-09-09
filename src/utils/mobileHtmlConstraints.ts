/**
 * 모바일 환경에서 Html 컴포넌트의 위치를 제한하는 유틸리티
 */

/**
 * 모바일 환경인지 확인
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(navigator.userAgent) || window.innerWidth <= 768;
};

/**
 * Html 컴포넌트의 스타일을 모바일 환경에 맞게 제한
 */
export const getMobileHtmlStyle = (maxWidth: number = 300): React.CSSProperties => {
  if (!isMobile()) {
    return {
      maxWidth: `${maxWidth}px`,
      wordWrap: 'break-word'
    };
  }

  // 모바일 환경에서는 더 엄격한 제한
  const screenWidth = window.innerWidth;
  const constrainedWidth = Math.min(maxWidth, screenWidth - 32); // 양쪽 16px 여백

  return {
    maxWidth: `${constrainedWidth}px`,
    wordWrap: 'break-word',
    // 모바일에서 텍스트가 화면을 벗어나지 않도록 추가 제한
    whiteSpace: 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    // 터치 이벤트 최적화
    touchAction: 'manipulation',
    // 모바일에서 가독성 향상
    fontSize: '14px',
    lineHeight: '1.4'
  };
};

/**
 * Html 컴포넌트의 위치를 화면 경계 내로 제한
 */
export const constrainHtmlPosition = (
  position: [number, number, number],
  elementWidth: number = 300,
  elementHeight: number = 100
): [number, number, number] => {
  if (!isMobile()) {
    return position;
  }

  const [x, y, z] = position;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // 모바일에서는 더 큰 여백 사용
  const margin = Math.max(16, screenWidth * 0.05); // 최소 16px 또는 화면 너비의 5%

  // X축 제한 (화면 중앙을 기준으로)
  const halfWidth = elementWidth / 2;
  let constrainedX = x;

  if (x - halfWidth < -screenWidth / 2 + margin) {
    constrainedX = -screenWidth / 2 + margin + halfWidth;
  } else if (x + halfWidth > screenWidth / 2 - margin) {
    constrainedX = screenWidth / 2 - margin - halfWidth;
  }

  // Y축 제한 (화면 상단/하단 고려)
  let constrainedY = y;
  const halfHeight = elementHeight / 2;

  if (y + halfHeight > screenHeight / 2 - margin) {
    constrainedY = screenHeight / 2 - margin - halfHeight;
  } else if (y - halfHeight < -screenHeight / 2 + margin) {
    constrainedY = -screenHeight / 2 + margin + halfHeight;
  }

  return [constrainedX, constrainedY, z];
};

/**
 * 모바일 환경에서 플로팅 요소의 최적 크기 계산
 */
export const getOptimalFloatingSize = (
  defaultWidth: number = 320,
  defaultHeight: number = 80
): { width: number; height: number } => {
  if (!isMobile()) {
    return { width: defaultWidth, height: defaultHeight };
  }

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // 모바일에서는 화면의 80-90%를 최대 크기로 사용
  const maxWidth = Math.min(defaultWidth, screenWidth * 0.9);
  const maxHeight = Math.min(defaultHeight, screenHeight * 0.15); // 화면 높이의 15%를 최대 높이로

  return {
    width: Math.max(maxWidth, 280), // 최소 너비 보장
    height: Math.max(maxHeight, 60)  // 최소 높이 보장
  };
};

/**
 * 모바일 환경에서 안전한 터치 영역 계산
 */
export const getSafeTouchArea = (): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} => {
  if (!isMobile()) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // 상단 안전 영역 (노치, 상태바 등 고려)
  const topSafe = Math.max(44, screenHeight * 0.08);

  // 하단 안전 영역 (홈 인디케이터 등 고려)
  const bottomSafe = Math.max(34, screenHeight * 0.06);

  // 좌우 안전 영역
  const sideSafe = Math.max(16, screenWidth * 0.04);

  return {
    top: topSafe,
    bottom: bottomSafe,
    left: sideSafe,
    right: sideSafe
  };
};

/**
 * 모바일 환경에서 Html 컴포넌트의 distanceFactor를 조정
 */
export const getMobileDistanceFactor = (defaultFactor: number = 8): number => {
  if (!isMobile()) {
    return defaultFactor;
  }
  
  // 모바일에서는 더 작은 distanceFactor로 더 가까이 표시
  return Math.max(defaultFactor * 0.7, 4);
};

/**
 * 모바일 환경에서 Html 컴포넌트의 zIndexRange를 조정
 */
export const getMobileZIndexRange = (defaultRange: [number, number] = [200, 0]): [number, number] => {
  if (!isMobile()) {
    return defaultRange;
  }
  
  // 모바일에서는 더 높은 z-index 사용
  return [300, 100];
};
