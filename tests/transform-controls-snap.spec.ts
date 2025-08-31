import { test, expect } from '@playwright/test';

test.describe('TransformControls 스냅 기능 통합 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 룸 에디터 페이지로 이동
    await page.goto('/room-editor');
    
    // 편집 모드로 전환
    await page.click('[data-testid="edit-mode-button"]');
    
    // 가구 추가
    await page.click('[data-testid="add-furniture-button"]');
    await page.click('[data-testid="furniture-item-chair"]');
    
    // 가구 선택
    await page.click('[data-testid="editable-furniture"]');
  });

  test('그리드 스냅 기능 테스트', async ({ page }) => {
    // 그리드 스냅 활성화
    await page.keyboard.press('G');
    
    // 이동 도구 선택
    await page.keyboard.press('2');
    
    // 가구를 드래그하여 이동
    const furniture = page.locator('[data-testid="editable-furniture"]');
    await furniture.dragTo(page.locator('[data-testid="grid-cell"]'));
    
    // 그리드에 스냅되었는지 확인
    const position = await furniture.getAttribute('data-position');
    expect(position).toMatch(/^\d+\.\d+,\d+\.\d+,\d+\.\d+$/);
    
    // 그리드 스냅 비활성화
    await page.keyboard.press('G');
  });

  test('회전 스냅 기능 테스트', async ({ page }) => {
    // 회전 스냅 활성화
    await page.keyboard.press('R');
    
    // 회전 도구 선택
    await page.keyboard.press('3');
    
    // 가구를 회전
    const furniture = page.locator('[data-testid="editable-furniture"]');
    await furniture.dragTo(page.locator('[data-testid="rotation-handle"]'));
    
    // 회전 각도가 스냅되었는지 확인
    const rotation = await furniture.getAttribute('data-rotation');
    expect(rotation).toMatch(/^\d+\.\d+,\d+\.\d+,\d+\.\d+$/);
    
    // 회전 스냅 비활성화
    await page.keyboard.press('R');
  });

  test('도구 전환 단축키 테스트', async ({ page }) => {
    // 도구 순환 테스트
    await page.keyboard.press('Tab');
    expect(await page.locator('[data-testid="current-tool"]').textContent()).toBe('translate');
    
    await page.keyboard.press('Tab');
    expect(await page.locator('[data-testid="current-tool"]').textContent()).toBe('rotate');
    
    await page.keyboard.press('Tab');
    expect(await page.locator('[data-testid="current-tool"]').textContent()).toBe('scale');
    
    // 숫자키로 직접 도구 선택
    await page.keyboard.press('1');
    expect(await page.locator('[data-testid="current-tool"]').textContent()).toBe('select');
    
    await page.keyboard.press('2');
    expect(await page.locator('[data-testid="current-tool"]').textContent()).toBe('translate');
  });

  test('스냅 설정 저장 및 복원 테스트', async ({ page }) => {
    // 그리드 스냅 비활성화
    await page.keyboard.press('G');
    
    // 회전 스냅 비활성화
    await page.keyboard.press('R');
    
    // 설정 저장
    await page.keyboard.press('Control+S');
    
    // 페이지 새로고침
    await page.reload();
    await page.goto('/room-editor');
    await page.click('[data-testid="edit-mode-button"]');
    
    // 설정 복원
    await page.keyboard.press('Control+L');
    
    // 스냅 설정이 복원되었는지 확인
    const gridSnapEnabled = await page.locator('[data-testid="grid-snap-checkbox"]').isChecked();
    const rotationSnapEnabled = await page.locator('[data-testid="rotation-snap-checkbox"]').isChecked();
    
    expect(gridSnapEnabled).toBe(false);
    expect(rotationSnapEnabled).toBe(false);
  });

  test('성능 테스트', async ({ page }) => {
    // 여러 가구 추가
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="add-furniture-button"]');
      await page.click('[data-testid="furniture-item-chair"]');
    }
    
    // 모든 가구 선택
    await page.keyboard.press('Control+A');
    
    // 이동 도구 선택
    await page.keyboard.press('2');
    
    // 그리드 스냅 활성화
    await page.keyboard.press('G');
    
    // 드래그 성능 측정
    const startTime = Date.now();
    await page.locator('[data-testid="editable-furniture"]').first().dragTo(
      page.locator('[data-testid="grid-cell"]')
    );
    const endTime = Date.now();
    
    // 성능 기준: 100ms 이내
    expect(endTime - startTime).toBeLessThan(100);
  });

  test('에러 처리 테스트', async ({ page }) => {
    // 잘못된 도구 선택 시도
    await page.keyboard.press('9');
    
    // 현재 도구가 변경되지 않았는지 확인
    const currentTool = await page.locator('[data-testid="current-tool"]').textContent();
    expect(currentTool).toBe('select');
    
    // 스냅 설정 변경 시 안정성 확인
    await page.keyboard.press('G');
    await page.keyboard.press('G');
    await page.keyboard.press('G');
    
    // 그리드 스냅 상태가 올바른지 확인
    const gridSnapEnabled = await page.locator('[data-testid="grid-snap-checkbox"]').isChecked();
    expect(gridSnapEnabled).toBe(true);
  });

  test('사용자 시나리오 테스트', async ({ page }) => {
    // 시나리오: 가구 배치 및 정렬
    
    // 1. 가구 추가
    await page.click('[data-testid="add-furniture-button"]');
    await page.click('[data-testid="furniture-item-table"]');
    
    // 2. 그리드 스냅으로 정확한 위치에 배치
    await page.keyboard.press('G');
    await page.keyboard.press('2');
    
    const table = page.locator('[data-testid="editable-furniture"]').last();
    await table.dragTo(page.locator('[data-testid="grid-cell-center"]'));
    
    // 3. 회전 스냅으로 정확한 각도로 회전
    await page.keyboard.press('3');
    await table.dragTo(page.locator('[data-testid="rotation-handle"]'));
    
    // 4. 결과 검증
    const position = await table.getAttribute('data-position');
    const rotation = await table.getAttribute('data-rotation');
    
    expect(position).toBeDefined();
    expect(rotation).toBeDefined();
    
    // 5. 설정 저장
    await page.keyboard.press('Control+S');
    console.log('사용자 시나리오 테스트 완료');
  });
});
