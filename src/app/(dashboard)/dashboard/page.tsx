'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  TodayStatCard,
  TodayTaskList,
  TodayHabitList,
  TodayEventsCard,
  TodayJournalCard,
  TodayFinanceCard,
} from '@/components/dashboard/today-view'
import { Card } from '@/components/ui/card'
import { CheckSquare, Target, Calendar, TrendingUp, TrendingDown, ArrowUpRight, Sparkles } from 'lucide-react'

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
    <div className="animate-pulse">
      <div className="h-4 w-1/4 bg-muted rounded mb-2" />
      <div className="h-8 w-1/2 bg-muted rounded" />
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
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><StatCardSkeleton /></Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card><TasksSkeleton /></Card>
          <Card><HabitsSkeleton /></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2"><EventsSkeleton /></Card>
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
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[#20242a] px-6 py-7 text-white shadow-[0_22px_50px_-30px_rgba(32,36,42,0.8)] md:px-9 md:py-9">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#f4c94f]/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/65">
              <Sparkles className="h-3.5 w-3.5 text-[#f4c94f]" />
              Your personal rhythm
            </div>
            <h1 className="max-w-xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl">Good morning, make space for what matters.</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/60 md:text-base">
              A calm view of your day, from focused tasks to the small habits that move you forward.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/60">
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Today</p>
              <p className="mt-1 font-medium text-white">{today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
            <Link href="/dashboard/tasks" className="group rounded-2xl bg-[#f4c94f] px-4 py-3 font-semibold text-[#20242a] transition-transform hover:-translate-y-0.5">
              Plan your day <ArrowUpRight className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '0ms' }}>
          <TodayStatCard
            label="Tasks Due Today"
            value={stats.tasksDueToday}
            icon={<CheckSquare className="h-6 w-6 text-blue-500" />}
            color="text-blue-500"
            bgColor="bg-blue-100 dark:bg-blue-900/30"
            trend={stats.completedTasksToday > 0 ? { value: stats.completedTasksToday, label: 'completed' } : undefined}
            href="/dashboard/tasks"
          />
        </div>
        <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '75ms' }}>
          <TodayStatCard
            label="Habit Progress"
            value={`${stats.habitsProgress}%`}
            icon={<Target className="h-6 w-6 text-orange-500" />}
            color="text-orange-500"
            bgColor="bg-orange-100 dark:bg-orange-900/30"
            trend={stats.habitsCompleted > 0 ? { value: stats.habitsCompleted, label: 'done' } : undefined}
            href="/dashboard/habits"
          />
        </div>
        <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '150ms' }}>
          <TodayStatCard
            label="Events Today"
            value={stats.eventsToday}
            icon={<Calendar className="h-6 w-6 text-purple-500" />}
            color="text-purple-500"
            bgColor="bg-purple-100 dark:bg-purple-900/30"
            href="/dashboard/calendar"
          />
        </div>
        <div className="animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '225ms' }}>
          <TodayStatCard
            label="This Month"
            value={`$${stats.balanceThisMonth.toLocaleString()}`}
            icon={stats.balanceThisMonth >= 0 ? (
              <TrendingUp className="h-6 w-6 text-green-500" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-500" />
            )}
            color={stats.balanceThisMonth >= 0 ? 'text-green-500' : 'text-red-500'}
            bgColor={stats.balanceThisMonth >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 animate-card-enter opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '450ms' }}>
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