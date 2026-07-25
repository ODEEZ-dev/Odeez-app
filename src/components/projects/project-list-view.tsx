'use client'

import { useState } from 'react'
import { Search, Plus, FolderKanban } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectCard } from './project-card'
import { Project } from '@/types'

interface ProjectListViewProps {
  projects: (Project & { _count?: { tasks: number; members: number; sections: number } })[]
  isLoading: boolean
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
  onArchive: (projectId: string, archived: boolean) => void
  onAdd: () => void
}

export function ProjectListView({
  projects,
  isLoading,
  onEdit,
  onDelete,
  onArchive,
  onAdd,
}: ProjectListViewProps) {
  const [search, setSearch] = useState('')

  const filtered = projects.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    )
  })

  const activeProjects = filtered.filter((p) => !p.archived)
  const archivedProjects = filtered.filter((p) => p.archived)

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Create a project to organize your tasks, sections, and team members.
          </p>
          <Button onClick={onAdd} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create your first project
          </Button>
        </div>
      ) : (
        <>
          {activeProjects.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Active ({activeProjects.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onArchive={onArchive}
                  />
                ))}
              </div>
            </div>
          )}

          {archivedProjects.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Archived ({archivedProjects.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
                {archivedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onArchive={onArchive}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
