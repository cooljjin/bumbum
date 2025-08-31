import { test, expect } from '@playwright/test';

test.describe('시점 전환 버튼 클릭 디버그', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('버튼 클릭 시 콘솔 로그 확인', async ({ page }) => {
    // 콘솔 로그 수집
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      console.log('Browser console:', msg.text());
    });

    // 시점 전환 버튼 찾기
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    await expect(viewToggleButton).toBeVisible();
    
    console.log('버튼을 찾았습니다. 클릭을 시도합니다...');
    
    // 버튼 클릭
    await viewToggleButton.click();
    
    // 잠시 대기
    await page.waitForTimeout(2000);
    
    // 수집된 콘솔 로그 출력
    console.log('수집된 콘솔 로그:', consoleLogs);
    
    // 시점 전환 관련 로그가 있는지 확인
    const hasViewTransitionLogs = consoleLogs.some(log => 
      log.includes('버튼 클릭됨') || 
      log.includes('시점 전환') || 
      log.includes('animateViewTransition')
    );
    
    console.log('시점 전환 관련 로그 존재:', hasViewTransitionLogs);
    
    // 최소한 클릭 이벤트는 감지되어야 함
    expect(consoleLogs.length).toBeGreaterThan(0);
  });
});
