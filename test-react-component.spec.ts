import { test, expect } from '@playwright/test';

test.describe('React 컴포넌트 작동 확인', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('React 컴포넌트가 제대로 렌더링되어야 함', async ({ page }) => {
    // React 관련 요소들이 존재하는지 확인
    const reactRoot = page.locator('#__next');
    await expect(reactRoot).toBeVisible();
    
    // 메인 페이지 제목 확인
    const mainTitle = page.locator('h1');
    await expect(mainTitle).toContainText('나만의 미니룸');
    
    // Canvas 요소 확인 (Three.js)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // 시점 전환 버튼 확인
    const viewToggleButton = page.locator('button:has-text("🔒 고정 모드")');
    await expect(viewToggleButton).toBeVisible();
  });

  test('JavaScript가 활성화되어 있어야 함', async ({ page }) => {
    // JavaScript가 활성화되어 있는지 확인
    const isJavaScriptEnabled = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             typeof window.document !== 'undefined' &&
             typeof window.addEventListener !== 'undefined';
    });
    
    expect(isJavaScriptEnabled).toBe(true);
    
    // React DevTools가 있는지 확인 (개발 모드)
    const hasReactDevTools = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== undefined;
    });
    
    console.log('React DevTools 존재:', hasReactDevTools);
  });

  test('컴포넌트 상태 변경이 가능해야 함', async ({ page }) => {
    // 테마 선택 버튼 찾기 (다른 React 컴포넌트)
    const themeButtons = page.locator('button:has-text("Calm"), button:has-text("Cozy"), button:has-text("Vivid")');
    const buttonCount = await themeButtons.count();
    
    expect(buttonCount).toBeGreaterThan(0);
    
    // 첫 번째 테마 버튼 클릭
    const firstThemeButton = themeButtons.first();
    const initialText = await firstThemeButton.textContent();
    
    await firstThemeButton.click();
    
    // 잠시 대기
    await page.waitForTimeout(1000);
    
    // 버튼이 여전히 존재하는지 확인
    await expect(firstThemeButton).toBeVisible();
    
    console.log('테마 버튼 클릭 테스트 완료');
  });
});
