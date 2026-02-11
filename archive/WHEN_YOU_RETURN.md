# Session Summary - Feb 11, 2026

## What Was Done This Session

### 1. Cost Item — Tender Winner Info in Expanded Row
- CostsTab.tsx now loads all project tenders in parallel and builds a `tendersMap`
- Expanded cost item row shows winner card: name, contract amount, estimated budget, selection date, management remarks, tender notes
- Includes "view tender" link that deep-links to the specific tender

### 2. Tender Deep-Link Navigation
- TendersSubTab.tsx reads `?tender=<id>` URL param after loading
- Scrolls to the specific tender card with smooth animation
- Adds temporary highlight ring (3 seconds) then cleans up the URL param
- Each tender card has `id={tender-card-${tender.id}}` for targeting

### 3. Payment Schedule — Sequential Dates
- PaymentScheduleModal.tsx enforces sequential payment dates
- `min` attribute on date picker based on previous row's date
- Validation rejects out-of-order dates on submit
- Auto-clears later dates when an earlier date changes
- New row auto-fills date to previous + 1 day

### 4. Upcoming Payments List
- PaymentsSubTab.tsx shows "upcoming planned payments" section at top
- Date circles color-coded: red (overdue), amber (within 7 days), gray (later)
- Shows payment description, cost item, milestone, amount, days-until indicator
- Total sum footer

### 5. Budget Tab Removed
- Deleted BudgetTab.tsx and BudgetSubTab.tsx (legacy budget_categories/chapters/items system)
- Removed budget from FinancialTab.tsx SubTabValue and sub-tabs array
- CostsTab is the replacement — its header says "Replaces: Planning Estimate + Execution Estimate + Budget"

### 6. Professionals Tab — Clickable Tender Tags
- Tender badge in ProfessionalsTab.tsx is now a clickable button
- Navigates to `?tab=financial&subtab=tenders&tender=<id>` (uses deep-link from fix #2)
- Works in both desktop table and mobile card views

### 7. Tender Card — More Info Section
- New "details section" between header and winner banner
- Shows: tender type badge, linked milestone, contract amount vs estimated (with savings/overrun), notes, management remarks
- Previously this data existed in DB but was never displayed

### 8. Tender Actions — UI Improvements
- Bigger header "actions for tender" with contextual subtitle (changes per status)
- Hebrew `title` tooltips on every action button
- Better spacing and visual hierarchy (padding, gaps, min-width)

### 9. Tender Workflow (from previous session, committed together)
- SendBOMEmailModal improvements
- TenderParticipantsService updates
- Types updates

### Commit
All changes committed as `3eded5d`:
> feat: UI testing fixes — winner info, deep-links, payments, budget removal, tender details

---

## Current State
- **Branch:** main
- **Dev server:** localhost:5173
- **DB:** Neon PostgreSQL (project: hidden-violet-78825933, "AB-Projects")
- **DB mode:** Neon (live) — seeded with 2 projects (Villa Herzliya + Netanya Complex)
- **TypeScript:** compiles clean (`npx tsc --noEmit` passes)

---

## Pending Issues / Next Tasks

### High Priority
1. **Rename tab** "financial management" to "cost control" in ProjectDetailPage.tsx
2. **Redesign global Cost Control page** (`/cost-control`) as project overview dashboard
3. **Permits table migration** — permits table doesn't exist in Neon DB yet, need migration
4. **Replace URL text input** with file upload for participant quote files in tenders

### Medium Priority
5. Show all notes/remarks in tender winner banner (management + tender + participant)
6. Show management_remarks + tender.notes in tender card header area
7. Add 4th tender stats card: "gap from estimate" (estimated budget vs lowest offer)

### Lower Priority / Client Decision Needed
8. Review CLIENT_QUESTIONS.md answers before building schedule/payment system
9. Review CLIENT_QUESTIONS_COSTS.md answers before enhancing costs dashboard

---

## Architecture Notes

### Data Flow
```
CostItem (draft) → Create Tender (tender_draft) → Add Participants → Send BOM (tender_open) → Select Winner (tender_winner)
                                                                                                      ↓
                                                                                          PaymentSchedule → ScheduleItems → Pay
```

### Key Tables (Neon)
- `projects` — main project records
- `cost_items` — unified cost tracking (replaced old budget system)
- `tenders` — tender management with status flow
- `tender_participants` — professionals participating in tenders
- `payment_schedules` + `schedule_items` — milestone-based payments
- `project_professionals` — professionals assigned to projects (manual or tender-based)
- `project_milestones` — project milestones/timeline
- `permits` — NOT YET IN DB (only in localStorage via permitsData.ts)

### Key Files
- `src/pages/Projects/tabs/CostsTab.tsx` — main cost management
- `src/pages/Projects/tabs/subtabs/TendersSubTab.tsx` — tender cards (~2000 lines)
- `src/pages/Projects/tabs/subtabs/PaymentsSubTab.tsx` — payment tracking
- `src/pages/Projects/tabs/FinancialTab.tsx` — sub-tab router (costs, tenders, payments, cashflow)
- `src/pages/Projects/tabs/ProfessionalsTab.tsx` — project professionals with tender links
- `src/components/Costs/PaymentScheduleModal.tsx` — payment schedule creation
