import { test, expect } from '@playwright/test';

test.describe('실시간 모니터링 테스트', () => {
  test('시점 고정 시 실시간 로그 모니터링', async ({ page }) => {
    console.log('=== 실시간 모니터링 테스트 시작 ===');
    
    // 페이지 로드
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // 시점 전환 버튼 찾기
    const viewToggleButton = page.locator('button').filter({ hasText: '시점' }).first();
    await expect(viewToggleButton).toBeVisible({ timeout: 10000 });
    
    // 초기 상태 확인
    let buttonText = await viewToggleButton.textContent();
    console.log(`초기 버튼 상태: ${buttonText?.trim()}`);
    
    // 실시간 콘솔 로그 모니터링
    const allLogs: string[] = [];
    const timeStamps: number[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'log') {
        const timestamp = Date.now();
        allLogs.push(msg.text());
        timeStamps.push(timestamp);
        console.log(`[${new Date(timestamp).toLocaleTimeString()}] ${msg.text()}`);
      }
    });
    
    console.log('=== 시점 고정 전환 시작 ===');
    
    // 시점 고정으로 전환
    await viewToggleButton.click();
    console.log('시점 고정 버튼 클릭 완료');
    
    // 애니메이션 완료 대기
    await page.waitForTimeout(3000);
    
    // 시점 고정 상태 확인
    buttonText = await viewToggleButton.textContent();
    console.log(`시점 고정 후 버튼 상태: ${buttonText?.trim()}`);
    expect(buttonText).toContain('🔒');
    
    // 추가 모니터링 (10초간)
    console.log('=== 10초간 추가 모니터링 시작 ===');
    await page.waitForTimeout(10000);
    
    // 로그 분석
    console.log('\n=== 상세 로그 분석 ===');
    console.log('전체 로그 개수:', allLogs.length);
    
    // 시점 고정 관련 로그들
    const lockViewLogs = allLogs.filter(log => log.includes('🔒 시점 고정 모드로 전환'));
    const lockModeLogs = allLogs.filter(log => log.includes('🔒 시점 고정 모드 - 카메라 고정'));
    const positionUpdateLogs = allLogs.filter(log => log.includes('📍 위치 차이 감지'));
    const moveCompleteLogs = allLogs.filter(log => log.includes('📍 고정 위치로 이동'));
    const animationLogs = allLogs.filter(log => log.includes('🎬 애니메이션'));
    
    console.log('\n=== 로그 카테고리별 분석 ===');
    console.log('시점 고정 전환 로그:', lockViewLogs.length, '개');
    console.log('시점 고정 모드 로그:', lockModeLogs.length, '개');
    console.log('위치 차이 감지 로그:', positionUpdateLogs.length, '개');
    console.log('이동 완료 로그:', moveCompleteLogs.length, '개');
    console.log('애니메이션 관련 로그:', animationLogs.length, '개');
    
    // 시간 간격 분석
    if (timeStamps.length > 1) {
      console.log('\n=== 시간 간격 분석 ===');
      for (let i = 1; i < timeStamps.length; i++) {
        const interval = timeStamps[i] - timeStamps[i-1];
        console.log(`로그 ${i-1} → ${i}: ${interval}ms`);
      }
    }
    
    // 반복 패턴 분석
    console.log('\n=== 반복 패턴 분석 ===');
    const lockModeIntervals: number[] = [];
    for (let i = 1; i < lockModeLogs.length; i++) {
      const firstIndex = allLogs.indexOf(lockModeLogs[i-1]);
      const secondIndex = allLogs.indexOf(lockModeLogs[i]);
      if (firstIndex !== -1 && secondIndex !== -1) {
        const interval = timeStamps[secondIndex] - timeStamps[firstIndex];
        lockModeIntervals.push(interval);
        console.log(`시점 고정 모드 로그 간격 ${i}: ${interval}ms`);
      }
    }
    
    // 문제 진단
    console.log('\n=== 문제 진단 ===');
    
    if (lockModeLogs.length > 2) {
      console.log('❌ 문제 발견: 시점 고정 모드 로그가 2번 이상 발생');
      console.log('   - 초기 1번 + 추가 반복 발생');
    } else {
      console.log('✅ 정상: 시점 고정 모드 로그가 적절한 횟수');
    }
    
    if (positionUpdateLogs.length > 1) {
      console.log('❌ 문제 발견: 위치 업데이트가 반복 발생');
    } else {
      console.log('✅ 정상: 위치 업데이트가 적절한 횟수');
    }
    
    // 최종 상태 확인
    buttonText = await viewToggleButton.textContent();
    console.log(`\n최종 버튼 상태: ${buttonText?.trim()}`);
    
    // 카메라 위치 확인
    const cameraPosition = await page.evaluate(() => {
      return (window as any).testCameraTransition?.cameraPosition;
    });
    console.log('최종 카메라 위치:', cameraPosition);
    
    console.log('=== 실시간 모니터링 테스트 완료 ===');
  });
});
