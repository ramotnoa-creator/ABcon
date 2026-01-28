# Phase 6: Polish, Testing & Deployment - Execution Plan

```yaml
wave: 1
depends_on: ['05-budget-auto-update']
files_modified:
  - All files (polish, optimization, bug fixes)
  - tests/* (comprehensive test suite)
  - docs/* (user documentation)
autonomous: false
```

## Objective

Make the system production-ready. Complete test coverage, security hardening, performance optimization, user documentation, training, and successful deployment to production.

## Context

**Current state:**
- Phases 1-5 complete: Full functionality implemented
- Features work but need polish
- Some edge cases may not be handled
- No comprehensive test suite yet
- Not production-tested

**What we're doing:**
- Complete E2E test suite
- Security audit and fixes
- Performance optimization
- User documentation
- Training session
- Production deployment
- Monitoring setup

## Tasks

<task id="6.1" title="Complete E2E test suite">
<description>
Create comprehensive end-to-end tests covering all critical workflows.

**File:** `tests/estimate-integration-e2e.spec.ts`

**Critical workflows to test:**

```typescript
describe('Complete Estimate → Budget Workflow', () => {
  test('Happy path: Planning estimate through budget', async ({ page }) => {
    // 1. Login as manager
    // 2. Navigate to project
    // 3. Go to Financial tab → Planning Estimate
    // 4. Create estimate with 3 items
    // 5. Verify totals calculate (with 17% VAT)
    // 6. Export to tender
    // 7. Verify tender created with estimate data
    // 8. Upload BOM file
    // 9. Add 3 participants
    // 10. Enter quotes for each
    // 11. Select winner (lowest quote)
    // 12. Verify variance preview modal
    // 13. Confirm winner
    // 14. Verify budget item auto-created
    // 15. Go to Budget sub-tab
    // 16. Verify variance columns show green (saved money)
    // 17. Export to Excel
    // 18. Verify Excel includes variance
  });

  test('Execution estimate workflow', async ({ page }) => {
    // Same as above but execution type
  });

  test('Permission filtering', async ({ page }) => {
    // Login as Manager → see only own projects
    // Login as Accountancy → see all projects
    // Login as Super Manager → see all projects
    // Verify Entrepreneur sees own only
  });

  test('Variance recalculation on edit', async ({ page }) => {
    // Create estimate + tender + budget
    // Edit budget amount
    // Verify variance updates
    // Verify color changes (green → red if crossed zero)
  });

  test('Mobile responsive', async ({ page }) => {
    // Set mobile viewport
    // Navigate through all tabs
    // Verify layouts work
    // Verify touch targets adequate
  });
});

describe('Error Handling', () => {
  test('BOM file too large', async ({ page }) => {
    // Try to upload 15MB file
    // Verify error message
    // Verify file not uploaded
  });

  test('Invalid file type', async ({ page }) => {
    // Try to upload .pdf instead of .docx
    // Verify rejection
  });

  test('Network error during save', async ({ page }) => {
    // Simulate offline
    // Edit estimate item
    // Verify queued for retry
    // Reconnect → verify saved
  });

  test('Concurrent edits', async ({ page }) => {
    // Two users edit same estimate
    // Verify last write wins
    // Verify no data corruption
  });
});
```

**Acceptance:**
- All critical workflows covered
- Tests pass consistently (no flakes)
- Run in <5 minutes total
- Generate coverage report
- Tests run in CI/CD
</description>
</task>

<task id="6.2" title="Security audit and fixes">
<description>
Perform security audit and fix vulnerabilities.

**Areas to audit:**

1. **File Upload Security**
   - Validate file types (magic bytes, not just extension)
   - Scan for malware (if possible)
   - Prevent path traversal
   - Limit file size strictly
   - Sanitize file names

2. **SQL Injection Prevention**
   - Review all database queries
   - Ensure using parameterized queries
   - No string concatenation in SQL
   - Use sql`` template literals correctly

3. **XSS Prevention**
   - Sanitize user input in descriptions, notes
   - Escape HTML in render
   - Use React's built-in XSS protection
   - No dangerouslySetInnerHTML without sanitization

4. **Permission Bypass Attempts**
   - Test permission filters thoroughly
   - Verify API endpoints check permissions
   - No direct database access without checks
   - Session validation on all requests

5. **Data Validation**
   - Validate all inputs (client and server)
   - Check number ranges (no negative totals, etc.)
   - Sanitize special characters
   - Prevent integer overflow

