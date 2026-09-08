# Resolve X — UI Specification: Page 1 (My Complaints Hub)
**File Target**: `src/pages/MyComplaintsList.jsx`  
**Aesthetic Theme**: Option 3 — Warm Linen & Forest Sage  
**Design Philosophy**: Streamlined, high-clarity, component-reduced enterprise interface.

---

## 1. Executive Summary & Problem Solving

### The Problem in Traditional CMS Portals:
* Redundant components: Top metric cards replicate the same filter pills in the toolbar below.
* Visual clutter: Double-nested cards and separate callout banners push actual content below the fold.
* Disconnected tracking: Users have to click through multiple tabs to see who is handling their issue.

### The Streamlined Resolve X Solution:
* **Combined Status & Metric Bar**: Merges separate metric cards and filter pills into a single unified segmented control (`[All 12] [Pending 2] [In Progress 4] [Needs Review 1] [Resolved 5]`).
* **Content-on-Canvas Architecture**: Removes the outer card wrapper from the toolbar; search and dropdowns sit directly on the warm linen canvas.
* **Inline Resolution Confirmation**: Pin tickets needing user review to the top with an inline green action badge, eliminating separate intrusive banner boxes.

---

## 2. Layout Structure & Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PageHeader                                                                                      │
│ My Complaints                                                               [ + Lodge Complaint]│
│ Track and manage all service requests filed under your account.                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Combined Status Metric Strip (Interactive 1-Click Filters)                                      │
│ [ All (12) ]    [ Pending (2) ]    [ In Progress (4) ]    [ Needs Review (1) ]   [ Resolved (5) ]│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Streamlined Filter Bar                                                                          │
│ [ 🔍 Search by ticket ID, keyword, or room...                ] [ Category ▾ ] [ Priority ▾ ] [⇅]│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Active Complaints Feed (Clean Single-Layer Cards)                                               │
│                                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ #CMS-2026-1001   📍 Hostel Block B · Room 304        ● High Priority       [ In Progress ● ]│ │
│ │                                                                                             │ │
│ │ Water leakage in bathroom pipe under sink                                                   │ │
│ │ Heavy continuous dripping observed since this morning. Placed a bucket to prevent flooding. │ │
│ │                                                                                             │ │
│ │ 👤 Assigned to Dr. Robert Vance · Dispatched 2h ago                       [ View Progress → ]│ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ #CMS-2026-1002   📍 CS Dept · Lab 3                  ● Medium Priority     [ Needs Review ★ ]│ │
│ │                                                                                             │ │
│ │ Wi-Fi Access Point 4 unreachable during lab hours                                           │ │
│ │ AP restarted and firmware updated. Verified internet connectivity restored on switch 2.    │ │
│ │                                                                                             │ │
│ │ 👤 Resolved by Sarah Jenkins · 45m ago               [ Confirm Fix ✓ ]    [ View Progress → ]│ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Streamlined Component Breakdown

### Component 1: Unified Status & Metric Segmented Control
* **Replaces**: 4 separate `MetricCard` boxes + 6 separate `filter-pill` buttons.
* **Behavior**:
  - Horizontal pill-rail with count badges inside each segment.
  - Active segment: Deep Forest Sage background (`#0f766e`), white text.
  - Inactive segments: Warm linen hover tint (`#f4f0ea`), warm espresso text (`#1c1917`).
  - Mobile behavior: Single-row horizontal swipe track with smooth momentum scroll.

### Component 2: Single-Line Integrated Filter Toolbar
* **Replaces**: 2 stacked toolbar rows inside a heavy white card.
* **Layout**:
  - Left: Flexible Search Input (`flex: 1`) with icon and 32px clear button.
  - Right: Native Category Select (`#e7e5e4` border), Priority Select, and Sort Toggle.
  - Visual: Sits directly on the canvas without an outer card container, giving the page a modern, airy feel.

### Component 3: Clean Single-Layer Ticket Card (`.ticket-card`)
* **Visual Styling in Warm Linen & Sage**:
  - Background: Pure white (`#ffffff`).
  - Border: 1px hairline stone (`#e7e5e4`).
  - Corner Radius: 8px.
  - Typography:
    - Ticket ID: 12px Monospace tabular figures (`#57534e`).
    - Title: 15px SemiBold warm espresso (`#1c1917`).
    - Snippet: 13.5px regular muted stone (`#78716c`), clamped to 2 lines.
    - Metadata: 12px medium location and assignee info.
* **Interactive States**:
  - Default: Border `#e7e5e4`, flat elevation.
  - Hover: Border `#d6d3d1`, subtle warm lift (`translateY(-1px)`).
  - Pinned State (Needs Review): Left border accent 3px solid `#059669` (Emerald).

---

## 4. Design Token Mappings

| UI Element | CSS Variable / Token | Warm Linen & Sage Value |
| :--- | :--- | :--- |
| **Page Canvas** | `--app-bg` | `#faf8f5` (Warm Linen 100) |
| **Card Surface** | `--app-surface` | `#ffffff` (Pure White) |
| **Hairline Borders** | `--app-border` | `#e7e5e4` (Stone 200) |
| **Hover Borders** | `--app-border-strong` | `#d6d3d1` (Stone 300) |
| **Primary Headings** | `--app-text` | `#1c1917` (Warm Espresso) |
| **Secondary Copy** | `--app-text-secondary` | `#57534e` (Stone 700) |
| **Metadata Labels** | `--app-text-muted` | `#78716c` (Stone 500) |
| **Primary CTA Button**| `--app-accent` | `#0f766e` (Deep Forest Sage) |
| **Primary Button Hover**| `--app-accent-strong` | `#134e4a` (Dark Sage) |
| **Resolved Pill** | `--app-success` | `#059669` text on `#d1fae5` pill |
| **Warning / Pending** | `--app-warning` | `#b45309` text on `#fef3c7` pill |
| **Urgent Breach** | `--app-danger` | `#be123c` text on `#ffe4e6` pill |

---

## 5. Responsive Mobile Behavior (< 640px)

1. **Header**: Stacks vertically; "Lodge Complaint" button expands to full width or floats in top bar.
2. **Status Segment Strip**: Becomes a fluid horizontal scroll rail (`overflow-x: auto; scrollbar-width: none;`).
3. **Filter Bar**: Search input takes 100% width; Category and Priority dropdowns collapse into a compact horizontal scroller or single filter drawer button.
4. **Ticket Cards**: Metadata stacks cleanly:
   - Header: `#CMS-2026-1001` left, `In Progress` status right.
   - Title & Snippet: Full width.
   - Footer: Assignee line on left, 44px touch height "View Progress →" on right.

---

## 6. Implementation Checklist for Page 1

- [ ] Consolidate separate metric cards and filter pills into `<StatusSegmentBar />`.
- [ ] Remove outer card container from toolbar to achieve clean "Content-on-Canvas" flow.
- [ ] Embed `<TicketCard />` with 8px radius and hairline stone border.
- [ ] Connect Warm Linen & Forest Sage CSS tokens.
- [ ] Validate 44px touch targets on mobile viewport.
