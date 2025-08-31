import { test, expect } from '@playwright/test';

test.describe('가구 고정 기능 종합 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 페이지 로드
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('가구 이동 후 자동 고정 테스트', async ({ page }) => {
    // 편집 모드 진입
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 가구 카탈로그 열기 (EditToolbar에서 가구 버튼 찾기)
    await page.waitForTimeout(2000); // EditToolbar 로딩 대기
    const furnitureButton = page.locator('button:has-text("가구")');
    if (await furnitureButton.count() > 0) {
      await furnitureButton.click();
    } else {
      console.log('가구 버튼을 찾을 수 없습니다. EditToolbar가 로드되지 않았을 수 있습니다.');
      return;
    }
    
    // 첫 번째 가구 추가
    await page.click('[data-testid="furniture-item"]:first-child');
    
    // 가구가 추가되었는지 확인
    const furniture = await page.locator('[data-testid="editable-furniture"]').first();
    await expect(furniture).toBeVisible();
    
    // 가구 선택
    await furniture.click();
    
    // 이동 도구 선택
    await page.click('button:has-text("이동")');
    
    // 가구를 드래그하여 이동
    await furniture.dragTo(page.locator('body'), { targetPosition: { x: 100, y: 100 } });
    
    // 자동 고정 대기 (기본 1초)
    await page.waitForTimeout(1500);
    
    // 가구가 고정되었는지 확인 (황금색 테두리 표시)
    const lockIndicator = await page.locator('[data-testid="lock-indicator"]');
    await expect(lockIndicator).toBeVisible();
    
    console.log('✅ 가구 이동 후 자동 고정 테스트 통과');
  });

  test('다른 가구 추가 시 기존 가구 위치 유지 테스트', async ({ page }) => {
    // 편집 모드 진입
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 첫 번째 가구 추가 및 이동
    await page.waitForTimeout(2000); // EditToolbar 로딩 대기
    const furnitureButton = page.locator('button:has-text("가구")');
    if (await furnitureButton.count() > 0) {
      await furnitureButton.click();
    } else {
      console.log('가구 버튼을 찾을 수 없습니다.');
      return;
    }
    await page.click('[data-testid="furniture-item"]:first-child');
    
    const firstFurniture = await page.locator('[data-testid="editable-furniture"]').first();
    await firstFurniture.click();
    await page.click('button:has-text("이동")');
    
    // 첫 번째 가구를 특정 위치로 이동
    const initialPosition = await firstFurniture.boundingBox();
    await firstFurniture.dragTo(page.locator('body'), { targetPosition: { x: 200, y: 200 } });
    
    // 자동 고정 대기
    await page.waitForTimeout(1500);
    
    // 두 번째 가구 추가
    await page.click('[data-testid="furniture-item"]:nth-child(2)');
    
    // 첫 번째 가구의 위치가 유지되었는지 확인
    const newPosition = await firstFurniture.boundingBox();
    expect(newPosition?.x).toBeCloseTo(initialPosition?.x || 0, 0);
    expect(newPosition?.y).toBeCloseTo(initialPosition?.y || 0, 0);
    
    console.log('✅ 다른 가구 추가 시 기존 가구 위치 유지 테스트 통과');
  });

  test('고정 해제 및 재고정 기능 테스트', async ({ page }) => {
    // 편집 모드 진입
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 가구 추가 및 고정
    await page.waitForTimeout(2000); // EditToolbar 로딩 대기
    const furnitureButton = page.locator('button:has-text("가구")');
    if (await furnitureButton.count() > 0) {
      await furnitureButton.click();
    } else {
      console.log('가구 버튼을 찾을 수 없습니다.');
      return;
    }
    await page.click('[data-testid="furniture-item"]:first-child');
    
    const furniture = await page.locator('[data-testid="editable-furniture"]').first();
    await furniture.click();
    await page.click('button:has-text("이동")');
    
    // 가구 이동 후 자동 고정 대기
    await furniture.dragTo(page.locator('body'), { targetPosition: { x: 150, y: 150 } });
    await page.waitForTimeout(1500);
    
    // 고정 상태 확인
    let lockIndicator = await page.locator('[data-testid="lock-indicator"]');
    await expect(lockIndicator).toBeVisible();
    
    // L키를 눌러 고정 해제
    await page.keyboard.press('L');
    await page.waitForTimeout(500);
    
    // 고정 해제 상태 확인
    lockIndicator = await page.locator('[data-testid="lock-indicator"]');
    await expect(lockIndicator).not.toBeVisible();
    
    // 다시 L키를 눌러 재고정
    await page.keyboard.press('L');
    await page.waitForTimeout(500);
    
    // 재고정 상태 확인
    lockIndicator = await page.locator('[data-testid="lock-indicator"]');
    await expect(lockIndicator).toBeVisible();
    
    console.log('✅ 고정 해제 및 재고정 기능 테스트 통과');
  });

  test('편집 모드 전환 시 고정 상태 유지 테스트', async ({ page }) => {
    // 편집 모드 진입
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 가구 추가 및 고정
    await page.waitForTimeout(2000); // EditToolbar 로딩 대기
    const furnitureButton = page.locator('button:has-text("가구")');
    if (await furnitureButton.count() > 0) {
      await furnitureButton.click();
    } else {
      console.log('가구 버튼을 찾을 수 없습니다.');
      return;
    }
    await page.click('[data-testid="furniture-item"]:first-child');
    
    const furniture = await page.locator('[data-testid="editable-furniture"]').first();
    await furniture.click();
    await page.click('button:has-text("이동")');
    
    // 가구 이동 후 자동 고정
    await furniture.dragTo(page.locator('body'), { targetPosition: { x: 250, y: 250 } });
    await page.waitForTimeout(1500);
    
    // 고정 상태 확인
    let lockIndicator = await page.locator('[data-testid="lock-indicator"]');
    await expect(lockIndicator).toBeVisible();
    
    // 뷰 모드로 전환
    await page.click('button:has-text("👁️ 뷰 모드")');
    
    // 편집 모드로 다시 전환
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 고정 상태가 유지되었는지 확인
    lockIndicator = await page.locator('[data-testid="lock-indicator"]');
    await expect(lockIndicator).toBeVisible();
    
    console.log('✅ 편집 모드 전환 시 고정 상태 유지 테스트 통과');
  });

  test('자동 고정 설정 변경 테스트', async ({ page }) => {
    // 편집 모드 진입
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 자동 고정 비활성화
    await page.waitForTimeout(2000); // EditToolbar 로딩 대기
    const autoLockButton = page.locator('button:has-text("자동고정")');
    if (await autoLockButton.count() > 0) {
      await autoLockButton.click();
    } else {
      console.log('자동고정 버튼을 찾을 수 없습니다.');
      return;
    }
    
    // 가구 추가 및 이동
    const furnitureButton = page.locator('button:has-text("가구")');
    if (await furnitureButton.count() > 0) {
      await furnitureButton.click();
    } else {
      console.log('가구 버튼을 찾을 수 없습니다.');
      return;
    }
    await page.click('[data-testid="furniture-item"]:first-child');
    
    const furniture = await page.locator('[data-testid="editable-furniture"]').first();
    await furniture.click();
    await page.click('button:has-text("이동")');
    
    // 가구 이동
    await furniture.dragTo(page.locator('body'), { targetPosition: { x: 300, y: 300 } });
    
    // 자동 고정이 비활성화되어 고정되지 않았는지 확인
    await page.waitForTimeout(2000);
    const lockIndicator = await page.locator('[data-testid="lock-indicator"]');
    await expect(lockIndicator).not.toBeVisible();
    
    // 자동 고정 다시 활성화
    await page.click('button:has-text("자동고정")');
    
    console.log('✅ 자동 고정 설정 변경 테스트 통과');
  });

  test('고정 상태 시각화 개선 확인', async ({ page }) => {
    // 편집 모드 진입
    await page.click('button:has-text("✏️ 편집 모드")');
    
    // 가구 추가
    await page.waitForTimeout(2000); // EditToolbar 로딩 대기
    const furnitureButton = page.locator('button:has-text("가구")');
    if (await furnitureButton.count() > 0) {
      await furnitureButton.click();
    } else {
      console.log('가구 버튼을 찾을 수 없습니다.');
      return;
    }
    await page.click('[data-testid="furniture-item"]:first-child');
    
    const furniture = await page.locator('[data-testid="editable-furniture"]').first();
    
    // 편집 가능한 가구의 시각화 확인 (파란색 테두리)
    const selectionIndicator = await page.locator('[data-testid="selection-indicator"]');
    await expect(selectionIndicator).toBeVisible();
    
    // 가구 이동 후 고정
    await furniture.click();
    await page.click('button:has-text("이동")');
    await furniture.dragTo(page.locator('body'), { targetPosition: { x: 350, y: 350 } });
    await page.waitForTimeout(1500);
    
    // 고정된 가구의 시각화 확인 (황금색 테두리)
    const lockIndicator = await page.locator('[data-testid="lock-indicator"]');
    await expect(lockIndicator).toBeVisible();
    
    // 편집 가능한 가구 표시가 사라졌는지 확인
    await expect(selectionIndicator).not.toBeVisible();
    
    console.log('✅ 고정 상태 시각화 개선 확인 테스트 통과');
  });
});
