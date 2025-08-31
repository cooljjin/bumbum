import { test, expect } from '@playwright/test';

/**
 * 실행 전 준비:
 * 1) 레퍼런스 스냅샷 파일: tests/__screenshots__/mega-menu.ref.png
 *    - React Bits 데모 화면을 1280x720으로 캡처해 해당 파일명으로 저장
 * 2) 현재 구현 페이지가 메뉴를 연 상태로 찍히도록, 필요한 상호작용을 아래에 작성
 */

test('Mega menu matches reference within 1.5% pixel diff', async ({ page }) => {
  await page.goto('/');

  // 필요 시 메뉴 열기 등 상호작용을 data-testid로 고정
  // await page.click('[data-testid="menu-button"]');
  // await page.hover('[data-testid="nav-projects"]');

  // 현재 화면 스냅샷을 생성하고, 레퍼런스와 비교
  // -> 참고: toHaveScreenshot는 암묵적으로 현재 스냅샷을 저장하고 diff를 계산
  await expect(page).toHaveScreenshot('mega-menu.ref.png', {
    // 둘 중 하나만 써도 되지만, 비율 기준을 권장
    maxDiffPixelRatio: 0.015, // 1.5% 이내면 통과
    // maxDiffPixels: 0,      // 필요 시 절대 픽셀 수로도 제한
    animations: 'disabled',
    caret: 'hide',
    fullPage: false,
    scale: 'css',
  });
});
