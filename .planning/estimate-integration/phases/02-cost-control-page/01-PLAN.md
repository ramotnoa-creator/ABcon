# Phase 2: Cost Control Page Structure - Execution Plan

```yaml
wave: 1
depends_on: ['01-database-foundation']
files_modified:
  - src/pages/CostControl/CostControlPage.tsx
  - src/pages/CostControl/tabs/EstimatesTabContent.tsx
  - src/pages/CostControl/tabs/TendersTabContent.tsx
  - src/pages/CostControl/tabs/BudgetTabContent.tsx
  - src/components/Layout/Navigation.tsx
  - src/App.tsx
autonomous: false
```

## Objective

Build unified Cost Control page (בקרת עלויות) with 3 tabs that replaces separate Budget and Tenders pages. Create the navigation framework that all financial data will live in.

## Context

**Current state:**
- Separate GlobalBudgetPage and GlobalTendersPage
- Navigation has 2 menu items (תקציב, מכרזים)
- Phase 1 complete: database and services exist

**What we're building:**
- Single CostControlPage with 3 tabs
- Tab 1: Estimates (new)
- Tab 2: Tenders (migrated from GlobalTendersPage)
- Tab 3: Budget (migrated from GlobalBudgetPage + variance columns)
- Simplified navigation (1 menu item)

## Tasks

<task id="2.1" title="Create CostControlPage component">
<description>
Create main page component with 3-tab structure.

**File:** `src/pages/CostControl/CostControlPage.tsx`

**Structure:**
```typescript
const CostControlPage = () => {
  const [activeTab, setActiveTab] = useState('estimates');

  return (
    <div className="cost-control-page">
      <PageHeader
        title="בקרת עלויות"
        subtitle="Cost Control"
        actions={[
          <ExportButton />,
          <NewItemButton />
        ]}
      />

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab label="אומדן" value="estimates" icon={<AssessmentIcon />} />
        <Tab label="מכרזים" value="tenders" icon={<DescriptionIcon />} />
        <Tab label="תקציב" value="budget" icon={<AccountBalanceIcon />} />
      </Tabs>

      <TabContent>
        {activeTab === 'estimates' && <EstimatesTabContent />}
        {activeTab === 'tenders' && <TendersTabContent />}
        {activeTab === 'budget' && <BudgetTabContent />}
      </TabContent>
    </div>
  );
};
```

**URL routing:** Use query param `?tab=estimates|tenders|budget`

**Acceptance:**
- Page renders without errors
- Tab switching works
- URL updates on tab change
- Default tab is estimates
- Responsive layout
</description>
</task>

<task id="2.2" title="Create EstimatesTabContent">
<description>
Create Estimates tab showing all estimates across projects.

**File:** `src/pages/CostControl/tabs/EstimatesTabContent.tsx`

**Features:**
- KPI cards: Total estimates, Planning vs Execution split, Total value
- Filters: Project, Type (planning/execution), Status, Date range
- Table with columns: Project | Name | Type | Total Amount | Status | Created | Actions
- Search by name/description
- Export to Excel button
- Click row to navigate to project Financial tab

**Data source:** `getAllEstimates()` from estimatesService

**Acceptance:**
- Displays all estimates (permission-filtered)
- Filters work correctly
- Table sorts by clicking column headers
- Search filters list real-time
- Export downloads Excel file
- Click navigates to project
</description>
</task>

<task id="2.3" title="Migrate TendersTabContent">
<description>
Migrate existing GlobalTendersPage content to new tab.

**File:** `src/pages/CostControl/tabs/TendersTabContent.tsx`

**Migration steps:**
1. Copy GlobalTendersPage component code
2. Rename to TendersTabContent
3. Remove page-level header (CostControlPage handles it)
4. Keep all existing features:
   - KPI cards
   - Tender cards
   - Participant lists
   - Price statistics
   - Winner selection
   - CSV export

**Acceptance:**
- All existing tender features work
- No regression in functionality
- Styling matches new page design
- Performance same or better
</description>
</task>

<task id="2.4" title="Migrate and enhance BudgetTabContent">
<description>
Migrate GlobalBudgetPage and add variance columns.

**File:** `src/pages/CostControl/tabs/BudgetTabContent.tsx`

**Migration:**
- Copy GlobalBudgetPage code
- Rename to BudgetTabContent
- Remove page header

**Enhancements:**
Add variance columns to table:
- **Estimate** (₪) - from estimate_amount field
- **Variance ₪** - from variance_amount field
- **Variance %** - from variance_percent field
- Color coding: 🟢 Green (saved), 🔴 Red (over), ⚪ Gray (no estimate)

Add filter: "Show items with variance only"

**Table columns (updated):**
```
Project | Category | Chapter | Estimate | Budget | Paid | Variance ₪ | Variance % | Status
```

**Acceptance:**
- All budget features preserved
- Variance columns display correctly
- Color coding works
- Filter shows only items with estimates
- No performance degradation
</description>
</task>

<task id="2.5" title="Implement lazy loading">
<description>
Lazy load tab content for performance.

**Implementation:**
```typescript
const EstimatesTabContent = lazy(() => import('./tabs/EstimatesTabContent'));
const TendersTabContent = lazy(() => import('./tabs/TendersTabContent'));
const BudgetTabContent = lazy(() => import('./tabs/BudgetTabContent'));

// Only load data when tab active
useEffect(() => {
  if (activeTab === 'estimates') {
    loadEstimates();
  } else if (activeTab === 'tenders') {
    loadTenders();
  } else if (activeTab === 'budget') {
    loadBudgets();
  }
}, [activeTab]);
```

