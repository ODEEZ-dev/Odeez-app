import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { cn, formatDate, formatRelativeTime, getInitials } from '@/lib/utils'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('applies size classes', () => {
    render(<Button size="lg">Large</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-11')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disables correctly', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders as child component', () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>
    )
    expect(screen.getByRole('link', { name: /link/i })).toBeInTheDocument()
  })
})

describe('cn utility', () => {
  it('merges classes correctly', () => {
    expect(cn('base', 'extra')).toBe('base extra')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'conditional')).toBe('base conditional')
    expect(cn('base', false && 'conditional')).toBe('base')
  })

  it('handles tailwind conflicts', () => {
    expect(cn('p-2 p-4')).toBe('p-4')
    expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500')
  })
})

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date)).toBe('Jan 15, 2024')
  })

  it('handles string dates', () => {
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024')
  })
})

describe('formatRelativeTime', () => {
  it('returns "just now" for recent dates', () => {
    const now = new Date()
    expect(formatRelativeTime(now)).toBe('just now')
  })

  it('formats minutes ago', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeTime(past)).toBe('5m ago')
  })

  it('formats hours ago', () => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000)
    expect(formatRelativeTime(past)).toBe('2h ago')
  })

  it('formats days ago', () => {
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(past)).toBe('3d ago')
  })
})

describe('getInitials', () => {
  it('returns initials from name', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Alice')).toBe('A')
    expect(getInitials('Bob Smith Johnson')).toBe('BS')
  })
})