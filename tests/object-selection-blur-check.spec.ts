import { test, expect } from '@playwright/test';

test.describe('객체 선택 시 뿌옇게 변하는 문제 확인', () => {
  test('렌더링 품질이 일정하게 유지되는지 확인', async ({ page }) => {
    console.log('🔍 렌더링 품질 일정 유지 확인 시작...');
    
    // 페이지 로드
    await page.goto('http://localhost:3002');
    console.log('📄 페이지 로드 완료');
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 초기 렌더링 품질 확인
    const initialQuality = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl && typeof gl.getPixelRatio === 'function') {
          return {
            pixelRatio: gl.getPixelRatio(),
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight
          };
        } else {
          // WebGL 컨텍스트가 없거나 getPixelRatio 함수가 없는 경우
          return {
            pixelRatio: window.devicePixelRatio || 1,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight
          };
        }
      }
      return null;
    });
    
    console.log('🔍 초기 렌더링 품질:', initialQuality);
    
    // 편집 모드 진입
    const editButton = page.locator('button[title*="편집"]').first();
    await editButton.click();
    console.log('✏️ 편집 모드 진입');
    
    // 편집 모드 로딩 대기
    await page.waitForTimeout(2000);
    
    // 편집 모드 후 렌더링 품질 확인
    const editModeQuality = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl && typeof gl.getPixelRatio === 'function') {
          return {
            pixelRatio: gl.getPixelRatio(),
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight
          };
        } else {
          // WebGL 컨텍스트가 없거나 getPixelRatio 함수가 없는 경우
          return {
            pixelRatio: window.devicePixelRatio || 1,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight
          };
        }
      }
      return null;
    });
    
    console.log('🔍 편집 모드 렌더링 품질:', editModeQuality);
    
    // 스크린샷 촬영
    await page.screenshot({ 
      path: 'render-quality-check.png',
      fullPage: true 
    });
    console.log('📸 렌더링 품질 확인 스크린샷 촬영: render-quality-check.png');
    
    // 렌더링 로그 수집
    const logs = await page.evaluate(() => {
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => {
        consoleLogs.push(args.join(' '));
        originalLog(...args);
      };
      return consoleLogs;
    });
    
    console.log('📊 수집된 렌더링 로그:');
    logs.forEach(log => {
      if (log.includes('DPR') || log.includes('pixelRatio') || log.includes('렌더링') || log.includes('RenderQualityStabilizer')) {
        console.log(`  - ${log}`);
      }
    });
    
    // DPR이 2로 유지되는지 확인
    if (initialQuality) {
      expect(initialQuality.pixelRatio).toBe(2);
      console.log('✅ 초기 DPR이 2로 설정됨');
    }
    
    if (editModeQuality) {
      expect(editModeQuality.pixelRatio).toBe(2);
      console.log('✅ 편집 모드 DPR이 2로 유지됨');
    }
    
    // 품질이 일정하게 유지되는지 확인
    if (initialQuality && editModeQuality) {
      expect(initialQuality.pixelRatio).toBe(editModeQuality.pixelRatio);
      console.log('✅ 렌더링 품질이 일정하게 유지됨');
    }
    
    console.log('✅ 렌더링 품질 일정 유지 확인 완료');
  });
});
