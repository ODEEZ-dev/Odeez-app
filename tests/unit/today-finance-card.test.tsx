import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodayFinanceCard } from '@/components/dashboard/today-view'
import { DollarSign } from 'lucide-react'

describe('TodayFinanceCard', () => {
  it('renders income, expenses, and balance', () => {
    render(
      <TodayFinanceCard income={5000} expenses={3000} balance={2000} />
    )
    
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
    expect(screen.getByText('$3,000.00')).toBeInTheDocument()
    expect(screen.getByText('$2,000.00')).toBeInTheDocument()
  })

  it('shows negative balance in red', () => {
    render(
      <TodayFinanceCard income={1000} expenses={2000} balance={-1000} />
    )
    
    const balanceValue = screen.getByText('-$1,000.00')
    expect(balanceValue).toBeInTheDocument()
  })

  it('shows spending percentage', () => {
    render(
      <TodayFinanceCard income={1000} expenses={600} balance={400} />
    )
    
    expect(screen.getByText('60% of income spent')).toBeInTheDocument()
  })

  it('shows loading skeleton when loading', () => {
    render(
      <TodayFinanceCard income={0} expenses={0} balance={0} loading={true} />
    )
    
    const animatedElements = document.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
  })
})