import { test, expect } from '@playwright/test';

test.describe('직접 최적화 룸 테스트', () => {
  test('최적화 룸 시점 전환 테스트', async ({ page }) => {
    console.log('=== 직접 최적화 룸 테스트 시작 ===');
    
    // 페이지 로드
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(2000);
    
    // 시점 전환 버튼 찾기
    console.log('시점 전환 버튼 찾는 중...');
    const viewToggleButton = page.locator('button').filter({ hasText: '시점' }).first();
    
    // 버튼이 보일 때까지 대기
    await expect(viewToggleButton).toBeVisible({ timeout: 10000 });
    
    // 초기 상태 확인
    let buttonText = await viewToggleButton.textContent();
    console.log(`초기 버튼 상태: ${buttonText?.trim()}`);
    
    console.log('=== 시점 고정 전환 테스트 시작 ===');
    
    // 시점 전환 버튼 클릭 (자유 → 고정)
    await viewToggleButton.click();
    console.log('시점 전환 버튼 클릭 완료 (자유 → 고정)');
    
    // 애니메이션 완료 대기
    await page.waitForTimeout(2000);
    
    // 시점 고정 상태 확인
    buttonText = await viewToggleButton.textContent();
    console.log(`시점 고정 후 버튼 상태: ${buttonText?.trim()}`);
    expect(buttonText).toContain('🔒');
    
    console.log('=== 시점 자유 전환 테스트 시작 ===');
    
    // 시점 전환 버튼 클릭 (고정 → 자유)
    await viewToggleButton.click();
    console.log('시점 전환 버튼 클릭 완료 (고정 → 자유)');
    
    // 애니메이션 완료 대기
    await page.waitForTimeout(2000);
    
    // 시점 자유 상태 확인
    buttonText = await viewToggleButton.textContent();
    console.log(`시점 자유 후 버튼 상태: ${buttonText?.trim()}`);
    expect(buttonText).toContain('🎯');
    
    console.log('=== 카메라 앵글 일관성 테스트 ===');
    
    // 개발자 도구 콘솔에서 카메라 위치 확인
    const cameraPosition1 = await page.evaluate(() => {
      return (window as any).testCameraTransition?.cameraPosition;
    });
    console.log('현재 카메라 위치:', cameraPosition1);
    
    // 시점 고정으로 전환
    await viewToggleButton.click();
    await page.waitForTimeout(2000);
    
    const cameraPositionLocked = await page.evaluate(() => {
      return (window as any).testCameraTransition?.cameraPosition;
    });
    console.log('고정 모드 카메라 위치:', cameraPositionLocked);
    
    // 시점 자유로 전환
    await viewToggleButton.click();
    await page.waitForTimeout(2000);
    
    const cameraPosition2 = await page.evaluate(() => {
      return (window as any).testCameraTransition?.cameraPosition;
    });
    console.log('자유 모드 복원 카메라 위치:', cameraPosition2);
    
    // 카메라 위치 일관성 확인 (고정 위치는 항상 동일해야 함)
    if (cameraPositionLocked) {
      expect(cameraPositionLocked[0]).toBeCloseTo(9.0, 1);
      expect(cameraPositionLocked[1]).toBeCloseTo(10.0, 1);
      expect(cameraPositionLocked[2]).toBeCloseTo(6.0, 1);
    }
    
    console.log('=== 직접 최적화 룸 테스트 완료 ===');
  });
});
