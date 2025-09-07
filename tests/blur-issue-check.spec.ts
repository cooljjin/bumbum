import { test, expect } from '@playwright/test';

test.describe('뿌옇게 보이는 문제 확인', () => {
  test('페이지 로드 시 미니룸이 뿌옇게 보이는지 확인', async ({ page }) => {
    console.log('🔍 뿌옇게 보이는 문제 확인 시작...');
    
    // 콘솔 로그 수집
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('🎨') || msg.text().includes('렌더링') || msg.text().includes('DPR') || msg.text().includes('pixelRatio')) {
        consoleLogs.push(msg.text());
        console.log('📊 렌더링 로그:', msg.text());
      }
    });

    // 페이지 로드
    await page.goto('http://localhost:3002', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });

    console.log('📄 페이지 로드 완료');

    // 3D 캔버스 로드 대기
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 5000 });
    
    console.log('🎨 3D 캔버스 로드 완료');

    // 초기 렌더링 완료까지 대기
    await page.waitForTimeout(2000);

    // 캔버스 정보 확인
    const canvasElement = await canvas.elementHandle();
    if (canvasElement) {
      const boundingBox = await canvasElement.boundingBox();
      console.log('📐 캔버스 크기:', boundingBox);
      
      // 캔버스의 실제 렌더링 품질 확인
      const canvasContext = await canvasElement.evaluate((canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        return {
          width: canvas.width,
          height: canvas.height,
          devicePixelRatio: window.devicePixelRatio,
          actualWidth: canvas.clientWidth,
          actualHeight: canvas.clientHeight,
          pixelRatio: canvas.width / canvas.clientWidth
        };
      });
      
      console.log('🔍 캔버스 렌더링 품질 정보:', canvasContext);
    }

    // 초기 상태 스크린샷 (뿌옇게 보이는지 확인)
    await page.screenshot({ 
      path: 'blur-initial-load.png',
      fullPage: true 
    });
    console.log('📸 초기 로드 상태 스크린샷 촬영: blur-initial-load.png');

    // 3초 후 스크린샷 (렌더링 완료 후)
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'blur-after-3sec.png',
      fullPage: true 
    });
    console.log('📸 3초 후 상태 스크린샷 촬영: blur-after-3sec.png');

    // 편집 모드 진입
    const editButton = page.locator('button[title*="편집"]').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();
    console.log('✏️ 편집 모드 진입');

    // 편집 모드에서 스크린샷
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'blur-edit-mode.png',
      fullPage: true 
    });
    console.log('📸 편집 모드 상태 스크린샷 촬영: blur-edit-mode.png');

    // 렌더링 로그 출력
    console.log('📊 수집된 렌더링 로그:');
    consoleLogs.forEach(log => console.log('  -', log));

    console.log('✅ 뿌옇게 보이는 문제 확인 완료');
  });
});
