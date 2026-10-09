# Resolve X — UI Specification: Page 6 (Public Portal & Authentication System)
**File Target**: `src/pages/LandingPage.jsx` & `src/components/Auth.jsx`  
**Aesthetic Theme**: Option 3 — Warm Linen & Forest Sage  
**Design Philosophy**: Institutional trust, frictionless entry, unified authentication gateway.

---

## 1. Executive Summary & Problem Solving

### The Problem in Traditional CMS Portals:
* **The "Black Hole" Landing**: Cluttered with generic marketing jargon ("supercharge your future") rather than explaining how grievances are resolved and tracked.
* **Complex Multi-Step Sign In**: Confusing login forms that fail to clarify role-based access (Student vs. Staff vs. Administrator).
* **Glaring Dark/Neon Aesthetic**: Uncomfortable on mobile screens in daytime conditions.

### The Streamlined Resolve X Solution:
* **Trust-First Public Portal**: Warm linen canvas with crisp typographic hierarchy, direct CTAs (`[ Lodge a Complaint ]` and `[ Track Ticket Status ]`), and an interactive preview of the resolution workflow.
* **Unified Single-Card Auth Modal**: Smooth tab switching between `Sign In`, `Create Account`, and `Reset Password` with clear role badges and instant validation feedback.
* **Zero Marketing Clutter**: Replaces vague animations with fast, clean, content-first presentation.

---

## 2. Layout Structure & Wireframe

### A. Public Landing Page (`LandingPage.jsx`)
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Navbar: [ResolveX Logo]        Features   Workflow   Institutional Live SLA        [ Sign In ➔ ]│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Hero Section (Warm Linen Canvas & Deep Espresso Type)                                           │
│                                                                                                 │
│ Institutional Resolution,                                                                       │
│ Handled with Speed and Precision.                                                               │
│                                                                                                 │
│ Resolve X provides a transparent, accountable grievance and incident management platform       │
│ for campus facilities, residential communities, and corporate infrastructure.                   │
│                                                                                                 │
│ [ ＋ Lodge a Complaint Now ]       [ 🔍 Track an Existing Ticket ]                              │
│                                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ INTERACTIVE PLATFORM PREVIEW                                                                │ │
│ │ [ #CMS-2026-1001 ] · Water Pipe Leakage · Hostel Block B · SLA: 2h 15m · Dispatched (Active) │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3 Core Pillars (High Trust & Operational Rigor)                                                 │
│                                                                                                 │
│ 1. 60-Second Intake              2. Guaranteed SLA Timers         3. Transparent Sign-Off       │
│ Lodge issues with auto-category  Strict response deadlines with   Citizens confirm satisfaction │
│ detection and photo proof.       live breach escalation.          before tickets can close.     │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### B. Streamlined Authentication Gateway (`Auth.jsx`)
```
┌────────────────────────────────────────┐
│ ← Back to Home                         │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ ResolveX Institutional Gateway     │ │
│ │                                    │ │
│ │ [ (●) Sign In ]   [ ( ) Register ] │ │
│ ├────────────────────────────────────┤ │
│ │ Email Address                      │ │
│ │ [ student@campus.edu             ] │ │
│ │                                    │ │
│ │ Password                           │ │
│ │ [ ••••••••••••••                👁 ] │ │
│ │                                    │ │
│ │ [ Forgot your password? ]          │ │
│ │                                    │ │
│ │ [ Sign In to Workspace ➔ ]         │ │
│ └────────────────────────────────────┘ │
│ 🛡 Protected by Institutional SSO & 256-bit Encryption│
└────────────────────────────────────────┘
```

---

## 3. Streamlined Component Breakdown

### Component 1: Public Navbar (`Navbar.jsx`)
* **Features**:
  - Sticky glass header with subtle stone border (`#e7e5e4`).
  - Brand Logo + Organization switcher.
  - Direct action button: `[ Sign In ➔ ]` (Forest Sage button).

### Component 2: Hero & Live Platform Demonstration
* **Features**:
  - 36px Display Title in Warm Espresso (`#1c1917`).
  - 2 Primary Actions: "Lodge a Complaint" and "Track an Existing Ticket".
  - Live Resolution Timeline demonstration preview showing real ticket workflow.

### Component 3: Unified Single-Card Auth Gateway (`Auth.jsx`)
* **Features**:
  - 420px centered card on warm linen canvas.
  - Segmented control to switch between `Sign In` and `Register`.
  - Role selection chips (Student / Resident / Staff / Administrator) during registration.
  - Accessible password reveal toggle (`Eye` / `EyeOff` icons).
  - High-visibility error callout box with clear error recovery steps.

---

## 4. Design Token Mappings

| Element | CSS Variable / Class | Warm Linen & Sage Value |
| :--- | :--- | :--- |
| **Landing Canvas** | `--app-bg` | `#faf8f5` (Warm Linen 100) |
| **Auth Card Surface** | `--app-surface` | `#ffffff` (Pure White panel) |
| **Card Border** | `--app-border` | `#e7e5e4` (Stone 200) |
| **Hero Title** | `--app-text` | `#1c1917` (Warm Espresso) |
| **Hero Subtitle** | `--app-text-secondary` | `#57534e` (Stone 700) |
| **Primary CTA** | `--app-accent` | `#0f766e` (Deep Forest Sage button) |
| **Secondary CTA** | `.btn-secondary` | `#ffffff` surface, `#e7e5e4` stone border |
| **Auth Error Alert**| `.auth-error` | `#ffe4e6` surface, `#be123c` text |

---

## 5. Responsive Mobile Transformations (< 640px)

1. **Hero Section**: Headline adjusts to `26px`; CTAs stack vertically into full-width touch buttons.
2. **Navbar**: Collapses into a clean mobile hamburger drawer.
3. **Auth Card**: Expands to `100%` viewport width with 16px fluid padding and 44px input touch targets.

---

## 6. Implementation Checklist for Page 6

- [ ] Align Landing Page colors to Warm Linen & Forest Sage tokens.
- [ ] Connect Hero CTAs to `/complaints/new` and `/track`.
- [ ] Implement single-card `<AuthGateway />` with smooth mode toggle.
- [ ] Ensure 44px mobile touch targets and full keyboard accessibility.
