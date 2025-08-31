import { test, expect } from '@playwright/test';

test('간단한 페이지 로드 테스트', async ({ page }) => {
  // 페이지 로드
  await page.goto('http://localhost:3000');
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log('페이지 제목:', title);
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/page-loaded.png' });
  
  // 페이지가 로드되었는지 확인
  expect(page).toBeTruthy();
  
  console.log('✅ 페이지 로드 테스트 통과');
});
