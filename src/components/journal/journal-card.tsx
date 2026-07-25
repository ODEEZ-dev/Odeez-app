'use client'

import { format, isToday as isTodayFn, isYesterday } from 'date-fns'
import { Calendar, Tag, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Mood } from '@/types'
import { JournalEntry } from '@/types'

const moodIcons: Record<Mood, string> = {
  VERY_HAPPY: '😄',
  HAPPY: '😊',
  NEUTRAL: '😐',
  SAD: '😔',
  VERY_SAD: '😭',
  ANXIOUS: '😰',
  EXCITED: '🤩',
  TIRED: '😴',
  STRESSED: '😤',
  GRATEFUL: '🙏',
}

interface JournalCardProps {
  entry: JournalEntry
  onEdit: (entry: JournalEntry) => void
  onDelete: (id: string) => void
}

export function JournalCard({ entry, onEdit, onDelete }: JournalCardProps) {
  const entryDate = new Date(entry.date)
  const dateLabel = isTodayFn(entryDate)
    ? 'Today'
    : isYesterday(entryDate)
    ? 'Yesterday'
    : format(entryDate, 'MMMM d, yyyy')

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {entry.title && <h3 className="font-semibold text-lg truncate">{entry.title}</h3>}
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{dateLabel}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(entry)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(entry.id)} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="prose prose-sm max-w-none text-muted-foreground line-clamp-3">
          {entry.content}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          {entry.mood && (
            <div className="flex items-center gap-1" title={entry.mood.replace(/_/g, ' ')}>
              <span className="text-lg">{moodIcons[entry.mood] || '📝'}</span>
              <span className="text-sm capitalize">{entry.mood.toLowerCase().replace(/_/g, ' ')}</span>
            </div>
          )}
          {entry.moodScore && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Mood: {entry.moodScore}/10</span>
            </div>
          )}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-auto">
              {entry.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
              {entry.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{entry.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface JournalCalendarDayProps {
  date: Date
  entry: JournalEntry | null
  selected: boolean
  onSelect: (date: Date) => void
  today: Date
}

export function JournalCalendarDay({ date, entry, selected, onSelect, today }: JournalCalendarDayProps) {
  const isCurrentMonth = date.getMonth() === today.getMonth()
  const isTodayDate = isTodayFn(date)
  const hasEntry = !!entry

  return (
    <button
      onClick={() => onSelect(date)}
      className={cn(
        'relative aspect-square flex flex-col items-center justify-center p-1 text-sm transition-colors',
        'rounded-lg border',
        !isCurrentMonth && 'text-muted-foreground/30',
        isCurrentMonth && 'hover:bg-accent',
        isTodayDate && 'border-primary font-medium',
        selected && 'bg-primary text-primary-foreground border-primary',
        hasEntry && !selected && 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
      )}
      disabled={!isCurrentMonth}
      aria-current={isTodayDate && isCurrentMonth ? 'date' : undefined}
    >
      <span className={cn('font-medium', isTodayDate && 'text-primary')}>
        {date.getDate()}
      </span>
      {hasEntry && (
        <span className={cn(
          'absolute bottom-1 w-1.5 h-1.5 rounded-full',
          selected ? 'bg-primary-foreground' : 'bg-green-500'
        )} />
      )}
    </button>
  )
}