import * as Dialog from '@radix-ui/react-dialog'
import { Activity, PanelLeft } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navItems } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

interface SidebarContentProps {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
  showToggle?: boolean
}

function SidebarContent({ collapsed, onToggle, onNavigate, showToggle = true }: SidebarContentProps) {
  return (
    <>
      <div>
        <div className={cn('flex h-14 items-center gap-2 pr-1.5', collapsed ? 'justify-center pl-0' : 'pl-3')}>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-canvas text-ink">
            <Activity className="size-4" aria-hidden="true" />
          </div>
          {collapsed ? null : (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold leading-4 tracking-tight">WorkforceOS</div>
                <div className="truncate text-[10.5px] leading-4 text-canvas/60">Northgate Health</div>
              </div>
              {showToggle ? (
                <button
                  type="button"
                  onClick={onToggle}
                  aria-label="Collapse navigation"
                  title="Collapse navigation"
                  className="flex size-6 shrink-0 items-center justify-center rounded-[5px] text-canvas/60 transition-colors duration-150 hover:bg-white/10 hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-canvas"
                >
                  <PanelLeft className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </>
          )}
        </div>

        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Expand navigation"
            title="Expand navigation"
            className="mx-auto mt-1 flex size-8 items-center justify-center rounded-[6px] text-canvas/60 transition-colors duration-150 hover:bg-white/10 hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas"
          >
            <PanelLeft className="size-3.5 rotate-180" aria-hidden="true" />
          </button>
        ) : null}

        <nav aria-label="Main" className="mt-1 flex flex-col gap-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex h-9 items-center gap-2.5 rounded-[6px] px-2.5 text-[13px] transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas',
                    isActive
                      ? 'bg-[#1E3A74] font-medium text-white'
                      : 'text-canvas/75 hover:bg-white/10 hover:text-canvas',
                    collapsed && 'justify-center px-0',
                  )
                }
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {collapsed ? null : <span className="truncate">{item.label}</span>}
                {collapsed || !item.badge ? null : (
                  <span
                    className={cn(
                      'ml-auto rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                      item.badgeTone === 'alert' ? 'bg-pending text-ink' : 'bg-white/15 text-canvas',
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="p-2">
        {collapsed ? (
          <div
            className="flex justify-center py-1.5"
            title="All systems operational · Payroll sync 09:41"
          >
            <span className="size-1.5 rounded-full bg-online" aria-hidden="true" />
            <span className="sr-only">All systems operational</span>
          </div>
        ) : (
          <div className="rounded-[8px] bg-white/10 px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 shrink-0 rounded-full bg-online" aria-hidden="true" />
              <span className="truncate text-[11px] font-medium">All systems operational</span>
            </div>
            <div className="mt-0.5 pl-3 text-[10.5px] tabular-nums text-canvas/55">Payroll sync 09:41</div>
          </div>
        )}
      </div>
    </>
  )
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          'hidden shrink-0 flex-col justify-between bg-ink text-canvas transition-[width] duration-150 lg:flex',
          collapsed ? 'w-[68px]' : 'w-[184px]',
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggleCollapsed} />
      </aside>

      <Dialog.Root open={mobileOpen} onOpenChange={(open) => (open ? undefined : onCloseMobile())}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-[#0B1B33]/40 lg:hidden" />
          <Dialog.Content
            className="fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col justify-between bg-ink text-canvas lg:hidden"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">WorkforceOS navigation</Dialog.Title>
            <SidebarContent collapsed={false} onToggle={onCloseMobile} onNavigate={onCloseMobile} showToggle={false} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
