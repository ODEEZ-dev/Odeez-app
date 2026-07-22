import { test, expect } from '@playwright/test'

test.describe('Contacts Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/dashboard/contacts')
    await page.waitForLoadState('networkidle')
  })

  test('should display contacts page with empty state', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Contacts')
    await expect(page.locator('text=Create your first contact')).toBeVisible()
  })

  test('should create a new contact', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    await page.fill('input[id="firstName"]', 'John')
    await page.fill('input[id="lastName"]', 'Doe')
    await page.fill('input[id="email"]', 'john@example.com')
    await page.fill('input[id="phone"]', '+1 555-123-4567')
    await page.fill('input[id="company"]', 'Acme Inc')
    await page.fill('input[id="title"]', 'Software Engineer')
    await page.fill('input[id="birthday"]', '1990-01-15')
    await page.fill('textarea[id="address"]', '123 Main St, City, State 12345')
    await page.fill('textarea[id="notes"]', 'Met at conference')

    await page.fill('input[placeholder="Add tag..."]', 'work')
    await page.click('button:has-text("Add"):near(input[placeholder="Add tag..."])')
    await page.fill('input[placeholder="Add tag..."]', 'friend')
    await page.click('button:has-text("Add"):near(input[placeholder="Add tag..."])')

    await page.click('button:has-text("Create Contact")')

    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    await expect(page.locator('text=John Doe')).toBeVisible()
    await expect(page.locator('text=john@example.com')).toBeVisible()
    await expect(page.locator('text=Acme Inc')).toBeVisible()
    await expect(page.locator('text=work')).toBeVisible()
    await expect(page.locator('text=friend')).toBeVisible()
  })

  test('should edit an existing contact', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'Original')
    await page.fill('input[id="lastName"]', 'Name')
    await page.fill('input[id="email"]', 'original@example.com')
    await page.click('button:has-text("Create Contact")')
    await expect(page.locator('text=Original Name')).toBeVisible()

    await page.hover('text=Original Name')
    await page.click('button[aria-haspopup="menu"]')
    await page.click('text=Edit')

    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('input[value="Original"]')).toBeVisible()

    await page.fill('input[id="firstName"]', 'Updated')
    await page.fill('input[id="lastName"]', 'Name')
    await page.fill('input[id="email"]', 'updated@example.com')
    await page.click('button:has-text("Save Changes")')

    await expect(page.locator('text=Updated Name')).toBeVisible()
    await expect(page.locator('text=updated@example.com')).toBeVisible()
  })

  test('should add to favorites and remove from favorites', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'Favorite')
    await page.fill('input[id="lastName"]', 'Contact')
    await page.click('button:has-text("Create Contact")')
    await expect(page.locator('text=Favorite Contact')).toBeVisible()

    await page.hover('text=Favorite Contact')
    await page.click('button[aria-haspopup="menu"]')
    await page.click('text=Add to Favorites')

    await expect(page.locator('text=Favorite Contact').locator('..').locator('.fill-yellow-500')).toBeVisible()

    await page.hover('text=Favorite Contact')
    await page.click('button[aria-haspopup="menu"]')
    await page.click('text=Remove from Favorites')

    await expect(page.locator('text=Favorite Contact').locator('..').locator('.fill-yellow-500')).not.toBeVisible()
  })

  test('should duplicate a contact', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'Original')
    await page.fill('input[id="lastName"]', 'Contact')
    await page.fill('input[id="email"]', 'original@example.com')
    await page.click('button:has-text("Create Contact")')

    await page.hover('text=Original Contact')
    await page.click('button[aria-haspopup="menu"]')
    await page.click('text=Duplicate')

    await expect(page.locator('text=Original Contact')).toHaveCount(2)
  })

  test('should delete a contact', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'To Delete')
    await page.fill('input[id="lastName"]', 'Contact')
    await page.click('button:has-text("Create Contact")')
    await expect(page.locator('text=To Delete Contact')).toBeVisible()

    await page.hover('text=To Delete Contact')
    await page.click('button[aria-haspopup="menu"]')
    await page.click('text=Delete')

    await page.on('dialog', dialog => dialog.accept())

    await expect(page.locator('text=To Delete Contact')).not.toBeVisible()
  })

  test('should search contacts', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'Searchable')
    await page.fill('input[id="lastName"]', 'Contact')
    await page.fill('input[id="email"]', 'searchable@example.com')
    await page.click('button:has-text("Create Contact")')

    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'Another')
    await page.fill('input[id="lastName"]', 'Person')
    await page.fill('input[id="email"]', 'another@example.com')
    await page.click('button:has-text("Create Contact")')

    await page.fill('input[placeholder="Search contacts..."]', 'Searchable')
    await expect(page.locator('text=Searchable Contact')).toBeVisible()
    await expect(page.locator('text=Another Person')).not.toBeVisible()
  })

  test('should filter by favorites only', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'Favorite')
    await page.fill('input[id="lastName"]', 'One')
    await page.click('button:has-text("Create Contact")')

    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'Regular')
    await page.fill('input[id="lastName"]', 'Two')
    await page.click('button:has-text("Create Contact")')

    await page.hover('text=Favorite One')
    await page.click('button[aria-haspopup="menu"]')
    await page.click('text=Add to Favorites')

    await page.click('button:has-text("Favorites"):not([aria-label])')
    await expect(page.locator('text=Favorite One')).toBeVisible()
    await expect(page.locator('text=Regular Two')).not.toBeVisible()
  })

  test('should switch between grid and list views', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'View')
    await page.fill('input[id="lastName"]', 'Test')
    await page.click('button:has-text("Create Contact")')

    await page.click('button[aria-label="List View"]')
    await expect(page.locator('text=View Test')).toBeVisible()

    await page.click('button[aria-label="Grid View"]')
    await expect(page.locator('text=View Test')).toBeVisible()
  })

  test('should create contact with minimal fields', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'Minimal')
    await page.click('button:has-text("Create Contact")')

    await expect(page.locator('text=Minimal')).toBeVisible()
  })

  test('should validate required first name', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.click('button:has-text("Create Contact")')
    await expect(page.locator('text=/First Name.*required/i')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'Test')
    await page.fill('input[id="email"]', 'invalid-email')
    await page.click('button:has-text("Create Contact")')
    await expect(page.locator('text=/Invalid email/i')).toBeVisible()
  })

  test('should validate avatar URL format', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'Test')
    await page.fill('input[id="avatarUrl"]', 'not-a-url')
    await page.click('button:has-text("Create Contact")')
    await expect(page.locator('text=/Invalid URL/i')).toBeVisible()
  })

  test('should validate birthday format', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'Test')
    await page.fill('input[id="birthday"]', 'not-a-date')
    await page.click('button:has-text("Create Contact")')
    await expect(page.locator('text=/Invalid.*date|Invalid input/i')).toBeVisible()
  })

  test('should persist contacts after page reload', async ({ page }) => {
    await page.click('button:has-text("New Contact")')
    await page.fill('input[id="firstName"]', 'Persistent')
    await page.fill('input[id="lastName"]', 'Contact')
    await page.click('button:has-text("Create Contact")')
    await expect(page.locator('text=Persistent Contact')).toBeVisible()

    await page.reload()
    await page.waitForURL('/dashboard/contacts')
    await expect(page.locator('text=Persistent Contact')).toBeVisible()
  })

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/contacts')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText('Contacts')
    await page.click('button:has-text("New Contact")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })
})