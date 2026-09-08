# Resolve X — UI Specification: Page 2 (Complaint Intake & Filing Flow)
**File Target**: `src/pages/NewComplaintForm.jsx`  
**Aesthetic Theme**: Option 3 — Warm Linen & Forest Sage  
**Design Philosophy**: Streamlined 3-cluster intake, cognitive load reduction, intelligent draft protection.

---

## 1. Executive Summary & Problem Solving

### The Problem in Traditional Intake Forms:
* **Form Fatigue**: 9 separate disconnected sections create an intimidating "wall of inputs" that discourages users from lodging grievances.
* **Redundant Fields**: Category, sub-category, location, access dates, and contact methods are scattered with uneven vertical spacing.
* **Lost Work**: Unsaved inputs vanish when users switch apps to take photos or look up room numbers.

### The Streamlined Resolve X Solution:
* **Consolidated 3-Cluster Flow**: Merges 9 scattered sections into **3 intuitive thematic clusters** (1. Core Issue & Routing, 2. Evidence & Priority, 3. Access & Submission).
* **Intelligent Auto-Routing**: Real-time NLP detects category from the summary and displays a 1-tap apply chip, removing manual department hunting.
* **Persistent Draft Engine**: Background auto-saves all inputs to `localStorage` (`cms_complaint_draft_v1`) with instant recovery on page load and a 1-click "Discard Draft" option.

---

