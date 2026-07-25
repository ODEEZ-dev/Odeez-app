import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/contacts/route'
import { GET as GET_ID, PUT, DELETE } from '@/app/api/contacts/[id]/route'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'
import { createMockContact } from '../fixtures/factories'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    contact: {
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

describe('Contacts API', () => {
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

  describe('GET /api/contacts', () => {
    it('should return contacts for authenticated user', async () => {
      const mockContacts = [
        createMockContact({ id: validCuid, firstName: 'John', lastName: 'Doe', email: 'john@example.com' }),
        createMockContact({ id: 'clx1234567890abcdef123457', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }),
      ]

      vi.mocked(prisma.contact.findMany).mockResolvedValue(mockContacts)
      vi.mocked(prisma.contact.count).mockResolvedValue(2)

      const request = new NextRequest(new URL('http://localhost/api/contacts'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(JSON.parse(JSON.stringify(mockContacts)))
      expect(data.meta.total).toBe(2)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } }),
        },
      } as any)

      const request = new NextRequest(new URL('http://localhost/api/contacts'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should filter by favorite', async () => {
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.count).mockResolvedValue(0)

      const request = new NextRequest(new URL('http://localhost/api/contacts?favorite=true'))
      await GET(request)

      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ favorite: true, userId: 'user-1' }),
        })
      )
    })

    it('should filter by tags', async () => {
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.count).mockResolvedValue(0)

      const request = new NextRequest(new URL('http://localhost/api/contacts?tags=work,personal'))
      await GET(request)

      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tags: { hasSome: ['work', 'personal'] }, userId: 'user-1' }),
        })
      )
    })

    it('should filter by search query', async () => {
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.count).mockResolvedValue(0)

      const request = new NextRequest(new URL('http://localhost/api/contacts?search=john'))
      await GET(request)

      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
              { company: { contains: 'john', mode: 'insensitive' } },
              { notes: { contains: 'john', mode: 'insensitive' } },
            ],
          }),
        })
      )
    })

    it('should sort by firstName ascending by default', async () => {
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.count).mockResolvedValue(0)

      const request = new NextRequest(new URL('http://localhost/api/contacts'))
      await GET(request)

      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({ firstName: 'asc' }),
        })
      )
    })

    it('should paginate results', async () => {
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.count).mockResolvedValue(0)

      const request = new NextRequest(new URL('http://localhost/api/contacts?page=2&limit=10'))
      await GET(request)

      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })
  })

  describe('POST /api/contacts', () => {
    it('should create a new contact for authenticated user', async () => {
      const newContact = createMockContact({ id: validCuid, firstName: 'John', lastName: 'Doe', email: 'john@example.com' })
      vi.mocked(prisma.contact.create).mockResolvedValue(newContact)

      const request = new NextRequest(new URL('http://localhost/api/contacts'), {
        method: 'POST',
        body: JSON.stringify({ 
          firstName: 'John', 
          lastName: 'Doe', 
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Acme Inc',
          title: 'Engineer',
          birthday: '1990-01-15',
          address: '123 Main St',
          notes: 'Notes here',
          avatarUrl: 'https://example.com/avatar.jpg',
          tags: ['work', 'friend'],
          favorite: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(JSON.parse(JSON.stringify(newContact)))
      expect(prisma.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Acme Inc',
          title: 'Engineer',
          birthday: new Date('1990-01-15'),
          address: '123 Main St',
          notes: 'Notes here',
          avatarUrl: 'https://example.com/avatar.jpg',
          tags: ['work', 'friend'],
          favorite: true,
          userId: 'user-1',
        }),
      })
    })

    it('should create contact with minimal required fields', async () => {
      const newContact = createMockContact({ id: validCuid, firstName: 'John', lastName: null, email: null })
      vi.mocked(prisma.contact.create).mockResolvedValue(newContact)

      const request = new NextRequest(new URL('http://localhost/api/contacts'), {
        method: 'POST',
        body: JSON.stringify({ firstName: 'John' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(JSON.parse(JSON.stringify(newContact)))
      expect(prisma.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'John',
          userId: 'user-1',
        }),
      })
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest(new URL('http://localhost/api/contacts'), {
        method: 'POST',
        body: JSON.stringify({ firstName: '', email: 'invalid-email' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should return 400 for invalid avatar URL', async () => {
      const request = new NextRequest(new URL('http://localhost/api/contacts'), {
        method: 'POST',
        body: JSON.stringify({ firstName: 'John', avatarUrl: 'not-a-url' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should return 400 for invalid birthday format', async () => {
      const request = new NextRequest(new URL('http://localhost/api/contacts'), {
        method: 'POST',
        body: JSON.stringify({ firstName: 'John', birthday: 'not-a-date' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })
  })

  describe('GET /api/contacts/[id]', () => {
    it('should return a single contact', async () => {
      const mockContact = createMockContact({ id: validCuid, firstName: 'John', lastName: 'Doe' })
      vi.mocked(prisma.contact.findFirst).mockResolvedValue(mockContact)

      const request = new NextRequest(new URL(`http://localhost/api/contacts/${validCuid}`))
      const response = await GET_ID(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(JSON.parse(JSON.stringify(mockContact)))
    })

    it('should return 404 for non-existent contact', async () => {
      vi.mocked(prisma.contact.findFirst).mockResolvedValue(null)

      const request = new NextRequest(new URL('http://localhost/api/contacts/' + validCuid))
      const response = await GET_ID(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Contact not found')
    })

    it('should return 400 for invalid ID format', async () => {
      const request = new NextRequest(new URL('http://localhost/api/contacts/invalid-id'))
      const response = await GET_ID(request, { params: Promise.resolve({ id: 'invalid-id' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid ID format')
    })
  })

  describe('PUT /api/contacts/[id]', () => {
    it('should update a contact', async () => {
      const existingContact = createMockContact({ id: validCuid, firstName: 'Old Name', lastName: 'Doe' })
      const updatedContact = createMockContact({ id: validCuid, firstName: 'New Name', lastName: 'Doe' })

      vi.mocked(prisma.contact.findFirst).mockResolvedValue(existingContact)
      vi.mocked(prisma.contact.update).mockResolvedValue(updatedContact)

      const request = new NextRequest(new URL(`http://localhost/api/contacts/${validCuid}`), {
        method: 'PUT',
        body: JSON.stringify({ firstName: 'New Name', phone: '+1987654321' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.firstName).toBe('New Name')
      expect(data.id).toBe(validCuid)
      expect(prisma.contact.update).toHaveBeenCalledWith({
        where: { id: validCuid },
        data: expect.objectContaining({
          firstName: 'New Name',
          phone: '+1987654321',
        }),
      })
    })

    it('should handle birthday update to null', async () => {
      const existingContact = createMockContact({ id: validCuid, firstName: 'John', birthday: new Date('1990-01-15') })
      const updatedContact = createMockContact({ id: validCuid, firstName: 'John', birthday: null })

      vi.mocked(prisma.contact.findFirst).mockResolvedValue(existingContact)
      vi.mocked(prisma.contact.update).mockResolvedValue(updatedContact)

      const request = new NextRequest(new URL(`http://localhost/api/contacts/${validCuid}`), {
        method: 'PUT',
        body: JSON.stringify({ birthday: null }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.birthday).toBeNull()
    })

    it('should return 404 for non-existent contact', async () => {
      vi.mocked(prisma.contact.findFirst).mockResolvedValue(null)

      const request = new NextRequest(new URL(`http://localhost/api/contacts/${validCuid}`), {
        method: 'PUT',
        body: JSON.stringify({ firstName: 'New Name' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Contact not found')
    })
  })

  describe('DELETE /api/contacts/[id]', () => {
    it('should delete a contact', async () => {
      const existingContact = createMockContact({ id: validCuid, firstName: 'John' })
      vi.mocked(prisma.contact.findFirst).mockResolvedValue(existingContact)
      vi.mocked(prisma.contact.delete).mockResolvedValue({})

      const request = new NextRequest(new URL(`http://localhost/api/contacts/${validCuid}`), {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(prisma.contact.delete).toHaveBeenCalledWith({ where: { id: validCuid } })
    })

    it('should return 404 for non-existent contact', async () => {
      vi.mocked(prisma.contact.findFirst).mockResolvedValue(null)

      const request = new NextRequest(new URL(`http://localhost/api/contacts/${validCuid}`), {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Contact not found')
    })
  })
})