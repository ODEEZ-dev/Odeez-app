import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { contactCreateSchema, contactQuerySchema, ContactCreateInput, ContactQueryInput } from '@/lib/validations/contact'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = contactQuerySchema.parse(Object.fromEntries(searchParams)) as ContactQueryInput

    console.log('Parsed query:', JSON.stringify(query, null, 2))

    const where: Record<string, unknown> = { userId: user.id }

    if (query.favorite !== undefined) where.favorite = query.favorite
    if (query.tags && query.tags.length > 0) {
      where.tags = { hasSome: query.tags }
    }
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {}
    orderBy[query.sortBy] = query.sortOrder

    console.log('About to call findMany with where:', JSON.stringify(where), 'orderBy:', JSON.stringify(orderBy))

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.contact.count({ where }),
    ])

    return NextResponse.json({
      data: contacts,
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
    console.error('Error fetching contacts:', error)
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
    const validated = contactCreateSchema.parse(body) as ContactCreateInput

    const contact = await prisma.contact.create({
      data: {
        ...validated,
        birthday: validated.birthday ? new Date(validated.birthday) : null,
        userId: user.id,
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error creating contact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}