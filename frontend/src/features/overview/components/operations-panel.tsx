import { ArrowRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApprovalBadge, ExceptionStateLabel, SeverityDot } from '@/components/ui/status-badge'
import { Panel } from '@/components/ui/panel'
import type { ApprovalRequest, SchedulingException } from '@/types/workforce'

interface OperationsPanelProps {
  exceptions: SchedulingException[]
  approvals: ApprovalRequest[]
  onSelectException: (exception: SchedulingException) => void
  onSelectApproval: (request: ApprovalRequest) => void
  clearanceLabel: string
}

export function OperationsPanel({
  exceptions,
  approvals,
  onSelectException,
  onSelectApproval,
  clearanceLabel,
}: OperationsPanelProps) {
  return (
    <Panel labelledBy="operations-heading" className="xl:h-[280px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="operations-heading" className="text-[13px] font-semibold tracking-tight">
          Operations
        </h2>
        <div className="flex items-center gap-2 text-[10.5px] tabular-nums text-ink/50">
          <span>{exceptions.length} open exceptions</span>
          <span className="h-3 w-px bg-ink/15" aria-hidden="true" />
          <span>{approvals.length} pending approvals</span>
          <span className="h-3 w-px bg-ink/15" aria-hidden="true" />
          <span>{clearanceLabel}</span>
        </div>
      </div>

      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-4 xl:flex-row xl:gap-0">
        <div className="flex min-h-0 min-w-0 flex-col xl:w-[508px] xl:shrink-0 xl:pr-3">
          <div className="flex h-5 items-center justify-between">
            <h3 className="text-[11.5px] font-semibold text-ink/80">Exceptions</h3>
            <Link
              to="/coverage"
              className="flex items-center gap-1 rounded-[4px] text-[10.5px] font-medium text-primary transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              View all
              <ArrowRight className="size-2.5" aria-hidden="true" />
            </Link>
          </div>

          <ul className="scrollbar-slim mt-1 min-h-0 flex-1 divide-y divide-ink/6 overflow-y-auto">
            {exceptions.slice(0, 4).map((exception) => (
              <li key={exception.id}>
                <button
                  type="button"
                  onClick={() => onSelectException(exception)}
                  className="group flex min-h-11 w-full items-center gap-2 rounded-[6px] px-1.5 py-1.5 text-left transition-colors duration-150 hover:bg-row-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                >
                  <SeverityDot severity={exception.severity} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium leading-4">{exception.type}</span>
                    <span className="block truncate text-[10.5px] leading-4 text-ink/55">
                      {exception.employee ? `${exception.employee} · ` : ''}
                      {exception.ward.replace(' — Intensive Care', '')} · {exception.date} · {exception.shift}
                    </span>
                  </span>
                  <ExceptionStateLabel state={exception.state} />
                  <ChevronRight
                    className="size-3 shrink-0 text-ink/25 transition-colors duration-150 group-hover:text-ink/60"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
            {exceptions.length === 0 ? (
              <li className="px-1.5 py-6 text-center text-[11.5px] text-ink/55">
                No exception matches the current filters.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-ink/8 pt-3 xl:border-l xl:border-t-0 xl:pl-3 xl:pt-0">
          <div className="flex h-5 items-center justify-between">
            <h3 className="text-[11.5px] font-semibold text-ink/80">Approvals</h3>
            <Link
              to="/leave-requests"
              className="flex items-center gap-1 rounded-[4px] text-[10.5px] font-medium text-primary transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              View all 12
              <ArrowRight className="size-2.5" aria-hidden="true" />
            </Link>
          </div>

          <ul className="scrollbar-slim mt-1 min-h-0 flex-1 divide-y divide-ink/6 overflow-y-auto">
            {approvals.map((request) => (
              <li key={request.id}>
                <button
                  type="button"
                  onClick={() => onSelectApproval(request)}
                  className="grid min-h-11 w-full grid-cols-[1fr_auto_40px] items-center gap-2 rounded-[6px] px-1.5 py-1.5 text-left transition-colors duration-150 hover:bg-row-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium leading-4">{request.title}</span>
                    <span className="block truncate text-[10.5px] leading-4 text-ink/55">{request.detail}</span>
                  </span>
                  <ApprovalBadge status={request.status} />
                  <span className="text-right text-[10.5px] tabular-nums text-ink/45">{request.submitted}</span>
                </button>
              </li>
            ))}
            {approvals.length === 0 ? (
              <li className="px-1.5 py-6 text-center text-[11.5px] text-ink/55">
                No pending request matches the current filters.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </Panel>
  )
}
