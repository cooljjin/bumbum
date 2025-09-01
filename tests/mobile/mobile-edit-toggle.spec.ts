import { test, expect } from '@playwright/test';

test('모바일에서 편집 모드 토글 버튼이 보이고 전환된다', async ({ page }) => {
  const viewport = page.viewportSize();
  if (!viewport || viewport.width > 600) {
    test.skip(true, '모바일 뷰에서만 실행');
  }

  await page.goto('/');

  const editBtn = page.getByTestId('mobile-edit-toggle');
  await expect(editBtn).toBeVisible();
  await editBtn.click();

  const viewBtn = page.getByTestId('mobile-view-toggle');
  await expect(viewBtn).toBeVisible();

  await viewBtn.click();
  await expect(page.getByTestId('mobile-edit-toggle')).toBeVisible();
});

