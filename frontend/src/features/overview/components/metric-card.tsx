import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  unit?: string
  caption: string
  to: string
  tone?: 'critical' | 'warning'
}

export function MetricCard({ label, value, unit, caption, to, tone }: MetricCardProps) {
  return (
    <Link
      to={to}
      className="group flex min-h-[72px] flex-col justify-center rounded-panel bg-white px-3 py-[10px] transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink/65">
          {tone ? (
            <span
              className={cn('size-1.5 rounded-full', tone === 'critical' ? 'bg-danger' : 'bg-pending')}
              aria-hidden="true"
            />
          ) : null}
          {label}
        </span>
        <ArrowUpRight
          className="size-3 shrink-0 text-ink/25 transition-colors duration-150 group-hover:text-ink/50"
          aria-hidden="true"
        />
      </div>
      <div className="mt-0.5 flex items-baseline">
        <span className="text-[22px] font-semibold leading-6 tracking-tight tabular-nums">{value}</span>
        {unit ? <span className="ml-1 text-[11.5px] font-medium text-ink/60">{unit}</span> : null}
      </div>
      <div className="mt-0.5 truncate text-[10.5px] tabular-nums text-ink/55">{caption}</div>
    </Link>
  )
}
