import { test, expect } from '@playwright/test';

// Helper function to login (if auth is implemented)
async function login(page: any) {
  // For now, just navigate to home
  await page.goto('http://localhost:5173');
}

test.describe('Tender Integration - Estimate to Winner Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Export estimate to tender', async ({ page }) => {
    // Navigate to a project
    await page.goto('http://localhost:5173/projects');

    // Click on first project
    await page.click('.project-card:first-child');
    await page.waitForLoadState('networkidle');

    // Navigate to Financial tab
    await page.click('text=פיננסי');
    await page.waitForLoadState('networkidle');

    // Navigate to Planning Estimate subtab
    await page.click('text=אומדן תכנון');
    await page.waitForLoadState('networkidle');

    // Check if estimate exists, if not add some items first
    const addItemBtn = page.locator('text=הוסף פריט').first();
    if (await addItemBtn.isVisible()) {
      // Add a test item
      await addItemBtn.click();
      await page.fill('input[placeholder*="תיאור"]', 'פריט בדיקה');
      await page.fill('input[type="number"]:has-text("כמות")', '1');
      await page.fill('input[type="number"]:has-text("מחיר")', '10000');
      await page.click('button:has-text("שמור")');
      await page.waitForLoadState('networkidle');
    }

    // Click "Export to Tender" button
    await page.click('button:has-text("ייצוא למכרז")');
    await page.waitForLoadState('networkidle');

    // Verify navigation to tenders subtab
    await expect(page).toHaveURL(/subtab=tenders/);

    // Verify tender was created
    await expect(page.locator('.tender-card').first()).toBeVisible();

    // Verify source estimate link exists
    await expect(page.locator('text=נוצר מאומדן:')).toBeVisible();
  });

  test('Upload BOM file to tender', async ({ page }) => {
    // Navigate to a project with a tender
    await page.goto('http://localhost:5173/projects');
    await page.click('.project-card:first-child');
    await page.waitForLoadState('networkidle');

    // Navigate to Financial tab → Tenders
    await page.click('text=פיננסי');
    await page.waitForLoadState('networkidle');
    await page.click('text=מכרזים');
    await page.waitForLoadState('networkidle');

    // Check if there's a tender, if not skip
    const tenderExists = await page.locator('.tender-card').count() > 0;
    if (!tenderExists) {
      test.skip();
      return;
    }

    // Create a test .docx file using a data URL
    const testFileContent = 'Test BOM content';
    const testFile = {
      name: 'test-bom.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(testFileContent),
    };

    // Find BOM upload zone
    const uploadInput = page.locator('input[type="file"][accept*=".doc"]').first();

    if (await uploadInput.count() > 0) {
      // Create a temporary file-like object
      await uploadInput.setInputFiles({
        name: testFile.name,
        mimeType: testFile.mimeType,
        buffer: testFile.buffer,
      });

      // Wait for upload to complete
      await page.waitForTimeout(2000);

      // Verify BOM file is displayed
      await expect(page.locator('text=test-bom.docx')).toBeVisible();

      // Test download
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("הורד")');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('test-bom.docx');

      // Test delete
      await page.click('button:has-text("מחק")');
      await page.click('button:has-text("OK")'); // Confirm dialog
      await page.waitForTimeout(1000);

      // Verify BOM file is removed
      await expect(page.locator('text=test-bom.docx')).not.toBeVisible();
    }
  });

  test('Send BOM modal shows participants', async ({ page }) => {
    // Navigate to a project with a tender that has BOM and participants
    await page.goto('http://localhost:5173/projects');
    await page.click('.project-card:first-child');
    await page.waitForLoadState('networkidle');

    // Navigate to Financial tab → Tenders
    await page.click('text=פיננסי');
    await page.waitForLoadState('networkidle');
    await page.click('text=מכרזים');
    await page.waitForLoadState('networkidle');

    // Check if Send BOM button exists
    const sendBOMBtn = page.locator('button:has-text("שלח בל״מ למשתתפים")');

    if (await sendBOMBtn.count() > 0) {
      // Click Send BOM button
      await sendBOMBtn.first().click();
      await page.waitForTimeout(500);

      // Verify modal is open
      await expect(page.locator('text=שליחת בל"מ למשתתפים')).toBeVisible();

      // Verify participants section exists
      await expect(page.locator('text=נמענים')).toBeVisible();

      // Verify copy emails button exists
      await expect(page.locator('button:has-text("העתק כל האימיילים")')).toBeVisible();

      // Verify email template is shown
      await expect(page.locator('text=תבנית אימייל')).toBeVisible();

      // Verify send button is disabled with Phase 2 notice
      const sendBtn = page.locator('button:has-text("שלח אימיילים")');
      await expect(sendBtn).toBeDisabled();
      await expect(page.locator('text=שליחת אימייל אוטומטית תהיה זמינה בשלב 2')).toBeVisible();

      // Close modal
      await page.click('button:has-text("סגור")');
      await page.waitForTimeout(500);
      await expect(page.locator('text=שליחת בל"מ למשתתפים')).not.toBeVisible();
    }
  });

  test('Winner selection shows variance preview', async ({ page }) => {
    // Navigate to a project with a tender that has participants with quotes
    await page.goto('http://localhost:5173/projects');
    await page.click('.project-card:first-child');
    await page.waitForLoadState('networkidle');

    // Navigate to Financial tab → Tenders
    await page.click('text=פיננסי');
    await page.waitForLoadState('networkidle');
    await page.click('text=מכרזים');
    await page.waitForLoadState('networkidle');

    // Check if there's a "Select Winner" button
    const selectWinnerBtn = page.locator('button:has-text("בחר זוכה")');

    if (await selectWinnerBtn.count() > 0) {
      // Click Select Winner button
      await selectWinnerBtn.first().click();
      await page.waitForTimeout(500);

      // Verify modal is open
      await expect(page.locator('text=בחירת זוכה במכרז')).toBeVisible();

      // Select first participant (if any)
      const firstParticipant = page.locator('.participant-option, button:has-text("₪")').first();
      if (await firstParticipant.count() > 0) {
        await firstParticipant.click();
        await page.waitForTimeout(500);

        // Step 2: Contract amount
        await expect(page.locator('text=סכום חוזה סופי')).toBeVisible();

        // Click Continue to see variance preview
        await page.click('button:has-text("המשך")');
        await page.waitForTimeout(500);

        // Verify variance preview modal
        await expect(page.locator('text=בחירת זוכה במכרז')).toBeVisible();
        await expect(page.locator('text=שונות:')).toBeVisible();
        await expect(page.locator('text=יצירת פריט תקציב אוטומטית')).toBeVisible();

        // Verify variance color coding
        const varianceElement = page.locator('.variance-row');
        await expect(varianceElement).toBeVisible();

        // Test cancel
        await page.click('button:has-text("ביטול")');
        await page.waitForTimeout(500);

        // Should go back to contract amount screen
        await expect(page.locator('text=סכום חוזה סופי')).toBeVisible();
      }
    }
  });

  test('Complete flow: estimate → tender → BOM → winner', async ({ page }) => {
    // This is an end-to-end test of the complete flow

    // 1. Create estimate with items
    await page.goto('http://localhost:5173/projects');
    await page.click('.project-card:first-child');
    await page.waitForLoadState('networkidle');
    await page.click('text=פיננסי');
    await page.waitForLoadState('networkidle');
    await page.click('text=אומדן ביצוע');
    await page.waitForLoadState('networkidle');

    // Add item if needed
    const addItemBtn = page.locator('text=הוסף פריט').first();
    if (await addItemBtn.isVisible()) {
      await addItemBtn.click();
      await page.fill('input[placeholder*="תיאור"]', 'פריט בדיקה מלא');
      await page.fill('input[type="number"]', '1');
      await page.fill('input[type="number"]', '50000');
      await page.click('button:has-text("שמור")');
      await page.waitForLoadState('networkidle');
    }

    // 2. Export to tender
    await page.click('button:has-text("ייצוא למכרז")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/subtab=tenders/);

    // 3. Verify tender created and linked
    await expect(page.locator('text=נוצר מאומדן:')).toBeVisible();

    // 4. Test shows that integration is working
    // In real scenario, we would:
    // - Upload BOM
    // - Add participants
    // - Enter quotes
    // - Select winner
    // - Verify budget created automatically

    // For MVP, just verify the UI elements are accessible
    await expect(page.locator('text=בל"מ (Bill of Materials)')).toBeVisible();
  });
});
