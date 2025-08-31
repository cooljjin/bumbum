import { test, expect } from '@playwright/test';

test.describe('시점 전환 버튼 클릭 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('시점 전환 버튼 클릭 시 상태가 변경되어야 함', async ({ page }) => {
    // 초기 상태 확인
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    await expect(viewToggleButton).toBeVisible();
    
    // 초기 디버그 패널 상태 확인
    const debugPanel = page.locator('.absolute.bottom-4.left-4');
    await expect(debugPanel).toContainText('🔒 시점 상태: 자유');
    
    // 버튼 클릭
    await viewToggleButton.click();
    
    // 애니메이션 진행 중 상태 확인
    await expect(viewToggleButton).toHaveText('🔄 전환 중...');
    await expect(viewToggleButton).toBeDisabled();
    
    // 애니메이션 완료 대기 (1초 + 여유시간)
    await page.waitForTimeout(2000);
    
    // 애니메이션 완료 후 상태 확인
    await expect(viewToggleButton).toHaveText('🔓 자유 모드');
    await expect(viewToggleButton).toBeEnabled();
    
    // 디버그 패널에서 상태 확인
    await expect(debugPanel).toContainText('🔒 시점 상태: 고정');
    await expect(debugPanel).toContainText('🎬 애니메이션: 대기 ✅');
  });

  test('연속 클릭 시 적절히 처리되어야 함', async ({ page }) => {
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    
    // 첫 번째 클릭
    await viewToggleButton.click();
    
    // 애니메이션 진행 중
    await expect(viewToggleButton).toHaveText('🔄 전환 중...');
    
    // 애니메이션 완료 전에 연속 클릭 시도
    for (let i = 0; i < 3; i++) {
      await viewToggleButton.click();
      // 여전히 애니메이션 진행 중이어야 함
      await expect(viewToggleButton).toHaveText('🔄 전환 중...');
      await expect(viewToggleButton).toBeDisabled();
    }
    
    // 애니메이션 완료 대기
    await page.waitForTimeout(2000);
    
    // 최종 상태 확인
    await expect(viewToggleButton).toHaveText('🔓 자유 모드');
    await expect(viewToggleButton).toBeEnabled();
  });

  test('고정 모드에서 자유 모드로 전환', async ({ page }) => {
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    
    // 먼저 고정 모드로 전환
    await viewToggleButton.click();
    await page.waitForTimeout(2000);
    await expect(viewToggleButton).toHaveText('🔓 자유 모드');
    
    // 자유 모드로 전환
    await viewToggleButton.click();
    
    // 애니메이션 진행 중
    await expect(viewToggleButton).toHaveText('🔄 전환 중...');
    
    // 애니메이션 완료 대기
    await page.waitForTimeout(2000);
    
    // 자유 모드 상태 확인
    await expect(viewToggleButton).toHaveText('🔒 고정 모드');
    
    // 디버그 패널에서 상태 확인
    const debugPanel = page.locator('.absolute.bottom-4.left-4');
    await expect(debugPanel).toContainText('🔒 시점 상태: 자유');
  });
});
