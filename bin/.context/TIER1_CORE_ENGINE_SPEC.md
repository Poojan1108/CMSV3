# Tier 1 Focus Spec: Core Service & Data Layer (Foundation Engine)

> **Document Version:** 1.0  
> **Status:** Active Sprint Blueprint  
> **Target Scope:** Strictly Tier 1 (Core Service & Data Layer Engine). Nothing else.  
> **Target Files:**
> - [`src/services/complaintService.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js) (To be refactored in-place)
> - [`src/services/supabaseClient.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js) (Clean client & Realtime hooks)
> - New Foundation File: `src/services/complaintApi.js` (Stateless PostgREST API repository)

---

## 1. What We Must Eliminate (Anti-Patterns to Remove)

| Item to Eliminate | Current Location | Why We Are Removing It |
| :--- | :--- | :--- |
| **`STORAGE_KEY` & `localStorage` cache** | [`complaintService.js:18, 271-292`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L18) | 5MB browser quota risk (`QuotaExceededError`) and dual-source-of-truth desync with Supabase database. |
| **Quadruple Event Multiplexing** | [`complaintService.js:35-53, 442-479`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L35) | Redundant DOM CustomEvent, BroadcastChannel, and StorageEvent firing simultaneously, causing multi-render lag. |
| **In-Memory TTL & In-Flight Locks** | [`complaintService.js:422-425`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L422) | Manual 5,000ms TTL and custom promise locks (`syncFromSupabasePromise`) re-inventing what React Query does natively. |
| **Client-Side Array Filtering** | [`complaintService.js:752-814`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L752) | Iterating thousands of tickets in JavaScript memory slows down the UI thread. |
| **Secondary Waterfall Child Queries** | [`complaintService.js:527-533`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L527) | Manually querying `complaint_comments` and `complaint_history` via `.in('complaint_id', ids)` instead of native PostgREST relational joins. |

---

## 2. Exact Functions to Focus On & Target Architecture

### 2.1 Ticket Retrieval & Querying
- **`syncFromSupabase()` & `fetchComplaints()`** — [Lines 490, 738](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L490):
  - **What to do:** Replace manual array sync with a direct, relational PostgREST query:
    ```javascript
    supabase.from('complaints').select('*, complaint_comments(*), complaint_history(*)').order('created_at', { ascending: false });
    ```
- **`getAll(filters)`** — [Line 752](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L752):
  - **What to do:** Push filtering (`category`, `status`, `priority`, `org_key`, `student_id`) directly to Supabase query builders with `.range(from, to)` pagination support.
- **`getById(id)` & `syncTicketDetails(id)`** — [Lines 638, 826](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L638):
  - **What to do:** Single atomic query with PostgREST join (`select('*, complaint_comments(*), complaint_history(*)')`), preserving forgiving ID matching (stripping `#` and case-insensitive matching).

### 2.2 Ticket Creation & Lifecycle Mutations
- **`create(data)`** — [Line 852](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L852):
  - **What to do:** Compute SLA deadlines, auto-route department, generate collision-free ID (`CMS-2026-XXXX`), and execute direct `supabase.from('complaints').insert(payload)`. Return result with optimistic caching.
- **`updateStatus(id, newStatus, updatedBy, note)`** — [Line 929](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L929):
  - **What to do:** Enforce RBAC (students cannot change status), execute atomic `update` on `public.complaints`. Audit history is recorded automatically via PostgreSQL trigger.
- **`addComment(id, sender, text, isInternal)`** — [Line 988](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L988):
  - **What to do:** Enforce that students cannot post `isInternal: true`. Execute atomic `insert` into `public.complaint_comments`.
- **`reassign(id, targetAssignee, reassignedBy, reason)`** — [Line 1043](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1043):
  - **What to do:** Atomically update `assigned_to`, `assigned_to_name`, `assigned_to_department` in `complaints` and append an internal transfer note in `complaint_comments`.
- **`proposeResolution(id, staffUser, resolutionNotes)`** — [Line 1129](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1129):
  - **What to do:** Transition status to `pending_confirmation`, store `resolution_details`, and post public explanation comment.
- **`confirmResolution(id, user, feedbackNote)`** — [Line 1202](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1202):
  - **What to do:** Complainant sign-off; transition status to `resolved`, set `resolved_at = now()`, and record user feedback.
- **`rejectResolution(id, user, rejectionReason)`** — [Line 1269](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L1269):
  - **What to do:** Complainant rejection; reopens ticket to `in_progress`, appends rejection comment.

### 2.3 Realtime Synchronization & Event Bus
- **`ensureRealtimeSubscription()` & `subscribeToLiveUpdates()`** — [Lines 307, 442](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L307):
  - **What to do:** Replace manual array mutation with **Targeted Cache Invalidation**. When Supabase WebSocket emits `postgres_changes`, invalidate the cached query keys so React automatically pulls fresh data without desync.

### 2.4 Media & Storage Pipeline
- **`uploadComplaintAttachment(file, ticketId)`** — [`supabaseClient.js:137`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L137):
  - **What to do:** Keep Supabase Storage bucket `complaint-attachments` upload at `complaints/${ticketId}/${timestamp}_${cleanName}` with the resilient Base64 Data URL fallback.

---

## 3. Tier 1 Execution Roadmap (Step-by-Step)

```
Step 1: Create Stateless API Client (src/services/complaintApi.js)
        └── Pure async PostgREST queries with relational joins (zero localStorage).

Step 2: Create React Query Server-State Hooks (src/hooks/useComplaints.js)
        └── Declarative caching, optimistic updates, and background refetching.

Step 3: Setup Scoped Realtime Invalidation Channel
        └── WebSocket events trigger queryClient.invalidateQueries() cleanly.

Step 4: Refactor complaintService.js In-Place
        └── Wrap new API/hooks with backward-compatible method signatures so NO page breaks!
```

---

## 4. Inviolable Rule: Zero Regressions Guarantee
All method signatures (`getAll`, `getById`, `create`, `updateStatus`, `addComment`, `reassign`, `proposeResolution`, `confirmResolution`, `rejectResolution`) MUST remain drop-in compatible with all existing pages ([`MyComplaintsList.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx), [`StaffQueue.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx), [`TicketTracker.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx), [`AdminAnalytics.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx)).
