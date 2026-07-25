import type {
  Task,
  Habit,
  HabitEntry,
  JournalEntry,
  FinanceEntry,
  Note,
  CalendarEvent,
  Contact,
  UserSettings,
  Project,
  ProjectMember,
  ProjectSection,
} from '@/types'

export function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-001',
    title: 'Test Task',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: null,
    startDate: null,
    completedAt: null,
    order: 0,
    userId: 'user-1',
    projectId: null,
    sectionId: null,
    parentId: null,
    recurringRule: null,
    estimatedMinutes: null,
    actualMinutes: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

export function createMockHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-001',
    name: 'Test Habit',
    description: null,
    frequency: 'DAILY',
    targetCount: 1,
    unit: 'times',
    color: '#10B981',
    icon: null,
    archived: false,
    reminderTime: '09:00',
    reminderDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    userId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    streak: 0,
    longestStreak: 0,
    completionRate: 0,
    completedToday: false,
    todayCount: 0,
    ...overrides,
  }
}

export function createMockHabitEntry(overrides: Partial<HabitEntry> = {}): HabitEntry {
  return {
    id: 'habit-entry-001',
    habitId: 'habit-001',
    userId: 'user-1',
    date: new Date('2024-01-01T00:00:00Z'),
    count: 1,
    notes: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

export function createMockJournalEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'journal-001',
    title: null,
    content: 'Test journal content',
    mood: 'NEUTRAL',
    moodScore: 5,
    tags: [],
    date: new Date('2024-01-01T00:00:00Z'),
    userId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

export function createMockFinanceEntry(overrides: Partial<FinanceEntry> = {}): FinanceEntry {
  return {
    id: 'finance-001',
    type: 'EXPENSE',
    amount: 0,
    currency: 'USD',
    category: 'Food',
    subcategory: null,
    description: null,
    date: new Date('2024-01-01T00:00:00Z'),
    recurring: false,
    recurringRule: null,
    tags: [],
    userId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

export function createMockNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-001',
    title: 'Test Note',
    content: '# Hello',
    color: '#FEF3C7',
    pinned: false,
    archived: false,
    tags: [],
    userId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

export function createMockCalendarEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'event-001',
    title: 'Test Event',
    description: null,
    startTime: new Date('2024-01-01T09:00:00Z'),
    endTime: new Date('2024-01-01T10:00:00Z'),
    allDay: false,
    location: null,
    color: '#3B82F6',
    recurring: false,
    recurringRule: null,
    rrule: null,
    exdates: [],
    calendarId: null,
    userId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

export function createMockContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 'contact-001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: null,
    company: null,
    title: null,
    birthday: null,
    address: null,
    notes: null,
    avatarUrl: null,
    tags: [],
    favorite: false,
    userId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

export function createMockUserSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    id: 'settings-001',
    userId: 'user-1',
    emailNotifications: true,
    pushNotifications: true,
    dailyDigest: false,
    weeklyReport: true,
    defaultTaskPriority: 'MEDIUM',
    defaultTaskView: 'LIST',
    weekStartsOn: 0,
    habitReminderTime: '09:00',
    defaultCurrency: 'USD',
    budgetAlertThreshold: 80,
    calendarView: 'WEEK',
    showWeekends: true,
    profilePublic: false,
    dataSharing: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

export function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-001',
    name: 'Test Project',
    description: null,
    color: '#3B82F6',
    icon: null,
    archived: false,
    ownerId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

export function createMockProjectMember(overrides: Partial<ProjectMember> = {}): ProjectMember {
  return {
    id: 'member-001',
    projectId: 'project-001',
    userId: 'user-2',
    role: 'MEMBER',
    joinedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

export function createMockProjectSection(overrides: Partial<ProjectSection> = {}): ProjectSection {
  return {
    id: 'section-001',
    projectId: 'project-001',
    name: 'General',
    order: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}