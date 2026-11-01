import { cn } from '@/lib/utils'
import { ShiftChip } from '@/features/schedule/components/shift-chip'
import { coverageKey, rotations, type Coverage, type RosterEmployee, type WeekDay } from '@/data/schedule'

interface RosterGridProps {
  days: WeekDay[]
  roster: RosterEmployee[]
  coverage: Record<string, Coverage>
  selected: { employeeId: string; dayIndex: number } | null
  onSelectShift: (employeeId: string, dayIndex: number) => void
  annotations?: Record<string, string>
}

const gridTemplate = '184px repeat(7, minmax(84px, 1fr))'

export function RosterGrid({ days, roster, coverage, selected, onSelectShift, annotations = {} }: RosterGridProps) {
  const totalAssigned = days.reduce(
    (sum, day) => sum + rotations.reduce((inner, rotation) => inner + (coverage[coverageKey(day.key, rotation.key)]?.assigned ?? 0), 0),
    0,
  )
  const totalRequired = days.reduce(
    (sum, day) => sum + rotations.reduce((inner, rotation) => inner + (coverage[coverageKey(day.key, rotation.key)]?.required ?? 0), 0),
    0,
  )
  const totalPercent = totalRequired === 0 ? '0.0' : ((totalAssigned / totalRequired) * 100).toFixed(1)

  return (
    <div className="scrollbar-slim min-h-0 flex-1 overflow-auto">
      <div className="min-w-[820px]">
        <div
          className="sticky top-0 z-20 grid h-11 items-stretch border-b border-ink/10 bg-white"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="sticky left-0 z-30 flex items-center justify-between border-r border-ink/10 bg-white px-3">
            <span className="text-[11px] font-medium text-ink/50">Employee</span>
            <span className="text-[10px] tabular-nums text-ink/40">{roster.length} staff</span>
          </div>
          {days.map((day) => (
            <div
              key={day.key}
              className={cn(
                'flex flex-col items-center justify-center border-r border-ink/6 last:border-r-0',
                day.isToday && 'bg-ink/4',
              )}
            >
              <span className={cn('text-[11px] font-medium leading-4', day.isToday ? 'text-ink' : 'text-ink/70')}>
                {day.weekday}
              </span>
              <span className="text-[10px] leading-3 tabular-nums text-ink/50">{day.short}</span>
            </div>
          ))}
        </div>

        {roster.map((employee) => (
          <div
            key={employee.id}
            className="grid h-[52px] items-stretch border-b border-ink/6 hover:bg-hover"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="sticky left-0 z-10 flex items-center gap-2 border-r border-ink/10 bg-white px-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink/8 text-[10px] font-semibold text-ink/75">
                {employee.initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-medium leading-4">{employee.name}</span>
                <span className="block truncate text-[10px] leading-3.5 text-ink/55">{employee.role}</span>
              </span>
            </div>
            {days.map((day, dayIndex) => {
              const shift = employee.shifts[dayIndex]
              const isSelected = selected?.employeeId === employee.id && selected.dayIndex === dayIndex
              return (
                <div key={day.key} className="border-r border-ink/6 p-1 last:border-r-0">
                  {shift ? (
                    <ShiftChip
                      shift={shift}
                      selected={isSelected}
                      label={`${employee.name}, ${day.weekday} ${day.short}`}
                      onClick={() => onSelectShift(employee.id, dayIndex)}
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-ink/30">Off</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {roster.length === 0 ? (
          <div className="px-3 py-10 text-center text-[12px] text-ink/55">No employee matches these filters.</div>
        ) : null}

        <div
          className="sticky bottom-0 z-20 grid border-t border-ink/10 bg-white"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="sticky left-0 z-30 flex flex-col justify-center border-r border-ink/10 bg-white px-2.5 py-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-ink/45">ICU coverage</span>
            <span className="text-[12.5px] font-semibold tabular-nums">{totalPercent}%</span>
            <span className="text-[9.5px] tabular-nums text-ink/50">
              {totalAssigned} of {totalRequired} slots
            </span>
          </div>
          {days.map((day) => (
            <div key={day.key} className="border-r border-ink/6 px-1.5 py-2 last:border-r-0">
              {rotations.map((rotation) => {
                const value = coverage[coverageKey(day.key, rotation.key)]
                const short = value ? value.assigned < value.required : false
                return (
                  <div key={rotation.key} className="flex items-baseline justify-between gap-1 leading-4">
                    <span className="text-[9.5px] text-ink/50">{rotation.short}</span>
                    <span className={cn('text-[10px] font-medium tabular-nums', short ? 'text-caution-ink' : 'text-ink/70')}>
                      {value?.assigned ?? 0}
                      <span className="text-ink/40">/{value?.required ?? 0}</span>
                    </span>
                  </div>
                )
              })}
              {Object.entries(annotations)
                .filter(([key]) => key.startsWith(`${day.key}:`))
                .map(([key, note]) => (
                  <span key={key} className="mt-0.5 block text-[9px] font-medium leading-3 text-danger">
                    {note === 'Charge RN 0/1' ? 'Charge RN 0/1' : note}
                  </span>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
