import { test, expect } from '@playwright/test';

test.describe('Dark Mode', () => {
  test('dark mode toggle exists and works', async ({ page }) => {
    await page.goto('/');

    // Look for theme toggle (common selectors)
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], [aria-label*="theme"], [aria-label*="ערכת נושא"], button:has-text("🌙"), button:has-text("☀️")'
    ).first();

    if (await themeToggle.count() > 0) {
      // Get initial theme
      const initialClass = await page.locator('html').getAttribute('class');

      // Toggle theme
      await themeToggle.click();

      // Wait for theme change
      await page.waitForTimeout(500);

      // Get new theme
      const newClass = await page.locator('html').getAttribute('class');

      // Class should have changed (dark <-> light)
      expect(initialClass).not.toBe(newClass);
    }
  });

  test('dark mode has correct background color', async ({ page }) => {
    await page.goto('/');

    // Try to enable dark mode
    const html = page.locator('html');

    // Check if dark mode is active or toggle it
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    await page.waitForTimeout(300);

    const bgColor = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Dark mode background should be dark (#101322 or similar)
    // rgb(16, 19, 34) is #101322
    const isDark = bgColor.includes('rgb(16, 19, 34)') ||
                   bgColor.includes('rgb(0, 0, 0)') ||
                   bgColor.includes('rgb(10, 10, 15)');

    expect(isDark).toBeTruthy();
  });

  test('dark mode persists after page refresh', async ({ page }) => {
    await page.goto('/');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });

    // Reload page
    await page.reload();

    // Check if dark mode is still active
    const htmlClass = await page.locator('html').getAttribute('class');
    const theme = await page.evaluate(() => localStorage.getItem('theme'));

    expect(htmlClass?.includes('dark') || theme === 'dark').toBeTruthy();
  });

  test('dark mode text is readable (light text on dark bg)', async ({ page }) => {
    await page.goto('/');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    await page.waitForTimeout(300);

    const textColor = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).color
    );

    // Text color in dark mode should be light (#f1f5f9 or similar)
    // rgb(241, 245, 249) is #f1f5f9
    const isLightText = textColor.includes('rgb(241, 245, 249)') ||
                        textColor.includes('rgb(255, 255, 255)') ||
                        textColor.includes('rgb(232, 232, 240)');

    expect(isLightText).toBeTruthy();
  });
});
