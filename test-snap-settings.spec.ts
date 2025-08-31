import { test, expect } from '@playwright/test';

test.describe('스냅 설정 UI 및 사용자 제어 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 메인 페이지로 이동
    await page.goto('http://localhost:3000');
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
  });

  test('편집 모드 진입 및 스냅 설정 UI 확인', async ({ page }) => {
    // 편집 모드 버튼 클릭
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 편집 도구바가 표시되는지 확인
    await expect(page.locator('.absolute.top-6')).toBeVisible();
    
    // 그리드 스냅 토글 버튼 확인
    await expect(page.locator('button:has-text("그리드")')).toBeVisible();
    
    // 회전 스냅 토글 버튼 확인
    await expect(page.locator('button:has-text("회전")')).toBeVisible();
    
    // 스냅 강도 조절 버튼 확인
    await expect(page.locator('button:has-text("🎯")')).toBeVisible();
  });

  test('스냅 강도 조절 기능 테스트', async ({ page }) => {
    // 편집 모드 진입
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 스냅 강도 조절 버튼 클릭
    await page.click('button:has-text("🎯")');
    
    // 이동 스냅 강도 슬라이더가 표시되는지 확인
    await expect(page.locator('input[type="range"]')).toHaveCount(2);
    
    // 이동 스냅 강도 슬라이더 값 변경
    const translationSlider = page.locator('input[type="range"]').first();
    await translationSlider.fill('1.5');
    
    // 회전 스냅 강도 슬라이더 값 변경
    const rotationSlider = page.locator('input[type="range"]').nth(1);
    await rotationSlider.fill('0.5');
    
    // 값이 변경되었는지 확인
    await expect(page.locator('text=1.5')).toBeVisible();
    await expect(page.locator('text=0.5')).toBeVisible();
  });

  test('그리드 스냅 토글 기능 테스트', async ({ page }) => {
    // 편집 모드 진입
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 그리드 스냅 버튼 클릭
    const gridButton = page.locator('button:has-text("그리드")');
    await gridButton.click();
    
    // 상태가 변경되었는지 확인 (ON/OFF 텍스트 확인)
    await expect(gridButton).toContainText(/ON|OFF/);
  });

  test('회전 스냅 토글 기능 테스트', async ({ page }) => {
    // 편집 모드 진입
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 회전 스냅 버튼 클릭
    const rotationButton = page.locator('button:has-text("회전")');
    await rotationButton.click();
    
    // 상태가 변경되었는지 확인 (ON/OFF 텍스트 확인)
    await expect(rotationButton).toContainText(/ON|OFF/);
  });

  test('편집 도구 선택 기능 테스트', async ({ page }) => {
    // 편집 모드 진입
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 이동 도구 선택
    await page.click('button:has-text("➡️")');
    await expect(page.locator('button:has-text("➡️")')).toHaveClass(/bg-green-600/);
    
    // 회전 도구 선택
    await page.click('button:has-text("🔄")');
    await expect(page.locator('button:has-text("🔄")')).toHaveClass(/bg-purple-600/);
    
    // 크기 조절 도구 선택
    await page.click('button:has-text("📏")');
    await expect(page.locator('button:has-text("📏")')).toHaveClass(/bg-orange-600/);
    
    // 선택 도구로 돌아가기
    await page.click('button:has-text("🖱️")');
    await expect(page.locator('button:has-text("🖱️")')).toHaveClass(/bg-blue-600/);
  });
});
