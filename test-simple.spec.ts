import { test, expect } from '@playwright/test';

test('페이지 로딩 및 기본 요소 확인', async ({ page }) => {
  // 페이지 접속
  await page.goto('http://localhost:3000');
  
  // 페이지 제목 확인
  await expect(page).toHaveTitle(/Bondidi/);
  
  // 페이지 로딩 대기
  await page.waitForLoadState('domcontentloaded');
  
  // 스크린샷 촬영
  await page.screenshot({ path: 'page-loaded.png', fullPage: true });
  
  // 시점 전환 버튼 찾기 시도
  try {
    const viewToggleButton = page.locator('button');
    const buttonCount = await viewToggleButton.count();
    console.log(`페이지에서 찾은 버튼 개수: ${buttonCount}`);
    
    if (buttonCount > 0) {
      const firstButton = viewToggleButton.first();
      const buttonText = await firstButton.textContent();
      console.log(`첫 번째 버튼 텍스트: ${buttonText}`);
      
      // 버튼이 보이는지 확인
      await expect(firstButton).toBeVisible();
      
      // 버튼 클릭 시도
      await firstButton.click();
      
      // 클릭 후 상태 확인
      await page.waitForTimeout(1000);
      const afterClickText = await firstButton.textContent();
      console.log(`클릭 후 버튼 텍스트: ${afterClickText}`);
      
      // 클릭 후 스크린샷
      await page.screenshot({ path: 'after-click.png', fullPage: true });
    }
  } catch (error) {
    console.error('버튼 찾기/클릭 중 오류:', error);
  }
  
  // 페이지 전체 HTML 확인
  const pageContent = await page.content();
  console.log('페이지 HTML 길이:', pageContent.length);
  
  // 시점 전환 관련 텍스트가 있는지 확인
  if (pageContent.includes('시점')) {
    console.log('✅ 시점 관련 텍스트 발견');
  } else {
    console.log('❌ 시점 관련 텍스트 없음');
  }
  
  if (pageContent.includes('전환 중')) {
    console.log('✅ "전환 중" 텍스트 발견');
  } else {
    console.log('❌ "전환 중" 텍스트 없음');
  }
});
