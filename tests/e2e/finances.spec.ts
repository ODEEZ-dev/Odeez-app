import { test, expect } from '@playwright/test'

test.describe('Finances Module', () => {
  test.beforeEach(async ({ page }) => {
    // Register a new user for each test
    await page.goto('/auth/register')
    await page.fill('input[id="name"]', 'Test User')
    await page.fill('input[type="email"]', `test${Date.now()}@example.com`)
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/dashboard/finances')
  })

  test.describe('Transactions Tab', () => {
    test('displays transactions table with columns', async ({ page }) => {
      await expect(page.locator('text=Transactions')).toBeVisible()
      await expect(page.locator('text=Date')).toBeVisible()
      await expect(page.locator('text=Description')).toBeVisible()
      await expect(page.locator('text=Category')).toBeVisible()
      await expect(page.locator('text=Amount')).toBeVisible()
      await expect(page.locator('text=Type')).toBeVisible()
    })

    test('shows add transaction button', async ({ page }) => {
      await expect(page.locator('button:has-text("Add Transaction")')).toBeVisible()
    })

    test('can create a new expense transaction', async ({ page }) => {
      await page.click('button:has-text("Add Transaction")')
      await expect(page.locator('text=New Transaction')).toBeVisible()
      await page.fill('input[placeholder="0.00"]', '25.50')
      await page.fill('input[placeholder="Select category"]', 'Food')
      await page.click('button:has-text("Food")')
      await page.fill('textarea[placeholder="Add details about this transaction..."]', 'Test expense')
      await page.click('button:has-text("Create")')
      await expect(page.locator('text=Test expense')).toBeVisible()
      await expect(page.locator('text=-$25.50')).toBeVisible()
    })

    test('can create a new income transaction', async ({ page }) => {
      await page.click('button:has-text("Add Transaction")')
      await expect(page.locator('text=New Transaction')).toBeVisible()
      
      // Select Income type
      await page.click('button:has-text("Expense")')
      await page.click('text=Income')
      
      await page.fill('input[placeholder="0.00"]', '1000.00')
      await page.fill('input[placeholder="Select category"]', 'Salary')
      await page.click('button:has-text("Salary")')
      await page.fill('textarea[placeholder="Add details about this transaction..."]', 'Test income')
      await page.click('button:has-text("Create")')
      await expect(page.locator('text=Test income')).toBeVisible()
      await expect(page.locator('text=+$1,000.00')).toBeVisible()
    })

    test('can filter transactions by search', async ({ page }) => {
      // Create a transaction first
      await page.click('button:has-text("Add Transaction")')
      await page.fill('input[placeholder="0.00"]', '50.00')
      await page.fill('input[placeholder="Select category"]', 'Food')
      await page.click('button:has-text("Food")')
      await page.fill('textarea[placeholder="Add details about this transaction..."]', 'Unique search term')
      await page.click('button:has-text("Create")')
      
      // Search for it
      await page.fill('input[placeholder="Search transactions..."]', 'Unique')
      await expect(page.locator('text=Unique search term')).toBeVisible()
    })

    test('shows empty state when no transactions match', async ({ page }) => {
      await page.fill('input[placeholder="Search transactions..."]', 'nonexistent')
      await expect(page.locator('text=No transactions found')).toBeVisible()
    })
  })

  test.describe('Budgets Tab', () => {
    test('can switch to budgets tab', async ({ page }) => {
      await page.click('button:has-text("Budgets")')
      await expect(page.locator('text=Budget Overview')).toBeVisible()
    })

    test('shows empty state when no budgets', async ({ page }) => {
      await page.click('button:has-text("Budgets")')
      await expect(page.locator('text=No budgets yet')).toBeVisible()
    })

    test('can create a new budget', async ({ page }) => {
      await page.click('button:has-text("Budgets")')
      await page.click('button:has-text("New Budget")')
      await expect(page.locator('text=New Budget')).toBeVisible()
      
      await page.fill('input[placeholder="e.g., Monthly Groceries"]', 'Test Budget')
      await page.fill('input[placeholder="e.g., Food, Transportation"]', 'Food')
      await page.fill('input[placeholder="0.00"]', '300')
      await page.click('button:has-text("Create")')
      
      await expect(page.locator('text=Test Budget')).toBeVisible()
    })
  })

  test.describe('Reports Tab', () => {
    test('can switch to reports tab', async ({ page }) => {
      await page.click('button:has-text("Reports")')
      await expect(page.locator('text=Savings Rate')).toBeVisible()
      await expect(page.locator('text=Avg. Transaction')).toBeVisible()
    })
  })
})