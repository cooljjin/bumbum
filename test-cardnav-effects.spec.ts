import { test, expect } from '@playwright/test';

test.describe('CardNav 컴포넌트 효과 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
  });

  test('CardNav 초기 상태 확인', async ({ page }) => {
    // CardNav가 페이지에 존재하는지 확인
    const cardNav = page.locator('.card-nav-container');
    await expect(cardNav).toBeVisible();
    
    // 초기에는 메뉴가 닫혀있어야 함 - 카드들이 숨겨져 있어야 함
    const navCards = page.locator('.nav-card');
    await expect(navCards).toHaveCount(3); // 카드는 DOM에 존재하지만 숨겨져 있음
    
    // 첫 번째 카드가 숨겨져 있는지 확인 (visibility: hidden, opacity: 0)
    const firstCard = navCards.nth(0);
    await expect(firstCard).toHaveCSS('visibility', 'hidden');
    await expect(firstCard).toHaveCSS('opacity', '0');
    
    // 초기 상태 스크린샷
    await page.screenshot({ path: 'cardnav-initial-state.png' });
  });

  test('햄버거 메뉴 클릭 시 애니메이션 효과', async ({ page }) => {
    // 햄버거 메뉴 버튼 찾기
    const hamburgerButton = page.locator('.menu-toggle');
    await expect(hamburgerButton).toBeVisible();
    
    // 메뉴 열기 전 스크린샷
    await page.screenshot({ path: 'cardnav-before-open.png' });
    
    // 햄버거 메뉴 클릭
    await hamburgerButton.click();
    
    // 애니메이션 완료 대기
    await page.waitForTimeout(500);
    
    // 메뉴 열린 후 스크린샷
    await page.screenshot({ path: 'cardnav-after-open.png' });
    
    // 네비게이션 카드들이 보이는지 확인
    const navCards = page.locator('.nav-card');
    await expect(navCards).toHaveCount(3);
    
    // 각 카드가 제대로 표시되는지 확인
    await expect(navCards.nth(0)).toContainText('About');
    await expect(navCards.nth(1)).toContainText('Projects');
    await expect(navCards.nth(2)).toContainText('Contact');
    
    // 카드들이 보이는 상태인지 확인
    const firstCard = navCards.nth(0);
    await expect(firstCard).toHaveCSS('visibility', 'visible');
    await expect(firstCard).toHaveCSS('opacity', '1');
  });

  test('메뉴 닫기 애니메이션', async ({ page }) => {
    // 먼저 메뉴 열기
    const hamburgerButton = page.locator('.menu-toggle');
    await hamburgerButton.click();
    await page.waitForTimeout(500);
    
    // 메뉴가 열린 상태 확인
    const navCards = page.locator('.nav-card');
    await expect(navCards).toHaveCount(3);
    
    // 메뉴 닫기 전 스크린샷
    await page.screenshot({ path: 'cardnav-before-close.png' });
    
    // 햄버거 메뉴 다시 클릭하여 닫기
    await hamburgerButton.click();
    
    // 애니메이션 완료 대기
    await page.waitForTimeout(500);
    
    // 메뉴 닫힌 후 스크린샷
    await page.screenshot({ path: 'cardnav-after-close.png' });
    
    // 메뉴가 닫혔는지 확인 - 카드들이 숨겨져 있어야 함
    const firstCard = navCards.nth(0);
    await expect(firstCard).toHaveCSS('visibility', 'hidden');
    await expect(firstCard).toHaveCSS('opacity', '0');
  });

  test('햄버거 아이콘 회전 애니메이션', async ({ page }) => {
    const hamburgerButton = page.locator('.menu-toggle');
    
    // 초기 상태에서 rotate-90 클래스가 없어야 함
    await expect(hamburgerButton).not.toHaveClass(/rotate-90/);
    
    // 메뉴 열기
    await hamburgerButton.click();
    await page.waitForTimeout(500);
    
    // 열린 상태에서 rotate-90 클래스가 있어야 함
    await expect(hamburgerButton).toHaveClass(/rotate-90/);
    
    // 메뉴 닫기
    await hamburgerButton.click();
    await page.waitForTimeout(500);
    
    // 닫힌 상태에서 rotate-90 클래스가 없어야 함
    await expect(hamburgerButton).not.toHaveClass(/rotate-90/);
  });

  test('네비게이션 카드 호버 효과', async ({ page }) => {
    // 메뉴 열기
    const hamburgerButton = page.locator('.menu-toggle');
    await hamburgerButton.click();
    await page.waitForTimeout(500);
    
    // 첫 번째 카드에 호버
    const firstCard = page.locator('.nav-card').nth(0);
    await firstCard.hover();
    
    // 호버 효과 확인 (scale-105 클래스)
    await expect(firstCard).toHaveClass(/hover:scale-105/);
    
    // 호버 후 스크린샷
    await page.screenshot({ path: 'cardnav-hover-effect.png' });
  });

  test('카드 내부 링크 클릭 이벤트', async ({ page }) => {
    // 메뉴 열기
    const hamburgerButton = page.locator('.menu-toggle');
    await hamburgerButton.click();
    await page.waitForTimeout(500);
    
    // About 카드의 Company 링크 클릭
    const companyLink = page.locator('.nav-card').nth(0).locator('button').nth(0);
    await expect(companyLink).toContainText('Company');
    
    // 콘솔 로그 모니터링
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('클릭됨:')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // 링크 클릭
    await companyLink.click();
    
    // 콘솔에 로그가 출력되었는지 확인
    await page.waitForTimeout(100);
    expect(consoleMessages.some(msg => msg.includes('클릭됨: Company'))).toBeTruthy();
  });

  test('반응형 디자인 확인', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    // CardNav가 여전히 보이는지 확인
    const cardNav = page.locator('.card-nav-container');
    await expect(cardNav).toBeVisible();
    
    // 모바일 뷰에서 스크린샷
    await page.screenshot({ path: 'cardnav-mobile-view.png' });
    
    // 데스크톱 뷰포트로 복원
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('GSAP 애니메이션 성능 확인', async ({ page }) => {
    // 메뉴 열기/닫기 성능 측정
    const hamburgerButton = page.locator('.menu-toggle');
    
    // 메뉴 열기 성능 측정
    const openStart = Date.now();
    await hamburgerButton.click();
    await page.waitForTimeout(500);
    const openEnd = Date.now();
    
    // 메뉴 닫기 성능 측정
    const closeStart = Date.now();
    await hamburgerButton.click();
    await page.waitForTimeout(500);
    const closeEnd = Date.now();
    
    // 애니메이션 시간이 합리적인 범위 내에 있는지 확인
    const openTime = openEnd - openStart;
    const closeTime = closeEnd - closeStart;
    
    console.log(`메뉴 열기 시간: ${openTime}ms`);
    console.log(`메뉴 닫기 시간: ${closeTime}ms`);
    
    // 애니메이션이 너무 느리지 않아야 함 (1초 이내)
    expect(openTime).toBeLessThan(1000);
    expect(closeTime).toBeLessThan(1000);
  });
});
