import { z } from 'zod'

export const financeEntryCreateSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'INVESTMENT']).default('EXPENSE'),
  amount: z.number().positive().max(999999999.99),
  currency: z.string().length(3).default('USD'),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  date: z.string().date(),
  recurring: z.boolean().default(false),
  recurringRule: z.string().optional().nullable(),
  tags: z.array(z.string().max(50)).optional(),
})

export const financeEntryUpdateSchema = financeEntryCreateSchema.partial().extend({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'INVESTMENT']).optional(),
})

export const financeEntryQuerySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'date', 'amount']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const budgetCreateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  amount: z.number().positive().max(999999999.99),
  currency: z.string().length(3).default('USD'),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  startDate: z.string().date(),
  endDate: z.string().date().optional().nullable(),
  alertThreshold: z.number().int().min(1).max(100).default(80),
})

export const budgetUpdateSchema = budgetCreateSchema.partial()

const booleanStringSchema = z.preprocess(
  (val) => val === 'true',
  z.boolean()
)

export const budgetQuerySchema = z.object({
  category: z.string().optional(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  active: booleanStringSchema.optional(),
})

export const financeEntryIdParamSchema = z.object({
  id: z.string().cuid(),
})

export const budgetIdParamSchema = z.object({
  id: z.string().cuid(),
})

export type FinanceEntryCreateInput = z.infer<typeof financeEntryCreateSchema>
export type FinanceEntryUpdateInput = z.infer<typeof financeEntryUpdateSchema>
export type FinanceEntryQueryInput = z.infer<typeof financeEntryQuerySchema>
export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>
export type BudgetUpdateInput = z.infer<typeof budgetUpdateSchema>
export type BudgetQueryInput = z.infer<typeof budgetQuerySchema>