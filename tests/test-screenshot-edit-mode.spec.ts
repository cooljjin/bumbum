import { test, expect } from '@playwright/test';

test.describe('룸 편집 모드 스크린샷 테스트', () => {
  test('편집 모드 UI 스크린샷', async ({ page }) => {
    // 메인 페이지로 이동
    await page.goto('http://localhost:3000');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 3D 룸이 로드될 때까지 대기
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 초기 상태 스크린샷
    await page.screenshot({ 
      path: 'test-results/initial-state.png',
      fullPage: true 
    });
    
    // 룸 편집 버튼 클릭
    await page.click('button:has-text("룸 편집")');
    
    // 편집 모드 UI가 로드될 때까지 대기
    await page.waitForSelector('text=룸 편집 모드', { timeout: 10000 });
    
    // 편집 모드 상태 스크린샷
    await page.screenshot({ 
      path: 'test-results/edit-mode-active.png',
      fullPage: true 
    });
    
    // 가구 라이브러리 부분만 스크린샷
    const furnitureLibrary = page.locator('text=룸 편집 모드').first();
    await furnitureLibrary.screenshot({ 
      path: 'test-results/furniture-library.png' 
    });
    
    // 카테고리 탭들 스크린샷
    const categoryTabs = page.locator('text=전체').first();
    await categoryTabs.screenshot({ 
      path: 'test-results/category-tabs.png' 
    });
    
    // 편집 모드 종료
    await page.click('button:has-text("편집 종료")');
    
    // 종료 후 상태 스크린샷
    await page.screenshot({ 
      path: 'test-results/edit-mode-closed.png',
      fullPage: true 
    });
  });
});
