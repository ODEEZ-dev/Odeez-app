'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import {
  TRANSACTION_TYPE_OPTIONS,
  TransactionType,
  FinanceEntry,
} from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BudgetProgressChart } from './finance-charts'
import { Budget } from '@/types'
import { MoreHorizontal, Edit, Trash2, Search, ArrowUpDown, BarChart2, Plus, Target } from 'lucide-react'

interface FinanceListViewProps {
  entries: FinanceEntry[]
  budgets: Budget[]
  onEdit: (entry: FinanceEntry) => void
  onDelete: (entryId: string) => void
  onAddEntry: () => void
  onAddBudget: () => void
  onDeleteBudget?: (budgetId: string) => void
  isLoading?: boolean
}

export function FinanceListView({
  entries,
  budgets,
  onEdit,
  onDelete,
  onAddEntry,
  onAddBudget,
  onDeleteBudget,
  isLoading,
}: FinanceListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredEntries = useMemo(() => {
    let filtered = [...entries]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (entry) =>
          (entry.description?.toLowerCase().includes(query) ?? false) ||
          entry.category.toLowerCase().includes(query)
      )
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((entry) => entry.type === typeFilter)
    }

    if (categoryFilter) {
      filtered = filtered.filter((entry) => entry.category === categoryFilter)
    }

    filtered.sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date).getTime()
          bVal = new Date(b.date).getTime()
          break
        case 'amount':
          aVal = a.amount
          bVal = b.amount
          break
        case 'category':
          aVal = a.category
          bVal = b.category
          break
        default:
          aVal = new Date(a.date).getTime()
          bVal = new Date(b.date).getTime()
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      }
      return aVal < bVal ? 1 : -1
    })

    return filtered
  }, [entries, searchQuery, typeFilter, categoryFilter, sortBy, sortOrder])

  const categories = useMemo(
    () => Array.from(new Set(entries.map((e) => e.category))).sort(),
    [entries]
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          Transactions
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onAddBudget}
            aria-label="Add budget"
          >
            <Target className="h-4 w-4" />
          </Button>
          <Button onClick={onAddEntry}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionType | 'ALL')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {TRANSACTION_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'amount' | 'category')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              aria-label="Toggle sort order"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Budget Progress Charts */}
          {budgets.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget) => (
                <BudgetProgressChart key={budget.id} budgets={[budget]} onDelete={onDeleteBudget} />
              ))}
            </div>
          )}

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-2xl border bg-muted/10 p-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-muted-foreground/20">
                  <th className="text-left py-3 px-4 font-medium text-sm">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Category</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Type</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-foreground/10">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="rounded-xl hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 text-sm whitespace-nowrap">
                        {format(new Date(entry.date), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">{entry.description ?? ''}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{entry.category}</td>
                      <td className="py-3 px-4 text-sm font-medium text-right">
                        {entry.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <Badge
                          variant={
                            entry.type === 'INCOME'
                              ? 'default'
                              : entry.type === 'EXPENSE'
                              ? 'destructive'
                              : entry.type === 'TRANSFER'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {TRANSACTION_TYPE_OPTIONS.find((o) => o.value === entry.type)?.label || entry.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(entry)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(entry.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}