import { Button } from '@/components/ui/button'
import { DetailSheet } from '@/components/ui/detail-sheet'
import { ApprovalBadge } from '@/components/ui/status-badge'
import type { ApprovalRequest, ApprovalStatus } from '@/types/workforce'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-ink/45">{label}</dt>
      <dd className="mt-0.5 truncate text-[12px] font-medium text-ink" title={value}>
        {value}
      </dd>
    </div>
  )
}

interface ApprovalSheetProps {
  request: ApprovalRequest
  onOpenChange: (open: boolean) => void
  onDecide: (id: string, status: ApprovalStatus) => void
}

export function ApprovalSheet({ request, onOpenChange, onDecide }: ApprovalSheetProps) {
  const decide = (status: ApprovalStatus) => {
    onDecide(request.id, status)
    onOpenChange(false)
  }

  return (
    <DetailSheet
      open
      onOpenChange={onOpenChange}
      title={request.title}
      description={request.detail}
      footer={
        <div className="flex items-center gap-2">
          <span className="mr-auto text-[10px] leading-3.5 text-ink/45">
            Demo mode · decisions are not written to a backend
          </span>
          <Button onClick={() => decide('Rejected')} title="Reject this request">
            Reject
          </Button>
          <Button variant="primary" onClick={() => decide('Approved')} title="Approve this request">
            Approve
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-medium uppercase tracking-wide text-ink/45">
          {request.kind === 'swap' ? 'Shift swap' : 'Leave request'}
        </span>
        <ApprovalBadge status={request.status} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
        <Field label="Dates" value={request.dates} />
        <Field label="Submitted" value={request.submitted} />
        <Field label="Ward" value={request.ward} />
        <Field label="Skill" value={request.skill} />
        <Field label="Approver" value="Dana Whitcombe" />
        <Field label="Request ID" value={request.id.toUpperCase()} />
      </dl>

      <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-ink/45">Scheduling consequence</h3>
      <p className="mt-1 rounded-[6px] bg-hover px-2.5 py-2 text-[11.5px] leading-4 text-ink/70">{request.impact}</p>

      <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-ink/45">Approval history</h3>
      <ul className="mt-1.5 space-y-1.5 text-[11.5px]">
        <li className="flex items-center justify-between gap-2 border-b border-ink/6 pb-1.5">
          <span className="text-ink/70">Submitted by employee</span>
          <span className="tabular-nums text-ink/50">26 Oct 08:14</span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="text-ink/70">Awaiting manager decision</span>
          <span className="tabular-nums text-ink/50">Now</span>
        </li>
      </ul>
    </DetailSheet>
  )
}
