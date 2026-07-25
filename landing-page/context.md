# Demo Pharma - Front-End Architecture

This document describes the modular, industrial-grade architecture of the Demo Pharma web platform. The codebase has been organized to scale easily, enforce strict separation of concerns, and minimize load-time cascades.

---

## 📂 Project Structure

```
Demo-vv/
├── public/              # Static assets
│   ├── india.svg        # Scalable geographical vector map of India
│   ├── robots.txt       # Search engine crawler instructions
│   └── sitemap.xml      # Index of crawlable client-side routes
│
├── scripts/             # Data migration and developer tools
│   └── importProducts.ts # Bulk Excel-to-Firestore product parser & uploader
│
├── src/
│   ├── components/      # Reusable UI component blocks
│   │   ├── canvas/
│   │   │   └── ThreeMoleculeCanvas.tsx  # 3D glass India map and radar beacon renderer
│   │   └── layout/
│   │       ├── Header.tsx   # Global site navigation & contact shortcuts
│   │       ├── Footer.tsx   # Site-map, contacts, and legal info
│   │       └── MetaSEO.tsx  # Programmatic SEO & JSON-LD injection engine
│   │
│   ├── core/            # Immutable parameters, types, and services
│   │   ├── constants/
│   │   │   └── data.ts      # Static constants and fallback data structures
│   │   ├── store.tsx        # Pub-sub state manager & database actions
│   ├── supabase.ts      # Supabase client SDK initialization
│   │
│   ├── types/
│   │   └── index.ts     # Centralized TypeScript interface declarations
│   │
│   ├── features/        # Dynamic business-logic module domains (lazy loaded)
│   │   ├── about/       # Pillar overviews, historical highlights, & timeline
│   │   ├── contact/     # FAQ desk & dynamic form submissions
│   │   ├── home/        # Hero banner, 3D interactive stage, news & reviews
│   │   ├── partner/     # Channel partner onboarding & SLA evaluation
│   │   ├── products/    # Memoized search index & catalog browsing grid
│   │   ├── quality/     # 4-tier QA/QC auditing specifications
│   │   └── terms/       # Terms, conditions, payment, & private labeling policies
│   │
│   ├── styles/
│   │   └── main.css     # Tailored styling rules & CSS variables
│   │
│   ├── App.tsx          # Client-side router, global layouts, and scroll hooks
│   └── main.tsx         # Direct DOM mount & React entrypoint
```

---

## 🛠️ Module Descriptions

### 1. Core Module (`src/core/`)
* **Types (`src/core/types/index.ts`)**: Declares unified TypeScript models (e.g., `ProductItem`, `NewsArticle`, `PageKey`).
* **Constants (`src/core/constants/data.ts`)**: Acts as the local source of truth and offline fallback database for segments, stats, and corporate information.
* **Supabase Service (`src/core/supabase.ts`)**:
  * Initializes the connection to the Supabase client using public environment variables. Swaps dynamically between postgres queries and local/static fallbacks.
* **Pub-Sub Store (`src/core/store.tsx`)**:
  * Implements a lightweight global state manager via pub-sub pattern to avoid Context-based re-rendering waterfalls.
  * Handles loading `products` and `news` from Supabase tables into the application store, and posting partner onboarding applications or inquiries.

### 2. Components (`src/components/`)
* **Canvas (`src/components/canvas/ThreeMoleculeCanvas.tsx`)**: An interactive 3D WebGL showcase mapping India's coordinates dynamically using `SVGLoader`. Renders extruded glass states, custom navy borders, and pulsating radar beacons at Gujarat centers (Ahmedabad, Vadodara, Ankleshwar). Leverages `ResizeObserver` for responsive scaling and an `IntersectionObserver` to pause frames when scrolled off-screen.
* **Layout (`src/components/layout/`)**:
  * `Header.tsx` / `Footer.tsx`: Controls navigation triggers, segment quick-links, and contact anchors.
  * `MetaSEO.tsx`: A headless component monitoring route changes to update programmatic metadata (`title`, description, keywords, canonical URLs, Open Graph tags, and Twitter Cards) and inject structured JSON-LD schemas.

### 3. Features Module (`src/features/`)
* **`home`**: Integrates the hero overlay, the 3D map canvas, animated counters for stats, a Client Reviews grid, and the latest press dossiers.
* **`about`**: Outlines corporate pillars, historical paths, and operational parameters.
* **`products`**: Supports memoized client-side search (matching compound names, composition, and clinical indications) alongside dosage form filters.
* **`partner`**: Handles corporate partnership registration, including a multi-step wizard, custom document uploads, and SLA tracking.
* **`quality`**: Describes HPLC analysis, chromatography audits, and zero-defect QA certifications.
* **`contact`**: Coordinates department routing and maps inquiry messages directly to Supabase db transactions.
* **`terms`**: Displays the commercial, logistics, and manufacturing terms of service.

---

## ⚡ Technical Standards & Performance

* **Lazy Loading**: Views are code-split via React `lazy` and `Suspense` in `src/App.tsx`, preventing heavy dependencies (like Three.js or lucide-react) from delaying the Initial Paint and LCP.
* **Storage Caching Layer**: Queries are dynamically fetched from the Supabase PostgreSQL database if configured, falling back to static local JSON arrays in offline/simulation mode.
* **Direct Path Aliasing**: Uses `@/src/*` TSConfig configurations to maintain clean path resolutions.
* **SEO Compliance**: Programs technical metadata, dynamic page titles, unique HTML identifiers, and JSON-LD schema (e.g. `MedicalOrganization`, `FAQPage`, `CollectionPage`) on every route change, combined with a static `sitemap.xml` and `robots.txt` configuration.
* **App Preloader**: An inline critical CSS loader is configured inside `index.html` to prevent blank white screens during initial JS bundle fetch.
* **Data Ingestion (`scripts/importSurgicals.ts`)**: Excel spreadsheet catalog items are parsed using `xlsx`, mapped to standard database formats, and uploaded to Supabase PostgreSQL tables in batch transactions.
