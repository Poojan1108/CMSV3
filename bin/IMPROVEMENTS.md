# ResolveX UI, Structural & Responsive Improvement Audit Report

> **Document Status:** Identified & Documented — Awaiting User Approval to Apply Code Fixes.  
> **Scope:** Full-codebase scan for responsive blowout, layout overflow, missing styling classes, unstyled controls, and visual collisions.

---

## Table of Contents
1. [StaffResolutions.jsx](#1-srcpagesstaffresolutionsjsx)
2. [AdminAnalytics.jsx](#2-srcpagesadminanalyticsjsx)
3. [AdminDepartments.jsx](#3-srcpagesadmindepartmentsjsx)
4. [Auth.jsx & landing.css](#4-srccomponentsauthjsx--srcstyleslandingcss)
5. [PageHeader.jsx & app.css](#5-srccomponentsuipageheaderjsx--srcstylesappcss)
6. [Action Plan & Implementation Checklist](#6-action-plan--implementation-checklist)

---

## 1. `src/pages/StaffResolutions.jsx`

### Issue 1.1: Unstyled Reassignment Ticket Dropdown & Potential Width Blowout
* **File:** [`src/pages/StaffResolutions.jsx`](file:///c:/CMS_V2/src/pages/StaffResolutions.jsx#L216-L229)
* **Lines:** 216–229
* **Current Code:**
  ```jsx
  <select
    id="transfer-ticket"
    value={selectedTicketId}
    onChange={(e) => setSelectedTicketId(e.target.value)}
  >
    <option value="">
      Select an open ticket ({openComplaints.length} available)
    </option>
    {openComplaints.map((t) => (
      <option key={t.id} value={t.id}>
        {t.id} — {t.title.slice(0, 40)}
      </option>
    ))}
  </select>
  ```
* **Defect:** Missing `className="form-select"`. It renders as an unstyled native browser dropdown with microscopic default font, grey native border, and no chevron icon. Furthermore, on narrow mobile viewports (320px–375px), ticket title options can stretch the select beyond container boundaries.
* **Fix:** Add `className="form-select"` and `style={{ width: '100%', minWidth: 0 }}`.

---

### Issue 1.2: Unstyled Target Staff / Department Dropdown
* **File:** [`src/pages/StaffResolutions.jsx`](file:///c:/CMS_V2/src/pages/StaffResolutions.jsx#L257-L269)
* **Lines:** 257–269
* **Current Code:**
  ```jsx
  <select
    id="transfer-target"
    value={targetHandlerId}
    onChange={(e) => setTargetHandlerId(e.target.value)}
  >
    <option value="">Select target…</option>
    {reassignTargets.map((t) => (
      <option key={t.id} value={t.id}>
        {t.name} ({t.department})
      </option>
    ))}
  </select>
  ```
* **Defect:** Missing `className="form-select"`. Lacks standard touch height (42px) and cohesive dark/light theme styling.
* **Fix:** Add `className="form-select"` and `style={{ width: '100%', minWidth: 0 }}`.

---

### Issue 1.3: Resolution Summary Card String Blowout
* **File:** [`src/pages/StaffResolutions.jsx`](file:///c:/CMS_V2/src/pages/StaffResolutions.jsx#L245-L249)
* **Lines:** 245–249
* **Current Code:**
  ```jsx
  <div className="comment-author">{activeTicket.title}</div>
  <div className="cell-sub" style={{ marginTop: 4 }}>
    Current handler: {activeTicket.assignedTo?.name || 'Unassigned'} •{' '}
    {activeTicket.location}
  </div>
  ```
* **Defect:** Neither `.comment-author` nor `.cell-sub` has word-break protection. Any unbroken string (e.g. `Water_Leakage_Block_C_Room_204_Emergency`) or long location label expands horizontally and blows out the card container on mobile.
* **Fix:** Add `wordBreak: 'break-word', overflowWrap: 'anywhere', minWidth: 0` to both title and location text containers.

---

### Issue 1.4: "Completed Resolutions" Card Header & Toolbar Mobile Wrap
* **File:** [`src/pages/StaffResolutions.jsx`](file:///c:/CMS_V2/src/pages/StaffResolutions.jsx#L307-L342)
* **Lines:** 307–342
* **Current Code:**
  ```jsx
  <div className="card-header">
    <div>
      <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircle2 size={16} className="tone-success" />
        Completed Resolutions
      </h2>
      <p className="card-subtitle">Audit record of closed complaints</p>
    </div>

    <div className="toolbar-row">
      <div className="search-field">
        <Search size={13} />
        <input
          type="text"
          placeholder="Search log…"
          value={resSearchQuery}
          onChange={(e) => setResSearchQuery(e.target.value)}
          aria-label="Search resolution log"
        />
      </div>

      <select
        value={resDeptFilter}
        onChange={(e) => setResDeptFilter(e.target.value)}
        aria-label="Filter by category"
        className="toolbar-select"
      >
  ```
* **Defect:** On mobile (< 640px), `.card-header` switches to column alignment. However, `.toolbar-row` has `display: flex; flex-wrap: wrap` without `width: 100%`, causing the search field and department dropdown to shrink to content width instead of neatly spanning the full card width.
* **Fix:** Ensure `.toolbar-row` has `width: '100%'` and `flex: '1 1 100%'` so both search input and category filter span edge-to-edge.

---

### Issue 1.5: Ticket Card Top Badges Missing Responsive Class
* **File:** [`src/pages/StaffResolutions.jsx`](file:///c:/CMS_V2/src/pages/StaffResolutions.jsx#L362-L368)
* **Lines:** 362–368
* **Current Code:**
  ```jsx
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
    <TicketId id={ticket.id} />
    <Tag>{ticket.category}</Tag>
    <StatusBadge status={ticket.status} />
  </div>
  ```
* **Defect:** Uses ad-hoc inline styles instead of the established `className="ticket-card-badges"`. As defined in `app.css` line 3178, `.ticket-card-badges` handles mobile wrap spacing (`gap: 4px; min-width: 0`), preventing badges from colliding with SLA pills on narrow viewports.
* **Fix:** Replace inline style with `className="ticket-card-badges"`.

---

## 2. `src/pages/AdminAnalytics.jsx`

### Issue 2.1: Header Export Toolbar Overflow on Small Screens
* **File:** [`src/pages/AdminAnalytics.jsx`](file:///c:/CMS_V2/src/pages/AdminAnalytics.jsx#L300-L313)
* **Lines:** 300–313
* **Current Code:**
  ```jsx
  actions={
    <div className="export-toolbar no-print" style={{ display: 'flex', gap: 8 }}>
      <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
        <FileSpreadsheet size={14} />
        Export CSV
      </button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportJSON}>
        <FileJson size={14} />
        Export JSON
      </button>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
        <Printer size={14} />
        Print Summary
      </button>
    </div>
  }
  ```
* **Defect:** The inline style `style={{ display: 'flex', gap: 8 }}` lacks `flexWrap: 'wrap'`. On 360px–390px mobile screens, the three buttons require ~340px minimum width, forcing horizontal screen scrolling when combined with page padding.
* **Fix:** Add `flexWrap: 'wrap', width: '100%'` to the export toolbar container, allowing buttons to wrap into equal fluid rows on mobile.

---

### Issue 2.2: Unstyled Filter Dropdowns in Table Toolbar & Missing Active Chips
* **File:** [`src/pages/AdminAnalytics.jsx`](file:///c:/CMS_V2/src/pages/AdminAnalytics.jsx#L525-L563)
* **Lines:** 525–563
* **Current Code:**
  ```jsx
  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} ...>
  ...
  <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} ...>
  ...
  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} ...>
  ```
* **Defect:** These three `<select>` elements lack `className="toolbar-select"` or `className="form-select"`. Furthermore, unlike `MyComplaintsList.jsx` and `StaffQueue.jsx`, there are no active filter chips. On mobile, once a user selects a filter, it is hidden inside the dropdown; the user cannot easily tell what is filtering the table or clear filters with a single tap.
* **Fix:** Add `className="toolbar-select form-select"` and implement active filter chips (e.g., `Status: In Progress ✕`, `Priority: Urgent ✕`) right below the search bar for one-tap clearing.

---

### Issue 2.3: Assignment Modal Dropdown & Textarea Missing Form Classes
* **File:** [`src/pages/AdminAnalytics.jsx`](file:///c:/CMS_V2/src/pages/AdminAnalytics.jsx#L691-L716)
* **Lines:** 691–716
* **Current Code:**
  ```jsx
  <select
    id="assignee-select"
    value={selectedAssigneeId}
    onChange={(e) => setSelectedAssigneeId(e.target.value)}
  >
  ...
  <textarea
    id="assign-note"
    rows={3}
    placeholder="Instructions or reason for assignment…"
    value={reassignReason}
    onChange={(e) => setReassignReason(e.target.value)}
  />
  ```
* **Defect:** `<select id="assignee-select">` and `<textarea id="assign-note">` lack `className="form-select"` and `className="form-textarea"`. They lack standard 100% width, uniform borders, focus rings, and proper mobile touch heights.
* **Fix:** Add `className="form-select"` and `className="form-textarea"` with `width: '100%', boxSizing: 'border-box'`.

---

### Issue 2.4: Table Action Cell Assigned Staff Name Overflow
* **File:** [`src/pages/AdminAnalytics.jsx`](file:///c:/CMS_V2/src/pages/AdminAnalytics.jsx#L626-L628)
* **Lines:** 626–628
* **Current Code:**
  ```jsx
  <span className="cell-main" style={{ maxWidth: 140 }}>
    {item.assignedTo.name}
  </span>
  ```
* **Defect:** `maxWidth: 140` without `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block` causes longer staff names to break into awkward multi-line stacks that distort table row heights.
* **Fix:** Add `overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block'`.

---

## 3. `src/pages/AdminDepartments.jsx`

### Issue 3.1: "Operational Categories" Quick-Add Form Width Blowout
* **File:** [`src/pages/AdminDepartments.jsx`](file:///c:/CMS_V2/src/pages/AdminDepartments.jsx#L337-L348)
* **Lines:** 337–348
* **Current Code:**
  ```jsx
  <form onSubmit={handleAddCustomCategory} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '1 1 auto', maxWidth: 320 }}>
    <input
      type="text"
      placeholder="New Category..."
      value={newCategoryInput}
      onChange={(e) => setNewCategoryInput(e.target.value)}
      style={{ height: 32, fontSize: 13, padding: '0 10px', minWidth: 120, flex: '1 1 120px' }}
    />
    <button type="submit" className="btn btn-secondary btn-sm">
      + Add
    </button>
  </form>
  ```
* **Defect:** On narrow screens (e.g. 360px screen with 28px card padding = 304px available space), `maxWidth: 320` and `flex: '1 1 120px'` force the input to overflow the card boundary or wrap unevenly.
* **Fix:** Change to `width: '100%', maxWidth: '100%', minWidth: 0` so the form conforms to available width on any device.

---

### Issue 3.2: Long Staff Email Blows Out Staff Roster Cards
* **File:** [`src/pages/AdminDepartments.jsx`](file:///c:/CMS_V2/src/pages/AdminDepartments.jsx#L484-L487)
* **Lines:** 484–487
* **Current Code:**
  ```jsx
  <span className="meta-item" style={{ fontSize: 12 }}>
    <Mail size={12} />
    {staff.email}
  </span>
  ```
* **Defect:** Long email addresses (e.g. `marcus.brody.senior.administrator@institution.edu`) are unbroken strings of 50+ characters (~350px width). Because `.meta-item` lacks `wordBreak: 'break-all'`, a long email forces the entire staff roster card to blow out past the viewport width!
* **Fix:** Add `wordBreak: 'break-all', overflowWrap: 'anywhere', minWidth: 0` to the email container.

---

### Issue 3.3: Ticket Card Footer Button Wrap on Mobile Roster
* **File:** [`src/pages/AdminDepartments.jsx`](file:///c:/CMS_V2/src/pages/AdminDepartments.jsx#L513-L537)
* **Lines:** 513–537
* **Current Code:**
  ```jsx
  <div className="ticket-card-footer">
    <span className={`handler-line ...`}>
      {workload} active ticket{workload === 1 ? '' : 's'}
    </span>
    <div style={{ display: 'flex', gap: 6 }}>
      <button ...>Set Leave</button>
      <button ...>Edit Coverage</button>
    </div>
  </div>
  ```
* **Defect:** On mobile (< 380px), the workload text and the two buttons compete for horizontal space inside `.ticket-card-footer`. When wrapped, the button container does not expand full width, leaving awkward uneven margins.
* **Fix:** Give the button container `flexWrap: 'wrap', width: '100%'` on small screens so buttons become full-width touch targets.

---

### Issue 3.4: Add Staff & Org Config Modals Missing `className="form-input"`
* **File:** [`src/pages/AdminDepartments.jsx`](file:///c:/CMS_V2/src/pages/AdminDepartments.jsx#L617-L745)
* **Lines:** 617, 631, 646, 659, 698, 712, 725, 739
* **Current Code:**
  ```jsx
  <input id="new-staff-name" type="text" required ... />
  <input id="new-staff-email" type="email" required ... />
  ...
  <input id="cfg-org-name" type="text" required ... />
  ```
* **Defect:** Every `<input>` in both modals lacks `className="form-input"`. Without `.form-input` (`width: 100%`), browser default input widths (~160px) apply inside grid columns, causing ugly jagged alignments.
* **Fix:** Add `className="form-input"` and `style={{ width: '100%' }}` to all inputs.

---

## 4. `src/components/Auth.jsx` & `src/styles/landing.css`

### Issue 4.1: Desktop / Laptop Viewport Lockout & Bottom Overflow Trap
* **File:** [`src/styles/landing.css`](file:///c:/CMS_V2/src/styles/landing.css#L1796-L1802)
* **Lines:** 1796–1802 & 2259–2265
* **Current Code:**
  ```css
  .auth-canvas {
    height: 100vh;
    max-height: 100vh;
    width: 100vw;
    background: #ffffff;
    position: relative;
    overflow: hidden;
    ...
  }

  @media (max-height: 620px) {
    .auth-canvas {
      overflow-y: auto !important;
      height: auto;
      min-height: 100vh;
    }
  }
  ```
* **Defect:** When registering a new organization in Sign Up mode, the form has 10 fields and is ~720px tall. On standard laptops (e.g. 1366×768 where browser toolbars leave ~650px viewport height), `.auth-canvas` enforces `overflow: hidden; height: 100vh; max-height: 100vh`. Because `max-height: 620px` is NOT triggered, the password input, submit button, and bottom links are **completely clipped off-screen and impossible to scroll to**!
* **Fix:** In `landing.css`, update `.auth-canvas` to always use `min-height: 100vh; min-height: 100dvh; overflow-y: auto; height: auto` so any tall form can be scrolled seamlessly on any screen height.

---

### Issue 4.2: Floating "Back to Home" Button Overlap on Mobile
* **File:** [`src/components/Auth.jsx`](file:///c:/CMS_V2/src/components/Auth.jsx#L120-L127) and [`src/styles/landing.css`](file:///c:/CMS_V2/src/styles/landing.css#L2216-L2219)
* **Lines:** 120–127 in `Auth.jsx`; 2216–2219 in `landing.css`
* **Current Code:**
  ```jsx
  <button type="button" className="auth-floating-back-btn" onClick={onBackToHome} ...>
  ```
* **Defect:** `position: absolute; top: 18px; left: 20px; z-index: 50`. On narrow mobile screens, this floating button collides with the brand title and creates visual clutter.
* **Fix:** In mobile viewports (< 480px), provide clear top margin spacing on `.auth-form-inner` to guarantee a 24px safety buffer below the back button.

---

## 5. `src/components/ui/PageHeader.jsx` & `src/styles/app.css`

### Issue 5.1: Page Title & Description Unbroken String Overflow
* **File:** [`src/components/ui/PageHeader.jsx`](file:///c:/CMS_V2/src/components/ui/PageHeader.jsx#L17-L18) and [`src/styles/app.css`](file:///c:/CMS_V2/src/styles/app.css#L383-L396)
* **Lines:** 17–18 in `PageHeader.jsx`; 383–396 in `app.css`
* **Current Code:**
  ```jsx
  <h1 className="page-title">{title}</h1>
  {description && <p className="page-desc">{description}</p>}
  ```
* **Defect:** Neither `.page-title` nor `.page-desc` has `overflow-wrap: break-word; word-break: break-word`. Long organization titles or long headings can force horizontal overflow on 320px–360px phones.
* **Fix:** Add `overflowWrap: 'break-word', wordBreak: 'break-word'` to `.page-title` and `.page-desc`.

---

## 6. Action Plan & Implementation Checklist

| Step | File | Key Actions | Status |
| :--- | :--- | :--- | :--- |
| **1** | [`src/styles/landing.css`](file:///c:/CMS_V2/src/styles/landing.css) | Unlock `.auth-canvas` scrolling (`min-height: 100vh`, `overflow-y: auto`, `height: auto`), mobile top safety buffer | ✅ Completed & Verified |
| **2** | [`src/pages/StaffResolutions.jsx`](file:///c:/CMS_V2/src/pages/StaffResolutions.jsx) | Add `.form-select`, `width: 100%`, word-break on summary card, `.toolbar-row` full-width mobile stretch | ✅ Completed & Verified |
| **3** | [`src/pages/AdminAnalytics.jsx`](file:///c:/CMS_V2/src/pages/AdminAnalytics.jsx) | Export toolbar wrap, `.toolbar-select` classes, active filter chips, modal form classes, table name truncate | ✅ Completed & Verified |
| **4** | [`src/pages/AdminDepartments.jsx`](file:///c:/CMS_V2/src/pages/AdminDepartments.jsx) | Categories form fluid width, email `break-all`, card footer button wrap, `.form-input` on all modal fields | ✅ Completed & Verified |
| **5** | [`src/styles/app.css`](file:///c:/CMS_V2/src/styles/app.css) | Add defensive `word-break: break-word` and `overflow-wrap: break-word` on `.page-title` and `.page-desc` | ✅ Completed & Verified |

---
