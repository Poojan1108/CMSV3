# CMS_V2 Core Architecture & Design Patterns

> **Document Version:** 1.0  
> **Status:** Active / Foundation Blueprint  
> **Target System:** Complaint Management System V2 (`CMS_V2`)  
> **Scope:** Core design patterns, state management architecture, realtime invalidation, and component decoupling.

---

## 1. Architectural Evolution: From In-Memory Cache to Server-State Architecture

### 1.1 The Legacy Paradigm (Anti-Pattern)
- **Singleton Memory Array:** In [`complaintService.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js), tickets are held in a global JavaScript array.
- **Client-Side Filtering:** Queries like [`getAll()`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L761) iterate over the local array in the browser.
- **Manual Event Bus:** UI components subscribe via [`subscribeToLiveUpdates()`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js#L442) using a 30ms debounce timer.
- **Bottlenecks:** Risk of memory leaks, race conditions, double-fetching flicker on mount, and failure to scale when ticket counts exceed browser memory capacity.

### 1.2 The Target Foundation (Modern Standard)
Following modern open-source issue trackers (e.g., [makeplane/plane](https://github.com/makeplane/plane), [mvpstack/helpin](https://github.com/mvpstack/helpin)):

```
┌────────────────────────────────────────────────────────┐
│                      React 18 UI                       │
│       (Pages, Modals, Timeline, Badges, Dropzone)      │
└───────────────▲────────────────────────▲───────────────┘
                │                        │
       declarative query hooks       optimistic mutations
                │                        │
┌───────────────▼────────────────────────▼───────────────┐
│               Declarative Server-State Layer           │
│       (Automatic caching, TTL, deduplication, retry)   │
└───────────────▲────────────────────────▲───────────────┘
                │                        │
       PostgREST HTTPS API     Realtime Invalidation Bus
                │              (supabase.channel('...'))
┌───────────────▼────────────────────────▼───────────────┐
│              Supabase PostgreSQL Multi-Tenant DB       │
│           (RLS Policies, Tables, Storage Bucket)       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Realtime WebSocket Synchronization Pattern

Rather than imperatively mutating local arrays when a WebSocket event arrives, the application uses **Targeted Cache Invalidation**:

```javascript
// Canonical pattern for Supabase Realtime synchronization:
export function useRealtimeComplaints(organizationKey) {
  useEffect(() => {
    if (!organizationKey) return;

    const channel = supabase
      .channel(`realtime-complaints-${organizationKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints',
          filter: `organization_key=eq.${organizationKey}`
        },
        (payload) => {
          // Invalidate cached query keys to trigger declarative background refetch
          // Example: queryClient.invalidateQueries({ queryKey: ['complaints', organizationKey] })
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationKey]);
}
```

**Benefits:**
1. **Always Source-of-Truth:** The database remains the single authority; client state never drifts or accumulates ghost tickets.
2. **Zero Memory Leaks:** Channels cleanly disconnect when the component unmounts or when the user switches organizations.
3. **Multi-Tenant Isolation:** Realtime filters ensure clients receive events strictly for their tenant.

---

## 3. Component Architecture & Decoupling Strategy

### 3.1 Headless Hooks & Container / Presentation Separation
Monolithic page components are decomposed into focused layers:
1. **Presentation Layer (`src/components/ui/` & `src/components/tickets/`):** Pure UI components receiving props (e.g. `TicketTimeline`, `TicketCommentsThread`, `StatusBadge`, `AttachmentDropzone`).
2. **Container / Headless Hooks Layer (`src/hooks/`):** Encapsulates data fetching, draft management, and validation logic (e.g. `useComplaintForm`, `useTicketDetails`, `useStaffQueue`).
3. **Route Pages (`src/pages/`):** High-level view orchestrators connecting layout shells with domain containers.

### 3.2 Modal Extraction Mandate
Inline modals that exceed 100 lines (specifically [`TicketDetailModal:825`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L825) inside `StaffQueue.jsx`) are extracted into dedicated files in `src/components/tickets/`. Modal state (such as internal note typing) is scoped to the modal so typing does not trigger parent table re-renders.

---

## 4. Multi-Tenant Taxonomy Resolution Flow

The application dynamically adapts terminology based on the active organization archetype:

```
                  ┌───────────────────────────────┐
                  │       Active Organization     │
                  │   (key, archetype, config)    │
                  └───────────────┬───────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   User Persona   │    │  Staff Persona   │    │ Location Label   │
│  "Student" (Edu) │    │  "Warden / Tech" │    │  "Hostel Room"   │
│ "Resident" (Soc) │    │  "Facility Team" │    │   "Flat No"      │
│ "Employee" (Corp)│    │  "IT Support"    │    │   "Desk ID"      │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

1. **Resolution Hierarchy:** Organization dynamic config (`public.organizations.config`) takes precedence over archetype defaults in [`constants.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/constants.js).
2. **Category & Department Mapping:** Custom categories configured by admins in [`AdminDepartments.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx) cleanly route tickets to registered departments in `public.departments`.
