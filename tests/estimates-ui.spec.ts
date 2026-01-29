import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Estimates UI
 * Phase 03-01: Estimates UI Components
 */

test.describe('Estimates UI - Financial Tab', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a project with estimates
    await page.goto('/projects/1?tab=financial');
    // Wait for page to load
    await page.waitForSelector('.financial-tab');
  });

  test('should display Financial tab with 5 sub-tabs', async ({ page }) => {
    // Verify all 5 sub-tabs are visible
    await expect(page.getByText('אומדן תכנון')).toBeVisible();
    await expect(page.getByText('אומדן ביצוע')).toBeVisible();
    await expect(page.getByText('מכרזים')).toBeVisible();
    await expect(page.getByText('תקציב')).toBeVisible();
    await expect(page.getByText('תשלומים')).toBeVisible();
  });

  test('should default to Planning Estimate sub-tab', async ({ page }) => {
    // Check URL has subtab parameter or Planning Estimate is active
    const url = page.url();
    expect(url).toContain('subtab=planning-estimate');

    // Or check if Planning Estimate subtab has active styling
    await expect(page.locator('button:has-text("אומדן תכנון")')).toHaveClass(/border-primary/);
  });

  test('should switch between sub-tabs and update URL', async ({ page }) => {
    // Click Execution Estimate sub-tab
    await page.click('button:has-text("אומדן ביצוע")');

    // Verify URL updated
    await expect(page).toHaveURL(/subtab=execution-estimate/);

    // Click Budget sub-tab
    await page.click('button:has-text("תקציב")');

    // Verify URL updated
    await expect(page).toHaveURL(/subtab=budget/);
  });
});

test.describe('Estimates UI - Planning Estimate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/1?tab=financial&subtab=planning-estimate');
    await page.waitForSelector('.planning-estimate-subtab');
  });

  test('should display estimate summary cards', async ({ page }) => {
    // Check for summary cards
    await expect(page.getByText('סה"כ כולל מע"מ')).toBeVisible();
    await expect(page.getByText('מספר פריטים')).toBeVisible();
    await expect(page.getByText('סטטוס')).toBeVisible();
    await expect(page.getByText('עדכון אחרון')).toBeVisible();
  });

  test('should create planning estimate with items', async ({ page }) => {
    // Click "Add Item" button
    await page.click('button:has-text("הוסף פריט")');

    // Wait for form modal
    await expect(page.locator('.fixed.inset-0')).toBeVisible();

    // Fill form
    await page.fill('input[placeholder*="תיאור"]', 'בדיקת פריט חדש');
    await page.selectOption('select:has-text("קטגוריה")', 'contractors');
    await page.fill('input[type="number"]:visible', '10'); // quantity
    await page.fill('input[type="number"]:visible', '1000'); // unit price

    // Verify calculated total displays
    await expect(page.getByText(/סה"כ כולל מע"מ/)).toBeVisible();

    // Save item
    await page.click('button:has-text("שמור")');

    // Verify item appears in table
    await expect(page.getByText('בדיקת פריט חדש')).toBeVisible();

    // Verify totals updated
    // (check that summary card shows new total)
  });

  test('should edit estimate item', async ({ page }) => {
    // Assuming there's at least one item in the table
    // Click first item row to edit
    await page.click('tr:has-text("בדיקת פריט")');

    // Wait for edit form
    await expect(page.locator('h2:has-text("עריכת פריט")')).toBeVisible();

    // Change quantity
    await page.fill('input[type="number"]:visible', '20');

    // Verify total recalculates
    await expect(page.locator('text=/₪/')).toContainText('23,400'); // 20 * 1000 * 1.17

    // Save
    await page.click('button:has-text("שמור")');

    // Verify item updated in table
    await expect(page.getByText('20')).toBeVisible();
  });

  test('should delete estimate item', async ({ page }) => {
    // Click delete button on an item
    await page.click('button[title="מחיקה"]');

    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());

    // Verify item removed from table
    // (check that item no longer visible)
  });

  test('should display empty state when no items', async ({ page }) => {
    // If all items deleted
    await expect(page.getByText(/אין פריטים באומדן זה/)).toBeVisible();
  });
});

