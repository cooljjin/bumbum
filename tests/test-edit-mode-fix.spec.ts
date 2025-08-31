import { test, expect } from '@playwright/test';

test('수정된 편집 모드 기능 테스트', async ({ page }) => {
  // 메인 페이지로 이동
  await page.goto('http://localhost:3005');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 초기 상태 확인
  await expect(page.locator('button:has-text("✏️룸 편집")')).toBeVisible();
  
  // 편집 모드 버튼 클릭
  await page.click('button:has-text("✏️룸 편집")');
  
  // 잠시 대기
  await page.waitForTimeout(2000);
  
  // 편집 모드가 활성화되었는지 확인
  await expect(page.locator('button:has-text("편집 종료")')).toBeVisible();
  
  // 편집 도구바가 표시되는지 확인 (텍스트 기반 선택자 사용)
  await expect(page.locator('button:has-text("선택")')).toBeVisible();
  
  // 편집 모드 종료
  await page.click('button:has-text("편집 종료")');
  
  // 편집 모드가 종료되었는지 확인
  await expect(page.locator('button:has-text("✏️룸 편집")')).toBeVisible();
});
