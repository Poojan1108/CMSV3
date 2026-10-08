# Module Specification: Staff & Resolver Portal

> **Module ID:** `03C_STAFF_PORTAL`  
> **Status:** Active / Ground Truth  
> **Target Files:**
> - [`src/pages/StaffQueue.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx)
> - [`src/pages/StaffResolutions.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffResolutions.jsx)
> - [`src/services/complaintService.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js)
> - [`src/components/ui/Badges.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/components/ui/Badges.jsx)

---

## 1. Module Overview & Responsibilities
Provides department technicians, facility managers, and hostel wardens with tools to triage open complaints, track SLA countdowns, auto-assign tickets upon investigation, record private technical notes, and propose resolution summaries for complainant confirmation.

---

## 2. Key Functions & Exact Citations

### 2.1 Operational Queue ([`StaffQueue.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx))
- **`StaffQueue()`** — [Line 71](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L71): Operational table with SLA breach badges, status tabs, and dynamic category filters.
- **`actor()`** — [Line 204](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L204): Resolves technician actor object `{ id, name, role }` for audit logging.
- **`handleStartInvestigation(ticketId)`** — [Line 208](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L208): Transitions ticket from `pending` &rarr; `in_progress` and auto-assigns current technician.
- **`handleProposeResolution(e)`** — [Line 234](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L234): Attaches fix summary and transitions ticket to `pending_confirmation`.
- **`handleOpenTicketDetails(ticket)`** — [Line 259](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L259): Loads ticket audit trail and comments, then opens detail modal.
- **`handleModalAddInternalNote(e)`** — [Line 271](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L271): Appends internal technician note (`is_internal = true`).
- **`handleResetFilters()`** — [Line 291](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L291): Resets category and urgency filters.
- **`TicketDetailModal(props)`** — [Line 825](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L825): Inline modal rendering audit timeline, comments tab, and resolution controls.

### 2.2 Resolution Archive ([`StaffResolutions.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffResolutions.jsx))
- **`StaffResolutions()`** — [Line 26](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffResolutions.jsx#L26): Read-only log of resolved/closed tickets with turnaround hours.

---

## 3. Business Rules & Lifecycle Transitions
1. **Auto-Assignment Guard:** Clicking "Start Investigation" automatically assigns the ticket (`assigned_to = profile.id`) and logs an audit record in `public.complaint_audit_log`.
2. **Mandatory Resolution Summary:** A technician cannot move a ticket to `pending_confirmation` without providing a non-empty `resolution_summary`.
3. **Internal Note Confidentiality:** Internal notes are stored with `is_internal = true` in `public.complaint_comments` and are strictly excluded from complainant views by RLS.

---

## 4. Optimization & Refactoring Directives
- **Extract Monolithic Modal:** Move [`TicketDetailModal`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/StaffQueue.jsx#L825) into its own file (`src/components/tickets/TicketDetailModal.jsx`).
- **Isolate Modal Input State:** Ensure note-taking keystrokes do not re-render the underlying queue table.
- **Remove Dormant Department Queues:** Remove unused export `DEPARTMENT_QUEUES` in [`taxonomy.js:251`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/data/taxonomy.js#L251).
