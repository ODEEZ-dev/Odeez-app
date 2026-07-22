import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { taskQuerySchema, taskCreateSchema } from '@/lib/validations/task'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = taskQuerySchema.parse(Object.fromEntries(searchParams))

    const where: Record<string, unknown> = { userId: user.id }

    if (query.status) where.status = query.status
    if (query.priority) where.priority = query.priority
    if (query.projectId) where.projectId = query.projectId
    if (query.sectionId) where.sectionId = query.sectionId
    if (query.parentId) where.parentId = query.parentId
    if (query.dueDateFrom || query.dueDateTo) {
      where.dueDate = {}
      if (query.dueDateFrom) (where.dueDate as Record<string, Date>).gte = new Date(query.dueDateFrom)
      if (query.dueDateTo) (where.dueDate as Record<string, Date>).lte = new Date(query.dueDateTo)
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }
    if (query.tags && query.tags.length > 0) {
      where.tags = { some: { name: { in: query.tags } } }
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {}
    orderBy[query.sortBy] = query.sortOrder

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          tags: true,
          subtasks: { select: { id: true, title: true, status: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      }),
      prisma.task.count({ where }),
    ])

    return NextResponse.json({
      data: tasks,
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
    console.error('Error fetching tasks:', error)
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
    const validated = taskCreateSchema.parse(body)

    const maxOrder = await prisma.task.aggregate({
      where: { userId: user.id, status: validated.status },
      _max: { order: true },
    })

    const task = await prisma.task.create({
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        order: (maxOrder._max.order ?? -1) + 1,
        userId: user.id,
        tags: validated.tags
          ? { create: validated.tags.map((t) => ({ name: t.name, color: t.color || '#6B7280' })) }
          : undefined,
      },
      include: { tags: true, subtasks: true, _count: { select: { comments: true, attachments: true } } },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
