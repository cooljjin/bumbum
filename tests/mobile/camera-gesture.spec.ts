import { test, expect } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

test.describe('모바일 - 캔버스 터치/드래그 시 카메라 시점 이동', () => {
  test('캔버스 드래그로 뷰가 변한다(스크린샷 픽셀 차이 비교)', async ({ page }) => {
    // 모바일 프로젝트에서 실행되도록 가정(Mobile Chrome/iPhone 12 등)
    await page.goto('/');

    // 캔버스가 뜰 때까지 대기
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // 초기 스크린샷 캡처
    const beforeBuf = await page.screenshot({ fullPage: false });
    const beforePng = PNG.sync.read(beforeBuf);

    // 캔버스 중앙에서 좌우로 드래그(회전)
    const box = await canvas.boundingBox();
    if (!box) test.fail(true, '캔버스 영역을 찾지 못함');
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 120, startY, { steps: 10 });
    await page.mouse.up();

    // 약간의 렌더 안정화 대기
    await page.waitForTimeout(400);

    // 이후 스크린샷 캡처
    const afterBuf = await page.screenshot({ fullPage: false });
    const afterPng = PNG.sync.read(afterBuf);

    // 캔버스 뷰가 변경되면 픽셀 차이가 일정 이상 발생
    const { width, height } = beforePng;
    const diff = new PNG({ width, height });
    const diffPixels = pixelmatch(beforePng.data, afterPng.data, diff.data, width, height, {
      threshold: 0.1,
    });

    expect(diffPixels).toBeGreaterThan(500); // 최소 변화 픽셀 수 임계값
  });
});
