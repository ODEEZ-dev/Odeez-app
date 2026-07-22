import { test, expect } from '@playwright/test'

test.describe('Tasks Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/dashboard/tasks')
  })

  test.describe('Kanban View', () => {
    test('displays kanban board with columns', async ({ page }) => {
      await expect(page.locator('text=To Do')).toBeVisible()
      await expect(page.locator('text=In Progress')).toBeVisible()
      await expect(page.locator('text=In Review')).toBeVisible()
      await expect(page.locator('text=Done')).toBeVisible()
    })

    test('shows add task button in each column', async ({ page }) => {
      const addButtons = page.locator('button:has-text("Add Task")')
      await expect(addButtons).toHaveCount(4)
    })

    test('can create a new task in To Do column', async ({ page }) => {
      await page.click('button:has-text("Add Task"):first')
      await expect(page.locator('text=New Task')).toBeVisible()
      await page.fill('input[placeholder="What needs to be done?"]', 'Test Kanban Task')
      await page.click('button:has-text("Create")')
      await expect(page.locator('text=Test Kanban Task')).toBeVisible()
    })

    test('can drag task between columns', async ({ page }) => {
      // Create a task first
      await page.click('button:has-text("Add Task"):first')
      await page.fill('input[placeholder="What needs to be done?"]', 'Draggable Task')
      await page.click('button:has-text("Create")')
      await expect(page.locator('text=Draggable Task')).toBeVisible()

      // Drag to In Progress
      const task = page.locator('text=Draggable Task').first()
      const inProgressColumn = page.locator('text=In Progress').locator('..')
      
      await task.dragTo(inProgressColumn)
      
      // Verify task moved
      await expect(page.locator('text=In Progress').locator('..').locator('text=Draggable Task')).toBeVisible()
    })

    test('shows task priority badge', async ({ page }) => {
      await page.click('button:has-text("Add Task"):first')
      await page.fill('input[placeholder="What needs to be done?"]', 'Urgent Task')
      // Set priority to URGENT
      await page.click('button:has-text("Priority")')
      await page.click('text=Urgent')
      await page.click('button:has-text("Create")')
      
      await expect(page.locator('text=Urgent Task').locator('..').locator('text=URGENT')).toBeVisible()
    })

    test('shows due date on task card', async ({ page }) => {
      await page.click('button:has-text("Add Task"):first')
      await page.fill('input[placeholder="What needs to be done?"]', 'Task with Due Date')
      // Set due date
      await page.click('button:has-text("Pick a date"):first')
      // Select tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.click(`button[aria-label*="${tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}"]:first`)
      await page.click('button:has-text("Create")')
      
      await expect(page.locator('text=Task with Due Date').locator('..').locator('text=/Due|\\d{1,2}\\/\\d{1,2}/')).toBeVisible()
    })

    test('shows tags on task card', async ({ page }) => {
      await page.click('button:has-text("Add Task"):first')
      await page.fill('input[placeholder="What needs to be done?"]', 'Tagged Task')
      // Add a tag
      await page.fill('input[placeholder="Tag name"]', 'important')
      await page.click('button:has-text("Add"):near(input[placeholder="Tag name"])')
      await page.click('button:has-text("Create")')
      
      await expect(page.locator('text=Tagged Task').locator('..').locator('text=important')).toBeVisible()
    })
  })

  test.describe('List View', () => {
    test('can switch to list view', async ({ page }) => {
      await page.click('button[aria-label="List View"]')
      await expect(page.locator('text=Search tasks...')).toBeVisible()
    })

    test('displays tasks in table format', async ({ page }) => {
      await page.click('button[aria-label="List View"]')
      // Create a task
      await page.click('button:has-text("New Task")')
      await page.fill('input[placeholder="What needs to be done?"]', 'List View Task')
      await page.click('button:has-text("Create")')
      
      await expect(page.locator('text=List View Task')).toBeVisible()
    })

    test('can filter tasks by status', async ({ page }) => {
      await page.click('button[aria-label="List View"]')
      await page.click('button:has-text("Status")')
      await page.click('text=In Progress')
      // Wait for filter to apply
      await page.waitForTimeout(500)
      // Only In Progress tasks should be visible
    })

    test('can filter tasks by priority', async ({ page }) => {
      await page.click('button[aria-label="List View"]')
      await page.click('button:has-text("Priority")')
      await page.click('text=High')
      await page.waitForTimeout(500)
    })

    test('can search tasks', async ({ page }) => {
      await page.click('button[aria-label="List View"]')
      await page.fill('input[placeholder="Search tasks..."]', 'List')
      await expect(page.locator('text=List View Task')).toBeVisible()
    })

    test('can sort tasks', async ({ page }) => {
      await page.click('button[aria-label="List View"]')
      await page.click('button:has-text("Sort by")')
      await page.click('text=Priority')
      await page.waitForTimeout(500)
    })

    test('shows empty state when no tasks', async ({ page }) => {
      await page.click('button[aria-label="List View"]')
      await page.fill('input[placeholder="Search tasks..."]', 'nonexistenttask')
      await expect(page.locator('text=No tasks found')).toBeVisible()
    })
  })

  test.describe('Task Dialog', () => {
    test('opens create dialog', async ({ page }) => {
      await page.click('button:has-text("New Task")')
      await expect(page.locator('text=New Task').first()).toBeVisible()
    })

    test('opens edit dialog', async ({ page }) => {
      // Create a task first
      await page.click('button:has-text("New Task")')
      await page.fill('input[placeholder="What needs to be done?"]', 'Task to Edit')
      await page.click('button:has-text("Create")')
      
      // Click more menu on the task
      await page.hover('text=Task to Edit')
      await page.click('button[aria-label="More options"]')
      await page.click('text=Edit')
      
      await expect(page.locator('text=Edit Task')).toBeVisible()
      await expect(page.locator('input[value="Task to Edit"]')).toBeVisible()
    })

    test('validates required title', async ({ page }) => {
      await page.click('button:has-text("New Task")')
      await page.click('button:has-text("Create")')
      await expect(page.locator('text=/Title.*required/i')).toBeVisible()
    })

    test('can set due date', async ({ page }) => {
      await page.click('button:has-text("New Task")')
      await page.fill('input[placeholder="What needs to be done?"]', 'Task with Date')
      await page.click('button:has-text("Pick a date"):first')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.click(`button[aria-label*="${tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}"]:first`)
      await page.click('button:has-text("Create")')
      await expect(page.locator('text=Task with Date')).toBeVisible()
    })

    test('can add multiple tags', async ({ page }) => {
      await page.click('button:has-text("New Task")')
      await page.fill('input[placeholder="What needs to be done?"]', 'Multi-tag Task')
      await page.fill('input[placeholder="Tag name"]', 'tag1')
      await page.click('button:has-text("Add"):near(input[placeholder="Tag name"])')
      await page.fill('input[placeholder="Tag name"]', 'tag2')
      await page.click('button:has-text("Add"):near(input[placeholder="Tag name"])')
      await page.click('button:has-text("Create")')
      
      await expect(page.locator('text=Multi-tag Task').locator('..').locator('text=tag1')).toBeVisible()
      await expect(page.locator('text=Multi-tag Task').locator('..').locator('text=tag2')).toBeVisible()
    })

    test('can set estimated time', async ({ page }) => {
      await page.click('button:has-text("New Task")')
      await page.fill('input[placeholder="What needs to be done?"]', 'Timed Task')
      await page.fill('input[placeholder="e.g., 60"]', '90')
      await page.click('button:has-text("Create")')
      await expect(page.locator('text=Timed Task').locator('..').locator('text=90m')).toBeVisible()
    })

    test('can set recurring rule', async ({ page }) => {
      await page.click('button:has-text("New Task")')
      await page.fill('input[placeholder="What needs to be done?"]', 'Recurring Task')
      await page.fill('input[placeholder="RRULE:FREQ=DAILY"]', 'RRULE:FREQ=WEEKLY')
      await page.click('button:has-text("Create")')
      await expect(page.locator('text=Recurring Task')).toBeVisible()
    })
  })

  test.describe('Task Actions', () => {
    test('can mark task as complete', async ({ page }) => {
      await page.click('button:has-text("New Task")')
      await page.fill('input[placeholder="What needs to be done?"]', 'Completable Task')
      await page.click('button:has-text("Create")')
      
      // Click checkbox or complete action
      await page.hover('text=Completable Task')
      await page.click('button[aria-label="More options"]')
      await page.click('text=Mark Complete')
      
      await expect(page.locator('text=Completable Task')).toHaveClass(/line-through/)
    })

    test('can start working on task', async ({ page }) => {
      await page.click('button:has-text("New Task")')
      await page.fill('input[placeholder="What needs to be done?"]', 'Startable Task')
      await page.click('button:has-text("Create")')
      
      await page.hover('text=Startable Task')
      await page.click('button[aria-label="More options"]')
      await page.click('text=Start Working')
      
      // Task should move to In Progress column
      await expect(page.locator('text=In Progress').locator('..').locator('text=Startable Task')).toBeVisible()
    })

    test('can set high priority', async ({ page }) => {
      await page.click('button:has-text("New Task")')
      await page.fill('input[placeholder="What needs to be done?"]', 'Priority Task')
      await page.click('button:has-text("Create")')
      
      await page.hover('text=Priority Task')
      await page.click('button[aria-label="More options"]')
      await page.click('text=Set High Priority')
      
      await expect(page.locator('text=Priority Task').locator('..').locator('text=HIGH')).toBeVisible()
    })

    test('can delete task', async ({ page }) => {
      await page.click('button:has-text("New Task")')
      await page.fill('input[placeholder="What needs to be done?"]', 'Deletable Task')
      await page.click('button:has-text("Create")')
      await expect(page.locator('text=Deletable Task')).toBeVisible()
      
      await page.hover('text=Deletable Task')
      await page.click('button[aria-label="More options"]')
      await page.click('text=Delete')
      
      // Confirm deletion
      await page.click('button:has-text("Delete")')
      await expect(page.locator('text=Deletable Task')).not.toBeVisible()
    })
  })

  test.describe('Persistence', () => {
    test('tasks persist after page reload', async ({ page }) => {
      await page.click('button:has-text("New Task")')
      await page.fill('input[placeholder="What needs to be done?"]', 'Persistent Task')
      await page.click('button:has-text("Create")')
      await expect(page.locator('text=Persistent Task')).toBeVisible()
      
      await page.reload()
      await page.waitForURL('/dashboard/tasks')
      await expect(page.locator('text=Persistent Task')).toBeVisible()
    })

    test('task updates persist after reload', async ({ page }) => {
      await page.click('button:has-text("New Task")')
      await page.fill('input[placeholder="What needs to be done?"]', 'Updatable Task')
      await page.click('button:has-text("Create")')
      
      await page.hover('text=Updatable Task')
      await page.click('button[aria-label="More options"]')
      await page.click('text=Start Working')
      
      await page.reload()
      await page.waitForURL('/dashboard/tasks')
      
      await expect(page.locator('text=In Progress').locator('..').locator('text=Updatable Task')).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard/tasks')
      
      await expect(page.locator('text=Tasks')).toBeVisible()
      await page.click('button:has-text("New Task")')
      await expect(page.locator('text=New Task')).toBeVisible()
    })

    test('kanban scrolls horizontally on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard/tasks')
      
      const board = page.locator('.flex.gap-4.overflow-x-auto')
      await expect(board).toBeVisible()
    })
  })
})