import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskDialog } from '@/components/tasks/task-dialog'
import { TaskListView } from '@/components/tasks/task-list-view'
import { CheckSquare, Plus, MoreVertical, Calendar, Clock, Tag, Flag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

const createMockTask = (overrides: Partial<{
  id: string
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'ARCHIVED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: Date | null
  startDate: Date | null
  completedAt: Date | null
  order: number
  estimatedMinutes: number | null
  actualMinutes: number | null
  tags: Array<{ id: string; taskId: string; name: string; color: string; createdAt: Date }>
  subtasks: Array<{ id: string; title: string; status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'ARCHIVED' }>
  _count: { comments: number; attachments: number }
  projectId: string | null
  sectionId: string | null
  parentId: string | null
  recurringRule: string | null
}> = {}) => ({
  id: overrides.id ?? '1',
  userId: 'user-1',
  title: overrides.title ?? 'Test Task',
  description: overrides.description ?? 'Test description',
  status: overrides.status ?? 'TODO',
  priority: overrides.priority ?? 'HIGH',
  dueDate: overrides.dueDate ?? new Date(Date.now() + 86400000),
  startDate: overrides.startDate ?? null,
  completedAt: overrides.completedAt ?? null,
  order: overrides.order ?? 0,
  estimatedMinutes: overrides.estimatedMinutes ?? 60,
  actualMinutes: overrides.actualMinutes ?? null,
  tags: overrides.tags ?? [
    { id: 'tag-1', taskId: '1', name: 'work', color: '#3B82F6', createdAt: new Date() },
    { id: 'tag-2', taskId: '1', name: 'urgent', color: '#EF4444', createdAt: new Date() },
  ],
  subtasks: overrides.subtasks ?? [
    { id: 'sub-1', title: 'Subtask 1', status: 'DONE' },
    { id: 'sub-2', title: 'Subtask 2', status: 'TODO' },
  ],
  _count: overrides._count ?? { comments: 2, attachments: 1 },
  projectId: overrides.projectId ?? null,
  sectionId: overrides.sectionId ?? null,
  parentId: overrides.parentId ?? null,
  recurringRule: overrides.recurringRule ?? null,
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('TaskCard', () => {
  const onUpdate = vi.fn()
  const onDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders task title', () => {
    render(<TaskCard task={createMockTask()} onUpdate={onUpdate} onDelete={onDelete} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('renders task description', () => {
    render(<TaskCard task={createMockTask()} onUpdate={onUpdate} onDelete={onDelete} />)
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('shows priority badge with correct color', () => {
    render(<TaskCard task={createMockTask()} onUpdate={onUpdate} onDelete={onDelete} />)
    const badge = screen.getByText('HIGH')
    expect(badge).toHaveClass('bg-orange-100')
  })

  it('shows due date', () => {
    // Use a date that's definitely within 24 hours to trigger "Due in X" format
    const dueSoon = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
    render(<TaskCard task={createMockTask({ dueDate: dueSoon })} onUpdate={onUpdate} onDelete={onDelete} />)
    // TaskCard uses formatDistanceToNow for due dates within 24 hours
    expect(screen.getByText(/Due in/)).toBeInTheDocument()
  })

  it('shows tags', () => {
    render(<TaskCard task={createMockTask()} onUpdate={onUpdate} onDelete={onDelete} />)
    expect(screen.getByText('work')).toBeInTheDocument()
    expect(screen.getByText('urgent')).toBeInTheDocument()
  })

  it('shows subtask progress', () => {
    render(<TaskCard task={createMockTask()} onUpdate={onUpdate} onDelete={onDelete} />)
    expect(screen.getByText('1 / 2 subtasks')).toBeInTheDocument()
  })

  it('calls onUpdate when checkbox is clicked', async () => {
    render(<TaskCard task={createMockTask()} onUpdate={onUpdate} onDelete={onDelete} />)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DONE' })
      )
    })
  })

  it('shows overdue indicator for past due dates', () => {
    const overdueTask = createMockTask({
      dueDate: new Date(Date.now() - 86400000),
    })
    render(<TaskCard task={overdueTask} onUpdate={onUpdate} onDelete={onDelete} />)
    expect(screen.getByText(/Overdue/)).toBeInTheDocument()
  })
})

describe('TaskDialog', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create dialog when open', () => {
    render(<TaskDialog open={true} onOpenChange={onOpenChange} onSubmit={onSubmit} />)
    expect(screen.getByText('New Task')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<TaskDialog open={false} onOpenChange={onOpenChange} onSubmit={onSubmit} />)
    expect(screen.queryByText('New Task')).not.toBeInTheDocument()
  })

  it('shows edit title when initialData provided', () => {
    render(
      <TaskDialog
        open={true}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialData={{ title: 'Existing Task', description: 'Existing description' }}
      />
    )
    expect(screen.getByText('Edit Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument()
  })

  it('validates required title field', async () => {
    render(<TaskDialog open={true} onOpenChange={onOpenChange} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('Create'))
    await waitFor(() => {
      expect(screen.getByText(/String must contain at least 1 character/)).toBeInTheDocument()
    })
  })

  it('closes dialog on cancel', () => {
    render(<TaskDialog open={true} onOpenChange={onOpenChange} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('TaskListView', () => {
  const onUpdate = vi.fn()
  const onDelete = vi.fn()
  const onAddTask = vi.fn()

  const tasks = [
    createMockTask({ id: '1', title: 'Task 1', priority: 'HIGH' }),
    createMockTask({ id: '2', title: 'Task 2', priority: 'MEDIUM', status: 'IN_PROGRESS' }),
    createMockTask({ id: '3', title: 'Task 3', priority: 'LOW', status: 'DONE' }),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all tasks', () => {
    render(<TaskListView tasks={tasks} onTaskUpdate={onUpdate} onTaskDelete={onDelete} onAddTask={onAddTask} />)
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
  })

  it('shows task count badge', () => {
    render(<TaskListView tasks={tasks} onTaskUpdate={onUpdate} onTaskDelete={onDelete} onAddTask={onAddTask} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('filters tasks by search query', () => {
    render(<TaskListView tasks={tasks} onTaskUpdate={onUpdate} onTaskDelete={onDelete} onAddTask={onAddTask} />)
    const searchInput = screen.getByPlaceholderText('Search tasks...')
    fireEvent.change(searchInput, { target: { value: 'Task 2' } })
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Task 3')).not.toBeInTheDocument()
  })

  it('calls onAddTask when new task button clicked', () => {
    render(<TaskListView tasks={tasks} onTaskUpdate={onUpdate} onTaskDelete={onDelete} onAddTask={onAddTask} />)
    fireEvent.click(screen.getByText('New Task'))
    expect(onAddTask).toHaveBeenCalled()
  })

  it('shows loading skeleton when loading', () => {
    render(<TaskListView tasks={[]} onTaskUpdate={onUpdate} onTaskDelete={onDelete} onAddTask={onAddTask} isLoading />)
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    const animatedElements = document.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
  })

  it('shows empty state when no tasks match filter', () => {
    render(<TaskListView tasks={tasks} onTaskUpdate={onUpdate} onTaskDelete={onDelete} onAddTask={onAddTask} />)
    const searchInput = screen.getByPlaceholderText('Search tasks...')
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } })
    expect(screen.getByText('No tasks found')).toBeInTheDocument()
  })
})