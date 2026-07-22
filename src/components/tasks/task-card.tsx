'use client'

import { Task } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Clock, Tag, MessageSquare, Flag, MoreVertical, GripVertical } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { DraggableProvided } from '@hello-pangea/dnd'

interface TaskCardProps {
  task: Task
  onUpdate: (task: Task) => void
  onDelete: (taskId: string) => void
  isDragging?: boolean
  provided?: DraggableProvided
  showCheckbox?: boolean
}

export function TaskCard({ task, onUpdate, onDelete, isDragging, provided, showCheckbox = true }: TaskCardProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE'
  const dueSoon = task.dueDate && !isOverdue && new Date(task.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'HIGH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'LOW': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const completedSubtasks = task.subtasks?.filter((s) => s.status === 'DONE').length || 0
  const totalSubtasks = task.subtasks?.length || 0
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  return (
    <Card className={cn('p-3 shadow-sm transition-shadow hover:shadow-md', task.priority === 'URGENT' && 'border-l-4 border-red-500', task.priority === 'HIGH' && 'border-l-4 border-orange-500', isDragging && 'shadow-lg ring-2 ring-primary')}>
      <div className="flex items-start gap-2">
        <div
          ref={provided?.innerRef}
          {...provided?.draggableProps}
          {...provided?.dragHandleProps}
          className={cn(
            'text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0 mt-0.5',
            !provided && 'opacity-0 group-hover:opacity-100'
          )}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </div>
<div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              {showCheckbox && (
                <Checkbox
                  checked={task.status === 'DONE'}
                  onCheckedChange={(checked) =>
                    onUpdate({
                      ...task,
                      status: checked ? 'DONE' : 'TODO',
                      completedAt: checked ? new Date() : null,
                    })
                  }
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
              <h4 className={cn('font-medium text-sm truncate', task.status === 'DONE' && 'line-through text-muted-foreground')}>
                {task.title}
              </h4>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{task.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {task.dueDate && (
                  <span className={cn('flex items-center gap-1 text-xs', isOverdue ? 'text-red-500' : dueSoon ? 'text-orange-500' : 'text-muted-foreground')}>
                    <Calendar className="h-3 w-3" />
                    {isOverdue
                      ? `Overdue ${formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}`
                      : dueSoon
                      ? `Due ${formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}`
                      : new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                {task.estimatedMinutes && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {task.estimatedMinutes < 60
                      ? `${task.estimatedMinutes}m`
                      : `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60}m`}
                  </span>
                )}
                {task.tags && task.tags.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    {task.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag.id} variant="outline" className="text-xs h-4 px-1.5" style={{ borderColor: tag.color, color: tag.color }}>
                        {tag.name}
                      </Badge>
                    ))}
                    {task.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs h-4 px-1.5">
                        +{task.tags.length - 2}
                      </Badge>
                    )}
                  </span>
                )}
                {task._count && task._count.comments > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    {task._count.comments}
                  </span>
                )}
              </div>
              {totalSubtasks > 0 && (
                <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{completedSubtasks} / {totalSubtasks} subtasks</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <Progress value={subtaskProgress} className="h-full" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
<DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => onUpdate({ ...task, status: 'IN_PROGRESS' })}
                disabled={task.status === 'IN_PROGRESS'}
              >
                Start
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdate({ ...task, status: 'DONE', completedAt: new Date() })}
                disabled={task.status === 'DONE'}
              >
                Complete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onUpdate({ ...task, priority: 'HIGH' })}
                disabled={task.priority === 'HIGH'}
              >
                <Flag className="h-3 w-3 mr-2 text-orange-500" /> High Priority
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdate({ ...task, priority: 'URGENT' })}
                disabled={task.priority === 'URGENT'}
              >
                <Flag className="h-3 w-3 mr-2 text-red-500" /> Urgent
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onUpdate({ ...task, editMode: true })}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Badge variant="secondary" className={cn('ml-1', getPriorityColor(task.priority))}>
          {task.priority}
        </Badge>
      </div>
    </Card>
  )
}