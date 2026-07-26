'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn, numberValueAs } from '@/lib/utils'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { budgetCreateSchema, BudgetCreateInput } from '@/lib/validations/finance'

interface BudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: BudgetCreateInput) => Promise<void>
  initialData?: Partial<BudgetCreateInput> | null
  isLoading?: boolean
}

const PERIOD_OPTIONS = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
] as const

export function BudgetDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: BudgetDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetCreateInput>({
    resolver: zodResolver(budgetCreateSchema),
    defaultValues: {
      name: '',
      category: '',
      amount: 0,
      currency: 'USD',
      period: 'MONTHLY',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: undefined,
      alertThreshold: 80,
    },
  })

  useEffect(() => {
    if (open && initialData) {
      const start = initialData.startDate ? parseISO(initialData.startDate) : undefined
      const end = initialData.endDate ? parseISO(initialData.endDate) : undefined
      reset({
        name: initialData.name || '',
        category: initialData.category || '',
        amount: initialData.amount || 0,
        currency: initialData.currency || 'USD',
        period: initialData.period || 'MONTHLY',
        startDate: initialData.startDate || format(new Date(), 'yyyy-MM-dd'),
        endDate: initialData.endDate || undefined,
        alertThreshold: initialData.alertThreshold || 80,
      })
      setStartDate(start)
      setEndDate(end)
    } else if (open && !initialData) {
      reset()
      setStartDate(undefined)
      setEndDate(undefined)
    }
  }, [open, initialData, reset])

  const onFormSubmit = async (data: BudgetCreateInput) => {
    const submitData = {
      ...data,
      amount: Number(data.amount),
      startDate: startDate ? startDate.toISOString().split('T')[0] : data.startDate,
      endDate: endDate ? endDate.toISOString().split('T')[0] : (data.endDate || null),
      alertThreshold: Number(data.alertThreshold),
    }
    await onSubmit(submitData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Budget' : 'New Budget'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Monthly Groceries"
              {...register('name')}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              placeholder="e.g., Food, Transportation"
              {...register('category')}
              className={cn(errors.category && 'border-destructive')}
            />
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
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
            <Label>Period</Label>
            <Select
              value={watch('period') || 'MONTHLY'}
              onValueChange={(v) => setValue('period', v as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal h-10', errors.startDate && 'border-destructive')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date)
                      setValue('startDate', date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
              <input type="hidden" {...register('startDate')} value={startDate ? format(startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')} />
            </div>

            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-10"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'No end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date)
                      setValue('endDate', date ? format(date, 'yyyy-MM-dd') : undefined)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input type="hidden" {...register('endDate')} value={endDate ? format(endDate, 'yyyy-MM-dd') : ''} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
            <Input
              id="alertThreshold"
              type="number"
              min="1"
              max="100"
              step="1"
              {...register('alertThreshold', { setValueAs: numberValueAs })}
            />
            <p className="text-xs text-muted-foreground">
              Get notified when spending reaches this percentage of your budget
            </p>
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