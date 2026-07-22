import { test, expect } from '@playwright/test'

test.describe('Notes Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/dashboard/notes')
    await page.waitForLoadState('networkidle')
  })

  test('should display notes page with empty state', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Notes')
    await expect(page.locator('text=Create your first note')).toBeVisible()
  })

  test('should create a new note', async ({ page }) => {
    await page.click('button:has-text("New Note")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    await page.fill('input[placeholder="Note title"]', 'Test Note')
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('This is a test note content')

    await page.click('button:has-text("Create Note")')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()

    await expect(page.locator('text=Test Note')).toBeVisible()
    await expect(page.locator('text=This is a test note content')).toBeVisible()
  })

  test('should edit an existing note', async ({ page }) => {
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder="Note title"]', 'Original Note')
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Original content')
    await page.click('button:has-text("Create Note")')
    await expect(page.locator('text=Original Note')).toBeVisible()

    await page.hover('[data-testid="note-card-0"]')
    await page.click('[data-testid="note-card-0"] >> text=⋮')
    await page.click('text=Edit')

    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await page.fill('input[placeholder="Note title"]', 'Updated Note')
    await page.locator('.ProseMirror').click()
    await page.keyboard.selectAll()
    await page.keyboard.type('Updated content')
    await page.click('button:has-text("Save Changes")')

    await expect(page.locator('text=Updated Note')).toBeVisible()
    await expect(page.locator('text=Updated content')).toBeVisible()
  })

  test('should pin and unpin a note', async ({ page }) => {
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder="Note title"]', 'Pinnable Note')
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Content')
    await page.click('button:has-text("Create Note")')

    await page.hover('[data-testid="note-card-0"]')
    await page.click('[data-testid="note-card-0"] >> text=⋮')
    await page.click('text=Pin')

    await expect(page.locator('[data-testid="note-card-0"] >> .text-amber-500')).toBeVisible()

    await page.hover('[data-testid="note-card-0"]')
    await page.click('[data-testid="note-card-0"] >> text=⋮')
    await page.click('text=Unpin')

    await expect(page.locator('[data-testid="note-card-0"] >> .text-amber-500')).not.toBeVisible()
  })

  test('should archive and unarchive a note', async ({ page }) => {
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder="Note title"]', 'Archivable Note')
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Content')
    await page.click('button:has-text("Create Note")')

    await page.hover('[data-testid="note-card-0"]')
    await page.click('[data-testid="note-card-0"] >> text=⋮')
    await page.click('text=Archive')

    await expect(page.locator('text=Archivable Note')).not.toBeVisible()

    await page.click('button:has-text("Show Archived")')
    await expect(page.locator('text=Archivable Note')).toBeVisible()

    await page.hover('[data-testid="note-card-0"]')
    await page.click('[data-testid="note-card-0"] >> text=⋮')
    await page.click('text=Unarchive')

    await expect(page.locator('text=Archivable Note')).toBeVisible()
  })

  test('should duplicate a note', async ({ page }) => {
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder="Note title"]', 'Original Note')
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Original content')
    await page.click('button:has-text("Create Note")')

    await page.hover('[data-testid="note-card-0"]')
    await page.click('[data-testid="note-card-0"] >> text=⋮')
    await page.click('text=Duplicate')

    await expect(page.locator('text=Original Note (Copy)')).toBeVisible()
  })

  test('should delete a note', async ({ page }) => {
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder="Note title"]', 'To Delete')
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Content')
    await page.click('button:has-text("Create Note")')

    await page.hover('[data-testid="note-card-0"]')
    await page.click('[data-testid="note-card-0"] >> text=⋮')
    await page.click('text=Delete')

    await page.on('dialog', dialog => dialog.accept())

    await expect(page.locator('text=To Delete')).not.toBeVisible()
  })

  test('should search notes', async ({ page }) => {
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder="Note title"]', 'Searchable Note')
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Searchable content')
    await page.click('button:has-text("Create Note")')

    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder="Note title"]', 'Another Note')
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Different content')
    await page.click('button:has-text("Create Note")')

    await page.fill('input[placeholder="Search notes..."]', 'Searchable')
    await expect(page.locator('text=Searchable Note')).toBeVisible()
    await expect(page.locator('text=Another Note')).not.toBeVisible()
  })

  test('should filter by tags', async ({ page }) => {
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder="Note title"]', 'Tagged Note')
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Content')
    await page.fill('input[placeholder="Add tag..."]', 'important')
    await page.keyboard.press('Enter')
    await page.click('button:has-text("Create Note")')

    await page.fill('input[placeholder="Search notes..."]', 'important')
    await expect(page.locator('text=Tagged Note')).toBeVisible()
  })

  test('should switch between grid and list views', async ({ page }) => {
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder="Note title"]', 'View Test')
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Content')
    await page.click('button:has-text("Create Note")')

    await page.click('button[aria-label="List View"]')
    await expect(page.locator('text=View Test')).toBeVisible()

    await page.click('button[aria-label="Grid View"]')
    await expect(page.locator('text=View Test')).toBeVisible()
  })

  test('should format text with TipTap editor', async ({ page }) => {
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder="Note title"]', 'Formatted Note')

    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Bold text')
    await page.keyboard.press('Control+a')
    await page.click('button[aria-label="Bold"]')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.type(' normal text')

    await page.click('button:has-text("Create Note")')

    await expect(page.locator('text=Formatted Note')).toBeVisible()
  })
})