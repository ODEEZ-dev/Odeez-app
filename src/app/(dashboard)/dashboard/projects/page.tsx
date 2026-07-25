'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderKanban } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ProjectListView } from '@/components/projects/project-list-view'
import { ProjectDialog } from '@/components/projects/project-dialog'
import { Project } from '@/types'
import { ProjectCreateInput } from '@/lib/validations/project'

export default function ProjectsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to fetch projects')
      const json = await res.json()
      return json.data as (Project & { _count: { tasks: number; members: number; sections: number } })[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: ProjectCreateInput) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create project')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast({ title: 'Project created successfully' })
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectCreateInput> & { archived?: boolean } }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update project')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast({ title: 'Project updated successfully' })
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete project')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast({ title: 'Project deleted successfully' })
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const handleCreate = async (data: ProjectCreateInput) => {
    if (editingProject) {
      await updateMutation.mutateAsync({ id: editingProject.id, data })
      setEditingProject(null)
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setDialogOpen(true)
  }

  const handleArchive = (id: string, archived: boolean) => {
    updateMutation.mutate({ id, data: { archived } })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderKanban className="h-6 w-6" />
            Projects
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organize your tasks into projects
          </p>
        </div>
      </div>

      <ProjectListView
        projects={projects ?? []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onAdd={() => {
          setEditingProject(null)
          setDialogOpen(true)
        }}
      />

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        editingProject={editingProject}
      />
    </div>
  )
}
