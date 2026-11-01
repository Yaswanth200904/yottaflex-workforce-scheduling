export type RotationKey = 'day' | 'evening' | 'night'

export type ConflictKind = 'double-booked' | 'leave-overlap' | 'rest-period' | 'unapproved-swap'

export interface RotationMeta {
  key: RotationKey
  label: string
  short: string
  start: string
  end: string
}

export const rotations: RotationMeta[] = [
  { key: 'day', label: 'Day', short: 'D', start: '07:00', end: '15:00' },
  { key: 'evening', label: 'Evening', short: 'E', start: '15:00', end: '23:00' },
  { key: 'night', label: 'Night', short: 'N', start: '23:00', end: '07:00' },
]

export const rotationByKey = Object.fromEntries(rotations.map((rotation) => [rotation.key, rotation])) as Record<
  RotationKey,
  RotationMeta
>

export interface WeekDay {
  key: string
  weekday: string
  short: string
  isToday?: boolean
}

export interface RosterShift {
  rotation: RotationKey
  ward: string
  conflict?: ConflictKind
  duplicate?: number
  leaveApproved?: boolean
}

export interface Coverage {
  assigned: number
  required: number
}

export interface ScheduleWeek {
  id: string
  label: string
  state: 'Draft' | 'Published'
  days: WeekDay[]
  coverage: Record<string, Coverage>
}

const days: WeekDay[] = [
  { key: '2026-10-26', weekday: 'Mon', short: '26 Oct' },
  { key: '2026-10-27', weekday: 'Tue', short: '27 Oct' },
  { key: '2026-10-28', weekday: 'Wed', short: '28 Oct' },
  { key: '2026-10-29', weekday: 'Thu', short: '29 Oct' },
  { key: '2026-10-30', weekday: 'Fri', short: '30 Oct', isToday: true },
  { key: '2026-10-31', weekday: 'Sat', short: '31 Oct' },
  { key: '2026-11-01', weekday: 'Sun', short: '1 Nov' },
]

const previousDays: WeekDay[] = [
  { key: '2026-10-19', weekday: 'Mon', short: '19 Oct' },
  { key: '2026-10-20', weekday: 'Tue', short: '20 Oct' },
  { key: '2026-10-21', weekday: 'Wed', short: '21 Oct' },
  { key: '2026-10-22', weekday: 'Thu', short: '22 Oct' },
  { key: '2026-10-23', weekday: 'Fri', short: '23 Oct' },
  { key: '2026-10-24', weekday: 'Sat', short: '24 Oct' },
  { key: '2026-10-25', weekday: 'Sun', short: '25 Oct' },
]

export const coverageKey = (dayKey: string, rotation: RotationKey) => `${dayKey}:${rotation}`

const currentCoverage: Coverage[][] = [
  [{ assigned: 11, required: 12 }, { assigned: 9, required: 10 }, { assigned: 10, required: 10 }],
  [{ assigned: 10, required: 12 }, { assigned: 9, required: 10 }, { assigned: 10, required: 10 }],
  [{ assigned: 11, required: 12 }, { assigned: 9, required: 10 }, { assigned: 9, required: 10 }],
  [{ assigned: 10, required: 12 }, { assigned: 8, required: 10 }, { assigned: 9, required: 10 }],
  [{ assigned: 9, required: 12 }, { assigned: 9, required: 10 }, { assigned: 8, required: 10 }],
  [{ assigned: 10, required: 12 }, { assigned: 8, required: 10 }, { assigned: 8, required: 10 }],
  [{ assigned: 10, required: 12 }, { assigned: 9, required: 10 }, { assigned: 9, required: 10 }],
]

