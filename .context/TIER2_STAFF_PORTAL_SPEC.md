# Tier 2 Locked Architectural Specification: Staff & Resolver Portal

> **Document Version:** 2.0  
> **Status:** Active Sprint Locked Specification  
> **Target Scope:** Strictly Tier 2 (Staff / Resolver Portal, Queue Triage & Modal Component Modularization).  
> **Rule:** Specification only. No application code written yet.

---

## 1. Complete Anatomy of Current Tier 2 Implementation

Tier 2 consists of two primary operational pages and an embedded inspector modal:
- [`src/pages/StaffQueue.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx) (Lines 1–1321)
- [`src/pages/StaffResolutions.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffResolutions.jsx) (Lines 1–224)
- Embedded: `TicketDetailModal` inside [`StaffQueue.jsx:842-1321`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L842)

---

### 1.1 UI Components & Visual Elements Breakdown

#### In [`StaffQueue.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx):
1. **Page Header ([Lines 300–320](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L300)):**
   - Title: "My Assigned Complaints" (when scoped) or "Department Queue".
   - Subtitle: Dynamic tenant name (`currentOrg.name`) + "Resolver".
   - Actions: Staff identity badge (`role-pill role-pill-staff`) showing technician name, plus a manual "Refresh" button.
2. **StatGrid KPI Summary Cards ([Lines 323–364](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L323)):**
   - **Assigned to Me** (Accent tone, clickable to toggle scope).
   - **Needs Triage / Pending** (Warning tone, clickable to filter `pending`).
   - **In Progress** (Info tone, clickable to filter `in_progress`).
   - **Resolved Today** (Success tone, clickable to filter `resolved`).
3. **SLA Breach Warning Banner ([Lines 366–375](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L366)):**
   - Renders a red callout banner when `metrics.slaBreached > 0` with ticket count.
4. **Triage Command Strip ([Lines 378–479](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L378)):**
   - Horizontal tab strip: `All Queue Tickets`, `Assigned to Me`, `Needs Triage`, `In Progress`, and `SLA Critical` (danger styled).
5. **Toolbar & Filter Controls ([Lines 482–566](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L482)):**
   - Real-time search field with clear (`X`) button.
   - Department / Category select dropdown.
   - Priority select dropdown (Urgent 12h, High 24h, Medium 48h, Low 72h).
   - Sort dropdown (`Newest`, `Oldest`, `Priority`).
   - Quick Reset button.
6. **Active Filter Chips Row ([Lines 569–662](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L569)):**
   - Pill chips for each active filter with click-to-remove `X` buttons and "Clear all" link.
7. **Complaints Grid & Ticket Cards ([Lines 678–820](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L678)):**
   - Card Top: TicketId (`CMS-2026-XXXX`), Category tag, "You" tag (if assigned to current user), SLA Badge with countdown, Priority Badge, Status Badge.
   - Body: Title, 130-char description snippet, Reporter name (or Anonymous chip), Location, Relative timestamp.
   - Quick Status Action Row: Inline select dropdown to change status with zero clicks.
   - Card Footer: Technician assignment status indicator and "Details" button to open modal.

---

### 1.2 The Embedded `TicketDetailModal` Breakdown ([Lines 842–1321](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L842))

1. **Modal Shell & Header:** Modal dialog with ticket title, ticket ID subtitle, and backdrop close handler.
2. **Badges Bar ([Lines 898–905](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L898)):**
   - `TicketId`, `PriorityBadge`, `StatusBadge`, and `SlaBadge`.
3. **Reporter & Location Meta-Grid ([Lines 907–934](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L907)):**
   - Reporter Name, Roll No / Unit ID, Location label, Assigned Handler, Department.
4. **Resolution Summary & Description ([Lines 936–940](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L936)):**
   - Full unbroken description text.
5. **Photo Evidence Grid & Lightbox ([Lines 942–1026, 1253–1317](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L942)):**
   - Thumbnails with hover zoom, file size indicators, and fullscreen image inspection modal.
6. **Audit History Timeline ([Lines 1029–1050](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L1029)):**
   - Chronological list of status changes with actor name and timestamps.
7. **Activity Thread ([Lines 1052–1199](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L1052)):**
   - Segmented tab control: `All (${count})`, `Public (${count})`, `Internal (${count})`.
   - Distinct visual styling for confidential internal notes (dark slate bubble with lock icon).
