import { ArrowRight, CalendarDays, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonStyles } from '@/components/ui/button'
import { FilterDropdown } from '@/components/ui/filter-dropdown'
import { ApprovalSheet } from '@/features/overview/components/approval-sheet'
import { CoveragePanel } from '@/features/overview/components/coverage-panel'
import { ExceptionSheet } from '@/features/overview/components/exception-sheet'
import { HolidaysCard } from '@/features/overview/components/holidays-card'
import { MetricCard } from '@/features/overview/components/metric-card'
import { OperationsPanel } from '@/features/overview/components/operations-panel'
import { ScheduleChangesPanel } from '@/features/overview/components/schedule-changes-panel'
import { useOverviewFilters } from '@/features/overview/use-overview-filters'
import { activeEmployees, overtimeHours, wards } from '@/data/overview'
import { formatCount, formatPercent } from '@/lib/utils'
import type { ApprovalRequest, ApprovalStatus, FilterOption, RotationFilter, SchedulingException, Skill } from '@/types/workforce'

const wardOptions: FilterOption<string>[] = [
  { value: 'all', label: 'All wards' },
  ...wards.map((ward) => ({ value: ward.id, label: ward.name })),
]

const skillOptions: FilterOption<Skill | 'all'>[] = [
  { value: 'all', label: 'All skills' },
  { value: 'RN', label: 'RN' },
  { value: 'CNA', label: 'CNA' },
  { value: 'Charge RN', label: 'Charge RN' },
]

const rotationOptions: FilterOption<RotationFilter>[] = [
  { value: 'all', label: 'All rotations' },
  { value: 'day', label: 'Day 07:00–15:00' },
  { value: 'evening', label: 'Evening 15:00–23:00' },
  { value: 'night', label: 'Night 23:00–07:00' },
]

export function OverviewPage() {
  const filters = useOverviewFilters()
  const [activeException, setActiveException] = useState<SchedulingException | null>(null)
  const [activeApproval, setActiveApproval] = useState<ApprovalRequest | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const wardsShort = filters.wardRows.filter((ward) => filters.shortForWard(ward) > 0).length

  const decide = (id: string, status: ApprovalStatus) => {
    filters.decide(id, status)
    setAnnouncement(`Request ${id.toUpperCase()} marked ${status.toLowerCase()}.`)
  }

  const resolve = (id: string) => {
    filters.resolve(id)
    setAnnouncement(`Exception ${id.toUpperCase()} marked resolved.`)
  }

  const metrics = [
    {
      label: 'Active employees',
      value: formatCount(activeEmployees),
      caption: '438 headcount · 26 on leave',
      to: '/employees',
    },
    {
      label: 'Scheduled shifts',
      value: formatCount(filters.totals.required),
      caption: `week ${filters.week.label}`,
      to: '/schedule',
    },
    {
      label: 'Staffing coverage',
      value: formatPercent(filters.totals.assigned, filters.totals.required),
      unit: '%',
      caption: `${formatCount(filters.totals.assigned)} of ${formatCount(filters.totals.required)} slots filled`,
      to: '/coverage',
    },
    {
      label: 'Overtime hours',
      value: overtimeHours.toFixed(1),
      unit: 'h',
      caption: 'cap 120 h · 4 over contract',
      to: '/reports',
    },
    {
      label: 'Open coverage gaps',
      value: formatCount(filters.openGaps),
      caption: `across ${wardsShort} wards · ${filters.criticalCount} critical`,
      to: '/coverage?severity=critical',
      tone: 'critical' as const,
    },
    {
      label: 'Pending approvals',
      value: formatCount(filters.pendingApprovals.length),
      caption: `${filters.leaveCount} leave · ${filters.swapCount} swaps · oldest 2 d`,
      to: '/leave-requests',
      tone: 'warning' as const,
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-semibold leading-6 tracking-tight">Overview</h1>
          <span className="rounded-full bg-ink/6 px-2 py-0.5 text-[11px] font-medium text-ink/60">
            {filters.wardLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Date range"
            value={filters.weekId}
            options={filters.weekOptions}
            onChange={filters.setWeekId}
            icon={<CalendarDays className="size-3.5 text-ink/55" aria-hidden="true" />}
            align="end"
          />
          <Link
            to="/schedule"
            className={buttonStyles({ variant: 'primary', className: 'whitespace-nowrap' })}
          >
            Open schedule
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Ward"
          value={filters.wardId}
          options={wardOptions}
          onChange={filters.setWardId}
          icon={<SlidersHorizontal className="size-3.5 text-ink/55" aria-hidden="true" />}
        />
        <FilterDropdown label="Skill" value={filters.skill} options={skillOptions} onChange={filters.setSkill} />
        <FilterDropdown
          label="Rotation"
          value={filters.rotation}
          options={rotationOptions}
          onChange={filters.setRotation}
        />
        {filters.hasFilters ? (
          <button
            type="button"
            onClick={() => {
              filters.clearFilters()
              setAnnouncement('Filters cleared.')
            }}
            className="h-9 rounded-[8px] px-2 text-[12.5px] text-ink/75 transition-colors duration-150 hover:bg-white/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Clear filters
          </button>
        ) : null}

        <div className="ml-auto flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/6 px-2 py-1 text-[11px] text-ink/70">
            <span className="size-1.5 rounded-full bg-ink/40" aria-hidden="true" />
            Demo data
          </span>
          <span className="text-[11px] tabular-nums text-ink/50">Updated 09:41</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="contents xl:flex xl:w-[260px] xl:shrink-0 xl:flex-col xl:gap-4">
          <div className="order-1 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:order-none xl:grid-cols-1">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                unit={metric.unit}
                caption={metric.caption}
                to={metric.to}
                tone={metric.tone}
              />
            ))}
          </div>
          <HolidaysCard className="order-5 xl:order-none" />
        </div>

        <div className="order-2 flex min-w-0 flex-1 flex-col gap-4 xl:order-none">
          <CoveragePanel
            trend={filters.trend}
            wardRows={filters.wardRows}
            shortForWard={filters.shortForWard}
            skill={filters.skill}
            rotation={filters.rotation}
            onClearFilters={filters.clearFilters}
          />
          <OperationsPanel
            exceptions={filters.openExceptions}
            approvals={filters.pendingApprovals}
            onSelectException={setActiveException}
            onSelectApproval={setActiveApproval}
            clearanceLabel={`${wardsShort} wards short`}
          />
          <ScheduleChangesPanel />
        </div>
      </div>

      {activeException ? (
        <ExceptionSheet
          exception={activeException}
          resolved={Boolean(filters.resolvedIds[activeException.id])}
          onOpenChange={(open) => (open ? undefined : setActiveException(null))}
          onResolve={resolve}
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
