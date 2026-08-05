'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  TodayCircularStatCard,
  TodayTaskList,
  TodayHabitList,
  TodayEventsCard,
  TodayJournalCard,
  TodayFinanceCard,
} from '@/components/dashboard/today-view'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckSquare, Target, Calendar, TrendingUp, TrendingDown } from 'lucide-react'

interface TodayData {
  date: string
  stats: {
    tasksDueToday: number
    overdueTasks: number
    completedTasksToday: number
    habitsTotal: number
    habitsCompleted: number
    habitsProgress: number
    journalEntry: boolean
    eventsToday: number
    incomeThisMonth: number
    expensesThisMonth: number
    balanceThisMonth: number
    notesCount: number
  }
  tasks: {
    dueToday: Array<{
      id: string
      title: string
      dueDate: string | null
      priority: string
      status: string
    }>
    overdue: Array<{
      id: string
      title: string
      dueDate: string | null
      priority: string
    }>
  }
  habits: Array<{
    id: string
    name: string
    color: string
    icon: string | null
    targetCount: number
    unit: string
    completed: boolean
    progress: number
    logCount: number
  }>
  journal: {
    id: string
    title: string | null
    content: string
    mood: string | null
    moodScore: number | null
  } | null
  events: Array<{
    id: string
    title: string
    startTime: string
    endTime: string
    allDay: boolean
    location: string | null
    color: string
  }>
}

async function fetchTodayData(): Promise<TodayData> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch('/api/today', {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch today data')
  }
  
  return response.json()
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-center p-6">
      <Skeleton className="h-32 w-32 rounded-full" />
    </div>
  )
}

function TasksSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-1/4 bg-muted rounded mb-2" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-12 w-full bg-muted rounded" />
      ))}
    </div>
  )
}

function HabitsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-1/4 bg-muted rounded mb-2" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 w-full bg-muted rounded" />
      ))}
    </div>
  )
}

function EventsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-1/4 bg-muted rounded mb-2" />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-12 w-full bg-muted rounded" />
      ))}
    </div>
  )
}

function JournalSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-1/4 bg-muted rounded mb-2" />
      <div className="h-20 w-full bg-muted rounded" />
    </div>
  )
}

function FinanceSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-1/4 bg-muted rounded mb-2" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 w-full bg-muted rounded" />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['today'],
    queryFn: fetchTodayData,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const today = new Date()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-1/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse mt-1" />
          </div>
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
        </div>
        
        <div className="grid gap-6 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><StatCardSkeleton /></Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card><TasksSkeleton /></Card>
          <Card><HabitsSkeleton /></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card><EventsSkeleton /></Card>
          <Card><JournalSkeleton /></Card>
        </div>

        <Card><FinanceSkeleton /></Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Failed to load dashboard. Please try again.</p>
        <button 
          onClick={() => refetch()}
          className="mt-4 text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { stats, tasks, habits, journal, events } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good morning!</h1>
          <p className="text-muted-foreground">
            Today is {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '0ms' }}>
          <TodayCircularStatCard
            label="Tasks Due Today"
            value={stats.tasksDueToday}
            maxValue={20}
            color="text-blue-500"
            href="/dashboard/tasks"
          />
        </div>
        <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '75ms' }}>
          <TodayCircularStatCard
            label="Habit Progress"
            value={stats.habitsProgress}
            maxValue={100}
            color="text-orange-500"
            href="/dashboard/habits"
          />
        </div>
        <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '150ms' }}>
          <TodayCircularStatCard
            label="Events Today"
            value={stats.eventsToday}
            maxValue={10}
            color="text-purple-500"
            href="/dashboard/calendar"
          />
        </div>
        <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '225ms' }}>
          <TodayCircularStatCard
            label="This Month"
            value={Math.abs(stats.balanceThisMonth)}
            maxValue={10000}
            color={stats.balanceThisMonth >= 0 ? 'text-green-500' : 'text-red-500'}
            href="/dashboard/finances"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '300ms' }}>
          <TodayTaskList tasks={tasks.dueToday} overdue={tasks.overdue} />
        </div>
        <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '375ms' }}>
          <TodayHabitList habits={habits} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '450ms' }}>
          <TodayEventsCard events={events} />
        </div>
        <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '525ms' }}>
          <TodayJournalCard journal={journal} />
        </div>
      </div>

      <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '600ms' }}>
        <TodayFinanceCard
          income={stats.incomeThisMonth}
          expenses={stats.expensesThisMonth}
          balance={stats.balanceThisMonth}
        />
      </div>
    </div>
  )
}