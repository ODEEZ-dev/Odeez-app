import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { budgetUpdateSchema, budgetIdParamSchema, BudgetUpdateInput } from '@/lib/validations/finance'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { id: budgetId } = budgetIdParamSchema.parse({ id })

    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId: user.id },
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Calculate spending
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

    return NextResponse.json({
      ...budget,
      spent,
      remaining: Number(budget.amount) - spent,
      percentage,
      isOverBudget: spent > Number(budget.amount),
      isNearThreshold: percentage >= budget.alertThreshold,
      periodStart,
      periodEnd,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid budget ID' }, { status: 400 })
    }
    console.error('Error fetching budget:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { id: budgetId } = budgetIdParamSchema.parse({ id })

    const existingBudget = await prisma.budget.findFirst({
      where: { id: budgetId, userId: user.id },
    })

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = budgetUpdateSchema.parse(body) as BudgetUpdateInput

    const updateData: Record<string, unknown> = { ...validated }
    
    if (validated.amount !== undefined) {
      updateData.amount = validated.amount
    }
    if (validated.startDate !== undefined) {
      updateData.startDate = new Date(validated.startDate)
    }
    if (validated.endDate !== undefined) {
      updateData.endDate = validated.endDate ? new Date(validated.endDate) : null
    }

    const budget = await prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
    })

    return NextResponse.json(budget)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error updating budget:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { id: budgetId } = budgetIdParamSchema.parse({ id })

    const existingBudget = await prisma.budget.findFirst({
      where: { id: budgetId, userId: user.id },
    })

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    await prisma.budget.delete({ where: { id: budgetId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid budget ID' }, { status: 400 })
    }
    console.error('Error deleting budget:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}