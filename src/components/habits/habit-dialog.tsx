'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { habitCreateSchema, HabitCreateInput } from '@/lib/validations/habit'
import { HABIT_FREQUENCY_OPTIONS, HabitFrequency } from '@/types'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface HabitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: HabitCreateInput) => Promise<void>
  initialData?: Partial<HabitCreateInput> | null
  isLoading?: boolean
}

export function HabitDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: HabitDialogProps) {
  const [reminderDays, setReminderDays] = useState<("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[]>([...DAYS])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HabitCreateInput>({
    resolver: zodResolver(habitCreateSchema),
    defaultValues: {
      name: '',
      description: '',
      frequency: 'DAILY',
      targetCount: 1,
      unit: 'times',
      color: '#10B981',
      icon: '',
      reminderTime: null,
      reminderDays: [...DAYS],
    },
  })

  useEffect(() => {
    if (open && initialData) {
      reset({
        name: initialData.name || '',
        description: initialData.description || '',
        frequency: initialData.frequency || 'DAILY',
        targetCount: initialData.targetCount || 1,
        unit: initialData.unit || 'times',
        color: initialData.color || '#10B981',
        icon: initialData.icon || '',
        reminderTime: initialData.reminderTime || null,
        reminderDays: (initialData.reminderDays || DAYS) as ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[],
      })
      setReminderDays((initialData.reminderDays || [...DAYS]) as ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[])
    } else if (open && !initialData) {
      reset()
      setReminderDays([...DAYS])
    }
  }, [open, initialData, reset])

  const handleReminderDayToggle = (day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN") => {
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
    setValue('reminderDays', reminderDays.includes(day) 
      ? reminderDays.filter((d) => d !== day) 
      : [...reminderDays, day] as ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[]
    )
  }

  const onFormSubmit = async (data: HabitCreateInput) => {
    const submitData = {
      ...data,
      reminderDays,
    }
    await onSubmit(submitData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Habit' : 'New Habit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Morning exercise"
              {...register('name')}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details about this habit..."
              {...register('description')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={watch('frequency') || 'DAILY'}
                onValueChange={(v) => setValue('frequency', v as HabitFrequency)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                {...register('color')}
                className="h-10 w-full p-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Count</Label>
              <Input
                type="number"
                min="1"
                {...register('targetCount', { valueAsNumber: true })}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                placeholder="times"
                {...register('unit')}
                maxLength={20}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon (emoji)</Label>
            <Input
              placeholder="🏃‍♂️"
              {...register('icon')}
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label>Reminder Time</Label>
            <Input
              type="time"
              {...register('reminderTime')}
            />
          </div>

          <div className="space-y-2">
            <Label>Reminder Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day, index) => (
                <Button
                  key={day}
                  type="button"
                  variant={reminderDays.includes(day) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleReminderDayToggle(day)}
                  className={cn(
                    reminderDays.includes(day) && 'bg-primary text-primary-foreground'
                  )}
                >
                  {DAY_LABELS[index]}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}