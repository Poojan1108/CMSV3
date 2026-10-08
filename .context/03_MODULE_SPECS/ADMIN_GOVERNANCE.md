# Module Specification: Admin & Governance Portal

> **Module ID:** `03D_ADMIN_GOVERNANCE`  
> **Status:** Active / Ground Truth  
> **Target Files:**
> - [`src/pages/AdminAnalytics.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx)
> - [`src/pages/AdminDepartments.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx)
> - [`src/pages/AdminMembers.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx)
> - [`src/utils/formatters.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/formatters.js)
> - [`src/services/complaintService.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/complaintService.js)
> - [`src/services/supabaseClient.js`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js)

---

## 1. Module Overview & Responsibilities
Provides executive administrators (Deans, Society Secretaries, Facility Directors) with operational dispatch oversight, SLA target controls, taxonomy customization, member role promotion, and audit exports.

---

## 2. Key Functions & Exact Citations

### 2.1 Executive Dispatch & Analytics ([`AdminAnalytics.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx))
- **`AdminAnalytics()`** — [Line 45](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx#L45): Executive dashboard displaying turnaround hours, resolution rate, and dispatch table.
- **`handleStatusOverride(ticketId, newStatus)`** — [Line 202](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx#L202): Administrative status override synced to Supabase without UI flicker.
- **`handleOpenAssignModal(ticket)`** — [Line 217](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx#L217): Opens technician reassignment dialog.
- **`handleAssignSubmit(e)`** — [Line 228](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx#L228): Reassigns ticket and logs reassignment reason in audit history.
- **`handleExportCSV()`** — [Line 254](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminAnalytics.jsx#L254): Serializes complaint records to an RFC 4180 CSV download.

### 2.2 Department & Archetype Settings ([`AdminDepartments.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx))
- **`AdminDepartments()`** — [Line 30](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L30): SLA hour targets and organization configuration.
- **`handleSaveOrgConfig(e)`** — [Line 56](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L56): Persists dynamic terminology (`userTerm`, `staffTerm`, `locationLabel`).
- **`handleAddCustomCategory(e)`** — [Line 72](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L72): Adds custom category to tenant taxonomy.
- **`handleRemoveCategory(cat)`** — [Line 86](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L86): Removes custom category.
- **`loadSavedSla()`** — [Line 119](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L119): Retrieves configured SLA targets.
- **`handleSlaChange(category, hours)`** — [Line 165](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L165): Persists SLA hours to database.
- **`handleSwitchTemplate(templateKey)`** — [Line 188](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminDepartments.jsx#L188): Switches active organization archetype blueprint.

### 2.3 Member Roster & Roles ([`AdminMembers.jsx`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx))
- **`AdminMembers()`** — [Line 29](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L29): Member directory, role elevation, and department assignment.
- **`handleRefresh()`** — [Line 107](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L107): Refreshes profile roster from `public.profiles`.
- **`handleOpenEditModal(member)`** — [Line 115](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L115): Opens role mutation dialog.
- **`handleToggleCategory(category)`** — [Line 129](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L129): Assigns/unassigns specialized category handling.
- **`handleDepartmentChange(e)`** — [Line 135](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L135): Selects technician department.
- **`handleSaveMember()`** — [Line 144](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/pages/AdminMembers.jsx#L144): Persists role and department updates to `public.profiles`.

---

## 3. Business Rules & Governance Invariants
1. **Role Elevation Guard:** Only users with `role = 'admin'` can execute [`updateMemberRole:388`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/services/supabaseClient.js#L388).
2. **Reassignment Audit Mandate:** Every ticket reassignment MUST create an audit row specifying previous assignee, new assignee, and the justification note.
3. **CSV Export Standard:** CSV output generated by [`generateComplaintsCSV:162`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/formatters.js#L162) must strictly adhere to RFC 4180 escaping.

---

## 4. Optimization & Refactoring Directives
- **Database Aggregation for KPIs:** Transition client-side average turnaround calculations to lightweight database RPC or SQL view queries.
- **Delete Dead Formatter Functions:** Remove unreferenced color mappers in [`formatters.js:70–90`](file:///c:/Users/patel/OneDrive/Desktop/CMS_V2/src/utils/formatters.js#L70-L90) (`getStatusBadgeColor`, `getPriorityBadgeColor`).
