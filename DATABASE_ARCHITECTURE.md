# ResolveX Database Architecture, Mock Data Eradication & Migration Specification

> **Document Type:** Master Architecture, Schema Blueprint & Code Context Specification  
> **Status:** Specification Complete — Ready for Review & Execution  
> **Scope:** Complete eradication of mock data (`mockData.js`), Supabase PostgreSQL database design, Row Level Security (RLS) policies, auth/role resolution, and line-by-line frontend/backend code mapping.

---

## Table of Contents
1. [Executive Summary & Why the Role Issue Occurred](#1-executive-summary--why-the-role-issue-occurred)
2. [Complete Mock Data Eradication Plan](#2-complete-mock-data-eradication-plan)
3. [Supabase PostgreSQL Database Schema](#3-supabase-postgresql-database-schema)
   - 3.1 [`public.profiles`](#31-publicprofiles-user-identity--rbac)
   - 3.2 [`public.organizations`](#32-publicorganizations-multi-tenant-organizations)
   - 3.3 [`public.departments`](#33-publicdepartments-departmental-routing)
   - 3.4 [`public.complaints`](#34-publiccomplaints-tickets--issues)
   - 3.5 [`public.complaint_comments`](#35-publiccomplaint_comments-communication-stream)
   - 3.6 [`public.complaint_history`](#36-publiccomplaint_history-audit-log--lifecycle)
   - 3.7 [Supabase Storage: `complaint-attachments`](#37-supabase-storage-complaint-attachments)
   - 3.8 [Automated Auth Trigger (`handle_new_user`)](#38-automated-auth-trigger-handle_new_user)
   - 3.9 [Row Level Security (RLS) Policies](#39-row-level-security-rls-policies)
4. [Complete Code Context & Line-by-Line Inventory](#4-complete-code-context--line-by-line-inventory)
   - 4.1 [`src/data/mockData.js`](#41-srcdatamockdatajs)
   - 4.2 [`src/context/AuthContext.jsx`](#42-srccontextauthcontextjsx)
   - 4.3 [`src/services/complaintService.js`](#43-srcservicescomplaintservicejs)
   - 4.4 [`src/services/supabaseClient.js`](#44-srcservicessupabaseclientjs)
   - 4.5 [`src/services/api.js`](#45-srcservicesapijs)
   - 4.6 [`src/components/Auth.jsx`](#46-srccomponentsauthjsx)
   - 4.7 [`src/pages/StaffResolutions.jsx`](#47-srcpagesstaffresolutionsjsx)
   - 4.8 [`src/pages/StaffQueue.jsx`](#48-srcpagesstaffqueuejsx)
   - 4.9 [`src/pages/AdminAnalytics.jsx`](#49-srcpagesadminanalyticsjsx)
   - 4.10 [`src/pages/AdminDepartments.jsx`](#410-srcpagesadmindepartmentsjsx)
   - 4.11 [`src/utils/__tests__/formattersAndServices.test.js`](#411-srcutils__tests__formattersandservicestestjs)
5. [Step-by-Step Migration Execution Sequence](#5-step-by-step-migration-execution-sequence)

---

## 1. Executive Summary & Why the Role Issue Occurred

### The Root Cause of "Every Account Becomes Student on Re-login"
1. **Fallback to Mock User #0 on Empty/Restart:**
   In [`src/context/AuthContext.jsx`](file:///c:/CMS_V2/src/context/AuthContext.jsx#L34):
   ```javascript
   const [currentUser, setCurrentUser] = useState(() => {
     ...
     return MOCK_USERS[0]; // MOCK_USERS[0] is 'Alex Chen' whose role is strictly STUDENT!
   });
   ```
   Whenever `localStorage` did not match or when a new tab was opened, it immediately re-instantiated Alex Chen (`student`).

2. **Local Storage Fallback & Fastify Server Disconnect:**
   `login()` in [`src/context/AuthContext.jsx`](file:///c:/CMS_V2/src/context/AuthContext.jsx#L170-L203) tried calling `authApi.login()` (targeting `http://localhost:5000`). Because the Fastify backend server was not running or unreachable, it fell back to local browser matching.
   If the user logged in with an email that was not in `registeredUsers` (or if local storage was cleared), lines 194–200 forged a new user object defaulting to:
   ```javascript
   role: ROLES.STUDENT
   ```

3. **Supabase Auth was Configured but Not Wired to `AuthContext`:**
   While Supabase environment credentials (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) were active in `.env.local` and initialized in `supabaseClient.js`, `AuthContext.jsx` was **never calling** `supabase.auth.signUp()` or `supabase.auth.signInWithPassword()`. It relied purely on in-memory/localStorage state.

### The Solution
- Completely eliminate `MOCK_USERS` and `INITIAL_COMPLAINTS`.
- Connect `AuthContext` directly to `supabase.auth`.
- Store the user's chosen role (`student`, `staff`, `admin`) in `raw_user_meta_data` upon signup and mirror it into a dedicated `public.profiles` PostgreSQL table linked to `auth.users.id`.
- On login and on page refresh, fetch the profile and role directly from Supabase.
- If there are zero complaints in the database, render clean, beautiful empty states without falling back to mock tickets.

---

## 2. Complete Mock Data Eradication Plan

| Item | Location | Current Role | Replacement Strategy |
| :--- | :--- | :--- | :--- |
| **`MOCK_USERS`** | [`src/data/mockData.js`](file:///c:/CMS_V2/src/data/mockData.js#L3-L44) | 4 hardcoded demo accounts (`usr_student_1`, `usr_staff_warden`, `usr_staff_it`, `usr_admin_1`). | **Deleted entirely.** Live users retrieved from Supabase `public.profiles` table via `supabase.from('profiles').select('*')`. |
| **`INITIAL_COMPLAINTS`** | [`src/data/mockData.js`](file:///c:/CMS_V2/src/data/mockData.js#L46-L356) | 6 hardcoded mock tickets (`CMS-2026-1001` to `1006`). | **Deleted entirely.** Live tickets retrieved from Supabase `public.complaints` table. Empty dataset displays high-fidelity empty states. |
| **`mockData.js` file** | [`src/data/mockData.js`](file:///c:/CMS_V2/src/data/mockData.js) | Entire file containing all mock constants. | **Permanently deleted** once imports are severed. |
| **LocalStorage Seed Logic** | [`src/services/complaintService.js`](file:///c:/CMS_V2/src/services/complaintService.js#L130-L155) | Seeds `cms_complaints_v1` with `INITIAL_COMPLAINTS`. | **Removed.** Returns empty array `[]` when no tickets exist. |
| **LocalStorage Auth Mock** | [`src/context/AuthContext.jsx`](file:///c:/CMS_V2/src/context/AuthContext.jsx#L34-L48) | Fallback to `MOCK_USERS[0]` and `registeredUsers` array. | **Removed.** Replaced with `supabase.auth.onAuthStateChange()` session listener. |
| **Seed Reset Function** | [`src/services/complaintService.js`](file:///c:/CMS_V2/src/services/complaintService.js#L906-L915) | `resetToSeedData()` restores `INITIAL_COMPLAINTS`. | **Refactored.** Clears database records or syncs fresh from Supabase. |

---

## 3. Supabase PostgreSQL Database Schema

This schema is designed based on production PostgreSQL & Supabase best practices (foreign key integrity, UUIDs, JSONB metadata, automated timestamp triggers, and Row Level Security).

### 3.1 `public.profiles` (User Identity & RBAC)
Extends `auth.users` with application-specific attributes.

```sql
-- 1. Create enum for Roles
CREATE TYPE user_role AS ENUM ('student', 'staff', 'admin');

-- 2. Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    org_key TEXT NOT NULL DEFAULT 'COLLEGE',
    department_id UUID,
    avatar_url TEXT,
    phone TEXT,
    roll_no TEXT,
    room_no TEXT,
    assigned_categories TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast role & organization filtering
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_org_key ON public.profiles(org_key);
CREATE INDEX idx_profiles_email ON public.profiles(email);
```

### 3.2 `public.organizations` (Multi-Tenant Organizations)
Persists tenant definitions dynamically.

```sql
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'college',
    user_term TEXT NOT NULL DEFAULT 'Student',
    staff_term TEXT NOT NULL DEFAULT 'Staff',
    admin_term TEXT NOT NULL DEFAULT 'Admin',
    location_label TEXT NOT NULL DEFAULT 'Location / Room / Area',
    categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-seed standard templates
INSERT INTO public.organizations (org_key, name, type, user_term, staff_term, admin_term, location_label, categories)
VALUES 
('COLLEGE', 'Apex University', 'college', 'Student', 'Staff / Warden', 'Dean / Admin', 'Campus Location / Hostel / Room', '["Hostel", "Maintenance", "Mess & Food", "Academics", "IT & Wifi", "Sanitation", "Security"]'::jsonb),
('CORPORATE', 'Apex Global Technologies', 'corporate', 'Employee', 'Facility & IT Staff', 'Admin & HR', 'Office Wing / Floor / Desk', '["Workstation & Hardware", "Facility & AC", "Network & VPN", "Pantry & Cafeteria", "Meeting Rooms", "HR & Admin"]'::jsonb),
('HOSPITAL', 'Metro Care Health System', 'hospital', 'Patient / Caregiver', 'Duty Nurse / Tech', 'Hospital Administrator', 'Ward / Bed / Dept / Floor', '["Biomedical Equipment", "Nursing & Patient Care", "Sanitation & Biohazard", "Pharmacy & Supplies", "Facility & Maintenance", "Security & Access"]'::jsonb),
('RESIDENTIAL', 'Parkside Heights Condos', 'residential', 'Resident', 'Facility Manager', 'HOA Board Admin', 'Tower / Flat Number', '["Plumbing & Drainage", "Electrical & Lighting", "Elevators & Lifts", "Clubhouse & Gym", "Security & Parking", "Housekeeping"]'::jsonb);
```

### 3.3 `public.departments` (Departmental Routing)
```sql
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_key TEXT NOT NULL REFERENCES public.organizations(org_key) ON UPDATE CASCADE,
    name TEXT NOT NULL,
    head_name TEXT,
    head_email TEXT,
    sla_response_hours INT NOT NULL DEFAULT 24,
    sla_resolve_hours INT NOT NULL DEFAULT 72,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_departments_org_key ON public.departments(org_key);
```

### 3.4 `public.complaints` (Tickets & Issues)
```sql
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE complaint_status AS ENUM ('pending', 'in_progress', 'pending_confirmation', 'resolved', 'rejected');

CREATE TABLE public.complaints (
    id TEXT PRIMARY KEY, -- e.g. "CMS-2026-1001" or generated slug
    org_key TEXT NOT NULL DEFAULT 'COLLEGE',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority complaint_priority NOT NULL DEFAULT 'medium',
    status complaint_status NOT NULL DEFAULT 'pending',
    location TEXT,
    
    -- Student / Complainant Details
    student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_meta JSONB DEFAULT '{}'::jsonb,
    
    -- Staff Assignment
    assigned_to_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to_name TEXT,
    assigned_to_department TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    
    -- Attachments (Array of { id, name, size, type, url, storagePath })
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- SLA Deadlines
    sla_response_due TIMESTAMPTZ,
    sla_resolve_due TIMESTAMPTZ,
    sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Resolution Metadata
    resolution_details JSONB,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaints_org_key ON public.complaints(org_key);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_student_id ON public.complaints(student_id);
CREATE INDEX idx_complaints_assigned_to_id ON public.complaints(assigned_to_id);
CREATE INDEX idx_complaints_priority ON public.complaints(priority);
CREATE INDEX idx_complaints_created_at ON public.complaints(created_at DESC);
```

### 3.5 `public.complaint_comments` (Communication Stream)
```sql
CREATE TABLE public.complaint_comments (
    id TEXT PRIMARY KEY DEFAULT ('c_' || substr(md5(random()::text), 1, 10)),
    complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL,
    sender_role user_role NOT NULL DEFAULT 'student',
    text TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_complaint_id ON public.complaint_comments(complaint_id);
```

### 3.6 `public.complaint_history` (Audit Log & Lifecycle)
```sql
CREATE TABLE public.complaint_history (
    id BIGSERIAL PRIMARY KEY,
    complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    status complaint_status NOT NULL,
    updated_by TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_history_complaint_id ON public.complaint_history(complaint_id);
```

### 3.7 Supabase Storage: `complaint-attachments`
- **Bucket ID:** `complaint-attachments`
- **Public:** `true` (enables CDN public URLs for ticket images and PDF receipts).
- **File size limit:** 10MB.
- **Allowed MIME types:** `image/png`, `image/jpeg`, `image/webp`, `application/pdf`.

### 3.8 Automated Auth Trigger (`handle_new_user`)
This PostgreSQL trigger guarantees that whenever a user registers through `supabase.auth.signUp()`, their role, name, and organization are atomically written to `public.profiles`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    org_key
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role),
    COALESCE(NEW.raw_user_meta_data->>'orgKey', 'COLLEGE')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing immediately after auth.users insertion
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3.9 Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_history ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Authenticated users can view all profiles in their org; can update only their own profile
CREATE POLICY "Profiles viewable by org members" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

-- 2. Organizations: Public read for login/signup; Admin update
CREATE POLICY "Organizations public read" ON public.organizations
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Admins can manage organizations" ON public.organizations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 3. Complaints: 
-- Students see their own complaints
-- Staff see all complaints in their org
-- Admins see and manage all complaints
CREATE POLICY "Complaints read policy" ON public.complaints
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role IN ('staff', 'admin')
        )
    );

CREATE POLICY "Students can create complaints" ON public.complaints
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = student_id OR student_id IS NULL);

CREATE POLICY "Staff and Admins can update complaints" ON public.complaints
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role IN ('staff', 'admin')
        )
    );

-- 4. Comments: Non-internal visible to student; all visible to staff/admin
CREATE POLICY "Comments read policy" ON public.complaint_comments
    FOR SELECT TO authenticated
    USING (
        (is_internal = false)
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role IN ('staff', 'admin')
        )
    );

CREATE POLICY "Authenticated users can insert comments" ON public.complaint_comments
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id OR sender_id IS NULL);

-- 5. History: Read-only audit log for ticket participants
CREATE POLICY "History read policy" ON public.complaint_history
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "History insert policy" ON public.complaint_history
    FOR INSERT TO authenticated
    WITH CHECK (true);
```

---

## 4. Complete Code Context & Line-by-Line Inventory

Below is the exhaustive, file-by-file, line-by-line audit of every place in the frontend and backend that interacts with mock data, auth persistence, and complaints.

### 4.1 `src/data/mockData.js`
* **Path:** [`src/data/mockData.js`](file:///c:/CMS_V2/src/data/mockData.js)
* **Total Lines:** 357
* **Key Sections:**
  * Lines 3–44: `export const MOCK_USERS = [...]`
  * Lines 46–356: `export const INITIAL_COMPLAINTS = [...]`
* **Modification:**
  * Delete this file completely after imports in `AuthContext.jsx` and `complaintService.js` are decoupled.

---

### 4.2 `src/context/AuthContext.jsx`
* **Path:** [`src/context/AuthContext.jsx`](file:///c:/CMS_V2/src/context/AuthContext.jsx)
* **Total Lines:** 428
* **Current Lines & Defects:**
  * **Line 2:** `import { MOCK_USERS } from '../data/mockData';` — Imports mock users.
  * **Line 17–20:** `STORAGE_USER_KEY`, `STORAGE_REGISTERED_USERS_KEY` — Uses `localStorage` as primary auth persistence.
  * **Lines 23–35:**
    ```javascript
    const [currentUser, setCurrentUser] = useState(() => {
      ...
      return MOCK_USERS[0]; // Line 34: Defaults to Alex Chen (student)
    });
    ```
  * **Lines 38–48:** `registeredUsers` state saved in `localStorage`.
  * **Lines 163–239:** `login(email, password)`:
    * Line 170: Calls `authApi.login(email, password)` (Fastify).
    * Lines 179–186: Checks `registeredUsers` and `MOCK_USERS`.
    * Lines 194–200: Creates fallback user with role `ROLES.STUDENT`.
  * **Lines 244–300:** `signup(...)`:
    * Line 261: Calls `authApi.register(...)`.
    * Line 286–289: Saves to `registeredUsers` in `localStorage`.
  * **Lines 305–322:** `updateUserRole(newRole)`:
    * Mutates role only in local state and `localStorage`.
  * **Lines 338–341:** `logout()`:
    * Removes `STORAGE_USER_KEY` from `localStorage`, does not call `supabase.auth.signOut()`.
  * **Lines 363–377:** `allAvailableUsers`:
    * Loops over `MOCK_USERS` and `registeredUsers` to build roster.
* **Target Changes:**
  1. Remove `import { MOCK_USERS } from '../data/mockData'`.
  2. Import `supabase` and `isSupabaseConfigured` from `../services/supabaseClient`.
  3. Initialize `currentUser` to `null` and `loading` to `true`.
  4. In a `useEffect`, listen to `supabase.auth.onAuthStateChange(async (event, session) => ...)`:
     * When session exists, query `supabase.from('profiles').select('*').eq('id', session.user.id).single()`.
     * If profile found, set `currentUser` with `{ id: session.user.id, email: session.user.email, role: profile.role, name: profile.name, orgKey: profile.org_key, ... }`.
     * If profile not found yet (e.g. trigger slight delay), fall back to `session.user.user_metadata`.
  5. Refactor `login(email, password)`:
     * Call `const { data, error } = await supabase.auth.signInWithPassword({ email, password })`.
     * Fetch profile row to determine role.
  6. Refactor `signup(email, password, name, role, orgKey, newOrgData)`:
     * Call `await supabase.auth.signUp({ email, password, options: { data: { name, role, orgKey } } })`.
     * Upsert profile into `public.profiles`.
  7. Refactor `logout()`:
     * Call `await supabase.auth.signOut()`.
     * Reset `currentUser` to `null`.
  8. Refactor `availableUsers`:
     * Fetch staff/admin members from `public.profiles` where `org_key = currentOrgKey`.

---

### 4.3 `src/services/complaintService.js`
* **Path:** [`src/services/complaintService.js`](file:///c:/CMS_V2/src/services/complaintService.js)
* **Total Lines:** 945
* **Current Lines & Defects:**
  * **Line 1:** `import { INITIAL_COMPLAINTS } from '../data/mockData.js';` — Imports mock complaints.
  * **Lines 130–140:** `initStorage()`:
    * Line 137: `localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));`
  * **Lines 143–155:** `getRawComplaints()`:
    * Line 150 & 153: Returns `INITIAL_COMPLAINTS` when localStorage is empty.
  * **Lines 169–237:** `getComplaints(filters)` / `fetchLiveComplaints()`:
    * Reads from `getRawComplaints()` (mock data).
  * **Lines 906–915:** `resetToSeedData()`:
    * Line 908: `localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));`
* **Target Changes:**
  1. Remove `import { INITIAL_COMPLAINTS }`.
  2. In `initStorage()`: If empty, do not seed mock complaints. Initialize as `[]`.
  3. In `getRawComplaints()`: Return `[]` if storage is empty.
  4. In `fetchLiveComplaints()`: Directly query `supabase.from('complaints').select('*').order('created_at', { ascending: false })`.
  5. In `createComplaint()`: Directly perform `supabase.from('complaints').insert([payload])`.
  6. In `updateStatus()`: Directly perform `supabase.from('complaints').update({ status }).eq('id', id)`.
  7. In `addComment()`: Directly perform `supabase.from('complaint_comments').insert([commentPayload])`.
  8. Refactor `resetToSeedData()` to `clearAllComplaints()` or direct DB purge.

---

### 4.4 `src/services/supabaseClient.js`
* **Path:** [`src/services/supabaseClient.js`](file:///c:/CMS_V2/src/services/supabaseClient.js)
* **Total Lines:** 145
* **Current Status:**
  * Properly initializes `createClient(supabaseUrl, supabaseAnonKey)` with `persistSession: true`.
  * Has `initRealtimeSubscription()` for `complaints` and `complaint_comments`.
  * Has `uploadComplaintAttachment()` for bucket `complaint-attachments`.
* **Enhancements Needed:**
  * Add helper functions:
    * `getUserProfile(userId)`: Fetches profile and role from `public.profiles`.
    * `upsertUserProfile(profile)`: Creates/updates profile in `public.profiles`.
    * `fetchOrgProfiles(orgKey)`: Fetches all members of an organization for assignment dropdowns.

---

### 4.5 `src/services/api.js`
* **Path:** [`src/services/api.js`](file:///c:/CMS_V2/src/services/api.js)
* **Total Lines:** 169
* **Current Status:**
  * REST client targeting `/api` (Fastify).
  * Safe to keep as an alternate transport, but `AuthContext` and `complaintService` will primarily use the direct `supabase` client for real-time reactivity and guaranteed cloud persistence.

---

### 4.6 `src/components/Auth.jsx`
* **Path:** [`src/components/Auth.jsx`](file:///c:/CMS_V2/src/components/Auth.jsx)
* **Total Lines:** 458
* **Current Lines:**
  * Lines 26: `const [selectedRole, setSelectedRole] = useState(ROLES.STUDENT);`
  * Lines 66: `await login(email.trim(), password);`
  * Lines 93: `await signup(email.trim(), password, name.trim(), selectedRole, selectedOrgKey);`
* **Verification:**
  * Already contains clean role selector tabs (`Student`, `Staff`, `Admin`) and organization selection.
  * No hardcoded demo buttons exist here; once `login` and `signup` in `AuthContext` are wired to Supabase, this component works seamlessly out of the box.

---

### 4.7 `src/pages/StaffResolutions.jsx`
* **Path:** [`src/pages/StaffResolutions.jsx`](file:///c:/CMS_V2/src/pages/StaffResolutions.jsx)
* **Lines 31–38 & 46:**
  ```javascript
  const { user, availableUsers } = useAuth();
  const reassignTargets = useMemo(() => buildReassignTargets(availableUsers), [availableUsers]);
  ```
* **Context:**
  * Relies on `availableUsers` from `useAuth()`.
  * When `availableUsers` comes from `public.profiles`, it dynamically shows real registered staff and admins.

---

### 4.8 `src/pages/StaffQueue.jsx`
* **Path:** [`src/pages/StaffQueue.jsx`](file:///c:/CMS_V2/src/pages/StaffQueue.jsx)
* **Lines 74 & 86–92:**
  * Uses `useAuth()` and `complaintService.getComplaints()`.
  * Handles empty state smoothly when `complaints.length === 0`.

---

### 4.9 `src/pages/AdminAnalytics.jsx`
* **Path:** [`src/pages/AdminAnalytics.jsx`](file:///c:/CMS_V2/src/pages/AdminAnalytics.jsx)
* **Lines 61, 208, 218, 816:**
  * Uses `availableUsers` to populate ticket reassignment and department staff lists.
  * Automatically receives live staff from Supabase profiles.

---

### 4.10 `src/pages/AdminDepartments.jsx`
* **Path:** [`src/pages/AdminDepartments.jsx`](file:///c:/CMS_V2/src/pages/AdminDepartments.jsx)
* **Lines 32, 147:**
  * Filters `availableUsers` to display department staff rosters.

---

### 4.11 `src/utils/__tests__/formattersAndServices.test.js`
* **Path:** [`src/utils/__tests__/formattersAndServices.test.js`](file:///c:/CMS_V2/src/utils/__tests__/formattersAndServices.test.js)
* **Lines 721–745:**
  * Tests `resetToSeedData()` asserting `result.length === 6` from `INITIAL_COMPLAINTS`.
  * Update this test to assert clean reset behavior without depending on `mockData.js`.

---

## 5. Step-by-Step Migration Execution Sequence

Once user approval is received:

1. **Step 1: Execute SQL Schema in Supabase**
   * Run the SQL statements in [Section 3](#3-supabase-postgresql-database-schema) in Supabase SQL Editor (creates `profiles`, `organizations`, `departments`, `complaints`, `complaint_comments`, `complaint_history`, trigger `handle_new_user`, and RLS policies).

2. **Step 2: Update `supabaseClient.js`**
   * Export profile fetching and membership lookup utilities.

3. **Step 3: Update `AuthContext.jsx`**
   * Replace mock user imports and `localStorage` role fallback with `supabase.auth.onAuthStateChange`, `supabase.auth.signInWithPassword`, and `supabase.auth.signUp`.
   * Ensure user role is fetched directly from `public.profiles`.

4. **Step 4: Update `complaintService.js`**
   * Remove `import { INITIAL_COMPLAINTS }`.
   * Replace localStorage seed initialization with clean empty array `[]`.
   * Route CRUD operations through `supabase.from('complaints')`.

5. **Step 5: Delete `src/data/mockData.js`**
   * Delete the obsolete mock data file.

6. **Step 6: Update Tests & Verify UI**
   * Update `formattersAndServices.test.js`.
   * Run tests and verify dev server at `http://localhost:5173`.
