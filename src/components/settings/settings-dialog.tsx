'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { SettingsUpdateInput } from '@/lib/validations/settings'
import { cn } from '@/lib/utils'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SettingsUpdateInput) => Promise<void>
  initialData?: SettingsUpdateInput
  isLoading?: boolean
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'CAD', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
  { code: 'CHF', name: 'Swiss Franc (CHF)' },
  { code: 'CNY', name: 'Chinese Yuan (¥)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
]

const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
const TASK_VIEWS = ['LIST', 'KANBAN', 'CALENDAR'] as const
const CALENDAR_VIEWS = ['DAY', 'WEEK', 'MONTH', 'YEAR'] as const

export function SettingsDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: SettingsDialogProps) {
  const [formData, setFormData] = useState<SettingsUpdateInput>({
    emailNotifications: true,
    pushNotifications: true,
    dailyDigest: false,
    weeklyReport: true,
    defaultTaskPriority: 'MEDIUM',
    defaultTaskView: 'LIST',
    weekStartsOn: 0,
    habitReminderTime: '09:00',
    defaultCurrency: 'USD',
    budgetAlertThreshold: 80,
    calendarView: 'WEEK',
    showWeekends: true,
    profilePublic: false,
    dataSharing: false,
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        emailNotifications: true,
        pushNotifications: true,
        dailyDigest: false,
        weeklyReport: true,
        defaultTaskPriority: 'MEDIUM',
        defaultTaskView: 'LIST',
        weekStartsOn: 0,
        habitReminderTime: '09:00',
        defaultCurrency: 'USD',
        budgetAlertThreshold: 80,
        calendarView: 'WEEK',
        showWeekends: true,
        profilePublic: false,
        dataSharing: false,
      })
    }
  }, [initialData, open])

  const handleChange = useCallback((field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }, [formData, onSubmit])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-4">
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive email updates</p>
                  </div>
                  <Switch
                    checked={formData.emailNotifications ?? true}
                    onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={formData.pushNotifications ?? true}
                    onCheckedChange={(checked) => handleChange('pushNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Digest</Label>
                    <p className="text-xs text-muted-foreground">Receive daily summary email</p>
                  </div>
                  <Switch
                    checked={formData.dailyDigest ?? false}
                    onCheckedChange={(checked) => handleChange('dailyDigest', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Report</Label>
                    <p className="text-xs text-muted-foreground">Receive weekly progress report</p>
                  </div>
                  <Switch
                    checked={formData.weeklyReport ?? true}
                    onCheckedChange={(checked) => handleChange('weeklyReport', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tasks</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="defaultTaskPriority">Default Priority</Label>
                  <Select value={formData.defaultTaskPriority ?? 'MEDIUM'} onValueChange={(v) => handleChange('defaultTaskPriority', v)}>
                    <SelectTrigger id="defaultTaskPriority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultTaskView">Default View</Label>
                  <Select value={formData.defaultTaskView ?? 'LIST'} onValueChange={(v) => handleChange('defaultTaskView', v)}>
                    <SelectTrigger id="defaultTaskView">
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_VIEWS.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekStartsOn">Week Starts On</Label>
                  <Select value={String(formData.weekStartsOn ?? 0)} onValueChange={(v) => handleChange('weekStartsOn', Number(v))}>
                    <SelectTrigger id="weekStartsOn">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Habits</h3>
              <div className="space-y-2">
                <Label htmlFor="habitReminderTime">Daily Reminder Time</Label>
                <Input
                  id="habitReminderTime"
                  type="time"
                  value={formData.habitReminderTime ?? '09:00'}
                  onChange={(e) => handleChange('habitReminderTime', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Finances</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select value={formData.defaultCurrency ?? 'USD'} onValueChange={(v) => handleChange('defaultCurrency', v)}>
                    <SelectTrigger id="defaultCurrency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetAlertThreshold">Budget Alert Threshold (%)</Label>
                  <Input
                    id="budgetAlertThreshold"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.budgetAlertThreshold ?? 80}
                    onChange={(e) => handleChange('budgetAlertThreshold', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Calendar</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="calendarView">Default View</Label>
                  <Select value={formData.calendarView ?? 'WEEK'} onValueChange={(v) => handleChange('calendarView', v)}>
                    <SelectTrigger id="calendarView">
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent>
                      {CALENDAR_VIEWS.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Weekends</Label>
                    <p className="text-xs text-muted-foreground">Display weekends in calendar</p>
                  </div>
                  <Switch
                    checked={formData.showWeekends ?? true}
                    onCheckedChange={(checked) => handleChange('showWeekends', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Privacy</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Profile</Label>
                    <p className="text-xs text-muted-foreground">Allow others to see your profile</p>
                  </div>
                  <Switch
                    checked={formData.profilePublic ?? false}
                    onCheckedChange={(checked) => handleChange('profilePublic', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Sharing</Label>
                    <p className="text-xs text-muted-foreground">Share anonymized usage data</p>
                  </div>
                  <Switch
                    checked={formData.dataSharing ?? false}
                    onCheckedChange={(checked) => handleChange('dataSharing', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}