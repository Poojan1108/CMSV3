# ResolveX CMS_V2 - Full UI/UX Component & Screen Context Blueprint

> **Document Purpose**: This blueprint specifies **every single screen, component, form field, action trigger, modal, table, and data element** in the **ResolveX Complaint Management System (v2)**. Colors and visual CSS styling are intentionally excluded so you can design the UI/UX layout independently.

---

## 1. Information Architecture & Navigation Map

```
- Public Landing Page (/ or /landing) [Keep Separate]
- Authentication Screen (/ or launched via modal)
- Authenticated Application Shell (AppLayout)
  ├── Student / Resident Portal
  │   ├── My Complaints Dashboard (/dashboard or /complaints)
  │   ├── Lodge New Complaint Form (/complaints/new)
  │   └── Ticket Tracker & Details (/track)
  ├── Staff / Resolver Workspace
  │   ├── Department Queue (/staff/queue)
  │   ├── Assigned Complaints (/staff/assigned)
  │   └── Resolution Log (/staff/resolutions)
  └── Admin Console
      ├── Global Dashboard & Analytics (/admin/dashboard or /admin/analytics)
      └── Department Management (/admin/departments)
```

---

## 2. Application Shell Components

### A. Top Header Navbar (`Navbar.jsx`)
- **Mobile Menu Toggle**: Button with `Menu` / `X` icon (visible only on mobile viewports).
- **Brand Logo & Org Header**:
  - Logo Icon (`ShieldCheck` graphic).
  - Brand Title (`ResolveX` or active Organization Name like `Springfield University`).
  - Version Badge (`CMS v2` or active Org Type like `COLLEGE` / `SOCIETY` / `CORPORATE`).
- **Organization Template Switcher**:
  - Trigger Button: Shows active template mode (e.g. `Org: COLLEGE`).
  - Dropdown Menu Options:
    1. `Springfield University` (College Template — Student / Staff / Admin terms)
    2. `Green Valley Society` (Society Template — Resident / Staff / Admin terms)
    3. `Apex Tech Solutions` (Corporate Template — Employee / Staff / Admin terms)
    4. `Custom Organization` (Custom Template — User / Staff / Admin terms)
- **Role Persona Switcher Dropdown**:
  - Trigger Button: Shows current persona (e.g. `Role: Student`).
  - Dropdown Menu Options:
    1. `Student Persona` (Alex Chen • Student Portal)
    2. `Staff Persona` (Dr. Vance • Resolver Workspace)
    3. `Admin Persona` (Executive Admin Console)
- **User Profile Menu**:
  - Trigger Card: User avatar image / fallback initials (`U`), Status indicator dot, User name (`Alex Chen`), Subtext role.
  - Dropdown Menu:
    - User Header: Full name, Email address, Persona pill.
    - Action Item: "Return to Landing Page" button (`LogOut` icon) -> navigates to `/`.

### B. Navigation Sidebar (`Sidebar.jsx`)
- **Role Header Tag**: Displays role banner (`STUDENT PORTAL`, `STAFF WORKSPACE`, or `ADMIN CONSOLE`) with icon.
- **Collapse Toggle Button**: Button with `ChevronLeft` / `ChevronRight` to collapse sidebar (`72px`) or expand (`260px`).
- **Role-Based Navigation List**:
  - **Student Menu**:
    - `Student Dashboard` (`LayoutDashboard` icon) -> `/dashboard`
    - `New Complaint` (`PlusCircle` icon) -> `/complaints/new`
    - `My Complaints` (`FileText` icon) -> `/complaints`
    - `Track Ticket` (`Search` icon) -> `/track`
  - **Staff Menu**:
    - `Department Queue` (`Inbox` icon, with Queue badge) -> `/staff/queue`
    - `Assigned Complaints` (`CheckSquare` icon) -> `/staff/assigned`
    - `Resolution Log` (`History` icon) -> `/staff/resolutions`
  - **Admin Menu**:
    - `Global Dashboard` (`BarChart3` icon) -> `/admin/dashboard`
    - `Analytics & Insights` (`TrendingUp` icon) -> `/admin/analytics`
    - `Department Mgmt` (`Building2` icon) -> `/admin/departments`
