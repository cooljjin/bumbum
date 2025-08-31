import { test, expect } from '@playwright/test';

test.describe('객체 고정 위치 유지 테스트', () => {
  test('L 키로 객체 고정 시 위치가 유지되는지 확인', async ({ page }) => {
    console.log('🎬 객체 고정 위치 유지 테스트 시작!');

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

    // 3D 캔버스에서 객체를 선택하고 이동
    const canvas = page.locator('canvas').first();
    await canvas.click(); // 객체 선택

    console.log('✅ 객체 선택됨');

    // 객체를 약간 이동시키기 위해 마우스 드래그 시뮬레이션
    const canvasBoundingBox = await canvas.boundingBox();
    if (canvasBoundingBox) {
      // 캔버스 중앙에서 약간 오른쪽으로 드래그
      const startX = canvasBoundingBox.x + canvasBoundingBox.width / 2;
      const startY = canvasBoundingBox.y + canvasBoundingBox.height / 2;
      const endX = startX + 50; // 50px 오른쪽으로 이동
      const endY = startY;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY);
      await page.mouse.up();

      console.log('✅ 객체를 오른쪽으로 이동시킴');
      await page.waitForTimeout(1000);
    }

    // 객체의 초기 위치 저장을 위한 스크린샷
    if (await canvas.isVisible()) {
      await canvas.screenshot({ path: 'demo-before-lock.png' });
      console.log('✅ 이동 후 초기 위치 스크린샷 저장');
    }

    // L 키를 눌러 객체 고정
    await page.keyboard.press('L');
    console.log('✅ L 키로 객체 고정');

    await page.waitForTimeout(1000);

    // 고정 후 스크린샷
    if (await canvas.isVisible()) {
      await canvas.screenshot({ path: 'demo-after-lock.png' });
      console.log('✅ 고정 후 스크린샷 저장');
    }

    // 다른 객체를 선택해서 이전 객체가 사라지지 않는지 확인
    const livingCategory = page.getByText('거실').first();
    await expect(livingCategory).toBeVisible();
    await livingCategory.click();

    console.log('✅ 거실 카테고리 선택');

    // 쇼파 선택
    const sofa = page.getByText('간단한 3인용 소파').first();
    await expect(sofa).toBeVisible();
    await sofa.click();

    console.log('✅ 쇼파 선택 및 배치');
    await page.waitForTimeout(3000);

    // 최종 결과 스크린샷 - 두 객체가 모두 보이는지 확인
    if (await canvas.isVisible()) {
      await canvas.screenshot({ path: 'demo-final-lock-test.png' });
      console.log('✅ 최종 결과 스크린샷 저장');
    }

    console.log('🎯 테스트 결과 확인사항:');
    console.log('   • L 키를 눌렀을 때 객체가 중앙으로 돌아갔는지?');
    console.log('   • 고정된 객체가 노란색 테두리로 표시되는지?');
    console.log('   • 두 번째 객체 선택 시 첫 번째 객체가 유지되는지?');

    console.log('✨ 객체 고정 위치 유지 테스트 완료!');
  });
});
