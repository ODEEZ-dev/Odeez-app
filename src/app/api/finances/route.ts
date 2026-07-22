import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { financeEntryCreateSchema, financeEntryQuerySchema, FinanceEntryCreateInput, FinanceEntryQueryInput } from '@/lib/validations/finance'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = financeEntryQuerySchema.parse(Object.fromEntries(searchParams)) as FinanceEntryQueryInput

    const where: Record<string, unknown> = { userId: user.id }

    if (query.type) where.type = query.type
    if (query.category) where.category = query.category
    if (query.subcategory) where.subcategory = query.subcategory
    if (query.dateFrom || query.dateTo) {
      where.date = {}
      if (query.dateFrom) (where.date as Record<string, Date>).gte = new Date(query.dateFrom)
      if (query.dateTo) (where.date as Record<string, Date>).lte = new Date(query.dateTo)
    }
    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      where.amount = {}
      if (query.minAmount !== undefined) (where.amount as Record<string, number>).gte = query.minAmount
      if (query.maxAmount !== undefined) (where.amount as Record<string, number>).lte = query.maxAmount
    }
    if (query.tags && query.tags.length > 0) {
      where.tags = { hasSome: query.tags }
    }
    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
        { subcategory: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {}
    orderBy[query.sortBy] = query.sortOrder

    const [entries, total] = await Promise.all([
      prisma.financeEntry.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.financeEntry.count({ where }),
    ])

    return NextResponse.json({
      data: entries,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid query parameters', details: error }, { status: 400 })
    }
    console.error('Error fetching finance entries:', error)
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
    const validated = financeEntryCreateSchema.parse(body) as FinanceEntryCreateInput

    const entry = await prisma.financeEntry.create({
      data: {
        ...validated,
        date: new Date(validated.date),
        amount: validated.amount,
        userId: user.id,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error creating finance entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
