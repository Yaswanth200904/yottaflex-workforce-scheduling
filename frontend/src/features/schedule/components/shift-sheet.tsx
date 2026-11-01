import { Button } from '@/components/ui/button'
import { DetailSheet } from '@/components/ui/detail-sheet'
import { ValidationResult } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import { rotationByKey, type RosterEmployee, type RosterShift, type WeekDay } from '@/data/schedule'
import type { ValidationRow } from '@/types/workforce'

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

interface ShiftSheetProps {
  employee: RosterEmployee
  day: WeekDay
  shift: RosterShift
  evidence: ValidationRow[]
  eligible: RosterEmployee[]
  onOpenChange: (open: boolean) => void
  onReassign: (targetId: string) => void
  onCancelShift: () => void
}

export function ShiftSheet({
  employee,
  day,
  shift,
  evidence,
  eligible,
  onOpenChange,
  onReassign,
  onCancelShift,
}: ShiftSheetProps) {
  const rotation = rotationByKey[shift.rotation]
  const hours = 8

  return (
    <DetailSheet
      open
      onOpenChange={onOpenChange}
      title={`${employee.name} · ${rotation.label}`}
      description={`${day.weekday} ${day.short} · ICU · ${rotation.start}–${rotation.end}`}
      footer={
        <div className="flex items-center gap-2">
          <Button
            className="mr-auto text-danger hover:bg-danger/8"
            onClick={onCancelShift}
            title="Remove this assignment from the draft roster"
          >
            Cancel shift
          </Button>
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      }
    >
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        <Field label="Employee" value={employee.name} />
        <Field label="Employee ID" value={employee.employeeId} />
        <Field label="Ward" value="ICU — Intensive Care" />
        <Field label="Scheduled hours" value={`${employee.scheduledHours} / ${employee.contractHours} contract`} />
        <Field label="Assigned skills" value={employee.skills.join(', ')} />
        <Field label="Shift hours" value={`${hours}.0 h`} />
      </dl>

      <div className="mt-3 flex items-center gap-2 rounded-[6px] bg-hover px-2.5 py-2">
        <span className="text-[11px] text-ink/70">
          {shift.conflict ? 'This assignment fails at least one rule' : 'All configured rules pass for this assignment'}
        </span>
        <span
          className={cn(
            'ml-auto rounded-full px-1.5 py-px text-[10px] font-semibold',
            shift.conflict ? 'bg-danger/12 text-danger' : 'bg-positive/12 text-positive',
          )}
        >
          {shift.conflict ? 'Invalid' : 'Eligible'}
        </span>
      </div>

      <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-ink/45">Validation</h3>
      <ul className="mt-1.5 divide-y divide-ink/6 rounded-[6px] border border-ink/8">
        {evidence.map((row) => (
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

      <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-ink/45">Reassign to</h3>
      {eligible.length === 0 ? (
        <p className="mt-1 text-[11.5px] text-ink/60">No eligible employee is off duty on this date.</p>
      ) : (
        <ul className="mt-1.5 divide-y divide-ink/6 rounded-[6px] border border-ink/8">
          {eligible.map((candidate) => (
            <li key={candidate.id} className="flex items-center gap-2 px-2.5 py-1.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink/8 text-[9px] font-semibold text-ink/70">
                {candidate.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11.5px] font-medium leading-4">{candidate.name}</span>
                <span className="block truncate text-[9.5px] leading-3 text-ink/55">
                  {candidate.contractHours - candidate.scheduledHours} h available
                </span>
              </span>
              <Button size="sm" onClick={() => onReassign(candidate.id)} title={`Assign this shift to ${candidate.name}`}>
                Assign
              </Button>
            </li>
          ))}
        </ul>
      )}
    </DetailSheet>
  )
}
