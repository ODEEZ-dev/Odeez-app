import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodayTaskList } from '@/components/dashboard/today-view'
import { CheckSquare } from 'lucide-react'

const mockTasks = [
  { id: '1', title: 'Task 1', dueDate: '2024-01-15T10:00:00Z', priority: 'HIGH', status: 'TODO' },
  { id: '2', title: 'Task 2', dueDate: '2024-01-15T14:00:00Z', priority: 'MEDIUM', status: 'IN_PROGRESS' },
]

const mockOverdueTasks = [
  { id: '3', title: 'Overdue Task', dueDate: '2024-01-14T10:00:00Z', priority: 'URGENT' },
]

describe('TodayTaskList', () => {
  it('renders tasks due today', () => {
    render(
      <TodayTaskList tasks={mockTasks} overdue={[]} />
    )
    
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
  })

  it('renders overdue tasks section', () => {
    render(
      <TodayTaskList tasks={mockTasks} overdue={mockOverdueTasks} />
    )
    
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('Overdue Task')).toBeInTheDocument()
    expect(screen.getByText('URGENT')).toBeInTheDocument()
  })

  it('shows empty state when no tasks', () => {
    render(
      <TodayTaskList tasks={[]} overdue={[]} />
    )
    
    expect(screen.getByText('No tasks due today. Enjoy your day!')).toBeInTheDocument()
  })

  it('shows loading skeleton when loading', () => {
    render(
      <TodayTaskList tasks={[]} overdue={[]} loading={true} />
    )
    
    const animatedElements = document.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
  })
})