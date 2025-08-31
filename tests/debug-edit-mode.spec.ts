import { test, expect } from '@playwright/test';

test('편집 모드 동작 디버깅', async ({ page }) => {
  // 메인 페이지로 이동
  await page.goto('http://localhost:3005');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 초기 상태 스크린샷
  await page.screenshot({ 
    path: 'debug-edit-mode-before.png',
    fullPage: true 
  });
  
  // 편집 모드 버튼 찾기
  const editButtons = await page.locator('button').allTextContents();
  console.log('발견된 버튼들:', editButtons);
  
  // ✏️룸 편집 버튼 클릭
  await page.click('button:has-text("✏️룸 편집")');
  
  // 잠시 대기
  await page.waitForTimeout(2000);
  
  // 클릭 후 상태 스크린샷
  await page.screenshot({ 
    path: 'debug-edit-mode-after.png',
    fullPage: true 
  });
  
  // 클릭 후 모든 버튼 텍스트 다시 확인
  const buttonsAfterClick = await page.locator('button').allTextContents();
  console.log('클릭 후 버튼들:', buttonsAfterClick);
  
  // 편집 모드 관련 요소들 확인
  const editModeElements = await page.locator('[class*="edit"], [class*="Edit"], [class*="toolbar"], [class*="Toolbar"]').count();
  console.log('편집 모드 관련 요소 개수:', editModeElements);
  
  // 편집 모드 관련 요소들의 클래스명 출력
  const editModeClasses = await page.locator('[class*="edit"], [class*="Edit"], [class*="toolbar"], [class*="Toolbar"]').evaluateAll(elements => 
    elements.map(el => el.className)
  );
  console.log('편집 모드 관련 요소 클래스들:', editModeClasses);
  
  // 페이지 HTML 구조 일부 출력
  const pageContent = await page.content();
  console.log('페이지 HTML 길이:', pageContent.length);
  
  // 편집 모드 관련 텍스트가 있는지 확인
  const hasEditModeText = pageContent.includes('편집 종료') || pageContent.includes('Edit') || pageContent.includes('편집');
  console.log('편집 모드 관련 텍스트 존재:', hasEditModeText);
});
