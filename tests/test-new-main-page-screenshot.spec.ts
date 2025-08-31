import { test, expect } from '@playwright/test';

test.describe('새로운 메인페이지 스크린샷 테스트', () => {
  test('메인페이지 전체 스크린샷', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // 3D 룸 로딩 대기
    await page.waitForTimeout(3000);
    
    // 전체 페이지 스크린샷
    await page.screenshot({ 
      path: 'test-results/new-main-page-full.png',
      fullPage: true 
    });
  });

  test('헤더 영역 스크린샷', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    
    // 헤더 영역 스크린샷
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    await header.screenshot({ 
      path: 'test-results/new-main-page-header.png'
    });
  });

  test('3D 미니룸 영역 스크린샷', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    
    // 3D 미니룸 영역 스크린샷
    const roomSection = page.locator('.h-\\[70vh\\]');
    await expect(roomSection).toBeVisible();
    
    await roomSection.screenshot({ 
      path: 'test-results/new-main-page-3d-room.png'
    });
  });

  test('편집 모드 활성화 스크린샷', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    
    // 편집 모드 버튼 클릭
    await page.click('button:has-text("✏️ 편집 모드")');
    await page.waitForTimeout(1000);
    
    // 편집 모드 상태 스크린샷
    await page.screenshot({ 
      path: 'test-results/new-main-page-edit-mode.png',
      fullPage: true 
    });
  });

  test('시점 고정 활성화 스크린샷', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    
    // 시점 고정 버튼 클릭
    await page.click('button:has-text("🔒 시점 고정")');
    await page.waitForTimeout(1000);
    
    // 시점 고정 상태 스크린샷
    await page.screenshot({ 
      path: 'test-results/new-main-page-view-locked.png',
      fullPage: true 
    });
  });

  test('기능 소개 섹션 스크린샷', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    
    // 기능 소개 섹션으로 스크롤
    const featuresSection = page.locator('h2:has-text("주요 기능")');
    await featuresSection.scrollIntoViewIfNeeded();
    
    await page.waitForTimeout(1000);
    
    // 기능 소개 섹션 스크린샷
    await page.screenshot({ 
      path: 'test-results/new-main-page-features.png',
      fullPage: true 
    });
  });
});
