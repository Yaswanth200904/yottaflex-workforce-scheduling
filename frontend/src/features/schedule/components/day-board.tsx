import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { coverageKey, rotations, rotationByKey, type Coverage, type RosterEmployee, type RotationKey, type WeekDay } from '@/data/schedule'

interface DayBoardProps {
  day: WeekDay
  roster: RosterEmployee[]
  coverage: Record<string, Coverage>
  selected: { employeeId: string; dayIndex: number } | null
  dayIndex: number
  onSelectShift: (employeeId: string, dayIndex: number) => void
}

const toneByRotation: Record<RotationKey, string> = {
  day: 'bg-day text-day-ink',
  evening: 'bg-evening text-evening-ink',
  night: 'bg-night text-night-ink',
}

export function DayBoard({ day, roster, coverage, selected, dayIndex, onSelectShift }: DayBoardProps) {
  return (
    <div className="scrollbar-slim min-h-0 flex-1 overflow-auto p-3">
      <div className="grid gap-3 md:grid-cols-3">
        {rotations.map((rotation) => {
          const value = coverage[coverageKey(day.key, rotation.key)]
          const assigned = roster.filter((employee) => employee.shifts[dayIndex]?.rotation === rotation.key)
          const short = value ? value.assigned < value.required : false

          return (
            <section key={rotation.key} className="flex flex-col rounded-[8px] border border-ink/8">
              <header className="flex items-baseline justify-between gap-2 border-b border-ink/8 px-2.5 py-2">
                <div>
                  <h3 className="text-[12px] font-semibold leading-4">{rotation.label}</h3>
                  <p className="text-[10px] tabular-nums text-ink/50">
                    {rotation.start}–{rotation.end}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-[11px] font-medium tabular-nums',
                    short ? 'text-danger' : 'text-ink/60',
                  )}
                >
                  {coverage[coverageKey(day.key, rotation.key)]?.assigned ?? 0}/
                  {coverage[coverageKey(day.key, rotation.key)]?.required ?? 0}
                </span>
              </header>
              <ul className="flex-1 divide-y divide-ink/6">
                {assigned.map((employee) => {
                  const shift = employee.shifts[dayIndex]
                  const isSelected = selected?.employeeId === employee.id && selected.dayIndex === dayIndex
                  return (
                    <li key={employee.id}>
                      <button
                        type="button"
                        onClick={() => onSelectShift(employee.id, dayIndex)}
                        className={cn(
                          'flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors duration-150',
                          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
                          isSelected ? 'bg-row-hover' : 'hover:bg-hover',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold',
                            toneByRotation[rotation.key],
                          )}
                        >
                          {employee.initials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11.5px] font-medium leading-4">{employee.name}</span>
                          <span className="block truncate text-[9.5px] leading-3 text-ink/55">
                            {rotationByKey[rotation.key].start}–{rotationByKey[rotation.key].end} · {shift?.ward}
                          </span>
                        </span>
                        {shift?.conflict ? <TriangleAlert className="size-3 shrink-0 text-danger" aria-hidden="true" /> : null}
                      </button>
                    </li>
                  )
                })}
                {assigned.length === 0 ? (
                  <li className="px-2.5 py-4 text-center text-[10.5px] text-ink/45">No assignment</li>
                ) : null}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
