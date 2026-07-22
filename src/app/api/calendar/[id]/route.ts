import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { calendarEventUpdateSchema, calendarEventIdParamSchema } from '@/lib/validations/calendar'

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
    const { id: eventId } = calendarEventIdParamSchema.parse({ id })

    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId: user.id },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }
    console.error('Error fetching calendar event:', error)
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
    const { id: eventId } = calendarEventIdParamSchema.parse({ id })
    const body = await request.json()
    const validated = calendarEventUpdateSchema.parse(body)

    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId: user.id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { ...validated }
    if (validated.startTime) updateData.startTime = new Date(validated.startTime)
    if (validated.endTime) updateData.endTime = new Date(validated.endTime)
    if (validated.exdates) updateData.exdates = validated.exdates.map(d => new Date(d))

    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData,
    })

    return NextResponse.json(event)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    console.error('Error updating calendar event:', error)
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
    const { id: eventId } = calendarEventIdParamSchema.parse({ id })

    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId: user.id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }
    console.error('Error deleting calendar event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}