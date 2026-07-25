'use client'

import { useState, useCallback, useMemo } from 'react'
import { Filter, Calendar, ChevronLeft, ChevronRight, Plus, Sun, LayoutList } from 'lucide-react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subWeeks, subMonths, startOfDay } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarEventCard } from './calendar-event-card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CalendarEvent } from '@/types'

type CalendarView = 'day' | 'week' | 'month'

interface CalendarListViewProps {
  events: CalendarEvent[]
  onEdit: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
  onCopy: (event: CalendarEvent) => void
  onAddEvent?: (date?: Date) => void
  view?: CalendarView
  onViewChange?: (view: CalendarView) => void
  selectedDate?: Date
  onDateChange?: (date: Date) => void
  isLoading?: boolean
}

export function CalendarListView({
  events,
  onEdit,
  onDelete,
  onCopy,
  onAddEvent,
  view = 'month',
  onViewChange,
  selectedDate = new Date(),
  onDateChange,
  isLoading,
}: CalendarListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const titleMatch = event.title.toLowerCase().includes(query)
        const descMatch = event.description?.toLowerCase().includes(query) || false
        const locationMatch = event.location?.toLowerCase().includes(query) || false
        if (!titleMatch && !descMatch && !locationMatch) return false
      }
      return true
    })
  }, [events, searchQuery])

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    if (!onDateChange) return
    const current = selectedDate
    let newDate: Date
    switch (view) {
      case 'day':
        newDate = direction === 'prev' ? addDays(current, -1) : addDays(current, 1)
        break
      case 'week':
        newDate = direction === 'prev' ? subWeeks(current, 1) : addWeeks(current, 1)
        break
      case 'month':
        newDate = direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
        break
    }
    onDateChange(newDate)
  }, [selectedDate, view, onDateChange])

  const goToToday = useCallback(() => {
    if (onDateChange) onDateChange(new Date())
  }, [onDateChange])

  const getEventsForDate = useCallback((date: Date) => {
    const startOfDate = startOfDay(date)
    return filteredEvents.filter((event) => {
      const eventStart = startOfDay(new Date(event.startTime))
      const eventEnd = startOfDay(new Date(event.endTime))
      return eventStart <= startOfDate && eventEnd >= startOfDate
    })
  }, [filteredEvents])

  const getEventsForWeek = useCallback((date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 })
    return filteredEvents.filter((event) => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      return eventStart <= weekEnd && eventEnd >= weekStart
    })
  }, [filteredEvents])

  const getEventsForMonth = useCallback((date: Date) => {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    return filteredEvents.filter((event) => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      return eventStart <= monthEnd && eventEnd >= monthStart
    })
  }, [filteredEvents])

  const currentEvents = view === 'day' ? getEventsForDate(selectedDate) :
    view === 'week' ? getEventsForWeek(selectedDate) :
    getEventsForMonth(selectedDate)

  const sortedEvents = [...currentEvents].sort((a, b) => {
    if (a.allDay && !b.allDay) return -1
    if (!a.allDay && b.allDay) return 1
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="animate-pulse space-y-2">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-20 w-full bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const getViewTitle = () => {
    switch (view) {
      case 'day':
        return format(selectedDate, 'EEEE, MMMM d, yyyy')
      case 'week': {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 })
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
      }
      case 'month':
        return format(selectedDate, 'MMMM yyyy')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate('prev')} className="h-10 w-10">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToToday} className="h-10 w-10">
            <Sun className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateDate('next')} className="h-10 w-10">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">{getViewTitle()}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-md hidden sm:block">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'day' ? 'default' : 'outline'}
                size="icon"
                onClick={() => onViewChange?.('day')}
                className="h-10 w-10"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Day View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="icon"
                onClick={() => onViewChange?.('week')}
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
                onClick={() => onViewChange?.('month')}
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
              <DropdownMenuItem onClick={() => setSearchQuery('')}>Clear Search</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAddEvent?.(selectedDate)}>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onAddEvent && (
            <Button onClick={() => onAddEvent(selectedDate)}>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          )}
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No events found</h3>
          <p className="text-muted-foreground mt-2">
            {searchQuery
              ? 'Try adjusting your search query.'
              : 'Create your first event to get started.'}
          </p>
          {onAddEvent && (
            <Button onClick={() => onAddEvent(selectedDate)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event) => (
            <CalendarEventCard
              key={event.id}
              event={event}
              onEdit={onEdit}
              onDelete={onDelete}
              onCopy={onCopy}
              selectedDate={selectedDate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
