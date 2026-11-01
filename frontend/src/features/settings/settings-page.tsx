import { Check, RotateCcw, Save, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'

interface SettingsValues {
  minimumRestHours: number
  coverageTarget: number
  overtimeWarningHours: number
  requireApprovalForSwaps: boolean
  allowAgencyAssignments: boolean
}

const defaults: SettingsValues = {
  minimumRestHours: 11,
  coverageTarget: 95,
  overtimeWarningHours: 40,
  requireApprovalForSwaps: true,
  allowAgencyAssignments: false,
}

const storageKey = 'workforceos:scheduling-settings'

function loadSettings(): SettingsValues {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (!stored || typeof stored !== 'object') return defaults
    const values = stored as Partial<SettingsValues>
    return {
      minimumRestHours: validNumber(values.minimumRestHours, 8, 16, defaults.minimumRestHours),
      coverageTarget: validNumber(values.coverageTarget, 80, 100, defaults.coverageTarget),
      overtimeWarningHours: validNumber(values.overtimeWarningHours, 0, 80, defaults.overtimeWarningHours),
      requireApprovalForSwaps: typeof values.requireApprovalForSwaps === 'boolean' ? values.requireApprovalForSwaps : defaults.requireApprovalForSwaps,
      allowAgencyAssignments: typeof values.allowAgencyAssignments === 'boolean' ? values.allowAgencyAssignments : defaults.allowAgencyAssignments,
    }
  } catch {
    return defaults
  }
}

function validNumber(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fallback
}

export function SettingsPage() {
  const [values, setValues] = useState<SettingsValues>(loadSettings)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')

  const update = <Key extends keyof SettingsValues>(key: Key, value: SettingsValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setSaved(false)
    setDirty(true)
    setError('')
  }

  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(values))
      setSaved(true)
      setDirty(false)
      setError('')
    } catch {
      setSaved(false)
      setError('Browser storage is unavailable. Changes were not saved.')
    }
  }

  const reset = () => {
    setValues(defaults)
    setDirty(false)
    try {
      localStorage.removeItem(storageKey)
      setSaved(true)
      setError('')
    } catch {
      setSaved(false)
      setError('Browser storage is unavailable. Defaults are active for this session only.')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">Administration · policies</p>
          <h1 className="mt-0.5 flex items-center gap-2 text-[20px] font-semibold leading-6">
            <Settings2 className="size-4 text-primary" aria-hidden="true" />
            Scheduling settings
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={reset} title="Restore default scheduling settings">
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Restore defaults
          </Button>
          <Button variant="primary" onClick={save} title="Save settings in this browser">
            <Save className="size-3.5" aria-hidden="true" />
            Save changes
          </Button>
        </div>
      </div>

      <p className="text-[10.5px] text-ink/50">Policy values apply to this demo interface only. No server or scheduling engine is connected.</p>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel className="gap-3">
          <div>
            <h2 className="text-[13px] font-semibold">Scheduling rules</h2>
            <p className="mt-0.5 text-[10.5px] text-ink/50">Used as planning thresholds in the local demo.</p>
          </div>
          <SettingRow label="Minimum rest between shifts" description="Required rest period before the next assignment.">
            <div className="flex items-center gap-1.5">
              <NumberInput label="Minimum rest hours" value={values.minimumRestHours} min={8} max={16} onChange={(value) => update('minimumRestHours', value)} />
              <span className="text-[11px] text-ink/55">hours</span>
            </div>
          </SettingRow>
          <SettingRow label="Coverage target" description="Target fill rate for each ward and rotation.">
            <div className="flex items-center gap-1.5">
              <NumberInput label="Coverage target percent" value={values.coverageTarget} min={80} max={100} onChange={(value) => update('coverageTarget', value)} />
              <span className="text-[11px] text-ink/55">%</span>
            </div>
          </SettingRow>
          <SettingRow label="Overtime warning threshold" description="Flag weekly hours above this value for review.">
            <div className="flex items-center gap-1.5">
              <NumberInput label="Overtime warning hours" value={values.overtimeWarningHours} min={0} max={80} onChange={(value) => update('overtimeWarningHours', value)} />
              <span className="text-[11px] text-ink/55">hours</span>
            </div>
          </SettingRow>
        </Panel>

        <Panel className="gap-3">
          <div>
            <h2 className="text-[13px] font-semibold">Workflow controls</h2>
            <p className="mt-0.5 text-[10.5px] text-ink/50">Choose which assignment paths are allowed in planning.</p>
          </div>
          <ToggleRow
            label="Manager approval for shift swaps"
            description="Require a manager decision before a swap is treated as approved."
            checked={values.requireApprovalForSwaps}
            onChange={(checked) => update('requireApprovalForSwaps', checked)}
          />
          <ToggleRow
            label="Allow agency assignments"
            description="Include agency staff when resolving unfilled shifts."
            checked={values.allowAgencyAssignments}
            onChange={(checked) => update('allowAgencyAssignments', checked)}
          />
          <div className="rounded-[8px] border border-ink/8 bg-hover p-3">
            <p className="text-[11px] font-semibold">Scope</p>
            <p className="mt-1 text-[10.5px] leading-4 text-ink/60">Settings persist in this browser only. Connect an authenticated policy service before using them as operational rules.</p>
          </div>
        </Panel>
      </div>

      <div className="flex min-h-8 items-center gap-1.5" role="status" aria-live="polite">
        {saved ? <Check className="size-3.5 text-positive" aria-hidden="true" /> : null}
        <p className={`text-[10.5px] ${error ? 'text-danger' : saved ? 'text-positive' : 'text-ink/45'}`}>
          {error || (saved ? 'Settings saved in this browser.' : dirty ? 'Unsaved changes remain in this session.' : 'Defaults loaded. Save changes to keep them in this browser.')}
        </p>
      </div>
    </div>
  )
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/8 pt-3">
      <div className="min-w-[220px] flex-1">
        <p className="text-[11.5px] font-medium">{label}</p>
        <p className="mt-0.5 text-[10px] text-ink/50">{description}</p>
      </div>
      {children}
    </div>
  )
}

function NumberInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <input
      aria-label={label}
      type="number"
      min={min}
      max={max}
      step={1}
      value={value}
      onChange={(event) => {
        const next = Number(event.target.value)
        if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)))
      }}
      className="h-8 w-[74px] rounded-[7px] border-0 bg-canvas px-2 text-right text-[11px] tabular-nums text-ink focus-visible:outline-2 focus-visible:outline-primary"
    />
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border-t border-ink/8 pt-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
      <span>
        <span className="block text-[11.5px] font-medium">{label}</span>
        <span className="mt-0.5 block text-[10px] leading-4 text-ink/50">{description}</span>
      </span>
    </label>
  )
}
