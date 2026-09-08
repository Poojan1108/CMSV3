# Resolve X — UI Specification: Page 3 (Live Ticket Tracker & Lifecycle Timeline)
**File Target**: `src/pages/TicketTracker.jsx`  
**Aesthetic Theme**: Option 3 — Warm Linen & Forest Sage  
**Design Philosophy**: Transparent 6-stage lifecycle tracking, high-clarity 2-column split, seamless dispute & closure workflow.

---

## 1. Executive Summary & Problem Solving

### The Problem in Traditional Incident Tracking:
* **The "Black Box" Problem**: Users file tickets and have no visibility into what happens behind the scenes.
* **Cluttered Multi-Tab Layouts**: Discussion, file attachments, technician details, and resolution sign-offs are scattered across separate tabs.
* **Complex Search UX**: Strict ticket ID formatting fails when users search with `#`, lowercase letters, or suffix numbers.

### The Streamlined Resolve X Solution:
* **Unified 6-Stage Progress Rail**: Displays real-time progression from intake to closure (`Submitted` → `Under Review` → `Assigned` → `In Progress` → `Pending Confirmation` → `Resolved`).
* **Clean 2-Column Operational Split**: Left pane anchors immutable ticket properties, attachments, and assigned technician; right pane delivers a real-time conversation and audit thread.
* **Postel's Law Sanitizer**: Forgiving ticket lookup handles `#CMS-2026-1001`, `cms-1001`, `1001`, and whitespace-padded inputs seamlessly.

---

## 2. Layout Structure & Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PageHeader & Master Ticket Bar                                                                  │
│ ← Back to My Complaints                                                                         │
│ #CMS-2026-1001   [ 📋 Copy ]                     [ 🔍 Quick Jump: #CMS-1001 ↵ ]  [ In Progress ●]│
│ Water leakage in bathroom pipe under sink                                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 6-Stage Lifecycle Progress Rail (Understated Horizontal Stepper)                                │
│                                                                                                 │
│  (✓) Submitted  ──  (✓) Under Review  ──  (✓) Assigned  ──  (●) In Progress  ──  ( ) Review  ──  ( ) Closed
│   Oct 26, 09:15 AM   Oct 26, 10:00 AM      Oct 26, 11:20 AM   Active Now           Est. 4:00 PM  │
├────────────────────────────────────────────────────────┬────────────────────────────────────────┤
│ LEFT PANE: SPECIFICATIONS & EVIDENCE (40%)             │ RIGHT PANE: LIVE DISCUSSION & LOG (60%)│
│                                                        │                                        │
│ ┌────────────────────────────────────────────────────┐ │ ┌────────────────────────────────────┐ │
│ │ INCIDENT PROPERTIES                                │ │ │ DISCUSSION & AUDIT TRAIL           │ │
│ │ Department:  Hostel Maintenance (Plumbing)         │ │ │                                    │ │
│ │ Location:    Block B · Room 304                    │ │ │ 👤 Dr. Robert Vance · 11:20 AM     │ │
│ │ Priority:    ● High Priority (24h SLA)             │ │ │ "Plumber dispatched to Block B.    │ │
│ │ Access Time: Today · 02:00 PM – 04:00 PM           │ │ │ Expected arrival at 2:00 PM."      │ │
│ │                                                    │ │ │                                    │ │
│ │ ASSIGNED TECHNICIAN                                │ │ │ 👤 Alex Chen (Student) · 09:10 AM  │ │
│ │ [👤] Dr. Robert Vance — Head of Facility Care      │ │ │ "Bucket placed under pipe.         │ │
│ │      📞 ext. 4102 · robert.vance@campus.edu        │ │ │ Leak is dripping continuously."    │ │
│ │                                                    │ │ │                                    │ │
│ │ EVIDENCE & ATTACHMENTS (2)                         │ │ │ ⚙ System Audit · 09:15 AM          │ │
│ │ ┌──────────────┐ ┌──────────────┐                  │ │ │ Ticket created and SLA initialized.│ │
│ │ │ [📷 Photo 1] │ │ [📷 Photo 2] │                  │ │ ├────────────────────────────────────┤ │
│ │ └──────────────┘ └──────────────┘                  │ │ │ [ 💬 Type an update or reply...  ]│ │
│ │                                                    │ │ │ [📎 Attach Photo]   [ Send (⌘↵) ➔] │ │
│ │ RESOLUTION ACTIONS (When Marked Fixed)             │ │ └────────────────────────────────────┘ │
│ │ [ Confirm Resolution ✓ ]     [ Reopen / Dispute ]  │ │                                        │
│ └────────────────────────────────────────────────────┘ │                                        │
└────────────────────────────────────────────────────────┴────────────────────────────────────────┘
```

---

## 3. Streamlined Component Breakdown

### Component 1: Master Ticket Header & Forgiving Lookup
* **Elements**:
  - Breadcrumb navigation (`← Back to My Complaints`).
  - Monospace Ticket ID with instant clipboard copy button (`setCopiedId` toast).
  - High-visibility Status Badge (`In Progress`, `Pending Confirmation`, `Resolved`).
  - Fast-jump search input that sanitizes input via Postel's Law.

### Component 2: Understated 6-Stage Progress Stepper
* **Visual Architecture**:
  - Horizontal connecting rail (`2px solid #e7e5e4`).
  - Circular nodes (`20px` diameter):
    - Completed nodes: Deep Forest Sage (`#0f766e`) with checkmark `✓`.
    - Active node: Outer sage ring with pulsing dot indicator.
    - Future nodes: Warm stone neutral (`#d6d3d1`).
  - Timestamp labels displayed below each stage in 11.5px muted stone.

