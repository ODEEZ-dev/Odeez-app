import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { projectUpdateSchema, projectIdParamSchema } from '@/lib/validations/project'

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
    const { id: projectId } = projectIdParamSchema.parse({ id })

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        sections: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { tasks: true } } },
        },
        _count: { select: { tasks: true, members: true, sections: true } },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }
    console.error('Error fetching project:', error)
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
    const { id: projectId } = projectIdParamSchema.parse({ id })

    const existingProject = await prisma.project.findFirst({
      where: { id: projectId, ownerId: user.id },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = projectUpdateSchema.parse(body)

    const project = await prisma.project.update({
      where: { id: projectId },
      data: validated,
      include: {
        _count: { select: { tasks: true, members: true, sections: true } },
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error updating project:', error)
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
    const { id: projectId } = projectIdParamSchema.parse({ id })

    const existingProject = await prisma.project.findFirst({
      where: { id: projectId, ownerId: user.id },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.project.delete({ where: { id: projectId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
