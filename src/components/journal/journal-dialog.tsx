'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import { journalEntryCreateSchema, JournalEntryCreateInput } from '@/lib/validations/journal'
import { JournalEditor } from './journal-editor'
import { MOOD_OPTIONS, Mood } from '@/types'

interface JournalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: JournalEntryCreateInput) => Promise<void>
  initialData?: Partial<JournalEntryCreateInput> | null
  isLoading?: boolean
}

const MOOD_OPTIONS_WITH_NONE: { value: Mood | ''; label: string; emoji: string }[] = [
  { value: '', label: 'No mood', emoji: '' },
  ...MOOD_OPTIONS,
]

export function JournalDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: JournalDialogProps) {
  const [selectedDate, setSelectedDate] = useState(
    initialData?.date || new Date().toISOString().split('T')[0]
  )
  const [selectedMood, setSelectedMood] = useState<Mood | ''>(
    (initialData?.mood as Mood) || ''
  )
  const [moodScore, setMoodScore] = useState<number | null>(
    initialData?.moodScore ? Number(initialData.moodScore) : null
  )
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [newTag, setNewTag] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JournalEntryCreateInput>({
    resolver: zodResolver(journalEntryCreateSchema),
    defaultValues: {
      title: '',
      content: '',
      mood: '',
      moodScore: undefined,
      tags: [],
      date: new Date().toISOString().split('T')[0],
    },
  })

  const content = watch('content')

  useEffect(() => {
    if (open && initialData) {
      reset({
        title: initialData.title || '',
        content: initialData.content || '',
        mood: initialData.mood || '',
        moodScore: initialData.moodScore || undefined,
        tags: initialData.tags || [],
        date: initialData.date || new Date().toISOString().split('T')[0],
      })
      setSelectedDate(initialData.date || new Date().toISOString().split('T')[0])
      setSelectedMood((initialData.mood as Mood) || '')
      setMoodScore(initialData.moodScore ? Number(initialData.moodScore) : null)
      setTags(initialData.tags || [])
    } else if (open && !initialData) {
      reset()
      setSelectedDate(new Date().toISOString().split('T')[0])
      setSelectedMood('')
      setMoodScore(null)
      setTags([])
    }
  }, [open, initialData, reset])

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const onFormSubmit = async (data: JournalEntryCreateInput) => {
    const submitData = {
      ...data,
      date: selectedDate,
      mood: selectedMood || undefined,
      moodScore: moodScore ?? undefined,
      tags,
    }
    await onSubmit(submitData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Journal Entry' : 'New Journal Entry'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 max-h-[calc(90vh-140px)] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="What's on your mind?"
              {...register('title')}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Content *</Label>
            <JournalEditor
              content={content}
              onChange={(html) => setValue('content', html, { shouldValidate: true })}
              className="min-h-[300px]"
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mood</Label>
              <Select
                value={selectedMood}
                onValueChange={(v) => setSelectedMood(v as Mood | '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How are you feeling?" />
                </SelectTrigger>
                <SelectContent>
                  {MOOD_OPTIONS_WITH_NONE.map((mood) => (
                    <SelectItem key={mood.value} value={mood.value}>
                      <span className="flex items-center gap-2">
                        {mood.emoji && <span role="img">{mood.emoji}</span>}
                        {mood.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mood Score (1-10)</Label>
              <Select
                value={moodScore?.toString() || ''}
                onValueChange={(v) => setMoodScore(v ? Number(v) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rate your mood" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(10)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <Input
                placeholder="Add tag (press Enter)..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={50}
                className="w-48"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter to add tags. Maximum 10 tags.
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