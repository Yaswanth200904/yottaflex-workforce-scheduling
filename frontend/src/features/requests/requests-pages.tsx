import { ArrowLeftRight, CalendarDays, Check, FileText, Search, X } from 'lucide-react'
import { useState } from 'react'
import { ApprovalBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { approvals } from '@/data/overview'
import { useGlobalSearch } from '@/components/layout/search-context'
import type { ApprovalRequest, ApprovalStatus } from '@/types/workforce'

type RequestKind = ApprovalRequest['kind']
type StatusFilter = 'All' | ApprovalStatus

const statusFilters: StatusFilter[] = ['All', 'Pending', 'Approved', 'Rejected']

export function LeaveRequestsPage() {
  return <RequestsPage kind="leave" />
}

export function ShiftSwapsPage() {
  return <RequestsPage kind="swap" />
}

function RequestsPage({ kind }: { kind: RequestKind }) {
  const [requests, setRequests] = useState(() => approvals.filter((request) => request.kind === kind))
  const [status, setStatus] = useState<StatusFilter>('Pending')
  const { search } = useGlobalSearch()
  const query = search.trim().toLowerCase()
  const isLeave = kind === 'leave'
  const Icon = isLeave ? FileText : ArrowLeftRight
  const title = isLeave ? 'Leave Requests' : 'Shift Swaps'
  const visible = requests.filter((request) => {
    const matchesStatus = status === 'All' || request.status === status
    const matchesSearch =
      query.length === 0 ||
      `${request.id} ${request.title} ${request.detail} ${request.ward} ${request.skill}`.toLowerCase().includes(query)
    return matchesStatus && matchesSearch
  })
  const pendingCount = requests.filter((request) => request.status === 'Pending').length
  const completedCount = requests.length - pendingCount

  const decide = (id: string, nextStatus: ApprovalStatus) => {
    setRequests((current) =>
      current.map((request) => (request.id === id ? { ...request, status: nextStatus } : request)),
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">Operations · approvals</p>
          <h1 className="mt-0.5 flex items-center gap-2 text-[20px] font-semibold leading-6">
            <Icon className="size-4 text-primary" aria-hidden="true" />
            {title}
          </h1>
        </div>
        <span className="rounded-full bg-caution/14 px-2.5 py-1 text-[10.5px] font-semibold text-caution-ink">
          {pendingCount} awaiting review
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Metric label="Awaiting review" value={pendingCount.toString()} tone="text-caution-ink" />
        <Metric label="Decided this session" value={completedCount.toString()} />
        <Metric label="Records in sample" value={requests.length.toString()} />
        <Metric label="Data source" value="Demo" detail="Actions are not persisted" />
      </div>

      <Panel className="min-w-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 px-3 py-2.5">
          <div>
            <h2 className="text-[12.5px] font-semibold">Request queue</h2>
            <p className="mt-0.5 text-[10.5px] text-ink/50">{visible.length} visible · {requests.length} sample records</p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-[8px] bg-canvas p-0.5" role="tablist" aria-label="Filter requests by status">
            {statusFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={status === filter}
                onClick={() => setStatus(filter)}
                className={`h-7 rounded-[6px] px-2 text-[10.5px] font-medium transition-colors ${status === filter ? 'bg-white text-ink shadow-sm' : 'text-ink/55 hover:text-ink'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {requests.filter((request) => request.status === 'Pending').length} requests awaiting review.
        </p>

        {visible.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="bg-hover text-[9.5px] font-semibold uppercase tracking-wide text-ink/45">
                  <th scope="col" className="px-3 py-2">Request</th>
                  <th scope="col" className="px-3 py-2">Ward and skill</th>
                  <th scope="col" className="px-3 py-2">Dates</th>
                  <th scope="col" className="px-3 py-2">Submitted</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/6">
                {visible.map((request) => (
                  <tr key={request.id} className="align-middle transition-colors hover:bg-row-hover">
                    <th scope="row" className="max-w-[300px] px-3 py-2.5 font-normal">
                      <span className="block truncate text-[11.5px] font-semibold text-ink">{request.title}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-ink/50" title={request.detail}>{request.detail}</span>
                      <span className="mt-0.5 block text-[9.5px] font-medium uppercase tracking-wide text-ink/40">{request.id}</span>
                    </th>
                    <td className="px-3 py-2.5">
                      <span className="block max-w-[170px] truncate text-[10.5px] font-medium" title={request.ward}>{request.ward}</span>
                      <span className="text-[10px] text-ink/50">{request.skill}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[10.5px] text-ink/70">{request.dates}</td>
                    <td className="px-3 py-2.5 text-[10.5px] tabular-nums text-ink/60">{request.submitted}</td>
                    <td className="px-3 py-2.5"><ApprovalBadge status={request.status} /></td>
                    <td className="px-3 py-2.5">
                      {request.status === 'Pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            title={`Reject ${request.id}`}
                            onClick={() => decide(request.id, 'Rejected')}
                            className="text-danger hover:bg-danger/8"
                          >
                            <X className="size-3" aria-hidden="true" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            title={`Approve ${request.id}`}
                            onClick={() => decide(request.id, 'Approved')}
                          >
                            <Check className="size-3" aria-hidden="true" />
                            Approve
                          </Button>
                        </div>
                      ) : (
                        <span className="flex justify-end text-[10px] text-ink/40">Decision recorded locally</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center px-4 text-center">
            {query ? <Search className="size-4 text-ink/35" aria-hidden="true" /> : <CalendarDays className="size-4 text-ink/35" aria-hidden="true" />}
            <p className="mt-2 text-[12px] font-medium">No requests match this view</p>
            <p className="mt-0.5 text-[10.5px] text-ink/50">Change the status filter or clear global search.</p>
          </div>
        )}
      </Panel>
    </div>
  )
}

function Metric({ label, value, detail, tone = 'text-ink' }: { label: string; value: string; detail?: string; tone?: string }) {
  return (
    <Panel className="min-w-0 gap-1 p-3">
      <p className="truncate text-[10px] font-medium text-ink/55">{label}</p>
      <p className={`text-[20px] font-semibold leading-6 tabular-nums ${tone}`}>{value}</p>
      {detail ? <p className="truncate text-[10px] text-ink/45">{detail}</p> : null}
    </Panel>
  )
}
