# CMS_V2 Full Application Modules & Functions Architectural Context

> **Document Version:** 2.0  
> **Environment:** Client-Side Single Page Application (React 18 + Vite) + Supabase Multi-Tenant Backend (PostgREST + Realtime WebSockets)  
> **Scope:** Complete architectural inventory of all modules, components, services, utilities, and functions categorized by role and architectural tier.

---

## 1. Architectural Overview & Persona Boundaries

The application enforces a strict three-tier Role-Based Access Control (RBAC) model operating over a shared multi-tenant database:

```
                                  ┌───────────────────────────────┐
                                  │      Public Landing / Auth    │
                                  │  (/, /login, /signup, /reset) │
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │    ProtectedRoute (RBAC)      │
                                  │        AppLayout Shell        │
                                  └───────┬───────┬───────┬───────┘
                                          │       │       │
                 ┌────────────────────────┘       │       └────────────────────────┐
                 ▼                                ▼                                ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
    │     Complainant Role      │   │    Staff / Resolver Role  │   │    Administrator Role     │
    │ (Student / Resident / Emp)│   │  (Technician / Facility)  │   │     (Dean / Secretary)    │
    │  • /dashboard             │   │  • /staff/queue           │   │  • /admin/dashboard       │
    │  • /complaints/new        │   │  • /staff/assigned        │   │  • /admin/analytics       │
    │  • /track                 │   │  • /staff/resolutions     │   │  • /admin/departments     │
    │                           │   │                           │   │  • /admin/members         │
    └─────────────┬─────────────┘   └─────────────┬─────────────┘   └─────────────┬─────────────┘
                  │                               │                               │
                  └───────────────────────┬───────┴───────────────────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │   Shared Application Context    │
                         │    • AuthContext (Session/Org)  │
                         │    • ToastContext (Feedback)    │
                         └────────────────┬────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │      Data & Service Layer       │
                         │    • complaintService.js        │
                         │    • supabaseClient.js          │
                         └────────────────┬────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │      Supabase Cloud Backend     │
                         │  • PostgREST HTTPS REST APIs    │
                         │  • Realtime WebSockets (30ms)   │
                         │  • Storage Bucket (Attachments) │
                         └─────────────────────────────────┘
```

---

## 2. Directory & Module Taxonomy Map

```
c:\Users\patel\OneDrive\Desktop\CMS_V2\
├── src/
│   ├── App.jsx                     # Root application router & code-split suspense
│   ├── main.jsx                    # React 18 DOM root bootstrap
│   ├── index.css                   # Global responsive design tokens & micro-animations
│   ├── pages/                      # Page components (routed views)
│   │   ├── LandingPage.jsx         # Public marketing & embedded authentication
│   │   ├── MyComplaintsList.jsx    # [Role: Complainant] Ticket list & metrics
│   │   ├── NewComplaintForm.jsx    # [Role: Complainant] Intake form & media upload
│   │   ├── TicketTracker.jsx       # [Role: Complainant] Live resolution tracker
│   │   ├── StaffQueue.jsx          # [Role: Staff] Triage queue & detail inspector
│   │   ├── StaffResolutions.jsx    # [Role: Staff] Completed resolution log
│   │   ├── AdminAnalytics.jsx      # [Role: Admin] Workload dispatch & metrics
│   │   ├── AdminDepartments.jsx    # [Role: Admin] SLA targets & org settings
│   │   └── AdminMembers.jsx        # [Role: Admin] Member roster & role promotion
│   ├── components/
│   │   ├── Auth.jsx                # Universal authentication modal (Login/Signup/Forgot)
│   │   ├── layout/                 # Core navigation shell
│   │   │   ├── AppLayout.jsx       # Responsive drawer & layout container
│   │   │   ├── Navbar.jsx          # Tenant header & profile dropdown
│   │   │   ├── Sidebar.jsx         # Role-adaptive navigation rail
│   │   │   └── ProtectedRoute.jsx  # RBAC route guard
│   │   ├── ui/                     # Reusable design system components
│   │   │   ├── Badges.jsx          # StatusBadge, PriorityBadge, SlaBadge, TicketId, Tag
│   │   │   ├── EmptyState.jsx      # Zero-data feedback placeholder
│   │   │   ├── MetricCard.jsx      # KPI summary card with trend pills
│   │   │   ├── Modal.jsx           # Accessible dialog window with ESC trap
│   │   │   └── PageHeader.jsx      # Page title & action bar
│   │   └── landing/                # Public landing narrative sections & SVG art
│   ├── context/                    # React Context providers
│   │   ├── AuthContext.jsx         # Session, organization template, and member sync
│   │   └── ToastContext.jsx        # Global snackbar feedback provider
│   ├── services/                   # Business logic and network communication
│   │   ├── complaintService.js     # Ticket lifecycle, memory cache, and event pub/sub
│   │   └── supabaseClient.js       # PostgREST client, Realtime WebSockets, Storage
│   ├── data/
│   │   └── taxonomy.js             # Subcategories, location presets, and KB articles
│   └── utils/
│       ├── constants.js            # RBAC roles, statuses, priorities, org blueprints
│       └── formatters.js           # Date/time, SLA countdowns, RFC 4180 CSV generation
```

