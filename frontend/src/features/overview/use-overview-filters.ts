import { useMemo, useState } from 'react'
import { useGlobalSearch } from '@/components/layout/search-context'
import { approvals, coverageWeeks, exceptions, staffingFor, wards } from '@/data/overview'
import { percentValue } from '@/lib/utils'
import type { ApprovalStatus, FilterOption, RotationFilter, Skill } from '@/types/workforce'

const weekOptions: FilterOption<string>[] = coverageWeeks.map((entry) => ({
  value: entry.id,
  label: entry.label,
  meta: entry.shortLabel,
}))

export interface TrendPoint {
  label: string
  full: string
  isToday: boolean
  assigned: number
  required: number
  coverage: number
}

function includes(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.trim().toLowerCase())
}

export function useOverviewFilters() {
  const { search } = useGlobalSearch()
  const [weekId, setWeekId] = useState(coverageWeeks[0].id)
  const [wardId, setWardId] = useState('all')
  const [skill, setSkill] = useState<Skill | 'all'>('all')
  const [rotation, setRotation] = useState<RotationFilter>('all')
  const [decisions, setDecisions] = useState<Record<string, ApprovalStatus>>({})
  const [resolved, setResolved] = useState<Record<string, boolean>>({})

  const week = coverageWeeks.find((entry) => entry.id === weekId) ?? coverageWeeks[0]
  const wardLabel = wardId === 'all' ? 'All wards' : (wards.find((ward) => ward.id === wardId)?.name ?? 'All wards')

  const trend = useMemo<TrendPoint[]>(
    () =>
      week.days.map((day) => {
        const staffing = staffingFor(day, rotation)
        return {
          label: day.label,
          full: day.full,
          isToday: Boolean(day.isToday),
          assigned: staffing.assigned,
          required: staffing.required,
          coverage: percentValue(staffing.assigned, staffing.required),
        }
      }),
    [week, rotation],
  )

  const totals = useMemo(
    () =>
      trend.reduce(
        (accumulator, point) => ({
          assigned: accumulator.assigned + point.assigned,
          required: accumulator.required + point.required,
        }),
        { assigned: 0, required: 0 },
      ),
    [trend],
  )

  const wardRows = useMemo(
    () =>
      wards.filter((ward) => {
        const inScope = wardId === 'all' || ward.id === wardId
        const hasShortageForSkill = skill === 'all' || ward.shortBySkill[skill] > 0
        return inScope && hasShortageForSkill && includes(ward.name, search)
      }),
    [wardId, skill, search],
  )

  const shortForWard = (ward: (typeof wards)[number]) =>
    skill === 'all'
      ? ward.shortBySkill.RN + ward.shortBySkill.CNA + ward.shortBySkill['Charge RN']
      : ward.shortBySkill[skill]

  const openExceptions = useMemo(
    () =>
      exceptions.filter((exception) => {
        if (resolved[exception.id]) return false
        const inWard = wardId === 'all' || exception.ward === wardLabel
        const inSkill = skill === 'all' || exception.skill === skill
        const matchesSearch = includes(
          `${exception.type} ${exception.employee ?? ''} ${exception.ward} ${exception.state} ${exception.date}`,
          search,
        )
        return inWard && inSkill && matchesSearch
      }),
    [wardId, wardLabel, skill, search, resolved],
  )

  const pendingApprovals = useMemo(
    () =>
      approvals.filter((request) => {
        const status = decisions[request.id] ?? request.status
        if (status !== 'Pending') return false
        const inWard = wardId === 'all' || request.ward === wardLabel
        const inSkill = skill === 'all' || request.skill === skill
        const matchesSearch = includes(`${request.title} ${request.detail} ${request.ward} ${request.status}`, search)
        return inWard && inSkill && matchesSearch
      }),
    [decisions, wardId, wardLabel, skill, search],
  )

  const openGaps = wardRows.reduce((sum, ward) => sum + shortForWard(ward), 0)
  const criticalCount = openExceptions.filter((exception) => exception.severity === 'critical').length
  const leaveCount = pendingApprovals.filter((request) => request.kind === 'leave').length
  const swapCount = pendingApprovals.filter((request) => request.kind === 'swap').length

  const hasFilters = wardId !== 'all' || skill !== 'all' || rotation !== 'all' || search.length > 0

  const clearFilters = () => {
    setWardId('all')
    setSkill('all')
    setRotation('all')
  }

  return {
    week,
    weekId,
    weekOptions,
    setWeekId,
    wardId,
    setWardId,
    wardLabel,
    skill,
    setSkill,
    rotation,
    setRotation,
    trend,
    totals,
    wardRows,
    shortForWard,
    openExceptions,
    pendingApprovals,
    openGaps,
    criticalCount,
    leaveCount,
    swapCount,
    hasFilters,
    clearFilters,
    decisions,
    decide: (id: string, status: ApprovalStatus) => setDecisions((current) => ({ ...current, [id]: status })),
    resolvedIds: resolved,
    resolve: (id: string) => setResolved((current) => ({ ...current, [id]: true })),
  }
}
