import { useState } from 'react'
import { ApprovalBadge, ExceptionStateLabel, SeverityDot } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import type { ApprovalRequest, SchedulingException, Severity } from '@/types/workforce'

export type SeverityFilter = Severity | 'all'

interface ReviewQueueProps {
  exceptions: SchedulingException[]
  approvals: ApprovalRequest[]
  activeExceptionId: string | null
  severity: SeverityFilter
  onSeverityChange: (value: SeverityFilter) => void
  onSelectException: (exception: SchedulingException) => void
  onSelectApproval: (request: ApprovalRequest) => void
}

const severityGroups: Array<{ key: Severity; label: string }> = [
  { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
]

export function ReviewQueue({
  exceptions,
  approvals,
  activeExceptionId,
  severity,
  onSeverityChange,
  onSelectException,
  onSelectApproval,
}: ReviewQueueProps) {
  const [tab, setTab] = useState<'exceptions' | 'requests'>('exceptions')
  const visible = severity === 'all' ? exceptions : exceptions.filter((item) => item.severity === severity)

  return (
    <section
      aria-labelledby="queue-heading"
      className="flex min-h-0 shrink-0 flex-col overflow-hidden rounded-panel bg-white shadow-panel xl:w-[300px]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-ink/8 px-3 py-2.5">
        <h2 id="queue-heading" className="text-[13px] font-semibold tracking-tight">
          Review queue
        </h2>
        <span className="text-[10.5px] tabular-nums text-ink/50">{exceptions.length} unresolved</span>
      </div>

      <div role="tablist" aria-label="Queue type" className="flex gap-1 px-3 pt-2">
        {(['exceptions', 'requests'] as const).map((key) => {
          const count = key === 'exceptions' ? exceptions.length : approvals.length
          const label = key === 'exceptions' ? 'Exceptions' : 'Requests'
          return (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[11.5px] transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                tab === key ? 'bg-ink/8 font-semibold text-ink' : 'text-ink/60 hover:bg-hover',
              )}
            >
              {label}
              <span className="rounded-full bg-ink/10 px-1.5 text-[10px] font-semibold tabular-nums">{count}</span>
            </button>
          )
        })}
      </div>

      {tab === 'exceptions' ? (
        <div className="flex flex-wrap gap-1 px-3 py-2">
          <button
            type="button"
            onClick={() => onSeverityChange('all')}
            aria-pressed={severity === 'all'}
            className={cn(
              'rounded-full px-2 py-0.5 text-[10.5px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              severity === 'all' ? 'bg-ink text-canvas' : 'bg-ink/6 text-ink/65 hover:bg-ink/10',
            )}
          >
            All {exceptions.length}
          </button>
          {severityGroups.map((group) => {
            const count = exceptions.filter((item) => item.severity === group.key).length
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => onSeverityChange(group.key)}
                aria-pressed={severity === group.key}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10.5px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  severity === group.key ? 'bg-ink text-canvas' : 'bg-ink/6 text-ink/65 hover:bg-ink/10',
                )}
              >
                {group.label} {count}
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto pb-2">
        {tab === 'exceptions' ? (
          severityGroups.map((group) => {
            const items = visible.filter((item) => item.severity === group.key)
            if (items.length === 0) return null
            return (
              <div key={group.key}>
                <div className="flex items-center gap-1.5 px-3 pb-1 pt-2">
                  <span className="text-[9.5px] font-semibold uppercase tracking-wider text-ink/45">{group.label}</span>
                  <span className="text-[9.5px] tabular-nums text-ink/40">{items.length}</span>
                  <span className="ml-1 h-px flex-1 bg-ink/8" aria-hidden="true" />
                </div>
                <ul>
                  {items.map((exception) => {
                    const active = exception.id === activeExceptionId
                    return (
                      <li key={exception.id}>
                        <button
                          type="button"
                          onClick={() => onSelectException(exception)}
                          className={cn(
                            'flex w-full items-start gap-1.5 border-l-2 px-3 py-2 text-left transition-colors duration-150',
                            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
                            active ? 'border-primary bg-row-hover' : 'border-transparent hover:bg-hover',
                          )}
                        >
                          <span className="mt-1">
                            <SeverityDot severity={exception.severity} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-medium leading-4">{exception.type}</span>
                            <span className="block truncate text-[10.5px] leading-4 text-ink/55">
                              {exception.employee ?? exception.ward.replace(' — Intensive Care', '')} · {exception.date} ·{' '}
                              {exception.shift}
                            </span>
                          </span>
                          <ExceptionStateLabel state={exception.state} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })
        ) : (
          <ul className="mt-1">
            {approvals.map((request) => (
              <li key={request.id}>
                <button
                  type="button"
                  onClick={() => onSelectApproval(request)}
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-4">{request.title}</span>
                    <ApprovalBadge status={request.status} />
                  </span>
                  <span className="flex items-center justify-between gap-2 text-[10.5px] leading-4 text-ink/55">
                    <span className="truncate">{request.detail}</span>
                    <span className="shrink-0 tabular-nums">{request.submitted}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
