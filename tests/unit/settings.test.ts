import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/settings/route'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'
import { createMockUserSettings } from '../fixtures/factories'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    userSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
    },
  },
}))

const mockCreateClient = vi.mocked(createClient)

describe('Settings API', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' }
  const mockSession = { access_token: 'mock-token' }
  const validSettings = createMockUserSettings({
    id: 'clx1234567890abcdef123456',
    userId: 'user-1',
    createdAt: new Date('2026-07-18T04:44:08.202Z'),
    updatedAt: new Date('2026-07-18T04:44:08.202Z'),
  })

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

  describe('GET /api/settings', () => {
    it('should return settings for authenticated user', async () => {
      vi.mocked(prisma.userSettings.findUnique).mockResolvedValue(validSettings)

      const request = new NextRequest(new URL('http://localhost/api/settings'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(JSON.parse(JSON.stringify(validSettings)))
      expect(prisma.userSettings.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
    })

    it('should create default settings if none exist', async () => {
      vi.mocked(prisma.userSettings.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.userSettings.create).mockResolvedValue(validSettings)

      const request = new NextRequest(new URL('http://localhost/api/settings'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(JSON.parse(JSON.stringify(validSettings)))
      expect(prisma.userSettings.create).toHaveBeenCalledWith({
        data: { userId: 'user-1' },
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } }),
        },
      } as any)

      const request = new NextRequest(new URL('http://localhost/api/settings'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('PUT /api/settings', () => {
    it('should update settings for authenticated user', async () => {
      const updatedSettings = createMockUserSettings({ ...validSettings, emailNotifications: false, defaultCurrency: 'EUR' })
      vi.mocked(prisma.userSettings.upsert).mockResolvedValue(updatedSettings)

      const request = new NextRequest(new URL('http://localhost/api/settings'), {
        method: 'PUT',
        body: JSON.stringify({
          emailNotifications: false,
          defaultCurrency: 'EUR',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.emailNotifications).toBe(false)
      expect(data.defaultCurrency).toBe('EUR')
      expect(prisma.userSettings.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: expect.objectContaining({
          userId: 'user-1',
          emailNotifications: false,
          defaultCurrency: 'EUR',
        }),
        update: expect.objectContaining({
          emailNotifications: false,
          defaultCurrency: 'EUR',
        }),
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } }),
        },
      } as any)

      const request = new NextRequest(new URL('http://localhost/api/settings'), {
        method: 'PUT',
        body: JSON.stringify({ emailNotifications: false }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest(new URL('http://localhost/api/settings'), {
        method: 'PUT',
        body: JSON.stringify({ defaultCurrency: 'INVALID' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should return 400 for invalid habit reminder time format', async () => {
      const request = new NextRequest(new URL('http://localhost/api/settings'), {
        method: 'PUT',
        body: JSON.stringify({ habitReminderTime: 'invalid-time' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should return 400 for invalid budget alert threshold', async () => {
      const request = new NextRequest(new URL('http://localhost/api/settings'), {
        method: 'PUT',
        body: JSON.stringify({ budgetAlertThreshold: 150 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should return 400 for invalid default task priority', async () => {
      const request = new NextRequest(new URL('http://localhost/api/settings'), {
        method: 'PUT',
        body: JSON.stringify({ defaultTaskPriority: 'INVALID' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })
  })
})