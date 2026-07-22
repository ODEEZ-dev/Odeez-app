import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { habitLogUpdateSchema, habitLogIdParamSchema, habitIdParamSchema, HabitLogUpdateInput } from '@/lib/validations/habit'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: habitId, logId } = await params
    const habitParams = habitIdParamSchema.parse({ id: habitId })
    const logParams = habitLogIdParamSchema.parse({ id: logId })
    const body = await request.json()
    const validated = habitLogUpdateSchema.parse(body) as HabitLogUpdateInput

    const habit = await prisma.habit.findFirst({
      where: { id: habitParams.id, userId: user.id },
    })

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const log = await prisma.habitLog.findFirst({
      where: { id: logParams.id, habitId: habitParams.id },
    })

    if (!log) {
      return NextResponse.json({ error: 'Habit log not found' }, { status: 404 })
    }

    const updatedLog = await prisma.habitLog.update({
      where: { id: logParams.id },
      data: validated,
    })

    return NextResponse.json(updatedLog)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error updating habit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: habitId, logId } = await params
    const habitParams = habitIdParamSchema.parse({ id: habitId })
    const logParams = habitLogIdParamSchema.parse({ id: logId })

    const habit = await prisma.habit.findFirst({
      where: { id: habitParams.id, userId: user.id },
    })

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const log = await prisma.habitLog.findFirst({
      where: { id: logParams.id, habitId: habitParams.id },
    })

    if (!log) {
      return NextResponse.json({ error: 'Habit log not found' }, { status: 404 })
    }

    await prisma.habitLog.delete({
      where: { id: logParams.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error deleting habit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}