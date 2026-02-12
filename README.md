# 4don-portfolio

Personal portfolio site to present my projects, experience, and contact information.
Live: https://www.4don.com

------------------------------------------------------------------------

# Version History

------------------------------------------------------------------------

## v1.9.1 — TOC Refinement & Scroll Behavior Stabilization

**Status:** UX refinement
**Focus:** Improve desktop TOC behavior without affecting original Massively navigation

### 📑 Desktop TOC Improvements

- Implemented proper sticky sidebar behavior
- TOC now:
  - stays reachable while scrolling
  - scrolls internally if content exceeds viewport height
  - keeps correct offset below top navigation
- Fixed incorrect anchor jump behavior
- Added smooth scroll with header-aware offset
- Stabilized deep-link handling inside <details> sections

### 📱 Mobile TOC Stability

- Fully aligned with Massively’s native panel system
- Uses #tocPanel with proper slide-in behavior
- Prevented unwanted dimming of page background
- Ensured auto-close when clicking internal anchors
- Preserved original #navPanel behavior

### 🧠 Layout Fixes & Conflict Resolution

- Removed TOC-related CSS from main.css
- Scoped all TOC styling to:
  - /projects/_project-style.css
- Resolved position: fixed conflicts
- Fixed #wrapper { overflow: hidden; } sticky interaction
- Ensured no interference with original Massively navigation behavior

### 🎨 TOC Typography Refinement

- Reduced overall font size
- Clear hierarchy:
  - Section titles (stronger)
  - Chapter items (smaller, lighter)
- Improved spacing + readability
- Active-state highlight stabilized across sidebar + panel

### Why v1.9.1 Matters

- v1.9 delivered the architectural foundation.
- v1.9.1 ensures the experience matches that architecture.
  - Cleaner behavior
  - No layout side-effects
  - No template regressions
  - Better long-form readability

---

## v1.9 --- Structured Project Content Model & Listing Generator

**Status:** Architecture complete (content migration in progress)\
**Focus:** Transform project pages from HTML-driven to data-driven
structured content

### What changed

### 🧱 Structured Project Content Model

-   Introduced a **single-source-of-truth architecture**
    -   `content/{lang}/projects/<slug>.json`
-   Each project now contains:
    -   `card` (listing data)
    -   `meta` (detail page header + SEO)
    -   `sections` (structured content)
-   Removed large `bodyHtml` strings
-   Introduced section-based writing model:
    -   `section`
    -   `text`
    -   `list`
    -   `steps`
    -   `checklist`
-   Supports collapsible sections and deep-linkable IDs

### ⚙ Listing Generator

-   Implemented Node-based generator:

        tools/generate-project-cards.mjs

-   Automatically builds:

    -   `content/de/projects.cards.json`
    -   `content/en/projects.cards.json`

-   Supports:

    -   `visibility: public | private`
    -   `pinned: true`
    -   automatic URL generation
    -   date-based sorting
    -   validation warnings

### 🌍 Clean i18n Separation

-   Unified structure:
    -   `projects.list.*`
    -   `projects.detail.*`
-   Added proper fallback for JS-disabled state
-   Removed legacy key inconsistencies

### 🧹 Cleanup

-   Removed legacy `projects.json` references

-   Removed inline scroll-restore script (handled by `projects.js`)

-   Normalized projects.html structure and formatting

-   Added full documentation:

        docs/project-content-model.md

### Why v1.9 matters

v1.9 completes the architectural shift from:

HTML-driven project pages\
→\
Data-driven, structured, translation-friendly content.

Projects are now: - Maintainable - Extensible - Internationalizable -
Versionable - Cleanly separated from layout

---

### v1.8 — Content Translation & Page Localization (released)
**Status:** Released
**Focus:** Turn the i18n foundation into real bilingual content (DE/EN) without over-optimizing UI

#### Highlights
- Introduced a **language-specific content layer** (`content/de` + `content/en`)
- Migrated core pages to content-driven translation
  - Home / About / Contact
  - Legal pages (Imprint + Privacy) prepared for localized content
