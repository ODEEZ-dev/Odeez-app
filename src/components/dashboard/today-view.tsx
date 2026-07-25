'use client'

import { CheckSquare, Target, BookOpen, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface TodayStatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  bgColor: string
  loading?: boolean
  trend?: { value: number; label: string }
  href?: string
}

export function TodayStatCard({ label, value, icon, color, bgColor, loading, trend, href }: TodayStatCardProps) {
  const content = (
    <CardContent className="flex items-center justify-between p-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="h-8 w-24 mt-1" />
        ) : (
          <>
            <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
            {trend && (
              <p className={cn('text-sm mt-1 font-medium', color)}>
                +{trend.value} {trend.label}
              </p>
            )}
          </>
        )}
      </div>
      <div className={cn('p-3 rounded-lg', bgColor)}>
        {loading ? (
          <Skeleton className="h-6 w-6 rounded-lg" />
        ) : (
          <span className={cn('h-6 w-6', color)}>{icon}</span>
        )}
      </div>
    </CardContent>
  )

  if (href) {
    return (
      <Link href={href} className="block transition-colors hover:bg-accent/30 rounded-lg">
        <Card>{content}</Card>
      </Link>
    )
  }

  return <Card>{content}</Card>
}

interface TodayTaskListProps {
  tasks: Array<{
    id: string
    title: string
    dueDate?: string | null
    priority: string
    status: string
  }>
  overdue?: Array<{
    id: string
    title: string
    dueDate?: string | null
    priority: string
  }>
  loading?: boolean
}

export function TodayTaskList({ tasks, overdue, loading }: TodayTaskListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'HIGH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'LOW': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {overdue && overdue.length > 0 && (
<div className="mb-4">
              <h4 className="text-xs font-semibold text-destructive mb-2">Overdue</h4>
            <div className="space-y-2">
              {overdue.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border bg-destructive/5">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  <div className="flex-1">
                    <p className="font-medium line-through text-muted-foreground">{task.title}</p>
                    <p className="text-sm text-muted-foreground">Was due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                  <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {tasks.length > 0 ? (
          <div className="space-y-2">
            {overdue && overdue.length > 0 && <h4 className="text-xs font-medium text-muted-foreground mb-2">Due Today</h4>}
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                <div className="flex-1">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {task.dueDate ? new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All day'}
                  </p>
                </div>
                <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tasks due today. Enjoy your day!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TodayHabitListProps {
  habits: Array<{
    id: string
    name: string
    color: string
    icon?: string | null
    targetCount: number
    unit: string
    completed: boolean
    progress: number
    logCount: number
  }>
  loading?: boolean
}

export function TodayHabitList({ habits, loading }: TodayHabitListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Habits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (habits.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Habits
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No habits yet. Start building better habits!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Habits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: habit.color + '20', color: habit.color }}
            >
              {habit.icon ? (
                <span className="text-lg">{habit.icon}</span>
              ) : (
                <Target className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{habit.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={habit.progress} className="h-2 flex-1 max-w-[200px]" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {habit.logCount}/{habit.targetCount} {habit.unit}
                </span>
              </div>
            </div>
            {habit.completed && (
              <span className="text-green-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

interface TodayJournalCardProps {
  journal: {
    id: string
    title?: string | null
    content: string
    mood?: string | null
    moodScore?: number | null
  } | null
  loading?: boolean
}

const moodIcons: Record<string, React.ReactNode> = {
  VERY_HAPPY: '😄',
  HAPPY: '😊',
  NEUTRAL: '😐',
  SAD: '😔',
  VERY_SAD: '😭',
  ANXIOUS: '😰',
  ANGRY: '😠',
  EXCITED: '🤩',
  GRATEFUL: '🙏',
  PROUD: '😌',
}

export function TodayJournalCard({ journal, loading }: TodayJournalCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Journal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!journal) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Journal
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No entry for today. Write your thoughts!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Journal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {journal.title && <p className="font-medium">{journal.title}</p>}
        <p className="text-muted-foreground line-clamp-3">{journal.content}</p>
        {(journal.mood || journal.moodScore) && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {journal.mood && (
              <span className="text-2xl" title={journal.mood.replace(/_/g, ' ')}>
                {moodIcons[journal.mood] || '📝'}
              </span>
            )}
            {journal.moodScore && (
              <span className="text-sm text-muted-foreground">Mood: {journal.moodScore}/10</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TodayEventsCardProps {
  events: Array<{
    id: string
    title: string
    startTime: string
    endTime: string
    allDay: boolean
    location?: string | null
    color: string
  }>
  loading?: boolean
  className?: string
}

export function TodayEventsCard({ events, loading, className }: TodayEventsCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (events.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No events scheduled for today</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: event.color + '20', color: event.color }}
            >
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground">
                {event.allDay 
                  ? 'All day' 
                  : `${new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                {event.location && ` • ${event.location}`}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

interface TodayFinanceCardProps {
  income: number
  expenses: number
  balance: number
  loading?: boolean
}

export function TodayFinanceCard({ income, expenses, balance, loading }: TodayFinanceCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Finances This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-8 w-1/4" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900/50">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Income</p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-500 mt-1 tracking-tight">
                  {formatCurrency(income)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-rose-50 dark:bg-rose-950 border border-rose-100 dark:border-rose-900/50">
                <p className="text-xs font-medium text-rose-700 dark:text-rose-400">Expenses</p>
                <p className="text-lg font-semibold text-rose-600 dark:text-rose-500 mt-1 tracking-tight">
                  {formatCurrency(expenses)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20">
                <p className="text-xs font-medium text-muted-foreground">Balance</p>
                <p className={cn(
                  'text-lg font-semibold mt-1 tracking-tight',
                  balance >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'
                )}>
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
            <Progress 
              value={income > 0 ? Math.min(100, Math.round((expenses / income) * 100)) : 0} 
              className="h-2" 
              max={100}
            />
            <p className="text-sm text-muted-foreground text-center">
              {income > 0 ? `${Math.round((expenses / income) * 100)}% of income spent` : 'No income recorded'}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}