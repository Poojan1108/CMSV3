# Resolve X — UI Specification: Page 5 (Executive Admin Telemetry & Audit)
**File Target**: `src/pages/AdminAnalytics.jsx` & `src/pages/AdminDepartments.jsx`  
**Aesthetic Theme**: Option 3 — Warm Linen & Forest Sage  
**Design Philosophy**: Stripe-grade executive clarity, high-density institutional telemetry, unified data export.

---

## 1. Executive Summary & Problem Solving

### The Problem in Traditional Admin Dashboards:
* **Chart Bloat**: Massive cartoonish 3D charts and rainbow visualizations that look flashy but fail to communicate actionable operational metrics.
* **Header Button Crowding**: Multiple disconnected export buttons (CSV, JSON, Print, Reset) clutter the top navigation.
* **Disconnected Governance**: Admins cannot reassign tickets directly from the resolution audit table without opening separate settings menus.

### The Streamlined Resolve X Solution:
* **Combined Export & Governance Header**: Unifies disparate export actions into a single clean `[ Export Report ▾ ]` dropdown and secondary governance tools.
* **4-Card High-Impact Telemetry Rail**: Delivers instant clarity on Total Volume, Resolution Rate (% SLA met), Average Time to Fix, and Top Incident Categories.
* **Integrated Audit Log & Live Reassignment**: Displays an enterprise table where administrators can filter 100+ tickets and reassign staff in 1 click via an accessible modal drawer.

---

## 2. Layout Structure & Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PageHeader                                                                                      │
│ System Analytics & Institutional Telemetry                                  [ Export Report ▾ ] │
│ Comprehensive governance overview for Campus Facilities & Infrastructure.                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 4-Tile Telemetry Metric Rail                                                                    │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐ │
│ │ TOTAL INCIDENTS  │ │ RESOLUTION RATE  │ │ AVG REPAIR TIME  │ │ HIGHEST VOLUME DEPARTMENT    │ │
│ │ 1,248            │ │ 94.8%            │ │ 3.2 hrs          │ │ Hostel Maintenance           │ │
│ │ ↑ 4.2% volume    │ │ ● Healthy (≥92%) │ │ ↓ 0.4h faster    │ │ 42% of total complaints      │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────────────────┘ │
├──────────────────────────────────────────────────────┬──────────────────────────────────────────┤
│ DEPARTMENT DISTRIBUTION (50%)                        │ PRIORITY & SLA BREAKDOWN (50%)           │
│                                                      │                                          │
│ Hostel Maintenance  ████████████████████ 42% (524)   │ ● Urgent (4h SLA)   ████ 12% (150)       │
│ IT & Networking     ██████████████░░░░░░ 28% (349)   │ ● High (24h SLA)    ████████ 24% (300)   │
│ Electrical Facility ████████░░░░░░░░░░░░ 18% (224)   │ ● Medium (48h SLA)  ████████████ 48%     │
│ Sanitation & Mess   ████░░░░░░░░░░░░░░░░ 12% (151)   │ ● Low (72h SLA)     ████ 16% (200)       │
├──────────────────────────────────────────────────────┴──────────────────────────────────────────┤
│ Institutional Resolution Audit Table                                                            │
│ [ 🔍 Filter by ticket ID, subject, room, or staff...      ] [ Status ▾ ] [ Category ▾ ] [Priority▾]│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ID           INCIDENT SUBJECT         CATEGORY       PRIORITY   ASSIGNEE        STATUS   ACTION │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ #CMS-1001    Water leakage in Block B Hostel (Plumb) ● Urgent   Dr. R. Vance    Active   [Reassign]
│ #CMS-1002    Wi-Fi AP offline in Lab3 IT & Wifi      ● High     Sarah Jenkins   Active   [Reassign]
│ #CMS-1003    AC unit blowing warm air Maintenance    ● Medium   Unassigned      Pending  [Assign]│
│ #CMS-1005    Waste bin overflow       Sanitation     ● High     Unassigned      Active   [Assign]│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Streamlined Component Breakdown

### Component 1: Unified Export Dropdown
* **Replaces**: 4 separate buttons (`Export CSV`, `Export JSON`, `Print`, `Reset`).
* **Features**:
  - Single primary button `[ Export Report ▾ ]`.
  - Dropdown options: CSV Spreadsheet (RFC 4180), JSON Telemetry Dump, Print Executive Summary.
  - Reset Demo Data is safely quarantined inside an `Admin Settings` danger section with explicit modal confirmation.

### Component 2: 4-Tile High-Impact Telemetry Rail
* **Visual Presentation**:
  - White surface cards (`#ffffff`) with 1px stone borders (`#e7e5e4`).
  - Metric values in 24px SemiBold warm espresso (`#1c1917`).
  - Trend badges: Muted green for positive trends, amber for warnings.

### Component 3: Clean Horizontal Distribution Bars
* **Replaces**: Bulky, colorful external charting libraries that slow down mobile loading.
* **Features**:
  - Pure CSS horizontal distribution tracks (`height: 8px; border-radius: 4px; background: #f4f0ea`).
  - Active fill: Deep Forest Sage (`#0f766e`) and warm neutral accents.
  - Zero heavy JavaScript chart dependencies for instant 60fps rendering.

### Component 4: Institutional Audit Table & Inline Reassignment
* **Features**:
  - 44px compact table rows with monospace Ticket ID `#CMS-1001`.
  - Action column with 1-click `[ Reassign ]` button opening a modal with staff roster dropdown and audit log note.

---

## 4. Design Token Mappings

| Admin Component | CSS Variable / Class | Warm Linen & Sage Value |
| :--- | :--- | :--- |
| **Page Canvas** | `--app-bg` | `#faf8f5` (Warm Linen 100) |
| **Tile Surface** | `--app-surface` | `#ffffff` (Pure White panel) |
| **Tile Border** | `--app-border` | `#e7e5e4` (Stone 200) |
| **Progress Track** | `.progress-track` | `#f4f0ea` (Warm Linen Inset) |
| **Progress Fill** | `.progress-fill` | `#0f766e` (Deep Forest Sage) |
| **Table Header** | `.table-head` | `#f4f0ea` surface, `#57534e` text |
| **Reassign Button** | `.btn-reassign` | `#ffffff` surface, `#0f766e` text, `#e7e5e4` border |

---

## 5. Responsive Mobile Behavior (< 640px)

1. **Telemetry Rail**: 4 metric tiles stack into a 2x2 grid with compact typography.
2. **Distribution Split**: 2-column breakdown stacks into single vertical cards.
3. **Audit Table**: Wrapped in a smooth horizontal `.table-scroll` container; row cells maintain minimum width without breaking page scale.
4. **Reassign Modal**: Transforms into a native bottom sheet modal on mobile devices.

---

## 6. Implementation Checklist for Page 5

- [ ] Consolidate top export buttons into single `<ExportDropdown />`.
- [ ] Connect 4-card `<TelemetryRail />` with live calculated metrics.
- [ ] Build pure CSS `<DistributionBars />` for instant lightweight rendering.
- [ ] Implement `<AuditTable />` with 1-click Reassignment modal drawer.
- [ ] Apply Warm Linen & Forest Sage tokens across all admin analytics components.
