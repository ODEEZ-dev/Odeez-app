'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TiptapImage from '@tiptap/extension-image'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { cn } from '@/lib/utils'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Terminal,
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Link as LinkIcon, Unlink, Highlighter, Image, AlignLeft,
  AlignCenter, AlignRight, AlignJustify
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const MENU_BUTTON = {
  variant: 'ghost',
  size: 'icon',
  className: 'h-8 w-8',
} as const

const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    codeBlock: { languageClassPrefix: 'language-' },
    link: false,
  }),
  Placeholder.configure({
    placeholder: 'Start writing your journal entry...',
    emptyEditorClass: 'is-editor-empty',
    showOnlyWhenEditable: true,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary underline underline-offset-2 hover:no-underline',
    },
  }),
  Highlight.configure({
    multicolor: true,
  }),
  Underline,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  TiptapImage,
]

const headings = [
  { level: 1 as const, label: 'Heading 1', icon: Heading1 },
  { level: 2 as const, label: 'Heading 2', icon: Heading2 },
  { level: 3 as const, label: 'Heading 3', icon: Heading3 },
]

export function JournalEditor({ content, onChange, editable = true, className }: {
  content: string
  onChange: (content: string) => void
  editable?: boolean
  className?: string
}) {
  const editor = useEditor({
    extensions: editorExtensions,
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn('prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4', className),
      },
    },
  })

  if (!editor) {
    return <div className={cn('prose prose-sm dark:prose-invert max-w-none min-h-[300px] p-4', className)} />
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      const alt = window.prompt('Enter alt text (optional):') || ''
      editor.chain().focus().setImage({ src: url, alt }).run()
    }
  }

  const setHeading = (level: 1 | 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run()
  }

  const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    editor.chain().focus().setTextAlign(align).run()
  }

  return (
    <div className="border rounded-lg bg-background">
      {editable && (
        <div className="flex flex-wrap gap-1 p-2 border-b">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button {...MENU_BUTTON} aria-label="Text formatting">
                <Heading1 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {headings.map((h) => (
                <DropdownMenuItem
                  key={h.level}
                  onSelect={() => setHeading(h.level)}
                  className="flex items-center gap-2"
                >
                  <h.icon className="h-4 w-4" />
                  {h.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button {...MENU_BUTTON} onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} aria-label="Bold">
            <Bold className="h-4 w-4" />
          </Button>
          <Button {...MENU_BUTTON} onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} aria-label="Italic">
            <Italic className="h-4 w-4" />
          </Button>
          <Button {...MENU_BUTTON} onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} aria-label="Underline">
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button {...MENU_BUTTON} onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} aria-label="Strikethrough">
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button {...MENU_BUTTON} onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} aria-label="Inline code">
            <Code className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button {...MENU_BUTTON} onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={!editor.can().chain().focus().toggleBulletList().run()} aria-label="Bullet list">
            <List className="h-4 w-4" />
          </Button>
          <Button {...MENU_BUTTON} onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={!editor.can().chain().focus().toggleOrderedList().run()} aria-label="Ordered list">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button {...MENU_BUTTON} onClick={() => editor.chain().focus().toggleBlockquote().run()} disabled={!editor.can().chain().focus().toggleBlockquote().run()} aria-label="Blockquote">
            <Quote className="h-4 w-4" />
          </Button>
          <Button {...MENU_BUTTON} onClick={() => editor.chain().focus().toggleCodeBlock().run()} disabled={!editor.can().chain().focus().toggleCodeBlock().run()} aria-label="Code block">
            <Terminal className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button {...MENU_BUTTON} aria-label="Text alignment">
                <AlignLeft className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setTextAlign('left')} className="flex items-center gap-2">
                <AlignLeft className="h-4 w-4" /> Left
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTextAlign('center')} className="flex items-center gap-2">
                <AlignCenter className="h-4 w-4" /> Center
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTextAlign('right')} className="flex items-center gap-2">
                <AlignRight className="h-4 w-4" /> Right
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTextAlign('justify')} className="flex items-center gap-2">
                <AlignJustify className="h-4 w-4" /> Justify
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-border mx-1" />

          <Button {...MENU_BUTTON} onClick={addLink} aria-label="Add link">
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button {...MENU_BUTTON} onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.can().chain().focus().unsetLink().run()} aria-label="Remove link">
            <Unlink className="h-4 w-4" />
          </Button>
          <Button {...MENU_BUTTON} onClick={addImage} aria-label="Add image">
            <Image className="h-4 w-4" />
          </Button>
          <Button {...MENU_BUTTON} onClick={() => editor.chain().focus().toggleHighlight().run()} disabled={!editor.can().chain().focus().toggleHighlight().run()} aria-label="Highlight">
            <Highlighter className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          <div className="text-xs text-muted-foreground flex items-center px-2">
            {editor.getText().split(/\s+/).filter(Boolean).length} words
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}