---

## 3. Role-Based Module & Function Directory

### Tier 1: Complainant / User Portal
*Primary Personas: Student, Housing Society Resident, Corporate Employee*

#### [`src/pages/MyComplaintsList.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx)
- **`MyComplaintsList()`** — [Line 39](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx#L39) — **Active**  
  Primary dashboard for lodging and reviewing personal complaints. Computes active filter counts, filters complaints by status, category, priority, and free-text search.
- **`updateComplaintsFromCache()`** — [Line 56](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx#L56) — **Active**  
  Retrieves complaints from memory cache matching current user ID or registered email.
- **`loadUserComplaints()`** — [Line 76](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx#L76) — **Active**  
  Triggers Supabase background sync and updates local state.
- **`handleManualRefresh()`** — [Line 85](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx#L85) — **Active**  
  User-triggered pull-to-refresh action with spinner indicator.
- **`resetFilters()`** — [Line 170](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx#L170) — **Active**  
  Resets search query, category, priority, and status filters.

#### [`src/pages/NewComplaintForm.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx)
- **`NewComplaintForm()`** — [Line 42](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L42) — **Active**  
  Intake form providing smart category deflection, SLA countdown preview, location quick-chips, photo evidence drag-and-drop, and draft auto-saving.
- **`clearDraft()`** — [Line 107](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L107) — **Active**  
  Purges saved draft payload from `localStorage`.
- **`handleDiscardDraft()`** — [Line 113](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L113) — **Active**  
  Resets form state and discards active draft.
- **`handleCategoryChange(newCategory)`** — [Line 130](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L130) — **Active**  
  Updates selected category and re-seeds sub-category dropdown.
- **`processFiles(fileList)`** — [Line 190](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L190) — **Active**  
  Validates uploaded file size (<5MB), generates image previews, and populates attachment queue.
- **`handleFileUpload(e)`** — [Line 219](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L219) — **Active**  
  Input change event listener for file picker.
- **`removeAttachment(id)`** — [Line 224](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L224) — **Active**  
  Removes attachment item from queue.
- **`handleSubmit(e)`** — [Line 228](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L228) — **Active**  
  Validates required fields, uploads attachments to Supabase Storage, calculates priority SLAs, auto-routes department, and registers ticket.

#### [`src/pages/TicketTracker.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx)
- **`TicketTracker()`** — [Line 60](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx#L60) — **Active**  
  Resolution tracking interface with canonical 6-stage timeline, public/internal comment threads, photo evidence lightbox, and resolution sign-off.
- **`handleLookupSubmit(e)`** — [Line 151](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx#L151) — **Active**  
  Executes ticket search by ticket ID (`CMS-2026-XXXX`).
- **`handleCopyId()`** — [Line 178](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx#L178) — **Active**  
  Copies ticket ID to clipboard with visual confirmation.
- **`handleConfirmResolution()`** — [Line 189](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx#L189) — **Active**  
  Complainant sign-off confirming the technician fix and closing ticket as `Resolved`.
- **`handleRejectResolution()`** — [Line 209](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx#L209) — **Active**  
  Complainant rejection of proposed resolution, reopening ticket back to `In Progress`.
- **`handleCommentSubmit(e)`** — [Line 229](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx#L229) — **Active**  
  Appends comment to ticket thread and syncs to `public.complaint_comments`.

---

### Tier 2: Staff / Resolver Portal
*Primary Personas: Department Technician, Facility Manager, Hostel Warden, IT Support*

#### [`src/pages/StaffQueue.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx)
- **`StaffQueue()`** — [Line 71](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L71) — **Active**  
  Operational ticket queue with SLA breach warnings, dynamic category filtering, and single-click ticket review.
- **`actor()`** — [Line 204](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L204) — **Active**  
  Resolves active staff user identity for audit trail records.
- **`handleStartInvestigation(ticketId)`** — [Line 208](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L208) — **Active**  
  Transitions unassigned/pending tickets to `In Progress` and auto-assigns ticket to current technician.
- **`handleProposeResolution(e)`** — [Line 234](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L234) — **Active**  
  Validates fix summary, transitions status to `Pending Confirmation`, and dispatches resolution confirmation request to complainant.
- **`handleOpenTicketDetails(ticket)`** — [Line 259](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L259) — **Active**  
  Fetches full ticket comments and attachments and opens `TicketDetailModal`.
- **`handleModalAddInternalNote(e)`** — [Line 271](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L271) — **Active**  
  Posts private technician remarks visible strictly to staff and admin roles.
- **`handleResetFilters()`** — [Line 291](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L291) — **Active**  
  Clears queue filters.
- **`TicketDetailModal(props)`** — [Line 825](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L825) — **Active**  
  Sub-component rendering complete ticket overview, photo evidence lightbox, audit timeline, tabbed comments, and contextual lifecycle actions.

#### [`src/pages/StaffResolutions.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffResolutions.jsx)
- **`StaffResolutions()`** — [Line 26](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffResolutions.jsx#L26) — **Active**  
  Auditing log displaying resolved and closed tickets with turnaround duration and resolution summaries.

---

### Tier 3: Admin / Governance Portal
*Primary Personas: Dean of Student Affairs, Society Secretary, Corporate Operations Admin*

#### [`src/pages/AdminAnalytics.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx)
- **`AdminAnalytics()`** — [Line 45](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx#L45) — **Active**  
  Executive dispatch dashboard displaying resolution rate, average turnaround hours, priority distribution, ticket dispatch table, and reassignment modal.
- **`handleStatusOverride(ticketId, newStatus)`** — [Line 202](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx#L202) — **Active**  
  Administrative status override synchronized with Supabase (streamlined to eliminate double-render flicker).
- **`handleOpenAssignModal(ticket)`** — [Line 217](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx#L217) — **Active**  
  Opens staff assignment dialog.
- **`handleAssignSubmit(e)`** — [Line 228](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx#L228) — **Active**  
  Reassigns ticket to target staff member and records reassignment reason in ticket audit history.
- **`handleExportCSV()`** — [Line 254](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx#L254) — **Active**  
  Exports current complaint dataset to CSV file.

#### [`src/pages/AdminDepartments.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx)
- **`AdminDepartments()`** — [Line 30](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L30) — **Active**  
  Department SLA target configuration and organization archetype profile management.
- **`handleSaveOrgConfig(e)`** — [Line 56](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L56) — **Active**  
  Saves organization name and dynamic terms (`userTerm`, `staffTerm`, `locationLabel`).
- **`handleAddCustomCategory(e)`** — [Line 72](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L72) — **Active**  
  Adds new category to organization taxonomy.
- **`handleRemoveCategory(cat)`** — [Line 86](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L86) — **Active**  
  Removes category from taxonomy.
- **`loadSavedSla()`** — [Line 119](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L119) — **Active**  
  Retrieves saved SLA hour targets from storage or defaults.
- **`handleSlaChange(category, hours)`** — [Line 165](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L165) — **Active**  
  Persists SLA target hours to database and localStorage.
- **`handleSwitchTemplate(templateKey)`** — [Line 188](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L188) — **Active**  
  Switches active template archetype.

#### [`src/pages/AdminMembers.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx)
- **`AdminMembers()`** — [Line 29](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L29) — **Active**  
  Member roster administration, role elevation (Student &rarr; Staff &rarr; Admin), and department assignment.
- **`handleRefresh()`** — [Line 107](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L107) — **Active**  
  Reloads member profiles from Supabase.
- **`handleOpenEditModal(member)`** — [Line 115](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L115) — **Active**  
  Opens role and department assignment modal for a selected user.
- **`handleCloseModal()`** — [Line 124](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L124) — **Active**  
  Closes assignment modal dialog.
- **`handleToggleCategory(category)`** — [Line 129](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L129) — **Active**  
  Assigns or unassigns category responsibilities for a staff member.
- **`handleDepartmentChange(e)`** — [Line 135](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L135) — **Active**  
  Selects department from dropdown.
- **`handleSaveMember()`** — [Line 144](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L144) — **Active**  
  Persists updated member role, department, and category assignments to `public.profiles`.

---

## 4. Shared Application Services & Network Layer

### [`src/services/complaintService.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js)

| Method | Status | Exact Citation & Purpose |
| :--- | :--- | :--- |
| `subscribeToLiveUpdates(cb)` | **Active** | [Line 442](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L442) — Subscribes components to live state changes with 30ms micro-debouncing. |
| `generateId()` | **Active** | [Line 493](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L493) — Collision-free ticket ID generator (`CMS-2026-XXXX`). |
| `syncFromSupabase(opts)` | **Active** | [Line 499](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L499) — Syncs remote complaints with request deduplication and TTL caching. |
| `syncTicketDetails(id)` | **Active** | [Line 647](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L647) — Fetches comments, attachments, and audit history for a single ticket. |
| `fetchComplaints(filters)` | **Active** | [Line 747](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L747) — Async sync followed by filtered list retrieval. |
| `getAll(filters)` | **Active** | [Line 761](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L761) — Fast in-memory query engine (status, category, priority, studentId, search, sort). |
| `getById(id)` | **Active** | [Line 835](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L835) — Forgiving ticket ID matcher (case-insensitive, hash removal, suffix match). |
| `create(data)` | **Active** | [Line 861](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L861) — Creates ticket, calculates priority SLAs, auto-routes department, and syncs to Supabase. |
| `updateStatus(id, st, by, note)` | **Active** | [Line 938](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L938) — Enforces RBAC, logs status history, and persists status to Supabase. |
| `addComment(id, sender, txt, int)` | **Active** | [Line 997](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L997) — Appends public/internal comment and syncs to `complaint_comments`. |
| `reassign(id, assignee, by, reason)` | **Active** | [Line 1052](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1052) — Transfers ticket to new technician and logs audit record. |
| `proposeResolution(id, staff, note)` | **Active** | [Line 1138](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1138) — Moves ticket to `pending_confirmation` and attaches fix summary. |
| `confirmResolution(id, user, note)` | **Active** | [Line 1211](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1211) — Complainant sign-off; closes ticket as `resolved`. |
| `rejectResolution(id, user, reason)` | **Active** | [Line 1278](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1278) — Complainant rejection; reopens ticket as `in_progress`. |
| `clearCache()` | **Active** | [Line 1344](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1344) — Purges cache upon logout to prevent cross-account leaks. |
| `resetToSeedData()` | **Dev/Test** | [Line 1357](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1357) — Empties local complaints cache for testing. |
| `getStats(org)` | **Active** | [Line 1369](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1369) — Generates status totals and urgent ticket counts. |
| `exportToCSV(complaints)` | **Active** | [Line 1393](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1393) — Delegates to `generateComplaintsCSV`. |

### [`src/services/supabaseClient.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js)

| Exported Function | Status | Exact Citation & Purpose |
| :--- | :--- | :--- |
| `setRealtimeAuth(token)` | **Active** | [Line 33](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L33) — Passes active JWT to Realtime WebSocket to satisfy PostgreSQL RLS. |
| `initRealtimeSubscription(cb)` | **Active** | [Line 50](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L50) — Establishes Supabase channel listening for `postgres_changes`. |
| `fileToDataUrl(file)` | **Active** | [Line 120](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L120) — Converts file to Base64 preview string. |
| `uploadComplaintAttachment(file, id)` | **Active** | [Line 137](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L137) — Uploads attachment to bucket `complaint-attachments` with fallback to Data URL. |
| `clearUserProfileCache(userId)` | **Active** | [Line 202](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L202) — Clears memory profile cache. |
| `getUserProfile(userId, force)` | **Active** | [Line 220](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L220) — Queries `public.profiles` for user metadata with in-memory caching. |
| `upsertUserProfile(profile)` | **Active** | [Line 263](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L263) — Upserts profile record into `public.profiles`. |
| `clearOrgProfilesCache(orgKey)` | **Active** | [Line 307](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L307) — Invalidates member cache. |
| `fetchOrgProfiles(orgKey, filter)` | **Active** | [Line 326](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L326) — Fetches staff roster for reassignments and member tables. |
| `updateMemberRole(userId, updates)` | **Active** | [Line 388](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L388) — Admin mutation updating role, department, and categories. |
| `fetchOrganizations()` | **Active** | [Line 429](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L429) — Queries registered organizations from `public.organizations`. |
| `createOrganization(orgData)` | **Active** | [Line 462](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L462) — Inserts newly registered organization into Supabase. |

---

## 5. Domain Taxonomy, Constants & Formatting Utilities

### [`src/utils/constants.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js)
- **`ROLES`** — [Line 1](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L1) — RBAC role identifiers: `STUDENT: 'student'`, `STAFF: 'staff'`, `ADMIN: 'admin'`.
- **`ORG_ARCHETYPES`** — [Line 12](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L12) — Archetype blueprints (`COLLEGE`, `SOCIETY`, `CORPORATE`).
- **`SEEDED_ORGS`** — [Line 109](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L109) — Canonical organizations (`IIT_BOMBAY`, `PRESTIGE_RESIDENCY`, `TCS_OLYMPUS`).
- **`resolveOrg(org, reg)`** — [Line 169](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L169) — Dynamically resolves tenant terms and labels.
- **`getOrgCategories(org, reg)`** — [Line 188](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L188) — Resolves category list.
- **`getOrgLocationLabel(org, reg)`** — [Line 196](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L196) — Resolves location label (`Hostel Room`, `Flat No`, `Desk ID`).
- **`getOrgUserLabel(org, reg)`** — [Line 204](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L204) — Resolves user term (`Student`, `Resident`, `Employee`).
- **`getRoleTerm(role, org, reg)`** — [Line 212](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L212) — Resolves dynamic role labels.
- **`STATUSES` / `STATUS_LABELS`** — [Line 235](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L235) — Ticket lifecycle states (`pending`, `in_progress`, `pending_confirmation`, `resolved`, `rejected`).
- **`PRIORITIES` / `PRIORITY_LABELS`** — [Line 221](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L221) — Priority tiers (`low`, `medium`, `high`, `urgent`).

### [`src/utils/formatters.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/formatters.js)
- **`formatDate(dateInput)`** — [Line 19](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/formatters.js#L19) — Human-readable date-time (`Jul 23, 2026, 01:15 PM`).
- **`formatRelativeTime(dateInput)`** — [Line 39](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/formatters.js#L39) — Relative timestamps (`Just now`, `5m ago`, `2d ago`).
- **`getSlaStatus(complaint)`** — [Line 96](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/formatters.js#L96) — Calculates turnaround duration, SLA countdown, breach status, and badge text.
- **`generateComplaintsCSV(complaints, orgConfig)`** — [Line 162](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/formatters.js#L162) — RFC 4180 CSV serializer with escaped strings.

### [`src/data/taxonomy.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/data/taxonomy.js)
- **`SUB_CATEGORIES_MAP`** — [Line 8](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/data/taxonomy.js#L8) — Detailed sub-category options mapped to categories.
- **`getSubCategories(category)`** — [Line 136](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/data/taxonomy.js#L136) — Resolves sub-categories for intake form.
- **`getQuickLocations(orgKey)`** — [Line 208](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/data/taxonomy.js#L208) — Fast location pill presets for quick entry.
- **`ACCESS_TIME_SLOTS`** — [Line 225](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/data/taxonomy.js#L225) — Morning / Afternoon / Evening inspection windows.

---

## 6. Audit of Unused, Orphaned, or Stray Code

The following 6 items were identified during the audit:

| # | File & Location | Item | Finding & Status |
| :--- | :--- | :--- | :--- |
| **1** | [`src/services/import { createHotContext as __vite__cre.txt`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/import%20%7B%20createHotContext%20as%20__vite__cre.txt) | Entire 132-line file | **Stray / Accidental Clipboard File.** An accidental paste containing Vite HMR client output. It is not referenced anywhere in the application and should be deleted to keep the services directory clean. |
| **2** | [`src/data/taxonomy.js:140–171`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/data/taxonomy.js#L140-L171) | `KB_ARTICLES` | **Unused Export.** Knowledge-base articles array intended for self-service deflection, but never imported by [`NewComplaintForm.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx) or any other page. |
| **3** | [`src/data/taxonomy.js:232–248`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/data/taxonomy.js#L232-L248) | `CONTACT_METHODS` | **Unused Export.** Array defining contact channels (`In-App`, `Email`, `Phone/SMS`) that is never imported by any active intake form or settings page. |
| **4** | [`src/data/taxonomy.js:251–255`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/data/taxonomy.js#L251-L255) | `DEPARTMENT_QUEUES` | **Unused Export.** Hardcoded department queue IDs (`dept_estate`, `dept_sanitation`, `dept_security`). Departments are now fetched dynamically from Supabase `public.departments`, leaving this array dormant. |
| **5** | [`src/utils/formatters.js:70–90`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/formatters.js#L70-L90) | `getStatusBadgeColor`, `getPriorityBadgeColor` | **Unused Functions.** Leftover color mapper functions. The UI badges in [`Badges.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/components/ui/Badges.jsx) handle their own CSS class styling via CSS variables, so these functions are never imported or invoked. |
| **6** | [`src/utils/constants.js:219`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js#L219) | `CATEGORIES` | **Unused Export.** Static export `export const CATEGORIES = UNIVERSAL_FALLBACK_ORG.categories;`. All parts of the app now use dynamic taxonomy from `useAuth().categories` or `getOrgCategories()`. |
