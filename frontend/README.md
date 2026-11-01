# WorkforceOS — Overview

Frontend implementation of the **D2 · Overview — Exception-led** design for WorkforceOS, a workforce
scheduling and management product for Northgate Health (hospital domain: wards, RN/CNA/Charge RN,
3×8 h rotation, rest-period and ratio rules).

## Stack

- React 19 + TypeScript, Vite
- React Router 7 for the application routes
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Radix UI primitives (dropdown-menu, dialog) wrapped in `src/components/ui`
- Lucide React icons
- TanStack Query (provider installed, no endpoints wired yet)
- Recharts for the coverage trend
- Self-hosted Heebo via `@fontsource/heebo`

## Run

```bash
cd workforceos
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint
```

## What is implemented

- Application shell: navy sidebar with collapse + badge counts, mobile drawer, global search,
  notifications menu, account menu, system-health footer.
- Overview page matching the design: KPI rail, staffing-coverage trend + ward coverage table,
  operations panel (exceptions and approvals side by side), public holidays, recent schedule changes.
- Working interactions: date-range switching between two weeks, ward/skill/rotation filters (they
  change the KPI numbers, ward table and both queues), global search filtering, exception detail
  sheet with rule-level validation evidence, approval sheet with approve/reject (local state only).
- Workforce sections: searchable ICU employee roster, leave and swap approval queues, ward coverage
  and exception resolution, weekly coverage reports with CSV export, audit history, and editable
  scheduling settings.
- States: loading-safe layout, empty states for filtered lists, keyboard-accessible sheets
  (Escape to close), `aria-live` announcements for decisions, visible focus rings, `cursor-pointer`
  on every actionable element and `cursor-not-allowed` on disabled controls, reduced-motion support.

## Architecture

- `src/App.tsx` owns route composition; `src/components/layout` owns the shared shell, navigation,
  and global search.
- `src/features` groups route-level workflows; `src/components/ui` contains reusable controls,
  panels, badges, and detail sheets.
- `src/data` contains typed demo records; `src/types/workforce.ts` defines shared domain contracts.
- Page interactions use local React state. Scheduling settings persist to browser `localStorage`;
  approvals and exception decisions reset when the page reloads.

## Data

`src/data/overview.ts` holds typed demo data. The dashboard is explicitly labelled **Demo data**.
Numbers are internally consistent: ward totals sum to the KPI values (1,148 required / 1,111
assigned slots, 17 short shifts) and per-rotation figures roll up to the daily coverage trend.
`src/data/schedule.ts` contains the sample ICU roster and schedule weeks. The employee page displays
12 roster records from a 412-employee workforce total.

## Production Gaps

No backend, authentication, or live API is connected. Approval decisions and exception resolutions
are demo-only; the two-entry audit log is illustrative, not tamper-evident. Before operational use,
connect server-side persistence, authorization, validation, and a complete audit service.
