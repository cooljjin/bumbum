import { test, expect } from '@playwright/test';

test.describe('룸 편집 모드 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 메인 페이지로 이동
    await page.goto('http://localhost:3001');
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
  });

  test('룸 편집 모드 진입 및 가구 라이브러리 표시', async ({ page }) => {
    // 3D 룸이 로드될 때까지 대기
    await page.waitForSelector('canvas', { timeout: 10000 });

        // 룸 편집 버튼 찾기 및 클릭
    const editButton = page.locator('[data-testid="enter-edit-mode"]');
    await expect(editButton).toBeVisible();
    await editButton.click();

    // 편집 모드로 변경되었는지 확인
    const editEndButton = page.locator('[data-testid="exit-edit-mode"]');
    await expect(editEndButton).toBeVisible();

    // 가구 라이브러리가 우측 사이드바에 표시되는지 확인
    const furnitureLibrary = page.locator('text=가구 라이브러리');
    await expect(furnitureLibrary).toBeVisible();

    // 카테고리 탭들이 표시되는지 확인
    await expect(page.locator('text=전체')).toBeVisible();
    await expect(page.locator('text=거실')).toBeVisible();
    await expect(page.locator('text=수납')).toBeVisible();
  });

  test('가구 선택 및 정보 표시', async ({ page }) => {
    // 편집 모드 진입
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.click('[data-testid="enter-edit-mode"]');

    // 가구 라이브러리가 완전히 로드될 때까지 대기
    await page.waitForSelector('text=가구 라이브러리', { timeout: 10000 });

    // 가구 아이템이 표시될 때까지 대기 (새로 추가한 간단한 2인용 소파)
    await page.waitForSelector('text=간단한 2인용 소파', { timeout: 10000 });

    // 가구 아이템 클릭
    const sofaItem = page.locator('text=간단한 2인용 소파').first();
    await expect(sofaItem).toBeVisible();

    // 요소가 클릭 가능한 상태가 될 때까지 대기
    await sofaItem.waitFor({ state: 'visible', timeout: 10000 });

    // 스크롤하여 요소를 뷰포트 안으로 이동
    await sofaItem.scrollIntoViewIfNeeded();

    // 클릭 실행
    await sofaItem.click();

    // 잠시 대기하여 가구가 배치될 시간을 줌
    await page.waitForTimeout(1000);
  });

  test('카테고리별 가구 필터링', async ({ page }) => {
    // 편집 모드 진입
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.click('[data-testid="enter-edit-mode"]');

    // 거실 카테고리 클릭 (기본적으로 선택되어 있음)

    // 거실 카테고리의 가구들이 표시되는지 확인
    await expect(page.locator('text=간단한 2인용 소파')).toBeVisible();
    await expect(page.locator('text=간단한 3인용 소파')).toBeVisible();
    await expect(page.locator('text=모던 소파')).toBeVisible();

    // 수납 카테고리 클릭
    await page.click('text=수납');

    // 수납 카테고리의 가구들이 표시되는지 확인
    await expect(page.locator('text=간단한 작은 책장')).toBeVisible();
    await expect(page.locator('text=간단한 중간 책장')).toBeVisible();
    await expect(page.locator('text=높은 책장')).toBeVisible();
  });

  test('편집 모드 종료 - 가구 라이브러리 닫기', async ({ page }) => {
    // 편집 모드 진입
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.click('[data-testid="enter-edit-mode"]');

    // 가구 라이브러리가 열려있는지 확인
    await expect(page.locator('text=가구 라이브러리')).toBeVisible();

    // 가구 라이브러리의 ✕ 버튼으로 닫기
    await page.click('[data-testid="close-furniture-catalog"]', { force: true });

    // 상태 업데이트를 기다림
    await page.waitForTimeout(500);

    // 가구 라이브러리가 닫혔는지 확인
    await expect(page.locator('text=가구 라이브러리')).not.toBeVisible();
  });

  test('편집 종료 버튼으로 모드 종료', async ({ page }) => {
    // 편집 모드 진입
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.click('[data-testid="enter-edit-mode"]');

    // 편집 종료 버튼 클릭 (force 옵션으로 다른 요소의 간섭 무시)
    await page.click('[data-testid="exit-edit-mode"]', { force: true });

    // 상태 업데이트를 기다림
    await page.waitForTimeout(1000);

    // 편집 모드가 종료되었는지 확인
    await expect(page.locator('button:has-text("룸 편집")')).toBeVisible();
    await expect(page.locator('text=가구 라이브러리')).not.toBeVisible();
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
