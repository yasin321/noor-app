import { test, expect, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
  });
  expect(overflow).toBe(false);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('noor_tutorial_seen_v1', 'true');
    localStorage.setItem('noor_notif_onboarding_prompted_v1', 'true');
  });
});

test('main tabs remain usable without horizontal overflow on phone and tablet widths', async ({ page }) => {
  await page.goto('/');
  for (const label of ['خانه', 'ذکرشمار', 'ذکرها', 'یادآوری', 'تنظیمات']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expectNoHorizontalOverflow(page);
  }
});

test('tasbih starts, increments, and persists its count across navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ذکرشمار', exact: true }).click();
  const tapBtn = page.getByRole('button', { name: 'افزودن یک شمارش ذکر' });
  await expect(tapBtn).toBeVisible();
  await tapBtn.click();
  await page.getByRole('button', { name: 'خانه', exact: true }).click();
  await page.getByRole('button', { name: 'ذکرشمار', exact: true }).click();
  await expect(tapBtn).toContainText('۱');
});

test('custom dhikr modal opens in library screen without crashing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ذکرها', exact: true }).click();
  await page.getByRole('button', { name: /یادداشت سخنرانی/ }).click();
  await expect(page.getByText('ثبت نکته سخنرانی یا ذکر شخصی')).toBeVisible();
});

test('switching between screens does not throw uncaught page errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  for (const label of ['خانه', 'تنظیمات', 'یادآوری', 'ذکرها', 'ذکرشمار']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expectNoHorizontalOverflow(page);
  }
  expect(pageErrors).toEqual([]);
});