### Component 3: Left Specification & Evidence Card
* **Content**:
  - Structured property list (Department, Location, Priority, Preferred Access Slot).
  - Assigned Handler tile with direct email/phone extension.
  - Media gallery with thumbnail previews and lightbox modal.
  - Sign-off actions: "Confirm Resolution ✓" (Forest Sage) and "Reopen / Dispute" (Warm Stone outline).

### Component 4: Right Discussion Stream & Real-Time Input
* **Features**:
  - Chronological chat feed with distinct message bubbles:
    - Staff / Resolver: Soft sage background (`#f0fdf4`) with green name badge.
    - Citizen / Reporter: Warm linen background (`#f4f0ea`) with neutral name badge.
    - System Audit Logs: Centered neutral pill with timestamp.
  - Sticky bottom reply box with multi-line auto-expand textarea, file attachment clip, and `⌘ + Enter` submit shortcut.

---

## 4. Design Token Mappings

| UI Element | CSS Variable / Class | Warm Linen & Sage Value |
| :--- | :--- | :--- |
| **Page Canvas** | `--app-bg` | `#faf8f5` (Warm Linen 100) |
| **Split Pane Surface**| `--app-surface` | `#ffffff` (Pure White panel) |
| **Hairline Borders** | `--app-border` | `#e7e5e4` (Stone 200) |
| **Active Stepper Node**| `.stepper-active` | `#0f766e` (Deep Forest Sage) |
| **Completed Stepper** | `.stepper-complete` | `#059669` (Emerald Green) |
| **Staff Message Bubble**| `.msg-staff` | `#f0fdf4` surface, `#134e4a` text |
| **User Message Bubble** | `.msg-user` | `#f4f0ea` surface, `#1c1917` text |
| **System Event Pill** | `.msg-system` | `#f5f5f4` surface, `#78716c` text |
| **Confirm Action CTA**| `.btn-confirm` | `#059669` (Emerald CTA button) |
| **Dispute Action CTA**| `.btn-dispute` | `#be123c` text with stone outline |

---

## 5. Responsive Mobile Behavior (< 640px)

1. **Header**: Stacks cleanly; Search input moves below ticket title.
2. **Progress Rail**: Collapses into a compact 1-line progress indicator (`Stage 4 of 6: In Progress`) with tap-to-expand full timeline modal.
3. **2-Column Split**: Transforms into a single-column vertical flow:
   - Top: Summary & Assigned Staff.
   - Middle: Media attachments gallery.
   - Bottom: Discussion stream with fixed bottom reply input bar.
4. **Resolution Modal**: Opens as a native bottom sheet (`max-height: 92vh`) with direct star rating and signature confirm button.

---

## 6. Implementation Checklist for Page 3

- [ ] Unify Top Header and Search into master lookup bar.
- [ ] Refine 6-stage Stepper with 20px clean nodes and thin connecting rail.
- [ ] Implement clean 2-column split with zero nested card clutter.
- [ ] Style discussion bubbles with Warm Linen & Sage role-based tints.
- [ ] Connect Confirmation & Reopen modal bottom sheets.
- [ ] Verify 44px mobile touch targets and responsive single-column collapse.
