'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Plus, ArrowUpDown, PieChart, BarChart2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinanceListView } from '@/components/finances/finance-list-view'
import { FinanceDialog } from '@/components/finances/finance-dialog'
import { BudgetDialog } from '@/components/finances/budget-dialog'
import { BudgetProgressChart, ExpenseCategoryChart, IncomeExpenseTrendChart, SavingsRateChart, FinanceOverviewChart } from '@/components/finances/finance-charts'
import { FinanceEntry, Budget } from '@/types'
import { FinanceEntryCreateInput, FinanceEntryUpdateInput, BudgetCreateInput, BudgetUpdateInput } from '@/lib/validations/finance'
import { toast } from '@/hooks/use-toast'

interface FinanceResponse {
  data: FinanceEntry[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface BudgetResponse {
  data: Budget[]
}

async function fetchFinanceEntries(params?: URLSearchParams): Promise<FinanceResponse> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const queryString = params ? `?${params.toString()}` : ''
  const response = await fetch(`/api/finances${queryString}`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch finance entries')
  }

  return response.json()
}

async function fetchBudgets(): Promise<BudgetResponse> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch('/api/budgets', {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch budgets')
  }

  return response.json()
}

async function createFinanceEntry(data: FinanceEntryCreateInput): Promise<FinanceEntry> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch('/api/finances', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create finance entry')
  }

  return response.json()
}

async function updateFinanceEntry(id: string, data: FinanceEntryUpdateInput): Promise<FinanceEntry> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/finances/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update finance entry')
  }

  return response.json()
}

async function deleteFinanceEntry(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/finances/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete finance entry')
  }
}

async function createBudget(data: BudgetCreateInput): Promise<Budget> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch('/api/budgets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create budget')
  }

  return response.json()
}

async function updateBudget(id: string, data: BudgetUpdateInput): Promise<Budget> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/budgets/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update budget')
  }

  return response.json()
}

async function deleteBudget(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/budgets/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete budget')
  }
}

