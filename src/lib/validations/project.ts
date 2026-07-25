import { z } from 'zod'

export const projectCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(10000).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  icon: z.string().max(50).optional().nullable(),
})

export const projectUpdateSchema = projectCreateSchema.partial().extend({
  archived: z.boolean().optional(),
})

export const projectQuerySchema = z.object({
  archived: z.preprocess((val) => val === 'true', z.boolean()).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const projectIdParamSchema = z.object({
  id: z.string().cuid(),
})

export const sectionCreateSchema = z.object({
  name: z.string().min(1).max(200),
  order: z.number().int().default(0),
})

export const sectionUpdateSchema = sectionCreateSchema.partial()

export const sectionIdParamSchema = z.object({
  sectionId: z.string().cuid(),
})

export const memberAddSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(['OWNER', 'MEMBER', 'MANAGER']).default('MEMBER'),
})

export const memberUpdateSchema = z.object({
  role: z.enum(['OWNER', 'MEMBER', 'MANAGER']),
})

export const memberIdParamSchema = z.object({
  memberId: z.string().cuid(),
})

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>
export type SectionCreateInput = z.infer<typeof sectionCreateSchema>
export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>
export type MemberAddInput = z.infer<typeof memberAddSchema>
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>