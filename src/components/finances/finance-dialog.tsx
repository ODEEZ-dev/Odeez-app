'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn, numberValueAs } from '@/lib/utils'
import { Calendar as CalendarIcon } from 'lucide-react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format, parseISO } from 'date-fns'
import { financeEntryCreateSchema, FinanceEntryCreateInput } from '@/lib/validations/finance'
import { TRANSACTION_TYPE_OPTIONS, FINANCE_CATEGORIES } from '@/types'

interface FinanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FinanceEntryCreateInput) => Promise<void>
  initialData?: Partial<FinanceEntryCreateInput> | null
  isLoading?: boolean
}

export function FinanceDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: FinanceDialogProps) {
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT'>('EXPENSE')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FinanceEntryCreateInput>({
    resolver: zodResolver(financeEntryCreateSchema),
    defaultValues: {
      type: 'EXPENSE',
      amount: 0,
      currency: 'USD',
      category: '',
      subcategory: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      recurring: false,
      recurringRule: '',
      tags: [],
    },
  })

  useEffect(() => {
    if (open && initialData) {
      const date = initialData.date ? parseISO(initialData.date) : undefined
      reset({
        type: initialData.type || 'EXPENSE',
        amount: initialData.amount || 0,
        currency: initialData.currency || 'USD',
        category: initialData.category || '',
        subcategory: initialData.subcategory || '',
        description: initialData.description || '',
        date: initialData.date || format(new Date(), 'yyyy-MM-dd'),
        recurring: initialData.recurring || false,
        recurringRule: initialData.recurringRule || '',
        tags: initialData.tags || [],
      })
      setDueDate(date)
      setSelectedType(initialData.type || 'EXPENSE')
    } else if (open && !initialData) {
      reset()
      setDueDate(undefined)
      setSelectedType('EXPENSE')
    }
  }, [open, initialData, reset])

  const typeOptions = TRANSACTION_TYPE_OPTIONS.map(opt => ({
    value: opt.value,
    label: opt.label,
    color: opt.color,
  }))

  const categories = selectedType 
    ? FINANCE_CATEGORIES[selectedType as keyof typeof FINANCE_CATEGORIES] || []
    : []

  const onFormSubmit = async (data: FinanceEntryCreateInput) => {
    const submitData = {
      ...data,
      amount: Number(data.amount),
      date: dueDate ? dueDate.toISOString().split('T')[0] : data.date,
    }
    await onSubmit(submitData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select
              value={watch('type') || 'EXPENSE'}
              onValueChange={(v) => {
                setValue('type', v as 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT')
                setSelectedType(v as 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT')
                setValue('category', '')
                setValue('subcategory', '')
              }}
            >
              <SelectTrigger className={cn(errors.type && 'border-destructive')}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color }} />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register('amount', { setValueAs: numberValueAs })}
                className={cn(errors.amount && 'border-destructive')}
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                placeholder="USD"
                {...register('currency')}
                maxLength={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={watch('category') || ''}
              onValueChange={(v) => setValue('category', v)}
            >
              <SelectTrigger className={cn(errors.category && 'border-destructive')}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Input
              id="subcategory"
              placeholder="Optional subcategory"
              {...register('subcategory')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details about this transaction..."
              {...register('description')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', errors.date && 'border-destructive')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date)
                      setValue('date', date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
                    }}
                    initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            <input type="hidden" {...register('date')} value={dueDate ? format(dueDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')} />
          </div>

          <div className="space-y-2">
            <Label>Recurring</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('recurring')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span>Make this recurring</span>
              </label>
            </div>
          </div>

          {watch('recurring') && (
            <div className="space-y-2">
              <Label htmlFor="recurringRule">Recurrence Rule (RRULE)</Label>
              <Input
                id="recurringRule"
                placeholder="e.g., FREQ=MONTHLY;BYMONTHDAY=1"
                {...register('recurringRule')}
              />
              <p className="text-xs text-muted-foreground">
                Uses RRULE format. Example: FREQ=MONTHLY;BYMONTHDAY=1 for monthly on the 1st
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="tags"
                placeholder="Add a tag (press Enter)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const currentTags = watch('tags') || []
                    const newTag = e.currentTarget.value.trim()
                    if (newTag && !currentTags.includes(newTag)) {
                      setValue('tags', [...currentTags, newTag])
                      e.currentTarget.value = ''
                    }
                  }
                }}
              />
              {(watch('tags') || []).map((tag, index) => (
                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-sm">
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const currentTags = watch('tags') || []
                      setValue('tags', currentTags.filter((_, i) => i !== index))
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
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