import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { contactUpdateSchema, contactIdParamSchema, ContactUpdateInput } from '@/lib/validations/contact'

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

    const { id } = contactIdParamSchema.parse(await params)

    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid ID format', details: error }, { status: 400 })
    }
    console.error('Error fetching contact:', error)
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

    const { id } = contactIdParamSchema.parse(await params)
    const body = await request.json()
    const validated = contactUpdateSchema.parse(body) as ContactUpdateInput

    const existingContact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...validated,
        birthday: validated.birthday ? new Date(validated.birthday) : validated.birthday === null ? null : undefined,
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error updating contact:', error)
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

    const { id } = contactIdParamSchema.parse(await params)

    const existingContact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    await prisma.contact.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid ID format', details: error }, { status: 400 })
    }
    console.error('Error deleting contact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}