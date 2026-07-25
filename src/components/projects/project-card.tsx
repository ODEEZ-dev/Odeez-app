'use client'

import Link from 'next/link'
import { MoreVertical, Edit, Trash2, Archive, FolderKanban } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Project } from '@/types'

interface ProjectCardProps {
  project: Project & { _count?: { tasks: number; members: number; sections: number } }
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
  onArchive: (projectId: string, archived: boolean) => void
}

export function ProjectCard({ project, onEdit, onDelete, onArchive }: ProjectCardProps) {
  const taskCount = project._count?.tasks ?? 0
  const memberCount = project._count?.members ?? 0
  const sectionCount = project._count?.sections ?? 0

  return (
    <Card className="group relative overflow-hidden transition-colors hover:bg-accent/30">
      <div className="h-1.5 w-full" style={{ backgroundColor: project.color }} />
      <div className="absolute top-4 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => onEdit(project)} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onArchive(project.id, !project.archived)}
              className="flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              {project.archived ? 'Unarchive' : 'Archive'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(project.id)}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="p-5">
        <Link href={`/dashboard/projects/${project.id}`} className="block">
          <div className="flex items-start gap-3 mb-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg flex-shrink-0"
              style={{ backgroundColor: `${project.color}20`, color: project.color }}
            >
              {project.icon || <FolderKanban className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base truncate">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {taskCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
              </Badge>
            )}
            {sectionCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {sectionCount} {sectionCount === 1 ? 'section' : 'sections'}
              </Badge>
            )}
            {memberCount > 1 && (
              <Badge variant="secondary" className="text-xs">
                {memberCount} members
              </Badge>
            )}
            {project.archived && (
              <Badge variant="outline" className="text-xs">
                Archived
              </Badge>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}