- Implemented **project detail page localization** (first working iteration)
  - Project pages can load content per language
  - Fixed path handling for project pages living under `/projects/`
- Improved release robustness by keeping templates mostly language-agnostic
  - HTML stays stable
  - Content + meta text moves into language files / loaders

#### Why it matters
- v1.8 is the first version where the site is not only “i18n-ready” but actually bilingual.
- A repeatable translation approach exists for new pages.
- The project pages proved the concept, but also revealed what needs improvement in v1.9 (authoring friction due to escaped HTML-in-JSON).

#### Known Limitations
- Project page authoring is still “developer-style” (large JSON-escaped HTML strings)
- Project translations will be improved after the new v1.9 content model is defined
- Minor UI polish intentionally postponed (focus on scalable translation first)

---

### v1.7 — Internationalization Foundation & UX Refinements
**Status:** Stable
**Focus:** Infrastructure, refactoring, i18n groundwork

#### Highlights
- Introduced full **DE / EN language infrastructure**
  - Language resolution priority: URL → localStorage → browser
  - Persistent language state across pages
  - Shareable URLs via `?lang=de|en`
- Implemented **language toggle (desktop + mobile)**
  - Desktop: pill-style switch integrated into navigation
  - Mobile: border-only variant inside off-canvas nav panel
- Added **SPA-like back navigation** for projects
  - Restores scroll position
  - Restores search, tag filter and query state
- URL synchronization for Projects page
  - `?lang=` / `?q=` / `?tag=` + back/forward support
- Refactored project detail styling into `/projects/_project-style.css`
- Improved SEO / social sharing
  - Updated default OG image
  - Cleaned meta setup across pages

#### Known Limitations
- Long-form content still lived in HTML
- Language switch UI differences on very small screens (accepted for now)

---

### v1.6.0 — Projects Refactor & SPA-like Back Navigation
**Release date:** 2026-01-29

**What changed**
- Shared stylesheet for project pages: `/projects/_project-style.css`
- Natural back behavior via `history.back()` for detail pages
- SPA-like restore on the projects overview (search + tag + scroll)

**Why it matters**
- Consistent project pages without duplicated inline styles
- Back navigation feels “app-like”

---

### v1.5.1 — Project Detail Pages & Navigation Polishing
**What changed**
- Introduced project detail pages under `/projects/`
- Continued hardening of dynamic projects rendering

---

### v1.5.0 — Social Preview & Shareability (OG/Twitter)
**What changed**
- OG/Twitter meta tags across pages
- Default OG image for consistent previews

---

### v1.4 — Branding Consolidation (Dark/Purple Direction)
**What changed**
- Consolidated branding tweaks into the Massively CSS structure
- Improved typography + spacing consistency

---

### v1.3 — Projects Page Hardening (Search/Tags/Badges)
**What changed**
- Mature filtering/search behavior
- Tag dropdown + badges stabilized
- Robust empty/error states

---

### v1.2 — PWA & SEO Baseline
**What changed**
- Added `site.webmanifest`, `theme-color`, Apple web-app meta
- Favicons + installability improvements

---

### v1.1 — Major Projects Upgrade (Dynamic Data + Detail Pages)
**What changed**
- Dynamic rendering from `projects.json` + `projects.js`
- Sorting, search, tag filtering, badges, GitHub button, image fallback
- Introduced `/projects/` detail pages

---

### v1.0 — Massively Template Stabilization
**What changed**
- Stabilized initial Massively-based site structure
- Consistent navigation + page layout

---

### v0.1 — Switch to HTML5 UP Massively (Multi-Page Portfolio)
**What changed**
- Migrated from prototype to Massively
- Multi-page setup + early dynamic projects concept

---

### v0.0 — Initial Prototype (First Idea)
**What changed**
- First HTML/CSS/JS prototype to validate direction

---

## Tracked ToDos (for upcoming versions)
- Contact page: finalize the form setup and UX polish
- Improve Formspree mail output (subject, reply-to, meta information)
- Language switch button: design refinement + consistent behavior on small screens
- Project pages: rework content format to remove JSON-escaped authoring friction
- Project page translations after the new v1.9 structure is defined
