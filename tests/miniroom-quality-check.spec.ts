import { test, expect } from '@playwright/test';

test.describe('미니룸 렌더링 품질 확인', () => {
  test('초기 렌더링 품질 및 뿌옇게 보이는 문제 확인', async ({ page }) => {
    console.log('🚀 미니룸 품질 확인 시작...');
    
    // 콘솔 로그 수집
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('🎨') || msg.text().includes('렌더링')) {
        consoleLogs.push(msg.text());
        console.log('📊 렌더링 로그:', msg.text());
      }
    });

    // 페이지 로드
    await page.goto('http://localhost:3002', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });

    // 3D 캔버스 로드 대기
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 5000 });
    
    // 렌더링 완료까지 대기
    await page.waitForTimeout(3000);

    // 캔버스 품질 확인
    const canvasElement = await canvas.elementHandle();
    if (canvasElement) {
      const boundingBox = await canvasElement.boundingBox();
      console.log('📐 캔버스 정보:', {
        크기: boundingBox,
        width: boundingBox?.width,
        height: boundingBox?.height
      });
      
      // 캔버스가 제대로 렌더링되었는지 확인
      expect(boundingBox?.width).toBeGreaterThan(1000);
      expect(boundingBox?.height).toBeGreaterThan(500);
    }

    // 렌더링 품질 로그 확인
    const qualityLogs = consoleLogs.filter(log => 
      log.includes('품질') || log.includes('dpr') || log.includes('pixelRatio')
    );
    
    console.log('🎨 렌더링 품질 로그:', qualityLogs);
    
    // DPR 설정이 올바르게 적용되었는지 확인
    const hasQualityLog = qualityLogs.length > 0;
    expect(hasQualityLog).toBeTruthy();
    
    // 초기 렌더링 스크린샷 (고해상도)
    console.log('📸 고해상도 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'miniroom-quality-check.png',
      fullPage: true,
      animations: 'disabled' // 애니메이션 비활성화로 정적 상태 캡처
    });

    // 편집 모드 진입하여 추가 확인
    const editButton = page.locator('button[title*="편집"]').first();
    await editButton.click();
    await page.waitForTimeout(1000);
    
    console.log('✏️ 편집 모드 진입 완료');
    
    // 편집 모드에서 스크린샷
    await page.screenshot({ 
      path: 'miniroom-edit-mode.png',
      fullPage: true,
      animations: 'disabled'
    });

    console.log('✅ 미니룸 품질 확인 완료');
  });
});