export default function FinancesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null)
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [activeTab, setActiveTab] = useState<'transactions' | 'budgets' | 'reports'>('transactions')
  const setTab = (value: string) => setActiveTab(value as 'transactions' | 'budgets' | 'reports')

  const params = useMemo(() => {
    const p = new URLSearchParams()
    p.append('page', page.toString())
    p.append('limit', limit.toString())
    p.append('sortBy', 'date')
    p.append('sortOrder', 'desc')
    return p
  }, [page, limit])

  const { data: financeData, isLoading: isFinanceLoading, error: financeError, refetch: refetchFinances } = useQuery({
    queryKey: ['finances', params.toString()],
    queryFn: () => fetchFinanceEntries(params),
  })

  const { data: budgetsData } = useQuery({
    queryKey: ['budgets'],
    queryFn: fetchBudgets,
  })

  const entries = financeData?.data || []
  const budgets = budgetsData?.data || []
  const totalEntries = financeData?.meta.total || 0
  const totalPages = financeData?.meta.totalPages || 1

  const totalIncome = entries
    .filter((e) => e.type === 'INCOME' || e.type === 'INVESTMENT')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const totalExpenses = entries
    .filter((e) => e.type === 'EXPENSE')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const balance = totalIncome - totalExpenses

  const createMutation = useMutation({
    mutationFn: createFinanceEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Transaction created successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create transaction', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FinanceEntryUpdateInput }) => updateFinanceEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Transaction updated successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update transaction', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFinanceEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Transaction deleted' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete transaction', description: error.message, variant: 'destructive' })
    },
  })

  const budgetCreateMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast({ title: 'Budget created successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create budget', description: error.message, variant: 'destructive' })
    },
  })

  const budgetUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetUpdateInput }) => updateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast({ title: 'Budget updated successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update budget', description: error.message, variant: 'destructive' })
    },
  })

  const budgetDeleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast({ title: 'Budget deleted' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete budget', description: error.message, variant: 'destructive' })
    },
  })

  const handleEntryDelete = useCallback((entryId: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(entryId)
    }
  }, [deleteMutation])

  const handleAddEntry = useCallback(() => {
    setEditingEntry(null)
    setDialogOpen(true)
  }, [])

  const handleEdit = useCallback((entry: FinanceEntry) => {
    setEditingEntry(entry)
    setDialogOpen(true)
  }, [])

  const handleAddBudget = useCallback(() => {
    setEditingBudget(null)
    setBudgetDialogOpen(true)
  }, [])

  const handleBudgetDelete = useCallback((budgetId: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      budgetDeleteMutation.mutate(budgetId)
    }
  }, [budgetDeleteMutation])

  const handleDialogSubmit = useCallback(async (entryData: FinanceEntryCreateInput) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data: entryData })
    } else {
      await createMutation.mutateAsync(entryData)
    }
    setEditingEntry(null)
    setDialogOpen(false)
  }, [editingEntry, createMutation, updateMutation])

  const handleBudgetDialogSubmit = useCallback(async (budgetData: BudgetCreateInput) => {
    if (editingBudget) {
      budgetUpdateMutation.mutate({ id: editingBudget.id, data: budgetData })
    } else {
      await budgetCreateMutation.mutateAsync(budgetData)
    }
    setEditingBudget(null)
    setBudgetDialogOpen(false)
  }, [editingBudget, budgetCreateMutation, budgetUpdateMutation])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  if (isFinanceLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded mt-1" />
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-12 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (financeError) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Failed to load finances. Please try again.</p>
        <Button onClick={() => refetchFinances()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PieChart className="h-8 w-8 text-green-500" />
            Finances
          </h1>
          <p className="text-muted-foreground mt-1">
            {totalEntries} transaction{totalEntries !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button onClick={activeTab === 'transactions' ? handleAddEntry : handleAddBudget}>
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'transactions' ? 'Add Transaction' : 'Add Budget'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Income</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <ArrowUpDown className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <ArrowUpDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold mt-1" style={{ color: balance >= 0 ? 'var(--color-green-600)' : 'var(--color-red-600)' }}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: balance >= 0 ? 'var(--color-green-100)' : 'var(--color-red-100)' }}>
                <ArrowUpDown className="h-6 w-6" style={{ color: balance >= 0 ? 'var(--color-green-600)' : 'var(--color-red-600)' }} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budgets</p>
                <p className="text-2xl font-bold mt-1">{budgets.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <BarChart2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <FinanceListView
            entries={entries}
            budgets={budgets}
            isLoading={isFinanceLoading}
            onEdit={handleEdit}
            onDelete={handleEntryDelete}
            onAddEntry={handleAddEntry}
            onAddBudget={handleAddBudget}
            onDeleteBudget={handleBudgetDelete}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Budget Overview</h2>
            <Button onClick={handleAddBudget}>
              <Plus className="h-4 w-4 mr-2" />
              New Budget
            </Button>
          </div>
          {budgets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <BarChart2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg">No budgets yet</p>
                <p className="text-sm">Create a budget to track your spending by category</p>
                <Button className="mt-4" onClick={handleAddBudget}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Budget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <BudgetProgressChart budgets={budgets} onDelete={handleBudgetDelete} />
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                <p className="text-xs text-muted-foreground">Income</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
                <p className="text-xs text-muted-foreground">Expenses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: totalIncome > 0 ? 'var(--color-green-600)' : 'var(--color-red-600)' }}>
                  {totalIncome > 0 ? `${(((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">of income</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {entries.length > 0 ? formatCurrency(entries.reduce((sum, e) => sum + Number(e.amount), 0) / entries.length) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">per transaction</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ExpenseCategoryChart entries={entries} />
            <IncomeExpenseTrendChart entries={entries} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SavingsRateChart entries={entries} />
            <FinanceOverviewChart entries={entries} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <FinanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
        initialData={editingEntry
          ? {
              ...editingEntry,
              amount: Number(editingEntry.amount),
              date: editingEntry.date instanceof Date ? editingEntry.date.toISOString().split('T')[0] : editingEntry.date,
              subcategory: editingEntry.subcategory ?? undefined,
              description: editingEntry.description ?? undefined,
              recurringRule: editingEntry.recurringRule ?? undefined,
            }
          : null}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Budget Dialog */}
      <BudgetDialog
        open={budgetDialogOpen}
        onOpenChange={setBudgetDialogOpen}
        onSubmit={handleBudgetDialogSubmit}
        initialData={editingBudget
          ? {
              ...editingBudget,
              amount: Number(editingBudget.amount),
              startDate: editingBudget.startDate instanceof Date ? editingBudget.startDate.toISOString().split('T')[0] : editingBudget.startDate,
              endDate: editingBudget.endDate ? (editingBudget.endDate instanceof Date ? editingBudget.endDate.toISOString().split('T')[0] : editingBudget.endDate) : '',
              period: editingBudget.period as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
            }
          : null}
        isLoading={budgetCreateMutation.isPending || budgetUpdateMutation.isPending}
      />
    </div>
  )
}