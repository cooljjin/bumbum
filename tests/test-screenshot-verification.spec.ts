import { test, expect } from '@playwright/test';

test.describe('스크린샷 복구 상태 확인', () => {
  test('메인 페이지 스크린샷', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // 스크린샷 촬영
    await page.screenshot({ 
      path: 'test-results/main-page-recovery.png',
      fullPage: true 
    });
    
    // 기본 요소들이 있는지 확인
    await expect(page.locator('h1:has-text("나만의 미니룸")')).toBeVisible();
    await expect(page.locator('button:has-text("룸 편집")')).toBeVisible();
  });

  test('룸 에디터 페이지 스크린샷', async ({ page }) => {
    await page.goto('http://localhost:3001/room-editor');
    
    // 로딩 완료 대기
    await page.waitForTimeout(3000);
    
    // 스크린샷 촬영
    await page.screenshot({ 
      path: 'test-results/room-editor-recovery.png',
      fullPage: true 
    });
    
    // 기본 요소들이 있는지 확인
    await expect(page.locator('text=🏠 미니룸 에디터')).toBeVisible();
    await expect(page.locator('text=✏️ 편집 모드')).toBeVisible();
  });

  test('편집 도구바 스크린샷', async ({ page }) => {
    await page.goto('http://localhost:3001/room-editor');
    await page.waitForTimeout(3000);
    
    // 편집 도구바 영역 스크린샷
    const toolbar = page.locator('.absolute.top-6');
    await expect(toolbar).toBeVisible();
    
    await toolbar.screenshot({ 
      path: 'test-results/edit-toolbar-recovery.png'
    });
  });

  test('가구 라이브러리 열기 시도', async ({ page }) => {
    await page.goto('http://localhost:3001/room-editor');
    await page.waitForTimeout(3000);
    
    // 가구 라이브러리 버튼 클릭
    const furnitureButton = page.locator('button:has-text("🪑")');
    await expect(furnitureButton).toBeVisible();
    await furnitureButton.click();
    
    // 잠시 대기
    await page.waitForTimeout(1000);
    
    // 전체 페이지 스크린샷
    await page.screenshot({ 
      path: 'test-results/furniture-library-attempt.png',
      fullPage: true 
    });
  });

  test('편집 모드 전환 스크린샷', async ({ page }) => {
    await page.goto('http://localhost:3001/room-editor');
    await page.waitForTimeout(3000);
    
    // 편집 모드에서 뷰 모드로 전환
    const viewModeButton = page.locator('button:has-text("👁️ 뷰 모드")');
    await expect(viewModeButton).toBeVisible();
    await viewModeButton.click();
    
    await page.waitForTimeout(1000);
    
    // 뷰 모드 스크린샷
    await page.screenshot({ 
      path: 'test-results/view-mode-recovery.png',
      fullPage: true 
    });
  });
});
