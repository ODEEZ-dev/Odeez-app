import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { financeEntryUpdateSchema, financeEntryIdParamSchema, FinanceEntryUpdateInput } from '@/lib/validations/finance'

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
    const { id: entryId } = financeEntryIdParamSchema.parse({ id })

    const entry = await prisma.financeEntry.findFirst({
      where: { id: entryId, userId: user.id },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Finance entry not found' }, { status: 404 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 })
    }
    console.error('Error fetching finance entry:', error)
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
    const { id: entryId } = financeEntryIdParamSchema.parse({ id })

    const existingEntry = await prisma.financeEntry.findFirst({
      where: { id: entryId, userId: user.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Finance entry not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = financeEntryUpdateSchema.parse(body) as FinanceEntryUpdateInput

    const updateData: Record<string, unknown> = { ...validated }
    
    if (validated.amount !== undefined) {
      updateData.amount = validated.amount
    }
    if (validated.date !== undefined) {
      updateData.date = new Date(validated.date)
    }

    const entry = await prisma.financeEntry.update({
      where: { id: entryId },
      data: updateData,
    })

    return NextResponse.json(entry)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error updating finance entry:', error)
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
    const { id: entryId } = financeEntryIdParamSchema.parse({ id })

    const existingEntry = await prisma.financeEntry.findFirst({
      where: { id: entryId, userId: user.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Finance entry not found' }, { status: 404 })
    }

    await prisma.financeEntry.delete({ where: { id: entryId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 })
    }
    console.error('Error deleting finance entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}