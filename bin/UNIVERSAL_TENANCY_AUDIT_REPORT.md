# Universal Multi-Tenancy & Architectural Decoupling Audit Report

> **Document Version:** 1.0.0 — Production Architecture Specification  
> **Status:** Read-Only Audit Complete & Documented  
> **Target Environment:** Supabase Cloud PostgreSQL (`https://ytqwoauxfjeqpdrdqoqp.supabase.co`)  
> **Frontend Stack:** React 19 + Vite (`http://localhost:5173`)  
> **Postman Collection:** `ResolveX CMS` (`53760296-2650e9a9-9d7d-4749-b97c-8711c1fc535c`)  
> **Scope:** Comprehensive audit of Login, Signup, All 3 System Roles (`student`, `staff`, `admin`), Dynamic Organization Creation, Data Services, PostgreSQL Schema, and Postman API Testing Suite.

---

## Executive Summary: The Hardcoded Fallback Anti-Pattern

When removing legacy references to `'COLLEGE'`, substituting it with `'IIT_BOMBAY'` creates an identical architectural anti-pattern: **static tenant hardcoding**. 

In a true universal multi-tenant platform, **no organization brand name (`IIT_BOMBAY`, `COLLEGE`, `TCS`, `PRESTIGE`) may ever be used as an application fallback in business logic, services, database triggers, or presentation layers**. 

When a fallback triggers, any dynamically registered organization (such as corporate companies, residential housing societies, hospitals, or private universities) has its complaints, profiles, and settings silently hijacked by or misclassified under IIT Bombay.

This audit report identifies every hardcoded tenant fallback, college-specific persona stereotype, dynamic organization lifecycle bug, database trigger risk, and API test assumption across the system, providing a universal architectural solution for each.

---

## 1. Authentication & Onboarding Lifecycle (Login to Signup)

