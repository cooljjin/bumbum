import { test, expect } from '@playwright/test';

test.describe('미니룸 간단 확인', () => {
  test('페이지 로드 및 미니룸 렌더링 확인', async ({ page }) => {
    console.log('🚀 페이지 로드 시작...');
    
    // 페이지 로드 (타임아웃 단축)
    await page.goto('http://localhost:3002', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });

    console.log('📄 페이지 로드 완료');

    // 3D 캔버스가 로드될 때까지 대기
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 5000 });
    
    console.log('🎨 3D 캔버스 로드 완료');

    // 캔버스 크기 확인
    const canvasElement = await canvas.elementHandle();
    if (canvasElement) {
      const boundingBox = await canvasElement.boundingBox();
      console.log('📐 캔버스 크기:', boundingBox);
      
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    }

    // 스크린샷 촬영
    console.log('📸 미니룸 초기 상태 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'miniroom-simple-check.png',
      fullPage: true 
    });

    // 편집 버튼 확인
    const editButton = page.locator('button[title*="편집"]').first();
    await expect(editButton).toBeVisible({ timeout: 3000 });
    console.log('✏️ 편집 버튼 확인됨');

    console.log('✅ 미니룸 간단 확인 완료');
  });
});
