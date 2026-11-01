export type Skill = 'RN' | 'CNA' | 'Charge RN'

export type Rotation = 'day' | 'evening' | 'night'

export type RotationFilter = Rotation | 'all'

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type ExceptionState = 'Open' | 'In review' | 'Resolved'

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'

export interface RotationStaffing {
  assigned: number
  required: number
}

export interface CoverageDay {
  label: string
  full: string
  isToday?: boolean
  day: RotationStaffing
  evening: RotationStaffing
  night: RotationStaffing
}

export interface CoverageWeek {
  id: string
  label: string
  shortLabel: string
  days: CoverageDay[]
}

export interface WardCoverage {
  id: string
  name: string
  required: number
  assigned: number
  shortBySkill: Record<Skill, number>
}

export interface ValidationRow {
  rule: string
  configured: string
  actual: string
  result: 'Passed' | 'Failed' | 'Not checked'
}

export interface SchedulingException {
  id: string
  type: string
  severity: Severity
  ward: string
  skill: Skill
  employee: string | null
  date: string
  shift: string
  state: ExceptionState
  detail: string
  evidence: ValidationRow[]
  recommendation: string
}

export interface ApprovalRequest {
  id: string
  kind: 'leave' | 'swap'
  title: string
  detail: string
  ward: string
  skill: Skill
  status: ApprovalStatus
  submitted: string
  dates: string
  impact: string
}

export type ApprovalStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Conflict flagged'

export interface Holiday {
  month: string
  day: string
  name: string
  weekday: string
  jurisdiction: string
}

export interface ScheduleChange {
  id: string
  timestamp: string
  actor: string
  action: string
  entity: string
  from: string | null
  to: string
  tone: 'neutral' | 'positive'
}

export interface FilterOption<T extends string> {
  value: T
  label: string
  meta?: string
}

export interface OverviewFilters {
  weekId: string
  wardId: string
  skill: Skill | 'all'
  rotation: RotationFilter
  search: string
}
