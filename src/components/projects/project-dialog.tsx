'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { projectCreateSchema, ProjectCreateInput } from '@/lib/validations/project'
import { Project } from '@/types'

const COLOR_PRESETS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280',
]

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ProjectCreateInput) => Promise<void>
  editingProject?: Project | null
}

export function ProjectDialog({ open, onOpenChange, onSubmit, editingProject }: ProjectDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectCreateInput>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '',
    },
  })

  const selectedColor = watch('color')

  useEffect(() => {
    if (editingProject) {
      reset({
        name: editingProject.name,
        description: editingProject.description ?? '',
        color: editingProject.color,
        icon: editingProject.icon ?? '',
      })
    } else {
      reset({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: '',
      })
    }
  }, [editingProject, reset])

  const handleFormSubmit = async (data: ProjectCreateInput) => {
    await onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Project name"
              autoFocus
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Optional project description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon (emoji)</Label>
            <Input
              id="icon"
              {...register('icon')}
              placeholder="e.g. 🚀"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setValue('color', e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border-2 border-border"
                aria-label="Custom color"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
