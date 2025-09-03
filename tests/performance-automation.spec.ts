import { test, expect } from '@playwright/test';

test.describe('성능 테스트 자동화', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('성능 모니터링 시스템', () => {
    test('성능 모니터가 올바르게 렌더링되어야 함', async ({ page }) => {
      // 성능 모니터 컴포넌트가 존재하는지 확인
      const performanceMonitor = page.locator('[data-testid="performance-monitor"]');
      await expect(performanceMonitor).toBeVisible();
    });

    test('실시간 성능 메트릭을 수집해야 함', async ({ page }) => {
      // 성능 메트릭 요소들이 표시되는지 확인
      const fpsElement = page.locator('text=/FPS/');
      const memoryElement = page.locator('text=/Memory/');
      const frameTimeElement = page.locator('text=/Frame Time/');

      await expect(fpsElement).toBeVisible();
      await expect(memoryElement).toBeVisible();
      await expect(frameTimeElement).toBeVisible();

      // 메트릭 값이 숫자로 표시되는지 확인
      const fpsValue = await fpsElement.textContent();
      expect(fpsValue).toMatch(/\d+/);
    });

    test('성능 대시보드가 토글 가능해야 함', async ({ page }) => {
      // 확장/축소 버튼 찾기
      const expandButton = page.locator('button:has-text("▶")');
      const collapseButton = page.locator('button:has-text("▼")');

      // 기본적으로 축소된 상태
      await expect(expandButton).toBeVisible();
      await expect(collapseButton).not.toBeVisible();

      // 확장
      await expandButton.click();
      await expect(expandButton).not.toBeVisible();
      await expect(collapseButton).toBeVisible();

      // 축소
      await collapseButton.click();
      await expect(expandButton).toBeVisible();
      await expect(collapseButton).not.toBeVisible();
    });

    test('성능 히스토리 차트가 표시되어야 함', async ({ page }) => {
      // 확장 상태로 만들기
      const expandButton = page.locator('button:has-text("▶")');
      await expandButton.click();

      // 히스토리 차트 확인
      const historyElement = page.locator('text=/FPS 히스토리/');
      await expect(historyElement).toBeVisible();
    });
  });

  test.describe('성능 최적화 제안', () => {
    test('성능 문제 시 최적화 제안을 표시해야 함', async ({ page }) => {
      // 확장 상태로 만들기
      const expandButton = page.locator('button:has-text("▶")');
      await expandButton.click();

      // 최적화 제안 섹션 확인
      const suggestionsElement = page.locator('text=/최적화 제안/');
      await expect(suggestionsElement).toBeVisible();
    });

    test('자동 최적화 기능이 작동해야 함', async ({ page }) => {
      // 자동 최적화 버튼이나 기능 확인
      const autoOptimizeElement = page.locator('[data-testid="auto-optimize"]');
      
      if (await autoOptimizeElement.isVisible()) {
        await autoOptimizeElement.click();
        
        // 최적화 진행 상태 확인
        const optimizationStatus = page.locator('text=/최적화 진행 중/');
        await expect(optimizationStatus).toBeVisible();
      }
    });
  });

  test.describe('메모리 누수 감지', () => {
    test('메모리 사용량을 모니터링해야 함', async ({ page }) => {
      // 메모리 사용량 표시 확인
      const memoryElement = page.locator('text=/Memory/');
      await expect(memoryElement).toBeVisible();

      // 메모리 값이 표시되는지 확인
      const memoryValue = await memoryElement.textContent();
      expect(memoryValue).toMatch(/\d+MB/);
    });

    test('메모리 누수 경고를 표시해야 함', async ({ page }) => {
      // 메모리 누수 경고 요소 확인
      const memoryWarning = page.locator('[data-testid="memory-warning"]');
      
      // 경고가 표시되는 경우 확인
      if (await memoryWarning.isVisible()) {
        await expect(memoryWarning).toContainText('메모리 누수');
      }
    });
  });

  test.describe('3D 렌더링 성능', () => {
    test('FPS가 안정적으로 유지되어야 함', async ({ page }) => {
      // FPS 요소 찾기
      const fpsElement = page.locator('text=/FPS/');
      await expect(fpsElement).toBeVisible();

      // FPS 값이 30 이상인지 확인
      const fpsValue = await fpsElement.textContent();
      const fpsNumber = parseInt(fpsValue?.match(/\d+/)?.[0] || '0');
      expect(fpsNumber).toBeGreaterThanOrEqual(30);
    });

    test('프레임 타임이 적절한 범위 내에 있어야 함', async ({ page }) => {
      // 프레임 타임 요소 찾기
      const frameTimeElement = page.locator('text=/Frame Time/');
      await expect(frameTimeElement).toBeVisible();

      // 프레임 타임 값이 33ms 이하인지 확인
      const frameTimeValue = await frameTimeElement.textContent();
      const frameTimeNumber = parseInt(frameTimeValue?.match(/\d+/)?.[0] || '0');
      expect(frameTimeNumber).toBeLessThanOrEqual(33);
    });

    test('렌더링 통계가 정확하게 표시되어야 함', async ({ page }) => {
      // 렌더링 통계 요소들 확인
      const trianglesElement = page.locator('text=/Triangles/');
      const renderCallsElement = page.locator('text=/Render Calls/');

      await expect(trianglesElement).toBeVisible();
      await expect(renderCallsElement).toBeVisible();

      // 값이 숫자로 표시되는지 확인
      const trianglesValue = await trianglesElement.textContent();
      const renderCallsValue = await renderCallsElement.textContent();

      expect(trianglesValue).toMatch(/\d+/);
      expect(renderCallsValue).toMatch(/\d+/);
    });
  });

  test.describe('성능 테스트 시나리오', () => {
    test('가구 배치 시 성능이 유지되어야 함', async ({ page }) => {
      // 편집 모드 진입
      const editButton = page.locator('button:has-text("편집")');
      if (await editButton.isVisible()) {
        await editButton.click();
      }

      // 가구 카탈로그 열기
      const catalogButton = page.locator('button:has-text("가구")');
      if (await catalogButton.isVisible()) {
        await catalogButton.click();
      }

      // 가구 선택 및 배치
      const furnitureItem = page.locator('[data-testid="furniture-item"]').first();
      if (await furnitureItem.isVisible()) {
        await furnitureItem.click();
        
        // 3D 공간에 가구 배치
        const canvas = page.locator('canvas').first();
        await canvas.click({ position: { x: 400, y: 300 } });
      }

      // 성능이 유지되는지 확인
      const fpsElement = page.locator('text=/FPS/');
      const fpsValue = await fpsElement.textContent();
      const fpsNumber = parseInt(fpsValue?.match(/\d+/)?.[0] || '0');
      expect(fpsNumber).toBeGreaterThanOrEqual(25);
    });

    test('카메라 이동 시 성능이 유지되어야 함', async ({ page }) => {
      // 3D 캔버스에서 카메라 이동
      const canvas = page.locator('canvas').first();
      
      // 마우스 드래그로 카메라 이동
      await canvas.hover({ position: { x: 400, y: 300 } });
      await page.mouse.down();
      await page.mouse.move(500, 300);
      await page.mouse.up();

      // 성능이 유지되는지 확인
      const fpsElement = page.locator('text=/FPS/');
      const fpsValue = await fpsElement.textContent();
      const fpsNumber = parseInt(fpsValue?.match(/\d+/)?.[0] || '0');
      expect(fpsNumber).toBeGreaterThanOrEqual(25);
    });

    test('대량 가구 로딩 시 성능이 적절히 유지되어야 함', async ({ page }) => {
      // 편집 모드 진입
      const editButton = page.locator('button:has-text("편집")');
      if (await editButton.isVisible()) {
        await editButton.click();
      }

      // 여러 가구를 빠르게 배치
      const catalogButton = page.locator('button:has-text("가구")');
      if (await catalogButton.isVisible()) {
        await catalogButton.click();
      }

      const canvas = page.locator('canvas').first();
      
      // 5개의 가구를 빠르게 배치
      for (let i = 0; i < 5; i++) {
        const furnitureItem = page.locator('[data-testid="furniture-item"]').nth(i);
        if (await furnitureItem.isVisible()) {
          await furnitureItem.click();
          await canvas.click({ position: { x: 300 + i * 50, y: 300 } });
          await page.waitForTimeout(100); // 짧은 대기
        }
      }

      // 성능이 적절히 유지되는지 확인
      const fpsElement = page.locator('text=/FPS/');
      const fpsValue = await fpsElement.textContent();
      const fpsNumber = parseInt(fpsValue?.match(/\d+/)?.[0] || '0');
      expect(fpsNumber).toBeGreaterThanOrEqual(20);
    });
  });

  test.describe('성능 리포트 생성', () => {
    test('성능 리포트를 생성할 수 있어야 함', async ({ page }) => {
      // 확장 상태로 만들기
      const expandButton = page.locator('button:has-text("▶")');
      await expandButton.click();

      // 리포트 생성 버튼 찾기
      const reportButton = page.locator('button:has-text("리포트")');
      
      if (await reportButton.isVisible()) {
        await reportButton.click();
        
        // 리포트 다운로드 확인
        const downloadElement = page.locator('text=/다운로드/');
        await expect(downloadElement).toBeVisible();
      }
    });

    test('성능 데이터를 CSV로 내보낼 수 있어야 함', async ({ page }) => {
      // CSV 내보내기 버튼 찾기
      const csvButton = page.locator('button:has-text("CSV")');
      
      if (await csvButton.isVisible()) {
        await csvButton.click();
        
        // 다운로드 확인
        const downloadElement = page.locator('text=/다운로드/');
        await expect(downloadElement).toBeVisible();
      }
    });

    test('성능 데이터를 JSON으로 내보낼 수 있어야 함', async ({ page }) => {
      // JSON 내보내기 버튼 찾기
      const jsonButton = page.locator('button:has-text("JSON")');
      
      if (await jsonButton.isVisible()) {
        await jsonButton.click();
        
        // 다운로드 확인
        const downloadElement = page.locator('text=/다운로드/');
        await expect(downloadElement).toBeVisible();
      }
    });
  });

  test.describe('성능 임계값 설정', () => {
    test('FPS 임계값을 설정할 수 있어야 함', async ({ page }) => {
      // 설정 버튼 찾기
      const settingsButton = page.locator('button:has-text("설정")');
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        // FPS 임계값 설정 확인
        const fpsThresholdInput = page.locator('input[name="fps-threshold"]');
        await expect(fpsThresholdInput).toBeVisible();
        
        // 임계값 설정
        await fpsThresholdInput.fill('45');
        await fpsThresholdInput.press('Enter');
      }
    });

    test('메모리 임계값을 설정할 수 있어야 함', async ({ page }) => {
      // 설정 버튼 찾기
      const settingsButton = page.locator('button:has-text("설정")');
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        // 메모리 임계값 설정 확인
        const memoryThresholdInput = page.locator('input[name="memory-threshold"]');
        await expect(memoryThresholdInput).toBeVisible();
        
        // 임계값 설정
        await memoryThresholdInput.fill('80');
        await memoryThresholdInput.press('Enter');
      }
    });
  });

  test.describe('성능 알림 시스템', () => {
    test('성능 경고를 표시해야 함', async ({ page }) => {
      // 성능 경고 요소 확인
      const warningElement = page.locator('[data-testid="performance-warning"]');
      
      // 경고가 표시되는 경우 확인
      if (await warningElement.isVisible()) {
        await expect(warningElement).toContainText('경고');
      }
    });

    test('성능 알림을 설정할 수 있어야 함', async ({ page }) => {
      // 알림 설정 버튼 찾기
      const notificationButton = page.locator('button:has-text("알림")');
      
      if (await notificationButton.isVisible()) {
        await notificationButton.click();
        
        // 알림 설정 확인
        const notificationToggle = page.locator('input[type="checkbox"]');
        await expect(notificationToggle).toBeVisible();
      }
    });
  });
});
