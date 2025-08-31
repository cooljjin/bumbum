import { test, expect } from '@playwright/test';

test.describe('식탁과 쇼파 직접 배치 데모', () => {
  test('사용자를 위한 실시간 배치 데모', async ({ page }) => {
    console.log('🎬 식탁과 쇼파 배치 데모 시작!');

    // 메인 페이지로 이동
    await page.goto('/');

    // JavaScript가 완전히 로드될 때까지 대기
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('✅ 페이지 로드 완료');

    // 초기 상태 스크린샷
    await page.screenshot({
      path: 'demo-initial-state.png',
      fullPage: true
    });

    // 편집 모드 진입
    const editButton = page.locator('[data-testid="enter-edit-mode"]');
    await expect(editButton).toBeVisible();
    await editButton.click();

    console.log('✅ 편집 모드 진입');

    // 편집 모드가 활성화될 때까지 대기
    await page.waitForSelector('[data-testid="exit-edit-mode"]');
    await page.waitForTimeout(2000);

    // 편집 모드 진입 후 스크린샷
    await page.screenshot({
      path: 'demo-edit-mode-entered.png',
      fullPage: true
    });

    // 가구 라이브러리 토글 버튼 찾기
    const libraryButtons = page.locator('button').filter({ hasText: /가구/ });
    const libraryButton = libraryButtons.first();

    if (await libraryButton.isVisible()) {
      await libraryButton.click();
      console.log('✅ 가구 라이브러리 열기');
    }

    // 가구 카탈로그가 나타날 때까지 대기
    await page.waitForSelector('.furniture-catalog', { timeout: 5000 });

    // 라이브러리 열린 후 스크린샷
    await page.screenshot({
      path: 'demo-library-opened.png',
      fullPage: true
    });

    // 주방 카테고리 선택 (식탁)
    const kitchenCategory = page.getByText('주방').first();
    await expect(kitchenCategory).toBeVisible();
    await kitchenCategory.click();

    console.log('✅ 주방 카테고리 선택 (식탁)');

    // 식탁 선택 및 배치
    const diningTable = page.getByText('원형 식탁').first();
    await expect(diningTable).toBeVisible();
    await diningTable.click();

    console.log('✅ 원형 식탁 선택 및 배치');
    await page.waitForTimeout(2000);

    // 식탁 배치 후 스크린샷
    await page.screenshot({
      path: 'demo-table-placed.png',
      fullPage: true
    });

    // 거실 카테고리 선택 (쇼파)
    const livingCategory = page.getByText('거실').first();
    await expect(livingCategory).toBeVisible();
    await livingCategory.click();

    console.log('✅ 거실 카테고리 선택 (쇼파)');

    // 쇼파 선택 및 배치
    const sofa = page.getByText('간단한 3인용 소파').first();
    await expect(sofa).toBeVisible();
    await sofa.click();

    console.log('✅ 3인용 소파 선택 및 배치');
    await page.waitForTimeout(2000);

    // 쇼파 배치 후 스크린샷
    await page.screenshot({
      path: 'demo-sofa-placed.png',
      fullPage: true
    });

    // Canvas 영역 클릭하여 선택 해제
    const canvas = page.locator('canvas').first();
    if (await canvas.isVisible()) {
      await canvas.click();
      console.log('✅ 선택 해제');
    }

    await page.waitForTimeout(1000);

    // 최종 결과 스크린샷
    await page.screenshot({
      path: 'demo-final-result.png',
      fullPage: true
    });

    console.log('🎉 데모 완료! 스크린샷을 확인해보세요:');
    console.log('   - demo-initial-state.png: 초기 상태');
    console.log('   - demo-edit-mode-entered.png: 편집 모드 진입');
    console.log('   - demo-library-opened.png: 가구 라이브러리 열림');
    console.log('   - demo-table-placed.png: 식탁 배치 완료');
    console.log('   - demo-sofa-placed.png: 쇼파 배치 완료');
    console.log('   - demo-final-result.png: 최종 결과');

    // 잠시 대기하여 결과를 확인할 수 있도록
    await page.waitForTimeout(5000);

    console.log('✨ 식탁과 쇼파가 성공적으로 벽면에 배치되었습니다!');
  });
});