## 2. Layout Structure & Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PageHeader                                                                                      │
│ ← Back to My Complaints                                                                         │
│ Lodge a New Complaint                                                       [ Draft Auto-Saved ]│
│ Complete the details below. Resolve X routes tickets directly to the responsible team.          │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 1. THE ISSUE & LOCATION (Core Identification)                                               │ │
│ │                                                                                             │ │
│ │ Complaint Summary *                                                                         │ │
│ │ [ Wi-Fi dropping frequently during practical exams in CS Lab 3...                         ] │ │
│ │ ✨ Detected department: IT & Networking — [ Tap to Auto-Apply ]                             │ │
│ │                                                                                             │ │
│ │ Department *                             Sub-Category *                                     │ │
│ │ [ IT Infrastructure & Wifi          ▾ ]  [ Wi-Fi & Network Access                      ▾ ]  │ │
│ │                                                                                             │ │
│ │ Specific Location *                                                                         │ │
│ │ [ CS Department, 2nd Floor, Practical Lab 3                                               ] │ │
│ │ Quick select: [CS Lab 3] [Hostel Block B] [Central Library] [Main Canteen] [Sports Complex] │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 2. DETAILS & EVIDENCE                                                                       │ │
│ │                                                                                             │ │
│ │ Issue Description * (min 20 characters)                                                     │ │
│ │ [ Network disconnects every 10-15 minutes on all workstations in row 2.                      │ │
│ │ [ Switch indicator lights show amber blinking during peak usage...                        ] │ │
│ │                                                                              114 characters │ │
│ │                                                                                             │ │
│ │ Priority Level                                                                              │ │
│ │ [ ( ) Low · 72h ]   [ (●) Medium · 48h ]   [ ( ) High · 24h ]   [ ( ) Urgent · 4h (SLA) ]   │ │
│ │                                                                                             │ │
│ │ Supporting Media & Attachments (Optional)                                                   │ │
│ │ ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ ＋ Drag and drop photos/documents here, or Browse (Max 5MB)                             │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│ │ [ 📷 error_screenshot.png (124 KB) ✕ ]   [ 📄 lab_switch_log.pdf (84 KB) ✕ ]                │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 3. ACCESS WINDOW & PRIVACY PREFERENCES                                                      │ │
│ │                                                                                             │ │
│ │ Preferred Inspection Date                Time Window                      Anonymity         │ │
│ │ [ Today, Oct 26, 2026               📅 ] [ 02:00 PM – 04:00 PM       ▾ ]  [🔘 Lodge Anonym.]│ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Form Actions (Sticky on Mobile)                                                                 │
│ [ ↺ Discard Draft ]                                               [ Cancel ]  [ Submit Ticket ➔]│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Streamlined Component Breakdown

### Cluster 1: Core Identification & Smart Auto-Routing
* **Combines**: Previous Section 1 (Title), Section 2 (Category/Sub-category), and Section 3 (Location).
* **Key Enhancements**:
  - Real-time NLP keyword suggestion pill (`.smart-suggestion-pill`) rendered inline with amber sparkle icon.
  - Horizontal quick-location pills allowing 1-tap entry of common campus/facility zones.
  - Knowledge Base Deflection Card: If user types a known self-resolvable issue (e.g. "reset portal password"), an inline guide card appears with a 1-click "This solved my issue" button.

### Cluster 2: Evidence & Severity Matrix
* **Combines**: Previous Section 4 (Priority & Justification), Section 5 (Description), and Section 8 (Attachments).
* **Key Enhancements**:
  - Priority Segment Selector: 4 compact segments with colored SLA deadline chips (`Low: 72h`, `Medium: 48h`, `High: 24h`, `Urgent: 4h`).
  - Conditional Urgency Justification: Smoothly expands only when `Urgent` is active.
  - Multi-file dropzone with instant thumbnail generation and 32px removal hitboxes.

### Cluster 3: Access & Preferences Strip
* **Combines**: Previous Section 6 (Anonymous Toggle), Section 7 (Access Date & Slot), and Section 9 (Contact Method).
* **Key Enhancements**:
  - Single compact 3-column row pairing date, slot, and anonymity toggle.
  - Reduces page vertical height by 40%.

### Form Action Bar:
* **Components**:
  - "Discard Draft" (with `RotateCcw` icon) — appears only when user has entered content or restored a draft.
  - "Cancel" — returns to `/complaints` without submitting.
  - "Submit Ticket" — Primary Forest Sage button with loading spinner state.

---

## 4. Design Token Mappings

| Form Component | Token / Class | Warm Linen & Sage Value |
| :--- | :--- | :--- |
| **Cluster Surface** | `--app-surface` | `#ffffff` (Pure White panel) |
| **Cluster Border** | `--app-border` | `#e7e5e4` (1px Hairline Stone) |
| **Input Background**| `--app-inset` | `#f4f0ea` (Warm Linen Inset) |
| **Input Focus Ring**| `--app-accent` | `2px solid #0f766e` with 1px offset |
| **Smart Suggestion**| `.smart-suggestion-pill` | `#f0fdf4` surface, `#0f766e` text, `#bbf7d0` border |
| **Priority - Low** | `priority-low` | Neutral stone dot |
| **Priority - Med** | `priority-med` | `#0369a1` Ocean Blue indicator |
| **Priority - High**| `priority-high`| `#b45309` Warm Amber indicator |
| **Priority - Urgent**| `priority-urgent`| `#be123c` Vivid Rose indicator |
| **Dropzone Border** | `.dropzone` | `1.5px dashed #d6d3d1` (Stone 300) |
| **Dropzone Hover** | `.dropzone:hover` | `1.5px dashed #0f766e` with `#faf8f5` tint |

---

## 5. Responsive Mobile Transformations (< 640px)

1. **Form Layout**: 2-column fields stack into single-column inputs with 44px touch height.
2. **Cluster Padding**: Reduced from `24px` to `16px` with fluid `clamp()` margins.
3. **Quick Location Scroller**: Becomes a single-row horizontal swipe track.
4. **Sticky Submission Bar**:
   - Fixed to bottom of screen with `backdrop-filter: blur(12px)` and safe-area inset.
   - Discard Draft on left; full-width "Submit Ticket" on right.

---

## 6. Implementation Checklist for Page 2

- [ ] Consolidate 9 disjointed `<section>` blocks into 3 clean `<Cluster>` containers.
- [ ] Connect `suggestedCategory` 1-tap chip inside Cluster 1.
- [ ] Implement 4-segment Priority selector with inline SLA tags.
- [ ] Wire `localStorage` draft auto-save and discard lifecycle.
- [ ] Apply Warm Linen & Forest Sage tokens to all form inputs, select dropdowns, and dropzone.
- [ ] Verify 44px mobile touch targets and sticky action footer.
