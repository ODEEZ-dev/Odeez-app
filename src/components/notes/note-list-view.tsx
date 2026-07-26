'use client'

import { Search, Filter, Grid, List, Pin } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NoteCard } from './note-card'
import { Note } from '@/types'
import { cn } from '@/lib/utils'

interface NoteListViewProps {
  notes: Note[]
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
  onTogglePin: (noteId: string, pinned: boolean) => void
  onToggleArchive: (noteId: string, archived: boolean) => void
  onCopy: (note: Note) => void
  isLoading?: boolean
  view?: 'grid' | 'list'
  onViewChange?: (view: 'grid' | 'list') => void
}

export function NoteListView({
  notes,
  onEdit,
  onDelete,
  onToggleArchive,
  onCopy,
  isLoading,
  view = 'grid',
  onViewChange,
}: NoteListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [showPinnedOnly, setShowPinnedOnly] = useState(false)

  const filteredNotes = notes.filter((note) => {
    if (!showArchived && note.archived) return false
    if (showPinnedOnly && !note.pinned) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const titleMatch = note.title.toLowerCase().includes(query)
      const contentMatch = note.content.toLowerCase().includes(query)
      const tagMatch = note.tags?.some((tag) => tag.toLowerCase().includes(query))
      if (!titleMatch && !contentMatch && !tagMatch) return false
    }
    return true
  })

  const pinnedNotes = filteredNotes.filter((n) => n.pinned)
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned)

  const sortedNotes = [...pinnedNotes, ...unpinnedNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-6 w-3/4 bg-muted rounded mb-3" />
              <div className="h-4 w-full bg-muted rounded mb-2" />
              <div className="h-4 w-2/3 bg-muted rounded mb-2" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (sortedNotes.length === 0) {
    return (
      <div className="text-center py-12 col-span-full">
        <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No notes found</h3>
        <p className="text-muted-foreground mt-2">
          {searchQuery || showArchived || showPinnedOnly
            ? 'Try adjusting your filters or search query.'
            : 'Create your first note to get started.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowPinnedOnly(!showPinnedOnly)}>
                {showPinnedOnly ? '✓ ' : ''}Pinned only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowArchived(!showArchived)}>
                {showArchived ? '✓ ' : ''}Show archived
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSearchQuery('')}>
                Clear search
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setShowArchived(false); setShowPinnedOnly(false); }}>
                Reset all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => onViewChange?.('grid')}
                className="h-10 w-10"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grid View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => onViewChange?.('list')}
                className="h-10 w-10"
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>List View</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleArchive={onToggleArchive}
              onCopy={onCopy}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedNotes.map((note) => (
            <Card key={note.id} className={cn('relative', note.pinned && 'ring-2 ring-amber-400/50')}>
              {note.color && (
                <div
                  className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: note.color }}
                />
              )}
              <CardContent className="py-3">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base truncate">{note.title}</h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {note.pinned && <Pin className="h-4 w-4 text-amber-500" />}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <span className="sr-only">More options</span>
                              <span>⋮</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onEdit(note)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCopy(note)}>Duplicate</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onToggleArchive(note.id, !note.archived)}
                              className={note.archived ? 'text-green-600' : ''}
                            >
                              {note.archived ? 'Unarchive' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(note.id)} className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {note.content.replace(/<[^>]*>/g, '').slice(0, 150)}
                      {note.content.length > 150 ? '...' : ''}
                    </p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{note.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Updated {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}