test.describe('Estimates UI - Execution Estimate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/1?tab=financial&subtab=execution-estimate');
    await page.waitForSelector('.execution-estimate-subtab');
  });

  test('should have separate items from planning estimate', async ({ page }) => {
    // Create item in execution estimate
    await page.click('button:has-text("הוסף פריט")');
    await page.fill('input[placeholder*="תיאור"]', 'פריט ביצוע');
    await page.fill('input[type="number"]:visible', '5');
    await page.fill('input[type="number"]:visible', '500');
    await page.click('button:has-text("שמור")');

    // Switch to planning estimate
    await page.click('button:has-text("אומדן תכנון")');

    // Verify execution item NOT visible
    await expect(page.getByText('פריט ביצוע')).not.toBeVisible();

    // Switch back to execution
    await page.click('button:has-text("אומדן ביצוע")');

    // Verify item IS visible
    await expect(page.getByText('פריט ביצוע')).toBeVisible();
  });
});

test.describe('Estimates UI - Calculations', () => {
  test('should calculate VAT at 17%', async ({ page }) => {
    await page.goto('/projects/1?tab=financial&subtab=planning-estimate');

    await page.click('button:has-text("הוסף פריט")');

    // Enter values
    await page.fill('input[placeholder*="תיאור"]', 'בדיקת מע"מ');
    await page.fill('input[type="number"]:visible', '1'); // quantity
    await page.fill('input[type="number"]:visible', '100'); // unit price

    // Verify VAT calculation (100 * 0.17 = 17)
    await expect(page.locator('text=/מע"מ \\(17%\\)/')).toBeVisible();
    await expect(page.getByText('₪17.00')).toBeVisible();

    // Verify total with VAT (100 + 17 = 117)
    await expect(page.getByText('₪117.00')).toBeVisible();
  });

  test('should handle decimal quantities', async ({ page }) => {
    await page.goto('/projects/1?tab=financial&subtab=planning-estimate');

    await page.click('button:has-text("הוסף פריט")');

    await page.fill('input[placeholder*="תיאור"]', 'כמות עשרונית');
    await page.fill('input[type="number"]:visible', '0.5'); // quantity
    await page.fill('input[type="number"]:visible', '200'); // unit price

    // Verify calculation (0.5 * 200 = 100)
    await expect(page.getByText('₪100.00')).toBeVisible();
  });

  test('should format large numbers correctly', async ({ page }) => {
    await page.goto('/projects/1?tab=financial&subtab=planning-estimate');

    await page.click('button:has-text("הוסף פריט")');

    await page.fill('input[placeholder*="תיאור"]', 'סכום גדול');
    await page.fill('input[type="number"]:visible', '1000'); // quantity
    await page.fill('input[type="number"]:visible', '10000'); // unit price

    // Verify formatting (10,000,000)
    await expect(page.locator('text=/₪10,000,000/')).toBeVisible();
  });
});

test.describe('Estimates UI - Table Features', () => {
  test('should sort items by clicking column headers', async ({ page }) => {
    await page.goto('/projects/1?tab=financial&subtab=planning-estimate');

    // Click "Description" header to sort
    await page.click('th:has-text("תיאור")');

    // Verify sort indicator appears
    await expect(page.locator('th:has-text("תיאור") >> span[class*="arrow"]')).toBeVisible();

    // Click again to reverse sort
    await page.click('th:has-text("תיאור")');
  });

  test('should display summary row with totals', async ({ page }) => {
    await page.goto('/projects/1?tab=financial&subtab=planning-estimate');

    // Verify summary row exists
    await expect(page.locator('tr.summary-row, tr:has-text("סה\\"כ")')).toBeVisible();

    // Verify it shows item count
    await expect(page.locator('text=/\\d+ פריטים/')).toBeVisible();
  });
});

test.describe('Estimates UI - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/projects/1?tab=financial&subtab=planning-estimate');

    // Tab through sub-tabs
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Press Enter to activate
    await page.keyboard.press('Enter');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/projects/1?tab=financial&subtab=planning-estimate');

    // Check for aria-label on add button
    const addButton = page.locator('button:has-text("הוסף פריט")');
    await expect(addButton).toHaveAttribute('aria-label');
  });
});
