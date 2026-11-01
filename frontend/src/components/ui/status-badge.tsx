import { cn } from '@/lib/utils'
import type { ApprovalStatus, ExceptionState, Severity } from '@/types/workforce'

const approvalStyles: Record<ApprovalStatus, string> = {
  Pending: 'bg-pending text-ink',
  Approved: 'bg-positive/12 text-positive',
  Rejected: 'bg-danger/12 text-danger',
  'Conflict flagged': 'bg-caution/14 text-caution-ink',
}

export function ApprovalBadge({ status, className }: { status: ApprovalStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[9.5px] font-semibold leading-3',
        approvalStyles[status],
        className,
      )}
    >
      {status}
    </span>
  )
}

const severityColor: Record<Severity, { dot: string; label: string }> = {
  critical: { dot: 'bg-danger', label: 'Critical' },
  high: { dot: 'bg-caution', label: 'High' },
  medium: { dot: 'bg-pending', label: 'Medium' },
  low: { dot: 'bg-ink/30', label: 'Low' },
}

export function SeverityDot({ severity, withLabel = false }: { severity: Severity; withLabel?: boolean }) {
  const tone = severityColor[severity]
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <span className={cn('size-2 shrink-0 rounded-full', tone.dot)} aria-hidden="true" />
      {withLabel ? <span className="text-[10.5px] font-medium text-ink/60">{tone.label}</span> : null}
      <span className="sr-only">{tone.label} severity</span>
    </span>
  )
}

const stateStyles: Record<ExceptionState, string> = {
  Open: 'text-danger',
  'In review': 'text-ink/60',
  Resolved: 'text-positive',
}

export function ExceptionStateLabel({ state }: { state: ExceptionState }) {
  return <span className={cn('shrink-0 text-[10.5px] font-medium', stateStyles[state])}>{state}</span>
}

export function ValidationResult({ result }: { result: 'Passed' | 'Failed' | 'Not checked' }) {
  const styles =
    result === 'Passed'
      ? 'bg-positive/12 text-positive'
      : result === 'Failed'
        ? 'bg-danger/12 text-danger'
        : 'bg-ink/8 text-ink/60'

  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[10px] font-semibold leading-4', styles)}>
      {result}
    </span>
  )
}
