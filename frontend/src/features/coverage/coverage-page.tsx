import { ArrowUpRight, ShieldAlert, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Panel } from '@/components/ui/panel'
import { ExceptionStateLabel, SeverityDot } from '@/components/ui/status-badge'
import { wards, exceptions } from '@/data/overview'
import { ExceptionSheet } from '@/features/overview/components/exception-sheet'
import type { SchedulingException } from '@/types/workforce'

type ExceptionFilter = 'Open' | 'In review' | 'Resolved' | 'All'

export function CoveragePage() {
  const [filter, setFilter] = useState<ExceptionFilter>('Open')
  const [selected, setSelected] = useState<SchedulingException | null>(null)
  const [resolved, setResolved] = useState<Record<string, boolean>>({})
  const required = wards.reduce((sum, ward) => sum + ward.required, 0)
  const assigned = wards.reduce((sum, ward) => sum + ward.assigned, 0)
  const gap = required - assigned
  const exceptionRows = exceptions.filter((exception) => {
    const state = resolved[exception.id] ? 'Resolved' : exception.state
    return filter === 'All' || state === filter
  })
  const openCount = exceptions.filter((exception) => exception.state === 'Open' && !resolved[exception.id]).length

  const resolve = (id: string) => {
    setResolved((current) => ({ ...current, [id]: true }))
    setSelected(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">Operations · staffing</p>
          <h1 className="mt-0.5 flex items-center gap-2 text-[20px] font-semibold leading-6">
            <TriangleAlert className="size-4 text-caution" aria-hidden="true" />
            Coverage & exceptions
          </h1>
        </div>
        <Link to="/schedule" className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-3 text-[12px] font-medium text-white hover:bg-primary-strong">
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
          Open schedule planner
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Metric label="Filled slots" value={`${assigned.toLocaleString()} / ${required.toLocaleString()}`} detail={`${((assigned / required) * 100).toFixed(1)}% of weekly requirement`} />
        <Metric label="Open shifts" value={gap.toString()} detail="Across all wards" tone="text-caution-ink" />
        <Metric label="Open exceptions" value={openCount.toString()} detail="Needs triage" tone="text-danger" />
        <Metric label="Critical alerts" value={exceptions.filter((exception) => exception.severity === 'critical' && !resolved[exception.id]).length.toString()} detail="Immediate action" tone="text-danger" />
      </div>

      <Panel className="min-w-0 overflow-hidden p-0">
        <div className="border-b border-ink/8 px-3 py-2.5">
          <h2 className="text-[12.5px] font-semibold">Ward coverage · week of 26 Oct</h2>
          <p className="mt-0.5 text-[10.5px] text-ink/50">Required and assigned shifts across the current demo week</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[690px] border-collapse text-left">
            <thead>
              <tr className="bg-hover text-[9.5px] font-semibold uppercase tracking-wide text-ink/45">
                <th scope="col" className="px-3 py-2">Ward</th>
                <th scope="col" className="px-3 py-2">Filled</th>
                <th scope="col" className="px-3 py-2">Coverage</th>
                <th scope="col" className="px-3 py-2">Open by skill</th>
                <th scope="col" className="px-3 py-2 text-right">Planner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/6">
              {wards.map((ward) => {
                const percent = (ward.assigned / ward.required) * 100
                const short = Object.entries(ward.shortBySkill).filter(([, count]) => count > 0)
                return (
                  <tr key={ward.id} className="transition-colors hover:bg-row-hover">
                    <th scope="row" className="px-3 py-2.5 text-[11.5px] font-semibold">{ward.name}</th>
                    <td className="px-3 py-2.5 text-[10.5px] tabular-nums text-ink/65">{ward.assigned} / {ward.required}</td>
                    <td className="w-[220px] px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8" aria-hidden="true">
                          <span className={`block h-full rounded-full ${percent >= 95 ? 'bg-positive' : 'bg-caution'}`} style={{ width: `${percent}%` }} />
                        </div>
                        <span className="w-10 text-right text-[10px] tabular-nums text-ink/60">{percent.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] text-ink/60">
                      {short.length ? short.map(([skill, count]) => `${skill} ${count}`).join(' · ') : 'None'}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link to="/schedule" aria-label={`Open ${ward.name} schedule`} className="inline-flex size-7 items-center justify-center rounded-[6px] text-ink/55 hover:bg-white hover:text-primary">
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="min-w-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 px-3 py-2.5">
          <div>
            <h2 className="flex items-center gap-1.5 text-[12.5px] font-semibold">
              <ShieldAlert className="size-3.5 text-caution" aria-hidden="true" />
              Scheduling exceptions
            </h2>
            <p className="mt-0.5 text-[10.5px] text-ink/50">Select an exception to inspect validation evidence and resolve it locally.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter exceptions">
            {(['Open', 'In review', 'Resolved', 'All'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`h-7 rounded-[6px] px-2 text-[10px] font-medium transition-colors ${filter === value ? 'bg-primary text-white' : 'bg-canvas text-ink/60 hover:text-ink'}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        {exceptionRows.length ? (
          <ul className="divide-y divide-ink/6">
            {exceptionRows.map((exception) => {
              const isResolved = Boolean(resolved[exception.id])
              return (
                <li key={exception.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(exception)}
                    className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left transition-colors hover:bg-row-hover"
                  >
                    <SeverityDot severity={exception.severity} />
                    <span className="min-w-[220px] flex-1">
                      <span className="block text-[11.5px] font-semibold">{exception.type}</span>
                      <span className="mt-0.5 block text-[10px] text-ink/50">{exception.ward} · {exception.date} · {exception.shift}</span>
                    </span>
                    <span className="text-[10px] text-ink/55">{exception.employee ?? 'Unassigned'}</span>
                    <ExceptionStateLabel state={isResolved ? 'Resolved' : exception.state} />
                    <ArrowUpRight className="size-3.5 text-ink/35" aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="px-3 py-10 text-center text-[11.5px] text-ink/55">No exceptions in this view.</p>
        )}
      </Panel>

      {selected ? (
        <ExceptionSheet
          exception={selected}
          resolved={Boolean(resolved[selected.id])}
          onOpenChange={(open) => { if (!open) setSelected(null) }}
          onResolve={resolve}
        />
      ) : null}
    </div>
  )
}

function Metric({ label, value, detail, tone = 'text-ink' }: { label: string; value: string; detail: string; tone?: string }) {
  return (
    <Panel className="min-w-0 gap-1 p-3">
      <p className="truncate text-[10px] font-medium text-ink/55">{label}</p>
      <p className={`text-[20px] font-semibold leading-6 tabular-nums ${tone}`}>{value}</p>
      <p className="truncate text-[10px] text-ink/45">{detail}</p>
    </Panel>
  )
}
