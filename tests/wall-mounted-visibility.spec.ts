import { test, expect } from '@playwright/test';

test.describe('Wall-mounted furniture visibility (door)', () => {
  test('miniroom page renders door and GLB loads without errors', async ({ page, context, browserName }) => {
    const consoleMessages: string[] = [];
    page.on('console', (msg) => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));

    const responses: Array<{ url: string; status: number }> = [];
    page.on('response', (resp) => {
      try {
        const url = resp.url();
        if (url.includes('/models/furniture/Wooden_Door_.glb')) {
          responses.push({ url, status: resp.status() });
        }
      } catch {}
    });

    await page.goto('/miniroom-test');

    // Wait for canvas
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Allow scene to initialize and any model loads to happen
    await page.waitForTimeout(2000);

    // Save a screenshot for manual verification
    await page.screenshot({ path: 'test-results/wall-mounted-door.png', fullPage: false });

    // Verify GLB for door responded 200 at least once
    const doorResponses = responses.filter(r => r.url.includes('Wooden_Door_.glb'));
    expect.soft(doorResponses.length).toBeGreaterThan(0);
    if (doorResponses.length > 0) {
      expect.soft(doorResponses.some(r => r.status === 200)).toBeTruthy();
    }

    // Check for obvious runtime errors in console
    const errorLogs = consoleMessages.filter(m => m.startsWith('[error]') || m.startsWith('[assert]'));
    expect.soft(errorLogs.length, `Console errors found:\n${consoleMessages.join('\n')}`).toBe(0);

    // Export logs to file for debugging
    await page.evaluate(([msgs]) => {
      // @ts-ignore
      window.__WALL_MOUNT_LOG__ = msgs;
      return true;
    }, [consoleMessages]);
  });
});

