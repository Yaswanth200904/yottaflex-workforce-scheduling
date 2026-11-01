import { CalendarDays, ChevronLeft, ChevronRight, Download, ScrollText, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, buttonStyles } from '@/components/ui/button'
import { FilterDropdown } from '@/components/ui/filter-dropdown'
import { ApprovalSheet } from '@/features/overview/components/approval-sheet'
import { DayBoard } from '@/features/schedule/components/day-board'
import { ReviewQueue, type SeverityFilter } from '@/features/schedule/components/review-queue'
import { RosterGrid } from '@/features/schedule/components/roster-grid'
import { ShiftSheet } from '@/features/schedule/components/shift-sheet'
import {
  coverageKey,
  initialRoster,
  rotationByKey,
  scheduleWeeks,
  type Coverage,
  type RosterEmployee,
  type RosterShift,
  type RotationKey,
} from '@/data/schedule'
import { approvals, exceptions } from '@/data/overview'
import { ExceptionSheet } from '@/features/overview/components/exception-sheet'
import { cn } from '@/lib/utils'
import type {
  ApprovalRequest,
  ApprovalStatus,
  FilterOption,
  SchedulingException,
  Skill,
  ValidationRow,
} from '@/types/workforce'

const weekOptions: FilterOption<string>[] = scheduleWeeks.map((week) => ({
  value: week.id,
  label: week.label,
  meta: week.state,
}))

const skillOptions: FilterOption<Skill | 'all'>[] = [
  { value: 'all', label: 'All skills' },
  { value: 'RN', label: 'RN' },
  { value: 'CNA', label: 'CNA' },
  { value: 'Charge RN', label: 'Charge RN' },
]

