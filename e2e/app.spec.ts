import { test, expect, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page) {
  // Wait for the short screen-transition animation to finish so its temporary
  // translateX does not look like a real layout overflow.
  await page.locator('.page-transition').evaluate(async element => {
    await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => undefined)));
  });
  const dimensions = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll('body *')].map(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        text: (element.textContent || '').trim().slice(0, 45),
        left: Math.round(rect.left * 10) / 10,
        right: Math.round(rect.right * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        position: style.position,
        transform: style.transform,
        overflowX: style.overflowX,
      };
    }).filter(element => element.right > viewport + 1 || element.left < -1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 12);
    return {
      viewport,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      offenders,
    };
  });
  expect(dimensions.document, `document overflow: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.body, `body overflow: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.evaluate(() => {
    localStorage.removeItem('noor_tasbih_session');
    localStorage.removeItem('noor_tasbih_store');
  });
});

test('main tabs remain usable without horizontal overflow on phone and tablet widths', async ({ page }) => {
  for (const width of [320, 340, 360, 375, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 800 });
    for (const label of ['خانه', 'ذکرشمار', 'ذکرها', 'یادآوری', 'تنظیمات']) {
      const tab = page.getByRole('button', { name: label, exact: true });
      await expect(tab).toBeVisible();
      await tab.click();
      await expectNoHorizontalOverflow(page);
    }
  }
});

test('tasbih starts, increments, and persists its count across navigation', async ({ page }) => {
  await page.getByRole('button', { name: 'ذکرشمار', exact: true }).click();
  await expect(page.getByText('ذکر دلت رو انتخاب کن')).toBeVisible();
  await page.getByRole('button').filter({ hasText: 'بار' }).first().click();
  const countButton = page.getByRole('button', { name: 'افزودن یک شمارش ذکر' });
  await expect(countButton).toBeVisible();
  await countButton.click();
  await expect(countButton.getByText('۱')).toBeVisible();
  await page.getByRole('button', { name: 'خانه', exact: true }).click();
  await page.getByRole('button', { name: 'ذکرشمار', exact: true }).click();
  await expect(countButton.getByText('۱')).toBeVisible();
});

test('custom dhikr form validates empty input instead of crashing', async ({ page }) => {
  await page.getByRole('button', { name: 'ذکرشمار', exact: true }).click();
  await page.getByRole('button', { name: '+ افزودن ذکر دلخواه' }).click();
  await page.getByRole('button', { name: 'ذخیره و شروع ذکر' }).click();
  await expect(page.getByText('متن ذکر را وارد کن.')).toBeVisible();
});

test('switching between screens does not throw uncaught page errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  for (const label of ['ذکرشمار', 'ذکرها', 'یادآوری', 'تنظیمات', 'خانه']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expectNoHorizontalOverflow(page);
  }
  expect(pageErrors).toEqual([]);
});
