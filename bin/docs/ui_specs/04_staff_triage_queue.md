# Resolve X — UI Specification: Page 4 (Staff Operational Triage Queue)
**File Target**: `src/pages/StaffQueue.jsx` & `src/pages/StaffResolutions.jsx`  
**Aesthetic Theme**: Option 3 — Warm Linen & Forest Sage  
**Design Philosophy**: Linear-grade operational density, keyboard-ready triage, split master-detail inspection.

---

## 1. Executive Summary & Problem Solving

### The Problem in Traditional Staff Service Desks:
* **Low Density**: Massive card layouts force staff to scroll past 2–3 cards per screen, making it impossible to assess 40+ tickets quickly.
* **Context Loss**: Opening a ticket takes staff to a new page, breaking their triage flow.
* **Invisible SLA Breaches**: Urgency timers are hidden inside ticket bodies rather than screaming for attention in the queue.

### The Streamlined Resolve X Solution:
* **Combined Triage Command Strip**: Merges separate metric cards and scope tabs into a single interactive status bar (`[All 48] [My Assigned 6] [Needs Triage 12] [In Progress 18] [SLA Critical 2 ⚠️]`).
* **High-Density Operational Table**: 44px compact rows featuring Monospace ID `#CMS-1001`, Category tag, Priority dot, live SLA countdown timer (`1h 45m left`), and Assignee avatar.
* **Master-Detail Slide-Out Panel**: Clicking any ticket row opens a 420px contextual right inspection pane for instant status transitions, department reassignment, and internal staff notes without page reload.

---

## 2. Layout Structure & Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PageHeader                                                                                      │
│ Operational Triage Queue                                                    [ ↺ Refresh Queue ] │
│ Managing 48 active institutional incidents across campus.                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Triage Command Strip (Combined Metrics & 1-Click Scope Filters)                                 │
│ [ All (48) ]  [ Assigned to Me (6) ]  [ Needs Triage (12) ]  [ In Progress (18) ] [ ⚠️ SLA Breach (2) ]│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Streamlined Queue Toolbar                                                                       │
│ [ 🔍 Filter by ticket ID, room, or keyword...               ] [ Department ▾ ] [ Priority ▾ ] [⇅]│
├───────────────────────────────────────────────────────────────────┬─────────────────────────────┤
│ HIGH-DENSITY OPERATIONAL QUEUE (65%)                              │ RIGHT INSPECTION PANE (35%) │
│                                                                   │                             │
│ [ ] ID        TITLE & LOCATION         CATEGORY   PRIORITY SLA    │ #CMS-1001   [ ✕ Close Pane ]│
├───────────────────────────────────────────────────────────────────┤ Water leakage in Block B 304│
│ [ ] #CMS-1001 Water leakage under sink  Hostel    ● Urgent 0h 0m  │ Status: [ In Progress ▾ ]   │
│               📍 Hostel Block B · Room 304                 (Breach)│ Priority: ● Urgent (4h SLA) │
├───────────────────────────────────────────────────────────────────┤ Assigned: Dr. Robert Vance  │
│ [ ] #CMS-1002 Wi-Fi AP offline in Lab 3 IT & Wifi ● High   1h 45m │ Location: Hostel Block B 304│
│               📍 CS Dept, Lab 3, 2nd Floor                 (Amber)│                             │
├───────────────────────────────────────────────────────────────────┤ ┌─────────────────────────┐ │
│ [ ] #CMS-1003 AC blowing warm air      Electric   ● Medium 22h 10m│ │ QUICK STATUS ACTIONS    │ │
│               📍 Central Library Floor 1                   (Green)│ │ [ In Progress ] [Resolve]│ │
├───────────────────────────────────────────────────────────────────┤ └─────────────────────────┘ │
│ [ ] #CMS-1005 Waste bin overflowing    Sanitation ● High   14h 30m│                             │
│               📍 Hostel Block A Foyer                      (Amber)│ INTERNAL STAFF NOTES (🔒)   │
│                                                                   │ [ Plumber on site. Pipe  ]  │
│                                                                   │ [ replaced. Testing seal.]  │
│                                                                   │ [ ＋ Add Internal Note ]    │
│                                                                   │                             │
│                                                                   │ REASSIGN DEPARTMENT         │
│                                                                   │ [ Transfer to Plumbing ▾ ]  │
└───────────────────────────────────────────────────────────────────┴─────────────────────────────┘
```

---

## 3. Streamlined Component Breakdown

### Component 1: Triage Command Strip
* **Replaces**: 5 separate `MetricCard` boxes + 4 separate scope filter tabs.
* **Features**:
  - Interactive pill segments displaying real-time ticket counts.
  - Active segment: Deep Forest Sage (`#0f766e`).
  - Critical SLA Breach segment: Warm Crimson border (`#be123c`) and soft red fill (`#ffe4e6`) with warning icon.

