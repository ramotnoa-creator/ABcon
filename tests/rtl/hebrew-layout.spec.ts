import { test, expect } from '@playwright/test';

test.describe('Hebrew RTL Layout', () => {
  test('HTML has dir="rtl" attribute', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    const dir = await html.getAttribute('dir');

    expect(dir).toBe('rtl');
  });

  test('text-align is right for RTL content', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('h1, h2, h3').first();
    if (await heading.count() > 0) {
      const textAlign = await heading.evaluate((el) =>
        window.getComputedStyle(el).textAlign
      );

      // RTL should align right (or 'start' which becomes right in RTL)
      expect(['right', 'start']).toContain(textAlign);
    }
  });

  test('navigation or sidebar positioned on right side in RTL', async ({ page }) => {
    await page.goto('/');

    // Check for navigation/sidebar
    const nav = page.locator('nav, aside, [class*="sidebar"]').first();
    if (await nav.count() > 0) {
      const position = await nav.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          right: style.right,
          left: style.left,
          float: style.float,
        };
      });

      // In RTL, sidebar should be on right (right: 0 or float: right)
      const isRTLPositioned =
        position.right === '0px' ||
        position.float === 'right' ||
        (position.left !== '0px' && position.right !== 'auto');

      expect(isRTLPositioned).toBeTruthy();
    }
  });

  test('form inputs have correct RTL text direction', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('input[type="text"], input[type="email"]').first();
    if (await input.count() > 0) {
      const direction = await input.evaluate((el) =>
        window.getComputedStyle(el).direction
      );

      expect(direction).toBe('rtl');
    }
  });

  test('Hebrew text renders correctly', async ({ page }) => {
    await page.goto('/');

    // Check if there's any Hebrew text on the page
    const body = await page.textContent('body');
    const hasHebrew = /[\u0590-\u05FF]/.test(body || '');

    // If Hebrew text exists, verify it's visible
    if (hasHebrew) {
      const hebrewElement = page.locator('text=/[\u0590-\u05FF]+/').first();
      await expect(hebrewElement).toBeVisible();
    }
  });
});
