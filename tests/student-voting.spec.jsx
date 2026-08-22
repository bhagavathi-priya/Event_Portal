import { test, expect } from '@playwright/test';

test.describe('Student Voting Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage in the browser to start fresh
    await page.goto('/role-selection');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('successfully votes and views receipt', async ({ page }) => {
    // 1. Log in as Manager to add a candidate first
    await page.goto('/role-selection');
    await page.click('#btn-enter-manager');
    await expect(page).toHaveURL(/\/manager\/login/);
    await page.fill('#manager-username-input', 'admin');
    await page.fill('#manager-password-input', 'admin123');
    await page.click('#btn-submit-login');
    await expect(page).toHaveURL(/\/manager\/dashboard/);

    // 2. Navigate to Candidate Management
    await page.click('a[href="/manager/candidates"]');
    await expect(page).toHaveURL(/\/manager\/candidates/);

    // 3. Add Candidate "Alex Rivera"
    await page.click('#btn-add-candidate');
    await page.fill('#form-name', 'Alex Rivera');
    await page.fill('#form-bio', 'Third-year Computer Science major. Passionate about transparency, coding workshops, and campus-wide hackathons.');
    await page.fill('#form-manifesto', 'My manifesto is simple: expand campus technology funding, provide free textbooks online, and host student-led career fairs. Let\'s make our campus a hub for tech and innovation!');
    await page.click('#btn-submit-candidate-form');

    // 4. Switch role to Student
    await page.click('#btn-switch-role');
    await expect(page).toHaveURL(/\/role-selection/);

    // 5. Input Student ID and Log in
    await page.fill('#student-id-input', '23CS001');
    await page.click('#btn-enter-student');

    // 6. Confirm redirected to Student Dashboard
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // 7. Click 'Browse Candidates' for 'Student Body President' category (cat-1)
    await page.click('a[href="/student/vote/cat-1"], button:has-text("Browse Candidates")');
    await expect(page).toHaveURL(/\/student\/vote\/cat-1/);

    // 8. Click on the candidate card to view their profile (Alex Rivera)
    await page.click('h3:has-text("Alex Rivera")');
    await expect(page).toHaveURL(/\/student\/candidate\/cand-/);
    await expect(page.locator('h2').first()).toContainText('Alex Rivera');

    // 9. Click 'Vote' to open confirmation modal
    await page.click('#btn-vote-candidate');
    
    // 10. Verify modal is visible
    const modalTitle = page.locator('#modal-title');
    await expect(modalTitle).toBeVisible();
    await expect(modalTitle).toContainText('Review Your Vote');

    // 11. Confirm the vote in the modal
    await page.click('#btn-confirm-vote');

    // 12. Verify redirection to receipt page
    await expect(page).toHaveURL(/\/student\/receipt\/receipt-/);
    await expect(page.locator('#receipt-card')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Vote Confirmed!');
    await expect(page.locator('#receipt-card')).toContainText('23CS001');
    await expect(page.locator('#receipt-card')).toContainText('Student Body President');
    await expect(page.locator('#receipt-card')).toContainText('Alex Rivera');
  });
});
