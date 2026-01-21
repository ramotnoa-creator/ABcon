# Testing & Security Plan

## 📊 Test Data Strategy

### Option A: Complete the Seed Data File ✅ RECOMMENDED
**What:** Finish `src/data/seedData.ts` with comprehensive edge cases

**Pros:**
- Full control over specific scenarios
- Easy to maintain and version control
- Can target specific edge cases
- Works for both localStorage and Neon

**Cons:**
- Manual work to create all variations
- Need to maintain referential integrity

**Implementation:**
1. Complete all entity seed data (budgets, items, payments, milestones, etc.)
2. Include edge cases per entity
3. Create seed/clear functions
4. Add UI button in dev mode to trigger seeding

### Option B: Data Generator/Factory
**What:** Create faker-style generators that produce random realistic data

**Pros:**
- Can generate thousands of records quickly
- Good for performance testing
- Randomization finds unexpected issues

**Cons:**
- Harder to reproduce specific bugs
- Need to maintain generators
- May create invalid combinations

### Option C: Hybrid Approach ⭐ BEST
**What:** Hand-crafted edge cases + generator for bulk data

**Implementation:**
1. Use seedData.ts for specific edge case scenarios (5-10 projects)
2. Add generators for bulk testing (100+ projects)
3. Separate dev mode vs production data

---

## 🔒 Security Testing Plan

### 1. SQL Injection Protection ✅ Already Implemented
**Status:** Using parameterized queries everywhere

**To Verify:**
- [ ] Audit all executeQuery/executeQuerySingle calls
- [ ] Test with malicious input: `'; DROP TABLE projects; --`
- [ ] Test special characters: quotes, backslashes, unicode

**Tool:** Manual code review + input fuzzing

### 2. Row Level Security (RLS) Testing
**Status:** Policies defined in `002_rls_policies.sql`

**To Test:**
- [ ] User A cannot see User B's projects
- [ ] Cannot access projects without assignment
- [ ] Cannot modify other users' data
- [ ] Test with multiple user sessions

**Tool:** Manual testing with 2+ user accounts

### 3. Authentication & Authorization
**Status:** AuthContext implemented

**To Test:**
- [ ] Cannot access app without login
- [ ] Session expiration handling
- [ ] Token refresh logic
- [ ] Password reset flow
- [ ] Logout clears sensitive data

**Tool:** Manual testing + Neon Auth dashboard

### 4. Input Validation
**Status:** TypeScript types + some HTML validation

**Gaps:**
- [ ] No server-side validation yet
- [ ] File upload size limits not enforced
- [ ] Email format validation missing
- [ ] Phone number format inconsistent

**To Add:**
- Zod schema validation on all forms
- File size/type restrictions
- Sanitize HTML in rich text fields

### 5. XSS Prevention
**Status:** React escapes by default

**To Test:**
- [ ] Try injecting `<script>alert('XSS')</script>` in text fields
- [ ] Test markdown/rich text areas
- [ ] Check file upload handling

**Tool:** Manual testing + browser DevTools

### 6. Data Privacy & GDPR
**Considerations:**
- [ ] User data export capability
- [ ] User data deletion (right to be forgotten)
- [ ] Audit trail for sensitive operations
- [ ] Data retention policy

---

## 🧪 Testing Agents & Tools

### Automated Testing Agents

#### 1. **GitHub Copilot / Claude for Test Generation**
**Use:** Generate unit tests for services
```typescript
// Example: Generate tests for budgetService
describe('budgetService', () => {
  it('should handle null budget gracefully', async () => {
    // AI can generate these
  });
});
```

#### 2. **Playwright / Cypress for E2E Testing**
**Use:** Automate user flows
- Login → Create Project → Add Budget → Verify total
- Tender flow → Winner selection → Budget creation
- File upload → Attachment to entity

#### 3. **Jest for Unit Testing**
**Use:** Test service layer functions
- Mock Neon DB responses
- Test error handling
- Test data transformations

#### 4. **ESLint Security Plugin**
**Install:** `eslint-plugin-security`
**Detects:**
- Unsafe regex patterns
- Potential command injection
- Hardcoded secrets

#### 5. **Snyk or npm audit**
**Use:** Scan dependencies for vulnerabilities
```bash
npm audit
npm audit fix
```

#### 6. **OWASP ZAP (Zed Attack Proxy)**
**Use:** Automated security scanning
- SQL injection tests
- XSS tests
- CSRF tests
- Header security

#### 7. **Lighthouse CI**
**Use:** Performance + Security audit
- Runs in CI/CD
- Checks HTTPS, CSP headers, etc.

### Manual Testing Checklist

#### Functional Testing
- [ ] CRUD operations for all entities
- [ ] Cascade deletes work correctly
- [ ] Foreign key constraints enforced
- [ ] Date range filters work
- [ ] Search/filter functionality
- [ ] Pagination with large datasets
- [ ] Concurrent user operations

