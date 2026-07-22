import { z } from 'zod'

export const settingsUpdateSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  dailyDigest: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  defaultTaskPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  defaultTaskView: z.enum(['LIST', 'KANBAN', 'CALENDAR']).optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
  habitReminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  defaultCurrency: z.string().length(3).optional(),
  budgetAlertThreshold: z.number().int().min(1).max(100).optional(),
  calendarView: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']).optional(),
  showWeekends: z.boolean().optional(),
  profilePublic: z.boolean().optional(),
  dataSharing: z.boolean().optional(),
})

export const settingsQuerySchema = z.object({})

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>
export type SettingsQueryInput = z.infer<typeof settingsQuerySchema>