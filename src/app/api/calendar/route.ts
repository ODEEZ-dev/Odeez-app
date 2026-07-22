import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { calendarEventCreateSchema, calendarEventQuerySchema, CalendarEventCreateInput, CalendarEventQueryInput } from '@/lib/validations/calendar'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = calendarEventQuerySchema.parse(Object.fromEntries(searchParams)) as CalendarEventQueryInput

    const where: Record<string, unknown> = { userId: user.id }

    if (query.calendarId) where.calendarId = query.calendarId
    if (query.startFrom || query.startTo) {
      const startTimeWhere: Record<string, unknown> = {}
      if (query.startFrom) startTimeWhere.gte = new Date(query.startFrom)
      if (query.startTo) startTimeWhere.lte = new Date(query.startTo)
      where.startTime = startTimeWhere
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {}
    orderBy[query.sortBy] = query.sortOrder

    const [events, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.calendarEvent.count({ where }),
    ])

    return NextResponse.json({
      data: events,
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
    console.error('Error fetching calendar events:', error)
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
    const validated = calendarEventCreateSchema.parse(body) as CalendarEventCreateInput

    const event = await prisma.calendarEvent.create({
      data: {
        ...validated,
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
        exdates: validated.exdates ? validated.exdates.map(d => new Date(d)) : [],
        userId: user.id,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error creating calendar event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}