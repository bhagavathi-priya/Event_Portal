import { test, expect } from '@playwright/test';

test.describe('Closed Election Constraints', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage in the browser to start fresh
    await page.goto('/role-selection');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('student cannot vote when election is closed', async ({ page }) => {
    // 1. Manager adds a candidate first while election is OPEN
    await page.goto('/role-selection');
    await page.click('#btn-enter-manager');
    await expect(page).toHaveURL(/\/manager\/login/);
    await page.fill('#manager-username-input', 'admin');
    await page.fill('#manager-password-input', 'admin123');
    await page.click('#btn-submit-login');
    await page.click('a[href="/manager/candidates"]');
    await page.click('#btn-add-candidate');
    await page.fill('#form-name', 'Alex Rivera');
    await page.selectOption('#form-gender', 'male');
    await page.fill('#form-bio', 'Third-year Computer Science major.');
    await page.fill('#form-manifesto', 'My vision is simple.');
    await page.click('#btn-submit-candidate-form');

    // 2. Switch to Student to get the candidate page URL
    await page.click('#btn-switch-role');
    await page.fill('#student-id-input', '23CS003');
    await page.click('#btn-enter-student');
    await page.click('a[href="/student/vote/cat-1"], button:has-text("Browse Candidates")');
    await page.click('h3:has-text("Alex Rivera")');
    await expect(page).toHaveURL(/\/student\/candidate\/cand-/);
    const candidateUrl = page.url(); // Capture the dynamic candidate URL

    // 3. Switch back to Manager and close the election
    await page.click('#btn-switch-role');
    await page.click('#btn-enter-manager');
    await expect(page).toHaveURL(/\/manager\/login/);
    await page.fill('#manager-username-input', 'admin');
    await page.fill('#manager-password-input', 'admin123');
    await page.click('#btn-submit-login');
    await page.click('#btn-toggle-election-status');
    await page.click('#btn-confirm-toggle-status');
    await expect(page.locator('text=Voting Closed')).toBeVisible();

    // 4. Switch back to Student
    await page.click('#btn-switch-role');
    await page.fill('#student-id-input', '23CS003');
    await page.click('#btn-enter-student');

    // 5. Verify status badge shows CLOSED on dashboard
    await expect(page.locator('[role="status"]')).toContainText('Closed');

    // 6. Verify category list button shows closed and is disabled
    const browseBtn = page.locator('button:has-text("Voting Closed")');
    await expect(browseBtn.first()).toBeDisabled();

    // 7. Try direct navigation to candidate details using the captured URL
    await page.goto(candidateUrl);

    // Verify warning that election is closed is displayed
    await expect(page.locator('text=Voting is closed for this election')).toBeVisible();

    // Verify vote button is not visible
    const voteBtn = page.locator('#btn-vote-candidate');
    await expect(voteBtn).not.toBeVisible();
  });
});
