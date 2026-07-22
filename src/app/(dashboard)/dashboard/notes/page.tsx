'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { StickyNote, Plus, Filter, Search, Archive } from 'lucide-react'
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
import { NoteDialog } from '@/components/notes/note-dialog'
import { NoteListView } from '@/components/notes/note-list-view'
import { Note } from '@/types'
import { NoteCreateInput, NoteUpdateInput } from '@/lib/validations/note'
import { toast } from '@/hooks/use-toast'

interface NotesResponse {
  data: Note[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

async function fetchNotes(params?: URLSearchParams): Promise<NotesResponse> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const queryString = params ? `?${params.toString()}` : ''
  const response = await fetch(`/api/notes${queryString}`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch notes')
  }

  return response.json()
}

async function createNote(data: NoteCreateInput): Promise<Note> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create note')
  }

  return response.json()
}

async function updateNote(id: string, data: NoteUpdateInput): Promise<Note> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update note')
  }

  return response.json()
}

async function deleteNote(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete note')
  }
}

export default function NotesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showArchived, setShowArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  params.append('sortBy', 'updatedAt')
  params.append('sortOrder', 'desc')
  params.append('archived', showArchived.toString())
  if (searchQuery) params.append('search', searchQuery)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notes', params.toString()],
    queryFn: () => fetchNotes(params),
  })

  const notes = data?.data || []
  const totalNotes = data?.meta.total || 0
  const totalPages = data?.meta.totalPages || 1

  const pinnedNotes = notes.filter(n => n.pinned).length
  const archivedNotes = notes.filter(n => n.archived).length

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Note created successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create note', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NoteUpdateInput }) => updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Note updated successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update note', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Note deleted' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete note', description: error.message, variant: 'destructive' })
    },
  })

  const togglePinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => updateNote(id, { pinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update pin', description: error.message, variant: 'destructive' })
    },
  })

  const toggleArchiveMutation = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) => updateNote(id, { archived }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update archive', description: error.message, variant: 'destructive' })
    },
  })

  const handleNoteDelete = useCallback((noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteMutation.mutate(noteId)
    }
  }, [deleteMutation])

  const handleAddNote = useCallback(() => {
    setEditingNote(null)
    setDialogOpen(true)
  }, [])

  const handleEdit = useCallback((note: Note) => {
    setEditingNote(note)
    setDialogOpen(true)
  }, [])

  const handleDialogSubmit = useCallback(async (noteData: NoteUpdateInput) => {
    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, data: noteData })
    } else {
      await createMutation.mutateAsync(noteData as NoteCreateInput)
    }
    setEditingNote(null)
    setDialogOpen(false)
  }, [editingNote, createMutation, updateMutation])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const handleTogglePin = (noteId: string, pinned: boolean) => {
    togglePinMutation.mutate({ id: noteId, pinned })
  }

  const handleToggleArchive = (noteId: string, archived: boolean) => {
    toggleArchiveMutation.mutate({ id: noteId, archived })
  }

  const handleCopy = (note: Note) => {
    createMutation.mutate({
      title: `${note.title} (Copy)`,
      content: note.content,
      color: note.color,
      pinned: false,
      archived: false,
      tags: [...note.tags],
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-1" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="capitalize animate-pulse h-5 w-20 bg-muted rounded" />
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
        <p>Failed to load notes. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <StickyNote className="h-8 w-8 text-amber-500" />
            Notes
          </h1>
          <p className="text-muted-foreground mt-1">
            {totalNotes} note{totalNotes !== 1 ? 's' : ''} total
            {pinnedNotes > 0 && <span className="ml-2 text-sm text-amber-500">({pinnedNotes} pinned)</span>}
            {archivedNotes > 0 && <span className="ml-2 text-sm text-muted-foreground">({archivedNotes} archived)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showArchived ? 'default' : 'outline'}
                size="icon"
                onClick={() => setShowArchived(!showArchived)}
                className="h-10 w-10"
              >
                <Archive className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show Archived</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSearchQuery('')}>Clear Search</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => handleAddNote()}>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAddNote}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Total Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotes}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Pinned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{pinnedNotes}</div>
            <p className="text-xs text-muted-foreground">Quick access notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archived
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{archivedNotes}</div>
            <p className="text-xs text-muted-foreground">Hidden from main view</p>
          </CardContent>
        </Card>
      </div>

      <NoteListView
        notes={notes}
        onEdit={handleEdit}
        onDelete={handleNoteDelete}
        onTogglePin={handleTogglePin}
        onToggleArchive={handleToggleArchive}
        onCopy={handleCopy}
        isLoading={isLoading}
        view={view}
        onViewChange={setView}
      />

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

      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
        initialData={editingNote
          ? {
              title: editingNote.title,
              content: editingNote.content,
              color: editingNote.color,
              pinned: editingNote.pinned,
              archived: editingNote.archived,
              tags: editingNote.tags,
            }
          : undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}