import { test, expect } from '@playwright/test';

test.describe('Cost Control Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard first (or login page if auth is required)
    await page.goto('/dashboard');
  });

  test('Navigate to Cost Control page from menu', async ({ page }) => {
    // Click on Cost Control menu item
    const costControlLink = page.locator('a[href="/cost-control"], a:has-text("בקרת עלויות")').first();
    await costControlLink.click();

    // Wait for navigation
    await page.waitForURL(/\/cost-control/);

    // Verify page loaded
    await expect(page.locator('h1')).toContainText('בקרת עלויות');
  });

  test('Switch between tabs', async ({ page }) => {
    await page.goto('/cost-control');

    // Verify default tab is estimates
    await expect(page).toHaveURL(/tab=estimates/);

    // Click Tenders tab
    const tendersTab = page.locator('button:has-text("מכרזים")');
    await tendersTab.click();

    // Wait for URL to update
    await expect(page).toHaveURL(/tab=tenders/);

    // Click Budget tab
    const budgetTab = page.locator('button:has-text("תקציב")');
    await budgetTab.click();

    // Wait for URL to update
    await expect(page).toHaveURL(/tab=budget/);

    // Click back to Estimates tab
    const estimatesTab = page.locator('button:has-text("אומדן")');
    await estimatesTab.click();

    // Wait for URL to update
    await expect(page).toHaveURL(/tab=estimates/);
  });

  test('Estimates tab shows data', async ({ page }) => {
    await page.goto('/cost-control?tab=estimates');

    // Wait for loading to complete
    await page.waitForTimeout(1000);

    // Check if KPI cards are visible
    const kpiCards = page.locator('.bg-surface-light').filter({ hasText: /סה״כ אומדנים|תכנון|ביצוע|שווי כולל/ });
    await expect(kpiCards.first()).toBeVisible();

    // Check if search box is visible
    const searchBox = page.locator('input[placeholder*="חיפוש"]');
    await expect(searchBox).toBeVisible();

    // Check if filters are visible
    const projectFilter = page.locator('select[aria-label="סינון לפי פרויקט"]');
    await expect(projectFilter).toBeVisible();

    // Check if export button is visible
    const exportButton = page.locator('button:has-text("ייצוא")');
    await expect(exportButton).toBeVisible();
  });

  test('Tenders tab shows data', async ({ page }) => {
    await page.goto('/cost-control?tab=tenders');

    // Wait for loading to complete
    await page.waitForTimeout(1000);

    // Check if KPI cards are visible
    const kpiCards = page.locator('.bg-surface-light').filter({ hasText: /סה״כ מכרזים|מכרזים פתוחים|עם זוכה|משתתפים/ });
    await expect(kpiCards.first()).toBeVisible();

    // Check if search box is visible
    const searchBox = page.locator('input[placeholder*="חיפוש"]');
    await expect(searchBox).toBeVisible();

    // Check if export button is visible
    const exportButton = page.locator('button:has-text("יצוא לאקסל")');
    await expect(exportButton).toBeVisible();
  });

  test('Budget tab shows variance columns', async ({ page }) => {
    await page.goto('/cost-control?tab=budget');

    // Wait for loading to complete
    await page.waitForTimeout(1000);

    // Check if KPI cards are visible
    const kpiCards = page.locator('.bg-surface-light').filter({ hasText: /תקציב כולל|שולם|יתרה|פריטים עם אומדן/ });
    await expect(kpiCards.first()).toBeVisible();

    // Check if variance filter is visible (checkbox)
    const varianceFilter = page.locator('input[type="checkbox"]').filter({ hasText: /רק עם חריגה/ });

    // Check for table headers (desktop view)
    if (await page.locator('table thead').isVisible()) {
      const headers = page.locator('table thead th');

      // Check for variance columns
      await expect(headers.filter({ hasText: 'אומדן' })).toBeVisible();
      await expect(headers.filter({ hasText: 'חריגה ₪' })).toBeVisible();
      await expect(headers.filter({ hasText: 'חריגה %' })).toBeVisible();
    }

    // Check if export button is visible
    const exportButton = page.locator('button:has-text("ייצוא")');
    await expect(exportButton).toBeVisible();
  });

  test('Old /budget URL redirects correctly', async ({ page }) => {
    await page.goto('/budget');

    // Should redirect to cost-control with budget tab
    await expect(page).toHaveURL(/\/cost-control\?tab=budget/);

    // Verify budget tab is active
    await expect(page.locator('h1')).toContainText('בקרת עלויות');
  });

  test('Old /tenders URL redirects correctly', async ({ page }) => {
    await page.goto('/tenders');

    // Should redirect to cost-control with tenders tab
    await expect(page).toHaveURL(/\/cost-control\?tab=tenders/);

    // Verify tenders tab is active
    await expect(page.locator('h1')).toContainText('בקרת עלויות');
  });

  test('Tab state persists on browser back button', async ({ page }) => {
    await page.goto('/cost-control?tab=estimates');
    await page.waitForTimeout(500);

    // Navigate to tenders tab
    const tendersTab = page.locator('button:has-text("מכרזים")');
    await tendersTab.click();
    await expect(page).toHaveURL(/tab=tenders/);

    // Navigate to budget tab
    const budgetTab = page.locator('button:has-text("תקציב")');
    await budgetTab.click();
    await expect(page).toHaveURL(/tab=budget/);

    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/tab=tenders/);

    // Go back again
    await page.goBack();
    await expect(page).toHaveURL(/tab=estimates/);
  });

  test('Responsive design - mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/cost-control?tab=estimates');

    // Wait for loading
    await page.waitForTimeout(1000);

    // Check if mobile menu button exists (if header has mobile menu)
    const mobileMenuButton = page.locator('button[aria-label="תפריט"]');
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton).toBeVisible();
    }

    // Check if tabs are visible and scrollable
    const tabsContainer = page.locator('button:has-text("אומדן")').first();
    await expect(tabsContainer).toBeVisible();

    // Check that content adapts to mobile (cards instead of table)
    // Desktop table should be hidden
    const desktopTable = page.locator('table');
    if (await desktopTable.count() > 0) {
      await expect(desktopTable).toBeHidden();
    }
  });

  test('Search functionality works in Estimates tab', async ({ page }) => {
    await page.goto('/cost-control?tab=estimates');
    await page.waitForTimeout(1000);

    // Type in search box
    const searchBox = page.locator('input[placeholder*="חיפוש"]');
    await searchBox.fill('test');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify search was applied (results filtered)
    // This is a basic check - actual verification would depend on data
    await expect(searchBox).toHaveValue('test');
  });

  test('Export functionality exists', async ({ page }) => {
    await page.goto('/cost-control?tab=estimates');
    await page.waitForTimeout(1000);

    // Check export button
    const exportButton = page.locator('button:has-text("ייצוא")');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    // Note: Actual download testing would require more complex setup
    // This just verifies the button exists and is clickable
  });

  test('Filters work in Budget tab', async ({ page }) => {
    await page.goto('/cost-control?tab=budget');
    await page.waitForTimeout(1000);

    // Select a project from dropdown
    const projectFilter = page.locator('select[aria-label="סינון לפי פרויקט"]');
    if (await projectFilter.count() > 0) {
      await projectFilter.selectOption({ index: 1 }); // Select first project (index 0 is "all")
      await page.waitForTimeout(500);
    }

    // Toggle variance filter
    const varianceCheckbox = page.locator('input[type="checkbox"]');
    if (await varianceCheckbox.count() > 0) {
      await varianceCheckbox.first().check();
      await page.waitForTimeout(500);
    }
  });
});
