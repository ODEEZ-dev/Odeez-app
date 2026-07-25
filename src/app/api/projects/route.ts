import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { projectQuerySchema, projectCreateSchema, ProjectQueryInput, ProjectCreateInput } from '@/lib/validations/project'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = projectQuerySchema.parse(Object.fromEntries(searchParams)) as ProjectQueryInput

    const where: Record<string, unknown> = {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    }

    if (query.archived !== undefined) where.archived = query.archived
    if (!query.archived) where.archived = false
    if (query.search) {
      where.AND = [
        {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {}
    orderBy[query.sortBy] = query.sortOrder

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          _count: { select: { tasks: true, members: true, sections: true } },
          owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({
      data: projects,
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
    console.error('Error fetching projects:', error)
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
    const validated = projectCreateSchema.parse(body) as ProjectCreateInput

    const project = await prisma.project.create({
      data: {
        name: validated.name,
        description: validated.description ?? null,
        color: validated.color,
        icon: validated.icon ?? null,
        ownerId: user.id,
        members: {
          create: { userId: user.id, role: 'OWNER' },
        },
        sections: {
          create: { name: 'General', order: 0 },
        },
      },
      include: {
        _count: { select: { tasks: true, members: true, sections: true } },
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
