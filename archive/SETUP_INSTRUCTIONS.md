# Database Setup Instructions - PARALLEL EXECUTION PLAN

## 🚀 You Can Do This While I Work on Code!

### Step 1: Run Schema Migration (10 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login to your project: `acywgroltcpkcssckotc`

2. **Open SQL Editor**
   - Click "SQL Editor" in left menu
   - Click "New Query"

3. **Run Schema Script**
   - Open file: `supabase/migrations/001_initial_schema.sql`
   - Copy ALL content
   - Paste into SQL Editor
   - Click "Run" (or Ctrl+Enter)
   - **Wait for success message** ✅

4. **Verify Tables Created**
   - Click "Table Editor" in left menu
   - You should see 19 new tables!

---

### Step 2: Run RLS Policies (5 minutes)

1. **Open New Query in SQL Editor**
2. **Run RLS Script**
   - Open file: `supabase/migrations/002_rls_policies.sql`
   - Copy ALL content
   - Paste and Run
   - **Wait for success message** ✅

---

### Step 3: Create Test Users (10 minutes)

**Method A: Through Dashboard (Easier)**

1. Go to **Authentication → Users** in Supabase
2. Click **"Add User"** button
3. Create these users:

   | Email | Password |
   |-------|----------|
   | admin@anproyektim.com | admin123 |
   | pm@anproyektim.com | pm123456 |
   | entrepreneur@client.com | client123 |
   | accountant@office.com | account123 |

4. **Get User IDs**
   - After creating each user, copy their UUID
   - You'll need these for the next step

5. **Create User Profiles**
   - Open SQL Editor
   - Run this query (replace UUIDs):
   ```sql
   INSERT INTO user_profiles (id, email, full_name, phone, role, is_active)
   VALUES
     ('YOUR-ADMIN-UUID', 'admin@anproyektim.com', 'ניב חפץ', '050-1234567', 'admin', true),
     ('YOUR-PM-UUID', 'pm@anproyektim.com', 'מיכל לוי', '052-9876543', 'project_manager', true),
     ('YOUR-ENT-UUID', 'entrepreneur@client.com', 'דוד שרון', '054-5551234', 'entrepreneur', true),
     ('YOUR-ACC-UUID', 'accountant@office.com', 'רונית אברהם', '050-7778888', 'accountant', true);
   ```

**Method B: Send Invitation Emails**
1. Go to **Authentication → Users**
2. Click "Invite user"
3. Enter emails and send invitations
4. Users set their own passwords

---

### Step 4: Test Authentication (5 minutes)

1. **Update .env.local**
   ```
   VITE_DEV_MODE=false
   ```

2. **Restart Dev Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

3. **Test Login**
   - Go to http://localhost:9000
   - Try logging in with: admin@anproyektim.com / admin123
   - **Should work!** ✅

---

### Step 5: Create Test Project (Optional - 5 minutes)

Want to test with real data? Run this:

```sql
-- Create a test project
INSERT INTO projects (id, project_name, client_name, address, status)
VALUES (
  uuid_generate_v4(),
  'פרויקט טסט',
  'לקוח טסט',
  'תל אביב',
  'תכנון'
)
RETURNING id;

-- Copy the returned UUID and assign to admin user:
INSERT INTO project_assignments (user_id, project_id)
VALUES (
  'YOUR-ADMIN-UUID',
  'PROJECT-UUID-FROM-ABOVE'
);
```

---

## ⏱️ Timeline

| Task | Time | Status |
|------|------|--------|
| Run Schema Migration | 10 min | ⬜ |
| Run RLS Policies | 5 min | ⬜ |
| Create Test Users | 10 min | ⬜ |
| Test Authentication | 5 min | ⬜ |
| Create Test Project | 5 min | ⬜ (optional) |
| **TOTAL** | **30-35 min** | |

---

## 🔧 Meanwhile, I'm Working On:

1. ✅ Projects API service (Supabase queries)
2. ✅ Authentication fixes
3. ✅ First entity migration (Projects)
4. ⏳ Data migration tool

---

## ❓ Troubleshooting

**Error: "relation already exists"**
- Tables already created, skip to Step 2

**Error: "permission denied"**
- Make sure you're the project owner
- Check your Supabase project settings

**Can't login after changing DEV_MODE**
- Clear browser localStorage (F12 → Application → Local Storage → Clear All)
- Try again

**RLS policies failing**
- Make sure Step 1 (schema) completed successfully first
- Check for any error messages in SQL editor

---

## ✅ When Complete

**Notify me that you've finished!**

Tell me:
1. ✅ Schema created
2. ✅ RLS enabled
3. ✅ Users created
4. ✅ Login tested

Then I'll show you the next steps:
- Migrating existing localStorage data
- Testing Projects with real database
- Building the Reports module

---

## 📝 Notes

- Keep `VITE_DEV_MODE=true` until we're ready to fully switch
- You can switch back to localStorage anytime
- All data is in YOUR Supabase instance
- Nothing is shared or public

**Let's go!** 🚀
