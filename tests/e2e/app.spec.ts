import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*auth\/login/)
  })

  test('should show login form', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('text=Welcome back')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })
})

test.describe('Dashboard (unauthenticated)', () => {
  test('should redirect to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*auth\/login/)
  })
})