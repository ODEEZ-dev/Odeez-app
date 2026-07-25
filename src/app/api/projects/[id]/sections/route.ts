import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { sectionCreateSchema, projectIdParamSchema, SectionCreateInput } from '@/lib/validations/project'

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
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const sections = await prisma.projectSection.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { tasks: true } } },
    })

    return NextResponse.json({ data: sections })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }
    console.error('Error fetching sections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { id: projectId } = projectIdParamSchema.parse({ id })

    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = sectionCreateSchema.parse(body) as SectionCreateInput

    const maxOrder = await prisma.projectSection.aggregate({
      where: { projectId },
      _max: { order: true },
    })

    const section = await prisma.projectSection.create({
      data: {
        projectId,
        name: validated.name,
        order: validated.order ?? (maxOrder._max.order ?? -1) + 1,
      },
      include: { _count: { select: { tasks: true } } },
    })

    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error creating section:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
