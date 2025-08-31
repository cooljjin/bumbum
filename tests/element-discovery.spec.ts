import { test, expect } from '@playwright/test';

test('페이지 요소 검색 테스트', async ({ page }) => {
  // 페이지 로드
  await page.goto('http://localhost:3000');
  
  // 페이지가 로드될 때까지 대기
  await page.waitForLoadState('networkidle');
  
  // 모든 버튼 요소 찾기
  const buttons = await page.locator('button').all();
  console.log(`총 ${buttons.length}개의 버튼을 찾았습니다:`);
  
  for (let i = 0; i < buttons.length; i++) {
    try {
      const text = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      console.log(`버튼 ${i + 1}: "${text?.trim()}" (보임: ${isVisible})`);
    } catch (e) {
      console.log(`버튼 ${i + 1}: 텍스트 읽기 실패`);
    }
  }
  
  // 편집 모드 버튼 찾기
  const editButton = page.locator('button:has-text("편집")');
  const editButtonCount = await editButton.count();
  console.log(`편집 버튼 개수: ${editButtonCount}`);
  
  if (editButtonCount > 0) {
    console.log('편집 버튼을 찾았습니다!');
    await editButton.first().click();
    
    // 편집 모드 진입 후 잠시 대기
    await page.waitForTimeout(2000);
    
    // 편집 모드에서 사용 가능한 버튼들 확인
    const editModeButtons = await page.locator('button').all();
    console.log(`편집 모드에서 ${editModeButtons.length}개의 버튼을 찾았습니다:`);
    
    for (let i = 0; i < editModeButtons.length; i++) {
      try {
        const text = await editModeButtons[i].textContent();
        const isVisible = await editModeButtons[i].isVisible();
        console.log(`편집 모드 버튼 ${i + 1}: "${text?.trim()}" (보임: ${isVisible})`);
      } catch (e) {
        console.log(`편집 모드 버튼 ${i + 1}: 텍스트 읽기 실패`);
      }
    }
  } else {
    console.log('편집 버튼을 찾을 수 없습니다.');
  }
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/element-discovery.png' });
  
  console.log('✅ 요소 검색 테스트 완료');
});
