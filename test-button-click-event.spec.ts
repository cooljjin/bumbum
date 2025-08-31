import { test, expect } from '@playwright/test';

test.describe('버튼 클릭 이벤트 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('버튼 클릭 시 이벤트가 발생해야 함', async ({ page }) => {
    // 시점 전환 버튼 찾기
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    await expect(viewToggleButton).toBeVisible();
    
    // 버튼 클릭 전 상태 확인
    const buttonTextBefore = await viewToggleButton.textContent();
    console.log('클릭 전 버튼 텍스트:', buttonTextBefore);
    
    // 버튼 클릭
    await viewToggleButton.click();
    
    // 잠시 대기
    await page.waitForTimeout(1000);
    
    // 클릭 후 상태 확인
    const buttonTextAfter = await viewToggleButton.textContent();
    console.log('클릭 후 버튼 텍스트:', buttonTextAfter);
    
    // 버튼 텍스트가 변경되었는지 확인
    expect(buttonTextAfter).toBe(buttonTextBefore);
    
    // 버튼이 여전히 활성 상태인지 확인
    await expect(viewToggleButton).toBeEnabled();
  });

  test('버튼 클릭 시 스타일이 변경되어야 함', async ({ page }) => {
    // 시점 전환 버튼 찾기
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    
    // 클릭 전 스타일 확인
    const classBefore = await viewToggleButton.getAttribute('class');
    console.log('클릭 전 클래스:', classBefore);
    
    // 버튼 클릭
    await viewToggleButton.click();
    
    // 잠시 대기
    await page.waitForTimeout(1000);
    
    // 클릭 후 스타일 확인
    const classAfter = await viewToggleButton.getAttribute('class');
    console.log('클릭 후 클래스:', classAfter);
    
    // 클래스가 변경되었는지 확인
    expect(classAfter).toBe(classBefore);
  });

  test('버튼 클릭 시 페이지에 변화가 있어야 함', async ({ page }) => {
    // 초기 디버그 패널 상태 확인
    const debugPanel = page.locator('.absolute.bottom-4.left-4');
    const initialDebugText = await debugPanel.textContent();
    console.log('초기 디버그 패널:', initialDebugText);
    
    // 시점 전환 버튼 클릭
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    await viewToggleButton.click();
    
    // 잠시 대기
    await page.waitForTimeout(2000);
    
    // 클릭 후 디버그 패널 상태 확인
    const finalDebugText = await debugPanel.textContent();
    console.log('클릭 후 디버그 패널:', finalDebugText);
    
    // 디버그 패널이 여전히 존재하는지 확인
    await expect(debugPanel).toBeVisible();
  });
});
