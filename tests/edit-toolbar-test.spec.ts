import { test, expect } from '@playwright/test';

test('EditToolbar 렌더링 테스트', async ({ page }) => {
  // 페이지 로드
  await page.goto('http://localhost:3000');
  
  // 페이지가 로드될 때까지 대기
  await page.waitForLoadState('networkidle');
  
  // 편집 모드 진입
  await page.click('button:has-text("✏️ 편집 모드")');
  
  // EditToolbar가 로드될 때까지 대기
  await page.waitForTimeout(3000);
  
  // EditToolbar의 요소들이 보이는지 확인
  const selectButton = page.locator('button:has-text("선택")');
  const moveButton = page.locator('button:has-text("이동")');
  const rotateButton = page.locator('button:has-text("회전")');
  const scaleButton = page.locator('button:has-text("크기")');
  
  console.log('선택 버튼 개수:', await selectButton.count());
  console.log('이동 버튼 개수:', await moveButton.count());
  console.log('회전 버튼 개수:', await rotateButton.count());
  console.log('크기 버튼 개수:', await scaleButton.count());
  
  // 가구 버튼 찾기
  const furnitureButton = page.locator('button:has-text("가구")');
  console.log('가구 버튼 개수:', await furnitureButton.count());
  
  // 자동고정 버튼 찾기
  const autoLockButton = page.locator('button:has-text("자동고정")');
  console.log('자동고정 버튼 개수:', await autoLockButton.count());
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/edit-toolbar-test.png' });
  
  // EditToolbar가 제대로 렌더링되었는지 확인
  if (await selectButton.count() > 0) {
    console.log('✅ EditToolbar가 정상적으로 렌더링되었습니다.');
  } else {
    console.log('❌ EditToolbar가 렌더링되지 않았습니다.');
  }
});
