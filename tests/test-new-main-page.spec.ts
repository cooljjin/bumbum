import { test, expect } from '@playwright/test';

test.describe('새로운 메인페이지 테스트', () => {
  test('메인페이지 로드 확인', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // 페이지 제목 확인
    await expect(page.locator('h1:has-text("🏠 나만의 미니룸")')).toBeVisible();
    
    // 편집 모드 버튼 확인
    await expect(page.locator('button:has-text("✏️ 편집 모드")')).toBeVisible();
    
    // 시점 고정 버튼 확인
    await expect(page.locator('button:has-text("🔒 시점 고정")')).toBeVisible();
  });

  test('3D 미니룸 렌더링 확인', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // 3D 룸이 로드될 때까지 대기
    await page.waitForTimeout(3000);
    
    // 3D 룸 컨테이너 확인
    await expect(page.locator('.h-\\[70vh\\]')).toBeVisible();
    
    // 로딩 완료 후 상태 확인
    await expect(page.locator('text=👁️ 뷰 모드')).toBeVisible();
  });

  test('편집 모드 전환 확인', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    
    // 편집 모드 버튼 클릭
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 편집 모드 상태 확인
    await expect(page.locator('text=✏️ 편집 모드')).toBeVisible();
    
    // 다시 뷰 모드로 전환
    await page.click('button:has-text("👁️ 뷰 모드")');
    
    // 뷰 모드 상태 확인
    await expect(page.locator('text=👁️ 뷰 모드')).toBeVisible();
  });

  test('시점 고정 기능 확인', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    
    // 시점 고정 버튼 클릭
    await page.click('button:has-text("🔒 시점 고정")');
    
    // 시점 고정 상태 확인
    await expect(page.locator('text=🔒 시점 고정')).toBeVisible();
    
    // 시점 해제 버튼 클릭
    await page.click('button:has-text("🔓 시점 해제")');
    
    // 시점 자유 상태 확인
    await expect(page.locator('text=🔓 시점 자유')).toBeVisible();
  });

  test('기능 소개 섹션 확인', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // 주요 기능 섹션 확인
    await expect(page.locator('h2:has-text("주요 기능")')).toBeVisible();
    
    // 3D 미니룸 카드 확인
    await expect(page.locator('text=3D 미니룸')).toBeVisible();
    
    // 테마 시스템 카드 확인
    await expect(page.locator('text=테마 시스템')).toBeVisible();
    
    // 고성능 카드 확인
    await expect(page.locator('text=고성능')).toBeVisible();
  });

  test('편집 도구 섹션 확인', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // 편집 도구 섹션 확인
    await expect(page.locator('h2:has-text("편집 도구")')).toBeVisible();
    
    // 직관적인 편집 카드 확인
    await expect(page.locator('text=직관적인 편집')).toBeVisible();
    
    // 실시간 미리보기 카드 확인
    await expect(page.locator('text=실시간 미리보기')).toBeVisible();
  });

  test('푸터 확인', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // 푸터 섹션들 확인
    await expect(page.locator('text=지원')).toBeVisible();
    await expect(page.locator('text=연결')).toBeVisible();
    await expect(page.locator('text=기술')).toBeVisible();
    
    // 저작권 정보 확인
    await expect(page.locator('text=© 2024 미니룸 프로젝트')).toBeVisible();
  });
});
