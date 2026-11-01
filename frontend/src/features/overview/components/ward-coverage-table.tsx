import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { Skill, WardCoverage } from '@/types/workforce'

interface WardCoverageTableProps {
  rows: WardCoverage[]
  shortForWard: (ward: WardCoverage) => number
  skill: Skill | 'all'
  onClearFilters: () => void
}

export function WardCoverageTable({ rows, shortForWard, skill, onClearFilters }: WardCoverageTableProps) {
  return (
    <div className="min-w-0 flex-1 xl:border-l xl:border-ink/8 xl:pl-4">
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">Coverage by ward for the selected week</caption>
        <thead>
          <tr className="text-[10.5px] font-medium text-ink/50">
            <th scope="col" className="pb-1 text-left font-medium">
              Ward
            </th>
            <th scope="col" className="w-[52px] pb-1 text-right font-medium">
              Required
            </th>
            <th scope="col" className="w-[52px] pb-1 text-right font-medium">
              Assigned
            </th>
            <th scope="col" className="w-[44px] pb-1 text-right font-medium">
              Short
            </th>
          </tr>
        </thead>
        <tbody className="text-[11.5px] tabular-nums">
          {rows.map((ward) => {
            const short = shortForWard(ward)
            return (
              <tr key={ward.id} className="h-[26px] border-t border-ink/6 transition-colors duration-150 hover:bg-hover">
                <th scope="row" className="truncate pr-2 text-left font-medium" title={ward.name}>
                  <Link
                    to={`/coverage?ward=${ward.id}`}
                    className="rounded-[3px] transition-colors duration-150 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {ward.name}
                  </Link>
                </th>
                <td className="text-right text-ink/65">{ward.required}</td>
                <td className="text-right font-medium">{ward.assigned}</td>
                <td className={cn('text-right font-medium', short > 0 ? 'text-caution-ink' : 'text-ink/40')}>
                  <span aria-label={`${short} short${skill === 'all' ? '' : ` in ${skill}`}`}>{short}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-[6px] bg-hover px-3 py-4 text-center">
          <p className="text-[11.5px] text-ink/60">No ward has a shortage for this filter.</p>
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-1 text-[11.5px] font-medium text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  )
}
