import { test, expect } from '@playwright/test';

test.describe('반복 애니메이션 체크 테스트', () => {
  test('시점 고정 시 반복 애니메이션 방지 테스트', async ({ page }) => {
    console.log('=== 반복 애니메이션 체크 테스트 시작 ===');
    
    // 페이지 로드
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // 시점 전환 버튼 찾기
    const viewToggleButton = page.locator('button').filter({ hasText: '시점' }).first();
    await expect(viewToggleButton).toBeVisible({ timeout: 10000 });
    
    // 초기 상태 확인
    let buttonText = await viewToggleButton.textContent();
    console.log(`초기 버튼 상태: ${buttonText?.trim()}`);
    
    // 콘솔 로그 모니터링 시작
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    console.log('=== 시점 고정 전환 테스트 ===');
    
    // 시점 고정으로 전환
    await viewToggleButton.click();
    console.log('시점 고정 버튼 클릭 완료');
    
    // 애니메이션 완료 대기
    await page.waitForTimeout(3000);
    
    // 시점 고정 상태 확인
    buttonText = await viewToggleButton.textContent();
    console.log(`시점 고정 후 버튼 상태: ${buttonText?.trim()}`);
    expect(buttonText).toContain('🔒');
    
    // 추가 대기 시간 (반복 애니메이션 체크)
    console.log('=== 반복 애니메이션 체크 (5초 대기) ===');
    await page.waitForTimeout(5000);
    
    // 콘솔 로그 분석
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('🔒 시점 고정 모드') || 
      log.includes('📍 위치 차이 감지') || 
      log.includes('📍 고정 위치로 이동')
    );
    
    console.log('=== 콘솔 로그 분석 ===');
    console.log('전체 로그 개수:', consoleLogs.length);
    console.log('시점 고정 관련 로그:', relevantLogs);
    
    // 반복 애니메이션 체크: 시점 고정 관련 로그가 2번 이상 나오면 안됨
    const lockModeLogs = relevantLogs.filter(log => log.includes('🔒 시점 고정 모드'));
    const positionUpdateLogs = relevantLogs.filter(log => log.includes('📍 위치 차이 감지'));
    
    console.log('시점 고정 모드 로그 개수:', lockModeLogs.length);
    console.log('위치 업데이트 로그 개수:', positionUpdateLogs.length);
    
    // 반복 실행 방지 확인
    expect(lockModeLogs.length).toBeLessThanOrEqual(2); // 초기 + 한 번만
    expect(positionUpdateLogs.length).toBeLessThanOrEqual(2); // 초기 + 한 번만
    
    console.log('=== 반복 애니메이션 체크 완료 ===');
    
    // 시점 자유로 전환
    console.log('=== 시점 자유 전환 테스트 ===');
    await viewToggleButton.click();
    await page.waitForTimeout(3000);
    
    buttonText = await viewToggleButton.textContent();
    console.log(`시점 자유 후 버튼 상태: ${buttonText?.trim()}`);
    expect(buttonText).toContain('🎯');
    
    // 카메라 위치 일관성 확인
    const cameraPosition = await page.evaluate(() => {
      return (window as any).testCameraTransition?.cameraPosition;
    });
    console.log('최종 카메라 위치:', cameraPosition);
    
    // 카메라 위치가 일관되게 유지되는지 확인
    if (cameraPosition) {
      expect(cameraPosition[0]).toBeCloseTo(9.0, 1);
      expect(cameraPosition[1]).toBeCloseTo(10.0, 1);
      expect(cameraPosition[2]).toBeCloseTo(6.0, 1);
    }
    
    console.log('=== 반복 애니메이션 체크 테스트 완료 ===');
  });
});
