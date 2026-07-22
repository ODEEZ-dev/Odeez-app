'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Calendar, Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn, numberValueAs } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { taskCreateSchema, TaskCreateInput } from '@/lib/validations/task'
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '@/types'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TaskCreateInput) => Promise<void>
  initialData?: Partial<TaskCreateInput> | null
  isLoading?: boolean
}

export function TaskDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: TaskDialogProps) {
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [tags, setTags] = useState<Array<{ name: string; color: string }>>([])
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3B82F6')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskCreateInput>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: undefined,
      startDate: undefined,
      projectId: undefined,
      sectionId: undefined,
      parentId: undefined,
      recurringRule: undefined,
      estimatedMinutes: undefined,
      tags: [],
    },
  })

  useEffect(() => {
    if (open && initialData) {
      const dueDate = initialData.dueDate ? parseISO(initialData.dueDate) : undefined
      const startDate = initialData.startDate ? parseISO(initialData.startDate) : undefined
      reset({
        title: initialData.title || '',
        description: initialData.description || '',
        status: initialData.status || 'TODO',
        priority: initialData.priority || 'MEDIUM',
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        startDate: startDate ? startDate.toISOString() : undefined,
        projectId: initialData.projectId,
        sectionId: initialData.sectionId,
        parentId: initialData.parentId,
        recurringRule: initialData.recurringRule,
        estimatedMinutes: initialData.estimatedMinutes,
        tags: initialData.tags || [],
      })
      setDueDate(dueDate)
      setStartDate(startDate)
      setTags((initialData.tags || []).map(t => ({ ...t, color: t.color || '#3B82F6' })))
    } else if (open && !initialData) {
      reset()
      setDueDate(undefined)
      setStartDate(undefined)
      setTags([])
    }
  }, [open, initialData, reset])

  const handleAddTag = () => {
    if (newTagName.trim()) {
      setTags([...tags, { name: newTagName.trim(), color: newTagColor }])
      setNewTagName('')
    }
  }

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const onFormSubmit = async (data: TaskCreateInput) => {
    const submitData = {
      ...data,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      startDate: startDate ? startDate.toISOString() : undefined,
      tags,
    }
    await onSubmit(submitData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              {...register('title')}
              className={cn(errors.title && 'border-destructive')}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details..."
              {...register('description')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch('status') || 'TODO'}
                onValueChange={(v) => setValue('status', v as TaskCreateInput['status'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={watch('priority') || 'MEDIUM'}
                onValueChange={(v) => setValue('priority', v as TaskCreateInput['priority'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: opt.color }}
                        />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-10"
                    disabled={isLoading}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dueDate
                      ? format(dueDate, 'MMM d, yyyy')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
<PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => setDueDate(date)}
                      initialFocus
                      showOutsideDays
                      numberOfMonths={2}
                    />
                  </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-10"
                    disabled={isLoading}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate
                      ? format(startDate, 'MMM d, yyyy')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
<PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => setStartDate(date)}
                      initialFocus
                      showOutsideDays
                      numberOfMonths={2}
                    />
                  </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estimated Time (minutes)</Label>
              <Input
                type="number"
                placeholder="e.g., 60"
                {...register('estimatedMinutes', { setValueAs: numberValueAs })}
              />
            </div>

            <div className="space-y-2">
              <Label>Recurring Rule</Label>
              <Input
                placeholder="RRULE:FREQ=DAILY"
                {...register('recurringRule')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="gap-1"
                  style={{
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                    borderColor: tag.color,
                  }}
                >
                  {tag.name}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => handleRemoveTag(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="w-32"
                />
                <Input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-8 h-8 p-0"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddTag}
                  disabled={!newTagName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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