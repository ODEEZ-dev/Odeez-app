'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Target,
  BookOpen,
  DollarSign,
  StickyNote,
  Calendar,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

const TooltipRoot = TooltipPrimitive.Root
const TooltipTriggerComp = TooltipPrimitive.Trigger
const TooltipContentComp = TooltipPrimitive.Content
const TooltipProviderComp = TooltipPrimitive.Provider

const navigation = [
  { name: 'Today', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Habits', href: '/dashboard/habits', icon: Target },
  { name: 'Journal', href: '/dashboard/journal', icon: BookOpen },
  { name: 'Finances', href: '/dashboard/finances', icon: DollarSign },
  { name: 'Notes', href: '/dashboard/notes', icon: StickyNote },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
] as const

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
  mobile?: boolean
}

export function Sidebar({ collapsed, onToggle, onNavigate, mobile = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProviderComp>
      <aside
        className={cn(
          'fixed left-0 top-0 z-sidebar h-screen border-r bg-card transition-all duration-300 flex flex-col',
          collapsed ? 'w-16' : 'w-64',
          mobile
            ? 'flex w-[min(18rem,calc(100vw-1.5rem))] rounded-r-3xl shadow-2xl'
            : 'hidden md:flex'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="tracking-tight">Odeez</span>
            </Link>
          )}
          <TooltipRoot>
            <TooltipTriggerComp asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-9 w-9', collapsed && !mobile && 'mx-auto', mobile && 'ml-auto')}
                onClick={onToggle}
                aria-label={mobile ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {mobile ? <X className="h-5 w-5" /> : collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </Button>
            </TooltipTriggerComp>
            {!mobile && (
              <TooltipContentComp side="right" align="center">
                {collapsed ? 'Expand' : 'Collapse'}
              </TooltipContentComp>
            )}
          </TooltipRoot>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1" aria-label="Navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <TooltipRoot key={item.name}>
                {collapsed ? (
                  <>
                    <TooltipTriggerComp asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                          collapsed && 'justify-center'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={onNavigate}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      </Link>
                    </TooltipTriggerComp>
                    <TooltipContentComp side="right" align="center">
                      {item.name}
                    </TooltipContentComp>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                )}
              </TooltipRoot>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className={cn('rounded-2xl p-3 text-center', collapsed && 'px-0')}>
            {!collapsed && (
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd> to search
              </p>
            )}
            {collapsed && (
              <TooltipRoot>
                <TooltipTriggerComp asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTriggerComp>
                <TooltipContentComp side="right">Expand menu</TooltipContentComp>
              </TooltipRoot>
            )}
          </div>
        </div>
</aside>
    </TooltipProviderComp>
  )
}