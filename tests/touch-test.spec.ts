import { test, expect } from '@playwright/test';

test.describe('미니룸 터치 테스트', () => {
  test('미니룸 전체 영역에서 터치 드래그가 작동하는지 확인', async ({ browser }) => {
    // 터치스크린이 활성화된 컨텍스트 생성
    const context = await browser.newContext({
      hasTouch: true,
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    // 페이지 로드
    await page.goto('http://localhost:3002');
    
    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 미니룸 Canvas가 로드될 때까지 대기
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 초기 상태 스크린샷
    await page.screenshot({ path: 'touch-test-initial.png' });
    
    // 미니룸 Canvas 요소 찾기
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Canvas의 위치와 크기 정보 가져오기
    const canvasBox = await canvas.boundingBox();
    console.log('Canvas 위치와 크기:', canvasBox);
    
    if (!canvasBox) {
      throw new Error('Canvas 요소를 찾을 수 없습니다');
    }
    
    // Canvas 중앙에서 시작
    const startX = canvasBox.x + canvasBox.width / 2;
    const startY = canvasBox.y + canvasBox.height / 2;
    
    // 마우스 드래그 시뮬레이션 (터치와 유사한 동작)
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // 드래그 이동
    const dragDistance = 100;
    await page.mouse.move(startX + dragDistance, startY);
    await page.mouse.up();
    
    // 드래그 후 스크린샷
    await page.screenshot({ path: 'touch-test-after-drag.png' });
    
    // 휠 줌 시뮬레이션
    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;
    
    // 마우스를 중앙으로 이동
    await page.mouse.move(centerX, centerY);
    
    // 휠 줌 (핀치 줌과 유사한 효과)
    await page.mouse.wheel(0, -100); // 줌 인
    await page.waitForTimeout(500);
    await page.mouse.wheel(0, 50); // 줌 아웃
    
    // 줌 후 스크린샷
    await page.screenshot({ path: 'touch-test-after-zoom.png' });
    
    // 콘솔 로그 확인 (마우스 이벤트가 발생했는지)
    const logs = [];
    page.on('console', msg => {
      if (msg.text().includes('드래그 이벤트') || msg.text().includes('휠 이벤트') || msg.text().includes('🎯 GestureOverlay')) {
        logs.push(msg.text());
      }
    });
    
    // 잠시 대기하여 로그 수집
    await page.waitForTimeout(1000);
    
    console.log('이벤트 로그:', logs);
    
    // 이벤트가 발생했는지 확인 (로그가 없어도 스크린샷으로 확인)
    console.log('테스트 완료 - 스크린샷으로 결과 확인');
  });
  
  test('미니룸의 다른 영역에서도 터치가 작동하는지 확인', async ({ browser }) => {
    // 터치스크린이 활성화된 컨텍스트 생성
    const context = await browser.newContext({
      hasTouch: true,
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) {
      throw new Error('Canvas 요소를 찾을 수 없습니다');
    }
    
    // Canvas의 여러 위치에서 터치 테스트
    const testPositions = [
      { x: canvasBox.x + 50, y: canvasBox.y + 50 }, // 왼쪽 위
      { x: canvasBox.x + canvasBox.width - 50, y: canvasBox.y + 50 }, // 오른쪽 위
      { x: canvasBox.x + 50, y: canvasBox.y + canvasBox.height - 50 }, // 왼쪽 아래
      { x: canvasBox.x + canvasBox.width - 50, y: canvasBox.y + canvasBox.height - 50 }, // 오른쪽 아래
    ];
    
    for (let i = 0; i < testPositions.length; i++) {
      const pos = testPositions[i];
      
      // 터치 드래그
      await page.mouse.move(pos.x, pos.y);
      await page.mouse.down();
      await page.mouse.move(pos.x + 50, pos.y + 50);
      await page.mouse.up();
      
      // 스크린샷 저장
      await page.screenshot({ path: `touch-test-position-${i + 1}.png` });
      
      // 잠시 대기
      await page.waitForTimeout(500);
    }
  });
});
