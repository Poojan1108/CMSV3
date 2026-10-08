# Module Specification: Complainant Portal

> **Module ID:** `03B_COMPLAINANT_PORTAL`  
> **Status:** Active / Ground Truth  
> **Target Files:**
> - [`src/pages/MyComplaintsList.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx)
> - [`src/pages/NewComplaintForm.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx)
> - [`src/pages/TicketTracker.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx)
> - [`src/data/taxonomy.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/data/taxonomy.js)
> - [`src/services/complaintService.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js)

---

## 1. Module Overview & Responsibilities
Provides the end-user self-service experience for lodging issues, monitoring resolution progress, participating in discussions, and signing off on technician fixes.

---

## 2. Key Functions & Exact Citations

### 2.1 Intake Pipeline ([`NewComplaintForm.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx))
- **`NewComplaintForm()`** — [Line 42](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L42): Top-level intake form component.
- **`clearDraft()`** — [Line 107](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L107): Purges draft from `localStorage`.
- **`handleDiscardDraft()`** — [Line 113](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L113): Discards draft and resets form state.
- **`handleCategoryChange(newCategory)`** — [Line 130](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L130): Re-seeds subcategories from taxonomy.
- **`processFiles(fileList)`** — [Line 190](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L190): Validates size (<5MB), generates previews, and enqueues attachments.
- **`handleFileUpload(e)`** — [Line 219](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L219): File input change event listener.
- **`removeAttachment(id)`** — [Line 224](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L224): Removes item from upload queue.
- **`handleSubmit(e)`** — [Line 228](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/NewComplaintForm.jsx#L228): Uploads files to storage bucket `complaint-attachments`, computes priority SLA, auto-routes department, and inserts ticket.

### 2.2 Ticket Dashboard ([`MyComplaintsList.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx))
- **`MyComplaintsList()`** — [Line 39](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx#L39): List view for student/complainant tickets.
- **`updateComplaintsFromCache()`** — [Line 56](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx#L56): Synchronous read from service memory cache.
- **`loadUserComplaints()`** — [Line 76](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx#L76): Triggers background Supabase sync.
- **`handleManualRefresh()`** — [Line 85](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx#L85): Pull-to-refresh spinner trigger.
- **`resetFilters()`** — [Line 170](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx#L170): Resets filter controls.

### 2.3 Lifecycle Tracker ([`TicketTracker.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx))
- **`TicketTracker()`** — [Line 60](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx#L60): Canonical 6-stage lifecycle timeline tracker.
- **`handleLookupSubmit(e)`** — [Line 151](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx#L151): Looks up ticket by ID (`CMS-2026-XXXX`).
- **`handleCopyId()`** — [Line 178](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx#L178): Copies ticket reference to clipboard.
- **`handleConfirmResolution()`** — [Line 189](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx#L189): Signs off on resolution; transitions status to `resolved`.
- **`handleRejectResolution()`** — [Line 209](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx#L209): Rejects technician fix; reopens ticket to `in_progress`.
- **`handleCommentSubmit(e)`** — [Line 229](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/TicketTracker.jsx#L229): Appends public comment to `public.complaint_comments`.

---

## 3. Data Integrity & Validation Contracts
1. **Attachment Uploads:** Max 5MB per image. Previews use `URL.createObjectURL` or Base64. Uploads persist to bucket `complaint-attachments`.
2. **Draft Persistence:** Unsubmitted forms serialize into `localStorage['cms_draft_complaint']`. Purged immediately upon successful submission.
3. **Ticket ID Format:** Must match regex `^CMS-2026-[A-Z0-9]{4}$`.

---

## 4. Optimization & Refactoring Directives
- **Eliminate Double-Fetch in `MyComplaintsList`:** Replace [`updateComplaintsFromCache:56`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx#L56) and [`loadUserComplaints:76`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/MyComplaintsList.jsx#L76) with a single declarative query hook.
- **Component Decomposition in `NewComplaintForm`:** Extract file dropzone into `AttachmentDropzone.jsx`.
- **Remove Orphaned Data in `taxonomy.js`:** Delete dead exports `KB_ARTICLES` ([Line 140](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/data/taxonomy.js#L140)) and `CONTACT_METHODS` ([Line 232](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/data/taxonomy.js#L232)).
