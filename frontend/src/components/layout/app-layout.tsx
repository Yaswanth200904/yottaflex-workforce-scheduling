import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SearchProvider } from '@/components/layout/search-context'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <SearchProvider>
      <div className="flex h-full min-h-screen bg-canvas text-ink">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
          <main id="main" className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4 sm:px-5">
            <Outlet />
          </main>
        </div>
      </div>
    </SearchProvider>
  )
}
