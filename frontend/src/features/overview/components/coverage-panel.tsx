import { Panel } from '@/components/ui/panel'
import { CoverageTrendChart } from '@/features/overview/components/coverage-trend-chart'
import { WardCoverageTable } from '@/features/overview/components/ward-coverage-table'
import type { TrendPoint } from '@/features/overview/use-overview-filters'
import type { RotationFilter, Skill, WardCoverage } from '@/types/workforce'

const rotationLabel: Record<RotationFilter, string> = {
  all: 'All rotations',
  day: 'Day 07:00–15:00',
  evening: 'Evening 15:00–23:00',
  night: 'Night 23:00–07:00',
}

interface CoveragePanelProps {
  trend: TrendPoint[]
  wardRows: WardCoverage[]
  shortForWard: (ward: WardCoverage) => number
  skill: Skill | 'all'
  rotation: RotationFilter
  onClearFilters: () => void
}

export function CoveragePanel({ trend, wardRows, shortForWard, skill, rotation, onClearFilters }: CoveragePanelProps) {
  return (
    <Panel labelledBy="coverage-heading" className="xl:h-[240px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="coverage-heading" className="text-[13px] font-semibold tracking-tight">
          Staffing coverage
        </h2>
        <div className="flex items-center gap-3 text-[10.5px] text-ink/55">
          <span className="rounded-full bg-ink/6 px-2 py-0.5 text-[10px] font-medium text-ink/60">
            {rotationLabel[rotation]}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-[2px] w-4 rounded-full bg-primary" aria-hidden="true" />
            Coverage
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-0.5 w-4 bg-ink/50"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, rgba(17,41,107,0.6) 0 3px, transparent 3px 6px)',
              }}
              aria-hidden="true"
            />
            Target 95%
          </span>
        </div>
      </div>

      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
        <div className="w-full shrink-0 xl:w-[360px]">
          <CoverageTrendChart data={trend} />
        </div>
        <WardCoverageTable
          rows={wardRows}
          shortForWard={shortForWard}
          skill={skill}
          onClearFilters={onClearFilters}
        />
      </div>
    </Panel>
  )
}
