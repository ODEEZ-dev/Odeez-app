'use client'

import { useState, useCallback, useMemo } from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameDay, isToday, format } from 'date-fns'
import { ChevronLeft, ChevronRight, BookOpen, Search, Filter, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { JournalCard, JournalCalendarDay } from './journal-card'
import { JournalEntry } from '@/types'
import { MOOD_OPTIONS, Mood } from '@/types'

interface JournalListViewProps {
  entries: JournalEntry[]
  onEdit: (entry: JournalEntry) => void
  onDelete: (id: string) => void
  isLoading?: boolean
  view?: 'list' | 'calendar'
  onViewChange?: (view: 'list' | 'calendar') => void
}

export function JournalListView({
  entries,
  onEdit,
  onDelete,
  isLoading,
  view = 'list',
  onViewChange,
}: JournalListViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMood, setFilterMood] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch = !searchQuery ||
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesMood = !filterMood || entry.mood === filterMood

      return matchesSearch && matchesMood
    })
  }, [entries, searchQuery, filterMood])

  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry>()
    filteredEntries.forEach((entry) => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0]
      if (!map.has(dateKey)) {
        map.set(dateKey, entry)
      }
    })
    return map
  }, [filteredEntries])

  const getEntryForDate = useCallback((date: Date) => {
    const dateKey = date.toISOString().split('T')[0]
    return entriesByDate.get(dateKey) || null
  }, [entriesByDate])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'calendar') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          {days.map((day) => (
            <JournalCalendarDay
              key={day.toISOString()}
              date={day}
              entry={getEntryForDate(day)}
              selected={isSameDay(day, selectedDate)}
              onSelect={setSelectedDate}
              today={new Date()}
            />
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getEntryForDate(selectedDate) ? (
              <JournalCard
                entry={getEntryForDate(selectedDate)!}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No entry for this day</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterMood} onValueChange={setFilterMood}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All moods</SelectItem>
              {MOOD_OPTIONS.map((mood) => (
                <SelectItem key={mood.value} value={mood.value}>
                  <span className="flex items-center gap-2">
                    <span role="img">{mood.emoji}</span>
                    {mood.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {view && onViewChange && (
            <Button variant="outline" size="icon" onClick={() => onViewChange('calendar')}>
              <Calendar className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-1">No journal entries</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterMood ? 'Try adjusting your search or filters.' : 'Start writing your first journal entry!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => (
            <JournalCard
              key={entry.id}
              entry={entry}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}