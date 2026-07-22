import { z } from 'zod'

export const noteCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50000),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FEF3C7'),
  pinned: z.boolean().default(false),
  archived: z.boolean().default(false),
  tags: z.array(z.string().max(50)).optional(),
})

export const noteUpdateSchema = noteCreateSchema.partial()

const booleanStringSchema = z.preprocess(
  (val) => val === 'true',
  z.boolean()
)

export const noteQuerySchema = z.object({
  pinned: booleanStringSchema.optional(),
  archived: booleanStringSchema.optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const noteIdParamSchema = z.object({
  id: z.string().cuid(),
})

export type NoteCreateInput = z.infer<typeof noteCreateSchema>
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>
export type NoteQueryInput = z.infer<typeof noteQuerySchema>