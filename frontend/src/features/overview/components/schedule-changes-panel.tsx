import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Panel } from '@/components/ui/panel'
import { scheduleChanges } from '@/data/overview'

export function ScheduleChangesPanel() {
  return (
    <Panel labelledBy="changes-heading" className="xl:h-[144px]">
      <div className="flex items-center justify-between">
        <h2 id="changes-heading" className="text-[13px] font-semibold tracking-tight">
          Recent schedule changes
        </h2>
        <Link
          to="/audit"
          className="flex items-center gap-1 rounded-[4px] text-[11px] font-medium text-primary transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Audit history
          <ArrowUpRight className="size-2.5" aria-hidden="true" />
        </Link>
      </div>

      <ul className="mt-1 divide-y divide-ink/6">
        {scheduleChanges.map((change) => (
          <li
            key={change.id}
            className="grid min-h-10 grid-cols-[74px_1fr] items-center gap-x-3 gap-y-0.5 py-2 text-[11.5px] md:grid-cols-[74px_126px_150px_1fr_auto] md:gap-3 md:py-0"
          >
            <span className="tabular-nums text-ink/55">{change.timestamp}</span>
            <span className="truncate font-medium">{change.actor}</span>
            <span className="text-ink/70">{change.action}</span>
            <span className="col-span-2 truncate text-ink/70 md:col-span-1">{change.entity}</span>
            <span className="col-span-2 flex items-center gap-1 tabular-nums text-ink/45 md:col-span-1">
              {change.from ? (
                <>
                  <span>{change.from}</span>
                  <ArrowRight className="size-2.5" aria-hidden="true" />
                </>
              ) : null}
              <span className={change.tone === 'positive' ? 'font-medium text-positive' : 'font-medium text-ink/75'}>
                {change.to}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