- **Sidebar Footer**: "Back to Landing Page" link (`ArrowLeft` icon).

---

## 3. Screen Specifications

### 1. Authentication & Sign-In Page (`Auth.jsx`)
- **Route**: `/` (or opened via auth trigger).
- **Page Layout**: 2-column split layout (Left Brand Showcase + Right Auth Card).
- **Top Actions**: Brand logo (clicks to Home), Mode toggle button ("Sign Up" / "Log in" with `ArrowRight` icon).
- **Left Brand Showcase Panel**:
  - Headline: "Every Complaint. Structured Into Resolution."
  - Description Copy: Unified platform to capture, route, track, and resolve complaints.
  - Feature Badges: "Data Secure" (`ShieldCheck`), "Real-time Tracking" (`Clock`), "AI Powered" (`Cpu`).
- **Right Auth Card**:
  - Title Group: "Welcome Back" / "Create Account" + Subtitle.
  - Form Fields:
    1. *Full Name* (Shown only during Sign-Up): Text input, `User` icon, placeholder "Enter your name", required.
    2. *Email Address*: Email input, `Mail` icon, placeholder "youremail@company.com", required.
    3. *Password*: Password input, `Lock` icon, `Eye`/`EyeOff` toggle button, placeholder "Enter your password" / "Create password", required.
    4. *Forgot Password Link* (Shown only during Login): Clickable trigger text.
  - Action Button: "Login" / "Create Account" button (`ArrowRight` icon).
  - Footer Note: "Protected with enterprise-grade encryption" with lock icon.

---

### 2. Student Dashboard & My Complaints (`MyComplaintsList.jsx`)
- **Route**: `/dashboard` or `/complaints`.
- **Page Header**:
  - Title: "My Complaints".
  - Subtitle: "Track, manage, and lodge formal service tickets."
  - Action Button: "Lodge New Complaint" (`PlusCircle` icon) -> navigates to `/complaints/new`.
- **Metrics Overview Bar (4 KPI Cards)**:
  1. *Total Complaints*: Number count + "Total Submitted" label (`FileText` icon).
  2. *Pending Triage*: Number count + "Pending Triage" label (`Clock` icon).
  3. *In Progress*: Number count + "Active Repair" label (`RefreshCw` icon).
  4. *Resolved*: Number count + "Resolved & Closed" label (`CheckCircle2` icon).
- **Filter Toolbar Card**:
  - *Search Input*: Text input, `Search` icon, placeholder "Search by Ticket ID, Title, Location, Description...", Clear button (`X` icon).
  - *Sort Dropdown*: Select options ("Newest First", "Oldest First", "Highest Priority").
  - *Status Filter Pills*: 5 Pill buttons ("All", "Pending", "In Progress", "Resolved", "Rejected").
  - *Category Select*: Dropdown ("All Categories" + Org-specific categories).
  - *Priority Select*: Dropdown ("All Priorities", "Low", "Medium", "High", "Urgent").
  - *Reset Filters Button*: Action trigger to reset all search/filter states.
- **Complaints Grid / List**:
  - *Empty State Card* (Shown when 0 tickets match): Display icon, title "No complaints match current filters", description, "Reset Queue Filters" button.
  - *Ticket Item Card*:
    - **Header Row**: Ticket ID badge (`CMS-2026-XXXX`), Status badge chip (with dot indicator), Priority badge chip.
    - **Title**: Ticket summary headline.
    - **Description Snippet**: Truncated 2-line problem text.
    - **Meta Row**: Category & Sub-category, Location with `MapPin` icon, Date submitted (`Clock` icon), Anonymous badge (if submitted anonymously).
    - **Footer Row**: Assigned Resolver staff name (or "Unassigned"), "Track Progress" action button (`ArrowRight` icon) -> navigates to `/track?id=CMS-2026-XXXX`.

---

