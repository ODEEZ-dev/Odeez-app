'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Settings, Save, User, Bell, CheckSquare, Target, DollarSign, Calendar, Shield, Download, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { SettingsDialog } from '@/components/settings/settings-dialog'
import { SettingsUpdateInput } from '@/lib/validations/settings'
import { toast } from '@/hooks/use-toast'

interface UserSettings {
  id: string
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
  dailyDigest: boolean
  weeklyReport: boolean
  defaultTaskPriority: string
  defaultTaskView: string
  weekStartsOn: number
  habitReminderTime: string | null
  defaultCurrency: string
  budgetAlertThreshold: number
  calendarView: string
  showWeekends: boolean
  profilePublic: boolean
  dataSharing: boolean
  createdAt: string
  updatedAt: string
}

async function fetchSettings(): Promise<UserSettings> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch('/api/settings', {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch settings')
  }

  return response.json()
}

async function updateSettings(data: SettingsUpdateInput): Promise<UserSettings> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update settings')
  }

  return response.json()
}

async function exportData(): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch('/api/settings/export', {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to export data')
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `basecamp-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast({ title: 'Settings saved successfully' })
      setDialogOpen(false)
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to save settings', description: error.message, variant: 'destructive' })
    },
  })

  const handleDialogSubmit = useCallback(async (data: SettingsUpdateInput) => {
    await updateMutation.mutateAsync(data)
  }, [updateMutation])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="animate-pulse space-y-2">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <CardTitle className="h-4 w-3/4 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Failed to load settings. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your preferences and account settings</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings?.emailNotifications && settings?.pushNotifications ? 'On' : 'Custom'}</div>
            <p className="text-xs text-muted-foreground">Email & push preferences</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings?.habitReminderTime || '09:00'}</div>
            <p className="text-xs text-muted-foreground">Daily reminder time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Finances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings?.defaultCurrency || 'USD'}</div>
            <p className="text-xs text-muted-foreground">Default currency</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Your Account</h3>
              <p className="text-muted-foreground text-sm">Manage your profile, preferences, and data</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Save className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-lg border bg-muted/30">
              <CheckSquare className="h-5 w-5 text-primary mb-2" />
              <h4 className="font-medium">Tasks</h4>
              <p className="text-sm text-muted-foreground mt-1">Default priority, view, week start</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <Target className="h-5 w-5 text-green-500 mb-2" />
              <h4 className="font-medium">Habits</h4>
              <p className="text-sm text-muted-foreground mt-1">Reminder time, default frequency</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <Calendar className="h-5 w-5 text-blue-500 mb-2" />
              <h4 className="font-medium">Calendar</h4>
              <p className="text-sm text-muted-foreground mt-1">Default view, weekend visibility</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <DollarSign className="h-5 w-5 text-amber-500 mb-2" />
              <h4 className="font-medium">Finances</h4>
              <p className="text-sm text-muted-foreground mt-1">Currency, budget alerts</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <Shield className="h-5 w-5 text-purple-500 mb-2" />
              <h4 className="font-medium">Privacy</h4>
              <p className="text-sm text-muted-foreground mt-1">Profile visibility, data sharing</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <Bell className="h-5 w-5 text-orange-500 mb-2" />
              <h4 className="font-medium">Notifications</h4>
              <p className="text-sm text-muted-foreground mt-1">Email, push, digests, reports</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium">Export your data</p>
            <p className="text-sm text-muted-foreground">Download a JSON file with all your data</p>
          </div>
          <Button variant="outline" onClick={exportData} className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </CardContent>
      </Card>

      <SettingsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
        initialData={settings ? {
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          dailyDigest: settings.dailyDigest,
          weeklyReport: settings.weeklyReport,
          defaultTaskPriority: settings.defaultTaskPriority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
          defaultTaskView: settings.defaultTaskView as 'LIST' | 'KANBAN' | 'CALENDAR',
          weekStartsOn: settings.weekStartsOn,
          habitReminderTime: settings.habitReminderTime || '09:00',
          defaultCurrency: settings.defaultCurrency,
          budgetAlertThreshold: settings.budgetAlertThreshold,
          calendarView: settings.calendarView as 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
          showWeekends: settings.showWeekends,
          profilePublic: settings.profilePublic,
          dataSharing: settings.dataSharing,
        } : undefined}
        isLoading={updateMutation.isPending}
      />
    </div>
  )
}