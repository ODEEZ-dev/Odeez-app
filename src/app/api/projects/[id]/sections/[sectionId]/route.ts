import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { sectionUpdateSchema, sectionIdParamSchema, projectIdParamSchema } from '@/lib/validations/project'

interface RouteParams {
  params: Promise<{ id: string; sectionId: string }>
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, sectionId } = await params
    projectIdParamSchema.parse({ id })
    sectionIdParamSchema.parse({ sectionId })

    const project = await prisma.project.findFirst({
      where: { id, ownerId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = sectionUpdateSchema.parse(body)

    const section = await prisma.projectSection.update({
      where: { id: sectionId, projectId: id },
      data: validated,
      include: { _count: { select: { tasks: true } } },
    })

    return NextResponse.json(section)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error updating section:', error)
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

    const { id, sectionId } = await params
    projectIdParamSchema.parse({ id })
    sectionIdParamSchema.parse({ sectionId })

    const project = await prisma.project.findFirst({
      where: { id, ownerId: user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.projectSection.delete({
      where: { id: sectionId, projectId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }
    console.error('Error deleting section:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
