import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { searchQuerySchema, SearchQueryInput, SearchResult } from '@/lib/validations/search'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawTypes = searchParams.get('types')
    const query: SearchQueryInput = {
      q: searchParams.get('q') || '',
      types: rawTypes || undefined,
      limit: parseInt(searchParams.get('limit') || '10', 10),
    }

    const validated = searchQuerySchema.parse(query)
    const { q, types = 'tasks,habits,journal,finances,notes,calendar,contacts,settings', limit } = validated
    const modules = types.split(',')

    const results: SearchResult[] = []
    const searchTerm = q.toLowerCase()

    // Search tasks
    if (modules.includes('tasks')) {
      const tasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: Math.ceil(limit / modules.length),
        orderBy: { updatedAt: 'desc' },
      })
      results.push(...tasks.map(task => ({
        type: 'task' as const,
        id: task.id,
        title: task.title,
        subtitle: task.description ? task.description.substring(0, 100) : undefined,
        url: `/dashboard/tasks?search=${encodeURIComponent(q)}`,
        metadata: { status: task.status, priority: task.priority, dueDate: task.dueDate },
      })))
    }

    // Search habits
    if (modules.includes('habits')) {
      const habits = await prisma.habit.findMany({
        where: {
          userId: user.id,
          archived: false,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: Math.ceil(limit / modules.length),
        orderBy: { updatedAt: 'desc' },
      })
      results.push(...habits.map(habit => ({
        type: 'habit' as const,
        id: habit.id,
        title: habit.name,
        subtitle: habit.description ? habit.description.substring(0, 100) : undefined,
        url: `/dashboard/habits`,
        metadata: { frequency: habit.frequency, color: habit.color },
      })))
    }

    // Search journal entries
    if (modules.includes('journal')) {
      const entries = await prisma.journalEntry.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
            { tags: { hasSome: [q] } },
          ],
        },
        take: Math.ceil(limit / modules.length),
        orderBy: { date: 'desc' },
      })
      results.push(...entries.map(entry => ({
        type: 'journal' as const,
        id: entry.id,
        title: entry.title || 'Untitled Entry',
        subtitle: entry.content.substring(0, 100),
        url: `/dashboard/journal`,
        metadata: { mood: entry.mood, date: entry.date, tags: entry.tags },
      })))
    }

    // Search finance entries
    if (modules.includes('finances')) {
      const entries = await prisma.financeEntry.findMany({
        where: {
          userId: user.id,
          OR: [
            { description: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
            { subcategory: { contains: q, mode: 'insensitive' } },
            { tags: { hasSome: [q] } },
          ],
        },
        take: Math.ceil(limit / modules.length),
        orderBy: { date: 'desc' },
      })
      results.push(...entries.map(entry => ({
        type: 'finance' as const,
        id: entry.id,
        title: `${entry.type}: ${entry.category}${entry.subcategory ? ` > ${entry.subcategory}` : ''}`,
        subtitle: entry.description || `${entry.amount} ${entry.currency}`,
        url: `/dashboard/finances`,
        metadata: { type: entry.type, amount: entry.amount, currency: entry.category },
      })))
    }

    // Search notes
    if (modules.includes('notes')) {
      const notes = await prisma.note.findMany({
        where: {
          userId: user.id,
          archived: false,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
            { tags: { hasSome: [q] } },
          ],
        },
        take: Math.ceil(limit / modules.length),
        orderBy: { updatedAt: 'desc' },
      })
      results.push(...notes.map(note => ({
        type: 'note' as const,
        id: note.id,
        title: note.title,
        subtitle: note.content.substring(0, 100),
        url: `/dashboard/notes`,
        metadata: { color: note.color, pinned: note.pinned, tags: note.tags },
      })))
    }

    // Search calendar events
    if (modules.includes('calendar')) {
      const events = await prisma.calendarEvent.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: Math.ceil(limit / modules.length),
        orderBy: { startTime: 'desc' },
      })
      results.push(...events.map(event => ({
        type: 'event' as const,
        id: event.id,
        title: event.title,
        subtitle: event.description ? event.description.substring(0, 100) : event.location || undefined,
        url: `/dashboard/calendar`,
        metadata: { startTime: event.startTime, endTime: event.endTime, allDay: event.allDay, color: event.color },
      })))
    }

    // Search contacts
    if (modules.includes('contacts')) {
      const contacts = await prisma.contact.findMany({
        where: {
          userId: user.id,
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
            { tags: { hasSome: [q] } },
          ],
        },
        take: Math.ceil(limit / modules.length),
        orderBy: { updatedAt: 'desc' },
      })
      results.push(...contacts.map(contact => ({
        type: 'contact' as const,
        id: contact.id,
        title: `${contact.firstName} ${contact.lastName || ''}`.trim(),
        subtitle: contact.email || contact.company || contact.phone || undefined,
        url: `/dashboard/contacts`,
        metadata: { email: contact.email, phone: contact.phone, company: contact.company, favorite: contact.favorite },
      })))
    }

    // Search settings (placeholder - just returns the settings page)
    if (modules.includes('settings')) {
      results.push({
        type: 'setting' as const,
        id: 'settings',
        title: 'Settings',
        subtitle: 'Manage preferences, notifications, and data',
        url: '/dashboard/settings',
        metadata: {},
      })
    }

    // Sort by relevance (title matches first, then subtitle)
    const sorted = results.sort((a, b) => {
      const aTitleMatch = a.title.toLowerCase().includes(searchTerm) ? 0 : 1
      const bTitleMatch = b.title.toLowerCase().includes(searchTerm) ? 0 : 1
      if (aTitleMatch !== bTitleMatch) return aTitleMatch - bTitleMatch
      
      const aSubtitleMatch = a.subtitle?.toLowerCase().includes(searchTerm) ? 0 : 1
      const bSubtitleMatch = b.subtitle?.toLowerCase().includes(searchTerm) ? 0 : 1
      return aSubtitleMatch - bSubtitleMatch
    })

    return NextResponse.json({ data: sorted.slice(0, limit) })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid query parameters', details: error }, { status: 400 })
    }
    console.error('Error searching:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}