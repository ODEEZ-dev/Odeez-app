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

    const [
      tasks,
      habits,
      habitLogs,
      journalEntries,
      financeEntries,
      budgets,
      notes,
      calendarEvents,
      contacts,
      settings,
    ] = await Promise.all([
      prisma.task.findMany({ where: { userId: user.id } }),
      prisma.habit.findMany({ where: { userId: user.id } }),
      prisma.habitLog.findMany({ where: { userId: user.id } }),
      prisma.journalEntry.findMany({ where: { userId: user.id } }),
      prisma.financeEntry.findMany({ where: { userId: user.id } }),
      prisma.budget.findMany({ where: { userId: user.id } }),
      prisma.note.findMany({ where: { userId: user.id } }),
      prisma.calendarEvent.findMany({ where: { userId: user.id } }),
      prisma.contact.findMany({ where: { userId: user.id } }),
      prisma.userSettings.findUnique({ where: { userId: user.id } }),
    ])

    const exportData = {
      exportDate: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      tasks,
      habits,
      habitLogs,
      journalEntries,
      financeEntries,
      budgets,
      notes,
      calendarEvents,
      contacts,
      settings,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="basecamp-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}