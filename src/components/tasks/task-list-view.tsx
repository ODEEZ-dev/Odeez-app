'use client'

import { useState } from 'react'
import { CheckSquare, ChevronUp, ChevronDown, Calendar, Clock, MoreVertical, Search, Tag, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, isPast, format, isValid } from 'date-fns'
import { Task } from '@/types'

interface TaskListViewProps {
  tasks: Task[]
  onTaskUpdate: (task: Task) => void
  onTaskDelete: (taskId: string) => void
  onAddTask: (status?: Task['status']) => void
  isLoading?: boolean
  view?: 'list' | 'compact'
}

const STATUS_LABELS: Record<Task['status'], string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  ARCHIVED: 'Archived',
}

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function TaskRow({
  task,
  onUpdate,
  onDelete,
  view = 'list',
}: {
  task: Task
  onUpdate: (task: Task) => void
  onDelete: (taskId: string) => void
  view?: 'list' | 'compact'
}) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE'

  return (
    <div className={cn(
      'group flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-accent',
      view === 'compact' && 'py-2'
    )}>
      <Checkbox
        checked={task.status === 'DONE'}
        onCheckedChange={(checked) =>
          onUpdate({
            ...task,
            status: checked ? 'DONE' : 'TODO',
            completedAt: checked ? new Date() : null,
          })
        }
        className="h-5 w-5"
      />

      <div className="flex-1 min-w-0">
        <p className={cn('font-medium truncate', task.status === 'DONE' && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
          {task.dueDate && (
            <span className={cn('flex items-center gap-1', isOverdue && 'text-destructive')}>
              <Calendar className="h-3 w-3" />
              {isValid(new Date(task.dueDate))
                ? isOverdue
                  ? `Overdue by ${formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}`
                  : format(new Date(task.dueDate), 'MMM d, yyyy')
                : 'Invalid date'}
            </span>
          )}
          {task.startDate && !task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Starts {format(new Date(task.startDate), 'MMM d, yyyy')}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.estimatedMinutes < 60
                ? `${task.estimatedMinutes}m`
                : `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60}m`}
            </span>
          )}
          {task.tags && task.tags.length > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {task.tags.slice(0, 3).map((t, i) => (
                <Badge key={i} variant="secondary" className="text-xs h-4 px-1.5" style={{ backgroundColor: t.color + '20', color: t.color, borderColor: t.color }}>
                  {t.name}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs h-4 px-1.5">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={cn(PRIORITY_COLORS[task.priority], 'hidden sm:inline-flex')}>
          {task.priority}
        </Badge>
        <Badge variant="outline" className="hidden md:inline-flex">
          {STATUS_LABELS[task.status]}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onUpdate({ ...task, status: 'IN_PROGRESS' })}
              disabled={task.status === 'IN_PROGRESS'}
            >
              Start Working
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdate({ ...task, status: 'DONE', completedAt: new Date() })}
              disabled={task.status === 'DONE'}
            >
              Mark Complete
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onUpdate({ ...task, priority: 'HIGH' })}
              disabled={task.priority === 'HIGH'}
            >
              Set High Priority
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdate({ ...task, priority: 'URGENT' })}
              disabled={task.priority === 'URGENT'}
            >
              Set Urgent
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
    </div>
  )
}

export function TaskListView({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onAddTask,
  isLoading,
  view = 'list',
}: TaskListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | 'all'>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title' | 'createdAt'>('dueDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const filteredTasks = tasks
    .filter((task) => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false
      }
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      let aVal: string | number | Date | null = a[sortBy]
      let bVal: string | number | Date | null = b[sortBy]

      if (sortBy === 'dueDate') {
        aVal = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
        bVal = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      } else if (sortBy === 'priority') {
        const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        aVal = priorityOrder[a.priority]
        bVal = priorityOrder[b.priority]
      } else if (sortBy === 'createdAt') {
        aVal = new Date(a.createdAt).getTime()
        bVal = new Date(b.createdAt).getTime()
      }

      if (aVal === null && bVal === null) return 0
      if (aVal === null) return sortOrder === 'asc' ? 1 : -1
      if (bVal === null) return sortOrder === 'asc' ? -1 : 1
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg border">
                <div className="h-5 w-5 rounded border bg-muted" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded mt-1" />
                </div>
                <div className="h-5 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Tasks
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onAddTask()}>
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Task['status'] | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value as Task['status']}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as Task['priority'] | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'dueDate' | 'priority' | 'title' | 'createdAt')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No tasks found</p>
            <p className="text-sm mt-1">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first task to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[calc(100vh-350px)] overflow-y-auto">
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
                view={view}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}