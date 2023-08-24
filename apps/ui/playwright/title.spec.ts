import { test, expect } from '@playwright/test';

test('has title F2023', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/F2023/);
});
