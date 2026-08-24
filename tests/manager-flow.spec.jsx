import { test, expect } from '@playwright/test';

test.describe('Election Manager Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/role-selection');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('can add and edit candidates, toggle voting, and view live tally', async ({ page }) => {
    page.on('console', msg => console.log('[BROWSER] ' + msg.type().toUpperCase() + ':', msg.text()));
    // 1. Visit Role Selection and Log in as Manager
    await page.goto('/role-selection');
    await page.click('#btn-enter-manager');
    await expect(page).toHaveURL(/\/manager\/login/);
    await page.fill('#manager-username-input', 'admin');
    await page.fill('#manager-password-input', 'admin123');
    await page.click('#btn-submit-login');
    await expect(page).toHaveURL(/\/manager\/dashboard/);

    // Click Club Management card to enter Club workspace
    await page.click('#card-club-management');
    await expect(page).toHaveURL(/\/manager\/club\/dashboard/);

    // 2. Navigate to Candidate Management
    await page.click('a[href="/manager/club/candidates"]');
    await expect(page).toHaveURL(/\/manager\/club\/candidates/);

    // 3. Add Candidate
    await page.click('#btn-add-candidate');
    await expect(page.locator('#modal-title')).toBeVisible();

    await page.fill('#form-name', 'Jamie Lancaster');
    await page.selectOption('#form-gender', 'female');
    await page.fill('#form-bio', 'Second-year Business major. Former student council member.');
    await page.fill('#form-manifesto', 'My vision is simple: improve college dining services and extend gym hours.');
    await page.click('#btn-submit-candidate-form');

    // Confirm candidate is now in the list
    await expect(page.locator('tbody')).toContainText('Jamie Lancaster');

    // 4. Edit Candidate
    // Click edit on the candidate we just added (using stable selectors or text match)
    await page.click('tr:has-text("Jamie Lancaster") .btn-edit-candidate');
    await expect(page.locator('#modal-title')).toContainText('Edit Candidate');
    
    // Modify candidate name and gender
    await page.fill('#form-name', 'Jamie Lancaster Jr.');
    await page.selectOption('#form-gender', 'male');
    await page.click('#btn-submit-candidate-form');
    
    // Confirm change is updated in table
    await expect(page.locator('tbody')).toContainText('Jamie Lancaster Jr.');

    // 5. Toggle Election Status (Close Voting)
    await page.click('a[href="/manager/club/dashboard"]');
    await expect(page).toHaveURL(/\/manager\/club\/dashboard/);
    await expect(page.locator('text=Voting Open')).toBeVisible();

    // Click to close
    await page.click('#btn-toggle-election-status');
    await expect(page.locator('#modal-title')).toContainText('Confirm Close');
    await page.click('#btn-confirm-toggle-status');
    
    // Confirm voting is now closed
    await expect(page.locator('text=Voting Closed')).toBeVisible();

    // 6. Navigate to Live Tally and verify metrics are rendered
    await page.click('a[href="/manager/club/tally"]');
    await expect(page).toHaveURL(/\/manager\/club\/tally/);
    await expect(page.locator('h1')).toContainText('Live Vote Tally');
    await expect(page.locator('h2')).toContainText('Votes Submitted');
  });
});
