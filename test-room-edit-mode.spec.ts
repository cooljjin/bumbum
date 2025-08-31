import { test, expect } from '@playwright/test';

test.describe('룸 편집 모드 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 메인 페이지로 이동
    await page.goto('http://localhost:3000');
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
  });

  test('룸 편집 모드 진입 및 가구 라이브러리 표시', async ({ page }) => {
    // 3D 룸이 로드될 때까지 대기
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 룸 편집 버튼 찾기 및 클릭
    const editButton = page.locator('button:has-text("룸 편집")');
    await expect(editButton).toBeVisible();
    await editButton.click();
    
    // 편집 모드로 변경되었는지 확인
    await expect(page.locator('button:has-text("편집 종료")')).toBeVisible();
    
    // 가구 라이브러리가 하단에 표시되는지 확인
    const furnitureLibrary = page.locator('text=룸 편집 모드');
    await expect(furnitureLibrary).toBeVisible();
    
    // 카테고리 탭들이 표시되는지 확인
    await expect(page.locator('text=전체')).toBeVisible();
    await expect(page.locator('text=가구')).toBeVisible();
    await expect(page.locator('text=장식품')).toBeVisible();
    await expect(page.locator('text=벽걸이 아이템')).toBeVisible();
  });

  test('가구 선택 및 정보 표시', async ({ page }) => {
    // 편집 모드 진입
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.click('button:has-text("룸 편집")');
    
    // 가구 아이템 클릭 (의자)
    const chairItem = page.locator('text=의자').first();
    await expect(chairItem).toBeVisible();
    await chairItem.click();
    
    // 선택된 가구 정보가 우측 상단에 표시되는지 확인
    const selectedFurniture = page.locator('text=의자');
    await expect(selectedFurniture).toBeVisible();
    
    // 가구 카테고리 정보도 표시되는지 확인
    await expect(page.locator('text=가구')).toBeVisible();
  });

  test('카테고리별 가구 필터링', async ({ page }) => {
    // 편집 모드 진입
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.click('button:has-text("룸 편집")');
    
    // 가구 카테고리 클릭
    await page.click('text=가구');
    
    // 가구 카테고리만 표시되는지 확인
    await expect(page.locator('text=의자')).toBeVisible();
    await expect(page.locator('text=테이블')).toBeVisible();
    await expect(page.locator('text=소파')).toBeVisible();
    
    // 장식품 카테고리 클릭
    await page.click('text=장식품');
    
    // 장식품만 표시되는지 확인
    await expect(page.locator('text=화분')).toBeVisible();
    await expect(page.locator('text=램프')).toBeVisible();
    await expect(page.locator('text=커튼')).toBeVisible();
  });

  test('편집 모드 종료', async ({ page }) => {
    // 편집 모드 진입
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.click('button:has-text("룸 편집")');
    
    // 완료 버튼으로 편집 모드 종료
    await page.click('button:has-text("완료")');
    
    // 편집 모드가 종료되었는지 확인
    await expect(page.locator('button:has-text("룸 편집")')).toBeVisible();
    await expect(page.locator('text=룸 편집 모드')).not.toBeVisible();
  });

  test('편집 종료 버튼으로 모드 종료', async ({ page }) => {
    // 편집 모드 진입
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.click('button:has-text("룸 편집")');
    
    // 편집 종료 버튼으로 편집 모드 종료
    await page.click('button:has-text("편집 종료")');
    
    // 편집 모드가 종료되었는지 확인
    await expect(page.locator('button:has-text("룸 편집")')).toBeVisible();
    await expect(page.locator('text=룸 편집 모드')).not.toBeVisible();
  });

  test('3D 룸 기본 기능 유지', async ({ page }) => {
    // 3D 룸이 정상적으로 렌더링되는지 확인
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // 시점 고정 버튼이 작동하는지 확인
    const viewLockButton = page.locator('button:has-text("시점 고정")');
    await expect(viewLockButton).toBeVisible();
    await viewLockButton.click();
    
    // 시점 고정 해제 버튼으로 변경되었는지 확인
    await expect(page.locator('button:has-text("시점 고정 해제")')).toBeVisible();
  });
});
