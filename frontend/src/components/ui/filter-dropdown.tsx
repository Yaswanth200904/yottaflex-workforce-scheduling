import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronsUpDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { FilterOption } from '@/types/workforce'

interface FilterDropdownProps<T extends string> {
  label: string
  value: T
  options: FilterOption<T>[]
  onChange: (value: T) => void
  icon?: ReactNode
  align?: 'start' | 'end'
  className?: string
}

export function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  icon,
  align = 'start',
  className,
}: FilterDropdownProps<T>) {
  const selected = options.find((option) => option.value === value)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] bg-white px-2.5 text-[12.5px] text-ink',
            'transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            className,
          )}
        >
          {icon}
          <span className="whitespace-nowrap">{selected?.label ?? label}</span>
          <ChevronsUpDown className="size-3 text-ink/40" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          className="z-50 min-w-[210px] rounded-[8px] border border-ink/10 bg-white p-1 shadow-[0_18px_40px_-24px_rgba(17,41,107,0.45)]"
        >
          <DropdownMenu.Label className="px-2 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink/45">
            {label}
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={value} onValueChange={(next) => onChange(next as T)}>
            {options.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                className="flex h-8 cursor-pointer items-center gap-2 rounded-[6px] px-2 text-[12.5px] text-ink outline-none transition-colors duration-150 data-[highlighted]:bg-row-hover data-[state=checked]:font-medium"
              >
                <span className="flex-1 truncate">{option.label}</span>
                {option.meta ? <span className="tabular-nums text-[11px] text-ink/45">{option.meta}</span> : null}
                <DropdownMenu.ItemIndicator>
                  <Check className="size-3.5 text-primary" aria-hidden="true" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