**Implementation:**
```typescript
// File upload validation
const validateBOMFile = (file: File) => {
  // Check extension
  if (!file.name.match(/\.(doc|docx)$/i)) {
    throw new Error('Invalid file type');
  }

  // Check size
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large');
  }

  // Check magic bytes (actual file type)
  const reader = new FileReader();
  reader.onload = (e) => {
    const bytes = new Uint8Array(e.target.result);
    const header = bytes.slice(0, 4);

    // Word docs start with D0 CF 11 E0 (OLE) or 50 4B 03 04 (ZIP/DOCX)
    const isDoc = header[0] === 0xD0 && header[1] === 0xCF;
    const isDocx = header[0] === 0x50 && header[1] === 0x4B;

    if (!isDoc && !isDocx) {
      throw new Error('File is not a Word document');
    }
  };
  reader.readAsArrayBuffer(file);

  // Sanitize filename
  const safeName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 255);

  return safeName;
};

// SQL injection prevention
const getEstimate = async (estimateId: string) => {
  // GOOD: Parameterized
  const result = await sql`
    SELECT * FROM estimates
    WHERE id = ${estimateId}
  `;

  // BAD: String concatenation (NEVER DO THIS)
  // const query = `SELECT * FROM estimates WHERE id = '${estimateId}'`;
};

// XSS prevention
const renderDescription = (description: string) => {
  // React escapes by default, but for rich text:
  return <div dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(description)
  }} />;
};
```

**Acceptance:**
- No SQL injection vulnerabilities
- File uploads validated properly
- XSS prevented
- Permission checks robust
- All inputs validated
- Security scan passes
</description>
</task>

<task id="6.3" title="Performance optimization">
<description>
Optimize for speed and scalability.

**Optimizations:**

1. **Database Indexes**
   - Already have indexes on foreign keys
   - Add composite indexes for common queries
   ```sql
   CREATE INDEX idx_budget_items_project_estimate
   ON budget_items(project_id, estimate_item_id)
   WHERE estimate_item_id IS NOT NULL;

   CREATE INDEX idx_estimate_items_estimate_order
   ON estimate_items(estimate_id, order_index);
   ```

2. **Query Optimization**
   - Use joins instead of N+1 queries
   - Paginate large lists
   - Cache frequently accessed data

   ```typescript
   // GOOD: Single query with join
   const budgetsWithVariance = await sql`
     SELECT
       bi.*,
       ei.total_with_vat as estimate_amount,
       (bi.total_with_vat - ei.total_with_vat) as variance_amount
     FROM budget_items bi
     LEFT JOIN estimate_items ei ON bi.estimate_item_id = ei.id
     WHERE bi.project_id = ${projectId}
   `;

   // BAD: N+1 queries
   // const items = await getBudgetItems(projectId);
   // for (const item of items) {
   //   item.estimate = await getEstimateItem(item.estimate_item_id);
   // }
   ```

3. **React Optimization**
   - Use React.memo for expensive components
   - useCallback for event handlers
   - useMemo for calculations
   - Virtual scrolling for long lists

   ```typescript
   const EstimateItemsTable = React.memo(({ items }) => {
     const sortedItems = useMemo(
       () => items.sort((a, b) => a.order_index - b.order_index),
       [items]
     );

     const handleDelete = useCallback((id) => {
       deleteEstimateItem(id);
     }, []);

     return <VirtualList items={sortedItems} />;
   });
   ```

4. **Lazy Loading & Code Splitting**
   - Already implemented in Phase 2
   - Verify all tabs load lazily
   - Split large components

5. **Caching**
   - React Query caching (5 minutes)
   - localStorage for offline support
   - Service worker for static assets

**Performance targets:**
- Initial page load: <2 seconds
- Tab switching: <500ms
- Form submit: <1 second
- Export Excel (1000 rows): <5 seconds

**Acceptance:**
- All targets met
- No performance regressions
- Lighthouse score >90
- No memory leaks
</description>
</task>

<task id="6.4" title="Error handling and validation">
<description>
Comprehensive error handling throughout the app.

**Error handling strategy:**

1. **User-friendly messages**
   ```typescript
   try {
     await createEstimate(data);
   } catch (error) {
     // BAD: Technical error shown to user
     // showToast(error.message);

     // GOOD: User-friendly message
     if (error.code === 'UNIQUE_VIOLATION') {
       showToast('An estimate with this name already exists', 'error');
     } else if (error.code === 'NETWORK_ERROR') {
       showToast('Network error. Please check your connection.', 'error');
     } else {
       showToast('Failed to create estimate. Please try again.', 'error');
       // Log technical error for debugging
       console.error('Create estimate error:', error);
     }
   }
   ```

2. **Form validation**
   - Required fields
   - Number ranges
   - Format validation
   - Real-time feedback

   ```typescript
   const validate = (values) => {
     const errors = {};

     if (!values.description) {
       errors.description = 'Description is required';
     }

     if (values.quantity <= 0) {
       errors.quantity = 'Quantity must be positive';
     }

     if (values.unit_price < 0) {
       errors.unit_price = 'Price cannot be negative';
     }

     return errors;
   };
   ```

