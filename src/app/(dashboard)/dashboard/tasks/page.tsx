'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { CheckSquare, Plus, Filter, Kanban, LayoutList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { KanbanBoard } from '@/components/tasks/kanban-board'
import { TaskListView } from '@/components/tasks/task-list-view'
import { TaskDialog } from '@/components/tasks/task-dialog'
import { Task } from '@/types'
import { TaskCreateInput, TaskUpdateInput } from '@/lib/validations/task'
import { toast } from '@/hooks/use-toast'

const KANBAN_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const

interface TasksResponse {
  data: Task[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

async function fetchTasks(params?: URLSearchParams): Promise<TasksResponse> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const queryString = params ? `?${params.toString()}` : ''
  const response = await fetch(`/api/tasks${queryString}`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }

  return response.json()
}

async function createTask(data: TaskCreateInput): Promise<Task> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create task')
  }

  return response.json()
}

async function updateTask(id: string, data: TaskUpdateInput): Promise<Task> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update task')
  }

  return response.json()
}

async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete task')
  }
}

export default function TasksPage() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<Task['status']>('TODO')
  const [page, setPage] = useState(1)
  const [limit] = useState(50)

  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  params.append('sortBy', 'order')
  params.append('sortOrder', 'asc')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', params.toString()],
    queryFn: () => fetchTasks(params),
  })

  const tasks = data?.data || []
  const totalTasks = data?.meta.total || 0
  const totalPages = data?.meta.totalPages || 1

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({ title: 'Task created successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create task', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskUpdateInput }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({ title: 'Task updated successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update task', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({ title: 'Task deleted' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete task', description: error.message, variant: 'destructive' })
    },
  })

  const handleTaskUpdate = useCallback((task: Task) => {
    // Handle edit mode - open dialog instead of API call
    if ((task as any).editMode) {
      setEditingTask(task)
      setDialogOpen(true)
      return
    }

    updateMutation.mutate({
      id: task.id,
      data: {
        ...task,
        description: task.description ?? undefined,
        dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
        startDate: task.startDate ? task.startDate.toISOString() : undefined,
        completedAt: task.completedAt ? task.completedAt.toISOString() : undefined,
      },
    })
  }, [updateMutation])

  const handleTaskDelete = useCallback((taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(taskId)
    }
  }, [deleteMutation])

  const handleAddTask = useCallback((status?: Task['status']) => {
    setSelectedStatus(status || 'TODO')
    setEditingTask(null)
    setDialogOpen(true)
  }, [])

  const handleDialogSubmit = useCallback(async (taskData: TaskCreateInput) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: taskData })
    } else {
      await createMutation.mutateAsync({ ...taskData, status: taskData.status || selectedStatus })
    }
    setEditingTask(null)
    setDialogOpen(false)
  }, [editingTask, selectedStatus, createMutation, updateMutation])

  const handleTaskRowUpdate = useCallback((task: Task) => {
    handleTaskUpdate(task)
  }, [handleTaskUpdate])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">Manage your tasks and projects</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {KANBAN_STATUSES.map((status) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                  <div className="animate-pulse h-5 w-12 bg-muted rounded" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-20 w-full bg-muted rounded" />
                  ))}
                </div>
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
        <p>Failed to load tasks. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-8 w-8" />
            Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            {totalTasks} task{totalTasks !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'kanban' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('kanban')}
                className="h-10 w-10"
              >
                <Kanban className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Kanban Board</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('list')}
                className="h-10 w-10"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>List View</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAddTask('TODO')}>To Do</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTask('IN_PROGRESS')}>In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTask('IN_REVIEW')}>In Review</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTask('DONE')}>Done</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => handleAddTask('ARCHIVED')}>
                Archived
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => handleAddTask()}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <KanbanBoard
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          onAddTask={handleAddTask}
        />
      ) : (
        <TaskListView
          tasks={tasks}
          onTaskUpdate={handleTaskRowUpdate}
          onTaskDelete={handleTaskDelete}
          onAddTask={handleAddTask}
          isLoading={isLoading}
          view="list"
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
        initialData={editingTask
          ? {
              ...editingTask,
              description: editingTask.description ?? undefined,
              dueDate: editingTask.dueDate ? editingTask.dueDate.toISOString() : undefined,
              startDate: editingTask.startDate ? editingTask.startDate.toISOString() : undefined,
            }
          : undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}