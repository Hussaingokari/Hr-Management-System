const { test, expect } = require('@playwright/test');

test.describe('Authentication Module', () => {
  test('Login with valid credentials', async ({ page }) => {
    // Note: Assuming frontend is running on localhost:3000
    await page.goto('http://localhost:3000/login');
    
    // Check if we are on the login page
    await expect(page).toHaveTitle(/HRMS|Login/i);
    
    // Fill credentials (assuming these exist from Data Seeder)
    await page.fill('input[type="email"]', 'admin@hrms.com');
    await page.fill('input[type="password"]', 'Admin@123');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
  });

  test('Login with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[type="email"]', 'wrong@hrms.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Should show error message or stay on login page
    await expect(page).toHaveURL(/.*\/login/);
  });
});
