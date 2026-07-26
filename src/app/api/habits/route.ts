import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { habitCreateSchema, habitQuerySchema, HabitCreateInput, HabitQueryInput } from '@/lib/validations/habit'
import { isSameDay } from 'date-fns'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = habitQuerySchema.parse(Object.fromEntries(searchParams)) as HabitQueryInput

    const where: Record<string, unknown> = { userId: user.id }

    if (query.archived !== undefined) where.archived = query.archived
    if (query.frequency) where.frequency = query.frequency
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' }
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {}
    orderBy[query.sortBy] = query.sortOrder

    const [habits, total] = await Promise.all([
      prisma.habit.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
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
      }),
      prisma.habit.count({ where }),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const habitsWithProgress = habits.map((habit) => {
      const logs = habit.logs
      const todayLog = logs.find((log) => isSameDay(log.date, today))
      const todayCount = todayLog?.count || 0
      const completedToday = todayCount >= habit.targetCount
      const progress = Math.min(100, Math.round((todayCount / habit.targetCount) * 100))

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

      return {
        ...habit,
        todayCount,
        completedToday,
        progress,
        streak,
        longestStreak,
        completionRate,
      }
    })

    return NextResponse.json({
      data: habitsWithProgress,
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
    console.error('Error fetching habits:', error)
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
    const validated = habitCreateSchema.parse(body) as HabitCreateInput

    const habit = await prisma.habit.create({
      data: {
        ...validated,
        userId: user.id,
      },
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
    const todayLog = habit.logs.find((log) => log.date.getTime() === today.getTime())
    const todayCount = todayLog?.count || 0

    return NextResponse.json({
      ...habit,
      todayCount,
      completedToday: todayCount >= habit.targetCount,
      progress: Math.min(100, Math.round((todayCount / habit.targetCount) * 100)),
      streak: 0,
      longestStreak: 0,
      completionRate: 0,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error creating habit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}