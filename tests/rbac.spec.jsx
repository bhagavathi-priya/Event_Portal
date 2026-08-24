import { test, expect } from '@playwright/test';

test.describe('Role-Based Access Control (RBAC) Protections', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage in the browser to start fresh
    await page.goto('/role-selection');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('Student cannot access Manager pages and gets redirected to Unauthorized', async ({ page }) => {
    // Log in as student
    await page.goto('/role-selection');
    await page.fill('#student-id-input', '23CS004');
    await page.click('#btn-enter-student');
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Try navigating directly to manager routes
    await page.goto('/manager/dashboard');
    await expect(page).toHaveURL(/\/unauthorized/);
    await expect(page.locator('h1')).toContainText('Unauthorized Access');

    await page.goto('/manager/club/candidates');
    await expect(page).toHaveURL(/\/unauthorized/);
  });

  test('Manager cannot access Student pages and gets redirected to Unauthorized', async ({ page }) => {
    // Log in as Manager
    await page.goto('/role-selection');
    await page.click('#btn-enter-manager');
    await expect(page).toHaveURL(/\/manager\/login/);
    await page.fill('#manager-username-input', 'admin');
    await page.fill('#manager-password-input', 'admin123');
    await page.click('#btn-submit-login');
    await expect(page).toHaveURL(/\/manager\/dashboard/);

    // Try navigating directly to student routes
    await page.goto('/student/dashboard');
    await expect(page).toHaveURL(/\/unauthorized/);
    await expect(page.locator('h1')).toContainText('Unauthorized Access');

    await page.goto('/student/vote/cat-1');
    await expect(page).toHaveURL(/\/unauthorized/);
  });

  test('Rejects invalid Student IDs and prevents login', async ({ page }) => {
    page.on('console', msg => console.log('[BROWSER] ' + msg.type().toUpperCase() + ':', msg.text()));
    await page.goto('/role-selection');
    
    // Attempt logging in with an invalid Student ID format
    await page.fill('#student-id-input', 'invalid_id');
    await page.click('#btn-enter-student');
    await expect(page.locator('p.text-rose-500')).toContainText('Invalid Student ID. Only registered students (23CS001 to 23CS050) are authorized to vote.');
    await expect(page).toHaveURL(/\/role-selection/); // Stays on role selection

    // Attempt logging in with an out-of-range Student ID
    await page.fill('#student-id-input', '23CS051');
    await page.click('#btn-enter-student');
    await expect(page.locator('p.text-rose-500')).toContainText('Invalid Student ID. Only registered students (23CS001 to 23CS050) are authorized to vote.');
    await expect(page).toHaveURL(/\/role-selection/); // Stays on role selection
  });
});
