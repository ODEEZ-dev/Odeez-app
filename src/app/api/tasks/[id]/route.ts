import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { taskUpdateSchema, taskIdParamSchema } from '@/lib/validations/task'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { id: taskId } = taskIdParamSchema.parse({ id })

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
      include: {
        tags: true,
        subtasks: { orderBy: { order: 'asc' } },
        comments: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        attachments: { orderBy: { createdAt: 'desc' } },
        project: { select: { id: true, name: true, color: true, icon: true } },
        section: { select: { id: true, name: true } },
        parent: { select: { id: true, title: true } },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { id: taskId } = taskIdParamSchema.parse({ id })

    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = taskUpdateSchema.parse(body)

    const updateData: Record<string, unknown> = { ...validated }
    
    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null
    }
    if (validated.startDate !== undefined) {
      updateData.startDate = validated.startDate ? new Date(validated.startDate) : null
    }
    if (validated.completedAt !== undefined) {
      updateData.completedAt = validated.completedAt ? new Date(validated.completedAt) : null
    }

    // Handle tags separately
    if (validated.tags !== undefined) {
      await prisma.taskTag.deleteMany({ where: { taskId } })
      if (validated.tags.length > 0) {
        updateData.tags = {
          create: validated.tags.map((t) => ({ name: t.name, color: t.color || '#6B7280' })),
        }
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: { tags: true, subtasks: true, _count: { select: { comments: true, attachments: true } } },
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { id: taskId } = taskIdParamSchema.parse({ id })

    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await prisma.task.delete({ where: { id: taskId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}