const shiftOptions: FilterOption<RotationKey | 'all'>[] = [
  { value: 'all', label: 'All rotations' },
  { value: 'day', label: 'Day' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
]

const rotationStart: Record<RotationKey, number> = { day: 420, evening: 900, night: 1380 }

function buildEvidence(employee: RosterEmployee, dayIndex: number): ValidationRow[] {
  const shift = employee.shifts[dayIndex]
  if (!shift) return []

  const start = rotationStart[shift.rotation]
  const previous = dayIndex > 0 ? employee.shifts[dayIndex - 1] : null
  const restMinutes = previous
    ? previous.rotation === 'night'
      ? start - 420
      : 1440 - rotationStart[previous.rotation] + start
    : null

  return [
    {
      rule: 'Minimum rest 11 h',
      configured: '11 h',
      actual:
        restMinutes === null
          ? 'No prior shift'
          : `${Math.floor(restMinutes / 60)} h ${String(restMinutes % 60).padStart(2, '0')} m`,
      result: restMinutes === null ? 'Passed' : restMinutes >= 660 ? 'Passed' : 'Failed',
    },
    {
      rule: 'Single concurrent assignment',
      configured: '1',
      actual: shift.duplicate ? '2' : '1',
      result: shift.duplicate ? 'Failed' : 'Passed',
    },
    {
      rule: 'Weekly contract hours',
      configured: `${employee.contractHours} h`,
      actual: `${employee.scheduledHours} h`,
      result: employee.scheduledHours > employee.contractHours ? 'Failed' : 'Passed',
    },
    {
      rule: 'Manager approval for swap',
      configured: 'Approved request',
      actual: shift.conflict === 'unapproved-swap' ? 'No request on record' : 'Not applicable',
      result: shift.conflict === 'unapproved-swap' ? 'Failed' : 'Not checked',
    },
  ]
}

export function SchedulePage() {
  const [weekId, setWeekId] = useState(scheduleWeeks[0].id)
  const week = scheduleWeeks.find((entry) => entry.id === weekId) ?? scheduleWeeks[0]

  const [coverage, setCoverage] = useState<Record<string, Coverage>>({ ...scheduleWeeks[0].coverage })
  const [roster, setRoster] = useState<RosterEmployee[]>(initialRoster)
  const [view, setView] = useState<'week' | 'day'>('week')
  const [dayIndex, setDayIndex] = useState(4)
  const [skill, setSkill] = useState<Skill | 'all'>('all')
  const [shiftFilter, setShiftFilter] = useState<RotationKey | 'all'>('all')
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState<SeverityFilter>('all')
  const [selected, setSelected] = useState<{ employeeId: string; dayIndex: number } | null>(null)
  const [activeException, setActiveException] = useState<SchedulingException | null>(null)
  const [activeApproval, setActiveApproval] = useState<ApprovalRequest | null>(null)
  const [resolvedExceptions, setResolvedExceptions] = useState<Record<string, boolean>>({})
  const [dirty, setDirty] = useState(3)
  const [draftState, setDraftState] = useState<'Draft' | 'Published'>('Draft')
  const [lastValidation, setLastValidation] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const conflicts = useMemo(
    () =>
      roster.flatMap((employee) =>
        employee.shifts
          .map((shift, index) => (shift?.conflict ? { employee, dayIndex: index } : null))
          .filter((entry): entry is { employee: RosterEmployee; dayIndex: number } => entry !== null),
      ),
    [roster],
  )

  const visibleRoster = useMemo(() => {
    const term = query.trim().toLowerCase()
    return roster.filter((employee) => {
      const matchesSkill = skill === 'all' || employee.skills.includes(skill)
      const matchesShift = shiftFilter === 'all' || employee.shifts.some((shift) => shift?.rotation === shiftFilter)
      const matchesQuery =
        term.length === 0 || `${employee.name} ${employee.employeeId} ${employee.role}`.toLowerCase().includes(term)
      return matchesSkill && matchesShift && matchesQuery
    })
  }, [roster, skill, shiftFilter, query])

  const assigned = Object.values(coverage).reduce((sum, value) => sum + value.assigned, 0)
  const required = Object.values(coverage).reduce((sum, value) => sum + value.required, 0)
  const coveragePercent = required === 0 ? '0.0' : ((assigned / required) * 100).toFixed(1)
  const shortRotations = Object.values(coverage).filter((value) => value.assigned < value.required).length
  const overtime = roster.reduce((sum, employee) => sum + Math.max(0, employee.scheduledHours - employee.contractHours), 0)

  const today = week.days[dayIndex] ?? week.days[0]
  const annotations: Record<string, string> =
    week.id === '2026-10-26' ? { [`${week.days[5].key}:night`]: 'Charge RN 0/1' } : {}

  const selectedEmployee = selected ? roster.find((employee) => employee.id === selected.employeeId) : null
  const selectedShift: RosterShift | null =
    selected && selectedEmployee ? selectedEmployee.shifts[selected.dayIndex] : null
  const eligible = selected
    ? roster.filter((employee) => employee.id !== selected.employeeId && employee.shifts[selected.dayIndex] === null)
    : []

  const switchWeek = (nextId: string) => {
    const next = scheduleWeeks.find((entry) => entry.id === nextId)
    if (!next) return
    setWeekId(next.id)
    setCoverage({ ...next.coverage })
    setDraftState(next.state === 'Published' ? 'Published' : 'Draft')
    setSelected(null)
    setLastValidation(null)
    setAnnouncement(`Week ${next.label} loaded.`)
  }

  const shiftWeek = (direction: -1 | 1) => {
    const index = scheduleWeeks.findIndex((entry) => entry.id === weekId)
    const next = scheduleWeeks[index + direction]
    if (next) switchWeek(next.id)
  }

  const reassign = (targetId: string) => {
    if (!selected || !selectedShift) return
    const target = roster.find((employee) => employee.id === targetId)
    setRoster((current) =>
      current.map((employee) => {
        if (employee.id === selected.employeeId) {
          return {
            ...employee,
            shifts: employee.shifts.map((shift, index) => (index === selected.dayIndex ? null : shift)),
          }
        }
        if (employee.id === targetId) {
          return {
            ...employee,
            shifts: employee.shifts.map((shift, index) => (index === selected.dayIndex ? selectedShift : shift)),
          }
        }
        return employee
      }),
    )
    setDirty((value) => value + 1)
    setSelected(null)
    setAnnouncement(`Shift reassigned to ${target?.name ?? 'employee'}.`)
  }

  const cancelShift = () => {
    if (!selected || !selectedShift) return
    const rotation = selectedShift.rotation
    const dayKey = week.days[selected.dayIndex].key
    setRoster((current) =>
      current.map((employee) =>
        employee.id === selected.employeeId
          ? { ...employee, shifts: employee.shifts.map((shift, index) => (index === selected.dayIndex ? null : shift)) }
          : employee,
      ),
    )
    setCoverage((current) => {
      const key = coverageKey(dayKey, rotation)
      const value = current[key]
      if (!value) return current
      return { ...current, [key]: { ...value, assigned: Math.max(0, value.assigned - 1) } }
    })
    setDirty((value) => value + 1)
    setSelected(null)
    setAnnouncement('Shift removed from the draft roster.')
  }

  const validate = () => {
    const message = `Validation complete: ${conflicts.length} conflicts and ${shortRotations} rotations below requirement.`
    setLastValidation(`Validated · ${conflicts.length} conflicts · ${shortRotations} rotations short`)
    setAnnouncement(message)
  }

  const saveDraft = () => {
    setDirty(0)
    setAnnouncement('Draft saved locally. Nothing has been published.')
  }

  const publish = () => {
    if (conflicts.length > 0) return
    setDraftState('Published')
    setDirty(0)
    setAnnouncement(`Schedule for ${week.label} published.`)
  }

  const exportCsv = () => {
    const header = ['Employee', 'Employee ID', 'Role', ...week.days.map((day) => `${day.weekday} ${day.short}`)]
    const rows = roster.map((employee) => [
      employee.name,
      employee.employeeId,
      employee.role,
      ...employee.shifts.map((shift) =>
        shift ? `${rotationByKey[shift.rotation].label} ${rotationByKey[shift.rotation].start}-${rotationByKey[shift.rotation].end}` : 'Off',
      ),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.download = `icu-roster-${week.id}.csv`
    anchor.href = url
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setAnnouncement('Roster exported as CSV.')
  }

  const decide = (id: string, status: ApprovalStatus) => {
    setAnnouncement(`Request ${id.toUpperCase()} marked ${status.toLowerCase()}.`)
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[20px] font-semibold leading-6 tracking-tight">Schedule Planner</h1>
          <span className="rounded-full bg-ink/6 px-2 py-0.5 text-[11px] font-medium text-ink/60">ICU — Intensive Care</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-medium',
              draftState === 'Published' ? 'bg-positive/12 text-positive' : 'bg-caution/14 text-caution-ink',
            )}
          >
            {draftState}
          </span>
          {dirty > 0 ? <span className="text-[11px] tabular-nums text-ink/55">{dirty} unsaved changes</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/audit" className={buttonStyles()}>
            <ScrollText className="size-3.5" aria-hidden="true" />
            History
          </Link>
          <Button onClick={exportCsv} title="Download the visible roster as CSV">
            <Download className="size-3.5" aria-hidden="true" />
            Export
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={() => shiftWeek(-1)} aria-label="Previous week" title="Previous week">
            <ChevronLeft className="size-3.5" aria-hidden="true" />
          </Button>
          <Button size="sm" onClick={() => shiftWeek(1)} aria-label="Next week" title="Next week">
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
        <FilterDropdown
          label="Week"
          value={weekId}
          options={weekOptions}
          onChange={switchWeek}
          icon={<CalendarDays className="size-3.5 text-ink/55" aria-hidden="true" />}
        />
        <div className="flex rounded-[8px] bg-white p-0.5" role="group" aria-label="Roster view">
          {(['week', 'day'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              aria-pressed={view === option}
              className={cn(
                'h-7 rounded-[6px] px-2.5 text-[11.5px] capitalize transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                view === option ? 'bg-ink font-medium text-canvas' : 'text-ink/65 hover:bg-hover',
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            disabled
            title="Generating a roster requires the scheduling service, which is not connected in this build"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            Generate
          </Button>
          <Button onClick={validate} title="Run the configured rules against the draft">
            Validate
          </Button>
          <Button onClick={saveDraft} title="Save the draft locally">
            Save draft
          </Button>
          <Button
            variant="primary"
            onClick={publish}
            disabled={conflicts.length > 0}
            title={conflicts.length > 0 ? `Resolve ${conflicts.length} conflicts before publishing` : 'Publish this schedule'}
          >
            Publish schedule
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="relative flex h-9 w-full max-w-[240px] items-center">
          <label htmlFor="roster-search" className="sr-only">
            Filter by employee name or ID
          </label>
          <input
            id="roster-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by employee name or ID"
            className="h-9 w-full rounded-[8px] border border-transparent bg-white px-2.5 text-[12.5px] placeholder:text-ink/45 focus:border-primary/35"
          />
        </div>
        <FilterDropdown label="Skill" value={skill} options={skillOptions} onChange={setSkill} />
        <FilterDropdown label="Rotation" value={shiftFilter} options={shiftOptions} onChange={setShiftFilter} />

        {lastValidation ? <span className="text-[11px] tabular-nums text-ink/50">{lastValidation}</span> : null}

        <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px] tabular-nums text-ink/60">
          <span>Coverage {coveragePercent}%</span>
          <span className="h-3 w-px bg-ink/15" aria-hidden="true" />
          <span>Conflicts {conflicts.length}</span>
          <span className="h-3 w-px bg-ink/15" aria-hidden="true" />
          <span>Overtime {overtime.toFixed(1)} h</span>
          <span className="h-3 w-px bg-ink/15" aria-hidden="true" />
          <span>Unsaved {dirty}</span>
        </div>
      </div>

      <div className="mt-3 flex h-[680px] flex-col gap-3 xl:h-[calc(100dvh-224px)] xl:flex-row">
        <ReviewQueue
          exceptions={exceptions}
          approvals={approvals}
          activeExceptionId={activeException?.id ?? null}
          severity={severity}
          onSeverityChange={setSeverity}
          onSelectException={setActiveException}
          onSelectApproval={setActiveApproval}
        />

        <section
          aria-labelledby="roster-heading"
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-panel bg-white"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 px-3 py-2">
            <h2 id="roster-heading" className="text-[13px] font-semibold tracking-tight">
              ICU roster · {week.label}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {view === 'day' ? (
                <div className="flex flex-wrap gap-1">
                  {week.days.map((day, index) => (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setDayIndex(index)}
                      aria-pressed={dayIndex === index}
                      className={cn(
                        'h-7 rounded-[6px] px-2 text-[11px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                        dayIndex === index ? 'bg-ink text-canvas' : 'text-ink/65 hover:bg-hover',
                      )}
                    >
                      {day.weekday} {day.short}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-[10px] text-ink/55">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-sm bg-day" aria-hidden="true" />
                    Day
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-sm bg-evening" aria-hidden="true" />
                    Evening
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-sm bg-night" aria-hidden="true" />
                    Night
                  </span>
                  <span className="flex items-center gap-1 text-danger">
                    <span className="size-2 rounded-sm bg-danger/50" aria-hidden="true" />
                    Conflict
                  </span>
                </div>
              )}
            </div>
          </div>

          {view === 'week' ? (
            <RosterGrid
              days={week.days}
              roster={visibleRoster}
              coverage={coverage}
              selected={selected}
              annotations={annotations}
              onSelectShift={(employeeId, index) => setSelected({ employeeId, dayIndex: index })}
            />
          ) : (
            <DayBoard
              day={today}
              dayIndex={dayIndex}
              roster={visibleRoster}
              coverage={coverage}
              selected={selected}
              onSelectShift={(employeeId, index) => setSelected({ employeeId, dayIndex: index })}
            />
          )}
        </section>
      </div>

      {selected && selectedEmployee && selectedShift ? (
        <ShiftSheet
          employee={selectedEmployee}
          day={week.days[selected.dayIndex]}
          shift={selectedShift}
          evidence={buildEvidence(selectedEmployee, selected.dayIndex)}
          eligible={eligible}
          onOpenChange={(open) => (open ? undefined : setSelected(null))}
          onReassign={reassign}
          onCancelShift={cancelShift}
        />
      ) : null}

      {activeException ? (
        <ExceptionSheet
          exception={activeException}
          resolved={Boolean(resolvedExceptions[activeException.id])}
          onOpenChange={(open) => (open ? undefined : setActiveException(null))}
          onResolve={(id) => {
            setResolvedExceptions((current) => ({ ...current, [id]: true }))
            setAnnouncement(`Exception ${id.toUpperCase()} marked resolved.`)
          }}
        />
      ) : null}

      {activeApproval ? (
        <ApprovalSheet
          request={activeApproval}
          onOpenChange={(open) => (open ? undefined : setActiveApproval(null))}
          onDecide={decide}
        />
      ) : null}
    </div>
  )
}
