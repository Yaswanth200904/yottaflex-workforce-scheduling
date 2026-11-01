import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Panel } from '@/components/ui/panel'
import { holidays } from '@/data/overview'
import { cn } from '@/lib/utils'

export function HolidaysCard({ className }: { className?: string }) {
  return (
    <Panel labelledBy="holidays-heading" className={cn('xl:h-[208px]', className)}>
      <div className="flex items-center justify-between">
        <h2 id="holidays-heading" className="text-[12.5px] font-semibold tracking-tight">
          Public holidays
        </h2>
        <Link
          to="/settings"
          className="flex items-center gap-1 rounded-[5px] py-0.5 text-[11px] font-medium text-primary transition-colors duration-150 hover:text-primary-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Calendar
          <ArrowUpRight className="size-2.5" aria-hidden="true" />
        </Link>
      </div>

      <ul className="mt-1 divide-y divide-ink/8">
        {holidays.map((holiday) => (
          <li key={holiday.name}>
            <div className="flex items-center gap-2.5 py-2.5">
              <div className="flex h-10 w-9 shrink-0 flex-col items-center justify-center rounded-[6px] bg-canvas">
                <span className="text-[9px] font-semibold uppercase leading-3 text-ink/55">{holiday.month}</span>
                <span className="text-[14px] font-semibold leading-4 tabular-nums">{holiday.day}</span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-medium leading-4">{holiday.name}</div>
                <div className="text-[10.5px] leading-4 text-ink/55">
                  {holiday.weekday} · {holiday.jurisdiction}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-auto text-[10.5px] tabular-nums text-ink/50">2 holidays in the next 60 days</p>
    </Panel>
  )
}
