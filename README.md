# Basecamp - Personal Life Dashboard

A comprehensive personal life management application built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Today View** - Daily overview with tasks, habits, journal, and calendar
- **Tasks** - Full task management with projects, tags, recurring tasks, subtasks
- **Habits** - Habit tracking with streaks, reminders, and analytics
- **Journal** - Daily journaling with mood tracking and tags
- **Finances** - Expense/income tracking with budgets and reports
- **Notes** - Quick notes with pinning, tags, and search
- **Calendar** - Event scheduling with recurring events
- **Contacts** - Contact management with favorites and tagging
- **Settings** - Theme, notifications, preferences

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **State**: TanStack Query
- **Forms**: React Hook Form + Zod
- **UI**: Radix UI + Lucide Icons
- **Charts**: Recharts
- **Testing**: Vitest (unit) + Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Supabase)
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
cd basecamp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. Set up the database:
```bash
npm run db:generate
npm run db:push
# or for migrations
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Auth pages (login, register, OAuth callback)
│   ├── (dashboard)/       # Protected dashboard pages (route group)
│   │   ├── dashboard/     # Today view
│   │   ├── tasks/         # Tasks module
│   │   ├── habits/        # Habits module
│   │   ├── journal/       # Journal module
│   │   ├── finances/      # Finances module
│   │   ├── notes/         # Notes module
│   │   ├── calendar/      # Calendar module
│   │   ├── contacts/      # Contacts module
│   │   └── settings/      # Settings module
│   └── api/               # API routes
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Layout components (Sidebar, Header)
│   ├── forms/             # Form components
│   ├── dashboard/         # Dashboard-specific components
│   └── charts/            # Chart components
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── db/                # Prisma client
│   ├── utils.ts           # Utility functions
│   ├── validations/       # Zod schemas
│   └── hooks/             # Custom React hooks
├── types/                 # TypeScript types
└── hooks/                 # Shared hooks
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run unit tests
npm run test:ui          # Run tests with UI
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
```

## Database Schema

The application uses Prisma with the following main models:

- **User** - Authentication and profile
- **Project** - Task projects
- **Task** - Tasks with status, priority, due dates, recurrence
- **Habit** - Habits with frequency and targets
- **HabitEntry** - Daily habit completion logs
- **JournalEntry** - Daily journal entries with mood
- **FinanceEntry** - Income/expense transactions
- **Budget** - Budget categories and limits
- **Note** - Notes with pinning and tags
- **Contact** - Contact management
- **CalendarEvent** - Calendar events with recurrence

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
docker build -t basecamp .
docker run -p 3000:3000 basecamp
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test && npm run test:e2e`
5. Submit a pull request

## License

MIT License - feel free to use this for your own personal dashboard!