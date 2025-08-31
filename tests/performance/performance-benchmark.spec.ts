import { test, expect } from '@playwright/test';

test.describe('Performance Benchmarks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 페이지 로드 시간이 3초 이내여야 함
    expect(loadTime).toBeLessThan(3000);
    
    // 성능 메트릭 수집
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
      };
    });
    
    console.log('Performance Metrics:', performanceMetrics);
    
    // DOM 콘텐츠 로드 시간이 1초 이내여야 함
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1000);
    // 전체 로드 시간이 2.5초 이내여야 함
    expect(performanceMetrics.totalTime).toBeLessThan(2500);
  });

  test('3D rendering performance', async ({ page }) => {
    // 3D 룸 페이지로 이동
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    
    // 3D 렌더링 시작 시간 측정
    const renderStartTime = Date.now();
    
    // 3D 캔버스가 로드될 때까지 대기
    await page.waitForSelector('[data-testid="3d-canvas"]', { timeout: 10000 });
    
    const renderTime = Date.now() - renderStartTime;
    
    // 3D 렌더링이 5초 이내에 완료되어야 함
    expect(renderTime).toBeLessThan(5000);
    
    // FPS 측정 (1초 동안)
    const fps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frameCount = 0;
        let lastTime = performance.now();
        
        function countFrames() {
          frameCount++;
          const currentTime = performance.now();
          
          if (currentTime - lastTime >= 1000) {
            resolve(frameCount);
            return;
          }
          
          requestAnimationFrame(countFrames);
        }
        
        requestAnimationFrame(countFrames);
      });
    });
    
    // FPS가 30 이상이어야 함
    expect(fps).toBeGreaterThan(30);
  });

  test('furniture placement performance', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    
    // 편집 모드 활성화
    await page.click('[data-testid="edit-mode-toggle"]');
    await page.waitForTimeout(1000);
    
    // 가구 카탈로그 열기
    await page.click('[data-testid="furniture-catalog-toggle"]');
    await page.waitForTimeout(500);
    
    const placementStartTime = Date.now();
    
    // 가구 배치 테스트 (10개 가구)
    for (let i = 0; i < 10; i++) {
      const furnitureItem = page.locator('[data-testid="furniture-item"]').first();
      await furnitureItem.click();
      
      // 룸에 배치
      const placementArea = page.locator('[data-testid="placement-area"]');
      await placementArea.click();
      
      await page.waitForTimeout(100);
    }
    
    const placementTime = Date.now() - placementStartTime;
    
    // 10개 가구 배치가 10초 이내에 완료되어야 함
    expect(placementTime).toBeLessThan(10000);
    
    // 메모리 사용량 확인
    const memoryUsage = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
      }
      return null;
    });
    
    if (memoryUsage !== null) {
      // 메모리 사용량이 100MB 이하여야 함
      expect(memoryUsage).toBeLessThan(100);
    }
  });

  test('drag and drop performance', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    
    // 편집 모드 활성화
    await page.click('[data-testid="edit-mode-toggle"]');
    await page.waitForTimeout(1000);
    
    // 가구 선택
    const furniture = page.locator('[data-testid="editable-furniture"]').first();
    await furniture.click();
    
    const dragStartTime = Date.now();
    
    // 드래그 앤 드롭 테스트
    await furniture.dragTo(page.locator('[data-testid="placement-area"]'));
    
    const dragTime = Date.now() - dragStartTime;
    
    // 드래그 앤 드롭이 2초 이내에 완료되어야 함
    expect(dragTime).toBeLessThan(2000);
  });

  test('camera movement performance', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    
    // 3D 캔버스 대기
    await page.waitForSelector('[data-testid="3d-canvas"]', { timeout: 10000 });
    
    const cameraStartTime = Date.now();
    
    // 카메라 이동 테스트
    const canvas = page.locator('[data-testid="3d-canvas"]');
    
    // 마우스 드래그로 카메라 회전
    await canvas.dragTo(canvas, { sourcePosition: { x: 100, y: 100 }, targetPosition: { x: 200, y: 200 } });
    
    // 휠로 줌
    await canvas.hover();
    await page.mouse.wheel(0, -100);
    
    const cameraTime = Date.now() - cameraStartTime;
    
    // 카메라 조작이 3초 이내에 완료되어야 함
    expect(cameraTime).toBeLessThan(3000);
  });

  test('memory leak detection', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    
    // 초기 메모리 사용량 측정
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });
    
    if (initialMemory === null) {
      test.skip('Memory API not available');
      return;
    }
    
    // 여러 번의 페이지 새로고침으로 메모리 누수 테스트
    for (let i = 0; i < 5; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    // 최종 메모리 사용량 측정
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });
    
    if (finalMemory !== null) {
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
      
      // 메모리 증가가 50MB 이하여야 함 (메모리 누수 방지)
      expect(memoryIncreaseMB).toBeLessThan(50);
    }
  });

  test('network performance', async ({ page }) => {
    const networkRequests: string[] = [];
    
    // 네트워크 요청 모니터링
    page.on('request', request => {
      networkRequests.push(request.url());
    });
    
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    
    // 네트워크 요청 수가 적절한 범위 내에 있어야 함
    expect(networkRequests.length).toBeLessThan(50);
    
    // 큰 파일들 (3D 모델, 텍스처)의 로딩 시간 확인
    const largeFileRequests = networkRequests.filter(url => 
      url.includes('.glb') || url.includes('.gltf') || url.includes('.jpg') || url.includes('.png')
    );
    
    // 큰 파일 요청이 20개 이하여야 함
    expect(largeFileRequests.length).toBeLessThan(20);
  });

  test('accessibility performance', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    
    // 접근성 검사 시작 시간
    const accessibilityStartTime = Date.now();
    
    // 키보드 네비게이션 테스트
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // 스크린 리더 호환성 테스트
    const ariaLabels = await page.locator('[aria-label]').count();
    const ariaDescribedBy = await page.locator('[aria-describedby]').count();
    
    const accessibilityTime = Date.now() - accessibilityStartTime;
    
    // 접근성 검사가 1초 이내에 완료되어야 함
    expect(accessibilityTime).toBeLessThan(1000);
    
    // 적절한 ARIA 라벨이 있어야 함
    expect(ariaLabels).toBeGreaterThan(5);
  });
});
