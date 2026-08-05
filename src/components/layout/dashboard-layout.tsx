'use client'

import { ReactNode, useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) setSidebarCollapsed(JSON.parse(saved))
  }, [])

  const toggleSidebar = () => {
    const newValue = !sidebarCollapsed
    setSidebarCollapsed(newValue)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newValue))
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-background" />
      </div>
    )
  }

  return (
<div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <Header sidebarCollapsed={sidebarCollapsed} onMobileMenuToggle={() => setMobileMenuOpen(true)} />
      <main
        className={cn(
          'min-h-screen transition-all duration-300 pt-16',
          'ml-0 lg:ml-16',
          !sidebarCollapsed && 'lg:ml-64'
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-overlay">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} mobile />
        </div>
      )}

  <Toaster />
</div>
  )
}