#### Security Testing
- [ ] Try to access other users' data via URL manipulation
- [ ] Test with expired/invalid tokens
- [ ] SQL injection attempts in all input fields
- [ ] XSS attempts in text areas
- [ ] CSRF token validation
- [ ] File upload malicious files (.exe, .php)
- [ ] API rate limiting

#### Performance Testing
- [ ] Load 100+ projects
- [ ] Load 1000+ budget items
- [ ] Parallel API calls
- [ ] Large file uploads
- [ ] Mobile device performance
- [ ] Slow network conditions

#### Browser/Device Testing
- [ ] Chrome, Firefox, Safari, Edge
- [ ] Mobile browsers (iOS Safari, Chrome Android)
- [ ] Tablet layouts
- [ ] Dark mode in all browsers
- [ ] RTL layout (Hebrew text)

---

## 🎯 Recommended Testing Priorities

### Phase 1: Core Functionality (Week 1)
1. Complete seedData.ts with all edge cases
2. Add seeding UI in dev mode
3. Manual CRUD testing for all entities
4. Verify RLS policies with 2 users

### Phase 2: Security (Week 2)
1. SQL injection testing (manual + automated)
2. Input validation with Zod schemas
3. File upload security
4. npm audit + fix vulnerabilities
5. ESLint security plugin setup

### Phase 3: Automation (Week 3)
1. Jest unit tests for services (target 80% coverage)
2. Playwright E2E tests for critical flows
3. CI/CD integration with test runs

### Phase 4: Performance & Polish (Week 4)
1. Load testing with large datasets
2. Performance profiling
3. Mobile testing
4. OWASP ZAP scan
5. Lighthouse audit

---

## 🚀 Quick Wins (Do These Now)

1. **Finish seedData.ts** - Create comprehensive test data (2-3 hours)
2. **Add dev seed button** - UI to trigger seeding (30 min)
3. **npm audit fix** - Fix known vulnerabilities (15 min)
4. **Manual security test** - Try SQL injection in one form (15 min)
5. **Create 2 test users** - Test RLS policies (30 min)

---

## 📝 Test Data Edge Cases to Include

### Projects
- ✅ Various statuses (planning, permits, execution, archive)
- ✅ Overdue project (permit_target_date in past)
- ✅ No permit dates (optional fields null)
- ✅ Very long names (>100 chars)
- ✅ Special characters in address
- ✅ Empty notes vs very long notes

### Professionals
- ✅ Inactive professional
- ✅ Missing optional fields (email, license, address)
- ✅ Duplicate names (test search)
- ✅ All professional types represented
- [ ] Professional with no projects
- [ ] Professional with 10+ projects

### Budget Items
- [ ] Zero quantity
- [ ] Very large amount (>10M)
- [ ] Negative paid_amount (refund scenario)
- [ ] 100% paid vs 0% paid
- [ ] Past due expected_payment_date
- [ ] Multiple payments for same item

### Tenders
- [ ] Tender with 0 participants
- [ ] Tender with 10+ participants
- [ ] Tied bids (same amount)
- [ ] Winner selected but no contract_amount
- [ ] Canceled tender with participants
- [ ] Past due_date, not closed

### Milestones
- [ ] Past date, not completed (overdue)
- [ ] Future date, already completed (early)
- [ ] Milestone with 0 gantt tasks
- [ ] Milestone with 50+ gantt tasks
- [ ] Duplicate milestone names

### Files
- [ ] Very large file_size
- [ ] Missing file_url (broken link)
- [ ] Duplicate file names
- [ ] No related_entity (orphaned file)
- [ ] All file types (PDF, IMG, DOC, XLS)

### Special Issues
- [ ] All priority levels
- [ ] Open issue >90 days old
- [ ] Resolved issue with no resolution text
- [ ] Multiple images (5+ URLs)
- [ ] No responsible person
- [ ] All categories represented

---

## 🛡️ Security Hardening Recommendations

### Immediate (Critical)
1. **Add input validation** - Zod schemas on all forms
2. **File upload limits** - Max size, allowed types
3. **Rate limiting** - Prevent API abuse
4. **HTTPS only** - Force HTTPS in production
5. **Secure headers** - CSP, X-Frame-Options, etc.

### Short Term (Important)
1. **Audit logging** - Track who changed what
2. **2FA option** - Multi-factor authentication
3. **API keys rotation** - Don't hardcode secrets
4. **Backup strategy** - Regular DB backups
5. **Error messages** - Don't leak sensitive info

### Long Term (Nice to Have)
1. **Penetration testing** - Hire security firm
2. **Bug bounty program** - Crowdsource security
3. **SOC2 compliance** - If enterprise customers
4. **Data encryption at rest** - Encrypt sensitive fields
5. **Security training** - For development team
