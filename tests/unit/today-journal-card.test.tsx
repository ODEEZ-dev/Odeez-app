import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodayJournalCard } from '@/components/dashboard/today-view'
import { BookOpen } from 'lucide-react'

const mockJournal = {
  id: '1',
  title: 'My Journal Entry',
  content: 'Today was a great day!',
  mood: 'HAPPY',
  moodScore: 8,
}

describe('TodayJournalCard', () => {
  it('renders journal entry with title and content', () => {
    render(
      <TodayJournalCard journal={mockJournal} />
    )
    
    expect(screen.getByText('My Journal Entry')).toBeInTheDocument()
    expect(screen.getByText('Today was a great day!')).toBeInTheDocument()
  })

  it('renders mood emoji and score', () => {
    render(
      <TodayJournalCard journal={mockJournal} />
    )
    
    expect(screen.getByText('😊')).toBeInTheDocument()
    expect(screen.getByText('Mood: 8/10')).toBeInTheDocument()
  })

  it('shows empty state when no journal', () => {
    render(
      <TodayJournalCard journal={null} />
    )
    
    expect(screen.getByText('No entry for today. Write your thoughts!')).toBeInTheDocument()
  })

  it('shows loading skeleton when loading', () => {
    render(
      <TodayJournalCard journal={null} loading={true} />
    )
    
    const animatedElements = document.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
  })
})