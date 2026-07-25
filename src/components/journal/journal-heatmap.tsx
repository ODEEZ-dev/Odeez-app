'use client'

import { format, startOfYear, endOfYear, eachDayOfInterval, isToday } from 'date-fns'
import { Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { JournalEntry } from '@/types'

const COLORS = ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32', '#1b5e20']
const DARK_COLORS = ['#1a2e1a', '#1f3a1f', '#254525', '#2b512b', '#315c31', '#386738', '#3e733e', '#447e44', '#4a8a4a', '#509550']

interface JournalHeatmapProps {
  entries: JournalEntry[]
  className?: string
}

function getColorForCount(count: number, isDark: boolean) {
  const colors = isDark ? DARK_COLORS : COLORS
  if (count === 0) return isDark ? '#1e1e1e' : '#f5f5f5'
  const index = Math.min(Math.floor(count / 2), colors.length - 1)
  return colors[index]
}

export function JournalHeatmap({ entries, className }: JournalHeatmapProps) {
  const now = new Date()
  const yearStart = startOfYear(now)
  const yearEnd = endOfYear(now)
  const days = eachDayOfInterval({ start: yearStart, end: yearEnd })

  const firstDayOfWeek = yearStart.getDay()
  const weeksInYear = Math.ceil((days.length + firstDayOfWeek) / 7)

  const entriesByDate = new Map<string, number>()
  entries.forEach(entry => {
    const dateStr = format(new Date(entry.date), 'yyyy-MM-dd')
    entriesByDate.set(dateStr, (entriesByDate.get(dateStr) || 0) + 1)
  })

  const totalEntries = entries.length
  const currentStreak = (() => {
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = format(checkDate, 'yyyy-MM-dd')
      if (entriesByDate.has(dateStr)) {
        streak++
      } else if (i === 0) {
        streak = 0
      } else {
        break
      }
    }
    return streak
  })()

  const longestStreak = (() => {
    let maxStreak = 0
    let current = 0
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    if (sortedEntries.length === 0) return 0

    let lastDate: Date | null = null
    sortedEntries.forEach(entry => {
      const entryDate = new Date(entry.date)
      entryDate.setHours(0, 0, 0, 0)
      
      if (lastDate) {
        const diffDays = Math.round((entryDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          current++
          maxStreak = Math.max(maxStreak, current)
        } else if (diffDays > 1) {
          current = 1
        }
      } else {
        current = 1
        maxStreak = 1
      }
      lastDate = entryDate
    })
    return maxStreak
  })()

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Writing Activity
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="h-5 px-2">Total: {totalEntries}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Less</span>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded"
                    style={{ backgroundColor: getColorForCount(i * 2, isDark) }}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">More</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="border-collapse" role="img" aria-label="Journal writing activity heatmap">
              <tbody>
                {Array.from({ length: 7 }, (_, row) => (
                  <tr key={row}>
                    {row === 0 && (
                      <td className="text-right pr-2 text-xs text-muted-foreground font-medium align-top">
                        {format(yearStart, 'MMM')}
                      </td>
                    )}
                    {Array.from({ length: weeksInYear }, (_, col) => {
                      const dayIndex = col * 7 + row - firstDayOfWeek
                      if (dayIndex < 0 || dayIndex >= days.length) {
                        return <td key={`${row}-${col}`} className="w-5 h-5" />
                      }
                      const day = days[dayIndex]
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const count = entriesByDate.get(dateStr) || 0
                      const hasEntry = count > 0
                      const isTodayDate = isToday(day)

                      const monthStart = day.getDate() === 1
                      const showMonthLabel = row === 0 && monthStart

                      return (
                        <td key={`${row}-${col}`} className="relative">
                          {showMonthLabel && (
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium white-space-nowrap">
                              {format(day, 'MMM')}
                            </div>
                          )}
                          <button
                            className={cn(
                              'w-5 h-5 rounded transition-colors',
                              isTodayDate && 'ring-2 ring-primary',
                              hasEntry ? '' : 'hover:bg-muted'
                            )}
                            style={{ backgroundColor: getColorForCount(count, isDark) }}
                            onClick={() => {}}
                            aria-label={`${format(day, 'MMMM d, yyyy')}: ${count} entr${count !== 1 ? 'ies' : 'y'}`}
                            disabled={!hasEntry}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold text-orange-500">{currentStreak} days</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Longest Streak</p>
              <p className="text-2xl font-bold text-amber-500">{longestStreak} days</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}