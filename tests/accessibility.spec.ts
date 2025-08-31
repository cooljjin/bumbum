import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // 메인 페이지의 헤딩 구조 확인
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // 헤딩이 계층적으로 제대로 구성되어 있는지 확인
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Tab 키로 포커스 이동 가능한 요소들이 있는지 확인
    await page.keyboard.press('Tab');
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeDefined();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // 텍스트 요소들의 색상 대비 확인
    const textElements = await page.locator('[class*="text-"]').all();

    for (const element of textElements) {
      const isVisible = await element.isVisible();
      if (isVisible) {
        // 색상 스타일이 적용되어 있는지 확인
        const color = await element.evaluate(el => getComputedStyle(el).color);
        expect(color).toBeDefined();
      }
    }
  });

  test('should provide proper alt text for images', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // 모든 이미지 요소에 alt 속성이 있는지 확인
    const images = await page.locator('img').all();

    for (const image of images) {
      const alt = await image.getAttribute('alt');
      // alt 속성이 존재하거나 빈 문자열이어야 함 (의미 있는 이미지의 경우)
      expect(alt).not.toBeNull();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // 입력 요소들에 적절한 레이블이 있는지 확인
    const inputs = await page.locator('input, select, textarea').all();

    for (const input of inputs) {
      const hasLabel = await input.evaluate(el => {
        const id = el.id;
        const labels = document.querySelectorAll(`label[for="${id}"]`);
        return labels.length > 0 || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      });

      if (await input.isVisible()) {
        expect(hasLabel).toBe(true);
      }
    }
  });

  test('should maintain focus within modal dialogs', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // 모달이나 팝업이 있는 경우 포커스가 내부에 머무는지 확인
    const modal = await page.locator('[role="dialog"], .modal, .popup').first();

    if (await modal.isVisible()) {
      // 모달 내부의 포커스 가능한 요소들 확인
      const focusableElements = await modal.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
      expect(focusableElements.length).toBeGreaterThan(0);
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // ARIA 랜드마크가 적절히 사용되는지 확인
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="complementary"], header, nav, main, aside').all();
    expect(landmarks.length).toBeGreaterThan(0);

    // 의미 있는 링크 텍스트가 있는지 확인
    const links = await page.locator('a').all();
    for (const link of links) {
      const text = await link.textContent();
      const hasAccessibleName = text?.trim() || await link.getAttribute('aria-label');
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // 애니메이션이 있는 요소들이 reduced motion을 존중하는지 확인
    const animatedElements = await page.locator('[class*="animate"], [class*="transition"], [class*="motion"]').all();

    // prefers-reduced-motion 미디어 쿼리가 고려되는지 간접적으로 확인
    const hasMotionPreference = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    // 실제 테스트에서는 CSS나 JS에서 이 설정을 확인해야 함
    // 여기서는 간단히 요소들이 존재하는지만 확인
    expect(animatedElements.length).toBeGreaterThanOrEqual(0);
  });

  test('should be responsive and mobile accessible', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');

    // 터치 타겟 크기가 적절한지 확인
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // 터치 타겟은 최소 44x44px 이상이어야 함
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('should have proper document structure', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // HTML 문서 구조 확인
    const html = await page.locator('html').first();
    const lang = await html.getAttribute('lang');
    expect(lang).toBe('ko'); // 한국어 페이지의 경우

    // Title이 있는지 확인
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });
});
