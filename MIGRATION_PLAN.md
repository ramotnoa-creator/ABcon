# Database Migration & Feature Completion Plan

## Current State Analysis

### ✅ What We Have
1. **Supabase Configuration**
   - URL: `https://acywgroltcpkcssckotc.supabase.co`
   - Auth configured and ready
   - Currently in demo mode (`VITE_DEV_MODE=true`)

2. **Authentication System**
   - ✅ Login/Logout flow implemented
   - ✅ User profiles structure defined
   - ✅ Role-based access (admin, project_manager, entrepreneur, accountant)
   - ✅ Project assignments system
   - ⚠️ Currently using localStorage for demo

3. **Data Entities (15 total)**
   All currently stored in localStorage:
   - Projects
   - Professionals
   - Tasks
   - Tenders
   - Tender Participants
   - Milestones
   - Budget (categories, chapters, items, payments)
   - Units
   - Files
   - Planning Changes
   - Special Issues
   - Gantt Tasks

### ❌ What's Missing
1. **Database Tables** - Need to create Supabase tables
2. **Real Authentication** - Need to create users in Supabase
3. **File Storage** - Supabase Storage for tender quotes and files
4. **Row Level Security (RLS)** - Permission policies
5. **API Layer** - Replace localStorage functions with Supabase queries
6. **Data Migration Tool** - Script to migrate existing localStorage data

---

## Migration Strategy

### Phase 1: Database Schema Setup (2-3 hours)
**Goal**: Create all database tables in Supabase

#### Tables to Create:
1. **users** (already exists via Supabase Auth)
2. **user_profiles** (extends auth.users)
3. **project_assignments** (user-project relationships)
4. **projects**
5. **professionals**
6. **project_professionals** (project-professional relationships)
7. **tasks**
8. **tenders**
9. **tender_participants**
10. **milestones**
11. **budget_categories**
12. **budget_chapters**
13. **budget_items**
14. **budget_payments**
15. **units**
16. **files**
17. **planning_changes**
18. **special_issues**
19. **gantt_tasks**

#### Action Items:
- [ ] Write SQL migration script for all tables
- [ ] Add foreign key relationships
- [ ] Add indexes for performance
- [ ] Add timestamps (created_at, updated_at)
- [ ] Add RLS policies for each table

---

### Phase 2: Authentication & Users (1-2 hours)
**Goal**: Set up real users in Supabase

#### Steps:
1. Create admin user in Supabase dashboard
2. Create test users (PM, entrepreneur, accountant)
3. Test authentication flow
4. Update AuthContext to use real Supabase queries
5. Set VITE_DEV_MODE=false

#### Test Users to Create:
- admin@anproyektim.com (admin)
- pm@anproyektim.com (project_manager)
- entrepreneur@client.com (entrepreneur)
- accountant@office.com (accountant)

---

### Phase 3: API Layer Migration (6-8 hours)
**Goal**: Replace localStorage with Supabase queries

#### Priority Order:
1. **User Profiles** (already partially done)
2. **Projects** (core entity)
3. **Professionals**
4. **Tenders** + Tender Participants
5. **Budget** (all related tables)
6. **Tasks**
7. **Milestones**
8. **Everything else**

#### For Each Entity:
- [ ] Create Supabase service file (e.g., `projectsService.ts`)
- [ ] Implement CRUD operations
- [ ] Add error handling
- [ ] Replace storage calls in components
- [ ] Test functionality
- [ ] Remove old localStorage code

---

### Phase 4: File Storage (2-3 hours)
**Goal**: Use Supabase Storage for files

#### Steps:
1. Create storage bucket: `tender-quotes`
2. Create storage bucket: `project-files`
3. Update upload functions to use Supabase Storage
4. Add RLS policies for buckets
5. Update file URLs in database

---

### Phase 5: Data Migration Tool (2-3 hours)
**Goal**: Import existing localStorage data to database

#### Script Features:
- Read all localStorage data
- Transform to database format
- Bulk insert into Supabase
- Verify data integrity
- Generate report

