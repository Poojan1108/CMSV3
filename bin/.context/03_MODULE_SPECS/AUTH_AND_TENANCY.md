# Module Specification: Authentication & Multi-Tenancy

> **Module ID:** `03A_AUTH_AND_TENANCY`  
> **Status:** Active / Ground Truth  
> **Target Files:**
> - [`src/context/AuthContext.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/context/AuthContext.jsx)
> - [`src/components/Auth.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/components/Auth.jsx)
> - [`src/components/layout/ProtectedRoute.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/components/layout/ProtectedRoute.jsx)
> - [`src/pages/LandingPage.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/LandingPage.jsx)
> - [`src/services/supabaseClient.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js)

---

## 1. Module Overview & Responsibilities
This module governs the public landing experience, user authentication (Login / Signup / Password Reset), session lifecycle, multi-tenant organization context, and role-based route guarding.

### Routes Protected:
- Public: `/`, `/login`, `/signup`, `/reset`
- Protected (All Authenticated): `/dashboard`, `/track`, `/complaints/new`
- Protected (Staff & Admin): `/staff/queue`, `/staff/assigned`, `/staff/resolutions`
- Protected (Admin Only): `/admin/dashboard`, `/admin/analytics`, `/admin/departments`, `/admin/members`

---

## 2. Key Functions & Exact Citations

| Function / Component | File & Citation | Purpose |
| :--- | :--- | :--- |
| `AuthContext` Provider | [`AuthContext.jsx:1`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/context/AuthContext.jsx) | Holds `user`, `profile`, `currentOrg`, `role`, and dynamic tenant terms. |
| `ProtectedRoute` | [`ProtectedRoute.jsx:1`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/components/layout/ProtectedRoute.jsx) | Inspects `profile.role` against `allowedRoles`; redirects unauthorized users. |
| `setRealtimeAuth` | [`supabaseClient.js:33`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L33) | Injects Supabase JWT into WebSocket channels to satisfy PostgreSQL RLS. |
| `getUserProfile` | [`supabaseClient.js:220`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L220) | Fetches user profile from `public.profiles` with in-memory caching. |
| `upsertUserProfile` | [`supabaseClient.js:263`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L263) | Updates or registers profile record upon initial signup. |
| `fetchOrganizations` | [`supabaseClient.js:429`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L429) | Fetches available tenant organizations from `public.organizations`. |
| `resolveOrg` | [`constants.js:169`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L169) | Resolves dynamic terms (`userTerm`, `staffTerm`, `locationLabel`) per archetype. |

---

## 3. Business Rules & Constraints
1. **Tenant Isolation:** Every authenticated request and WebSocket subscription MUST carry `organization_key`.
2. **Profile Sync:** When an `auth.users` session is established, the profile MUST be loaded from `public.profiles` to determine the user's role (`student`, `staff`, `admin`).
3. **Session Purge on Logout:** On logout, all cached user data and ticket state MUST be purged via [`clearCache()`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1344) to prevent cross-account data leakage.

---

## 4. Optimization & Refactoring Directives
- **Automated Realtime Token Ingestion:** Rather than requiring manual calls to [`setRealtimeAuth:33`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L33), wire token refresh directly into Supabase's `onAuthStateChange` listener.
- **Dead Code Cleanup:** Remove unused export `CATEGORIES` at [`constants.js:219`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L219).