3. **Network error handling**
   - Retry logic
   - Offline queue
   - Optimistic updates

4. **Edge cases**
   - Empty states
   - Null/undefined values
   - Division by zero
   - Very large numbers

**Acceptance:**
- All errors caught and handled
- User sees helpful messages
- No uncaught exceptions
- Edge cases handled
</description>
</task>

<task id="6.5" title="Create user documentation">
<description>
Write comprehensive user documentation.

**Documents to create:**

1. **Quick Start Guide (PDF)**
   - How to create an estimate
   - How to export to tender
   - How to select winner
   - How variance works
   - Screenshots for each step

2. **Feature Documentation**
   - Planning vs Execution estimates
   - BOM file management
   - Variance tracking
   - Filters and exports
   - Keyboard shortcuts

3. **Admin Guide**
   - User permissions
   - Troubleshooting
   - Data migration
   - Backup/restore

4. **In-App Tooltips**
   - Add help icons with tooltips
   - Contextual help text
   - Empty state messages

**Implementation:**
```tsx
<Tooltip content="Planning estimates cover design and permitting costs up to construction approval">
  <InfoIcon />
</Tooltip>

<EmptyState
  icon={<EstimateIcon />}
  title="No estimates yet"
  description="Create your first planning estimate to get started. Estimates help you track costs before sending tenders."
  action={<Button onClick={createEstimate}>Create Estimate</Button>}
/>
```

**Acceptance:**
- Quick Start Guide complete with screenshots
- All features documented
- Tooltips added to complex features
- Empty states helpful
- Documentation clear and concise
</description>
</task>

<task id="6.6" title="Mobile responsiveness verification">
<description>
Test and fix mobile/tablet experience.

**Devices to test:**
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPad (768px)
- iPad Pro (1024px)
- Android phone (360px)

**Test scenarios:**
1. Navigate through all tabs
2. Create estimate with items
3. Fill out forms
4. Upload BOM file
5. Select winner
6. View budget with variance
7. Export to Excel

**Fixes needed:**
- Touch targets ≥44px
- Text readable (≥16px)
- Tables scrollable horizontally
- Forms stack on mobile
- Dropdowns work well on touch
- No horizontal scroll on mobile

**Acceptance:**
- Works on all test devices
- No usability issues
- Touch targets adequate
- Text readable
- Performance good on mobile
</description>
</task>

<task id="6.7" title="Accessibility improvements">
<description>
Ensure app is accessible.

**WCAG 2.1 Level AA compliance:**

1. **Keyboard navigation**
   - All features accessible via keyboard
   - Focus visible
   - Tab order logical
   - Shortcuts documented

2. **Screen reader support**
   - ARIA labels on all interactive elements
   - Alt text on images
   - Form labels proper
   - Error messages announced

3. **Color contrast**
   - Text contrast ≥4.5:1
   - Variance colors distinguishable
   - Not relying on color alone

4. **Semantic HTML**
   - Proper heading hierarchy
   - Lists for list data
   - Buttons for actions
   - Links for navigation

**Implementation:**
```tsx
<button
  onClick={handleDelete}
  aria-label="Delete estimate item"
  className="focus:ring-2 focus:ring-blue-500"
>
  <DeleteIcon aria-hidden="true" />
</button>

<input
  id="quantity"
  type="number"
  aria-required="true"
  aria-invalid={errors.quantity ? "true" : "false"}
  aria-describedby={errors.quantity ? "quantity-error" : undefined}
/>
{errors.quantity && (
  <span id="quantity-error" role="alert">
    {errors.quantity}
  </span>
)}
```

**Acceptance:**
- Keyboard navigation works
- Screen reader friendly
- Color contrast passes
- Semantic HTML used
- Accessibility audit passes
</description>
</task>

<task id="6.8" title="Conduct user training session">
<description>
Train Niv and team on new features.

**Training agenda:**

1. **Introduction (10 min)**
   - Overview of Cost Control page
   - Navigation changes (1 menu item)
   - Workflow: Estimate → Tender → Budget

2. **Demo: Creating Estimates (20 min)**
   - Create planning estimate
   - Add items with VAT calculations
   - Edit and delete items
   - Create execution estimate

3. **Demo: Export to Tender (15 min)**
   - Export estimate to tender
   - Upload BOM file
   - Add participants
   - Send BOM (manual for now)

4. **Demo: Winner Selection (15 min)**
   - Enter quotes
   - Select winner
   - Review variance preview
   - Confirm → budget created

5. **Demo: Variance Tracking (10 min)**
   - View budget with variance columns
   - Filter items with variance
   - Color coding explained
   - Export to Excel

