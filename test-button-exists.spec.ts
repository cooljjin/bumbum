import { test, expect } from '@playwright/test';

test.describe('시점 전환 버튼 존재 확인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('시점 전환 버튼이 존재하고 클릭 가능해야 함', async ({ page }) => {
    // 시점 전환 버튼 찾기
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    
    // 버튼이 존재하는지 확인
    await expect(viewToggleButton).toBeVisible();
    
    // 버튼이 클릭 가능한지 확인
    await expect(viewToggleButton).toBeEnabled();
    
    // 버튼의 클래스와 스타일 확인
    const buttonClass = await viewToggleButton.getAttribute('class');
    console.log('버튼 클래스:', buttonClass);
    
    // 버튼의 위치 확인
    const buttonBox = await viewToggleButton.boundingBox();
    console.log('버튼 위치:', buttonBox);
    
    // 버튼이 화면에 보이는지 확인
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.width).toBeGreaterThan(0);
    expect(buttonBox!.height).toBeGreaterThan(0);
    
    // 버튼 텍스트 확인
    const buttonText = await viewToggleButton.textContent();
    console.log('버튼 텍스트:', buttonText);
    expect(buttonText).toContain('🔒 고정 모드');
  });

  test('페이지에 다른 버튼들도 존재해야 함', async ({ page }) => {
    // 모든 버튼 찾기
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    
    console.log(`페이지에 ${buttonCount}개의 버튼이 있습니다.`);
    
    // 각 버튼의 정보 출력
    for (let i = 0; i < buttonCount; i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();
      
      console.log(`버튼 ${i}: "${text}" - 보임: ${isVisible}, 활성: ${isEnabled}`);
    }
    
    // 최소한 몇 개의 버튼은 존재해야 함
    expect(buttonCount).toBeGreaterThan(5);
  });
});
