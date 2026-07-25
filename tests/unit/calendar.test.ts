import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/calendar/route'
import { GET as GET_ID, PUT, DELETE } from '@/app/api/calendar/[id]/route'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'
import { createMockCalendarEvent } from '../fixtures/factories'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    calendarEvent: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

const mockCreateClient = vi.mocked(createClient)

describe('Calendar API', () => {
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

  describe('GET /api/calendar', () => {
    it('should return events for authenticated user', async () => {
      const now = new Date()
      const mockEvents = [
        createMockCalendarEvent({ id: validCuid, title: 'Event 1', startTime: now, endTime: now }),
        createMockCalendarEvent({ id: 'clx1234567890abcdef123457', title: 'Event 2', startTime: now, endTime: now }),
      ]

      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue(mockEvents)
      vi.mocked(prisma.calendarEvent.count).mockResolvedValue(2)

      const request = new NextRequest(new URL('http://localhost/api/calendar'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(JSON.parse(JSON.stringify(mockEvents)))
      expect(data.meta.total).toBe(2)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } }),
        },
      } as any)

      const request = new NextRequest(new URL('http://localhost/api/calendar'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should filter by calendarId', async () => {
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.calendarEvent.count).mockResolvedValue(0)

      const request = new NextRequest(new URL('http://localhost/api/calendar?calendarId=cal-1'))
      await GET(request)

      expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ calendarId: 'cal-1', userId: 'user-1' }),
        })
      )
    })

    it('should filter by date range', async () => {
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.calendarEvent.count).mockResolvedValue(0)

      const request = new NextRequest(new URL('http://localhost/api/calendar?startFrom=2024-01-01T00:00:00.000Z&startTo=2024-12-31T23:59:59.000Z'))
      await GET(request)

      expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: expect.objectContaining({
              gte: new Date('2024-01-01T00:00:00.000Z'),
              lte: new Date('2024-12-31T23:59:59.000Z'),
            }),
          }),
        })
      )
    })

    it('should filter by search query', async () => {
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([])
      vi.mocked(prisma.calendarEvent.count).mockResolvedValue(0)

      const request = new NextRequest(new URL('http://localhost/api/calendar?search=meeting'))
      await GET(request)

      expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'meeting', mode: 'insensitive' } },
              { description: { contains: 'meeting', mode: 'insensitive' } },
              { location: { contains: 'meeting', mode: 'insensitive' } },
            ],
          }),
        })
      )
    })
  })

  describe('POST /api/calendar', () => {
    it('should create a new event for authenticated user', async () => {
      const now = new Date()
      const newEvent = createMockCalendarEvent({ id: validCuid, title: 'New Event', startTime: now, endTime: now })
      vi.mocked(prisma.calendarEvent.create).mockResolvedValue(newEvent)

      const request = new NextRequest(new URL('http://localhost/api/calendar'), {
        method: 'POST',
        body: JSON.stringify({ 
          title: 'New Event', 
          startTime: '2024-01-15T10:00:00.000Z',
          endTime: '2024-01-15T11:00:00.000Z',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(JSON.parse(JSON.stringify(newEvent)))
      expect(prisma.calendarEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Event',
          userId: 'user-1',
        }),
      })
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest(new URL('http://localhost/api/calendar'), {
        method: 'POST',
        body: JSON.stringify({ title: '', startTime: 'invalid', endTime: 'invalid' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })
  describe('GET /api/calendar/[id]', () => {
    it('should return a single event', async () => {
      const now = new Date()
      const mockEvent = createMockCalendarEvent({ id: validCuid, title: 'Event 1', startTime: now, endTime: now })
      vi.mocked(prisma.calendarEvent.findFirst).mockResolvedValue(mockEvent)

      const request = new NextRequest(new URL(`http://localhost/api/calendar/${validCuid}`))
      const response = await GET_ID(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(JSON.parse(JSON.stringify(mockEvent)))
    })

    it('should return 404 for non-existent event', async () => {
      vi.mocked(prisma.calendarEvent.findFirst).mockResolvedValue(null)

      const request = new NextRequest(new URL('http://localhost/api/calendar/' + validCuid))
      const response = await GET_ID(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Event not found')
    })

    it('should return 400 for invalid ID format', async () => {
      const request = new NextRequest(new URL('http://localhost/api/calendar/invalid-id'))
      const response = await GET_ID(request, { params: Promise.resolve({ id: 'invalid-id' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid event ID')
    })
  })
  })

  describe('PUT /api/calendar/[id]', () => {
    it('should update an event', async () => {
      const existingEvent = createMockCalendarEvent({ id: validCuid, title: 'Old Title' })
      const updatedEvent = createMockCalendarEvent({ id: validCuid, title: 'New Title' })

      vi.mocked(prisma.calendarEvent.findFirst).mockResolvedValue(existingEvent)
      vi.mocked(prisma.calendarEvent.update).mockResolvedValue(updatedEvent)

      const request = new NextRequest(new URL(`http://localhost/api/calendar/${validCuid}`), {
        method: 'PUT',
        body: JSON.stringify({ title: 'New Title' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).toBe('New Title')
      expect(data.id).toBe(validCuid)
    })

    it('should return 404 for non-existent event', async () => {
      vi.mocked(prisma.calendarEvent.findFirst).mockResolvedValue(null)

      const request = new NextRequest(new URL(`http://localhost/api/calendar/${validCuid}`), {
        method: 'PUT',
        body: JSON.stringify({ title: 'New Title' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Event not found')
    })
  })

  describe('DELETE /api/calendar/[id]', () => {
    it('should delete an event', async () => {
      const existingEvent = createMockCalendarEvent({ id: validCuid, title: 'Event 1' })
      vi.mocked(prisma.calendarEvent.findFirst).mockResolvedValue(existingEvent)
      vi.mocked(prisma.calendarEvent.delete).mockResolvedValue({})

      const request = new NextRequest(new URL(`http://localhost/api/calendar/${validCuid}`), {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(prisma.calendarEvent.delete).toHaveBeenCalledWith({ where: { id: validCuid } })
    })

    it('should return 404 for non-existent event', async () => {
      vi.mocked(prisma.calendarEvent.findFirst).mockResolvedValue(null)

      const request = new NextRequest(new URL(`http://localhost/api/calendar/${validCuid}`), {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Event not found')
    })
  })
})
