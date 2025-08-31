import { test, expect } from '@playwright/test';

test.describe('3D 렌더링 성능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('메인 페이지 로딩 시간이 3초 이내여야 함', async ({ page }) => {
    const startTime = Date.now();
    
    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForSelector('[data-testid="3d-canvas"]', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('3D 캔버스 FPS가 30 이상이어야 함', async ({ page }) => {
    // FPS 측정을 위한 JavaScript 실행
    const fps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frameCount = 0;
        let lastTime = performance.now();
        
        function countFrames() {
          frameCount++;
          const currentTime = performance.now();
          
          if (currentTime - lastTime >= 1000) { // 1초 후 측정
            const fps = frameCount;
            resolve(fps);
            return;
          }
          
          requestAnimationFrame(countFrames);
        }
        
        requestAnimationFrame(countFrames);
      });
    });
    
    expect(fps).toBeGreaterThanOrEqual(30);
  });

  test('가구 추가 시 렌더링 성능 유지', async ({ page }) => {
    // 초기 렌더링 시간 측정
    const initialRenderTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const start = performance.now();
        requestAnimationFrame(() => {
          const end = performance.now();
          resolve(end - start);
        });
      });
    });
    
    // 가구 추가
    await page.click('[data-testid="add-furniture-button"]');
    await page.click('[data-testid="furniture-item-sofa"]');
    
    // 가구 추가 후 렌더링 시간 측정
    const afterAddRenderTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const start = performance.now();
        requestAnimationFrame(() => {
          const end = performance.now();
          resolve(end - start);
        });
      });
    });
    
    // 성능 저하가 50% 이하여야 함
    expect(afterAddRenderTime).toBeLessThan(initialRenderTime * 1.5);
  });

  test('메모리 사용량이 안정적으로 유지되어야 함', async ({ page }) => {
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // 여러 가구 추가
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="add-furniture-button"]');
      await page.click('[data-testid="furniture-item-sofa"]');
      await page.waitForTimeout(500);
    }
    
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    if (initialMemory > 0 && finalMemory > 0) {
      // 메모리 증가가 200% 이하여야 함
      expect(finalMemory).toBeLessThan(initialMemory * 3);
    }
  });

  test('카메라 이동 시 부드러운 애니메이션', async ({ page }) => {
    const canvas = page.locator('[data-testid="3d-canvas"]');
    
    // 카메라 드래그 시뮬레이션
    await canvas.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();
    
    // 애니메이션이 부드럽게 진행되는지 확인
    await page.waitForTimeout(100);
    
    // 추가적인 성능 검증 로직
    const isSmooth = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        let frameCount = 0;
        let lastTime = performance.now();
        
        function checkSmoothness() {
          frameCount++;
          const currentTime = performance.now();
          
          if (currentTime - lastTime >= 500) { // 0.5초 후 측정
            const fps = frameCount * 2; // 0.5초를 1초로 변환
            resolve(fps >= 25); // 25fps 이상이면 부드럽다고 판단
            return;
          }
          
          requestAnimationFrame(checkSmoothness);
        }
        
        requestAnimationFrame(checkSmoothness);
      });
    });
    
    expect(isSmooth).toBe(true);
  });
});

