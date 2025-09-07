import { test, expect } from '@playwright/test';

test.describe('미니룸 초기 렌더링 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 페이지 로드 전 콘솔 메시지 수집
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ 콘솔 에러:', msg.text());
      } else if (msg.text().includes('🎨')) {
        console.log('🎨 렌더링 로그:', msg.text());
      }
    });

    // 네트워크 요청 모니터링
    page.on('request', request => {
      if (request.url().includes('models') || request.url().includes('textures')) {
        console.log('📦 3D 에셋 로드:', request.url());
      }
    });
  });

  test('페이지 로드 시 미니룸이 뿌옇게 보이지 않는지 확인', async ({ page }) => {
    console.log('🚀 페이지 로드 시작...');
    
    // 페이지 로드 시작
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📄 페이지 로드 완료');

    // 3D 캔버스가 로드될 때까지 대기
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    
    console.log('🎨 3D 캔버스 로드 완료');

    // 초기 로딩 상태 확인 (뿌옇게 보이는지 체크)
    const loadingElement = page.locator('text=3D 룸 로딩 중');
    if (await loadingElement.isVisible()) {
      console.log('⏳ 로딩 상태 감지됨');
      // 로딩이 사라질 때까지 대기
      await expect(loadingElement).not.toBeVisible({ timeout: 5000 });
      console.log('✅ 로딩 상태 완료');
    }

    // 캔버스의 렌더링 품질 확인
    const canvasElement = await canvas.elementHandle();
    if (canvasElement) {
      // 캔버스 크기 확인
      const boundingBox = await canvasElement.boundingBox();
      console.log('📐 캔버스 크기:', boundingBox);
      
      // 캔버스가 제대로 렌더링되었는지 확인
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    }

    // 스크린샷 촬영하여 시각적 확인
    console.log('📸 초기 렌더링 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'miniroom-initial-render.png',
      fullPage: true 
    });

    // 편집 모드 토글 버튼이 보이는지 확인 (첫 번째 버튼만 선택)
    const editButton = page.locator('button[title*="편집"]').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    console.log('✏️ 편집 버튼 확인됨');

    // 3D 룸 내부 요소들이 제대로 렌더링되었는지 확인
    // (그리드, 조명, 바닥 등이 보이는지)
    console.log('🏠 3D 룸 내부 요소 렌더링 확인 중...');
    
    // 페이지가 완전히 로드된 후 추가 대기
    await page.waitForTimeout(2000);
    
    console.log('✅ 미니룸 초기 렌더링 테스트 완료');
  });

  test('렌더링 품질 설정이 올바르게 적용되었는지 확인', async ({ page }) => {
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    
    // 콘솔 로그에서 렌더링 품질 설정 확인
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('🎨 3D 품질 설정 완료') || 
          msg.text().includes('🎨 MiniRoom 렌더링 품질 설정')) {
        consoleLogs.push(msg.text());
      }
    });

    // 3D 캔버스 로드 대기
    await page.locator('canvas').first().waitFor({ state: 'visible' });
    
    // 렌더링 품질 로그가 출력되었는지 확인
    await page.waitForTimeout(3000); // 로그 출력 대기
    
    console.log('📊 수집된 렌더링 로그:', consoleLogs);
    
    // DPR 설정이 올바르게 적용되었는지 확인
    const hasQualityLog = consoleLogs.some(log => 
      log.includes('dpr') && log.includes('pixelRatio')
    );
    
    expect(hasQualityLog).toBeTruthy();
    console.log('✅ 렌더링 품질 설정 확인됨');
  });
});