### Component 2: High-Density Operational Table (`.queue-table`)
* **Visual Presentation in Warm Linen & Sage**:
  - Row Height: 48px compact touch/click area.
  - Background: Pure white (`#ffffff`) rows with 1px stone divider (`#e7e5e4`).
  - Hover State: Soft linen tint (`#f4f0ea`) with 120ms transition.
  - Active Row (Selected): Left border 3px solid `#0f766e` (Forest Sage).
  - SLA Badge:
    - Normal (Healthy): `#059669` green text on `#d1fae5` pill.
    - Warning (≤ 30% time): `#b45309` amber text on `#fef3c7` pill.
    - Breached: `#be123c` crimson text on `#ffe4e6` pill with pulse dot.

### Component 3: Right Contextual Inspection Pane (`.inspection-pane`)
* **Features**:
  - Integrated 420px slide-out drawer on desktop; slides in seamlessly from the right.
  - Status transition bar: 1-click buttons (*Acknowledge*, *Mark In Progress*, *Resolve with Proof*, *Reject*).
  - Internal Staff Notes (marked with 🔒 lock icon) separate from public citizen updates.
  - Quick Reassignment selector to transfer tickets across departments.

---

## 4. Design Token Mappings

| Queue Component | CSS Variable / Class | Warm Linen & Sage Value |
| :--- | :--- | :--- |
| **Queue Canvas** | `--app-bg` | `#faf8f5` (Warm Linen 100) |
| **Table Surface** | `--app-surface` | `#ffffff` (Pure White) |
| **Row Divider** | `--app-border` | `#e7e5e4` (Stone 200) |
| **Selected Row** | `--app-accent-subtle` | `#f4f0ea` with `#0f766e` left accent |
| **SLA Healthy** | `.sla-healthy` | `#059669` text, `#d1fae5` surface |
| **SLA Warning** | `.sla-warning` | `#b45309` text, `#fef3c7` surface |
| **SLA Breached** | `.sla-breached` | `#be123c` text, `#ffe4e6` surface |
| **Internal Note** | `.note-internal` | `#fef9c3` surface, `#854d0e` border (Yellow post-it hint) |
| **Resolve CTA** | `.btn-resolve` | `#059669` (Emerald Green button) |

---

## 5. Responsive Mobile Transformations (< 640px)

1. **Table to Stacked Feed**: Multi-column table transforms into a high-density stacked card feed (64px row height).
2. **Inspection Pane to Native Bottom Sheet**: Clicking any row slides up a native mobile bottom sheet (`max-height: 92vh`) with drag handle and sticky bottom action bar.
3. **Sticky Resolver Actions**: On mobile, *Assign to Me* and *Resolve Ticket* stick to the bottom of the screen with safe-area padding.

---

## 6. Implementation Checklist for Page 4

- [ ] Unify top metrics into interactive `<TriageCommandStrip />`.
- [ ] Implement high-density `<QueueTable />` with 48px rows and live SLA countdowns.
- [ ] Connect master-detail `<InspectionPane />` for instant split-screen triage.
- [ ] Style internal staff notes (🔒) and quick status changers in Warm Linen & Sage palette.
- [ ] Enable native bottom sheet modal for mobile view.
