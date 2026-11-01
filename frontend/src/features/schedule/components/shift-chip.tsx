import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { rotationByKey, type RosterShift, type RotationKey } from '@/data/schedule'

const toneByRotation: Record<RotationKey, string> = {
  day: 'bg-day text-day-ink',
  evening: 'bg-evening text-evening-ink',
  night: 'bg-night text-night-ink',
}

interface ShiftChipProps {
  shift: RosterShift
  selected?: boolean
  onClick: () => void
  label: string
}

export function ShiftChip({ shift, selected, onClick, label }: ShiftChipProps) {
  const rotation = rotationByKey[shift.rotation]
  const title = shift.conflict ? `${label} · conflict flagged` : label

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={title}
      title={title}
      className={cn(
        'relative flex h-full w-full flex-col justify-center rounded-[6px] px-1.5 py-1 text-left transition-colors duration-150',
        toneByRotation[shift.rotation],
        'hover:brightness-[0.97] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
        shift.conflict && 'ring-1 ring-inset ring-danger/55',
        selected && 'outline outline-2 -outline-offset-2 outline-primary',
      )}
    >
      <span className="flex items-center gap-1 truncate text-[11.5px] font-medium leading-4">
        {shift.leaveApproved ? 'Leave approved' : rotation.label}
        {shift.duplicate ? (
          <span className="rounded-full bg-white/70 px-1 text-[9px] font-semibold leading-3">+{shift.duplicate}</span>
        ) : null}
      </span>
      <span className="truncate text-[9.5px] leading-3 tabular-nums opacity-75">
        {shift.leaveApproved ? `${rotation.label} ${rotation.start}–${rotation.end}` : `${rotation.start}–${rotation.end}`}
      </span>
      {shift.conflict ? (
        <TriangleAlert className="absolute right-1.5 top-1.5 size-3 text-danger" aria-hidden="true" />
      ) : null}
    </button>
  )
}
