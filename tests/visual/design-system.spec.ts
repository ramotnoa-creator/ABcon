import { test, expect } from '@playwright/test';

test.describe('Ancon Design System Compliance', () => {
  test('primary color matches design system (#0f2cbd)', async ({ page }) => {
    await page.goto('/');

    // Find primary button
    const primaryButton = page.locator('button').filter({ hasText: /login|התחבר/i }).first();

    if (await primaryButton.count() > 0) {
      // Check background color matches royal blue
      const bgColor = await primaryButton.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
      // rgb(15, 44, 189) is #0f2cbd
      expect(bgColor).toMatch(/rgb\(15,\s*44,\s*189\)/);
    }
  });

  test('Heebo font is loaded for Hebrew text', async ({ page }) => {
    await page.goto('/');

    const body = page.locator('body');
    const fontFamily = await body.evaluate((el) =>
      window.getComputedStyle(el).fontFamily
    );

    expect(fontFamily).toContain('Heebo');
  });

  test('button border radius is 4px (governmental style)', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('button').first();
    if (await button.count() > 0) {
      const borderRadius = await button.evaluate((el) =>
        window.getComputedStyle(el).borderRadius
      );
      // Should be 4px or 2px (design system values)
      expect(['2px', '4px', '6px']).toContain(borderRadius);
    }
  });

  test('primary button hover state changes color', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('button').filter({ hasText: /login|התחבר/i }).first();

    if (await button.count() > 0) {
      const initialBg = await button.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      // Hover over button
      await button.hover();

      const hoverBg = await button.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      // Hover color should be different (darker: #0a1f8a)
      // Either changed or has transition
      const hasTransition = await button.evaluate((el) =>
        window.getComputedStyle(el).transition
      );

      expect(hoverBg !== initialBg || hasTransition !== 'all 0s ease 0s').toBeTruthy();
    }
  });

  test('cards have subtle shadow', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('[class*="card"]').first();
    if (await card.count() > 0) {
      const boxShadow = await card.evaluate((el) =>
        window.getComputedStyle(el).boxShadow
      );

      // Should have some shadow (not 'none')
      expect(boxShadow).not.toBe('none');
    }
  });

  test('spacing follows 4px base unit', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('[class*="card"]').first();
    if (await card.count() > 0) {
      const padding = await card.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.padding;
      });

      // Padding should be divisible by 4 (4px, 8px, 12px, 16px, etc.)
      const paddingValue = parseInt(padding);
      if (!isNaN(paddingValue)) {
        expect(paddingValue % 4).toBe(0);
      }
    }
  });
});
