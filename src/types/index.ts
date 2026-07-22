export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'ARCHIVED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type HabitFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
export type Mood = 'VERY_HAPPY' | 'HAPPY' | 'NEUTRAL' | 'SAD' | 'VERY_SAD' | 'ANXIOUS' | 'EXCITED' | 'TIRED' | 'STRESSED' | 'GRATEFUL'
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT'

export interface TaskTag {
  id: string
  taskId: string
  name: string
  color: string
  createdAt: Date
}

export interface TaskSubtask {
  id: string
  title: string
  status: TaskStatus
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  dueDate: Date | null
  startDate: Date | null
  completedAt: Date | null
  order: number
  userId: string
  projectId: string | null
  sectionId: string | null
  parentId: string | null
  recurringRule: string | null
  estimatedMinutes: number | null
  actualMinutes: number | null
  createdAt: Date
  updatedAt: Date
  tags?: TaskTag[]
  subtasks?: TaskSubtask[]
  _count?: { comments: number; attachments: number }
  editMode?: boolean
}

export interface Project {
  id: string
  name: string
  description: string | null
  color: string
  icon: string | null
  archived: boolean
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface Habit {
  id: string
  name: string
  description: string | null
  frequency: HabitFrequency
  targetCount: number
  unit: string
  color: string
  icon: string | null
  archived: boolean
  reminderTime: string | null
  reminderDays: string[]
  userId: string
  createdAt: Date
  updatedAt: Date
  streak: number
  longestStreak: number
  completionRate: number
  completedToday: boolean
  todayCount: number
  logs?: HabitEntry[]
}

export interface HabitEntry {
  id: string
  habitId: string
  userId: string
  date: Date
  count: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface JournalEntry {
  id: string
  title: string | null
  content: string
  mood: Mood | null
  moodScore: number | null
  tags: string[]
  date: Date
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface FinanceEntry {
  id: string
  type: TransactionType
  amount: number
  currency: string
  category: string
  subcategory: string | null
  description: string | null
  date: Date
  recurring: boolean
  recurringRule: string | null
  tags: string[]
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Budget {
  id: string
  name: string
  category: string
  amount: number
  currency: string
  period: string
  startDate: Date
  endDate: Date | null
  alertThreshold: number
  userId: string
  createdAt: Date
  updatedAt: Date
  spent?: number
  remaining?: number
  percentage?: number
  isOverBudget?: boolean
  isNearThreshold?: boolean
}

export interface Note {
  id: string
  title: string
  content: string
  color: string
  pinned: boolean
  archived: boolean
  tags: string[]
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Contact {
  id: string
  firstName: string
  lastName: string | null
  email: string | null
  phone: string | null
  company: string | null
  title: string | null
  birthday: Date | null
  address: string | null
  notes: string | null
  avatarUrl: string | null
  tags: string[]
  favorite: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startTime: Date
  endTime: Date
  allDay: boolean
  location: string | null
  color: string | null
  recurring: boolean
  recurringRule: string | null
  rrule: string | null
  exdates: Date[]
  calendarId: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  timezone: string
  locale: string
  theme: string
  emailVerified: Date | null
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface UserSettings {
  id: string
  userId: string
  theme: 'light' | 'dark' | 'system'
  timezone: string
  currency: string
  weekStartsOn: number
  notifications: boolean
  dailyDigest: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TaskWithProject extends Task {
  project: Project | null
}

export interface HabitWithEntries extends Habit {
  entries: HabitEntry[]
}

export interface JournalEntryWithUser extends JournalEntry {
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>
}

export interface FinanceWithUser extends FinanceEntry {
  user: Pick<User, 'id' | 'name'>
}

export interface NoteWithUser extends Note {
  user: Pick<User, 'id' | 'name'>
}

export interface ContactWithUser extends Contact {
  user: Pick<User, 'id' | 'name'>
}

export interface CalendarEventWithUser extends CalendarEvent {
  user: Pick<User, 'id' | 'name'>
}

export interface ProjectWithTasks extends Project {
  tasks: Task[]
  _count: { tasks: number }
}

export interface DashboardStats {
  tasks: {
    total: number
    completed: number
    overdue: number
    dueToday: number
  }
  habits: {
    total: number
    completedToday: number
    streak: number
  }
  journal: {
    totalEntries: number
    thisWeek: number
  }
  finances: {
    income: number
    expenses: number
    balance: number
    thisMonth: { income: number; expenses: number }
  }
  notes: {
    total: number
    pinned: number
  }
  contacts: {
    total: number
    favorites: number
  }
  calendar: {
    upcomingEvents: number
    todayEvents: number
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all'

export interface DateRange {
  start: Date
  end: Date
}

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface MoodOption {
  value: Mood
  label: string
  emoji: string
  color: string
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'VERY_HAPPY', label: 'Very Happy', emoji: '😄', color: '#10B981' },
  { value: 'HAPPY', label: 'Happy', emoji: '😊', color: '#22C55E' },
  { value: 'NEUTRAL', label: 'Neutral', emoji: '😐', color: '#6B7280' },
  { value: 'SAD', label: 'Sad', emoji: '😔', color: '#EF4444' },
  { value: 'VERY_SAD', label: 'Very Sad', emoji: '😭', color: '#DC2626' },
  { value: 'ANXIOUS', label: 'Anxious', emoji: '😰', color: '#F59E0B' },
  { value: 'EXCITED', label: 'Excited', emoji: '🤩', color: '#8B5CF6' },
  { value: 'TIRED', label: 'Tired', emoji: '😴', color: '#9CA3AF' },
  { value: 'STRESSED', label: 'Stressed', emoji: '😤', color: '#EF4444' },
  { value: 'GRATEFUL', label: 'Grateful', emoji: '🙏', color: '#06B6D4' },
]

export const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: '#6B7280' },
  { value: 'MEDIUM', label: 'Medium', color: '#3B82F6' },
  { value: 'HIGH', label: 'High', color: '#F59E0B' },
  { value: 'URGENT', label: 'Urgent', color: '#EF4444' },
] as const

export const TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do', color: '#6B7280' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#3B82F6' },
  { value: 'IN_REVIEW', label: 'In Review', color: '#8B5CF6' },
  { value: 'DONE', label: 'Done', color: '#10B981' },
  { value: 'ARCHIVED', label: 'Archived', color: '#9CA3AF' },
] as const

export const HABIT_FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'CUSTOM', label: 'Custom' },
] as const

export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'INCOME', label: 'Income', color: '#10B981' },
  { value: 'EXPENSE', label: 'Expense', color: '#EF4444' },
  { value: 'TRANSFER', label: 'Transfer', color: '#3B82F6' },
  { value: 'INVESTMENT', label: 'Investment', color: '#8B5CF6' },
] as const

export const FINANCE_CATEGORIES = {
  INCOME: [
    'Salary',
    'Freelance',
    'Investments',
    'Gifts',
    'Refunds',
    'Other Income',
  ],
  EXPENSE: [
    'Housing',
    'Transportation',
    'Food',
    'Utilities',
    'Healthcare',
    'Entertainment',
    'Shopping',
    'Education',
    'Personal Care',
    'Subscriptions',
    'Travel',
    'Other Expense',
  ],
  TRANSFER: [
    'Bank Transfer',
    'Credit Card Payment',
    'Loan Payment',
    'Savings',
    'Investment Transfer',
  ],
  INVESTMENT: [
    'Stocks',
    'Bonds',
    'Crypto',
    'Real Estate',
    'Retirement',
    'Other Investment',
  ],
} as const