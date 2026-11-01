import {
  ArrowLeftRight,
  CalendarDays,
  ChartColumn,
  FileText,
  House,
  ScrollText,
  Settings,
  TriangleAlert,
  Users,
} from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  badge?: number
  badgeTone?: 'neutral' | 'alert'
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Overview', icon: House },
  { to: '/schedule', label: 'Schedule Planner', icon: CalendarDays },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/leave-requests', label: 'Leave Requests', icon: FileText, badge: 5, badgeTone: 'neutral' },
  { to: '/shift-swaps', label: 'Shift Swaps', icon: ArrowLeftRight, badge: 4, badgeTone: 'neutral' },
  { to: '/coverage', label: 'Coverage', icon: TriangleAlert, badge: 7, badgeTone: 'alert' },
  { to: '/reports', label: 'Reports & Analytics', icon: ChartColumn },
  { to: '/audit', label: 'Audit History', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: Settings },
]
