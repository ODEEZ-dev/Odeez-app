import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { noteCreateSchema, noteQuerySchema, NoteCreateInput, NoteQueryInput } from '@/lib/validations/note'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = noteQuerySchema.parse(Object.fromEntries(searchParams)) as NoteQueryInput

    const where: Record<string, unknown> = { userId: user.id }

    if (query.pinned !== undefined) where.pinned = query.pinned
    if (query.archived !== undefined) where.archived = query.archived
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

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.note.count({ where }),
    ])

    return NextResponse.json({
      data: notes,
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
    console.error('Error fetching notes:', error)
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
    const validated = noteCreateSchema.parse(body) as NoteCreateInput

    const note = await prisma.note.create({
      data: {
        ...validated,
        userId: user.id,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}