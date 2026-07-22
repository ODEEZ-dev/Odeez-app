import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodayHabitList } from '@/components/dashboard/today-view'
import { Target } from 'lucide-react'

const mockHabits = [
  {
    id: '1',
    name: 'Exercise',
    color: '#10B981',
    icon: '💪',
    targetCount: 1,
    unit: 'time',
    completed: true,
    progress: 100,
    logCount: 1,
  },
  {
    id: '2',
    name: 'Read',
    color: '#3B82F6',
    icon: '📚',
    targetCount: 30,
    unit: 'minutes',
    completed: false,
    progress: 50,
    logCount: 15,
  },
]

describe('TodayHabitList', () => {
  it('renders habits with progress', () => {
    render(
      <TodayHabitList habits={mockHabits} />
    )
    
    expect(screen.getByText('Exercise')).toBeInTheDocument()
    expect(screen.getByText('Read')).toBeInTheDocument()
    expect(screen.getByText('1/1 time')).toBeInTheDocument()
    expect(screen.getByText('15/30 minutes')).toBeInTheDocument()
  })

  it('shows completed indicator for completed habits', () => {
    render(
      <TodayHabitList habits={mockHabits} />
    )
    
    // Check for the checkmark SVG in the completed habit (it's in a sibling span)
    const completedIndicator = screen.getByText('Exercise').closest('div')?.nextElementSibling
    expect(completedIndicator?.innerHTML).toContain('svg')
  })

  it('shows empty state when no habits', () => {
    render(
      <TodayHabitList habits={[]} />
    )
    
    expect(screen.getByText('No habits yet. Start building better habits!')).toBeInTheDocument()
  })

  it('shows loading skeleton when loading', () => {
    render(
      <TodayHabitList habits={[]} loading={true} />
    )
    
    const animatedElements = document.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
  })
})