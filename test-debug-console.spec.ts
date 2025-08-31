import { test, expect } from '@playwright/test';

test.describe('콘솔 로그 디버그 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('시점 전환 버튼 클릭 시 콘솔 로그 확인', async ({ page }) => {
    // 콘솔 로그 수집
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      console.log('Browser console:', msg.text());
    });

    // 초기 상태 확인
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    await expect(viewToggleButton).toBeVisible();
    
    // 버튼 클릭 전 콘솔 로그 확인
    console.log('클릭 전 콘솔 로그:', consoleLogs);
    
    // 버튼 클릭
    await viewToggleButton.click();
    
    // 잠시 대기
    await page.waitForTimeout(1000);
    
    // 클릭 후 콘솔 로그 확인
    console.log('클릭 후 콘솔 로그:', consoleLogs);
    
    // 시점 전환 관련 로그가 있는지 확인
    const hasViewTransitionLogs = consoleLogs.some(log => 
      log.includes('시점 전환') || 
      log.includes('애니메이션') || 
      log.includes('handleViewToggle') ||
      log.includes('animateViewTransition')
    );
    
    console.log('시점 전환 관련 로그 존재:', hasViewTransitionLogs);
    
    // 최소한 클릭 이벤트는 감지되어야 함
    expect(consoleLogs.length).toBeGreaterThan(0);
  });

  test('페이지 로드 시 초기화 로그 확인', async ({ page }) => {
    // 콘솔 로그 수집
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 초기화 관련 로그 확인
    const hasInitLogs = consoleLogs.some(log => 
      log.includes('Real3DRoom 마운트') || 
      log.includes('초기화') ||
      log.includes('마운트')
    );
    
    console.log('초기화 관련 로그:', consoleLogs.filter(log => 
      log.includes('Real3DRoom') || 
      log.includes('초기화') ||
      log.includes('마운트')
    ));
    
    expect(hasInitLogs).toBe(true);
  });
});
