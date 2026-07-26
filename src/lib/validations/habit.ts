import { z } from 'zod'

export const habitCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).default('DAILY'),
  targetCount: z.number().int().positive().default(1),
  unit: z.string().max(20).default('times'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#10B981'),
  icon: z.string().max(50).optional(),
  reminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  reminderDays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).default(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
})

export const habitUpdateSchema = habitCreateSchema.partial().extend({
  archived: z.boolean().optional(),
})

const booleanStringSchema = z.preprocess(
  (val) => val === 'true',
  z.boolean()
)

export const habitQuerySchema = z.object({
  archived: booleanStringSchema.optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const habitLogCreateSchema = z.object({
  habitId: z.string().cuid(),
  date: z.string().date(),
  count: z.number().int().min(0).default(1),
  notes: z.string().max(2000).optional(),
})

export const habitLogUpdateSchema = habitLogCreateSchema.partial()

export const habitLogQuerySchema = z.object({
  habitId: z.string().cuid().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
})

export const habitIdParamSchema = z.object({
  id: z.string().cuid(),
})

export const habitLogIdParamSchema = z.object({
  id: z.string().cuid(),
})

export type HabitCreateInput = z.infer<typeof habitCreateSchema>
export type HabitUpdateInput = z.infer<typeof habitUpdateSchema>
export type HabitQueryInput = z.infer<typeof habitQuerySchema>
export type HabitLogCreateInput = z.infer<typeof habitLogCreateSchema>
export type HabitLogUpdateInput = z.infer<typeof habitLogUpdateSchema>
export type HabitLogQueryInput = z.infer<typeof habitLogQuerySchema>