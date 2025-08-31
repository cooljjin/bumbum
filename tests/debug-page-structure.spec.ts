import { test, expect } from '@playwright/test';

test('페이지 구조 디버깅', async ({ page }) => {
  // 메인 페이지로 이동
  await page.goto('http://localhost:3005');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 페이지 전체 스크린샷
  await page.screenshot({ 
    path: 'debug-page-structure.png',
    fullPage: true 
  });
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log('페이지 제목:', title);
  
  // 모든 버튼 텍스트 출력
  const buttons = await page.locator('button').allTextContents();
  console.log('발견된 버튼들:', buttons);
  
  // 모든 h1, h2, h3 태그 텍스트 출력
  const headings = await page.locator('h1, h2, h3').allTextContents();
  console.log('발견된 제목들:', headings);
  
  // canvas 요소 확인
  const canvasCount = await page.locator('canvas').count();
  console.log('Canvas 요소 개수:', canvasCount);
  
  // 편집 모드 관련 요소들 확인
  const editModeElements = await page.locator('[class*="edit"], [class*="Edit"]').count();
  console.log('편집 모드 관련 요소 개수:', editModeElements);
  
  // 가구 라이브러리 관련 요소들 확인
  const libraryElements = await page.locator('[class*="library"], [class*="Library"], [class*="catalog"], [class*="Catalog"]').count();
  console.log('가구 라이브러리 관련 요소 개수:', libraryElements);
});
