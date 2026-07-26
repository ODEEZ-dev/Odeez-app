'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Plus, Filter, ChevronLeft, ChevronRight, LayoutList, CalendarDays } from 'lucide-react'
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
import { CalendarEventDialog } from '@/components/calendar/calendar-event-dialog'
import { CalendarListView } from '@/components/calendar/calendar-list-view'
import { CalendarEvent } from '@/types'
import { CalendarEventCreateInput, CalendarEventUpdateInput } from '@/lib/validations/calendar'
import { toast } from '@/hooks/use-toast'

interface CalendarEventsResponse {
  data: CalendarEvent[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

async function fetchCalendarEvents(params?: URLSearchParams): Promise<CalendarEventsResponse> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const queryString = params ? `?${params.toString()}` : ''
  const response = await fetch(`/api/calendar${queryString}`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch calendar events')
  }

  return response.json()
}

async function createCalendarEvent(data: CalendarEventCreateInput): Promise<CalendarEvent> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch('/api/calendar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create event')
  }

  return response.json()
}

async function updateCalendarEvent(id: string, data: CalendarEventUpdateInput): Promise<CalendarEvent> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/calendar/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update event')
  }

  return response.json()
}

async function deleteCalendarEvent(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/calendar/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete event')
  }
}

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<'day' | 'week' | 'month'>('month')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [page, setPage] = useState(1)
  const [limit] = useState(50)

  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  params.append('sortBy', 'startTime')
  params.append('sortOrder', 'asc')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['calendar', params.toString()],
    queryFn: () => fetchCalendarEvents(params),
  })

  const events = data?.data || []
  const totalEvents = data?.meta.total || 0
  const totalPages = data?.meta.totalPages || 1

  const upcomingEvents = events
    .filter(e => new Date(e.startTime) >= new Date())
    .slice(0, 5)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  const todayEvents = events.filter(e => {
    const today = new Date()
    const eventStart = new Date(e.startTime)
    return eventStart.toDateString() === today.toDateString()
  })

  const createMutation = useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Event created successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create event', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CalendarEventUpdateInput }) => updateCalendarEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Event updated successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update event', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Event deleted' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete event', description: error.message, variant: 'destructive' })
    },
  })

  const handleEventDelete = useCallback((eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteMutation.mutate(eventId)
    }
  }, [deleteMutation])

  const handleAddEvent = useCallback((date?: Date) => {
    setSelectedDate(date || new Date())
    setEditingEvent(null)
    setDialogOpen(true)
  }, [])

  const handleEdit = useCallback((event: CalendarEvent) => {
    setEditingEvent(event)
    setDialogOpen(true)
  }, [])

  const handleDialogSubmit = useCallback(async (eventData: CalendarEventCreateInput | CalendarEventUpdateInput) => {
    if (editingEvent) {
      try {
        await updateMutation.mutateAsync({ id: editingEvent.id, data: eventData })
      } catch (error) {
        return
      }
    } else {
      try {
        await createMutation.mutateAsync(eventData as CalendarEventCreateInput)
      } catch (error) {
        return
      }
    }
    setEditingEvent(null)
    setDialogOpen(false)
  }, [editingEvent, createMutation, updateMutation])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date)
    setPage(1)
  }, [])

  const handleViewChange = useCallback((newView: 'day' | 'week' | 'month') => {
    setView(newView)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="animate-pulse space-y-2">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
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
          <Card>
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
          <Card>
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
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Failed to load events. Please try again.</p>
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
            <Calendar className="h-8 w-8 text-primary" />
            Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            {totalEvents} event{totalEvents !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'day' ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleViewChange('day')}
                className="h-10 w-10"
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Day View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleViewChange('week')}
                className="h-10 w-10"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Week View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleViewChange('month')}
                className="h-10 w-10"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Month View</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedDate(new Date())}>Go to Today</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => handleAddEvent()}>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => handleAddEvent()}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Today's Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{todayEvents.length}</div>
            <p className="text-xs text-muted-foreground">Happening today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">Next 5 events</p>
          </CardContent>
        </Card>
      </div>

      <CalendarListView
        events={events}
        onEdit={handleEdit}
        onDelete={handleEventDelete}
        onCopy={(event) => createMutation.mutate({
          title: `${event.title} (Copy)`,
          description: event.description ?? undefined,
          startTime: new Date(event.startTime).toISOString(),
          endTime: new Date(event.endTime).toISOString(),
          allDay: event.allDay,
          location: event.location ?? undefined,
          color: event.color ?? '#3B82F6',
          recurringRule: event.recurringRule ?? undefined,
          rrule: event.rrule ?? undefined,
        })}
        onAddEvent={handleAddEvent}
        view={view}
        onViewChange={handleViewChange}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        isLoading={isLoading}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
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
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <CalendarEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
        initialData={editingEvent
          ? {
              title: editingEvent.title,
              description: editingEvent.description ?? undefined,
              startTime: new Date(editingEvent.startTime).toISOString().slice(0, 16),
              endTime: new Date(editingEvent.endTime).toISOString().slice(0, 16),
              allDay: editingEvent.allDay,
              location: editingEvent.location ?? undefined,
              color: editingEvent.color ?? '#3B82F6',
              recurringRule: editingEvent.recurringRule ?? undefined,
              rrule: editingEvent.rrule ?? undefined,
            }
          : undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
