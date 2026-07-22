import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FinanceListView } from '@/components/finances/finance-list-view'
import { FinanceEntry, Budget } from '@/types'

const mockEntries: FinanceEntry[] = [
  {
    id: '1',
    type: 'EXPENSE',
    amount: 50.00,
    currency: 'USD',
    category: 'Food',
    subcategory: 'Groceries',
    description: 'Weekly groceries',
    date: new Date('2024-01-15'),
    recurring: false,
    recurringRule: null,
    tags: ['food'],
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    type: 'INCOME',
    amount: 3000.00,
    currency: 'USD',
    category: 'Salary',
    subcategory: null,
    description: 'Monthly salary',
    date: new Date('2024-01-01'),
    recurring: false,
    recurringRule: null,
    tags: [],
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    type: 'EXPENSE',
    amount: 25.00,
    currency: 'USD',
    category: 'Transportation',
    subcategory: 'Gas',
    description: 'Gas fill up',
    date: new Date('2024-01-10'),
    recurring: false,
    recurringRule: null,
    tags: [],
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockBudgets: Budget[] = [
  {
    id: 'b1',
    name: 'Monthly Food Budget',
    category: 'Food',
    amount: 500,
    currency: 'USD',
    period: 'MONTHLY',
    startDate: new Date('2024-01-01'),
    endDate: null,
    alertThreshold: 80,
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

describe('FinanceListView', () => {
  const defaultProps = {
    entries: mockEntries,
    budgets: mockBudgets,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAddEntry: vi.fn(),
    onAddBudget: vi.fn(),
    isLoading: false,
  }

  it('renders transaction list with entries', () => {
    render(<FinanceListView {...defaultProps} />)
    
    expect(screen.getByText('Transactions')).toBeInTheDocument()
    expect(screen.getByText('Weekly groceries')).toBeInTheDocument()
    expect(screen.getByText('Monthly salary')).toBeInTheDocument()
    expect(screen.getByText('Gas fill up')).toBeInTheDocument()
  })

  it('displays correct amounts with signs', () => {
    render(<FinanceListView {...defaultProps} />)
    
    expect(screen.getByText('-$50.00')).toBeInTheDocument()
    expect(screen.getByText('+$3,000.00')).toBeInTheDocument()
    expect(screen.getByText('-$25.00')).toBeInTheDocument()
  })

  it('shows budget progress section when budgets exist', () => {
    render(<FinanceListView {...defaultProps} />)
    
    expect(screen.getByText('Budget Progress')).toBeInTheDocument()
  })

  it('filters transactions by search query', () => {
    render(<FinanceListView {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search transactions...')
    fireEvent.change(searchInput, { target: { value: 'salary' } })
    
    expect(screen.getByText('Monthly salary')).toBeInTheDocument()
    expect(screen.queryByText('Weekly groceries')).not.toBeInTheDocument()
  })

  it('shows empty state when no entries match filter', () => {
    render(<FinanceListView {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('Search transactions...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    
    expect(screen.getByText('No transactions found')).toBeInTheDocument()
  })

  it('shows loading skeleton when isLoading is true', () => {
    render(<FinanceListView {...defaultProps} isLoading={true} />)
    
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('sorts transactions by date descending by default', () => {
    render(<FinanceListView {...defaultProps} />)
    
    const rows = screen.getAllByRole('row')
    const firstDataRow = rows[1]
    expect(firstDataRow).toHaveTextContent('Weekly groceries')
  })

  it('displays transaction types with correct badges', () => {
    render(<FinanceListView {...defaultProps} />)
    
    expect(screen.getByText('Income')).toBeInTheDocument()
    const expenseBadges = screen.getAllByText('Expense')
    expect(expenseBadges.length).toBeGreaterThanOrEqual(2)
  })

  it('renders action buttons for each transaction', () => {
    render(<FinanceListView {...defaultProps} />)
    
    // Each row should have a dropdown menu button (MoreHorizontal icon)
    const dropdownTriggers = screen.getAllByRole('button', { name: '' })
    expect(dropdownTriggers.length).toBeGreaterThanOrEqual(3)
  })

  it('displays category filter with available categories', () => {
    render(<FinanceListView {...defaultProps} />)
    
    const categorySelect = screen.getAllByRole('combobox')[1]
    fireEvent.click(categorySelect)
    
    expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Salary' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Transportation' })).toBeInTheDocument()
  })
})