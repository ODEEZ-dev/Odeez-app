'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TRANSACTION_TYPE_OPTIONS, Budget } from '@/types'

interface FinanceChartProps {
  entries: Array<{
    id: string
    type: string
    amount: number
    currency: string
    category: string
    subcategory?: string | null
    date: Date
  }>
  budgets?: Budget[]
  currency?: string
}

const COLORS = {
  INCOME: '#10B981',
  EXPENSE: '#F43F5E',
  TRANSFER: '#2563EB',
  INVESTMENT: '#8B5CF6',
}

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  TRANSFER: 'Transfer',
  INVESTMENT: 'Investment',
}

export function FinanceOverviewChart({ entries, currency = 'USD' }: FinanceChartProps) {
  if (entries.length === 0) return null

  const monthlyData = entries.reduce((acc, entry) => {
    const month = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    let existing = acc.find((d) => d.month === month)
    if (!existing) {
      existing = { month, INCOME: 0, EXPENSE: 0, TRANSFER: 0, INVESTMENT: 0 }
      acc.push(existing)
    }
    const type = entry.type as 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT'
    existing[type] += Number(entry.amount)
    return acc
  }, [] as Array<{ month: string; INCOME: number; EXPENSE: number; TRANSFER: number; INVESTMENT: number }>)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tickFormatter={(value) => formatCurrency(value, currency)} tick={{ fontSize: 12 }} />
              <YAxis dataKey="month" type="category" width={60} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value, currency),
                  TYPE_LABELS[name] || name,
                ]}
                labelFormatter={(label) => label}
              />
              <Legend />
              {TRANSACTION_TYPE_OPTIONS.map((opt) => (
                <Bar
                  key={opt.value}
                  dataKey={opt.value}
                  name={opt.label}
                  fill={COLORS[opt.value as keyof typeof COLORS]}
                  radius={[0, 4, 4, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function ExpenseCategoryChart({ entries, currency = 'USD' }: FinanceChartProps) {
  const expenses = entries.filter((e) => e.type === 'EXPENSE')
  
  if (expenses.length === 0) return null

  const categoryData = expenses.reduce((acc, entry) => {
    const existing = acc.find((d) => d.category === entry.category)
    const amount = Number(entry.amount)
    if (existing) {
      existing.value += amount
    } else {
      acc.push({ category: entry.category, value: amount })
    }
    return acc
  }, [] as Array<{ category: string; value: number }>)

  const sortedCategories = categoryData
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const COLORS_PIE = ['#F43F5E', '#FB923C', '#FBBF24', '#A3E635', '#34D399', '#22D3EE', '#60A5FA', '#A78BFA']

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sortedCategories}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="category"
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {sortedCategories.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatCurrency(value, currency), 'Amount']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function IncomeExpenseTrendChart({ entries, currency = 'USD' }: FinanceChartProps) {
  if (entries.length === 0) return null

  const monthlyData = entries.reduce((acc, entry) => {
    const month = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const existing = acc.find((d) => d.month === month)
    const amount = Number(entry.amount)

    if (existing) {
      if (entry.type === 'INCOME' || entry.type === 'INVESTMENT') {
        existing.income += amount
      } else {
        existing.expenses += amount
      }
      existing.balance = existing.income - existing.expenses
    } else {
      acc.push({
        month,
        income: entry.type === 'INCOME' || entry.type === 'INVESTMENT' ? amount : 0,
        expenses: entry.type === 'EXPENSE' || entry.type === 'TRANSFER' ? amount : 0,
        balance: entry.type === 'INCOME' || entry.type === 'INVESTMENT' ? amount : -amount,
      })
    }
    return acc
  }, [] as Array<{ month: string; income: number; expenses: number; balance: number }>)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.INCOME} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.INCOME} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.EXPENSE} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.EXPENSE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value, currency)} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value, currency),
                  name === 'income' ? 'Income' : name === 'expenses' ? 'Expenses' : 'Balance',
                ]}
                labelFormatter={(label) => label}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke={COLORS.INCOME}
                fill="url(#incomeGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke={COLORS.EXPENSE}
                fill="url(#expenseGradient)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="balance"
                name="Net Balance"
                stroke="#6B7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function BudgetProgressChart({ budgets }: { budgets: Budget[] }) {
  if (!budgets || budgets.length === 0) return null

  const activeBudgets = budgets
    .filter((b) => (b.spent && b.spent > 0) || !b.isOverBudget)
    .slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeBudgets.map((budget) => {
            const spent = budget.spent ?? 0
            const percentage = budget.percentage ?? (budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0)
            const isOverBudget = budget.isOverBudget ?? (spent > budget.amount)
            const isNearThreshold = budget.isNearThreshold ?? (percentage >= (budget.alertThreshold ?? 80))

            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{budget.name} ({budget.category})</span>
                  <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                    {percentage}%
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`
                      h-full rounded-full transition-all duration-300
                      ${isOverBudget ? 'bg-red-500' : isNearThreshold ? 'bg-amber-500' : 'bg-green-500'}
                    `}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Spent: {formatCurrency(spent)}</span>
                  <span>Budget: {formatCurrency(budget.amount)}</span>
                  <span>Remaining: {formatCurrency(budget.amount - spent)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function SavingsRateChart({ entries }: FinanceChartProps) {
  if (entries.length === 0) return null

  const monthlyData = entries.reduce((acc, entry) => {
    const month = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const existing = acc.find((d) => d.month === month)
    const amount = Number(entry.amount)

    if (existing) {
      if (entry.type === 'INCOME' || entry.type === 'INVESTMENT') {
        existing.income += amount
      } else if (entry.type === 'EXPENSE') {
        existing.expenses += amount
      }
      existing.savingsRate = existing.income > 0 
        ? ((existing.income - existing.expenses) / existing.income) * 100 
        : 0
    } else {
      const income = entry.type === 'INCOME' || entry.type === 'INVESTMENT' ? amount : 0
      const expenses = entry.type === 'EXPENSE' ? amount : 0
      acc.push({
        month,
        income,
        expenses,
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
      })
    }
    return acc
  }, [] as Array<{ month: string; income: number; expenses: number; savingsRate: number }>)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Savings Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                domain={['auto', 'auto']}
              />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: number) => [value.toFixed(1) + '%', 'Savings Rate']}
                labelFormatter={(label) => label}
              />
              <Line
                type="monotone"
                dataKey="savingsRate"
                name="Savings Rate"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}