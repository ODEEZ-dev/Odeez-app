'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Search, Command, ArrowUp, ArrowDown, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SearchResult } from '@/lib/validations/search'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchResponse {
  data: SearchResult[]
}

async function searchApi(query: string): Promise<SearchResponse> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const params = new URLSearchParams()
  params.append('q', query)
  params.append('limit', '50')

  const response = await fetch(`/api/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to search')
  }

  return response.json()
}

const moduleIcons: Record<SearchResult['type'], React.ReactElement> = {
  task: <Command className="h-4 w-4 text-blue-500" />,
  habit: <span className="h-4 w-4 rounded-full bg-green-500" />,
  journal: <span className="h-4 w-4 rounded bg-purple-500" />,
  finance: <span className="h-4 w-4 rounded bg-amber-500" />,
  note: <span className="h-4 w-4 rounded bg-yellow-300" />,
  event: <span className="h-4 w-4 rounded bg-blue-500" />,
  contact: <span className="h-4 w-4 rounded bg-pink-500" />,
  setting: <span className="h-4 w-4 rounded bg-gray-500" />,
}

const moduleLabels: Record<SearchResult['type'], string> = {
  task: 'Task',
  habit: 'Habit',
  journal: 'Journal',
  finance: 'Finance',
  note: 'Note',
  event: 'Event',
  contact: 'Contact',
  setting: 'Settings',
}

const quickActions = [
  { type: 'task' as const, label: 'Tasks', shortcut: '⌘1', href: '/dashboard/tasks' },
  { type: 'habit' as const, label: 'Habits', shortcut: '⌘2', href: '/dashboard/habits' },
  { type: 'journal' as const, label: 'Journal', shortcut: '⌘3', href: '/dashboard/journal' },
  { type: 'finance' as const, label: 'Finances', shortcut: '⌘4', href: '/dashboard/finances' },
  { type: 'note' as const, label: 'Notes', shortcut: '⌘5', href: '/dashboard/notes' },
  { type: 'event' as const, label: 'Calendar', shortcut: '⌘6', href: '/dashboard/calendar' },
  { type: 'contact' as const, label: 'Contacts', shortcut: '⌘7', href: '/dashboard/contacts' },
  { type: 'setting' as const, label: 'Settings', shortcut: '⌘,', href: '/dashboard/settings' },
]

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchApi(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60,
  })

  useEffect(() => {
    if (data?.data) {
      setSearchResults(data.data)
      setSelectedIndex(0)
    }
  }, [data])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSearchResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onOpenChange(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (searchResults[selectedIndex]) {
          window.location.href = searchResults[selectedIndex].url
          onOpenChange(false)
        }
        break
      case 'Tab':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % searchResults.length)
        break
    }
  }, [searchResults, selectedIndex, onOpenChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setSelectedIndex(0)
  }

  const handleResultClick = (result: SearchResult) => {
    window.location.href = result.url
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <Card className="w-full max-w-2xl shadow-lg relative">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search tasks, habits, notes, contacts... (⌘K)"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="pl-10 py-3 text-lg"
                autoComplete="off"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border">⌘K</kbd> Open
              <kbd className="px-1.5 py-0.5 rounded bg-muted border">↑↓</kbd> Navigate
              <kbd className="px-1.5 py-0.5 rounded bg-muted border">Enter</kbd> Open
              <kbd className="px-1.5 py-0.5 rounded bg-muted border">Esc</kbd> Close
            </div>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-4">
              {query.length >= 2 && (
                <div className="space-y-1">
                  {searchResults.length === 0 && !isLoading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <p className="text-sm">No results found for "{query}"</p>
                    </div>
                  ) : (
                    searchResults.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className={cn(
                          'flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors',
                          index === selectedIndex
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50'
                        )}
                        tabIndex={-1}
                      >
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded bg-muted/50',
                          index === selectedIndex ? 'bg-accent/50' : ''
                        )}>
                          {moduleIcons[result.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{result.title}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                              {moduleLabels[result.type]}
                            </span>
                          </div>
                          {result.subtitle && (
                            <p className="text-sm text-muted-foreground/80 truncate mt-0.5">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))
                  )}
                </div>
              )}

              {query.length > 0 && query.length < 2 && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <p className="text-sm">Type at least 2 characters to search</p>
                </div>
              )}

              {query.length === 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Quick Actions</p>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                    {quickActions.map(({ type, label, shortcut, href }) => (
                      <button
                        key={type}
                        onClick={() => {
                          window.location.href = href
                          onOpenChange(false)
                        }}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        {moduleIcons[type]}
                        <span className="text-sm font-medium">{label}</span>
                        <kbd className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{shortcut}</kbd>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export function CommandPaletteTrigger() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setOpen(true)}
        aria-label="Open command palette (⌘K)"
      >
        <Search className="h-4 w-4" />
      </Button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  )
}