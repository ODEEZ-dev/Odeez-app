'use client'

import { useState } from 'react'
import { Check, MoreVertical, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Habit } from '@/types'

interface HabitListViewProps {
  habits: Habit[]
  onHabitUpdate: (habit: Habit) => void
  onHabitDelete: (habitId: string) => void
  onHabitToggleComplete: (habit: Habit) => void
  onHabitEdit: (habit: Habit) => void
  isLoading?: boolean
}

const FREQUENCY_LABELS = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  CUSTOM: 'Custom',
} as const

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function HabitListView({
  habits,
  onHabitUpdate,
  onHabitDelete,
  onHabitToggleComplete,
  onHabitEdit,
  isLoading,
}: HabitListViewProps) {
  const [expandedHabits, setExpandedHabits] = useState<Set<string>>(new Set())
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfCurrentMonth = startOfMonth(today)
  const endOfCurrentMonth = endOfMonth(today)
  const daysInMonth = eachDayOfInterval({ start: startOfCurrentMonth, end: endOfCurrentMonth })

  const getDayColor = (habit: Habit, date: Date) => {
    const log = habit.logs?.find((l) => isSameDay(l.date, date))
    if (!log) return 'bg-muted'
    if (log.count >= habit.targetCount) return `bg-[${habit.color}]`
    return `bg-[${habit.color}]/30`
  }

  const getDayTooltip = (habit: Habit, date: Date) => {
    const log = habit.logs?.find((l) => isSameDay(l.date, date))
    if (!log) return 'No entry'
    return `${log.count} / ${habit.targetCount} ${habit.unit}${log.notes ? ` - ${log.notes}` : ''}`
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse ml-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No habits yet. Create your first habit!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {habits.map((habit) => {
        const isExpanded = expandedHabits.has(habit.id)
        const todayCount = habit.logs?.find((l) => isSameDay(l.date, today))?.count || 0
        const completedToday = todayCount >= habit.targetCount
        const progress = Math.min(100, Math.round((todayCount / habit.targetCount) * 100))

        return (
          <Card key={habit.id} className="overflow-hidden transition-all hover:shadow-md">
            <div className="absolute top-0 left-0 h-full w-1" style={{ backgroundColor: habit.color }} />
            
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">{habit.name}</h3>
                    {habit.icon && <span className="text-xl">{habit.icon}</span>}
                    {habit.archived && (
                      <Badge variant="secondary" className="ml-auto">Archived</Badge>
                    )}
                  </div>
                  {habit.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{habit.description}</p>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onHabitEdit(habit)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onHabitToggleComplete(habit)}>
                      <Check className="h-4 w-4 mr-2" />
                      {completedToday ? 'Mark Incomplete' : 'Mark Complete'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this habit?')) {
                          onHabitDelete(habit.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onHabitUpdate({ ...habit, archived: !habit.archived })}
                    >
                      {habit.archived ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Unarchive
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Archive
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{todayCount}</span>
                    <span className="text-sm text-muted-foreground">/ {habit.targetCount} {habit.unit}</span>
                  </div>
                  <Progress value={progress} className="h-2 flex-1 max-w-xs" color={habit.color} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-orange-500">{habit.streak || 0}</span>
                  <span className="text-sm text-muted-foreground">day streak</span>
                </div>
                <Badge variant={completedToday ? 'default' : 'secondary'} className="gap-1">
                  {completedToday ? (
                    <>
                      <Check className="h-3 w-3" />
                      Done
                    </>
                  ) : (
                    <>
                      <span className="h-3 w-3" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-3">
                <span className="flex items-center gap-1">
                  <span>{FREQUENCY_LABELS[habit.frequency as keyof typeof FREQUENCY_LABELS] || habit.frequency}</span>
                </span>
                <span className="flex items-center gap-1">
                  Best: {habit.longestStreak || 0}
                </span>
                <span className="flex items-center gap-1">
                  {habit.completionRate || 0}% completion
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 gap-2"
                onClick={() => setExpandedHabits((prev) => {
                  const next = new Set(prev)
                  if (isExpanded) next.delete(habit.id)
                  else next.add(habit.id)
                  return next
                })}
              >
                <span>Calendar</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {isExpanded && (
                <div className="mt-3 animate-in fade-in">
                  <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
                    {DAYS.map((day) => <div key={day}>{day}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {daysInMonth.map((day) => (
                      <Tooltip key={day.toISOString()}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors',
                              isSameDay(day, today) ? 'ring-2 ring-primary' : '',
                              isPast(day) ? getDayColor(habit, day) : 'bg-muted/50 text-muted-foreground/50'
                            )}
                            style={{ width: '32px', height: '32px', fontSize: '10px' }}
                          >
                            {format(day, 'd')}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start">
                          <div className="text-xs">
                            <p className="font-medium">{format(day, 'MMM d, yyyy')}</p>
                            <p>{getDayTooltip(habit, day)}</p>
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
      })}
    </div>
  )
}

function isPast(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() <= today.getTime()
}