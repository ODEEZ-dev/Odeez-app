'use client'

import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Habit, HabitEntry } from '@/types'

interface HabitHeatmapProps {
  habits: (Habit & {
    logs: HabitEntry[]
  })[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function HabitHeatmap({ habits }: HabitHeatmapProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfCurrentYear = startOfYear(today)
  const endOfCurrentYear = endOfYear(today)
  const daysInYear = eachDayOfInterval({ start: startOfCurrentYear, end: endOfCurrentYear })

  const getDayColor = (date: Date) => {
    let totalTarget = 0
    let completed = 0
    let partial = 0

    for (const habit of habits) {
      if (habit.archived) continue
      const log = habit.logs?.find((l) => isSameDay(l.date, date))
      if (log) {
        totalTarget += habit.targetCount
        if (log.count >= habit.targetCount) {
          completed++
        } else if (log.count > 0) {
          partial++
        }
      }
    }

    if (totalTarget === 0) return 'bg-muted'

    if (completed > 0 && completed === habits.filter((h) => !h.archived).length) {
      return 'bg-green-500'
    }
    if (completed > 0) {
      return 'bg-green-400'
    }
    if (partial > 0) {
      return 'bg-green-200'
    }
    return 'bg-muted'
  }

  const getDayTooltip = (date: Date) => {
    const entries: string[] = []
    for (const habit of habits) {
      if (habit.archived) continue
      const log = habit.logs?.find((l) => isSameDay(l.date, date))
      if (log) {
        entries.push(`${habit.name}: ${log.count}/${habit.targetCount} ${habit.unit}`)
      }
    }
    if (entries.length === 0) return 'No habits tracked'
    return entries.join('\n')
  }

  const weeks: (Date | null)[][] = []
  let currentWeek: (Date | null)[] = new Array(startOfCurrentYear.getDay()).fill(null)

  for (const day of daysInYear) {
    if (day.getDay() === 0 && currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null)
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(day)
  }

  while (currentWeek.length < 7) currentWeek.push(null)
  if (currentWeek.some((d) => d !== null)) {
    weeks.push(currentWeek)
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse" role="img" aria-label="Yearly habit activity heatmap">
        <thead>
          <tr>
            <th className="text-right pr-2 align-bottom font-medium text-xs text-muted-foreground" style={{ width: '30px' }}>
              {DAYS.map((d) => d[0]).join(' ')}
            </th>
            {MONTHS.map((month, monthIndex) => {
              const firstDayOfMonth = new Date(today.getFullYear(), monthIndex, 1)
              const weekIndex = weeks.findIndex((week) =>
                week.some((d) => d && isSameDay(d, firstDayOfMonth))
              )
              return (
                <th key={month} className="text-center font-medium text-xs text-muted-foreground" style={{ width: `${weeks.length / 12 * 100}%` }}>
                  {weekIndex >= 0 ? month : ''}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-right pr-2 align-bottom font-mono text-xs text-muted-foreground">
              {DAYS.map((_, i) => i % 2 === 0 ? DAYS[i][0] : '').join(' ')}
            </td>
            {weeks.map((week, weekIndex) => (
              <td key={weekIndex} className="relative" style={{ width: `${100 / weeks.length}%` }}>
                <div className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    day ? (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'w-3 h-3 rounded-sm transition-colors',
                              day ? getDayColor(day) : 'bg-transparent',
                              isToday(day) && 'ring-2 ring-primary'
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="max-w-xs p-2">
                          <p className="font-medium text-xs">{day ? format(day, 'MMM d, yyyy') : ''}</p>
                          <p className="text-xs text-muted-foreground mt-1">{day ? getDayTooltip(day) : ''}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div key={dayIndex} className="w-3 h-3 rounded-sm bg-transparent" />
                    )
                  ))}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-green-200" />
            <div className="w-3 h-3 rounded-sm bg-green-400" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
          </div>
          <span>More</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-3 h-3 rounded-sm ring-2 ring-primary" title="Today" />
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}