const previousCoverage: Coverage[][] = [
  [{ assigned: 12, required: 12 }, { assigned: 9, required: 10 }, { assigned: 10, required: 10 }],
  [{ assigned: 11, required: 12 }, { assigned: 10, required: 10 }, { assigned: 9, required: 10 }],
  [{ assigned: 11, required: 12 }, { assigned: 9, required: 10 }, { assigned: 10, required: 10 }],
  [{ assigned: 11, required: 12 }, { assigned: 9, required: 10 }, { assigned: 9, required: 10 }],
  [{ assigned: 10, required: 12 }, { assigned: 9, required: 10 }, { assigned: 9, required: 10 }],
  [{ assigned: 10, required: 12 }, { assigned: 8, required: 10 }, { assigned: 9, required: 10 }],
  [{ assigned: 11, required: 12 }, { assigned: 9, required: 10 }, { assigned: 9, required: 10 }],
]

function buildCoverage(weekDays: WeekDay[], rows: Coverage[][]) {
  const result: Record<string, Coverage> = {}
  weekDays.forEach((day, dayIndex) => {
    rotations.forEach((rotation, rotationIndex) => {
      const value = rows[dayIndex]?.[rotationIndex]
      if (value) result[`${day.key}:${rotation.key}`] = { ...value }
    })
  })
  return result
}

export const scheduleWeeks: ScheduleWeek[] = [
  {
    id: '2026-10-26',
    label: '26 Oct – 1 Nov 2026',
    state: 'Draft',
    days,
    coverage: buildCoverage(days, currentCoverage),
  },
  {
    id: '2026-10-19',
    label: '19 – 25 Oct 2026',
    state: 'Published',
    days: previousDays,
    coverage: buildCoverage(previousDays, previousCoverage),
  },
]

export interface RosterEmployee {
  id: string
  employeeId: string
  name: string
  initials: string
  role: string
  skills: string[]
  contractHours: number
  scheduledHours: number
  shifts: Array<RosterShift | null>
  hasLeave: boolean
}

