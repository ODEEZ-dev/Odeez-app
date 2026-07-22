import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { journalEntryQuerySchema, journalEntryCreateSchema, JournalEntryCreateInput, JournalEntryQueryInput } from '@/lib/validations/journal'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = journalEntryQuerySchema.parse(Object.fromEntries(searchParams)) as JournalEntryQueryInput

    const where: Record<string, unknown> = { userId: user.id }

    if (query.mood) where.mood = query.mood
    if (query.dateFrom || query.dateTo) {
      where.date = {}
      if (query.dateFrom) (where.date as Record<string, Date>).gte = new Date(query.dateFrom)
      if (query.dateTo) (where.date as Record<string, Date>).lte = new Date(query.dateTo)
    }
    if (query.tags && query.tags.length > 0) {
      where.tags = { hasSome: query.tags }
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {}
    orderBy[query.sortBy] = query.sortOrder

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.journalEntry.count({ where }),
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
    console.error('Error fetching journal entries:', error)
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
    const validated = journalEntryCreateSchema.parse(body) as JournalEntryCreateInput

    const entry = await prisma.journalEntry.create({
      data: {
        ...validated,
        date: new Date(validated.date),
        userId: user.id,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error creating journal entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}