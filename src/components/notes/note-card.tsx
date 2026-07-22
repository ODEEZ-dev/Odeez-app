'use client'

import { formatDistanceToNow } from 'date-fns'
import { Pin, MoreVertical, Copy, Edit, Archive, Trash2, Tag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Note } from '@/types'
import { cn } from '@/lib/utils'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
  onTogglePin: (noteId: string, pinned: boolean) => void
  onToggleArchive: (noteId: string, archived: boolean) => void
  onCopy: (note: Note) => void
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive,
  onCopy,
}: NoteCardProps) {
  const plainText = note.content.replace(/<[^>]*>/g, '')

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-lg',
        note.pinned && 'ring-2 ring-amber-400/50 relative',
        note.archived && 'opacity-60'
      )}
      style={{ backgroundColor: note.color }}
    >
      <CardContent className="pt-6 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-base line-clamp-1 pr-2">{note.title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {note.pinned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Pin className="h-4 w-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>Pinned</TooltipContent>
              </Tooltip>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">More options</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(note)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy(note)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onToggleArchive(note.id, !note.archived)}
                  className={note.archived ? 'text-green-600' : ''}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {note.archived ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(note.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {plainText.slice(0, 200)}
          {plainText.length > 200 ? '...' : ''}
        </p>

        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{note.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}