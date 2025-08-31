import { test, expect } from '@playwright/test';

test('EditToolbar 존재 여부 확인 테스트', async ({ page }) => {
  // 페이지 로드
  await page.goto('http://localhost:3000');
  
  // 페이지가 로드될 때까지 대기
  await page.waitForLoadState('networkidle');
  
  // 편집 모드 진입
  await page.click('button:has-text("✏️ 편집 모드")');
  
  // 상태 변경 대기
  await page.waitForTimeout(3000);
  
  // 페이지의 HTML 구조 확인
  const pageContent = await page.content();
  console.log('페이지에 "EditToolbar" 텍스트가 포함되어 있는지 확인:', pageContent.includes('EditToolbar'));
  console.log('페이지에 "자동고정" 텍스트가 포함되어 있는지 확인:', pageContent.includes('자동고정'));
  console.log('페이지에 "가구" 텍스트가 포함되어 있는지 확인:', pageContent.includes('가구'));
  
  // 모든 div 요소의 클래스명 확인
  const divs = await page.locator('div').all();
  console.log(`총 ${divs.length}개의 div 요소가 있습니다.`);
  
  // EditToolbar 관련 클래스나 ID를 가진 요소 찾기
  const editToolbarElements = await page.locator('[class*="toolbar"], [class*="Toolbar"], [id*="toolbar"], [id*="Toolbar"]').all();
  console.log(`EditToolbar 관련 요소 개수: ${editToolbarElements.length}`);
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/edit-toolbar-existence.png' });
  
  // 페이지의 전체 구조를 로그로 출력
  console.log('페이지 구조 분석 완료');
});
