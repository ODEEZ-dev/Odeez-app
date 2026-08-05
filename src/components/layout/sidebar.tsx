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
  mobile?: boolean
}

export function Sidebar({ collapsed, onToggle, mobile = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProviderComp>
      <aside
        className={cn(
          'fixed left-0 top-0 z-sidebar h-screen border-r border-black/10 bg-[#20242a] text-white transition-all duration-300 flex flex-col',
          collapsed ? 'w-16' : 'w-64',
          mobile ? 'flex' : 'hidden md:flex'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-20 items-center justify-between px-4 border-b border-white/10">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-3 font-semibold text-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4c94f] text-[#20242a] shadow-[0_0_0_4px_rgba(244,201,79,0.12)]">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <span className="tracking-tight text-white">Odeez</span>
            </Link>
          )}
          <TooltipRoot>
            <TooltipTriggerComp asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-9 w-9 text-white/60 hover:bg-white/10 hover:text-white', collapsed && !mobile && 'mx-auto', mobile && 'ml-auto')}
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
                          'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-[#f4c94f] text-[#20242a] shadow-[0_8px_20px_-12px_rgba(244,201,79,0.8)]'
                            : 'text-white/55 hover:bg-white/10 hover:text-white',
                          collapsed && 'justify-center'
                        )}
                        aria-current={isActive ? 'page' : undefined}
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
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-[#f4c94f] text-[#20242a] shadow-[0_8px_20px_-12px_rgba(244,201,79,0.8)]'
                        : 'text-white/55 hover:bg-white/10 hover:text-white',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                )}
              </TooltipRoot>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className={cn('rounded-xl bg-white/5 p-3 text-center', collapsed && 'px-0')}>
            {!collapsed && (
              <p className="text-xs text-white/45">
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