### 3. Lodge New Complaint Form (`NewComplaintForm.jsx`)
- **Route**: `/complaints/new`.
- **Page Header**: "Back to My Complaints" link (`ArrowLeft` icon) + "Lodge New Complaint" title + Org Context Badge.
- **Form Card Structure (9 Sections)**:
  - **Section 1: Summary / Title**:
    - Field Label: "Short Summary / Problem Title *"
    - Text Input: Max 120 chars, placeholder "e.g., Water leakage in Block B Room 304 restroom pipe", required.
    - Character Counter: `X / 120`.
    - *AI Knowledge Base Solution Deflection Widget* (Appears automatically when keywords like `wifi`, `water`, `ac`, `food`, `password` are typed):
      - Header: "Suggested Self-Help Solution" (`Sparkles` icon) + Dismiss button (`X` icon).
      - Article Title & Solution Copy.
      - Button 1: "This Solved My Issue (Cancel Ticket)" (`CheckCircle2` icon) -> clears form & notifies user.
      - Button 2: "No, Continue Filing Ticket" -> dismisses widget.
  - **Section 2: Category & Sub-Category**:
    - *Category Select*: Dropdown (options populated dynamically per Org: College / Society / Corporate).
    - *Sub-Category Select*: Dropdown (options populated dynamically based on selected Category).
  - **Section 3: Specific Location**:
    - Field Label: Location label per Org (e.g., "Hostel Block / Room No", "Block & Flat / Unit No").
    - Text Input: Placeholder "Specify exact room, lab, floor or desk number", required.
    - *Quick Location Preset Pills*: Clickable chips (e.g., "Block B - Room 304", "CS Dept Lab 3") that fill the location input.
  - **Section 4: Priority Level**:
    - Field Label: "Select Urgency / Priority Level *"
    - 4 Priority Cards (`Low`, `Medium`, `High`, `Urgent`): Card contains priority name, color dot, and description.
    - *Urgency Justification Field* (Appears ONLY if `Urgent` selected): Textarea for emergency rationale, required.
  - **Section 5: Detailed Description**:
    - Field Label: "Detailed Description of Issue *"
    - Textarea: Min 20 chars, placeholder "Provide complete context, steps to reproduce, or observations...", required.
    - Character Counter & Validation status.
  - **Section 6: Anonymity Preference**:
    - Card: "Submit Anonymously" switch toggle slider.
    - Warning Disclosure Badge: Note explaining that anonymous tickets prevent direct staff follow-up calls.
  - **Section 7: Access & Time Slot Preference**:
    - *Preferred Date*: Date picker input (defaults to today).
    - *Time Slot Pills*: 3 selectable options ("Morning 8 AM - 12 PM", "Afternoon 12 PM - 4 PM", "Evening 4 PM - 8 PM").
  - **Section 8: File & Image Attachments**:
    - Drag-and-Drop Dropzone: File input (accepts images & documents, max 5MB per file).
    - Attached Files Grid: Lists uploaded files with thumbnail preview / file icon, filename, file size, and Delete button (`Trash2`).
  - **Section 9: Preferred Contact Method**:
    - 3 Option Cards ("In-App Notification", "Email Update", "Phone Call / SMS").
- **Form Footer Actions**:
  - Cancel Button: Returns to `/complaints`.
  - Submit Button: "Submit Complaint Ticket" (`Send` icon) -> submits ticket and redirects to `/complaints`.

---

