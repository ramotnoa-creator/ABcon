import { test, expect } from '@playwright/test';

/**
 * Tests for recent features:
 * 1. Winner selection updates cost item status and actual_amount
 * 2. Expandable rows in costs table
 * 3. Data refresh when navigating back from tender
 */

test.describe('Cost Item Updates - Winner Selection Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('Winner selection updates cost item status', async ({ page }) => {
    // Navigate to projects
    await page.goto('http://localhost:5173/projects');
    await page.waitForLoadState('networkidle');

    // Click on first project
    const firstProject = page.locator('.project-card, [role="article"], div[class*="cursor-pointer"]').first();
    if (await firstProject.count() > 0) {
      await firstProject.click();
      await page.waitForLoadState('networkidle');
    } else {
      test.skip();
      return;
    }

    // Navigate to Financial tab
    await page.click('text=פיננסי');
    await page.waitForLoadState('networkidle');

    // Go to Costs subtab first to create a cost item
    const costsTab = page.locator('text=עלויות, button:has-text("עלויות")').first();
    if (await costsTab.count() > 0) {
      await costsTab.click();
      await page.waitForLoadState('networkidle');

      // Check if there are any cost items, if not create one
      const addCostBtn = page.locator('button:has-text("הוסף פריט עלות")');
      if (await addCostBtn.count() > 0) {
        const hasCostItems = await page.locator('tbody tr').count() > 1; // More than just header

        if (!hasCostItems) {
          // Create a test cost item
          await addCostBtn.click();
          await page.waitForTimeout(500);

          // Fill in cost item form
          await page.fill('input[placeholder*="שם"]', 'פריט עלות לבדיקה');
          await page.fill('input[type="number"]', '100000');

          // Save
          await page.click('button:has-text("שמור")');
          await page.waitForLoadState('networkidle');
        }

        // Find a draft cost item to export to tender
        const draftItem = page.locator('tr:has-text("טיוטה")').first();
        if (await draftItem.count() === 0) {
          console.log('No draft cost items found to export');
          test.skip();
          return;
        }

        // Get the cost item name to track it
        const costItemName = await draftItem.locator('td').first().textContent();
        console.log('Testing with cost item:', costItemName);

        // Export to tender
        const exportBtn = draftItem.locator('button[title*="מכרז"]');
        if (await exportBtn.count() > 0) {
          await exportBtn.click();
          await page.waitForLoadState('networkidle');

          // Should navigate to tenders
          await expect(page).toHaveURL(/tenders/);

          // Now we should be on the tender page
          // Add a participant
          const addParticipantBtn = page.locator('button:has-text("הוסף משתתף")');
          if (await addParticipantBtn.count() > 0) {
            await addParticipantBtn.click();
            await page.waitForTimeout(500);

            // Select first professional from list (if any exist)
            const firstProfessional = page.locator('button:has(div):has-text("₪")').first();
            if (await firstProfessional.count() > 0) {
              await firstProfessional.click();
              await page.waitForTimeout(500);

              // Enter bid amount
              await page.fill('input[type="number"]', '95000');

              // Save participant
              await page.click('button:has-text("שמור")');
              await page.waitForLoadState('networkidle');

              // Select winner
              const selectWinnerBtn = page.locator('button:has-text("בחר זוכה")');
              if (await selectWinnerBtn.count() > 0) {
                await selectWinnerBtn.click();
                await page.waitForTimeout(500);

                // Select the participant we just added
                const participant = page.locator('button:has-text("95,000")').first();
                if (await participant.count() > 0) {
                  await participant.click();
                  await page.waitForTimeout(500);

                  // Continue to variance preview
                  await page.click('button:has-text("המשך")');
                  await page.waitForTimeout(500);

                  // Confirm winner selection
                  await page.click('button:has-text("אישור")');
                  await page.waitForLoadState('networkidle');

                  // Success! Now navigate back to cost item
                  const backToCostBtn = page.locator('button:has-text("פריט עלות")');
                  if (await backToCostBtn.count() > 0) {
                    await backToCostBtn.click();
                    await page.waitForLoadState('networkidle');

                    // VERIFY: Should be on costs page with highlight
                    await expect(page).toHaveURL(/costs/);
                    await expect(page).toHaveURL(/highlight=/);

                    // Wait for data to refresh
                    await page.waitForTimeout(2000);

                    // VERIFY: Cost item status should be "מכרז זוכה"
                    const costRow = page.locator(`tr:has-text("${costItemName}")`).first();
                    await expect(costRow.locator('text=מכרז זוכה')).toBeVisible({ timeout: 5000 });

                    // VERIFY: Actual amount should show 95,000
                    await expect(costRow.locator('text=95,000')).toBeVisible();

                    // VERIFY: Row should be highlighted (has highlight class)
                    await expect(costRow).toHaveClass(/primary|highlight/);

                    console.log('✅ Winner selection successfully updated cost item!');
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  test('Expandable rows show additional details', async ({ page }) => {
    // Navigate to projects
    await page.goto('http://localhost:5173/projects');
    await page.waitForLoadState('networkidle');

    // Click on first project
    const firstProject = page.locator('.project-card, [role="article"], div[class*="cursor-pointer"]').first();
    if (await firstProject.count() > 0) {
      await firstProject.click();
      await page.waitForLoadState('networkidle');
    } else {
      test.skip();
      return;
    }

    // Navigate to Financial tab → Costs
    await page.click('text=פיננסי');
    await page.waitForLoadState('networkidle');

    const costsTab = page.locator('text=עלויות, button:has-text("עלויות")').first();
    if (await costsTab.count() > 0) {
      await costsTab.click();
      await page.waitForLoadState('networkidle');

      // Look for expand button (arrow_down or expand_more icon)
      const expandBtn = page.locator('button:has(span.material-symbols-outlined:has-text("expand_more"))').first();

      if (await expandBtn.count() > 0) {
        // Verify button is visible
        await expect(expandBtn).toBeVisible();

        // Click to expand
        await expandBtn.click();
        await page.waitForTimeout(500);

        // VERIFY: Expanded content should be visible
        // Look for common expanded content indicators
        const expandedContent = page.locator('text=תיאור, text=הערות, text=מועדים').first();
        await expect(expandedContent).toBeVisible({ timeout: 3000 });

        // VERIFY: Button should show it's expanded (rotated icon)
        const iconAfterExpand = expandBtn.locator('span.material-symbols-outlined');
        await expect(iconAfterExpand).toHaveClass(/rotate/);

        // Click again to collapse
        await expandBtn.click();
        await page.waitForTimeout(500);

        // VERIFY: Expanded content should be hidden
        await expect(expandedContent).not.toBeVisible();

        console.log('✅ Expandable rows work correctly!');
      } else {
        console.log('No expandable items found (items may not have description/notes)');
      }
    }
  });

  test('Data refreshes when navigating back with highlight parameter', async ({ page }) => {
    // This test verifies the useEffect fix
    // Navigate to projects
    await page.goto('http://localhost:5173/projects');
    await page.waitForLoadState('networkidle');

    // Click on first project
    const firstProject = page.locator('.project-card, [role="article"], div[class*="cursor-pointer"]').first();
    if (await firstProject.count() > 0) {
      await firstProject.click();
      await page.waitForLoadState('networkidle');
    } else {
      test.skip();
      return;
    }

    // Navigate to Financial tab → Costs
    await page.click('text=פיננסי');
    await page.waitForLoadState('networkidle');

    const costsTab = page.locator('text=עלויות, button:has-text("עלויות")').first();
    if (await costsTab.count() > 0) {
      await costsTab.click();
      await page.waitForLoadState('networkidle');

      // Find a cost item with a tender
      const costWithTender = page.locator('tr:has-text("מקושר למכרז")').first();

      if (await costWithTender.count() > 0) {
        // Get the cost item ID from the row
        const rowId = await costWithTender.getAttribute('id');
        console.log('Testing with row:', rowId);

        // Click "view tender" button
        const viewTenderBtn = costWithTender.locator('button:has(span.material-symbols-outlined:has-text("open_in_new"))');
        if (await viewTenderBtn.count() > 0) {
          await viewTenderBtn.click();
          await page.waitForLoadState('networkidle');

          // Should be on tender page
          await expect(page).toHaveURL(/tenders/);

          // Navigate back using the "back to cost item" button
          const backBtn = page.locator('button:has-text("פריט עלות")');
          if (await backBtn.count() > 0) {
            await backBtn.click();
            await page.waitForLoadState('networkidle');

            // VERIFY: URL should have highlight parameter
            await expect(page).toHaveURL(/highlight=/);

            // VERIFY: Row should be highlighted
            const highlightedRow = page.locator('[id*="cost-item"][class*="primary"], [id*="cost-item"][class*="highlight"]').first();
            await expect(highlightedRow).toBeVisible({ timeout: 3000 });

            // Wait for highlight to auto-clear (3 seconds)
            await page.waitForTimeout(3500);

            // VERIFY: Highlight parameter should be removed from URL
            await expect(page).not.toHaveURL(/highlight=/);

            console.log('✅ Data refresh and highlight works correctly!');
          }
        }
      } else {
        console.log('No cost items with tenders found');
      }
    }
  });
});

test.describe('Expandable Rows - Detailed Content Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('Expanded row shows description section', async ({ page }) => {
    // Navigate to a cost item with description
    await page.goto('http://localhost:5173/projects');
    await page.waitForLoadState('networkidle');

    const firstProject = page.locator('.project-card, [role="article"]').first();
    if (await firstProject.count() > 0) {
      await firstProject.click();
      await page.waitForLoadState('networkidle');

      await page.click('text=פיננסי');
      await page.waitForLoadState('networkidle');

      const costsTab = page.locator('text=עלויות, button:has-text("עלויות")').first();
      if (await costsTab.count() > 0) {
        await costsTab.click();
        await page.waitForLoadState('networkidle');

        // Expand first row
        const expandBtn = page.locator('button:has(span:has-text("expand_more"))').first();
        if (await expandBtn.count() > 0) {
          await expandBtn.click();
          await page.waitForTimeout(500);

          // Check for description section
          const descSection = page.locator('span.material-symbols-outlined:has-text("description")');
          if (await descSection.count() > 0) {
            await expect(descSection).toBeVisible();
            console.log('✅ Description section visible');
          }

          // Check for notes section
          const notesSection = page.locator('span.material-symbols-outlined:has-text("sticky_note_2")');
          if (await notesSection.count() > 0) {
            await expect(notesSection).toBeVisible();
            console.log('✅ Notes section visible');
          }

          // Check for timestamps section
          const timestampsSection = page.locator('span.material-symbols-outlined:has-text("schedule")');
          await expect(timestampsSection).toBeVisible();
          console.log('✅ Timestamps section visible');

          // Check for metadata section
          const metadataSection = page.locator('span.material-symbols-outlined:has-text("info")');
          await expect(metadataSection).toBeVisible();
          console.log('✅ Metadata section visible');
        }
      }
    }
  });
});
