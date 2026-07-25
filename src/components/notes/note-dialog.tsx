'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  CheckSquare,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { NoteCreateInput, NoteUpdateInput } from '@/lib/validations/note'
import { cn } from '@/lib/utils'

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: NoteCreateInput | NoteUpdateInput) => Promise<void>
  initialData?: NoteCreateInput
  isLoading?: boolean
}

const MENU_BAR_STYLE = `
  .ProseMirror {
    outline: none;
    min-height: 300px;
    max-height: 500px;
    overflow-y: auto;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: hsl(var(--muted-foreground));
    pointer-events: none;
    height: 0;
  }
  .ProseMirror .task-list-item {
    list-style: none;
  }
  .ProseMirror .task-list-item > label {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .ProseMirror .task-list-item input[type="checkbox"] {
    margin-top: 0.25rem;
    flex-shrink: 0;
  }
`

export function NoteDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: NoteDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [color, setColor] = useState(initialData?.color || '#FEF3C7')
  const [pinned, setPinned] = useState(initialData?.pinned || false)
  const [archived, setArchived] = useState(initialData?.archived || false)
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '')
  const [tagInput, setTagInput] = useState('')

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:no-underline',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: initialData?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[300px]',
      },
    },
  })

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setColor(initialData.color || '#FEF3C7')
      setPinned(initialData.pinned || false)
      setArchived(initialData.archived || false)
      setTags(initialData.tags?.join(', ') || '')
      editor?.commands.setContent(initialData.content || '')
    } else {
      setTitle('')
      setColor('#FEF3C7')
      setPinned(false)
      setArchived(false)
      setTags('')
      editor?.commands.setContent('')
    }
  }, [initialData, editor])

  const handleAddTag = useCallback(() => {
    if (tagInput.trim()) {
      const newTags = [...tags.split(',').map(t => t.trim()).filter(Boolean), tagInput.trim()]
      setTags(newTags.join(', '))
      setTagInput('')
    }
  }, [tagInput, tags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const newTags = tags.split(',').map(t => t.trim()).filter(t => t && t !== tagToRemove)
    setTags(newTags.join(', '))
  }, [tags])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !editor) return

    const content = editor.getHTML()
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean)

    const data: NoteCreateInput | NoteUpdateInput = {
      title: title.trim(),
      content,
      color,
      pinned,
      archived,
      tags: tagArray,
    }

    await onSubmit(data)
  }, [title, color, pinned, archived, tags, editor, onSubmit])

  const colors = [
    '#FEF3C7', '#FDE68A', '#FCE7F3', '#FBCFE8', '#F5E0FF', '#E0E7FF',
    '#DBEAFE', '#BFDBFE', '#BAE6FD', '#BBF7D0', '#D9F99D', '#FEF08A',
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-4">
            <DialogTitle>{initialData ? 'Edit Note' : 'New Note'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                className="text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30" style={{ fontSize: '13px' }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    aria-label="Heading 1"
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    aria-label="Heading 2"
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    aria-label="Heading 3"
                  >
                    <Heading3 className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="mx-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    aria-label="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    aria-label="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    aria-label="Strikethrough"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().toggleCode().run()}
                    aria-label="Inline code"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="mx-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    aria-label="Bullet list"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    aria-label="Numbered list"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().toggleTaskList().run()}
                    aria-label="Task list"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    aria-label="Quote"
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="mx-1" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Insert link">
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          const url = prompt('Enter URL:')
                          if (url) editor?.chain().focus().setLink({ href: url }).run()
                        }}
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Add Link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          editor?.chain().focus().unsetLink().run()
                        }}
                        disabled={!editor?.can().unsetLink()}
                      >
                        Remove Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Separator orientation="vertical" className="mx-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().undo().run()}
                    disabled={!editor?.can().undo()}
                    aria-label="Undo"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor?.chain().focus().redo().run()}
                    disabled={!editor?.can().redo()}
                    aria-label="Redo"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
                <EditorContent editor={editor} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        'h-8 w-8 rounded-lg border-2 transition-all',
                        color === c ? 'border-primary scale-110' : 'border-transparent hover:border-muted'
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                      aria-pressed={color === c}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tag..."
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {tags && (
                  <div className="flex flex-wrap gap-1">
                    {tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm">Pin to top</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={archived}
                  onChange={(e) => setArchived(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm">Archive</span>
              </label>
            </div>
          </div>

          <DialogFooter className="border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim() || !editor}>
              {isLoading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Note'}
            </Button>
          </DialogFooter>
        </form>

        <style jsx>{MENU_BAR_STYLE}</style>
      </DialogContent>
    </Dialog>
  )
}