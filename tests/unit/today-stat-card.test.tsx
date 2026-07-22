import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodayStatCard } from '@/components/dashboard/today-view'
import { CheckSquare } from 'lucide-react'

describe('TodayStatCard', () => {
  it('renders label and value correctly', () => {
    render(
      <TodayStatCard
        label="Tasks Due Today"
        value={5}
        icon={<CheckSquare className="h-6 w-6 text-blue-500" />}
        color="text-blue-500"
        bgColor="bg-blue-100 dark:bg-blue-900/30"
      />
    )
    
    expect(screen.getByText('Tasks Due Today')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows trend when provided', () => {
    render(
      <TodayStatCard
        label="Completed"
        value={3}
        icon={<CheckSquare className="h-6 w-6 text-green-500" />}
        color="text-green-500"
        bgColor="bg-green-100 dark:bg-green-900/30"
        trend={{ value: 2, label: 'today' }}
      />
    )
    
    expect(screen.getByText('+2 today')).toBeInTheDocument()
  })

  it('shows loading skeleton when loading', () => {
    render(
      <TodayStatCard
        label="Loading..."
        value={0}
        icon={<CheckSquare className="h-6 w-6" />}
        color="text-blue-500"
        bgColor="bg-blue-100"
        loading={true}
      />
    )
    
    const animatedElements = document.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
  })
})