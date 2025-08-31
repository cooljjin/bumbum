import { test, expect } from '@playwright/test';

test.describe('종합 성능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('페이지 로드 성능 - Lighthouse 점수 기반', async ({ page }) => {
    // Lighthouse 성능 메트릭스 측정
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Performance Observer로 메트릭스 수집
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const navigation = entries.find(entry => entry.entryType === 'navigation') as PerformanceNavigationTiming;

          if (navigation) {
            resolve({
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
              firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            });
          }
        });

        observer.observe({ entryTypes: ['navigation', 'paint'] });

        // 타임아웃 처리
        setTimeout(() => resolve(null), 5000);
      });
    });

    if (metrics) {
      console.log('Performance Metrics:', metrics);
      expect(metrics.domContentLoaded).toBeLessThan(2000); // DOM Content Loaded 2초 이내
      expect(metrics.loadComplete).toBeLessThan(3000); // Load Complete 3초 이내
    }
  });

  test('메모리 누수 감지', async ({ page }) => {
    // 초기 메모리 상태
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        };
      }
      return null;
    });

    // 여러 번의 사용자 인터랙션 시뮬레이션
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="add-furniture-button"]');
      await page.click('[data-testid="furniture-item-sofa"]');
      await page.waitForTimeout(200);
    }

    // 메모리 정리 강제 실행
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });

    await page.waitForTimeout(1000);

    // 최종 메모리 상태
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        };
      }
      return null;
    });

    if (initialMemory && finalMemory) {
      console.log('Memory Usage:', { initial: initialMemory, final: finalMemory });

      // 메모리 사용량이 초기의 5배를 넘지 않아야 함
      expect(finalMemory.used).toBeLessThan(initialMemory.used * 5);

      // 메모리 제한을 초과하지 않아야 함
      expect(finalMemory.used).toBeLessThan(finalMemory.limit * 0.8);
    }
  });

  test('CPU 사용량 모니터링', async ({ page }) => {
    // CPU 사용량 측정을 위한 초기 상태
    const startTime = Date.now();
    let frameCount = 0;

    // 5초 동안 프레임 수 측정
    const fps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frames = 0;
        let lastTime = performance.now();

        function measureFPS() {
          frames++;
          const currentTime = performance.now();

          if (currentTime - lastTime >= 5000) { // 5초 측정
            const fps = frames / 5; // 초당 프레임 수
            resolve(fps);
            return;
          }

          requestAnimationFrame(measureFPS);
        }

        requestAnimationFrame(measureFPS);
      });
    });

    console.log(`Average FPS: ${fps}`);
    expect(fps).toBeGreaterThanOrEqual(20); // 최소 20fps 유지
  });

  test('네트워크 성능 - 리소스 로딩 시간', async ({ page }) => {
    // 네트워크 요청 모니터링
    const requests: Array<{ url: string; duration: number; size: number }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      const timing = response.timing();

      if (timing && url.includes('.glb') || url.includes('.jpg') || url.includes('.png')) {
        requests.push({
          url,
          duration: timing.responseEnd - timing.requestStart,
          size: parseInt(response.headers()['content-length'] || '0')
        });
      }
    });

    // 페이지 새로고침으로 리소스 로딩 트리거
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 대용량 리소스(3D 모델, 이미지)의 로딩 시간 분석
    const slowRequests = requests.filter(req => req.duration > 1000); // 1초 이상 걸린 요청
    const largeRequests = requests.filter(req => req.size > 1024 * 1024); // 1MB 이상인 리소스

    console.log('Network Performance:', {
      totalRequests: requests.length,
      slowRequests: slowRequests.length,
      largeRequests: largeRequests.length,
      averageDuration: requests.reduce((sum, req) => sum + req.duration, 0) / requests.length
    });

    // 1초 이상 걸리는 요청이 전체의 20% 미만이어야 함
    expect(slowRequests.length).toBeLessThan(requests.length * 0.2);
  });

  test('JavaScript 실행 성능', async ({ page }) => {
    // Long Task API를 사용한 긴 작업 감지
    const longTasks = await page.evaluate(() => {
      return new Promise<Array<{ startTime: number; duration: number }>>((resolve) => {
        const tasks: Array<{ startTime: number; duration: number }> = [];

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // 50ms 이상의 긴 작업
              tasks.push({
                startTime: entry.startTime,
                duration: entry.duration
              });
            }
          }
        });

        observer.observe({ entryTypes: ['longtask'] });

        // 3초 동안 모니터링
        setTimeout(() => {
          observer.disconnect();
          resolve(tasks);
        }, 3000);
      });
    });

    console.log('Long Tasks:', longTasks);

    // 100ms 이상의 매우 긴 작업은 없어야 함
    const veryLongTasks = longTasks.filter(task => task.duration > 100);
    expect(veryLongTasks.length).toBe(0);
  });

  test('반응형 디자인 성능', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // 각 뷰포트에서의 렌더링 시간 측정
      const renderTime = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const start = performance.now();
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const end = performance.now();
              resolve(end - start);
            });
          });
        });
      });

      console.log(`${viewport.name} (${viewport.width}x${viewport.height}): ${renderTime}ms`);
      expect(renderTime).toBeLessThan(100); // 모든 뷰포트에서 100ms 이내 렌더링
    }
  });

  test('Web Vitals 측정', async ({ page }) => {
    // Core Web Vitals 측정
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};

        // CLS (Cumulative Layout Shift) 측정
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });

        // FID (First Input Delay) 측정
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            vitals.fid = (entry as any).processingStart - entry.startTime;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // 3초 후 결과 수집
        setTimeout(() => {
          vitals.cls = clsValue;
          observer.disconnect();
          fidObserver.disconnect();
          resolve(vitals);
        }, 3000);
      });
    });

    console.log('Web Vitals:', webVitals);

    // CLS는 0.1 미만이어야 좋은 점수
    if (webVitals.cls !== undefined) {
      expect(webVitals.cls).toBeLessThan(0.1);
    }

    // FID는 100ms 미만이어야 좋은 점수
    if (webVitals.fid !== undefined) {
      expect(webVitals.fid).toBeLessThan(100);
    }
  });

  test('배터리 효율성 (지원되는 경우)', async ({ page }) => {
    // 배터리 상태 확인 (지원되는 브라우저에서만)
    const batteryInfo = await page.evaluate(() => {
      return new Promise((resolve) => {
        if ('getBattery' in navigator) {
          (navigator as any).getBattery().then((battery: any) => {
            resolve({
              charging: battery.charging,
              level: battery.level,
              dischargingTime: battery.dischargingTime
            });
          });
        } else {
          resolve(null);
        }
      });
    });

    if (batteryInfo) {
      console.log('Battery Info:', batteryInfo);

      // 배터리가 방전 중이고 20% 미만인 경우 경고
      if (!(batteryInfo as any).charging && (batteryInfo as any).level < 0.2) {
        console.warn('Low battery detected, performance may be affected');
      }
    }
  });
});
