import { Link } from 'react-router-dom'
import { Button, buttonStyles } from '@/components/ui/button'
import { DetailSheet } from '@/components/ui/detail-sheet'
import { SeverityDot, ValidationResult } from '@/components/ui/status-badge'
import type { SchedulingException } from '@/types/workforce'

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

interface ExceptionSheetProps {
  exception: SchedulingException
  resolved: boolean
  onOpenChange: (open: boolean) => void
  onResolve: (id: string) => void
}

export function ExceptionSheet({ exception, resolved, onOpenChange, onResolve }: ExceptionSheetProps) {
  return (
    <DetailSheet
      open
      onOpenChange={onOpenChange}
      title={exception.type}
      description={`${exception.ward} · ${exception.date} · ${exception.shift}`}
      footer={
        <div className="flex items-center gap-2">
          <Link to="/schedule" className={buttonStyles({ className: 'ml-auto' })}>
            Reassign shift
          </Link>
          <Button
            variant="primary"
            onClick={() => onResolve(exception.id)}
            disabled={resolved}
            title={resolved ? 'This exception is already resolved' : 'Mark this exception resolved'}
          >
            {resolved ? 'Resolved' : 'Mark resolved'}
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-2">
        <SeverityDot severity={exception.severity} withLabel />
        <span className="ml-auto rounded-full bg-ink/6 px-2 py-0.5 text-[10px] font-semibold text-ink/65">
          {exception.state}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
        <Field label="Employee" value={exception.employee ?? 'Unassigned'} />
        <Field label="Skill" value={exception.skill} />
        <Field label="Ward" value={exception.ward} />
        <Field label="Assignment" value={`${exception.date} · ${exception.shift}`} />
      </dl>

      <p className="mt-4 rounded-[6px] bg-hover px-2.5 py-2 text-[11.5px] leading-4 text-ink/70">{exception.detail}</p>

      <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-ink/45">Validation evidence</h3>
      <ul className="mt-1.5 divide-y divide-ink/6 rounded-[6px] border border-ink/8">
        {exception.evidence.map((row) => (
          <li key={row.rule} className="px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-medium">{row.rule}</span>
              <ValidationResult result={row.result} />
            </div>
            <div className="mt-0.5 text-[10.5px] tabular-nums text-ink/55">
              Configured {row.configured} · Actual {row.actual}
            </div>
          </li>
        ))}
      </ul>

      <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-ink/45">Recommended action</h3>
      <p className="mt-1 text-[11.5px] leading-4 text-ink/70">{exception.recommendation}</p>
    </DetailSheet>
  )
}
