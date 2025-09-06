/**
 * 모바일 환경에서 스크롤 락을 관리하는 유틸리티 함수들
 */

interface ScrollLockState {
  originalScrollY: number;
  originalBodyStyle: string;
  originalHtmlStyle: string;
  isLocked: boolean;
}

let scrollLockState: ScrollLockState = {
  originalScrollY: 0,
  originalBodyStyle: '',
  originalHtmlStyle: '',
  isLocked: false
};

/**
 * iOS Safari 환경인지 확인
 */
export const isIOSSafari = (): boolean => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return isIOS && isSafari;
};

/**
 * 모바일 환경인지 확인
 */
export const isMobile = (): boolean => {
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(navigator.userAgent) || window.innerWidth <= 768;
};

/**
 * 3D 캔버스 영역인지 확인
 */
export const isCanvasArea = (target: EventTarget): boolean => {
  const element = target as HTMLElement;
  const canvas = element.closest('canvas');
  const isCanvasArea = canvas || element.classList.contains('edit-mode-canvas');
  
  // 3D 객체나 가구 관련 요소인지도 확인
  const is3DObject = element.closest('[data-testid*="furniture"], [class*="draggable"], [class*="furniture"]');
  
  // 모바일 가구 컨트롤 영역도 허용
  const isMobileFurnitureControl = element.closest('[data-mobile-furniture-control]');
  
  return !!(isCanvasArea || is3DObject || isMobileFurnitureControl);
};

/**
 * 클릭 가능한 요소인지 확인 (버튼, 링크, 입력 필드 등)
 */
export const isClickableElement = (target: EventTarget): boolean => {
  const element = target as HTMLElement;
  
  // 클릭 가능한 태그들
  const clickableTags = ['button', 'a', 'input', 'select', 'textarea', 'label'];
  if (clickableTags.includes(element.tagName.toLowerCase())) {
    return true;
  }
  
  // 클릭 가능한 역할들
  const clickableRoles = ['button', 'link', 'tab', 'menuitem', 'option'];
  if (element.getAttribute('role') && clickableRoles.includes(element.getAttribute('role')!)) {
    return true;
  }
  
  // 클릭 가능한 클래스들
  const clickableClasses = ['cursor-pointer', 'clickable', 'btn', 'button'];
  if (clickableClasses.some(cls => element.classList.contains(cls))) {
    return true;
  }
  
  // 부모 요소 중에 클릭 가능한 요소가 있는지 확인
  const clickableParent = element.closest('button, a, [role="button"], [role="link"], .cursor-pointer, .clickable, .btn, .button');
  if (clickableParent) {
    return true;
  }
  
  return false;
};

/**
 * 스크롤 락 활성화
 */
export const enableScrollLock = (): void => {
  if (scrollLockState.isLocked) return;

  // 현재 스크롤 위치와 스타일 저장
  scrollLockState.originalScrollY = window.scrollY;
  scrollLockState.originalBodyStyle = document.body.style.cssText;
  scrollLockState.originalHtmlStyle = document.documentElement.style.cssText;

  const isIOS = isIOSSafari();

  // CSS 클래스를 통한 스크롤 락
  if (isIOS) {
    document.body.classList.add('scroll-locked-ios');
    document.documentElement.classList.add('scroll-locked-ios');
  } else {
    document.body.classList.add('scroll-locked');
    document.documentElement.classList.add('scroll-locked');
  }

  // 추가적인 인라인 스타일 적용
  document.body.style.cssText += `
    position: fixed !important;
    top: -${scrollLockState.originalScrollY}px !important;
    left: 0 !important;
    right: 0 !important;
    overflow: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    touch-action: none !important;
    -ms-touch-action: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    user-select: none !important;
  `;

  // iOS Safari를 위한 추가 처리
  document.documentElement.style.cssText += `
    overflow: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    touch-action: none !important;
    -ms-touch-action: none !important;
  `;

  scrollLockState.isLocked = true;
  console.log('🔒 스크롤 락 활성화됨 (iOS Safari:', isIOS, ')');
};

/**
 * 스크롤 락 비활성화
 */
export const disableScrollLock = (): void => {
  if (!scrollLockState.isLocked) return;

  // CSS 클래스 제거
  document.body.classList.remove('scroll-locked', 'scroll-locked-ios');
  document.documentElement.classList.remove('scroll-locked', 'scroll-locked-ios');

  // 원본 스타일 복원
  document.body.style.cssText = scrollLockState.originalBodyStyle;
  document.documentElement.style.cssText = scrollLockState.originalHtmlStyle;

  // 스크롤 위치 복원
  window.scrollTo(0, scrollLockState.originalScrollY);

  scrollLockState.isLocked = false;
  console.log('🔓 스크롤 락 비활성화됨');
};

/**
 * 터치 이벤트 방지 함수
 */
export const preventTouchScroll = (e: Event): void => {
  if (e.target && isCanvasArea(e.target)) {
    // 3D 캔버스 영역에서는 터치 허용
    console.log('🎯 3D 캔버스 영역 터치 허용됨');
    return;
  }

  if (e.target && isClickableElement(e.target)) {
    // 클릭 가능한 요소에서는 터치 허용
    console.log('🎯 클릭 가능한 요소 터치 허용됨');
    return;
  }

  // 다른 영역에서는 터치 이벤트 방지 (카메라 컨트롤을 위해 주석 처리)
  // if (e.type === 'touchmove' || e.type === 'touchstart' || e.type === 'touchend') {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   console.log('🔒 터치 스크롤 방지됨');
  // }
};

/**
 * 휠 이벤트 방지 함수
 */
export const preventWheelScroll = (e: WheelEvent): void => {
  if (e.target && isCanvasArea(e.target)) {
    // 3D 캔버스 영역에서는 휠 허용
    console.log('🎯 3D 캔버스 영역 휠 허용됨');
    return;
  }

  if (e.target && isClickableElement(e.target)) {
    // 클릭 가능한 요소에서는 휠 허용 (드롭다운 등에서 사용)
    console.log('🎯 클릭 가능한 요소 휠 허용됨');
    return;
  }

  // 다른 영역에서는 휠 이벤트 방지
  e.preventDefault();
  // e.stopPropagation(); // 이벤트 전파 허용
  console.log('🔒 휠 스크롤 방지됨');
};

/**
 * 키보드 스크롤 방지 함수
 */
export const preventKeyScroll = (e: KeyboardEvent): void => {
  const scrollKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'];
  
  if (scrollKeys.includes(e.code)) {
    // 입력 필드에서는 키보드 스크롤 허용
    if (e.target && isClickableElement(e.target)) {
      console.log('🎯 클릭 가능한 요소 키보드 허용됨');
      return;
    }
    
    e.preventDefault();
    console.log('🔒 키보드 스크롤 방지됨');
  }
};

/**
 * 스크롤 락 상태 확인
 */
export const isScrollLocked = (): boolean => {
  return scrollLockState.isLocked;
};

/**
 * 스크롤 락 상태 초기화
 */
export const resetScrollLockState = (): void => {
  scrollLockState = {
    originalScrollY: 0,
    originalBodyStyle: '',
    originalHtmlStyle: '',
    isLocked: false
  };
};
