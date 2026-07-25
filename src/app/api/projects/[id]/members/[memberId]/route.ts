import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { memberUpdateSchema, memberIdParamSchema, projectIdParamSchema } from '@/lib/validations/project'

interface RouteParams {
  params: Promise<{ id: string; memberId: string }>
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, memberId } = await params
    projectIdParamSchema.parse({ id })
    memberIdParamSchema.parse({ memberId })

    const project = await prisma.project.findFirst({
      where: { id, ownerId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = memberUpdateSchema.parse(body)

    const member = await prisma.projectMember.update({
      where: { id: memberId, projectId: id },
      data: { role: validated.role },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    })

    return NextResponse.json(member)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error updating member:', error)
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

    const { id, memberId } = await params
    projectIdParamSchema.parse({ id })
    memberIdParamSchema.parse({ memberId })

    const project = await prisma.project.findFirst({
      where: { id, ownerId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
    })

    if (member?.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove project owner' }, { status: 400 })
    }

    await prisma.projectMember.delete({
      where: { id: memberId, projectId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
