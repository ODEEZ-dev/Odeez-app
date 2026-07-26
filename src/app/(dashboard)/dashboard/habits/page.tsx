'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { CheckSquare, Plus, Filter, Calendar, Flame, Target, Archive } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HabitCard } from '@/components/habits/habit-card'
import { HabitDialog } from '@/components/habits/habit-dialog'
import { HabitHeatmap } from '@/components/habits/habit-heatmap'
import { Habit, HabitEntry } from '@/types'
import { HabitCreateInput, HabitUpdateInput } from '@/lib/validations/habit'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'

interface HabitsResponse {
  data: (Habit & {
    logs: HabitEntry[]
    streak: number
    longestStreak: number
    completionRate: number
    completedToday: boolean
    todayCount: number
  })[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

async function fetchHabits(params?: URLSearchParams): Promise<HabitsResponse> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const queryString = params ? `?${params.toString()}` : ''
  const response = await fetch(`/api/habits${queryString}`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch habits')
  }

  return response.json()
}

async function createHabit(data: HabitCreateInput): Promise<Habit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch('/api/habits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create habit')
  }

  return response.json()
}

async function updateHabit(id: string, data: HabitUpdateInput): Promise<Habit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/habits/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update habit')
  }

  return response.json()
}

async function deleteHabit(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/habits/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete habit')
  }
}

type HabitWithStats = Habit & {
  logs: HabitEntry[]
  streak: number
  longestStreak: number
  completionRate: number
  completedToday: boolean
  todayCount: number
}

async function toggleHabitComplete(habit: HabitWithStats): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateStr = format(today, 'yyyy-MM-dd')

  const response = await fetch(`/api/habits/${habit.id}/logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      habitId: habit.id,
      date: dateStr,
      count: habit.completedToday ? 0 : habit.targetCount,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to toggle habit')
  }
}

export default function HabitsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [archived, setArchived] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)

  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  params.append('archived', archived.toString())
  params.append('sortBy', 'createdAt')
  params.append('sortOrder', 'desc')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['habits', params.toString()],
    queryFn: () => fetchHabits(params),
  })

  const habits = data?.data || []
  const totalHabits = data?.meta.total || 0
  const totalPages = data?.meta.totalPages || 1

  const activeHabits = habits.filter((h) => !h.archived)
  const completedToday = activeHabits.filter((h) => h.completedToday).length
  const totalStreak = Math.max(...activeHabits.map((h) => h.streak), 0)

  const createMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Habit created successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create habit', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: HabitUpdateInput }) => updateHabit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Habit updated successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update habit', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Habit deleted' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete habit', description: error.message, variant: 'destructive' })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: toggleHabitComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to toggle habit', description: error.message, variant: 'destructive' })
    },
  })

  const handleHabitUpdate = useCallback((habit: Habit & {
    logs: HabitEntry[]
    streak: number
    longestStreak: number
    completionRate: number
    completedToday: boolean
    todayCount: number
  }) => {
    if ((habit as any).editMode) {
      setEditingHabit(habit)
      setDialogOpen(true)
      return
    }

updateMutation.mutate({
          id: habit.id,
          data: {
            name: habit.name,
            description: habit.description ?? undefined,
            frequency: habit.frequency,
            targetCount: habit.targetCount,
            unit: habit.unit,
            color: habit.color,
            icon: habit.icon ?? undefined,
            reminderTime: habit.reminderTime ?? undefined,
            reminderDays: habit.reminderDays as ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[],
          },
        })
  }, [updateMutation])

  const handleHabitDelete = useCallback((habitId: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      deleteMutation.mutate(habitId)
    }
  }, [deleteMutation])

  const handleToggleComplete = useCallback((habit: Habit & {
    logs: HabitEntry[]
    streak: number
    longestStreak: number
    completionRate: number
    completedToday: boolean
    todayCount: number
  }) => {
    toggleMutation.mutate(habit)
  }, [toggleMutation])

  const handleEdit = useCallback((habit: Habit & {
    logs: HabitEntry[]
    streak: number
    longestStreak: number
    completionRate: number
    completedToday: boolean
    todayCount: number
  }) => {
    setEditingHabit(habit)
    setDialogOpen(true)
  }, [])

  const handleAddHabit = useCallback(() => {
    setEditingHabit(null)
    setDialogOpen(true)
  }, [])

  const handleDialogSubmit = useCallback(async (habitData: HabitCreateInput) => {
    if (editingHabit) {
      updateMutation.mutate({ id: editingHabit.id, data: habitData })
    } else {
      await createMutation.mutateAsync(habitData)
    }
    setEditingHabit(null)
    setDialogOpen(false)
  }, [editingHabit, createMutation, updateMutation])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
            <p className="text-muted-foreground">Build better habits, track your progress</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="capitalize">Loading...</span>
                  <div className="animate-pulse h-5 w-12 bg-muted rounded" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-20 w-full bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Failed to load habits. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-8 w-8 text-green-500" />
            Habits
          </h1>
          <p className="text-muted-foreground mt-1">
            {totalHabits} habit{totalHabits !== 1 ? 's' : ''} total
            {archived && <span className="ml-2 text-sm text-muted-foreground">(archived)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showHeatmap ? 'default' : 'outline'}
                size="icon"
                onClick={() => setShowHeatmap(!showHeatmap)}
                className="h-10 w-10"
              >
                <Flame className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Activity Heatmap</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setArchived(false)}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setArchived(true)}>Archived</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => handleAddHabit()}>
                <Plus className="h-4 w-4 mr-2" />
                New Habit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAddHabit}>
            <Plus className="h-4 w-4 mr-2" />
            New Habit
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeHabits.length}</div>
            <p className="text-xs text-muted-foreground">Currently tracking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday} / {activeHabits.length}</div>
            <p className="text-xs text-muted-foreground">{activeHabits.length > 0 ? Math.round((completedToday / activeHabits.length) * 100) : 0}% complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{totalStreak}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
      </div>

      {showHeatmap && (
        <Card>
          <CardHeader>
            <CardTitle>Yearly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <HabitHeatmap habits={habits} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onUpdate={handleHabitUpdate}
            onDelete={handleHabitDelete}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {habits.length === 0 && !archived && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No habits yet</h3>
          <p className="text-muted-foreground mt-2">Start building better habits by creating your first one.</p>
          <Button onClick={handleAddHabit} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create Habit
          </Button>
        </div>
      )}

      {habits.length === 0 && archived && (
        <div className="text-center py-12">
          <Archive className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No archived habits</h3>
          <p className="text-muted-foreground mt-2">Archived habits will appear here.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <HabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
        initialData={editingHabit
          ? {
              name: editingHabit.name,
              description: editingHabit.description ?? undefined,
              frequency: editingHabit.frequency,
              targetCount: editingHabit.targetCount,
              unit: editingHabit.unit,
              color: editingHabit.color,
              icon: editingHabit.icon ?? undefined,
              reminderTime: editingHabit.reminderTime ?? undefined,
              reminderDays: editingHabit.reminderDays as ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[],
            }
          : undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}