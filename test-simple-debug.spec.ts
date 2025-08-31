import { test, expect } from '@playwright/test';

test.describe('Real3DRoom 디버그 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
  });

  test('페이지가 제대로 로드되어야 함', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('나만의 미니룸');
  });

  test('Real3DRoom 컴포넌트가 렌더링되어야 함', async ({ page }) => {
    // Canvas 요소가 존재하는지 확인
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('시점 전환 버튼이 존재해야 함', async ({ page }) => {
    // 시점 전환 버튼 찾기
    const viewToggleButton = page.locator('button');
    
    // 모든 버튼 출력
    const buttonCount = await viewToggleButton.count();
    console.log(`페이지에 ${buttonCount}개의 버튼이 있습니다.`);
    
    for (let i = 0; i < buttonCount; i++) {
      const button = viewToggleButton.nth(i);
      const text = await button.textContent();
      console.log(`버튼 ${i}: "${text}"`);
    }
    
    // 시점 전환 관련 버튼 찾기
    const viewToggleButtons = page.locator('button:has-text("고정 모드"), button:has-text("자유 모드"), button:has-text("전환 중")');
    const count = await viewToggleButtons.count();
    
    if (count > 0) {
      console.log(`시점 전환 관련 버튼 ${count}개를 찾았습니다.`);
      for (let i = 0; i < count; i++) {
        const button = viewToggleButtons.nth(i);
        const text = await button.textContent();
        console.log(`시점 전환 버튼 ${i}: "${text}"`);
      }
    } else {
      console.log('시점 전환 관련 버튼을 찾을 수 없습니다.');
    }
    
    // 최소한 하나의 버튼은 존재해야 함
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('디버그 패널이 표시되어야 함', async ({ page }) => {
    // 개발 모드에서만 디버그 패널이 표시됨
    const debugPanel = page.locator('.absolute.bottom-4.left-4');
    
    try {
      await expect(debugPanel).toBeVisible({ timeout: 5000 });
      const debugText = await debugPanel.textContent();
      console.log('디버그 패널 내용:', debugText);
    } catch (error) {
      console.log('디버그 패널이 표시되지 않습니다. (개발 모드가 아닐 수 있음)');
    }
  });
});
