import { test, expect } from '@playwright/test';

test('간단한 통합 테스트 - 현재 작동하는 기능만', async ({ page }) => {
  // 메인 페이지로 이동
  await page.goto('http://localhost:3005');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 페이지 제목 확인
  await expect(page.locator('text="🏠 나만의 미니룸"')).toBeVisible();
  
  // 편집 모드 버튼 확인
  await expect(page.locator('button:has-text("✏️ 편집 모드")')).toBeVisible();
  
  // 시점 고정 버튼 확인
  await expect(page.locator('button:has-text("🔒 시점 고정")')).toBeVisible();
  
  // 편집 모드 버튼 클릭
  await page.click('button:has-text("✏️ 편집 모드")');
  
  // 편집 모드가 활성화되었는지 확인 (버튼 텍스트 변경)
  await expect(page.locator('button:has-text("👁️ 뷰 모드")')).toBeVisible();
  
  // 편집 모드 종료
  await page.click('button:has-text("👁️ 뷰 모드")');
  
  // 편집 모드가 종료되었는지 확인
  await expect(page.locator('button:has-text("✏️ 편집 모드")')).toBeVisible();
  
  // 시점 고정 버튼 클릭
  await page.click('button:has-text("🔒 시점 고정")');
  
  // 시점 고정이 활성화되었는지 확인
  await expect(page.locator('button:has-text("🔓 시점 해제")')).toBeVisible();
  
  // 시점 고정 해제
  await page.click('button:has-text("🔓 시점 해제")');
  
  // 시점 고정이 해제되었는지 확인
  await expect(page.locator('button:has-text("🔒 시점 고정")')).toBeVisible();
});

test('반응형 디자인 테스트', async ({ page }) => {
  // 메인 페이지로 이동
  await page.goto('http://localhost:3005');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 모바일 뷰포트 설정
  await page.setViewportSize({ width: 375, height: 667 });
  
  // 모바일에서도 기본 UI가 표시되는지 확인
  await expect(page.locator('text="🏠 나만의 미니룸"')).toBeVisible();
  
  // 편집 모드 버튼이 모바일에서도 표시되는지 확인
  await expect(page.locator('button:has-text("✏️ 편집 모드")')).toBeVisible();
  
  // 데스크톱 뷰포트로 복원
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // 데스크톱에서도 UI가 정상적으로 표시되는지 확인
  await expect(page.locator('text="🏠 나만의 미니룸"')).toBeVisible();
});

test('기본 기능 동작 확인', async ({ page }) => {
  // 메인 페이지로 이동
  await page.goto('http://localhost:3005');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 주요 기능 섹션이 표시되는지 확인
  await expect(page.locator('text="주요 기능"')).toBeVisible();
  
  // 3D 미니룸 기능 설명 확인
  await expect(page.locator('text="3D 미니룸"')).toBeVisible();
  
  // 테마 시스템 기능 설명 확인
  await expect(page.locator('text="테마 시스템"')).toBeVisible();
  
  // 고성능 기능 설명 확인
  await expect(page.locator('text="고성능"')).toBeVisible();
  
  // 편집 도구 섹션이 표시되는지 확인
  await expect(page.locator('text="편집 도구"')).toBeVisible();
});
