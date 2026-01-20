-- ============================================================
-- AB Projects - Create Test Users
-- ============================================================
-- IMPORTANT: You must create these users through Supabase Dashboard first!
-- Go to: Authentication → Users → Add User
-- Then run this script to create their profiles
-- ============================================================

-- After creating users in Supabase Dashboard, insert their profiles:
-- Replace the UUIDs with actual auth.users IDs from Supabase

-- Example (you'll need to replace with real UUIDs):
/*
INSERT INTO user_profiles (id, email, full_name, phone, role, is_active)
VALUES
  -- Admin user
  ('REPLACE-WITH-ADMIN-UUID', 'admin@anproyektim.com', 'יוסי כהן', '050-1234567', 'admin', true),

  -- Project Manager
  ('REPLACE-WITH-PM-UUID', 'pm@anproyektim.com', 'מיכל לוי', '052-9876543', 'project_manager', true),

  -- Entrepreneur
  ('REPLACE-WITH-ENTREPRENEUR-UUID', 'entrepreneur@client.com', 'דוד שרון', '054-5551234', 'entrepreneur', true),

  -- Accountant
  ('REPLACE-WITH-ACCOUNTANT-UUID', 'accountant@office.com', 'רונית אברהם', '050-7778888', 'accountant', true);
*/

-- ============================================================
-- STEP-BY-STEP INSTRUCTIONS:
-- ============================================================
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" for each user:
--    - admin@anproyektim.com / admin123
--    - pm@anproyektim.com / pm123456
--    - entrepreneur@client.com / client123
--    - accountant@office.com / account123
-- 3. Copy each user's UUID from the Users table
-- 4. Replace the UUIDs in the INSERT statement above
-- 5. Run the INSERT statement
-- ============================================================

-- Helper query to see auth users:
-- SELECT id, email FROM auth.users ORDER BY created_at DESC;
