import { test, expect } from '@playwright/test';

test.describe('Duplicate Vote Restriction', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage in the browser to start fresh
    await page.goto('/role-selection');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('prevents student from voting twice in the same category', async ({ page }) => {
    // 1. Log in as Manager to add candidate first
    await page.goto('/role-selection');
    await page.click('#btn-enter-manager');
    await expect(page).toHaveURL(/\/manager\/login/);
    await page.fill('#manager-username-input', 'admin');
    await page.fill('#manager-password-input', 'admin123');
    await page.click('#btn-submit-login');
    await expect(page).toHaveURL(/\/manager\/dashboard/);

    // Enter Club workspace
    await page.click('#card-club-management');
    await expect(page).toHaveURL(/\/manager\/club\/dashboard/);
    
    // Navigate to Candidate Management and add candidate
    await page.click('a[href="/manager/club/candidates"]');
    await page.click('#btn-add-candidate');
    await page.fill('#form-name', 'Alex Rivera');
    await page.selectOption('#form-gender', 'male');
    await page.fill('#form-bio', 'Third-year Computer Science major. Passionate about transparency.');
    await page.fill('#form-manifesto', 'Expand campus technology funding.');
    await page.click('#btn-submit-candidate-form');

    // 2. Switch to Student
    await page.click('#btn-switch-role');
    await page.fill('#student-id-input', '23CS002');
    await page.click('#btn-enter-student');

    // Click to enter Club Portal and Coding Club election system
    await page.click('text=Club Elections Portal');
    await page.click('text=Coding Club');

    // 3. Go to Category A Candidates list
    await page.click('a[href="/student/vote/cat-1"], button:has-text("Browse Candidates")');
    await expect(page).toHaveURL(/\/student\/vote\/cat-1/);
    
    // Select candidate
    await page.click('h3:has-text("Alex Rivera")');
    
    // Submit vote
    await page.click('#btn-vote-candidate');
    await page.click('#btn-confirm-vote');
    
    // Verify receipt is shown (successful vote)
    await expect(page).toHaveURL(/\/student\/receipt\/receipt-/);

    // 4. Navigate directly back to the category candidates page
    await page.goto('/student/vote/cat-1');
    await page.click('h3:has-text("Alex Rivera")');

    // Verify warning that user has already voted is visible
    await expect(page.locator('text=You have already voted in this category')).toBeVisible();

    // Verify the primary vote button is hidden or disabled
    const voteBtn = page.locator('#btn-vote-candidate');
    await expect(voteBtn).not.toBeVisible();
  });
});
