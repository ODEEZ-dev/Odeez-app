import { useState } from 'react'
import { Check, MoreVertical, Trash2, Edit, Calendar, Target, Flame, Clock, Archive, ChevronDown, ChevronUp } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isPast } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Habit, HabitEntry } from '@/types'

type HabitWithStats = Habit & {
  logs: HabitEntry[]
  streak: number
  longestStreak: number
  completionRate: number
  completedToday: boolean
  todayCount: number
}

interface HabitCardProps {
  habit: HabitWithStats
  onUpdate: (habit: HabitWithStats) => void
  onDelete: (habitId: string) => void
  onToggleComplete: (habit: HabitWithStats) => void
  onEdit: (habit: HabitWithStats) => void
}

const FREQUENCY_LABELS = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  CUSTOM: 'Custom',
} as const

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function HabitCard({
  habit,
  onUpdate,
  onDelete,
  onToggleComplete,
  onEdit,
}: HabitCardProps) {
  const [showHeatmap, setShowHeatmap] = useState(false)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfCurrentMonth = startOfMonth(today)
  const endOfCurrentMonth = endOfMonth(today)
  const daysInMonth = eachDayOfInterval({ start: startOfCurrentMonth, end: endOfCurrentMonth })

  const getDayColor = (date: Date) => {
    const log = habit.logs.find((l) => isSameDay(l.date, date))
    if (!log) return 'bg-muted'
    if (log.count >= habit.targetCount) return `bg-${habit.color.replace('#', '')}`
    return `bg-${habit.color.replace('#', '')}/30`
  }

  const getDayTooltip = (date: Date) => {
    const log = habit.logs.find((l) => isSameDay(l.date, date))
    if (!log) return 'No entry'
    return `${log.count} / ${habit.targetCount} ${habit.unit}${log.notes ? ` - ${log.notes}` : ''}`
  }

  return (
    <Card className="relative overflow-hidden rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent/30 hover:shadow-md">
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">{habit.name}</h3>
              {habit.icon && <span className="text-xl">{habit.icon}</span>}
            </div>
            {habit.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{habit.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(habit)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleComplete(habit)}>
                <Check className="h-4 w-4 mr-2" />
                {habit.completedToday ? 'Mark Incomplete' : 'Mark Complete'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this habit?')) {
                    onDelete(habit.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onUpdate({ ...habit, archived: !habit.archived })}
              >
                {habit.archived ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Unarchive
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {habit.todayCount} / {habit.targetCount} {habit.unit}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">{habit.streak}</span>
              <span className="text-sm text-muted-foreground">day streak</span>
            </div>
          </div>
          <Badge variant={habit.completedToday ? 'default' : 'secondary'} className="gap-1">
            {habit.completedToday ? (
              <>
                <Check className="h-3 w-3" />
                Done
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                Pending
              </>
            )}
          </Badge>
        </div>

        <Progress value={Math.min(100, Math.round((habit.todayCount / habit.targetCount) * 100))} className="h-2" color={habit.color} />

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {FREQUENCY_LABELS[habit.frequency as keyof typeof FREQUENCY_LABELS] || habit.frequency}
          </span>
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            {habit.completionRate}% completion
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3" />
            Best: {habit.longestStreak}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => setShowHeatmap(!showHeatmap)}
        >
          <Calendar className="h-4 w-4" />
          {showHeatmap ? 'Hide' : 'Show'} Calendar
          {showHeatmap ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {showHeatmap && (
          <div className="space-y-2 animate-in fade-in">
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
              {DAYS.map((day) => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day) => (
                <Tooltip key={day.toISOString()}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors',
                        isSameDay(day, today) ? 'ring-2 ring-primary' : '',
                        isPast(day) ? getDayColor(day) : 'bg-muted/50 text-muted-foreground/50'
                      )}
                      style={{
                        width: '32px',
                        height: '32px',
                        fontSize: '10px',
                      }}
                    >
                      {format(day, 'd')}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <div className="text-xs">
                      <p className="font-medium">{format(day, 'MMM d, yyyy')}</p>
                      <p>{getDayTooltip(day)}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}