### 4. Ticket Tracker & Details (`TicketTracker.jsx`)
- **Route**: `/track` or `/track?id=CMS-2026-XXXX`.
- **Top Lookup Bar**:
  - Quick Select Ticket Dropdown (lists user's active tickets).
  - Ticket ID Lookup Input + "Lookup" Submit Button.
- **Main Layout Grid (2 Columns)**:
  - **LEFT COLUMN**:
    1. *Header Ticket Information Card*:
       - Ticket ID text + "Copy ID" button (`Copy` icon, feedback state "Copied!").
       - Status badge chip + Priority badge chip.
       - Title headline text.
       - Full description text.
       - Urgency Callout Box (if priority is Urgent).
       - Metadata Grid (4 fields): Category & Sub-category, Location (`MapPin` icon), Date Submitted, Requester name & details.
    2. *Visual Timeline Stepper Card*:
       - 5 Canonical Stage Nodes:
         1. `Submitted`: Ticket registered in system.
         2. `Under Review`: Triage & verification by admin.
         3. `Assigned`: Staff / Department handler assigned.
         4. `In Progress`: Active repair & resolution in progress.
         5. `Resolved`: Ticket completed & verified.
       - Node Indicators: Completed steps show checkmarks (`CheckCircle2`); current active step shows colored pulse ring; upcoming steps show numbers.
       - Connecting vertical timeline lines.
       - Step History Audit Stream: List items showing timestamp, updated-by name, and status notes.
    3. *Comments & Discussion Thread Card*:
       - Comments Stream List: Displays user and staff comment bubbles with avatar, author name, role tag (`Student` vs `Staff`), timestamp, and comment text.
       - Add Comment Form: Textarea input + "Post Comment" action button (`Send` icon).
  - **RIGHT COLUMN (Sidebar Info Cards)**:
    1. *Assigned Handler Profile Card*: Staff avatar, Resolver name, Department, Contact info, Status tag (or "Unassigned" box if no handler assigned yet).
    2. *SLA Status Card*: SLA limit hours (4h/24h/48h), elapsed hours, remaining hours countdown, breach warning callout if overdue.
    3. *Quick Actions Stack*:
       - "Contact Handler" button.
       - "Download Ticket Receipt" button (`Download` icon).
       - "Reopen Ticket" button (if resolved).

---

### 5. Staff Department Queue (`StaffQueue.jsx`) & Resolutions (`StaffResolutions.jsx`)
- **Route**: `/staff/queue` or `/staff/assigned`.
- **Header Section**:
  - Title: "Department Ticket Queue" (or "Assigned Complaints").
  - Scope Tabs: "All Queue" vs "Assigned to Me".
  - Metric Counters: Total Queue Count, Pending Triage Count, In Progress Count, Resolved Count.
- **Queue Filter Toolbar**:
  - Search bar, Department filter select, Priority filter select, Status filter select, Sort select, Reset filters button.
- **Queue Ticket Cards List**:
  - Ticket Card features a red left border if SLA is breached.
  - Card Header: Ticket ID, SLA countdown badge, Priority chip, Status chip, Requester details.
  - Action Controls:
    - "Update Status" dropdown button (Change to In Progress / Resolved / Rejected).
    - "Reassign Staff" dropdown button.
    - Inline Quick Note textarea + "Save Note" button.
    - "View Full Ticket Modal" trigger button.
- **Full Ticket Detail Modal**:
  - Dialog card overlay displaying full ticket details, attachments preview, status update form with status note input, internal note input, and save/close buttons.
- **Staff Resolution Log (`StaffResolutions.jsx`)**:
  - Route: `/staff/resolutions`.
  - Table & card history view of all resolved tickets with resolution summary notes, staff performance metrics, and resolution timestamps.

---

### 6. Admin Global Console & Analytics (`AdminAnalytics.jsx` & `AdminDepartments.jsx`)
- **Route**: `/admin/dashboard` or `/admin/analytics`.
- **Header Section**:
  - Title: "Global Administrative Console".
  - Actions: "Export CSV" button (`FileSpreadsheet` icon, downloads CSV report), "Reset Seed Data" button (`RotateCcw` icon).
- **Admin KPI Overview Cards (4 cards)**:
  1. *Total System Tickets*: Total complaints count.
  2. *Global Resolution Rate*: Resolution percentage %.
  3. *Unassigned Queue*: Count of active unassigned tickets.
  4. *SLA Breach Count*: Count of tickets violating SLA.
- **System Analytics Breakdown Cards**:
  - *Complaints by Department*: Visual bar list showing ticket distribution across departments.
  - *Status Distribution*: Breakdown of tickets by status state.
- **Global Ticket Management Table (`table-card`)**:
  - Table Columns:
    1. Ticket ID
    2. Title & Category (with location)
    3. Requester (Student name, Roll No / Room)
    4. Priority Badge
    5. Status Override Dropdown (Instant status change)
    6. Assigned Staff Dropdown (Instant re-assignment)
    7. Actions (Reassign modal trigger, Delete ticket trigger)
  - Features horizontal scroll wrapper (`overflow-x: auto`) for mobile compatibility.
- **Department Management Page (`AdminDepartments.jsx`)**:
  - Route: `/admin/departments`.
  - Department cards list (Department Name, Category mapping, Staff Count, Active Ticket Load, SLA threshold settings).
  - "Add New Department" modal trigger + Department creation form modal.
