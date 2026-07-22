import { z } from 'zod'

const booleanStringSchema = z.preprocess(
  (val) => val === 'true',
  z.boolean()
)

const numberStringSchema = z.preprocess(
  (val) => parseInt(val as string, 10),
  z.number().int().positive()
)

const arrayStringSchema = z.preprocess(
  (val) => (val as string).split(',').filter(Boolean),
  z.array(z.string())
)

export const contactCreateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email('Invalid email').max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  birthday: z.string().date().optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  avatarUrl: z.string().url('Invalid URL').max(500).optional().nullable(),
  tags: z.array(z.string().max(50)).optional(),
  favorite: z.boolean().default(false),
})

export const contactUpdateSchema = contactCreateSchema.partial()

export const contactQuerySchema = z.object({
  favorite: booleanStringSchema.optional(),
  tags: arrayStringSchema.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'company']).default('firstName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: numberStringSchema.default(1),
  limit: numberStringSchema.default(20),
})

export const contactIdParamSchema = z.object({
  id: z.string().cuid(),
})

export type ContactCreateInput = z.infer<typeof contactCreateSchema>
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>
export type ContactQueryInput = z.infer<typeof contactQuerySchema>