import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { OverviewPage } from '@/features/overview/overview-page'
import { SchedulePage } from '@/features/schedule/schedule-page'
import { EmployeesPage } from '@/features/employees/employees-page'
import { CoveragePage } from '@/features/coverage/coverage-page'
import { LeaveRequestsPage, ShiftSwapsPage } from '@/features/requests/requests-pages'
import { AuditPage, ReportsPage } from '@/features/reporting/reporting-pages'
import { SettingsPage } from '@/features/settings/settings-page'
import { NotFoundPage } from '@/pages/not-found'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="leave-requests" element={<LeaveRequestsPage />} />
        <Route path="shift-swaps" element={<ShiftSwapsPage />} />
        <Route path="coverage" element={<CoveragePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
