'use client'

import { format, isSameDay, startOfDay } from 'date-fns'
import { Calendar, MapPin, Clock, MoreVertical, Edit, Copy, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CalendarEvent } from '@/types'
import { cn } from '@/lib/utils'

interface CalendarEventCardProps {
  event: CalendarEvent
  onEdit: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
  onCopy: (event: CalendarEvent) => void
  selectedDate?: Date
}

export function CalendarEventCard({
  event,
  onEdit,
  onDelete,
  onCopy,
  selectedDate,
}: CalendarEventCardProps) {
  const isAllDay = event.allDay
  const startTime = new Date(event.startTime)
  const endTime = new Date(event.endTime)
  const isSelectedDate = selectedDate && isSameDay(startOfDay(new Date(event.startTime)), startOfDay(selectedDate))

  const timeString = isAllDay
    ? 'All day'
    : `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`

  const isMultiDay = !isSameDay(startTime, endTime)

  return (
    <Card
      className={cn(
        'group rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent/30 hover:shadow-md cursor-pointer',
        isSelectedDate && 'ring-2 ring-primary/50'
      )}
      onClick={() => onEdit(event)}
    >
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full flex-shrink-0 mt-1.5"
              style={{ backgroundColor: event.color ?? '#3B82F6' }}
            />
            <h3 className="font-semibold text-sm line-clamp-1">{event.title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="sr-only">More options</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(event)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopy(event)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(event.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 mb-2">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {isMultiDay
              ? `${format(startTime, 'MMM d')} - ${format(endTime, 'MMM d')}`
              : format(startTime, 'MMM d, yyyy')}
          </span>
          {!isAllDay && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeString}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 line-clamp-1">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {event.description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
