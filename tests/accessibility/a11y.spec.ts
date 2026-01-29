import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (WCAG AA)', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('color contrast meets WCAG AA standards', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    expect(contrastViolations).toHaveLength(0);
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label') ||
                            await button.textContent();

      expect(accessibleName).toBeTruthy();
    }
  });

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/');

    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate((el) => {
        // Check for label via 'for' attribute
        if (el.id) {
          const label = document.querySelector(`label[for="${el.id}"]`);
          if (label) return true;
        }
        // Check for aria-label
        if (el.getAttribute('aria-label')) return true;
        // Check for aria-labelledby
        if (el.getAttribute('aria-labelledby')) return true;
        // Check if wrapped in label
        if (el.closest('label')) return true;

        return false;
      });

      expect(hasLabel).toBeTruthy();
    }
  });

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('button').first();
    if (await button.count() > 0) {
      await button.focus();

      const outline = await button.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline,
          outlineWidth: style.outlineWidth,
          boxShadow: style.boxShadow,
        };
      });

      // Should have either outline or box-shadow for focus
      const hasFocusIndicator =
        outline.outline !== 'none' ||
        outline.outlineWidth !== '0px' ||
        outline.boxShadow !== 'none';

      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    const initialFocus = await page.evaluate(() => document.activeElement?.tagName);

    await page.keyboard.press('Tab');
    const afterFirstTab = await page.evaluate(() => document.activeElement?.tagName);

    // Focus should have moved to an interactive element
    expect(['BUTTON', 'A', 'INPUT']).toContain(afterFirstTab);
  });

  test('page has proper heading structure', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .analyze();

    // Check for heading order violations
    const headingViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id.includes('heading')
    );

    expect(headingViolations).toHaveLength(0);
  });
});
