import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)

    const [
      tasksDueToday,
      overdueTasks,
      completedTasksToday,
      habits,
      habitLogsToday,
      journalEntry,
      eventsToday,
      financeThisMonth,
      notesCount,
    ] = await Promise.all([
      // Tasks due today
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { id: true, title: true, dueDate: true, priority: true, status: true },
        orderBy: { dueDate: 'asc' },
      }),

      // Overdue tasks
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { lt: startOfDay },
        },
        select: { id: true, title: true, dueDate: true, priority: true },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),

      // Completed tasks today
      prisma.task.count({
        where: {
          userId: user.id,
          status: 'DONE',
          completedAt: { gte: startOfDay, lte: endOfDay },
        },
      }),

      // Active habits
      prisma.habit.findMany({
        where: {
          userId: user.id,
          archived: false,
        },
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
          targetCount: true,
          unit: true,
          frequency: true,
          reminderDays: true,
        },
      }),

      // Habit logs for today
      prisma.habitLog.findMany({
        where: {
          userId: user.id,
          date: { gte: startOfDay, lte: endOfDay },
        },
        select: { habitId: true, count: true },
      }),

      // Journal entry for today
      prisma.journalEntry.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: startOfDay,
          },
        },
        select: { id: true, title: true, content: true, mood: true, moodScore: true },
      }),

      // Events today
      prisma.calendarEvent.findMany({
        where: {
          userId: user.id,
          startTime: { gte: startOfDay, lte: endOfDay },
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          allDay: true,
          location: true,
          color: true,
        },
        orderBy: { startTime: 'asc' },
      }),

      // Finance this month
      prisma.financeEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { type: true, amount: true },
      }),

      // Notes count
      prisma.note.count({
        where: {
          userId: user.id,
          archived: false,
        },
      }),
    ])

    // Calculate habit progress
    const habitLogsMap = new Map(habitLogsToday.map((log) => [log.habitId, log.count]))
    const habitsWithProgress = habits.map((habit) => {
      const logCount = habitLogsMap.get(habit.id) || 0
      const progress = Math.min(100, Math.round((logCount / habit.targetCount) * 100))
      const completed = logCount >= habit.targetCount
      return {
        ...habit,
        progress,
        completed,
        logCount,
      }
    })

    const habitsTotal = habits.length
    const habitsCompleted = habitsWithProgress.filter((h) => h.completed).length
    const habitsProgress = habitsTotal > 0 ? Math.round((habitsCompleted / habitsTotal) * 100) : 0

    // Calculate finance totals
    let incomeThisMonth = 0
    let expensesThisMonth = 0
    for (const entry of financeThisMonth) {
      const amount = Number(entry.amount)
      if (entry.type === 'INCOME') {
        incomeThisMonth += amount
      } else if (entry.type === 'EXPENSE') {
        expensesThisMonth += amount
      }
    }
    const balanceThisMonth = incomeThisMonth - expensesThisMonth

    return NextResponse.json({
      date: today.toISOString().split('T')[0],
      stats: {
        tasksDueToday: tasksDueToday.length,
        overdueTasks: overdueTasks.length,
        completedTasksToday,
        habitsTotal,
        habitsCompleted,
        habitsProgress,
        journalEntry: !!journalEntry,
        eventsToday: eventsToday.length,
        incomeThisMonth,
        expensesThisMonth,
        balanceThisMonth,
        notesCount,
      },
      tasks: {
        dueToday: tasksDueToday.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate?.toISOString() || null,
          priority: t.priority,
          status: t.status,
        })),
        overdue: overdueTasks.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate?.toISOString() || null,
          priority: t.priority,
        })),
      },
      habits: habitsWithProgress,
      journal: journalEntry
        ? {
            id: journalEntry.id,
            title: journalEntry.title,
            content: journalEntry.content,
            mood: journalEntry.mood,
            moodScore: journalEntry.moodScore,
          }
        : null,
      events: eventsToday.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime.toISOString(),
        endTime: e.endTime.toISOString(),
        allDay: e.allDay,
        location: e.location,
        color: e.color,
      })),
    })
  } catch (error) {
    console.error('Error fetching today data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}