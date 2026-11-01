import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, ChevronsUpDown, Menu, Search, ShieldCheck, TriangleAlert, CalendarCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { IconButton } from '@/components/ui/icon-button'
import { useGlobalSearch } from '@/components/layout/search-context'

const notifications = [
  {
    id: 'n1',
    icon: TriangleAlert,
    title: 'Required skill absent · Charge RN',
    detail: 'ICU · Sat 31 Oct Night',
    time: '08:41',
    tone: 'text-caution',
  },
  {
    id: 'n2',
    icon: CalendarCheck,
    title: 'Leave approved',
    detail: 'Nkechi Adeyemi · Fri 30 Oct Night',
    time: '17:03',
    tone: 'text-positive',
  },
  {
    id: 'n3',
    icon: ShieldCheck,
    title: 'Schedule published',
    detail: 'ICU · week 26 Oct – 1 Nov',
    time: '09:12',
    tone: 'text-ink/45',
  },
]

export function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { search, setSearch } = useGlobalSearch()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-ink/10 bg-white px-4 sm:px-5">
      <IconButton label="Open navigation" className="lg:hidden" onClick={onOpenMobileNav}>
        <Menu className="size-4.5" aria-hidden="true" />
      </IconButton>

      <div className="relative flex w-full max-w-[340px] items-center">
        <label htmlFor="global-search" className="sr-only">
          Search employees, wards or shifts
        </label>
        <Search className="pointer-events-none absolute left-2.5 size-3.5 text-ink/45" aria-hidden="true" />
        <input
          id="global-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search employees, wards or shifts"
          autoComplete="off"
          className="h-9 w-full rounded-[8px] border border-transparent bg-canvas pl-8 pr-3 text-[12.5px] text-ink placeholder:text-ink/45 transition-colors duration-150 focus:border-primary/35 focus:bg-white"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Notifications, 6 unread"
              title="Notifications"
              className="relative flex size-9 items-center justify-center rounded-[8px] text-ink/70 transition-colors duration-150 hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Bell className="size-4.5" aria-hidden="true" />
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9.5px] font-semibold tabular-nums text-canvas">
                6
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-[320px] rounded-[8px] border border-ink/10 bg-white p-1 shadow-[0_18px_40px_-24px_rgba(17,41,107,0.45)]"
            >
              <DropdownMenu.Label className="px-2 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink/45">
                Notifications
              </DropdownMenu.Label>
              {notifications.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenu.Item
                    key={item.id}
                    className="flex cursor-pointer items-start gap-2 rounded-[6px] px-2 py-2 outline-none transition-colors duration-150 data-[highlighted]:bg-row-hover"
                  >
                    <Icon className={`mt-0.5 size-3.5 shrink-0 ${item.tone}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium leading-4">{item.title}</span>
                      <span className="block truncate text-[10.5px] leading-4 text-ink/55">{item.detail}</span>
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-ink/45">{item.time}</span>
                  </DropdownMenu.Item>
                )
              })}
              <DropdownMenu.Separator className="my-1 h-px bg-ink/8" />
              <DropdownMenu.Item asChild>
                <Link
                  to="/coverage"
                  className="flex h-8 cursor-pointer items-center rounded-[6px] px-2 text-[12px] font-medium text-primary outline-none transition-colors duration-150 hover:underline data-[highlighted]:bg-row-hover"
                >
                  Open exception centre
                </Link>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <div className="mx-1 hidden h-5 w-px bg-ink/10 sm:block" />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Account menu for Dana Whitcombe"
              title="Account menu"
              className="flex items-center gap-2 rounded-[8px] py-1 pl-1 pr-1.5 transition-colors duration-150 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink/10 text-[10px] font-semibold text-ink"
                aria-hidden="true"
              >
                DW
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-[12px] font-medium leading-4">Dana Whitcombe</span>
                <span className="block text-[10.5px] leading-3.5 text-ink/55">Staffing Manager</span>
              </span>
              <ChevronsUpDown className="hidden size-3 text-ink/45 sm:block" aria-hidden="true" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-[220px] rounded-[8px] border border-ink/10 bg-white p-1 shadow-[0_18px_40px_-24px_rgba(17,41,107,0.45)]"
            >
              <DropdownMenu.Label className="px-2 pb-1 pt-1.5 text-[11px] text-ink/55">
                Dana Whitcombe · Staffing Manager
              </DropdownMenu.Label>
              <DropdownMenu.Item asChild>
                <Link
                  to="/settings"
                  className="flex h-8 cursor-pointer items-center rounded-[6px] px-2 text-[12.5px] outline-none transition-colors duration-150 data-[highlighted]:bg-row-hover"
                >
                  Account and ward settings
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  to="/audit"
                  className="flex h-8 cursor-pointer items-center rounded-[6px] px-2 text-[12.5px] outline-none transition-colors duration-150 data-[highlighted]:bg-row-hover"
                >
                  My audit history
                </Link>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
