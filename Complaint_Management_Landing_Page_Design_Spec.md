# Complaint Management System Landing Page Design Specification

## Vision

Create a premium enterprise SaaS landing page inspired by Apple, Linear,
Stripe, Arc, and Notion.

**Core principle:** The website tells a product story. Motion supports
understanding; it never distracts.

------------------------------------------------------------------------

# Global Design System

## Theme

-   Absolute black background (#000000)
-   Premium minimalist aesthetic
-   Large whitespace
-   Enterprise-grade trust
-   Glassmorphism only where meaningful
-   No visual clutter

## Layout

-   Max content width: 1280--1440px
-   12-column responsive grid
-   Hero split:
    -   Left: 40% marketing content
    -   Right: 60% animated illustration

## Typography

Use a single font family (Inter or Manrope).

  Role              Size
  ----------------- ----------
  Hero              72--88px
  Section Heading   52--60px
  Subheading        24px
  Body              18px
  Small             16px

Use consistent spacing and hierarchy.

------------------------------------------------------------------------

# Motion Philosophy

## The world is static.

Only meaningful elements animate.

Allowed: - Opacity - Translate Y - Mask reveal - Clip reveal -
Horizontal scroll - Small hover scale (1 → 1.02)

Never use: - Bounce - Spin - Elastic - Camera movement - Continuous
floating - Random particles - Flashy glow

------------------------------------------------------------------------

# Section 1 --- Hero (100vh)

Background: - Approved workflow animation - Full viewport - Autoplay -
Loop - Muted - No controls

Layout:

Left: - Headline - Description - Register Complaint CTA - Track
Complaint CTA

Right: - Existing animated workflow

Navigation: - Logo (left) - Features - Workflow - Pricing (optional) -
Login - Register

Hero headline example:

> Every Complaint. Structured Into Resolution.

Transition: - Hero remains visible while scrolling. - Fade smoothly into
next section.

------------------------------------------------------------------------

# Section 2 --- The Problem

Headline: "Why traditional complaint systems fail."

Three large cards: - Lost Requests - Manual Tracking - Slow Resolution

Animation: Fade + translateY only.

------------------------------------------------------------------------

# Section 3 --- The Solution

Headline:

"One Platform. Every Department. Complete Transparency."

Large browser showcase.

Horizontal scroll-driven gallery.

No autoplay.

------------------------------------------------------------------------

# Section 4 --- Complaint Workflow

Interactive timeline.

Citizen ↓

AI Verification ↓

Department ↓

Officer ↓

Resolution ↓

Citizen Notification

As the user scrolls: - timeline reveals - connecting line grows - nodes
activate

------------------------------------------------------------------------

# Section 5 --- Features

One feature per viewport.

Large heading.

Large supporting image.

Examples: - AI Categorization - Department Routing - Live Status
Tracking - SLA Monitoring - Citizen Notifications

Minimal animation.

------------------------------------------------------------------------

# Section 6 --- Dashboard Showcase

Sticky browser frame.

Scroll updates dashboard content.

Browser stays fixed.

Content changes.

No camera motion.

------------------------------------------------------------------------

# Section 7 --- Statistics

Counters animate once.

Examples: - 98% Resolution Accuracy - 12K+ Complaints Processed - 2.1
Day Average Resolution - 18 Departments

------------------------------------------------------------------------

# Section 8 --- Testimonials

Large horizontal snapping carousel.

Manual interaction only.

Glass cards.

No autoplay.

------------------------------------------------------------------------

# Section 9 --- FAQ

Minimal accordion.

Large spacing.

Soft transitions.

------------------------------------------------------------------------

# Final CTA

Headline:

"Ready to modernize complaint management?"

Buttons: - Get Started - Book Demo

Subtle hero video visible behind section.

------------------------------------------------------------------------

# Footer

Minimal.

Include: - Product - Company - Resources - Contact - Social Links

------------------------------------------------------------------------

# Scroll Behavior

Every section: - opacity: 0 → 100% - translateY: 40px → 0

Duration: 300--600ms.

Use easing that feels calm.

------------------------------------------------------------------------

# Carousel Rules

-   Manual drag
-   Mouse wheel horizontal support
-   Snap scrolling
-   No autoplay
-   Smooth momentum

------------------------------------------------------------------------

# Performance

-   Lazy load assets
-   Poster image for hero video
-   Respect prefers-reduced-motion
-   GPU-friendly transforms
-   Optimize video for web

------------------------------------------------------------------------

# Strict Design Rules

## Must Do

-   Maintain premium enterprise feel.
-   Keep generous whitespace.
-   Use consistent typography.
-   Preserve the user's approved hero animation.
-   Ensure every section has one clear purpose.
-   Keep visual hierarchy simple.

## Must Not Do

-   No neon cyberpunk style.
-   No excessive glass effects.
-   No unnecessary gradients.
-   No random floating objects.
-   No distracting animations.
-   No clutter.
-   No multiple competing focal points.
-   No redesign of the approved hero illustration.

------------------------------------------------------------------------

# Overall Experience

The landing page should feel like a product keynote, not a template.

The visitor should understand: 1. The problem. 2. The solution. 3. The
workflow. 4. The product capabilities. 5. Why they should trust the
platform.

The animation should support this narrative while remaining subtle and
premium.
