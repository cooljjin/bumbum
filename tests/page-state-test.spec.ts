import { test, expect } from '@playwright/test';

test('페이지 상태 확인 테스트', async ({ page }) => {
  // 페이지 로드
  await page.goto('http://localhost:3000');
  
  // 페이지가 로드될 때까지 대기
  await page.waitForLoadState('networkidle');
  
  // 초기 상태 확인
  let editModeStatus = page.locator('span:has-text("👁️ 뷰 모드")');
  let editModeButton = page.locator('button:has-text("✏️ 편집 모드")');
  
  console.log('초기 상태 - 편집 모드:', await editModeStatus.count() > 0 ? '뷰 모드' : '편집 모드');
  console.log('편집 모드 버튼:', await editModeButton.count() > 0 ? '보임' : '안보임');
  
  // 편집 모드 진입
  await editModeButton.click();
  
  // 상태 변경 대기
  await page.waitForTimeout(2000);
  
  // 편집 모드 상태 확인
  editModeStatus = page.locator('span:has-text("✏️ 편집 모드")');
  editModeButton = page.locator('button:has-text("👁️ 뷰 모드")');
  
  console.log('편집 모드 진입 후 - 편집 모드:', await editModeStatus.count() > 0 ? '편집 모드' : '뷰 모드');
  console.log('뷰 모드 버튼:', await editModeButton.count() > 0 ? '보임' : '안보임');
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/page-state-test.png' });
  
  // 편집 모드가 활성화되었는지 확인
  if (await editModeStatus.count() > 0) {
    console.log('✅ 편집 모드가 정상적으로 활성화되었습니다.');
  } else {
    console.log('❌ 편집 모드가 활성화되지 않았습니다.');
  }
});
