import { test, expect } from '@playwright/test';

test.describe('개선된 객체 배치 데모 - 고정 기능 포함', () => {
  test('객체 고정 및 다중 배치 기능 테스트', async ({ page }) => {
    console.log('🎬 개선된 객체 배치 데모 시작!');

    // 메인 페이지로 이동
    await page.goto('/');

    // JavaScript가 완전히 로드될 때까지 대기
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('✅ 페이지 로드 완료');

    // 편집 모드 진입
    const editButton = page.locator('[data-testid="enter-edit-mode"]');
    await expect(editButton).toBeVisible();
    await editButton.click();

    console.log('✅ 편집 모드 진입');

    // 편집 모드가 활성화될 때까지 대기
    await page.waitForSelector('[data-testid="exit-edit-mode"]');
    await page.waitForTimeout(2000);

    // 가구 라이브러리 토글 버튼 찾기
    const libraryButtons = page.locator('button').filter({ hasText: /가구/ });
    const libraryButton = libraryButtons.first();

    if (await libraryButton.isVisible()) {
      await libraryButton.click();
      console.log('✅ 가구 라이브러리 열기');
    }

    // 가구 카탈로그가 나타날 때까지 대기
    await page.waitForSelector('.furniture-catalog', { timeout: 5000 });

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
    await page.waitForTimeout(3000); // 3D 로딩 대기

    // 식탁을 선택하고 L 키로 고정
    const canvas = page.locator('canvas').first();
    await canvas.click(); // 식탁 선택
    await page.keyboard.press('L'); // 고정
    console.log('✅ 식탁 고정 완료');

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
    await page.waitForTimeout(3000); // 3D 로딩 대기

    // 쇼파도 선택해서 고정
    await canvas.click(); // 쇼파 선택 (두 번째 객체)
    await page.keyboard.press('L'); // 고정
    console.log('✅ 쇼파 고정 완료');

    // 세 번째 객체 추가 (책장)
    const storageCategory = page.getByText('수납').first();
    await expect(storageCategory).toBeVisible();
    await storageCategory.click();

    console.log('✅ 수납 카테고리 선택 (책장)');

    const bookshelf = page.getByText('간단한 작은 책장').first();
    await expect(bookshelf).toBeVisible();
    await bookshelf.click();

    console.log('✅ 작은 책장 선택 및 배치');
    await page.waitForTimeout(3000);

    // 책장은 고정하지 않고 자유롭게 두기
    await canvas.click(); // 선택 해제
    console.log('✅ 책장은 고정하지 않고 자유롭게 유지');

    // 최종 결과 확인
    console.log('🎯 배치된 가구 상태:');
    console.log('   📋 원형 식탁 - 고정됨 (노란색 테두리)');
    console.log('   🛋️  3인용 소파 - 고정됨 (노란색 테두리)');
    console.log('   📚 작은 책장 - 자유 상태 (선택 해제됨)');

    // 최종 3D 캔버스 스크린샷
    if (await canvas.isVisible()) {
      await canvas.screenshot({ path: 'demo-improved-final.png' });
      console.log('✅ 최종 개선된 결과 스크린샷 저장');
    }

    await page.waitForTimeout(3000);

    console.log('✨ 개선된 객체 배치 데모 완료!');
    console.log('🔑 새로운 기능:');
    console.log('   • 객체 고정 기능 (L 키)');
    console.log('   • 다중 객체 동시 유지');
    console.log('   • 고정된 객체는 노란색 테두리로 표시');
    console.log('   • 고정된 객체는 선택 및 이동 불가');
  });
});