export const initialRoster: RosterEmployee[] = [
  {
    id: 'e1',
    employeeId: 'EMP-10003',
    name: 'Priya Raghavan',
    initials: 'PR',
    role: 'Charge RN · RN, ACLS, CCRN',
    skills: ['Charge RN', 'RN', 'ACLS', 'CCRN'],
    contractHours: 40,
    scheduledHours: 36,
    hasLeave: false,
    shifts: [
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      null,
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      null,
    ],
  },
  {
    id: 'e2',
    employeeId: 'EMP-10241',
    name: 'Amara Osei',
    initials: 'AO',
    role: 'RN · CCRN, ACLS',
    skills: ['RN', 'CCRN', 'ACLS'],
    contractHours: 36,
    scheduledHours: 36,
    hasLeave: false,
    shifts: [
      { rotation: 'night', ward: 'ICU' },
      { rotation: 'night', ward: 'ICU' },
      { rotation: 'night', ward: 'ICU' },
      null,
      { rotation: 'night', ward: 'ICU' },
      { rotation: 'night', ward: 'ICU' },
      null,
    ],
  },
  {
    id: 'e3',
    employeeId: 'EMP-10388',
    name: 'Daniel Whitfield',
    initials: 'DW',
    role: 'RN · ACLS, Ventilator',
    skills: ['RN', 'ACLS'],
    contractHours: 36,
    scheduledHours: 44,
    hasLeave: false,
    shifts: [
      { rotation: 'evening', ward: 'ICU' },
      { rotation: 'evening', ward: 'ICU' },
      { rotation: 'evening', ward: 'ICU' },
      { rotation: 'night', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU', conflict: 'rest-period' },
      null,
      null,
    ],
  },
  {
    id: 'e4',
    employeeId: 'EMP-10455',
    name: 'Elena Ferreira',
    initials: 'EF',
    role: 'RN · Telemetry',
    skills: ['RN', 'Telemetry'],
    contractHours: 40,
    scheduledHours: 40,
    hasLeave: false,
    shifts: [
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'evening', ward: 'ICU' },
      { rotation: 'evening', ward: 'ICU' },
      null,
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      null,
    ],
  },
  {
    id: 'e5',
    employeeId: 'EMP-10612',
    name: 'Yuki Tanaka',
    initials: 'YT',
    role: 'RN · CCRN',
    skills: ['RN', 'CCRN'],
    contractHours: 36,
    scheduledHours: 36,
    hasLeave: false,
    shifts: [
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'evening', ward: 'ICU' },
      null,
      { rotation: 'evening', ward: 'ICU' },
      null,
    ],
  },
  {
    id: 'e6',
    employeeId: 'EMP-10704',
    name: 'Tomás Herrera',
    initials: 'TH',
    role: 'CNA · BLS',
    skills: ['CNA', 'BLS'],
    contractHours: 40,
    scheduledHours: 40,
    hasLeave: false,
    shifts: [
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      null,
      { rotation: 'day', ward: 'ICU', conflict: 'double-booked', duplicate: 1 },
      null,
      null,
    ],
  },
  {
    id: 'e7',
    employeeId: 'EMP-10817',
    name: 'Marcus Lindqvist',
    initials: 'ML',
    role: 'CNA · BLS',
    skills: ['CNA', 'BLS'],
    contractHours: 32,
    scheduledHours: 32,
    hasLeave: false,
    shifts: [
      { rotation: 'day', ward: 'ICU' },
      null,
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      null,
      null,
    ],
  },
  {
    id: 'e8',
    employeeId: 'EMP-10932',
    name: 'Nkechi Adeyemi',
    initials: 'NA',
    role: 'RN · Chemo-certified',
    skills: ['RN', 'Chemo-certified'],
    contractHours: 36,
    scheduledHours: 36,
    hasLeave: true,
    shifts: [
      { rotation: 'evening', ward: 'ICU' },
      { rotation: 'evening', ward: 'ICU' },
      { rotation: 'evening', ward: 'ICU' },
      null,
      { rotation: 'night', ward: 'ICU', conflict: 'leave-overlap', leaveApproved: true },
      null,
      null,
    ],
  },
  {
    id: 'e9',
    employeeId: 'EMP-11048',
    name: 'Sofia Kowalczyk',
    initials: 'SK',
    role: 'CNA · BLS',
    skills: ['CNA', 'BLS'],
    contractHours: 40,
    scheduledHours: 24,
    hasLeave: false,
    shifts: [
      { rotation: 'evening', ward: 'ICU' },
      { rotation: 'evening', ward: 'ICU' },
      null,
      { rotation: 'evening', ward: 'ICU' },
      { rotation: 'evening', ward: 'ICU' },
      null,
      { rotation: 'day', ward: 'ICU', conflict: 'unapproved-swap' },
    ],
  },
  {
    id: 'e10',
    employeeId: 'EMP-11155',
    name: 'Jonah Barrett',
    initials: 'JB',
    role: 'CNA · BLS',
    skills: ['CNA', 'BLS'],
    contractHours: 32,
    scheduledHours: 32,
    hasLeave: false,
    shifts: [
      { rotation: 'night', ward: 'ICU' },
      null,
      { rotation: 'night', ward: 'ICU' },
      { rotation: 'night', ward: 'ICU' },
      { rotation: 'night', ward: 'ICU' },
      null,
      { rotation: 'night', ward: 'ICU' },
    ],
  },
  {
    id: 'e11',
    employeeId: 'EMP-11203',
    name: 'Hana Vuković',
    initials: 'HV',
    role: 'Charge RN · Triage',
    skills: ['Charge RN', 'RN', 'Triage'],
    contractHours: 40,
    scheduledHours: 40,
    hasLeave: false,
    shifts: [
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      null,
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      null,
      null,
    ],
  },
  {
    id: 'e12',
    employeeId: 'EMP-11288',
    name: 'Owen Fitzgerald',
    initials: 'OF',
    role: 'CNA · BLS',
    skills: ['CNA', 'BLS'],
    contractHours: 24,
    scheduledHours: 24,
    hasLeave: false,
    shifts: [
      null,
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      null,
      { rotation: 'day', ward: 'ICU' },
      { rotation: 'day', ward: 'ICU' },
      null,
    ],
  },
]

export const conflictLabels: Record<ConflictKind, string> = {
  'double-booked': 'Employee double-booked',
  'leave-overlap': 'Approved leave overlaps assigned shift',
  'rest-period': 'Rest-period violation',
  'unapproved-swap': 'Swap applied without approval',
}
