import { test, expect } from '@playwright/test';

test.describe('Responsive Layout Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/role-selection');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('adjusts navigation controls across desktop, tablet, and mobile', async ({ page }) => {
    // 1. Log in as Student
    await page.goto('/role-selection');
    await page.fill('#student-id-input', '23CS005');
    await page.click('#btn-enter-student');
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // --- Desktop Viewport (1280x800) ---
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Desktop sidebar should be persistent and visible (not offscreen)
    const sidebarDesktop = page.locator('aside');
    await expect(sidebarDesktop).toBeVisible();
    
    // Mobile hamburger menu button should be hidden
    const mobileMenuBtn = page.locator('button[aria-label="Toggle Navigation Menu"]');
    await expect(mobileMenuBtn).not.toBeVisible();

    // --- Tablet Viewport (768x1024) ---
    await page.setViewportSize({ width: 768, height: 1024 });
    // Hamburger menu trigger is hidden at md: (768px), sidebar is still persistent in standard layout
    await expect(mobileMenuBtn).not.toBeVisible();
    await expect(sidebarDesktop).toBeVisible();

    // --- Mobile Viewport (375x812) ---
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Hamburger button should now be visible on mobile
    await expect(mobileMenuBtn).toBeVisible();
    
    // Sidebar should be off-canvas (hidden/translated out of view)
    // Wait, the sidebar container has translate classes. We can check if it is translated or hidden
    await expect(sidebarDesktop).not.toBeVisible();

    // Click mobile hamburger menu button to open sidebar drawer
    await mobileMenuBtn.click();
    
    // Verify sidebar is now visible drawer overlay
    await expect(sidebarDesktop).toBeVisible();
  });
});
