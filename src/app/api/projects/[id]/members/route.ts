import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { memberAddSchema, projectIdParamSchema, MemberAddInput } from '@/lib/validations/project'

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

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { joinedAt: 'asc' },
    })

    return NextResponse.json({ data: members })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }
    console.error('Error fetching members:', error)
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
    const validated = memberAddSchema.parse(body) as MemberAddInput

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: validated.userId,
        role: validated.role,
      },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error adding member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