**Acceptance:**
- Only active tab content loaded
- Tab switching < 500ms
- Loading spinner shows during load
- Data fetched only once per session (cache)
</description>
</task>

<task id="2.6" title="Update navigation menu">
<description>
Update main navigation to show single Cost Control item.

**File:** `src/components/Layout/Navigation.tsx`

**Changes:**
Remove:
```tsx
<NavItem href="/budget" icon="account_balance">תקציב</NavItem>
<NavItem href="/tenders" icon="description">מכרזים</NavItem>
```

Add:
```tsx
<NavItem href="/cost-control" icon="assessment">בקרת עלויות</NavItem>
```

**Acceptance:**
- Navigation shows one item instead of two
- Icon displays correctly
- Active state highlights when on page
- Mobile menu updated
</description>
</task>

<task id="2.7" title="Update routing">
<description>
Update app routing to use new page.

**File:** `src/App.tsx`

**Changes:**
Remove routes:
```tsx
<Route path="/budget" element={<GlobalBudgetPage />} />
<Route path="/tenders" element={<GlobalTendersPage />} />
```

Add route:
```tsx
<Route path="/cost-control" element={<CostControlPage />} />
```

Add redirects (for bookmarks):
```tsx
<Route path="/budget" element={<Navigate to="/cost-control?tab=budget" replace />} />
<Route path="/tenders" element={<Navigate to="/cost-control?tab=tenders" replace />} />
```

**Acceptance:**
- New route works
- Old URLs redirect correctly
- Query params preserved
- Browser back button works
</description>
</task>

<task id="2.8" title="Style and responsive design">
<description>
Ensure page looks good on all devices.

**Breakpoints:**
- Mobile (<640px): Stack tabs vertically, simplified table
- Tablet (640-1024px): Horizontal tabs, scrollable table
- Desktop (>1024px): Full layout with all columns

**Styling:**
- Match existing ABcon design system
- Use TailwindCSS classes
- Consistent spacing and colors
- Accessible (ARIA labels, keyboard navigation)

**Acceptance:**
- Looks good on iPhone, iPad, desktop
- No horizontal scroll on mobile
- Touch targets >44px
- Passes accessibility audit
</description>
</task>

<task id="2.9" title="Write E2E tests">
<description>
Test critical user flows.

**File:** `tests/cost-control-page.spec.ts`

**Test cases:**
```typescript
test('Navigate to Cost Control page', async ({ page }) => {
  // Click menu item → page loads
});

test('Switch between tabs', async ({ page }) => {
  // Click each tab → content changes → URL updates
});

test('Estimates tab shows data', async ({ page }) => {
  // Tab loads → table populated → can filter
});

test('Budget tab shows variance', async ({ page }) => {
  // Navigate to Budget tab → variance columns visible → colors correct
});

test('Old URLs redirect', async ({ page }) => {
  // Go to /budget → redirects to /cost-control?tab=budget
});
```

**Acceptance:**
- All tests pass
- Tests run in CI/CD
- No flaky tests
</description>
</task>

## Verification Criteria

### Must Work
- [ ] Cost Control page accessible at /cost-control
- [ ] All 3 tabs render without errors
- [ ] Tab switching updates URL and content
- [ ] Estimates tab shows all estimates
- [ ] Tenders tab has all previous features
- [ ] Budget tab shows variance columns
- [ ] Navigation menu updated (1 item, not 2)
- [ ] Old URLs redirect correctly

### Visual Quality
- [ ] Matches existing design system
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states show spinners
- [ ] Empty states show helpful messages
- [ ] Color coding clear (green/red/gray)

### Performance
- [ ] Initial page load < 2 seconds
- [ ] Tab switching < 500ms
- [ ] No layout shift when tabs load
- [ ] Lazy loading works

## must_haves

**For phase goal: "Build unified Cost Control page with 3-tab navigation"**

1. **Single page replaces two pages**
   - /cost-control route exists
   - Replaces /budget and /tenders
   - Navigation simplified (1 menu item)

2. **All 3 tabs functional**
   - Estimates: shows all estimates
   - Tenders: migrated from GlobalTendersPage
   - Budget: migrated from GlobalBudgetPage + variance

3. **Variance visible in Budget tab**
   - Estimate column
   - Variance ₪ column
   - Variance % column
   - Color coding (green/red/gray)

4. **No regression**
   - All budget features work
   - All tender features work
   - Existing functionality preserved

5. **Good UX**
   - Tab switching smooth
   - URL reflects active tab
   - Responsive design
   - Fast performance

## Success Indicator

**Phase 2 is complete when:**
1. User clicks "בקרת עלויות" in navigation → page loads
2. User sees 3 tabs (אומדן, מכרזים, תקציב)
3. User clicks each tab → content switches
4. Budget tab shows variance columns with colors
5. All existing budget/tender features work
6. Page performs well on mobile

## Notes

**Don't:**
- Break existing Budget/Tender functionality
- Remove features during migration
- Create new bugs

**Do:**
- Test thoroughly after migration
- Keep code organized (separate tab files)
- Use existing components where possible
- Follow performance best practices
