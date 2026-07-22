import { z } from 'zod'

export const searchQuerySchema = z.object({
  q: z.string().min(2).max(200),
  limit: z.coerce.number().int().positive().max(100).default(50),
  types: z.string().optional(),
})

export type SearchQueryInput = z.infer<typeof searchQuerySchema>

export const searchResultSchema = z.object({
  id: z.string().cuid(),
  type: z.enum(['task', 'habit', 'journal', 'finance', 'note', 'event', 'contact', 'setting']),
  title: z.string().max(200),
  subtitle: z.string().max(300).optional(),
  url: z.string().url(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export type SearchResult = z.infer<typeof searchResultSchema>

export const searchResponseSchema = z.object({
  data: z.array(searchResultSchema),
})

export type SearchResponse = z.infer<typeof searchResponseSchema>