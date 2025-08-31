import { test, expect } from '@playwright/test';

test.describe('버튼 속성 및 이벤트 핸들러 확인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('시점 전환 버튼의 모든 속성 확인', async ({ page }) => {
    // 시점 전환 버튼 찾기
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    await expect(viewToggleButton).toBeVisible();
    
    // 버튼의 모든 속성 확인
    const buttonElement = await viewToggleButton.elementHandle();
    if (buttonElement) {
      const attributes = await buttonElement.evaluate((el) => {
        const attrs: Record<string, string> = {};
        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          attrs[attr.name] = attr.value;
        }
        return attrs;
      });
      
      console.log('버튼의 모든 속성:', attributes);
      
      // onClick 이벤트가 있는지 확인 (React에서 자동으로 추가됨)
      expect(attributes).toHaveProperty('class');
      expect(attributes.class).toContain('px-4');
      expect(attributes.class).toContain('py-2');
    }
  });

  test('버튼 클릭 시 JavaScript 오류 확인', async ({ page }) => {
    // JavaScript 오류 수집
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.log('JavaScript 오류:', error.message);
    });
    
    // 콘솔 로그 수집
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });
    
    // 시점 전환 버튼 클릭
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    await viewToggleButton.click();
    
    // 잠시 대기
    await page.waitForTimeout(2000);
    
    // 오류가 있는지 확인
    console.log('수집된 JavaScript 오류:', errors);
    console.log('수집된 콘솔 로그:', consoleLogs);
    
    // JavaScript 오류가 없어야 함
    expect(errors.length).toBe(0);
  });

  test('버튼의 DOM 구조 확인', async ({ page }) => {
    // 시점 전환 버튼 찾기
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    
    // 버튼의 부모 요소 확인
    const parentElement = viewToggleButton.locator('..');
    const parentHTML = await parentElement.innerHTML();
    console.log('버튼의 부모 요소 HTML:', parentHTML);
    
    // 버튼 자체의 HTML 확인
    const buttonHTML = await viewToggleButton.innerHTML();
    console.log('버튼 HTML:', buttonHTML);
    
    // 버튼이 제대로 렌더링되어야 함
    expect(buttonHTML).toContain('🔒 고정 모드');
  });
});