6. **Q&A (20 min)**
   - Answer questions
   - Clarify workflows
   - Address concerns

7. **Hands-on Practice (30 min)**
   - Users try creating estimate
   - Walk through full workflow
   - Troubleshoot issues

**Deliverables:**
- Training slide deck
- Screen recording of demo
- Feedback form
- Issue log

**Acceptance:**
- Training session completed
- Users understand features
- Feedback collected
- Issues logged
- Follow-up scheduled
</description>
</task>

<task id="6.9" title="Production deployment">
<description>
Deploy to production safely.

**Pre-deployment checklist:**
- [ ] All tests pass
- [ ] Security audit complete
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] Training done
- [ ] Backup created
- [ ] Rollback plan ready
- [ ] Monitoring configured

**Deployment steps:**

1. **Database Migration**
   ```bash
   # Backup production database
   pg_dump $PROD_DB > backup_$(date +%Y%m%d).sql

   # Run migrations
   psql $PROD_DB < migrations/001-create-estimates.sql
   psql $PROD_DB < migrations/002-alter-tenders-budget.sql

   # Verify migrations
   psql $PROD_DB -c "\dt estimates"
   psql $PROD_DB -c "SELECT COUNT(*) FROM estimates;"
   ```

2. **Deploy Code**
   ```bash
   # Build production bundle
   npm run build

   # Deploy to hosting (Vercel/Netlify/etc.)
   vercel --prod

   # Verify deployment
   curl https://abcon.app/cost-control
   ```

3. **Smoke Tests**
   - Login as each user type
   - Navigate to Cost Control page
   - Create test estimate
   - Export to tender
   - Verify budget features

4. **Monitor**
   - Check error logs (first hour)
   - Monitor performance metrics
   - Watch user activity
   - Be ready to rollback

**Rollback plan:**
If critical issues:
1. Revert code deployment
2. Rollback database migrations
3. Restore from backup if needed
4. Notify users of downtime

**Acceptance:**
- Deployed to production
- Smoke tests pass
- No critical errors
- Users can access
- Monitoring active
</description>
</task>

<task id="6.10" title="Set up monitoring and error tracking">
<description>
Monitor production for issues.

**Tools to set up:**

1. **Error Tracking (Sentry)**
   ```typescript
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: 'production',
     tracesSampleRate: 0.1,
   });

   // Catch and report errors
   try {
     await createEstimate(data);
   } catch (error) {
     Sentry.captureException(error, {
       tags: { feature: 'estimates' },
       extra: { data }
     });
     throw error;
   }
   ```

2. **Performance Monitoring**
   - Track page load times
   - API response times
   - Database query performance

3. **User Analytics**
   - Track feature usage
   - Conversion funnels
   - User paths

4. **Alerts**
   - Email on critical errors
   - Slack notification on spikes
   - Dashboard for real-time monitoring

**Acceptance:**
- Error tracking active
- Performance monitored
- Analytics collecting data
- Alerts configured
- Dashboard accessible
</description>
</task>

## Verification Criteria

### Must Work
- [ ] All E2E tests pass
- [ ] Security audit passes
- [ ] Performance targets met
- [ ] User documentation complete
- [ ] Training session done
- [ ] Production deployment successful
- [ ] Monitoring active

### Quality Metrics
- [ ] Test coverage >80%
- [ ] Lighthouse score >90
- [ ] No critical security issues
- [ ] User satisfaction ≥8/10
- [ ] Zero data loss incidents

### Production Health
- [ ] <1% error rate
- [ ] <2 second page load
- [ ] >99% uptime
- [ ] All features functional
- [ ] Users can work without issues

## must_haves

**For phase goal: "Production-ready system"**

1. **Comprehensive testing**
   - E2E tests cover all workflows
   - Security audited
   - Performance optimized
   - No critical bugs

2. **User-ready**
   - Documentation complete
   - Training done
   - Feedback collected
   - Support plan in place

3. **Production deployed**
   - Database migrated
   - Code deployed
   - Smoke tests pass
   - No rollback needed

4. **Monitored**
   - Error tracking active
   - Performance monitored
   - Alerts configured
   - Can respond to issues

5. **Successful adoption**
   - Users trained
   - Features used
   - Feedback positive
   - No showstoppers

## Success Indicator

**Phase 6 (and entire project) is complete when:**

1. ✅ All 6 phases delivered
2. ✅ All tests pass (unit + E2E)
3. ✅ Production deployed successfully
4. ✅ Users trained and happy
5. ✅ Monitoring shows healthy system
6. ✅ Niv approves for production use

**First week post-launch metrics:**
- >10 estimates created
- >5 tenders from estimates
- >3 winner selections with variance
- Zero critical bugs
- No user complaints

**Project success = Users creating estimates, exporting to tenders, tracking variance successfully.**
