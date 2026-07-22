import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { habitLogCreateSchema, habitLogQuerySchema, habitIdParamSchema, HabitLogCreateInput } from '@/lib/validations/habit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const validated = habitIdParamSchema.parse({ id })
    const { searchParams } = new URL(request.url)
    const query = habitLogQuerySchema.parse(Object.fromEntries(searchParams))

    const habit = await prisma.habit.findFirst({
      where: { id: validated.id, userId: user.id },
    })

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const where: Record<string, unknown> = { habitId: validated.id }
    if (query.dateFrom || query.dateTo) {
      where.date = {}
      if (query.dateFrom) (where.date as Record<string, Date>).gte = new Date(query.dateFrom)
      if (query.dateTo) (where.date as Record<string, Date>).lte = new Date(query.dateTo)
    }

    const logs = await prisma.habitLog.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ data: logs })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid query parameters', details: error }, { status: 400 })
    }
    console.error('Error fetching habit logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const validated = habitIdParamSchema.parse({ id })
    const body = await request.json()
    const logData = habitLogCreateSchema.parse(body) as HabitLogCreateInput

    const habit = await prisma.habit.findFirst({
      where: { id: validated.id, userId: user.id },
    })

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId: validated.id,
          date: new Date(logData.date),
        },
      },
    })

    let log
    if (existingLog) {
      log = await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: {
          count: logData.count,
          notes: logData.notes,
        },
      })
    } else {
      log = await prisma.habitLog.create({
        data: {
          ...logData,
          date: new Date(logData.date),
          userId: user.id,
          habitId: validated.id,
        },
      })
    }

    return NextResponse.json(log, { status: existingLog ? 200 : 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error creating habit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}