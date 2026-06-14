
# Agency CRM — Implementation Plan

A dark-themed CRM to track prospects through a sales pipeline, grouped by user-managed business verticals. Local-first (localStorage) with a service layer ready to swap to a REST backend.

## Scope confirmed from your spec
- Stack: React + TS + Tailwind + shadcn/ui, Zustand for state, localStorage persistence, REST-ready service layer
- Spanish UI labels (prospecto, contactado, demo, propuesta, cerrado, perdido)
- Dark theme, lavender accent `#b4a0ff`
- Seed: 3 verticals (Lavanderías, Pollerías, Cafeterías) + 5 sample leads

## Pages / routes
```
/                  Dashboard
/pipeline          Kanban board (main view)
/verticals         Verticals manager
/import-export     JSON import/export
```
Lead detail opens as a drawer over any page. Add Lead opens as a modal.

Shared layout: left sidebar (logo, nav, "+ Nuevo Lead" button) + top bar (search + vertical filter on Pipeline).

## Feature breakdown

### 1. Dashboard
- KPI cards: total leads, pipeline value USD (sum of open statuses), conversion rate (cerrado / total closed-or-lost)
- "Seguimientos de hoy" list: leads with `nextActionDate <= today` and status not in (cerrado, perdido), sorted by date asc
- Recent activity feed: last 10 interactions across all leads
- Mini bar chart of leads by vertical (Recharts, lavender bars)

### 2. Pipeline (Kanban)
- 6 columns matching fixed statuses, color-coded headers
- Vertical filter as horizontal tab strip above board ("Todas" + each vertical with icon)
- Cards show: business name, vertical badge (icon+color), owner, phone, ticket USD, next-action date (red if overdue)
- Drag & drop via `@dnd-kit/core` — drop updates status + `updatedAt`
- Click card → Lead Detail drawer
- Mobile: columns scroll horizontally, cards full-width within column

### 3. Lead Detail (drawer)
- Inline-editable fields (click-to-edit pattern with Save/Cancel per field, or single Edit mode toggle — using single edit toggle for simplicity)
- Quick actions row: WhatsApp (`https://wa.me/<phone>`), Call (`tel:`), Copy phone (toast)
- Interaction timeline: newest first, icon per type
- "Agregar interacción" button → small inline form (type select, date, notes)
- Delete with AlertDialog confirmation

### 4. Add Lead modal
- All Lead fields, vertical Select (dynamic), status Select (default `prospecto`), date picker for next action
- Zod + react-hook-form validation; required: businessName, verticalId, phone

### 5. Verticals manager
- Table/list of verticals with inline edit (name, emoji input, color picker via native `<input type="color">`)
- Add form at top
- Delete: if leads exist in vertical, AlertDialog warns with count and blocks (or offers reassign — going with block + message for v1)
- Reorder via `@dnd-kit/sortable`; order persisted

### 6. Import / Export
- Export: download `crm-export-<date>.json` with `{ verticals, leads, interactions }`
- Import: file input + radio for "Merge" vs "Replace"
  - Merge: match verticals by name (create if missing), append leads, dedupe by businessName+phone
  - Replace: overwrite everything after confirm
- Accepts the Claude Code shape (`leads[].vertical` as name string) — normalizer maps to `verticalId`

## Data & state

`src/store/useCrmStore.ts` — Zustand store with `persist` middleware (localStorage key `crm-v1`):
- `verticals`, `leads`, `interactions`
- Actions: `addLead`, `updateLead`, `deleteLead`, `moveLead(id, status)`, `addInteraction`, vertical CRUD + reorder, `exportJSON`, `importJSON(payload, mode)`

`src/services/api.ts`:
- `const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_API === 'true'`
- `const BASE_URL = 'http://localhost:3400/api'`
- Exports `leadsApi`, `verticalsApi`, `interactionsApi` with `list/get/create/update/remove`
- Each function branches: remote → `fetch(BASE_URL + ...)`, local → reads/writes store
- Store actions call through these, so flipping the flag swaps the source

## Design tokens (`src/styles.css`)
- Dark theme as default (`<html class="dark">` in root)
- `--primary: oklch(...lavender mapped from #b4a0ff...)`, `--primary-foreground` near-black
- Status colors as CSS vars: `--status-prospecto`, `-contactado`, `-demo`, `-propuesta`, `-cerrado`, `-perdido` → registered in `@theme inline` so `bg-status-demo` works
- Inter loaded via `<link>` in `__root.tsx`

## File map (new)
```
src/
  routes/
    __root.tsx                  (extend: sidebar layout, dark class, Inter link)
    index.tsx                   (Dashboard — replaces placeholder)
    pipeline.tsx
    verticals.tsx
    import-export.tsx
  components/
    layout/AppSidebar.tsx
    layout/TopBar.tsx
    leads/LeadCard.tsx
    leads/LeadDrawer.tsx
    leads/AddLeadDialog.tsx
    leads/InteractionTimeline.tsx
    pipeline/KanbanBoard.tsx
    pipeline/KanbanColumn.tsx
    pipeline/VerticalFilterTabs.tsx
    verticals/VerticalRow.tsx
    dashboard/KpiCard.tsx
    dashboard/FollowUpsList.tsx
    dashboard/ActivityFeed.tsx
    dashboard/VerticalBarChart.tsx
    common/StatusBadge.tsx
    common/VerticalBadge.tsx
  store/useCrmStore.ts
  services/api.ts
  lib/seed.ts
  lib/types.ts
  lib/format.ts                 (currency USD, dates es-AR)
```

## Dependencies to add
`zustand`, `@dnd-kit/core`, `@dnd-kit/sortable`, `recharts`, `date-fns`, `sonner` (toasts), `react-hook-form`, `zod`, `@hookform/resolvers`

## Out of scope (v1)
- Auth / multi-user (single-user local app)
- Real backend — only the service layer abstraction
- Bulk edit, custom pipeline stages, attachments, email sync

## Open question
Verticals deletion when leads exist: **block with message** (simpler) vs **prompt to reassign to another vertical** before deleting. I'll go with **block** unless you prefer reassign.

Confirm and I'll build it.
