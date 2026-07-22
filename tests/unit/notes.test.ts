import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/notes/route'
import { GET as GET_ID, PUT, DELETE } from '@/app/api/notes/[id]/route'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    note: {
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

describe('Notes API', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' }
  const mockSession = { access_token: 'mock-token' }
  const validCuid = 'clx1234567890abcdef123456' // Valid CUID format

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

  describe('GET /api/notes', () => {
    it('should return notes for authenticated user', async () => {
      const mockNotes = [
        { id: validCuid, title: 'Note 1', content: 'Content 1', userId: 'user-1' },
        { id: 'clx1234567890abcdef123457', title: 'Note 2', content: 'Content 2', userId: 'user-1' },
      ]

      vi.mocked(prisma.note.findMany).mockResolvedValue(mockNotes)
      vi.mocked(prisma.note.count).mockResolvedValue(2)

      const request = new NextRequest(new URL('http://localhost/api/notes'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockNotes)
      expect(data.meta.total).toBe(2)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } }),
        },
      } as any)

      const request = new NextRequest(new URL('http://localhost/api/notes'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should filter by pinned and archived', async () => {
      vi.mocked(prisma.note.findMany).mockResolvedValue([])
      vi.mocked(prisma.note.count).mockResolvedValue(0)

      // z.coerce.boolean() treats "false" as truthy, so use "0" for false
      const request = new NextRequest(new URL('http://localhost/api/notes?pinned=true&archived=0'))
      await GET(request)

      expect(prisma.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ pinned: true, archived: false, userId: 'user-1' }),
        })
      )
    })

    it('should filter by search query', async () => {
      vi.mocked(prisma.note.findMany).mockResolvedValue([])
      vi.mocked(prisma.note.count).mockResolvedValue(0)

      const request = new NextRequest(new URL('http://localhost/api/notes?search=test'))
      await GET(request)

      expect(prisma.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'test', mode: 'insensitive' } },
              { content: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        })
      )
    })
  })

  describe('POST /api/notes', () => {
    it('should create a new note for authenticated user', async () => {
      const newNote = { id: validCuid, title: 'New Note', content: 'Content', userId: 'user-1' }
      vi.mocked(prisma.note.create).mockResolvedValue(newNote)

      const request = new NextRequest(new URL('http://localhost/api/notes'), {
        method: 'POST',
        body: JSON.stringify({ title: 'New Note', content: 'Content' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(newNote)
      expect(prisma.note.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Note',
          content: 'Content',
          userId: 'user-1',
        }),
      })
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest(new URL('http://localhost/api/notes'), {
        method: 'POST',
        body: JSON.stringify({ title: '', content: 'Content' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })
  })

  describe('GET /api/notes/[id]', () => {
    it('should return a single note', async () => {
      const mockNote = { id: validCuid, title: 'Note 1', content: 'Content', userId: 'user-1' }
      vi.mocked(prisma.note.findFirst).mockResolvedValue(mockNote)

      const request = new NextRequest(new URL(`http://localhost/api/notes/${validCuid}`))
      const response = await GET_ID(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockNote)
    })

    it('should return 404 for non-existent note', async () => {
      vi.mocked(prisma.note.findFirst).mockResolvedValue(null)

      const request = new NextRequest(new URL('http://localhost/api/notes/' + validCuid))
      const response = await GET_ID(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Note not found')
    })

    it('should return 400 for invalid ID format', async () => {
      const request = new NextRequest(new URL('http://localhost/api/notes/invalid-id'))
      const response = await GET_ID(request, { params: Promise.resolve({ id: 'invalid-id' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid note ID')
    })
  })

  describe('PUT /api/notes/[id]', () => {
    it('should update a note', async () => {
      const existingNote = { id: validCuid, title: 'Old Title', content: 'Old', userId: 'user-1' }
      const updatedNote = { id: validCuid, title: 'New Title', content: 'New', userId: 'user-1' }

      vi.mocked(prisma.note.findFirst).mockResolvedValue(existingNote)
      vi.mocked(prisma.note.update).mockResolvedValue(updatedNote)

      const request = new NextRequest(new URL(`http://localhost/api/notes/${validCuid}`), {
        method: 'PUT',
        body: JSON.stringify({ title: 'New Title', content: 'New' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedNote)
    })

    it('should return 404 for non-existent note', async () => {
      vi.mocked(prisma.note.findFirst).mockResolvedValue(null)

      const request = new NextRequest(new URL(`http://localhost/api/notes/${validCuid}`), {
        method: 'PUT',
        body: JSON.stringify({ title: 'New Title' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Note not found')
    })
  })

  describe('DELETE /api/notes/[id]', () => {
    it('should delete a note', async () => {
      const existingNote = { id: validCuid, title: 'Note 1', userId: 'user-1' }
      vi.mocked(prisma.note.findFirst).mockResolvedValue(existingNote)
      vi.mocked(prisma.note.delete).mockResolvedValue({})

      const request = new NextRequest(new URL(`http://localhost/api/notes/${validCuid}`), {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(prisma.note.delete).toHaveBeenCalledWith({ where: { id: validCuid } })
    })

    it('should return 404 for non-existent note', async () => {
      vi.mocked(prisma.note.findFirst).mockResolvedValue(null)

      const request = new NextRequest(new URL(`http://localhost/api/notes/${validCuid}`), {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: validCuid }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Note not found')
    })
  })
})