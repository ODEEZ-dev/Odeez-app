import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Task } from '@/types'
import { TaskCard } from '@/components/tasks/task-card'

interface KanbanColumnProps {
  status: Task['status']
  title: string
  tasks: Task[]
  onTaskUpdate: (task: Task) => void
  onTaskDelete: (taskId: string) => void
  onAddTask: (status: Task['status']) => void
}

function KanbanColumn({ status, title, tasks, onTaskUpdate, onTaskDelete, onAddTask }: KanbanColumnProps) {

  return (
    <Droppable droppableId={status} type="TASK">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            'flex flex-col min-h-[500px] max-h-[calc(100vh-300px)] w-72 flex-shrink-0 rounded-2xl bg-muted/30 p-2',
            snapshot.isDraggingOver && 'bg-accent/60 ring-1 ring-primary/20'
          )}
        >
          <div className="flex items-center justify-between px-3 py-2">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              {title} <span className="ml-2 text-xs font-normal text-muted-foreground">{tasks.length}</span>
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onAddTask(status)}
              aria-label={`Add task to ${title}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div
            className="flex-1 overflow-y-auto space-y-2 px-1 pb-2"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <TaskCard
                    task={task}
                    isDragging={snapshot.isDragging}
                    provided={provided}
                    onUpdate={onTaskUpdate}
                    onDelete={onTaskDelete}
                    showCheckbox={false}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  )
}

interface KanbanBoardProps {
  tasks: Task[]
  onTaskUpdate: (task: Task) => void
  onTaskDelete: (taskId: string) => void
  onAddTask: (status: Task['status']) => void
}

const STATUS_CONFIG: Record<Task['status'], { title: string; color: string }> = {
  TODO: { title: 'To Do', color: '#6B7280' },
  IN_PROGRESS: { title: 'In Progress', color: '#3B82F6' },
  IN_REVIEW: { title: 'Review', color: '#8B5CF6' },
  DONE: { title: 'Done', color: '#10B981' },
  ARCHIVED: { title: 'Archived', color: '#9CA3AF' },
}

export function KanbanBoard({ tasks, onTaskUpdate, onTaskDelete, onAddTask }: KanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    const task = tasks.find((t) => t.id === draggableId)
    if (!task) return

    const newStatus = destination.droppableId as Task['status']
    const updatedTask = { ...task, status: newStatus, order: destination.index }
    onTaskUpdate(updatedTask)
  }

  const columns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)] min-h-[500px]">
        {columns.map((status) => {
          const config = STATUS_CONFIG[status]
          return (
            <KanbanColumn
              key={status}
              status={status}
              title={config.title}
              tasks={tasks.filter((t) => t.status === status)}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
              onAddTask={onAddTask}
            />
          )
        })}
      </div>
    </DragDropContext>
  )
}