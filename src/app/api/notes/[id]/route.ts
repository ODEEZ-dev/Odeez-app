import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { noteUpdateSchema, noteIdParamSchema } from '@/lib/validations/note'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { id: noteId } = noteIdParamSchema.parse({ id })

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId: user.id },
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 })
    }
    console.error('Error fetching note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { id: noteId } = noteIdParamSchema.parse({ id })
    const body = await request.json()
    const validated = noteUpdateSchema.parse(body)

    const existingNote = await prisma.note.findFirst({
      where: { id: noteId, userId: user.id },
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: validated,
    })

    return NextResponse.json(note)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error updating note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { id: noteId } = noteIdParamSchema.parse({ id })

    const existingNote = await prisma.note.findFirst({
      where: { id: noteId, userId: user.id },
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    await prisma.note.delete({
      where: { id: noteId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 })
    }
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}