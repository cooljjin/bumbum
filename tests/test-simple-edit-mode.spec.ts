import { test, expect } from '@playwright/test';

test.describe('간단한 룸 편집 모드 테스트', () => {
  test('기본 편집 모드 기능 확인', async ({ page }) => {
    // 메인 페이지로 이동
    await page.goto('http://localhost:3000');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 3D 룸이 로드될 때까지 대기
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 룸 편집 버튼이 보이는지 확인
    const editButton = page.locator('button:has-text("룸 편집")');
    await expect(editButton).toBeVisible();
    
    // 편집 모드 진입
    await editButton.click();
    
    // 편집 모드로 변경되었는지 확인
    await expect(page.locator('button:has-text("편집 종료")')).toBeVisible();
    
    // 가구 라이브러리가 표시되는지 확인
    await expect(page.locator('text=룸 편집 모드')).toBeVisible();
    
    // 카테고리 탭들이 표시되는지 확인
    await expect(page.locator('text=전체')).toBeVisible();
    await expect(page.locator('text=가구')).toBeVisible();
    
    // 편집 모드 종료
    await page.click('button:has-text("편집 종료")');
    
    // 편집 모드가 종료되었는지 확인
    await expect(page.locator('button:has-text("룸 편집")')).toBeVisible();
  });
});
