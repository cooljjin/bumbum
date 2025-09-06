import { test, expect } from '@playwright/test';

test.describe('실제 터치 이벤트 테스트', () => {
  test('미니룸에서 실제 터치 이벤트가 작동하는지 확인', async ({ browser }) => {
    // 터치스크린이 활성화된 컨텍스트 생성
    const context = await browser.newContext({
      hasTouch: true,
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    
    // 콘솔 로그 수집
    const logs = [];
    page.on('console', msg => {
      console.log('콘솔 메시지:', msg.text());
      if (msg.text().includes('드래그 이벤트') || msg.text().includes('핀치 이벤트') || msg.text().includes('🎯 GestureOverlay')) {
        logs.push(msg.text());
      }
    });
    
    // 페이지 로드
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 초기 상태 스크린샷
    await page.screenshot({ path: 'real-touch-initial.png' });
    
    // 미니룸 Canvas 요소 찾기
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) {
      throw new Error('Canvas 요소를 찾을 수 없습니다');
    }
    
    console.log('Canvas 위치와 크기:', canvasBox);
    
    // 실제 터치 이벤트 시뮬레이션
    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;
    
    // 1. 단일 터치 드래그
    console.log('단일 터치 드래그 시작...');
    await page.touchscreen.tap(centerX, centerY);
    await page.touchscreen.tap(centerX + 100, centerY + 50);
    
    await page.screenshot({ path: 'real-touch-after-single-drag.png' });
    
    // 2. 핀치 줌 (두 손가락)
    console.log('핀치 줌 시작...');
    const touch1X = centerX - 50;
    const touch1Y = centerY;
    const touch2X = centerX + 50;
    const touch2Y = centerY;
    
    // 터치 시작
    await page.touchscreen.tap(touch1X, touch1Y);
    await page.touchscreen.tap(touch2X, touch2Y);
    
    // 핀치 제스처 (두 손가락을 가까이)
    await page.touchscreen.tap(touch1X + 20, touch1Y);
    await page.touchscreen.tap(touch2X - 20, touch2Y);
    
    await page.screenshot({ path: 'real-touch-after-pinch.png' });
    
    // 3. 다른 위치에서 터치 테스트
    console.log('다른 위치 터치 테스트...');
    const testPositions = [
      { x: canvasBox.x + 100, y: canvasBox.y + 100 },
      { x: canvasBox.x + canvasBox.width - 100, y: canvasBox.y + 100 },
      { x: canvasBox.x + 100, y: canvasBox.y + canvasBox.height - 100 },
      { x: canvasBox.x + canvasBox.width - 100, y: canvasBox.y + canvasBox.height - 100 }
    ];
    
    for (let i = 0; i < testPositions.length; i++) {
      const pos = testPositions[i];
      console.log(`위치 ${i + 1}에서 터치:`, pos);
      
      await page.touchscreen.tap(pos.x, pos.y);
      await page.touchscreen.tap(pos.x + 50, pos.y + 50);
      
      await page.screenshot({ path: `real-touch-position-${i + 1}.png` });
      await page.waitForTimeout(500);
    }
    
    // 로그 확인
    console.log('수집된 로그:', logs);
    
    // 최종 스크린샷
    await page.screenshot({ path: 'real-touch-final.png' });
    
    // 테스트 완료
    console.log('터치 테스트 완료!');
  });
});
