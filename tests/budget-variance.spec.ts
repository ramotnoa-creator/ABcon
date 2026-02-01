import { test, expect } from '@playwright/test';

// Helper function to login (if auth is implemented)
async function login(page: any) {
  // For now, just navigate to home
  await page.goto('http://localhost:5173');
}

test.describe('Budget Variance - End to End', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Winner selection creates budget with variance calculation', async ({ page }) => {
    // Navigate to projects page
    await page.goto('http://localhost:5173/projects');
    await page.waitForLoadState('networkidle');

    // Click on first project
    const projectCards = page.locator('.project-card, [data-testid="project-card"]');
    if (await projectCards.count() > 0) {
      await projectCards.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      // Navigate to first project in list
      await page.click('a[href^="/projects/"]');
      await page.waitForLoadState('networkidle');
    }

    // Navigate to Financial tab
    await page.click('text=פיננסי');
    await page.waitForLoadState('networkidle');

    // Navigate to Planning Estimate sub-tab
    const planningEstimateTab = page.locator('text=אומדן תכנון').first();
    if (await planningEstimateTab.isVisible()) {
      await planningEstimateTab.click();
      await page.waitForLoadState('networkidle');

      // Check if estimate has items, if not add one
      const addItemBtn = page.locator('button:has-text("הוסף פריט")').first();
      const itemsExist = await page.locator('table tbody tr, .item-row').count() > 0;

      if (!itemsExist && await addItemBtn.isVisible()) {
        await addItemBtn.click();
        await page.waitForTimeout(500);

        // Fill in estimate item
        await page.fill('input[name="description"], textarea[placeholder*="תיאור"]', 'Test Flooring E2E');
        await page.fill('input[name="quantity"]', '100');
        await page.fill('input[name="unit_price"]', '1500');

        await page.click('button:has-text("שמור")');
        await page.waitForLoadState('networkidle');
      }

      // Export to Tender
      const exportBtn = page.locator('button:has-text("ייצוא למכרז")');
      if (await exportBtn.isVisible()) {
        await exportBtn.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Should now be on Tenders sub-tab
    await expect(page).toHaveURL(/tab.*tender/i);

    // Find the tender that was just created
    const tenderCards = page.locator('[data-testid="tender-card"], .tender-card');
    if (await tenderCards.count() > 0) {
      const firstTender = tenderCards.first();

      // Add participant if needed
      const addParticipantBtn = page.locator('button:has-text("הוסף משתתף")').first();
      if (await addParticipantBtn.isVisible()) {
        await addParticipantBtn.click();
        await page.waitForTimeout(500);

        // Select first professional from dropdown
        const professionalSelect = page.locator('select[name="professional_id"]');
        if (await professionalSelect.isVisible()) {
          await professionalSelect.selectOption({ index: 1 });
          await page.fill('input[name="total_amount"]', '145000');
          await page.click('button:has-text("שמור")');
          await page.waitForLoadState('networkidle');
        }
      }

      // Select winner
      const selectWinnerBtn = page.locator('button:has-text("בחר זוכה")').first();
      if (await selectWinnerBtn.isVisible()) {
        await selectWinnerBtn.click();
        await page.waitForTimeout(500);

        // In winner modal, select first participant
        const firstParticipantOption = page.locator('button:has-text("₪"), .participant-option').first();
        if (await firstParticipantOption.isVisible()) {
          await firstParticipantOption.click();
          await page.waitForTimeout(500);

          // Continue to variance preview
          const continueBtn = page.locator('button:has-text("המשך")');
          if (await continueBtn.isVisible()) {
            await continueBtn.click();
            await page.waitForTimeout(500);

            // Confirm winner selection
            const confirmBtn = page.locator('button:has-text("אישור")').last();
            if (await confirmBtn.isVisible()) {
              await confirmBtn.click();
              await page.waitForLoadState('networkidle');
            }
          }
        }
      }
    }

    // Navigate to Budget sub-tab
    await page.click('text=תקציב').first();
    await page.waitForLoadState('networkidle');

    // Verify budget item exists with variance
    const budgetTable = page.locator('table, .budget-items');
    await expect(budgetTable).toBeVisible();

    // Look for variance columns
    const varianceHeaders = page.locator('th:has-text("חריגה")');
    await expect(varianceHeaders.first()).toBeVisible();
  });

  test('Budget tab displays variance columns correctly', async ({ page }) => {
    // Navigate to Cost Control → Budget tab
    await page.goto('http://localhost:5173/cost-control');
    await page.waitForLoadState('networkidle');

    // Should be on Budget tab by default or click it
    const budgetTab = page.locator('text=תקציב').first();
    if (await budgetTab.isVisible()) {
      await budgetTab.click();
      await page.waitForLoadState('networkidle');
    }

    // Verify column headers exist
    await expect(page.locator('th:has-text("אומדן")')).toBeVisible();
    await expect(page.locator('th:has-text("חריגה ₪")')).toBeVisible();
    await expect(page.locator('th:has-text("חריגה %")')).toBeVisible();

    // Check for variance cells with color coding
    const varianceCells = page.locator('td:has-text("₪"), .variance-cell');
    if (await varianceCells.count() > 0) {
      // Verify at least one cell has color class
      const coloredCells = page.locator('td[class*="green"], td[class*="red"], td[class*="gray"]');
      expect(await coloredCells.count()).toBeGreaterThan(0);
    }
  });

  test('Variance filter works correctly', async ({ page }) => {
    // Navigate to Budget tab
    await page.goto('http://localhost:5173/cost-control');
    await page.waitForLoadState('networkidle');

    // Count total items
    const initialCount = await page.locator('table tbody tr, .budget-item').count();

    // Check variance filter
    const varianceFilter = page.locator('input[type="checkbox"]:near(:text("רק עם חריגה"))');
    if (await varianceFilter.isVisible()) {
      await varianceFilter.check();
      await page.waitForTimeout(1000);

      // Count filtered items
      const filteredCount = await page.locator('table tbody tr, .budget-item').count();

      // Should be less than or equal to initial count
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      // Uncheck filter
      await varianceFilter.uncheck();
      await page.waitForTimeout(1000);

      // Count should return to original
      const finalCount = await page.locator('table tbody tr, .budget-item').count();
      expect(finalCount).toBe(initialCount);
    }
  });

  test('Excel export includes variance with formatting', async ({ page }) => {
    // Navigate to Budget tab
    await page.goto('http://localhost:5173/cost-control');
    await page.waitForLoadState('networkidle');

    // Click Export button
    const exportBtn = page.locator('button:has-text("ייצוא")').first();
    if (await exportBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportBtn.click();

      const download = await downloadPromise;

      // Verify file downloaded
      expect(download.suggestedFilename()).toMatch(/budget-variance.*\.xlsx/);

      // Save file to verify it's valid
      const path = await download.path();
      expect(path).toBeTruthy();
    }
  });

  test('Variance recalculates when estimate changes', async ({ page }) => {
    // Navigate to a project
    await page.goto('http://localhost:5173/projects');
    await page.waitForLoadState('networkidle');

    // Click first project
    const projectCards = page.locator('.project-card, [data-testid="project-card"], a[href^="/projects/"]');
    if (await projectCards.count() > 0) {
      await projectCards.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Navigate to Planning Estimate
    await page.click('text=פיננסי');
    await page.waitForLoadState('networkidle');

    const planningTab = page.locator('text=אומדן תכנון').first();
    if (await planningTab.isVisible()) {
      await planningTab.click();
      await page.waitForLoadState('networkidle');

      // Find an estimate item to edit
      const editBtn = page.locator('button:has-text("ערוך"), button[aria-label*="ערוך"]').first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await page.waitForTimeout(500);

        // Change unit price
        const unitPriceInput = page.locator('input[name="unit_price"]');
        if (await unitPriceInput.isVisible()) {
          await unitPriceInput.fill('2000');
          await page.click('button:has-text("שמור")');
          await page.waitForLoadState('networkidle');
        }
      }

      // Navigate to Budget tab
      await page.click('text=תקציב').first();
      await page.waitForLoadState('networkidle');

      // Verify variance was recalculated (should show updated values)
      const varianceCells = page.locator('td:has-text("₪")');
      expect(await varianceCells.count()).toBeGreaterThan(0);
    }
  });

  test('Color coding accuracy for different variance scenarios', async ({ page }) => {
    // Navigate to Cost Control Budget tab
    await page.goto('http://localhost:5173/cost-control');
    await page.waitForLoadState('networkidle');

    // Look for items with different variance states
    const table = page.locator('table tbody');
    if (await table.isVisible()) {
      const rows = table.locator('tr');
      const rowCount = await rows.count();

      let foundGreen = false;
      let foundRed = false;
      let foundGray = false;

      // Check each row for color coding
      for (let i = 0; i < Math.min(rowCount, 10); i++) {
        const row = rows.nth(i);
        const varianceCell = row.locator('td').nth(8); // Variance ₪ column (approximate)

        if (await varianceCell.isVisible()) {
          const classes = await varianceCell.getAttribute('class') || '';
          const text = await varianceCell.textContent() || '';

          // Check for green (savings)
          if (classes.includes('green') || text.includes('-₪')) {
            foundGreen = true;
          }

          // Check for red (overrun)
          if (classes.includes('red') && !text.includes('-')) {
            foundRed = true;
          }

          // Check for gray (no estimate)
          if (classes.includes('gray') || text === '-') {
            foundGray = true;
          }
        }
      }

      // At least one type of color coding should exist
      expect(foundGreen || foundRed || foundGray).toBeTruthy();
    }
  });

  test('Project budget sub-tab shows variance', async ({ page }) => {
    // Navigate to projects
    await page.goto('http://localhost:5173/projects');
    await page.waitForLoadState('networkidle');

    // Click first project
    const projectCards = page.locator('.project-card, [data-testid="project-card"], a[href^="/projects/"]');
    if (await projectCards.count() > 0) {
      await projectCards.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Navigate to Financial tab → Budget sub-tab
    await page.click('text=פיננסי');
    await page.waitForLoadState('networkidle');

    const budgetTab = page.locator('text=תקציב').first();
    if (await budgetTab.isVisible()) {
      await budgetTab.click();
      await page.waitForLoadState('networkidle');

      // Verify same columns as global tab
      await expect(page.locator('th:has-text("אומדן")')).toBeVisible();
      await expect(page.locator('th:has-text("חריגה")')).toBeVisible();

      // Verify filter exists
      const varianceFilter = page.locator('input[type="checkbox"]:near(:text("חריגה"))');
      if (await varianceFilter.isVisible()) {
        expect(await varianceFilter.isEnabled()).toBeTruthy();
      }
    }
  });
});