8. **Internal Note Composer ([Lines 1200–1225](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L1200)):**
   - Form with input and "Log Note" button submitting private remarks (`is_internal = true`).
9. **Status / Resolution Submission Form ([Lines 1227–1251](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L1227)):**
   - Textarea for attaching explanation when marking a status, plus "Submit Resolution with Note".
10. **Footer Actions ([Lines 875–896](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L875)):**
    - "Mark In Progress" and "Mark Resolved" buttons.

---

### 1.3 State Management & Data Flow in Tier 2

```
User Action (Staff Queue)
  │
  ├── 1. Triage filter click ──────────► Local React state (scopeFilter, statusFilter, searchQuery)
  │                                      Evaluated synchronously via useMemo(filteredComplaints)
  │
  ├── 2. Quick Status Change ──────────► complaintService.updateStatus() or proposeResolution()
  │                                      Dispatches event ──► Supabase PostgREST update
  │
  ├── 3. Click "Details" ──────────────► setSelectedTicket(ticket)
  │                                      Fires complaintService.syncTicketDetails(id)
  │
  ├── 4. Keystroke in Internal Note ───► setModalInternalNote(text) [CURRENT BUG]
  │                                      *Re-renders entire parent StaffQueue on every keystroke*
  │
  └── 5. Live WebSocket Event ─────────► complaintService.subscribeToLiveUpdates()
                                         Refreshes tickets via complaintApi
```

---

## 2. In-Depth Audit of Critical Flaws in Tier 2

| # | Flaw | Citation | Impact |
| :--- | :--- | :--- | :--- |
| **1** | **Parent Re-Render Tax** | [`StaffQueue.jsx:96-97`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L96) | Typing in the modal's input field updates state in the parent `StaffQueue`, causing the entire 800-line queue table and stat cards to re-render on every single letter typed. |
| **2** | **Monolithic 1,321-Line File** | [`StaffQueue.jsx:842-1321`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L842) | Code bloat; prevents reusing the detail inspector in Admin or Tracking pages. |
| **3** | **Client-Side Resolution Scan** | [`StaffResolutions.jsx:41, 67`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffResolutions.jsx#L41) | Pulls all tickets and filters `status === RESOLVED` in JS memory rather than letting PostgreSQL filter the query. |
| **4** | **Imperative State Handlers** | [`StaffQueue.jsx:246-279`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L246) | Modal state logic is entangled across the parent page instead of encapsulated. |

---

## 3. Web & Open-Source Research (Linear / Plane / Tegon / Helpin)

Researching modern open-source issue triage systems (such as [makeplane/plane](https://github.com/makeplane/plane), [tegonhq/tegon](https://github.com/tegonhq/tegon), and [mvpstack/helpin](https://github.com/mvpstack/helpin)):

### Key Architectural Lessons from Industry Leaders:
1. **State Co-Location:** Modal input state belongs **inside** the modal. The parent component only needs to know about `selectedTicketId`.
2. **Action Callback Interface:** The parent provides stable action handlers (`onClose`, `onQuickStatus`, `onAddInternalNote`, `onStatusSubmit`), while all draft strings remain private to the modal.
3. **Database-Filtered Resolution Queries:** Historical audit views (like `StaffResolutions`) query `status=in.(resolved,rejected)` directly through PostgREST rather than fetching open tickets.

---

## 4. The Modernized Architecture Plan for Tier 2

### Component Breakdown:
```
src/
├── components/tickets/
│   └── TicketDetailModal.jsx          # NEW: Decoupled, memoized detail inspector (owns draft state)
├── pages/
│   ├── StaffQueue.jsx                 # REFACTORED: Lean (~800 lines) triage queue with zero typing lag
│   └── StaffResolutions.jsx           # REFACTORED: Direct server-filtered resolution audit queries
```

### Inviolable Guarantees:
- **Zero Visual Regression:** Exact styling, CSS classes, responsive grids, and layout tokens are preserved 100%.
- **Zero Breaking Changes:** Works seamlessly with the newly created `complaintApi.js` and `complaintService.js`.
- **Typing Performance:** Keystrokes in `TicketDetailModal` have zero impact on the parent table.