### 1.1 Signup Flow: Organization Selection & Default Trap
* **File:** [`src/components/Auth.jsx:L71, L74–76`](file:///c:/CMS_V2/src/components/Auth.jsx#L71)
  ```javascript
  71: const [selectedOrgKey, setSelectedOrgKey] = useState(orgKey || 'IIT_BOMBAY');
  74: const [newOrgBaseTemplate, setNewOrgBaseTemplate] = useState('COLLEGE');
  75: const [newOrgUserTerm, setNewOrgUserTerm] = useState(ORG_ARCHETYPES.COLLEGE.defaultUserTerm);
  76: const [newOrgLocationLabel, setNewOrgLocationLabel] = useState(ORG_ARCHETYPES.COLLEGE.defaultLocationLabel);
  ```
  * **Architectural Problem:** If a user visits the signup form without prior state, `selectedOrgKey` forces them into `IIT_BOMBAY`. If they switch to "Create Organization", the form defaults specifically to college labels (`Student`, `Hostel Block / Room No`).
  * **Universal Solution:**
    1. Initialize `selectedOrgKey` dynamically from the first active organization returned by `sanitizedOrgs[0]?.key || ''`.
    2. Provide a neutral archetype selector without defaulting solely to `COLLEGE` (or default to the first entry of `Object.keys(ORG_ARCHETYPES)[0]`).
    3. Dynamically bind placeholder text to the selected archetype definition.

### 1.2 Public Member Signup Role Pigeonholing
* **File:** [`src/components/Auth.jsx:L252–254`](file:///c:/CMS_V2/src/components/Auth.jsx#L252-L254)
  ```javascript
  252: const targetKey = activeSelectedOrg?.key || selectedOrgKey;
  253: signupRes = await signup(email.trim(), password, name.trim(), ROLES.STUDENT, targetKey);
  ```
  * **Architectural Problem:** Every public signup to an existing organization is registered with system role `ROLES.STUDENT`. While `student` represents the base requester/member permission level in the database enum, the code frequently treats `ROLES.STUDENT` as literally a college student.
  * **Universal Solution:** Keep the database permission level as `ROLES.STUDENT` (or rename enum to `member`), but decouple the UI presentation so it strictly renders `currentOrg.userTerm` (`Employee`, `Resident`, `Citizen`, `Member`).

### 1.3 Database Trigger Fallback Trap (`handle_new_user`)
* **File:** Database Function `public.handle_new_user()` (Defined in [`DATABASE_ARCHITECTURE.md:L266–267`](file:///c:/CMS_V2/DATABASE_ARCHITECTURE.md#L266-L267))
  ```sql
  266: COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role),
  267: COALESCE(NEW.raw_user_meta_data->>'orgKey', 'COLLEGE')
  ```
  * **Architectural Problem:** 
    1. If `raw_user_meta_data->>'orgKey'` is missing or null, the PostgreSQL trigger inserts `'COLLEGE'` (or `'IIT_BOMBAY'`).
    2. If `'COLLEGE'` does not exist in `public.organizations` (because only modern seeds or dynamic orgs exist), the trigger throws a **Foreign Key Violation (Error 23503)** and prevents user registration entirely.
    3. If defaulted to `'IIT_BOMBAY'`, users are silently bound to an institution they never joined.
  * **Universal Solution:** 
    Update the trigger to dynamically look up an active organization or reject the registration if `orgKey` is null:
    ```sql
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    DECLARE
      resolved_org VARCHAR(50);
      resolved_role public.user_role;
    BEGIN
      resolved_org := NEW.raw_user_meta_data->>'orgKey';
      -- If missing, fall back to the first active organization in the database
      IF resolved_org IS NULL OR resolved_org = '' THEN
        SELECT org_key INTO resolved_org FROM public.organizations WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1;
      END IF;

      resolved_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role);

      INSERT INTO public.profiles (id, name, email, role, org_key)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        resolved_role,
        resolved_org
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        org_key = EXCLUDED.org_key,
        updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```

### 1.4 Dynamic Org Key Self-Destruction in `AuthContext`
* **File:** [`src/context/AuthContext.jsx:L56–62, L103, L255`](file:///c:/CMS_V2/src/context/AuthContext.jsx#L56-L62)
  ```javascript
  56: const hasLegacyJunk = Object.keys(parsed).some(
  57:   (k) => k.startsWith('ORG_') || parsed[k]?.name?.includes('<script') || ...
  58: );
  59: if (hasLegacyJunk) {
  60:   localStorage.removeItem(STORAGE_CUSTOM_ORGS_KEY);
  61:   return { ...ORG_TEMPLATES, ...SEEDED_ORGS };
  62: }
  ...
  103: if (!ORG_TEMPLATES[k] && !SEEDED_ORGS[k] && !k.startsWith('ORG_') ...)
  ...
  255: const key = `ORG_${slug}_${Date.now().toString().slice(-4)}`;
  ```
  * **Architectural Problem (CRITICAL BUG):** 
    1. Line 255 generates new custom organization keys with the prefix `ORG_` (e.g., `ORG_ACME_CORP_1234`).
    2. Line 103 prevents saving any organization starting with `ORG_` into `localStorage`.
    3. Line 57 considers any key starting with `ORG_` as **"legacy junk"**, deleting all custom organizations from `localStorage` on page reload.
  * **Universal Solution:** 
    Remove the `k.startsWith('ORG_')` check from `hasLegacyJunk` and the saving filter. Legitimate dynamic organizations generated by `createCustomOrg` should persist locally and sync from Supabase.

---

## 2. Role Standardization & Presentation Across All Roles

The system uses 3 base permission roles in PostgreSQL: `student` (member), `staff` (resolver), `admin` (governance).

### 2.1 Role 1: Requester / Member (`ROLES.STUDENT`)
| File & Line | Current Hardcoded Code | Architectural Problem | Universal Solution |
| :--- | :--- | :--- | :--- |
| **[`Sidebar.jsx:L48`](file:///c:/CMS_V2/src/components/layout/Sidebar.jsx#L48)** | `[ROLES.STUDENT]: { label: 'Student Portal', icon: GraduationCap, tone: 'info' }` | Corporate employees and housing society residents see "Student Portal" and a graduation cap. | Derive dynamically: `{ label: `${currentOrg?.userTerm \|\| 'Member'} Portal`, icon: currentOrg?.type === 'corporate' ? Briefcase : currentOrg?.type === 'society' ? Home : GraduationCap }` |
| **[`Navbar.jsx:L32–36`](file:///c:/CMS_V2/src/components/layout/Navbar.jsx#L32-L36)** | `function getRoleIcon(roleName) { ... return <GraduationCap size={13} />; }` | All non-staff/non-admin roles receive a student graduation cap. | Use archetype-aware icon helper based on `currentOrg.type`. |
| **[`Navbar.jsx:L92`](file:///c:/CMS_V2/src/components/layout/Navbar.jsx#L92)** | `return currentOrg.userTerm \|\| 'Student';` | Defaults user title to `'Student'` instead of `'Member'`. | Default to `'Member'`. |
| **[`formatters.js:L172–173`](file:///c:/CMS_V2/src/utils/formatters.js#L172-L173)** | `'Student Name', 'Student RollNo'` | CSV export has hardcoded student headers regardless of tenant. | Pass `orgConfig` into `generateComplaintsCSV(complaints, orgConfig)`: `[`${userTerm} Name`, `${userTerm} ID / Unit`]` |
| **[`StaffQueue.jsx:L969–971`](file:///c:/CMS_V2/src/pages/StaffQueue.jsx#L969-L971)** | `ticket.student?.rollNo` | Display label assumes college roll number. | Use universal identifier: `ticket.student?.rollNo \|\| ticket.student?.identifier \|\| ticket.student?.unit` |
| **[`AdminAnalytics.jsx:L726`](file:///c:/CMS_V2/src/pages/AdminAnalytics.jsx#L726)** | `item.student?.rollNo \|\| '—'` | Analytics table assumes college roll number. | Render `item.student?.identifier \|\| item.student?.rollNo \|\| '—'`. |

### 2.2 Role 2: Staff / Resolver (`ROLES.STAFF`)
| File & Line | Current Hardcoded Code | Architectural Problem | Universal Solution |
| :--- | :--- | :--- | :--- |
| **[`supabaseClient.js:L270`](file:///c:/CMS_V2/src/services/supabaseClient.js#L270)** | `export async function fetchOrgProfiles(orgKey = 'IIT_BOMBAY')` | Defaults to `'IIT_BOMBAY'`. If called without an explicit org key, fetches IIT Bombay staff roster for any tenant. | Remove default string; require `orgKey` parameter or throw error if not provided. |
| **[`taxonomy.js:L189–193`](file:///c:/CMS_V2/src/data/taxonomy.js#L189-L193)** | `DEPARTMENT_QUEUES = [ { id: 'dept_estate', name: 'Estate & Facilities Team' ... } ]` | Injects static campus department queues into reassignment dropdowns across all organizations. | Remove static `DEPARTMENT_QUEUES`. Derive live queues from `public.departments` filtered by `org_key`. |
| **[`StaffResolutions.jsx:L40`](file:///c:/CMS_V2/src/pages/StaffResolutions.jsx#L40)** | `return [...staffTargets, ...DEPARTMENT_QUEUES];` | Injects campus queues into reassignment targets. | Load departments dynamically from `public.departments WHERE org_key = currentOrgKey`. |

### 2.3 Role 3: Administrator / Governance (`ROLES.ADMIN`)
| File & Line | Current Hardcoded Code | Architectural Problem | Universal Solution |
| :--- | :--- | :--- | :--- |
| **[`constants.js:L181–186`](file:///c:/CMS_V2/src/utils/constants.js#L181-L186)** | `export const getRoleTerm = (role, org = 'COLLEGE') => { ... }` | Default org parameter is `'COLLEGE'`. | Remove `'COLLEGE'` default. Resolve against `currentOrg` object directly with fallback to generic terms (`'Admin'`, `'Staff'`, `'Member'`). |
| **[`AdminDepartments.jsx:L83`](file:///c:/CMS_V2/src/pages/AdminDepartments.jsx#L83)** | `updateOrgSettings(orgKey, { categories: updatedCategories })` | Works for custom orgs, but if `orgKey` is not passed, falls back to active org. | Ensure `orgKey` is validated non-empty before updating. |

---

## 3. Dynamic Organization Creation & Multi-Tenant Registry

### 3.1 The `resolveOrg` Fallback Trap
* **File:** [`src/utils/constants.js:L145–152`](file:///c:/CMS_V2/src/utils/constants.js#L145-L152)
  ```javascript
  145: export const resolveOrg = (org) => {
  146:   if (!org) return SEEDED_ORGS.IIT_BOMBAY;
  147:   if (typeof org === 'string') {
  148:     const key = org.toUpperCase();
  149:     return SEEDED_ORGS[key] || ORG_TEMPLATES[key] || SEEDED_ORGS.IIT_BOMBAY;
  150:   }
  151:   return org;
  152: };
  ```
  * **Architectural Problem:** 
    If a user creates an organization named `Acme Tech Corp` with key `ORG_ACME_TECH_9182`:
    1. `SEEDED_ORGS['ORG_ACME_TECH_9182']` is `undefined`.
    2. `ORG_TEMPLATES['ORG_ACME_TECH_9182']` is `undefined`.
    3. Line 149 returns `SEEDED_ORGS.IIT_BOMBAY`!
    4. The organization's member label becomes `Student`, its location label becomes `Hostel Wing & Room No`, and its admin term becomes `Dean of Student Affairs`!
  * **Universal Solution:**
    `resolveOrg` must accept an optional `registry` (e.g. `orgTemplates` from `AuthContext`) and fall back to a **neutral universal blueprint** rather than IIT Bombay:
    ```javascript
    export const UNIVERSAL_FALLBACK_ORG = {
      name: 'Organization Workspace',
      type: 'general',
      userLabel: 'Member',
      userTerm: 'Member',
      staffTerm: 'Staff Resolver',
      adminTerm: 'Administrator',
      locationLabel: 'Location / Room / Desk',
      categories: ['Facilities', 'IT & Technical', 'Operations', 'General Maintenance'],
    };

    export const resolveOrg = (org, registry = {}) => {
      if (!org) return UNIVERSAL_FALLBACK_ORG;
      if (typeof org === 'object') return org;
      const key = String(org).toUpperCase();
      return registry[key] || SEEDED_ORGS[key] || ORG_TEMPLATES[key] || UNIVERSAL_FALLBACK_ORG;
    };
    ```

### 3.2 Quick Locations Keying Mismatch
* **File:** [`src/data/taxonomy.js:L127–160`](file:///c:/CMS_V2/src/data/taxonomy.js#L127-L160)
  ```javascript
  127: export const QUICK_LOCATIONS = {
  128:   COLLEGE: [ 'Block B - Room 304', ... ],
  134:   SOCIETY: [ 'Tower A - Flat 402', ... ],
  140:   CORPORATE: [ 'Floor 4 - Desk 412', ... ],
  146: };
  ...
  160: export const getQuickLocations = (orgKey) => QUICK_LOCATIONS[orgKey] || FALLBACK_LOCATIONS;
  ```
  * **Architectural Problem:** 
    `QUICK_LOCATIONS` is keyed by archetype (`COLLEGE`, `SOCIETY`, `CORPORATE`). But `getQuickLocations` is called with `orgKey` (e.g. `IIT_BOMBAY`, `PRESTIGE_RESIDENCY`, `TCS_OLYMPUS`, or `ORG_ACME_1234`).
    Because `QUICK_LOCATIONS['IIT_BOMBAY']` is `undefined`, the function **always fails** and returns generic `FALLBACK_LOCATIONS` (`Building A - Floor 1`).
  * **Universal Solution:**
    Resolve by archetype type:
    ```javascript
    export const getQuickLocations = (orgKeyOrType, currentOrg = null) => {
      const type = (currentOrg?.type || orgKeyOrType || '').toUpperCase();
      return QUICK_LOCATIONS[type] || FALLBACK_LOCATIONS;
    };
    ```

---

## 4. Service & Supabase Data Layer Hardcoded Fallbacks

### 4.1 `complaintService.js` Line-by-Line Audit
| Line Number | Current Code | Architectural Flaw | Universal Solution |
| :--- | :--- | :--- | :--- |
| **[`L131`](file:///c:/CMS_V2/src/services/complaintService.js#L131)** | `org_key: complaint.org \|\| complaint.currentOrg \|\| complaint.org_key \|\| 'IIT_BOMBAY'` | Defaults missing tenant key to IIT Bombay in Supabase sync. | Require explicit tenant key. Reject ticket creation if no tenant context is provided. |
| **[`L267`](file:///c:/CMS_V2/src/services/complaintService.js#L267)** | `org: row.org_key \|\| 'IIT_BOMBAY'` | If database returns null, defaults to IIT Bombay. | Set `org: row.org_key \|\| 'UNKNOWN_ORG'`. |
| **[`L365–369`](file:///c:/CMS_V2/src/services/complaintService.js#L365-L369)** | `(org = 'IIT_BOMBAY') => ...` | Helper functions default parameter to IIT Bombay. | Remove `'IIT_BOMBAY'` default; rely on dynamic context. |
| **[`L476`](file:///c:/CMS_V2/src/services/complaintService.js#L476)** | `org: row.org_key \|\| 'IIT_BOMBAY'` | Realtime WebSocket sync defaults to IIT Bombay. | Set `org: row.org_key`. |
| **[`L638`](file:///c:/CMS_V2/src/services/complaintService.js#L638)** | `const activeOrg = data.currentOrg \|\| data.org \|\| data.org_key \|\| 'IIT_BOMBAY';` | Complaint creation defaults tenant to IIT Bombay. | If no tenant is provided, reject or retrieve active user's session `user.orgKey`. |
| **[`L653`](file:///c:/CMS_V2/src/services/complaintService.js#L653)** | `rollNo: data.student?.rollNo \|\| data.student?.roll_no \|\| ''` | Assumes `rollNo` is the only member identifier. | Support universal identifier: `identifier: data.student?.identifier \|\| data.student?.rollNo \|\| data.student?.empId \|\| ''`. |

### 4.2 `supabaseClient.js` Line-by-Line Audit
| Line Number | Current Code | Architectural Flaw | Universal Solution |
| :--- | :--- | :--- | :--- |
| **[`L235`](file:///c:/CMS_V2/src/services/supabaseClient.js#L235)** | `role: (profile.role \|\| 'student').toLowerCase()` | Defaults role to `student`. | Retain `student` as base permission role, but map metadata cleanly. |
| **[`L236`](file:///c:/CMS_V2/src/services/supabaseClient.js#L236)** | `org_key: profile.org_key \|\| profile.orgKey \|\| 'IIT_BOMBAY'` | Defaults profile org to IIT Bombay. | Enforce `profile.org_key \|\| profile.orgKey`. If neither exists, throw an error. |
| **[`L240–241`](file:///c:/CMS_V2/src/services/supabaseClient.js#L240-L241)** | `roll_no: ... , room_no: ...` | Database schema columns are university-specific. | Store arbitrary member identifiers in a flexible metadata jsonb or map `identifier -> roll_no`. |
| **[`L270`](file:///c:/CMS_V2/src/services/supabaseClient.js#L270)** | `export async function fetchOrgProfiles(orgKey = 'IIT_BOMBAY')` | Defaults orgKey to IIT Bombay. | Make `orgKey` required without a default. |

---

## 5. Postman API Test Suite Hardcoding Audit

### 5.1 Hardcoded Test Payloads in Postman Collection
* **Requests 1.1, 1.2, 2.1, 4.1:**
  * Postman collection `ResolveX CMS` (`53760296-2650e9a9-9d7d-4749-b97c-8711c1fc535c`) was written with hardcoded values:
    * `"org_key": "COLLEGE"`
    * `"category": "Academics & Labs"`
    * `"student_id": "5f3f9ee1-df2a-458f-8ed6-6ab9eee48b90"`
  * **Architectural Problem:** 
    When `'COLLEGE'` was removed, the tests failed with foreign key violations. If we replace it with `'IIT_BOMBAY'`, we are repeating the anti-pattern: the tests only prove IIT Bombay works, while leaving dynamic organization creation and cross-tenant isolation unverified.

### 5.2 Universal Postman Test Strategy
1. **Dynamic Environment Variables:**
   * Replace hardcoded `"org_key": "COLLEGE"` with `{{active_org_key}}`.
   * Replace hardcoded categories with `{{active_category}}`.
2. **Dynamic Flow 11 Integration:**
   * Run Request 11.1 (`Dynamic Organization Registration`) to create a test organization (`ORG_TEST_XXXX`).
   * Extract its `org_key` into `pm.environment.set("active_org_key", res.org_key)`.
   * Execute Flow 1 (Login/Signup), Flow 2 (Ticket Creation), and Flow 5 (Staff Queue) using `{{active_org_key}}`.
   * Verify that tickets filed under `{{active_org_key}}` are **invisible** to users in other organizations (Cross-Tenant RLS Verification).

---

## 6. Master Summary Table: All Hardcoded Points Across System

| Category | File | Line(s) | Current Problematic Value | Universal Multi-Tenant Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Auth / UI** | [`src/components/Auth.jsx`](file:///c:/CMS_V2/src/components/Auth.jsx) | 71 | `useState(orgKey \|\| 'IIT_BOMBAY')` | Initialize with first active dynamic org (`sanitizedOrgs[0]?.key`) |
| **Auth / UI** | [`src/components/Auth.jsx`](file:///c:/CMS_V2/src/components/Auth.jsx) | 74–76 | Defaults to `COLLEGE` archetype | Default to neutral archetype dynamically |
| **Auth / Context** | [`src/context/AuthContext.jsx`](file:///c:/CMS_V2/src/context/AuthContext.jsx) | 56–59 | Purges `k.startsWith('ORG_')` on reload | Remove `ORG_` filter so custom orgs persist |
| **Auth / Context** | [`src/context/AuthContext.jsx`](file:///c:/CMS_V2/src/context/AuthContext.jsx) | 77 | `return 'IIT_BOMBAY'` | Return first live org or null until loaded |
| **Auth / Context** | [`src/context/AuthContext.jsx`](file:///c:/CMS_V2/src/context/AuthContext.jsx) | 103 | Filters out `!k.startsWith('ORG_')` | Save all custom organizations to `localStorage` |
| **Constants** | [`src/utils/constants.js`](file:///c:/CMS_V2/src/utils/constants.js) | 146, 149 | `return SEEDED_ORGS.IIT_BOMBAY` | Return `UNIVERSAL_FALLBACK_ORG` with neutral terms |
| **Constants** | [`src/utils/constants.js`](file:///c:/CMS_V2/src/utils/constants.js) | 157, 165, 173, 181 | `org = 'COLLEGE'` default arg | Remove `'COLLEGE'` default argument |
| **Taxonomy** | [`src/data/taxonomy.js`](file:///c:/CMS_V2/src/data/taxonomy.js) | 127–160 | `QUICK_LOCATIONS` keyed by archetype string | Resolve quick locations by `currentOrg.type` |
| **Taxonomy** | [`src/data/taxonomy.js`](file:///c:/CMS_V2/src/data/taxonomy.js) | 189–193 | Static `DEPARTMENT_QUEUES` (campus) | Query dynamic departments from `public.departments` |
| **Layout / UI** | [`src/components/layout/Sidebar.jsx`](file:///c:/CMS_V2/src/components/layout/Sidebar.jsx) | 48 | `label: 'Student Portal', icon: GraduationCap` | Render `${currentOrg.userTerm} Portal` & dynamic icon |
| **Layout / UI** | [`src/components/layout/Navbar.jsx`](file:///c:/CMS_V2/src/components/layout/Navbar.jsx) | 32–36 | `GraduationCap` for all students | Archetype-aware icon helper |
| **Data Service** | [`src/services/complaintService.js`](file:///c:/CMS_V2/src/services/complaintService.js) | 131, 267, 476, 638 | Fallbacks to `'IIT_BOMBAY'` | Strict validation: require explicit tenant context |
| **Data Service** | [`src/services/complaintService.js`](file:///c:/CMS_V2/src/services/complaintService.js) | 365–369 | `(org = 'IIT_BOMBAY')` | Remove default argument |
| **Data Service** | [`src/services/supabaseClient.js`](file:///c:/CMS_V2/src/services/supabaseClient.js) | 236 | `profile.org_key \|\| 'IIT_BOMBAY'` | Require valid `org_key` |
| **Data Service** | [`src/services/supabaseClient.js`](file:///c:/CMS_V2/src/services/supabaseClient.js) | 270 | `fetchOrgProfiles(orgKey = 'IIT_BOMBAY')` | Require `orgKey` argument |
| **Intake Form** | [`src/pages/NewComplaintForm.jsx`](file:///c:/CMS_V2/src/pages/NewComplaintForm.jsx) | 273 | `user?.orgKey \|\| orgKey \|\| 'IIT_BOMBAY'` | Use `user?.orgKey \|\| orgKey`; error if empty |
| **Reporting** | [`src/utils/formatters.js`](file:///c:/CMS_V2/src/utils/formatters.js) | 172–173 | `'Student Name', 'Student RollNo'` | Dynamic headers: `${userTerm} Name`, `${userTerm} ID` |
| **DB Trigger** | Supabase PostgreSQL | Trigger `handle_new_user` | `COALESCE(orgKey, 'COLLEGE')` | Select first active org or raise exception |

---

## 7. Next Steps & Recommended Action Plan

To systematically resolve this without blind changes or regressions:
1. **Phase 1: Database & Trigger Standardization**
   - Update `handle_new_user()` in Supabase SQL to dynamically assign users to active organizations without defaulting to `'COLLEGE'` or `'IIT_BOMBAY'`.
2. **Phase 2: Core Utility & Context Universalization**
   - Fix `src/utils/constants.js` (`resolveOrg` and `UNIVERSAL_FALLBACK_ORG`).
   - Fix `src/context/AuthContext.jsx` (remove `k.startsWith('ORG_')` deletion bug, make initial org dynamic).
   - Fix `src/data/taxonomy.js` (`QUICK_LOCATIONS` archetype resolution).
3. **Phase 3: Service Layer Strictness**
   - Remove `'IIT_BOMBAY'` defaults from `complaintService.js` and `supabaseClient.js`.
4. **Phase 4: UI & Export Presentation Decoupling**
   - Decouple `Sidebar.jsx`, `Navbar.jsx`, and `formatters.js` to dynamically respect `currentOrg.userTerm` and `currentOrg.type`.
5. **Phase 5: Postman Verification**
   - Update the Postman collection to test dynamic organization registration, member signup under that new organization, ticket creation, and cross-tenant RLS isolation.
