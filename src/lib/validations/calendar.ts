import { z } from 'zod'

export const calendarEventCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().default(false),
  location: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  recurringRule: z.string().optional().nullable(),
  rrule: z.string().optional().nullable(),
  exdates: z.array(z.string().datetime()).optional(),
  calendarId: z.string().optional().nullable(),
})

export const calendarEventUpdateSchema = calendarEventCreateSchema.partial()

export const calendarEventQuerySchema = z.object({
  calendarId: z.string().optional(),
  startFrom: z.string().datetime().optional(),
  startTo: z.string().datetime().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'startTime']).default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

export const calendarEventIdParamSchema = z.object({
  id: z.string().cuid(),
})

export type CalendarEventCreateInput = z.infer<typeof calendarEventCreateSchema>
export type CalendarEventUpdateInput = z.infer<typeof calendarEventUpdateSchema>
export type CalendarEventQueryInput = z.infer<typeof calendarEventQuerySchema>