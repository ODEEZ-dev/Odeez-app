import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { journalEntryUpdateSchema, journalEntryIdParamSchema } from '@/lib/validations/journal'

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
    const { id: entryId } = journalEntryIdParamSchema.parse({ id })

    const entry = await prisma.journalEntry.findFirst({
      where: { id: entryId, userId: user.id },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 })
    }
    console.error('Error fetching journal entry:', error)
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
    const { id: entryId } = journalEntryIdParamSchema.parse({ id })
    const body = await request.json()
    const validated = journalEntryUpdateSchema.parse(body)

    const existingEntry = await prisma.journalEntry.findFirst({
      where: { id: entryId, userId: user.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { ...validated }
    if (validated.date !== undefined) {
      updateData.date = new Date(validated.date)
    }

    const entry = await prisma.journalEntry.update({
      where: { id: entryId },
      data: updateData,
    })

    return NextResponse.json(entry)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error updating journal entry:', error)
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
    const { id: entryId } = journalEntryIdParamSchema.parse({ id })

    const existingEntry = await prisma.journalEntry.findFirst({
      where: { id: entryId, userId: user.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    await prisma.journalEntry.delete({
      where: { id: entryId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 })
    }
    console.error('Error deleting journal entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}