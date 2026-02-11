# Supabase Setup Guide

This document contains the SQL schema and setup instructions for the authentication system.

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and set project details:
   - **Name**: anproyektim (or your preferred name)
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

## 2. Get API Credentials

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long JWT token starting with `eyJ...`

3. Create `.env.local` file in project root:
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## 3. Run Database Schema

Go to SQL Editor → New Query and run this schema:

### Step 1: Helper Functions

```sql
-- Reusable function to check project access
CREATE OR REPLACE FUNCTION can_access_project(check_project_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND (
      -- Admins and Accountants see all projects
      role IN ('admin', 'accountant')
      OR
      -- PMs and Entrepreneurs see assigned projects only
      (role IN ('project_manager', 'entrepreneur')
       AND EXISTS (
         SELECT 1 FROM project_assignments
         WHERE user_id = auth.uid() AND project_id = check_project_id
       ))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reusable function to check if user can edit
CREATE OR REPLACE FUNCTION can_edit()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'project_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 2: User Profiles Table

```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('admin', 'project_manager', 'entrepreneur', 'accountant')),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- Only admins can view all users
CREATE POLICY "Admins can view all users"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert/delete users
CREATE POLICY "Admins can insert users"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Step 3: Project Assignments Table

```sql
CREATE TABLE project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assignments
CREATE POLICY "Users can view own assignments"
  ON project_assignments FOR SELECT
  USING (user_id = auth.uid());

-- Admins and PMs can manage assignments
CREATE POLICY "Admins and PMs can manage assignments"
  ON project_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );
```

### Step 4: Migrate Existing Tables (Projects, Tasks, etc.)

You'll need to create these tables to match your existing localStorage structure.
The migration wizard will handle populating them with data.

**Projects Table:**

```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  client_name text NOT NULL,
  address text,
  status text NOT NULL,
  permit_start_date date,
  permit_duration_months integer,
  permit_target_date date,
  permit_approval_date date,
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- SELECT: Who can see projects
CREATE POLICY "projects_select_policy" ON projects
FOR SELECT USING (can_access_project(id));

-- INSERT: Only admins and project managers can create
CREATE POLICY "projects_insert_policy" ON projects
FOR INSERT WITH CHECK (can_edit());

-- UPDATE: Only admins and PMs (on assigned projects) can edit
CREATE POLICY "projects_update_policy" ON projects
FOR UPDATE USING (can_access_project(id) AND can_edit());

-- DELETE: Only admins can delete
CREATE POLICY "projects_delete_policy" ON projects
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

**Tasks Table:**

```sql
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL,
  priority text,
  assignee_professional_id uuid,
  assignee_name text,
  due_date date,
  start_date date,
  completed_at timestamptz,
  duration_days integer,
  percent_complete integer,
  external_reference_id text,
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Tasks inherit project access permissions
CREATE POLICY "tasks_select_policy" ON tasks
FOR SELECT USING (can_access_project(project_id));

CREATE POLICY "tasks_insert_policy" ON tasks
FOR INSERT WITH CHECK (can_access_project(project_id) AND can_edit());

CREATE POLICY "tasks_update_policy" ON tasks
FOR UPDATE USING (can_access_project(project_id) AND can_edit());

CREATE POLICY "tasks_delete_policy" ON tasks
FOR DELETE USING (
  can_access_project(project_id)
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

**Professionals Table:**

```sql
CREATE TABLE professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_name text NOT NULL,
  company_name text,
  field text NOT NULL,
  phone text,
  email text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view professionals
CREATE POLICY "professionals_select_policy" ON professionals
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins and PMs can create/edit professionals
CREATE POLICY "professionals_insert_policy" ON professionals
FOR INSERT WITH CHECK (can_edit());

CREATE POLICY "professionals_update_policy" ON professionals
FOR UPDATE USING (can_edit());

CREATE POLICY "professionals_delete_policy" ON professionals
FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
```

**Add similar RLS policies for:** Tenders, Budgets, Files tables (follow the same pattern)

## 4. Configure Email Templates (Hebrew)

1. Go to Authentication → Email Templates
2. Update each template with Hebrew text:

**Confirm Signup:**
```
שלום {{ .ConfirmationURL }},

תודה שנרשמת למערכת אנ פרויקטים!

אנא לחץ על הקישור הבא כדי לאשר את כתובת האימייל שלך:

{{ .ConfirmationURL }}

תודה,
צוות אנ פרויקטים
```

**Reset Password:**
```
שלום,

קיבלנו בקשה לאיפוס הסיסמה שלך.

לחץ על הקישור הבא כדי לאפס את הסיסמה:

{{ .ConfirmationURL }}

אם לא ביקשת איפוס סיסמה, התעלם מהודעה זו.

תודה,
צוות אנ פרויקטים
```

## 5. Create First Admin User

**Option A: Via Supabase Dashboard**
1. Go to Authentication → Users
2. Click "Add User"
3. Enter email and password
4. After user is created, go to SQL Editor:

```sql
INSERT INTO user_profiles (id, email, full_name, role)
VALUES (
  'paste-user-id-from-auth-users',
  'admin@example.com',
  'Admin User',
  'admin'
);
```

**Option B: Via Sign Up Form (after implementing frontend)**
- First user should be manually assigned 'admin' role in database

## 6. Test Database Connection

In your React app, you can test the connection:

```typescript
import { supabase } from './lib/supabase';

// Test query
const { data, error } = await supabase.from('user_profiles').select('count');
console.log('Connection test:', data, error);
```

## 7. Security Checklist

- [ ] RLS enabled on ALL tables
- [ ] Environment variables stored in `.env.local` (not committed to git)
- [ ] Email templates configured in Hebrew
- [ ] First admin user created
- [ ] Database policies tested with different roles

## Next Steps

After Supabase setup is complete:
1. Test connection from frontend
2. Implement AuthContext and login flow
3. Run data migration wizard to import localStorage data
