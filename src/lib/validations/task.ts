import { z } from 'zod'

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'ARCHIVED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  projectId: z.string().cuid().optional().nullable(),
  sectionId: z.string().cuid().optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
  recurringRule: z.string().optional().nullable(),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  tags: z.array(z.object({ name: z.string().min(1).max(50), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional() })).optional(),
})

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  completedAt: z.string().datetime().optional().nullable(),
  order: z.number().int().optional(),
})

export const taskQuerySchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'ARCHIVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  projectId: z.string().cuid().optional(),
  sectionId: z.string().cuid().optional(),
  parentId: z.string().cuid().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'title', 'order']).default('order'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const taskIdParamSchema = z.object({
  id: z.string().cuid(),
})

export type TaskCreateInput = z.infer<typeof taskCreateSchema>
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>
export type TaskQueryInput = z.infer<typeof taskQuerySchema>