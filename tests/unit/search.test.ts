import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/search/route'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    task: { findMany: vi.fn() },
    habit: { findMany: vi.fn() },
    journalEntry: { findMany: vi.fn() },
    financeEntry: { findMany: vi.fn() },
    note: { findMany: vi.fn() },
    calendarEvent: { findMany: vi.fn() },
    contact: { findMany: vi.fn() },
  },
}))

const mockCreateClient = vi.mocked(createClient)

describe('Search API', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' }
  const mockSession = { access_token: 'mock-token' }
  const validCuid = 'clx1234567890abcdef123456'

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
      },
    } as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/search', () => {
    it('should return 401 for unauthenticated user', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } }),
        },
      } as any)

      const request = new NextRequest(new URL('http://localhost/api/search?q=test'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for query less than 2 chars', async () => {
      const request = new NextRequest(new URL('http://localhost/api/search?q=a'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
    })

    it('should search tasks when types include tasks', async () => {
      const mockTasks = [
        { id: validCuid, title: 'Test Task', description: 'Task description', status: 'TODO', priority: 'HIGH', dueDate: null, updatedAt: new Date() },
      ]
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks)
      vi.mocked(prisma.habit.findMany).mockResolvedValue([])
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.financeEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.note.findMany).mockResolvedValue([])
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])

      const request = new NextRequest(new URL('http://localhost/api/search?q=test&types=tasks'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.length).toBe(1)
      expect(data.data[0].type).toBe('task')
      expect(data.data[0].title).toBe('Test Task')
      expect(prisma.task.findMany).toHaveBeenCalled()
    })

    it('should search habits when types include habits', async () => {
      const mockHabits = [
        { id: validCuid, name: 'Exercise', description: 'Daily workout', frequency: 'DAILY', color: '#10B981', archived: false, updatedAt: new Date() },
      ]
      vi.mocked(prisma.task.findMany).mockResolvedValue([])
      vi.mocked(prisma.habit.findMany).mockResolvedValue(mockHabits)
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.financeEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.note.findMany).mockResolvedValue([])
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])

      const request = new NextRequest(new URL('http://localhost/api/search?q=exercise&types=habits'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.length).toBe(1)
      expect(data.data[0].type).toBe('habit')
      expect(data.data[0].title).toBe('Exercise')
    })

    it('should search journal entries when types include journal', async () => {
      const mockEntries = [
        { id: validCuid, title: 'My Journal', content: 'Content here', mood: 'HAPPY', date: new Date(), tags: ['personal'], updatedAt: new Date() },
      ]
      vi.mocked(prisma.task.findMany).mockResolvedValue([])
      vi.mocked(prisma.habit.findMany).mockResolvedValue([])
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(mockEntries)
      vi.mocked(prisma.financeEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.note.findMany).mockResolvedValue([])
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])

      const request = new NextRequest(new URL('http://localhost/api/search?q=journal&types=journal'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.length).toBe(1)
      expect(data.data[0].type).toBe('journal')
    })

    it('should search finance entries when types include finances', async () => {
      const mockEntries = [
        { id: validCuid, type: 'EXPENSE', category: 'Food', subcategory: 'Groceries', description: 'Weekly groceries', amount: 50.00, currency: 'USD', date: new Date(), updatedAt: new Date() },
      ]
      vi.mocked(prisma.task.findMany).mockResolvedValue([])
      vi.mocked(prisma.habit.findMany).mockResolvedValue([])
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.financeEntry.findMany).mockResolvedValue(mockEntries)
      vi.mocked(prisma.note.findMany).mockResolvedValue([])
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])

      const request = new NextRequest(new URL('http://localhost/api/search?q=groceries&types=finances'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.length).toBe(1)
      expect(data.data[0].type).toBe('finance')
    })

    it('should search notes when types include notes', async () => {
      const mockNotes = [
        { id: validCuid, title: 'Meeting Notes', content: 'Important meeting notes', color: '#FEF3C7', pinned: false, tags: ['work'], updatedAt: new Date() },
      ]
      vi.mocked(prisma.task.findMany).mockResolvedValue([])
      vi.mocked(prisma.habit.findMany).mockResolvedValue([])
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.financeEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.note.findMany).mockResolvedValue(mockNotes)
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])

      const request = new NextRequest(new URL('http://localhost/api/search?q=meeting&types=notes'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.length).toBe(1)
      expect(data.data[0].type).toBe('note')
    })

    it('should search calendar events when types include calendar', async () => {
      const mockEvents = [
        { id: validCuid, title: 'Team Meeting', description: 'Weekly sync', location: 'Conference Room', startTime: new Date(), endTime: new Date(), allDay: false, color: '#3B82F6', updatedAt: new Date() },
      ]
      vi.mocked(prisma.task.findMany).mockResolvedValue([])
      vi.mocked(prisma.habit.findMany).mockResolvedValue([])
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.financeEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.note.findMany).mockResolvedValue([])
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue(mockEvents)
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])

      const request = new NextRequest(new URL('http://localhost/api/search?q=meeting&types=calendar'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.length).toBe(1)
      expect(data.data[0].type).toBe('event')
    })

    it('should search contacts when types include contacts', async () => {
      const mockContacts = [
        { id: validCuid, firstName: 'John', lastName: 'Doe', email: 'john@example.com', company: 'Acme Inc', phone: '+1234567890', tags: ['work'], favorite: true, updatedAt: new Date() },
      ]
      vi.mocked(prisma.task.findMany).mockResolvedValue([])
      vi.mocked(prisma.habit.findMany).mockResolvedValue([])
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.financeEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.note.findMany).mockResolvedValue([])
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.findMany).mockResolvedValue(mockContacts)

      const request = new NextRequest(new URL('http://localhost/api/search?q=john&types=contacts'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.length).toBe(1)
      expect(data.data[0].type).toBe('contact')
      expect(data.data[0].title).toBe('John Doe')
    })

    it('should include settings when types include settings', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([])
      vi.mocked(prisma.habit.findMany).mockResolvedValue([])
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.financeEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.note.findMany).mockResolvedValue([])
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])

      const request = new NextRequest(new URL('http://localhost/api/search?q=settings&types=settings'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.some((r: any) => r.type === 'setting')).toBe(true)
    })

    it('should limit results to specified limit', async () => {
      const mockTasks = Array.from({ length: 10 }, (_, i) => ({
        id: `clx1234567890abcdef12345${i}`,
        title: `Task ${i}`,
        description: 'Task description',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: null,
        updatedAt: new Date(),
      }))
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks)
      vi.mocked(prisma.habit.findMany).mockResolvedValue([])
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.financeEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.note.findMany).mockResolvedValue([])
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])

      const request = new NextRequest(new URL('http://localhost/api/search?q=task&types=tasks&limit=5'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.length).toBeLessThanOrEqual(5)
    })

    it('should sort results by relevance (title matches first)', async () => {
      const mockTasks = [
        { id: validCuid, title: 'Test Task', description: 'Description with test', status: 'TODO', priority: 'MEDIUM', dueDate: null, updatedAt: new Date() },
        { id: 'clx1234567890abcdef123457', title: 'Another Task', description: 'Has test in description', status: 'TODO', priority: 'MEDIUM', dueDate: null, updatedAt: new Date() },
      ]
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks)
      vi.mocked(prisma.habit.findMany).mockResolvedValue([])
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.financeEntry.findMany).mockResolvedValue([])
      vi.mocked(prisma.note.findMany).mockResolvedValue([])
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])

      const request = new NextRequest(new URL('http://localhost/api/search?q=test&types=tasks'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data[0].title).toBe('Test Task')
    })

    it('should return 400 for invalid query parameters', async () => {
      const request = new NextRequest(new URL('http://localhost/api/search?q='))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
    })
  })
})