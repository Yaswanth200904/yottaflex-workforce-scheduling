import { Download, FileClock, FileText } from 'lucide-react'
import { useState } from 'react'
import { CoverageTrendChart } from '@/features/overview/components/coverage-trend-chart'
import { useGlobalSearch } from '@/components/layout/search-context'
import { Panel } from '@/components/ui/panel'
import { activeEmployees, coverageWeeks, overtimeHours, pendingApprovalCount, scheduleChanges, staffingFor, wards } from '@/data/overview'
import { percentValue } from '@/lib/utils'

export function ReportsPage() {
  const [weekId, setWeekId] = useState(coverageWeeks[0].id)
  const week = coverageWeeks.find((entry) => entry.id === weekId) ?? coverageWeeks[0]
  const previous = coverageWeeks.find((entry) => entry.id !== week.id) ?? week
  const points = week.days.map((day) => {
    const staffing = staffingFor(day, 'all')
    return {
      label: day.label,
      full: day.full,
      isToday: Boolean(day.isToday),
      assigned: staffing.assigned,
      required: staffing.required,
      coverage: percentValue(staffing.assigned, staffing.required),
    }
  })
  const totals = points.reduce((result, point) => ({
    assigned: result.assigned + point.assigned,
    required: result.required + point.required,
  }), { assigned: 0, required: 0 })
  const priorTotals = previous.days.reduce((result, day) => {
    const staffing = staffingFor(day, 'all')
    return { assigned: result.assigned + staffing.assigned, required: result.required + staffing.required }
  }, { assigned: 0, required: 0 })
  const coverage = percentValue(totals.assigned, totals.required)
  const priorCoverage = percentValue(priorTotals.assigned, priorTotals.required)
  const coverageDelta = coverage - priorCoverage

  const exportCsv = () => {
    const rows = [
      ['Ward', 'Assigned slots', 'Required slots', 'Coverage percent'],
      ...wards.map((ward) => [ward.name, ward.assigned, ward.required, percentValue(ward.assigned, ward.required).toFixed(1)]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `workforce-coverage-${week.id}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">Insights · workforce</p>
          <h1 className="mt-0.5 text-[20px] font-semibold leading-6">Reports & analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="report-week" className="sr-only">Reporting week</label>
          <select
            id="report-week"
            value={weekId}
            onChange={(event) => setWeekId(event.target.value)}
            className="h-9 max-w-[220px] rounded-[8px] border-0 bg-white px-2.5 text-[11px] text-ink focus-visible:outline-2 focus-visible:outline-primary"
          >
            {coverageWeeks.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-3 text-[11px] font-medium text-white hover:bg-primary-strong">
            <Download className="size-3.5" aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Metric label="Staffing coverage" value={`${coverage.toFixed(1)}%`} detail={`${coverageDelta >= 0 ? '+' : ''}${coverageDelta.toFixed(1)} pts vs prior week`} />
        <Metric label="Assigned shifts" value={totals.assigned.toLocaleString()} detail={`of ${totals.required.toLocaleString()} required`} />
        <Metric label="Overtime hours" value={`${overtimeHours} h`} detail="Across all wards · weekly" />
        <Metric label="Active employees" value={activeEmployees.toLocaleString()} detail={`${pendingApprovalCount} requests awaiting review`} />
      </div>

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]">
        <Panel className="min-w-0 gap-2">
          <div>
            <h2 className="text-[12.5px] font-semibold">Daily staffing coverage</h2>
            <p className="mt-0.5 text-[10.5px] text-ink/50">Filled shifts as a share of required coverage · target 95%</p>
          </div>
          <CoverageTrendChart data={points} />
          <div className="flex items-center justify-between border-t border-ink/8 pt-2 text-[10px] text-ink/50">
            <span>Week total</span>
            <span className="font-semibold tabular-nums text-ink">{totals.assigned.toLocaleString()} / {totals.required.toLocaleString()} shifts</span>
          </div>
        </Panel>

        <Panel className="min-w-0 overflow-hidden p-0">
          <div className="border-b border-ink/8 px-3 py-2.5">
            <h2 className="text-[12.5px] font-semibold">Coverage by ward</h2>
            <p className="mt-0.5 text-[10.5px] text-ink/50">Current weekly assignment snapshot</p>
          </div>
          <ul className="divide-y divide-ink/6">
            {wards.map((ward) => {
              const value = percentValue(ward.assigned, ward.required)
              return (
                <li key={ward.id} className="flex items-center gap-2.5 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-[10.5px] font-medium" title={ward.name}>{ward.name}</span>
                  <span className="text-[10px] tabular-nums text-ink/55">{ward.assigned}/{ward.required}</span>
                  <span className={`w-10 text-right text-[10px] font-semibold tabular-nums ${value >= 95 ? 'text-positive' : 'text-caution-ink'}`}>{value.toFixed(0)}%</span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
      <p className="text-[10px] text-ink/45">Demo report data. Aggregates use the sample week and are not connected to a live scheduling service.</p>
    </div>
  )
}

export function AuditPage() {
  const [actionFilter, setActionFilter] = useState('All actions')
  const { search } = useGlobalSearch()
  const query = search.trim().toLowerCase()
  const actions = ['All actions', ...new Set(scheduleChanges.map((change) => change.action))]
  const rows = scheduleChanges.filter((change) => {
    const matchesAction = actionFilter === 'All actions' || change.action === actionFilter
    const matchesSearch =
      query.length === 0 || `${change.actor} ${change.action} ${change.entity} ${change.from ?? ''} ${change.to}`.toLowerCase().includes(query)
    return matchesAction && matchesSearch
  })

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">Governance · traceability</p>
          <h1 className="mt-0.5 flex items-center gap-2 text-[20px] font-semibold leading-6">
            <FileClock className="size-4 text-primary" aria-hidden="true" />
            Audit history
          </h1>
        </div>
        <span className="rounded-full bg-ink/6 px-2.5 py-1 text-[10px] font-medium text-ink/60">{scheduleChanges.length} events in demo log</span>
      </div>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Metric label="Recorded events" value={scheduleChanges.length.toString()} detail="Available in sample log" />
        <Metric label="Actors" value={new Set(scheduleChanges.map((change) => change.actor)).size.toString()} detail="Distinct users" />
        <Metric label="Published changes" value={scheduleChanges.filter((change) => change.action.includes('Published')).length.toString()} detail="Schedule lifecycle" />
        <Metric label="Approval events" value={scheduleChanges.filter((change) => change.action.includes('approved')).length.toString()} detail="Request lifecycle" />
      </div>
      <Panel className="min-w-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 px-3 py-2.5">
          <div>
            <h2 className="text-[12.5px] font-semibold">Change log</h2>
            <p className="mt-0.5 text-[10.5px] text-ink/50">Actor, entity, timestamp, and before/after state</p>
          </div>
          <label className="flex h-8 items-center gap-1.5 rounded-[7px] bg-canvas px-2">
            <FileText className="size-3 text-ink/45" aria-hidden="true" />
            <span className="sr-only">Filter audit actions</span>
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="max-w-[170px] bg-transparent text-[10.5px] text-ink outline-none">
              {actions.map((action) => <option key={action}>{action}</option>)}
            </select>
          </label>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-hover text-[9.5px] font-semibold uppercase tracking-wide text-ink/45">
                  <th scope="col" className="px-3 py-2">Timestamp</th>
                  <th scope="col" className="px-3 py-2">Actor</th>
                  <th scope="col" className="px-3 py-2">Action and entity</th>
                  <th scope="col" className="px-3 py-2">Previous</th>
                  <th scope="col" className="px-3 py-2">New state</th>
                  <th scope="col" className="px-3 py-2">Log state</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/6">
                {rows.map((change) => (
                  <tr key={change.id} className="transition-colors hover:bg-row-hover">
                    <td className="whitespace-nowrap px-3 py-2.5 text-[10.5px] tabular-nums text-ink/60">{change.timestamp}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] font-medium">{change.actor}</td>
                    <td className="max-w-[320px] px-3 py-2.5">
                      <span className="block text-[11px] font-semibold">{change.action}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-ink/50" title={change.entity}>{change.entity}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[10.5px] text-ink/50">{change.from ?? '—'}</td>
                    <td className="px-3 py-2.5 text-[10.5px] font-medium">{change.to}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10.5px] font-medium ${change.tone === 'positive' ? 'text-positive' : 'text-ink/55'}`}>
                        {change.tone === 'positive' ? 'Confirmed' : 'Recorded'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-3 py-10 text-center text-[11px] text-ink/50">No audit events match the current search.</p>
        )}
      </Panel>
      <p className="text-[10px] text-ink/45">This demo log is illustrative and does not provide a complete or tamper-evident audit record.</p>
    </div>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Panel className="min-w-0 gap-1 p-3">
      <p className="truncate text-[10px] font-medium text-ink/55">{label}</p>
      <p className="text-[20px] font-semibold leading-6 tabular-nums">{value}</p>
      <p className="truncate text-[10px] text-ink/45">{detail}</p>
    </Panel>
  )
}
