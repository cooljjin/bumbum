import { test, expect } from '@playwright/test';

test.describe('복구 상태 확인 테스트', () => {
  test('메인 페이지 로드 확인', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // 페이지 제목 확인
    await expect(page.locator('h1:has-text("나만의 미니룸")')).toBeVisible();
    
    // 룸 편집 버튼 확인
    await expect(page.locator('button:has-text("룸 편집")')).toBeVisible();
    
    // CardNav 메뉴 확인
    await expect(page.locator('text=React Bits')).toBeVisible();
  });

  test('룸 에디터 페이지 로드 확인', async ({ page }) => {
    await page.goto('http://localhost:3001/room-editor');
    
    // 로딩 화면 확인
    await expect(page.locator('text=미니룸 에디터')).toBeVisible();
    await expect(page.locator('text=3D 룸을 준비하고 있습니다...')).toBeVisible();
    
    // 로딩 완료 후 헤더 확인
    await page.waitForTimeout(3000);
    await expect(page.locator('text=🏠 미니룸 에디터')).toBeVisible();
    
    // 편집 모드 상태 확인
    await expect(page.locator('text=✏️ 편집 모드')).toBeVisible();
  });

  test('룸 에디터에서 편집 도구바 확인', async ({ page }) => {
    await page.goto('http://localhost:3001/room-editor');
    
    // 로딩 완료 대기
    await page.waitForTimeout(3000);
    
    // 편집 도구바의 주요 버튼들 확인 (더 구체적인 선택자 사용)
    await expect(page.locator('button:has-text("🖱️")')).toBeVisible();
    await expect(page.locator('button:has-text("➡️")')).toBeVisible();
    await expect(page.locator('button:has-text("🔄")')).toBeVisible();
    await expect(page.locator('button:has-text("📏")')).toBeVisible();
    
    // 가구 라이브러리 버튼 확인
    await expect(page.locator('button:has-text("🪑")')).toBeVisible();
  });

  test('가구 라이브러리 열기 확인', async ({ page }) => {
    await page.goto('http://localhost:3001/room-editor');
    
    // 로딩 완료 대기
    await page.waitForTimeout(3000);
    
    // 가구 라이브러리 버튼 클릭
    await page.click('button:has-text("🪑")');
    
    // 가구 라이브러리 사이드바 확인
    await expect(page.locator('h3:has-text("🪑 가구 라이브러리")')).toBeVisible();
    await expect(page.locator('text=편집할 가구를 선택하세요')).toBeVisible();
    
    // 카테고리 탭들 확인
    await expect(page.locator('text=거실')).toBeVisible();
    await expect(page.locator('text=침실')).toBeVisible();
    await expect(page.locator('text=주방')).toBeVisible();
  });

  test('가구 카탈로그 내용 확인', async ({ page }) => {
    await page.goto('http://localhost:3001/room-editor');
    
    // 로딩 완료 대기
    await page.waitForTimeout(3000);
    
    // 가구 라이브러리 버튼 클릭
    await page.click('button:has-text("🪑")');
    
    // 가구 아이템들이 표시되는지 확인
    await expect(page.locator('text=간단한 2인용 소파')).toBeVisible();
    await expect(page.locator('text=간단한 3인용 소파')).toBeVisible();
    await expect(page.locator('text=TV 스탠드')).toBeVisible();
  });

  test('편집 모드 전환 확인', async ({ page }) => {
    await page.goto('http://localhost:3001/room-editor');
    
    // 로딩 완료 대기
    await page.waitForTimeout(3000);
    
    // 편집 모드에서 뷰 모드로 전환
    await page.click('button:has-text("👁️ 뷰 모드")');
    
    // 뷰 모드 상태 확인
    await expect(page.locator('text=👁️ 뷰 모드')).toBeVisible();
    
    // 다시 편집 모드로 전환
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 편집 모드 상태 확인
    await expect(page.locator('text=✏️ 편집 모드')).toBeVisible();
  });
});