#### Data to Migrate:
- Test data from current localStorage
- Keep as backup in case needed

---

### Phase 6: Row Level Security (2-3 hours)
**Goal**: Implement proper access control

#### RLS Policies Needed:
1. **Projects**: Users can only see assigned projects
2. **Tenders**: Users can see tenders for their projects
3. **Budget**: Role-based access (accountant, admin)
4. **Tasks**: Users can see tasks for their projects
5. **Files**: Users can access files for their projects

---

## Missing Features Analysis

### 🔴 High Priority Missing Features
1. **Reports Module**
   - Budget reports
   - Project progress reports
   - Tender comparison reports
   - Export to PDF/Excel

2. **Dashboard Improvements**
   - Replace KPI cards with budget summary
   - Upcoming payments widget
   - Cash flow projections

3. **Notifications System**
   - Email notifications for deadlines
   - In-app notifications
   - Tender deadline alerts

4. **Document Generation**
   - Contract templates
   - Tender invitation letters
   - Budget summaries

### 🟡 Medium Priority
1. **Search & Filters**
   - Global search across entities
   - Advanced filters on all tables

2. **Audit Log**
   - Track all changes
   - Who changed what and when

3. **Backup/Restore**
   - Automatic database backups
   - Point-in-time recovery

4. **Multi-language Support**
   - Currently Hebrew only
   - Add English support

### 🟢 Nice to Have
1. **Mobile App** (React Native)
2. **Real-time Collaboration** (Supabase Realtime)
3. **Calendar View** for milestones
4. **Gantt Chart Improvements**
5. **Budget Forecasting AI**

---

## Recommended Implementation Order

### Week 1: Database Foundation
- ✅ Phase 1: Create all database tables (Day 1-2)
- ✅ Phase 2: Set up authentication and users (Day 2)
- ✅ Phase 6: Implement RLS policies (Day 3)

### Week 2: Core Entities Migration
- ✅ Phase 3a: Migrate Projects (Day 4)
- ✅ Phase 3b: Migrate Professionals (Day 5)
- ✅ Phase 3c: Migrate Tenders (Day 6-7)

### Week 3: Budget & Tasks
- ✅ Phase 3d: Migrate Budget system (Day 8-9)
- ✅ Phase 3e: Migrate Tasks & Milestones (Day 10)

### Week 4: Files & Finalization
- ✅ Phase 4: Set up file storage (Day 11)
- ✅ Phase 5: Build migration tool (Day 12)
- ✅ Testing & bug fixes (Day 13-14)

---

## Immediate Next Steps

### Option A: Start with Database Schema (Recommended)
1. Create SQL migration file
2. Run in Supabase SQL editor
3. Verify tables created correctly

### Option B: Start with Auth First
1. Create admin user in Supabase
2. Test login with real Supabase auth
3. Then proceed with database schema

### Option C: Incremental Approach
1. Start with ONE entity (e.g., Projects)
2. Complete full cycle: schema → API → UI → test
3. Learn and repeat for other entities

---

## Questions to Decide

1. **Which approach do you prefer?**
   - A: Database schema first (all tables at once)
   - B: Auth first, then tables
   - C: One entity at a time

2. **Do you want to keep localStorage as backup?**
   - Keep dual support (localStorage + Supabase)
   - Full migration, remove localStorage

3. **Priority for missing features?**
   - Which dashboard widget should we build?
   - Which reports are most important?

4. **Timeline?**
   - Fast migration (1-2 weeks, focused work)
   - Gradual migration (1 month, alongside other work)

---

## SQL Schema Preview (Projects Example)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL CHECK (status IN ('תכנון', 'היתרים', 'מכרזים', 'ביצוע', 'מסירה', 'ארכיון')),
  permit_start_date DATE,
  permit_duration_months INTEGER,
  permit_target_date DATE,
  permit_approval_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assigned projects"
  ON projects FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM project_assignments
      WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
```

---

## Let's Discuss!

Please review this plan and let me know:
1. Which approach you prefer (A, B, or C)
2. Which missing features are most important
3. When you want to start
4. Any questions or concerns
