# UI Color & Design Polish Audit Report
**ResolveX Enterprise Complaint Management Workspace**  
**Audit Target:** `http://localhost:5173` (Logged-In & Authenticated States)  
**Design Standard Benchmark:** Cal.com & Dub.co Executive Standard (Stone 50 Canvas `#faf8f5`, Crisp White Cards `#ffffff`, Hairline Borders `#e7e5e4`, Deep Obsidian Brand `#18181b`)

---

## 1. Executive Summary & Audit Scorecard

Following authenticated session inspection across all core views using automated browser captures, this audit identifies visual design, contrast, and layout issues across the application.

While the core migration to the **Stone & Obsidian palette** established a clean architectural foundation, several defects were uncovered across hero media, form inputs, badges, empty states, and card layouts.

| Issue # | Area | Severity | Problem Summary |
| :---: | :--- | :---: | :--- |
| **1** | **Landing Page Hero & Nav** | 🔴 Critical | Dark brand logo and hero headline/subtitle (`#1c1917`) on dark 3D video/navbar background — near-zero contrast. |
| **2** | **Admin Staff Roster** | 🔴 Critical | Missing avatar dimensions causing full-resolution staff photos to expand across entire cards behind text. |
| **3** | **Global Form Controls** | 🟡 High | Inputs, selects, and textareas use a murky beige fill (`var(--app-inset)` / `#efece6`) instead of crisp white surfaces (`#ffffff`). |
| **4** | **Badge Color Hierarchy** | 🟡 High | Medium priority uses bright blue (`#2563eb`), clashing with Amber (High) and Crimson (Urgent); header `CUSTOM` pill uses legacy indigo (`#6366f1`). |
| **5** | **Empty State Polish** | 🟢 Medium | Wireframe-like dashed borders (`1px dashed`) on empty states across Complaints and Tracker instead of solid hairline cards. |
| **6** | **Ticket Tracker Polish** | 🟢 Medium | Completed stage pills use overly saturated mint green (`#d1fae5`); discussion bubbles use muddy grey fills and generic labels. |
| **7** | **Staff Queue Layout** | 🟢 Medium | Ticket header chips wrap unpredictably with mismatched heights; inline status dropdown blends into card footer. |
| **8** | **Admin Analytics Semantics** | 🟢 Medium | Analytics displays `0%` Resolution Rate in vibrant emerald green (`#059669`) with an upward green arrow. |

---

## 2. Issue 1: Landing Page Hero & Navbar Contrast (Critical)
* **Location**: `src/styles/landing.css`
* **Symptoms**:
  - Top fixed navbar background is dark `rgba(11, 13, 18, 0.82)`, but `.lx-logo` and `.lx-nav-links a` use `--lx-text` (`#1c1917`) and `--lx-text-secondary` (`#57534e`), rendering the logo and navigation links virtually invisible.
  - The hero title *"Every complaint. Structured into resolution."* and subtitle overlay directly on the dark 3D cinematic video with dark charcoal text.
  - The secondary CTA button *"Track Complaint"* uses a faint outline that washes out against the video backdrop.
* **Fix**:
  - Provide explicit high-contrast white styling for `.lx-navbar .lx-logo` (`#ffffff`) and nav links (`rgba(255, 255, 255, 0.8)`).
  - Explicitly style `.lx-hero-title` as `#ffffff` and `.lx-hero-desc` as `rgba(255, 255, 255, 0.85)` with subtle text shadows for legibility over media.
  - Upgrade `.lx-hero-actions .lx-btn-ghost` with a frosted border (`rgba(255, 255, 255, 0.3)`) and white text.

---

## 3. Issue 2: Staff Roster Avatar Layout in Admin Departments (Critical)
* **Location**: `src/pages/AdminDepartments.jsx` and `src/styles/app.css`
* **Symptoms**:
  - In `AdminDepartments.jsx`, staff cards render `<img src={staff.avatar} className="user-avatar-img" />` inside `<span className="avatar-wrapper">`.
  - Because `.avatar-wrapper` and `.user-avatar-img` have no styling in `app.css`, avatars expand to full image dimensions across the entire card, placing text directly on top of resolvers' faces.
* **Fix**:
  - Add `.avatar-wrapper { display: inline-flex; width: 42px; height: 42px; border-radius: 9999px; overflow: hidden; position: relative; flex-shrink: 0; }`
  - Add `.user-avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; display: block; }`

---

## 4. Issue 3: Global Form Controls (High)
* **Location**: `src/styles/app.css`
* **Symptoms**:
  - All form controls (`input[type='text']`, `select`, `textarea`, etc.) have `background-color: var(--app-inset)` (`#efece6` / `#f4f0ea`), making inputs look sunken, dim, and unpolished.
  - Low-contrast placeholder text (`#9ca3af`) against the beige fill.
* **Fix**:
  - Update inputs to Cal.com / Dub.co standard: `background-color: #ffffff; border: 1px solid var(--app-border, #e7e5e4); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);`.
  - On focus: `border-color: var(--app-text); box-shadow: 0 0 0 1px var(--app-text);`.
  - Set placeholder text to clear neutral `#a1a1aa`.

---

## 5. Issue 4: Priority & Badge Color Hierarchy (High)
* **Location**: `src/styles/app.css` and `src/index.css`
* **Symptoms**:
  - `.priority-medium` uses bright blue (`#2563eb`), making Medium tickets more visually intense than High priority amber tickets.
  - Header `.brand-badge` uses legacy indigo pill (`rgba(99, 102, 241, 0.15)`).
* **Fix**:
  - Re-tune `.priority-medium` to a calm neutral stone badge (`background: #f5f5f4; color: #57534e; border: 1px solid #e7e5e4;`).
  - Update `.brand-badge` to a clean subtle stone pill matching the Cal.com aesthetic.

---

## 6. Issue 5: Empty States Polish (Medium)
* **Location**: `src/styles/app.css`
* **Symptoms**:
  - `.empty-state` uses `border: 1px dashed var(--app-border)`, which looks like a wireframe draft rather than a finished product.
* **Fix**:
  - Change to solid hairline card: `border: 1px solid var(--app-border); background: var(--app-card); box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03);`.

---

## 7. Issue 6: Ticket Tracker & Resolution Journey Polish (Medium)
* **Location**: `src/pages/TicketTracker.jsx` and `src/styles/app.css`
* **Symptoms**:
  - Completed stage pills use saturated mint green (`#d1fae5`).
  - Discussion chat bubbles use muddy beige boxes (`#efece6`).
* **Fix**:
  - Tone completed stage cards to a calm emerald accent (`#15803d` text with subtle border and white/tint surface).
  - Clean chat bubbles to crisp white cards for user and subtle stone for staff notes.

---

## 8. Issue 7: Staff Queue Header Alignment & Footer Controls (Medium)
* **Location**: `src/styles/app.css`
* **Symptoms**:
  - Multiple header chips (`SLA Exceeded`, `Priority`, `Status`) wrap inconsistently with varied line-heights.
  - Inline `"Set status:"` select blends into the card footer.
* **Fix**:
  - Standardize badge heights and vertical flex alignment in `.ticket-card-header`.
  - Use crisp white background for inline status selector.

---

## 9. Issue 8: Admin Analytics Semantics (Medium)
* **Location**: `src/pages/AdminAnalytics.jsx`
* **Symptoms**:
  - `0%` Resolution Rate renders in vibrant emerald green with an upward arrow.
* **Fix**:
  - When rate is 0%, render in neutral charcoal (`var(--app-text)`) without the positive green highlight.
