import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { habitUpdateSchema, habitIdParamSchema, HabitUpdateInput } from '@/lib/validations/habit'
import { isSameDay } from 'date-fns'

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

    const habit = await prisma.habit.findFirst({
      where: { id: validated.id, userId: user.id },
      include: {
        logs: {
          orderBy: { date: 'desc' },
          take: 365,
        },
      },
    })

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const logs = habit.logs
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayLog = logs.find((log) => isSameDay(log.date, today))

    let streak = 0
    const sortedLogs = [...logs].sort((a, b) => b.date.getTime() - a.date.getTime())
    
    for (let i = 0; i < sortedLogs.length; i++) {
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      const log = sortedLogs.find((l) => l.date.getTime() === expectedDate.getTime())
      if (log && log.count >= habit.targetCount) {
        streak++
      } else if (i === 0) {
        streak = 0
      } else {
        break
      }
    }

    const longestStreak = (() => {
      let maxStreak = 0
      let current = 0
      const allLogs = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime())
      
      for (let i = 0; i < allLogs.length; i++) {
        if (allLogs[i].count >= habit.targetCount) {
          current++
          maxStreak = Math.max(maxStreak, current)
        } else {
          current = 0
        }
      }
      return maxStreak
    })()

    const completionRate = logs.length > 0
      ? Math.round((logs.filter((l) => l.count >= habit.targetCount).length / logs.length) * 100)
      : 0

    return NextResponse.json({
      ...habit,
      logs,
      streak,
      longestStreak,
      completionRate,
      todayCount: todayLog?.count || 0,
      completedToday: todayLog && todayLog.count >= habit.targetCount,
      progress: todayLog
        ? Math.min(100, Math.round((todayLog.count / habit.targetCount) * 100))
        : 0,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid habit ID', details: error }, { status: 400 })
    }
    console.error('Error fetching habit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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
    const validatedData = habitUpdateSchema.parse(body) as HabitUpdateInput

    const habit = await prisma.habit.findFirst({
      where: { id: validated.id, userId: user.id },
    })

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: validated.id },
      data: validatedData,
      include: {
        logs: {
          where: {
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayLog = updatedHabit.logs.find((log) => log.date.getTime() === today.getTime())
    const todayCount = todayLog?.count || 0

    return NextResponse.json({
      ...updatedHabit,
      todayCount,
      completedToday: todayCount >= updatedHabit.targetCount,
      progress: Math.min(100, Math.round((todayCount / updatedHabit.targetCount) * 100)),
      streak: 0,
      longestStreak: 0,
      completionRate: 0,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error updating habit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const habit = await prisma.habit.findFirst({
      where: { id: validated.id, userId: user.id },
    })

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    await prisma.habit.delete({
      where: { id: validated.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid habit ID', details: error }, { status: 400 })
    }
    console.error('Error deleting habit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}