import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PanelProps {
  id?: string
  labelledBy?: string
  className?: string
  children: ReactNode
}

export function Panel({ id, labelledBy, className, children }: PanelProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn('flex flex-col rounded-panel bg-surface p-3', className)}
    >
      {children}
    </section>
  )
}
