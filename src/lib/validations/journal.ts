import { z } from 'zod'

export const journalEntryCreateSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(50000),
  mood: z.string().max(50).optional(),
  moodScore: z.number().int().min(1).max(10).optional(),
  tags: z.array(z.string().max(50)).optional(),
  date: z.string().date(),
})

export const journalEntryUpdateSchema = journalEntryCreateSchema.partial()

export const journalEntryQuerySchema = z.object({
  mood: z.string().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'date']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const journalEntryIdParamSchema = z.object({
  id: z.string().cuid(),
})

export type JournalEntryCreateInput = z.infer<typeof journalEntryCreateSchema>
export type JournalEntryUpdateInput = z.infer<typeof journalEntryUpdateSchema>
export type JournalEntryQueryInput = z.infer<typeof journalEntryQuerySchema>