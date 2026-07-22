import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { budgetCreateSchema, budgetQuerySchema, BudgetCreateInput, BudgetQueryInput } from '@/lib/validations/finance'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = budgetQuerySchema.parse(Object.fromEntries(searchParams)) as BudgetQueryInput

    const where: Record<string, unknown> = { userId: user.id }

    if (query.category) where.category = query.category
    if (query.period) where.period = query.period
    if (query.active !== undefined) {
      const now = new Date()
      if (query.active) {
        where.AND = [
          { startDate: { lte: now } },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ]
      } else {
        where.OR = [
          { startDate: { gt: now } },
          { endDate: { lt: now } },
        ]
      }
    }

    const budgets = await prisma.budget.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Calculate spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const periodStart = new Date(budget.startDate)
        let periodEnd: Date
        if (budget.endDate) {
          periodEnd = new Date(budget.endDate)
        } else {
          periodEnd = new Date()
          switch (budget.period) {
            case 'WEEKLY':
              periodEnd.setDate(periodStart.getDate() + 7)
              break
            case 'MONTHLY':
              periodEnd.setMonth(periodStart.getMonth() + 1)
              break
            case 'QUARTERLY':
              periodEnd.setMonth(periodStart.getMonth() + 3)
              break
            case 'YEARLY':
              periodEnd.setFullYear(periodStart.getFullYear() + 1)
              break
          }
        }

        const spending = await prisma.financeEntry.aggregate({
          where: {
            userId: user.id,
            type: 'EXPENSE',
            category: budget.category,
            date: { gte: periodStart, lte: periodEnd },
          },
          _sum: { amount: true },
        })

        const spent = Number(spending._sum.amount || 0)
        const percentage = Number(budget.amount) > 0 ? Math.round((spent / Number(budget.amount)) * 100) : 0

        return {
          ...budget,
          spent,
          remaining: Number(budget.amount) - spent,
          percentage,
          isOverBudget: spent > Number(budget.amount),
          isNearThreshold: percentage >= budget.alertThreshold,
          periodStart,
          periodEnd,
        }
      })
    )

    return NextResponse.json({ data: budgetsWithSpending })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid query parameters', details: error }, { status: 400 })
    }
    console.error('Error fetching budgets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = budgetCreateSchema.parse(body) as BudgetCreateInput

    const budget = await prisma.budget.create({
      data: {
        ...validated,
        amount: validated.amount,
        startDate: new Date(validated.startDate),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        userId: user.id,
      },
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error creating budget:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}