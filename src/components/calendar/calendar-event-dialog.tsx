'use client'

import { useState, useCallback, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarEventCreateInput, CalendarEventUpdateInput } from '@/lib/validations/calendar'
import { cn } from '@/lib/utils'

interface CalendarEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CalendarEventCreateInput | CalendarEventUpdateInput) => Promise<void>
  initialData?: CalendarEventCreateInput
  isLoading?: boolean
}

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#EAB308',
]

export function CalendarEventDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: CalendarEventDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [startTime, setStartTime] = useState(initialData?.startTime || new Date().toISOString().slice(0, 16))
  const [endTime, setEndTime] = useState(initialData?.endTime || new Date(Date.now() + 3600000).toISOString().slice(0, 16))
  const [allDay, setAllDay] = useState(initialData?.allDay || false)
  const [location, setLocation] = useState(initialData?.location || '')
  const [color, setColor] = useState(initialData?.color || '#3B82F6')
  const [recurringRule, setRecurringRule] = useState(initialData?.recurringRule || '')
  const [rrule, setRrule] = useState(initialData?.rrule || '')

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setDescription(initialData.description || '')
      setStartTime(initialData.startTime || new Date().toISOString().slice(0, 16))
      setEndTime(initialData.endTime || new Date(Date.now() + 3600000).toISOString().slice(0, 16))
      setAllDay(initialData.allDay || false)
      setLocation(initialData.location || '')
      setColor(initialData.color || '#3B82F6')
      setRecurringRule(initialData.recurringRule || '')
      setRrule(initialData.rrule || '')
    } else {
      setTitle('')
      setDescription('')
      setStartTime(new Date().toISOString().slice(0, 16))
      setEndTime(new Date(Date.now() + 3600000).toISOString().slice(0, 16))
      setAllDay(false)
      setLocation('')
      setColor('#3B82F6')
      setRecurringRule('')
      setRrule('')
    }
  }, [initialData, open])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const data: CalendarEventCreateInput | CalendarEventUpdateInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      allDay,
      location: location.trim() || undefined,
      color,
      recurringRule: recurringRule || undefined,
      rrule: rrule || undefined,
    }

    await onSubmit(data)
  }, [title, description, startTime, endTime, allDay, location, color, recurringRule, rrule, onSubmit])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-4">
            <DialogTitle>{initialData ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                className="text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={allDay}
                  onCheckedChange={(checked) => setAllDay(checked as boolean)}
                />
                <span className="text-sm">All day</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-8 w-8 rounded-lg border-2 transition-all',
                      color === c ? 'border-primary scale-110' : 'border-transparent hover:border-muted'
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                    aria-pressed={color === c}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurringRule">Recurrence Rule (RRULE)</Label>
              <Input
                id="recurringRule"
                value={recurringRule}
                onChange={(e) => setRecurringRule(e.target.value)}
                placeholder="e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR"
              />
              <p className="text-xs text-muted-foreground">
                Use standard RRULE format. Leave empty for non-recurring events.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
