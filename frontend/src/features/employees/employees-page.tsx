import { ArrowUpRight, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, buttonStyles } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { activeEmployees } from '@/data/overview'
import { initialRoster } from '@/data/schedule'
import { useGlobalSearch } from '@/components/layout/search-context'

const skillFilters = ['All staff', 'RN', 'CNA', 'Charge RN'] as const

type SkillFilter = (typeof skillFilters)[number]

export function EmployeesPage() {
  const [skill, setSkill] = useState<SkillFilter>('All staff')
  const { search } = useGlobalSearch()
  const query = search.trim().toLowerCase()

  const employees = initialRoster.filter((employee) => {
    const matchesSkill = skill === 'All staff' || employee.skills.includes(skill)
    const matchesSearch =
      query.length === 0 ||
      `${employee.name} ${employee.employeeId} ${employee.role} ${employee.skills.join(' ')}`
        .toLowerCase()
        .includes(query)
    return matchesSkill && matchesSearch
  })

  const onLeave = initialRoster.filter((employee) => employee.hasLeave).length
  const overtime = initialRoster.filter((employee) => employee.scheduledHours > employee.contractHours).length

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">People</p>
          <h1 className="mt-0.5 text-[20px] font-semibold leading-6">Employees</h1>
        </div>
        <Link to="/schedule" className={buttonStyles({ variant: 'secondary' })}>
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
          View schedule
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Metric label="Active employees" value={activeEmployees.toLocaleString()} detail="Across all wards" />
        <Metric label="Roster sample" value={initialRoster.length.toString()} detail="ICU · current week" />
        <Metric label="On leave" value={onLeave.toString()} detail="In this roster sample" />
        <Metric label="Over contract" value={overtime.toString()} detail="Needs review" />
      </div>

      <Panel className="min-w-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 px-3 py-2.5">
          <div>
            <h2 className="text-[12.5px] font-semibold">ICU roster</h2>
            <p className="mt-0.5 text-[10.5px] text-ink/50">Showing {employees.length} of {initialRoster.length} demo records</p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-[8px] bg-canvas p-0.5" aria-label="Filter employees by skill">
            {skillFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                aria-pressed={skill === filter}
                onClick={() => setSkill(filter)}
                className={`h-7 rounded-[6px] px-2 text-[10.5px] font-medium transition-colors ${skill === filter ? 'bg-white text-ink shadow-sm' : 'text-ink/55 hover:text-ink'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {query ? (
          <p className="sr-only" role="status" aria-live="polite">
            {employees.length} employees match search.
          </p>
        ) : null}

        {employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-hover text-[9.5px] font-semibold uppercase tracking-wide text-ink/45">
                  <th scope="col" className="px-3 py-2">Employee</th>
                  <th scope="col" className="px-3 py-2">Role and skills</th>
                  <th scope="col" className="px-3 py-2">Weekly hours</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2 text-right">Schedule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/6">
                {employees.map((employee) => {
                  const overContract = employee.scheduledHours > employee.contractHours
                  const progress = Math.min(100, (employee.scheduledHours / employee.contractHours) * 100)
                  return (
                    <tr key={employee.id} className="transition-colors hover:bg-row-hover">
                      <th scope="row" className="px-3 py-2.5 font-normal">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-[10px] font-semibold text-primary">
                            {employee.initials}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[11.5px] font-semibold text-ink">{employee.name}</span>
                            <span className="block text-[10px] tabular-nums text-ink/45">{employee.employeeId}</span>
                          </span>
                        </div>
                      </th>
                      <td className="px-3 py-2.5">
                        <span className="block text-[11px] font-medium">{employee.role.split(' · ')[0]}</span>
                        <span className="block max-w-[260px] truncate text-[10px] text-ink/50" title={employee.skills.join(', ')}>
                          {employee.skills.join(' · ')}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-[140px] items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8" aria-hidden="true">
                            <span className={`block h-full rounded-full ${overContract ? 'bg-caution' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                          </div>
                          <span className="w-[62px] text-right text-[10.5px] tabular-nums">
                            {employee.scheduledHours} / {employee.contractHours} h
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-medium ${employee.hasLeave ? 'text-caution-ink' : overContract ? 'text-caution-ink' : 'text-positive'}`}>
                          <span className={`size-1.5 rounded-full ${employee.hasLeave ? 'bg-caution' : overContract ? 'bg-caution' : 'bg-positive'}`} aria-hidden="true" />
                          {employee.hasLeave ? 'Leave overlap' : overContract ? 'Over contract' : 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Link to="/schedule" aria-label={`Open schedule for ${employee.name}`} className="inline-flex size-7 items-center justify-center rounded-[6px] text-ink/55 hover:bg-white hover:text-primary">
                          <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center px-4 text-center">
            <Search className="size-4 text-ink/35" aria-hidden="true" />
            <p className="mt-2 text-[12px] font-medium">No employees match these filters</p>
            <p className="mt-0.5 text-[10.5px] text-ink/50">Clear the global search or choose another skill.</p>
            <Button className="mt-3" onClick={() => setSkill('All staff')}>Show all staff</Button>
          </div>
        )}
      </Panel>

      <p className="flex items-center gap-1.5 text-[10px] text-ink/45">
        <Users className="size-3" aria-hidden="true" />
        Demo roster displays 12 ICU records; workforce-wide totals come from overview data.
      </p>
    </div>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Panel className="min-w-0 gap-1 p-3">
      <p className="truncate text-[10px] font-medium text-ink/55">{label}</p>
      <p className="text-[20px] font-semibold leading-6 tabular-nums">{value}</p>
      <p className="truncate text-[10px] text-ink/45">{detail}</p>
    </Panel>
  )
}
