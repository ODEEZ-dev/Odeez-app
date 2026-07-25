'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ProjectSection } from '@/types'

interface SectionListProps {
  sections: (ProjectSection & { _count?: { tasks: number } })[]
  isLoading: boolean
  onAdd: (name: string) => void
  onDelete: (sectionId: string) => void
  onReorder: (sectionId: string, direction: 'up' | 'down') => void
}

export function SectionList({ sections, isLoading, onAdd, onDelete, onReorder }: SectionListProps) {
  const [newSectionName, setNewSectionName] = useState('')

  const handleAdd = () => {
    if (newSectionName.trim()) {
      onAdd(newSectionName.trim())
      setNewSectionName('')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent/50"
          >
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === 0}
                onClick={() => onReorder(section.id, 'up')}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === sections.length - 1}
                onClick={() => onReorder(section.id, 'down')}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex-1">
              <span className="font-medium">{section.name}</span>
              {section._count && section._count.tasks > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {section._count.tasks} {section._count.tasks === 1 ? 'task' : 'tasks'}
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(section.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {sections.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No sections yet. Add one below.
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Input
            placeholder="New section name"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
          />
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
