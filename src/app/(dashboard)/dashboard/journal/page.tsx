'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Plus, Filter, Calendar, Grid, Flame } from 'lucide-react'
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
import { JournalHeatmap } from '@/components/journal/journal-heatmap'
import { JournalDialog } from '@/components/journal/journal-dialog'
import { JournalListView } from '@/components/journal/journal-list-view'
import { JournalEntry } from '@/types'
import { JournalEntryCreateInput, JournalEntryUpdateInput } from '@/lib/validations/journal'
import { toast } from '@/hooks/use-toast'

interface JournalResponse {
  data: JournalEntry[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

async function fetchJournalEntries(params?: URLSearchParams): Promise<JournalResponse> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const queryString = params ? `?${params.toString()}` : ''
  const response = await fetch(`/api/journal${queryString}`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch journal entries')
  }

  return response.json()
}

async function createJournalEntry(data: JournalEntryCreateInput): Promise<JournalEntry> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch('/api/journal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create journal entry')
  }

  return response.json()
}

async function updateJournalEntry(id: string, data: JournalEntryUpdateInput): Promise<JournalEntry> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/journal/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update journal entry')
  }

  return response.json()
}

async function deleteJournalEntry(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/journal/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete journal entry')
  }
}

export default function JournalPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [filterMood, setFilterMood] = useState('')

  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  params.append('sortBy', 'date')
  params.append('sortOrder', 'desc')
  if (filterMood) params.append('mood', filterMood)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['journal', params.toString()],
    queryFn: () => fetchJournalEntries(params),
  })

  const entries = data?.data || []
  const totalEntries = data?.meta.total || 0
  const totalPages = data?.meta.totalPages || 1

  const createMutation = useMutation({
    mutationFn: createJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Journal entry created successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create entry', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: JournalEntryUpdateInput }) => updateJournalEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Journal entry updated successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update entry', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Journal entry deleted' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete entry', description: error.message, variant: 'destructive' })
    },
  })

  const handleEntryDelete = useCallback((entryId: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      deleteMutation.mutate(entryId)
    }
  }, [deleteMutation])

  const handleAddEntry = useCallback(() => {
    setEditingEntry(null)
    setDialogOpen(true)
  }, [])

  const handleEdit = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry)
    setDialogOpen(true)
  }, [])

  const handleDialogSubmit = useCallback(async (entryData: JournalEntryCreateInput) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data: entryData })
    } else {
      await createMutation.mutateAsync(entryData)
    }
    setEditingEntry(null)
    setDialogOpen(false)
  }, [editingEntry, createMutation, updateMutation])

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
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-1" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="capitalize animate-pulse h-5 w-20 bg-muted rounded" />
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
        <p>Failed to load journal entries. Please try again.</p>
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
            <BookOpen className="h-8 w-8 text-amber-500" />
            Journal
          </h1>
          <p className="text-muted-foreground mt-1">
            {totalEntries} entr{totalEntries !== 1 ? 'ies' : 'y'} total
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
            <TooltipContent>Writing Heatmap</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'calendar' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('calendar')}
                className="h-10 w-10"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Calendar View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('list')}
                className="h-10 w-10"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grid View</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterMood('')}>All Moods</DropdownMenuItem>
              <DropdownMenuSeparator />
              {['VERY_HAPPY', 'HAPPY', 'NEUTRAL', 'SAD', 'VERY_SAD', 'ANXIOUS', 'EXCITED', 'TIRED', 'STRESSED', 'GRATEFUL'].map((mood) => (
                <DropdownMenuItem key={mood} onClick={() => setFilterMood(mood)}>
                  {mood.replace(/_/g, ' ')}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAddEntry}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entries.filter(e => {
                const entryDate = new Date(e.date)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return entryDate >= weekAgo
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Entries this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {(() => {
                let streak = 0
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const entriesByDate = new Map(entries.map(e => [new Date(e.date).toISOString().split('T')[0], e]))
                
                for (let i = 0; i < 365; i++) {
                  const checkDate = new Date(today)
                  checkDate.setDate(checkDate.getDate() - i)
                  const dateStr = checkDate.toISOString().split('T')[0]
                  if (entriesByDate.has(dateStr)) {
                    streak++
                  } else if (i === 0) {
                    streak = 0
                  } else {
                    break
                  }
                }
                return streak
              })()}
            </div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
      </div>

      {showHeatmap && (
        <Card>
          <CardHeader>
            <CardTitle>Writing Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <JournalHeatmap entries={entries} />
          </CardContent>
        </Card>
      )}

      <JournalListView
        entries={entries}
        onEdit={handleEdit}
        onDelete={handleEntryDelete}
        isLoading={isLoading}
        view={view}
        onViewChange={setView}
      />

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

      <JournalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
        initialData={editingEntry
          ? {
              title: editingEntry.title ?? undefined,
              content: editingEntry.content,
              mood: editingEntry.mood ?? undefined,
              moodScore: editingEntry.moodScore ?? undefined,
              tags: editingEntry.tags,
              date: editingEntry.date instanceof Date ? editingEntry.date.toISOString().split('T')[0] : editingEntry.date,
            }
          : undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}