# 4don-portfolio

Personal portfolio site to present my projects, experience, and contact information.
“Live: https://www.4don.com”

## Version History

### v1.8 — Content Translation & Structured Storytelling (next)
**Status:** Planned
**Focus:** Clean content separation, long-form translation, scalability

#### Planned Scope
- Introduce **language-specific content structure**
content/
de/
en/
- Migrate **About page** to structured DE / EN content
- Prepare project stories for Markdown-based content
- Keep templates language-agnostic
- Establish repeatable translation workflow for future pages


---

### v1.7 — Internationalization Foundation & UX Refinements (current)
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
  - Active language visually highlighted
- Added **SPA-like back navigation** for project pages
  - Restores scroll position
  - Restores search, tag filter and query state
- URL synchronization for Projects page
  - `?lang=`
  - `?q=` (search)
  - `?tag=` (filter)
  - Browser back/forward fully supported
- Refactored project detail styling
  - Extracted shared styles into `projects/_project-style.css`
  - Removed duplicated inline `<style>` blocks
- Improved SEO / Social sharing
  - Updated default OG image
  - Cleaned meta setup across pages

#### Technical Notes
- HTML5 UP *Massively* template adapted without breaking core structure
- No frameworks introduced (pure HTML / CSS / vanilla JS)
- Mobile navigation quirks accepted intentionally for v1.7
  - Minor layout differences in language switch on very small screens
  - Documented for later refinement

#### Known Limitations
- Long-form content still lives in HTML
- Language switch UI may slightly differ between desktop and mobile
- Content translation not yet completed (infrastructure only)


---

### v1.6.0 — Projects Refactor & SPA-like Back Navigation
**Release date:** 2026-01-29

**What changed**
- Extracted project detail page styling into a shared stylesheet: `/projects/_project-style.css`
- Replaced “Back to Projects” behavior with `history.back()` for natural navigation
- Added SPA-like restore on the projects overview: search + tag + scroll position survive “back”
- Updated OG default image reference (social preview)

**Why it matters**
- Project detail pages are now consistent and easier to maintain (no duplicated inline `<style>` blocks)
- “Back” feels like a real app: you return to the exact scroll position + filter state

**Notes**
- The state restore is session-based (`sessionStorage`) and only activates when navigating to marked project links.


---

### v1.5.1 — Project Detail Pages & Navigation Polishing
**What changed**
- Project detail pages present in `/projects/` (RMV Morning Display, Pi-hole, 4don Portfolio)
- “Back to Projects” UX refined (pre-refactor, still link-based)
- Continued hardening of dynamic projects rendering and card UI consistency

**Why it matters**
- Clear separation between overview (projects list) and detail content (project pages)


---

### v1.5.0 — Social Preview & Shareability (OG/Twitter)
**What changed**
- Added OG/Twitter meta tags across pages for proper social link previews
- Introduced default OG image reference (for consistent sharing visuals)

**Why it matters**
- Sharing 4don.com links now looks professional on LinkedIn / WhatsApp / iMessage / etc.


---

### v1.4 — Branding Consolidation (Dark/Purple Direction)
**What changed**
- Consolidated “4don Branding Tweaks” into the Massively CSS structure
- Continued aligning typography, spacing, and UI accents toward the dark/purple premium look

**Why it matters**
- Branding started to feel “designed”, not just “template customized”
- Cleaner maintainability: changes live in the right places (not random CSS overrides)


---

### v1.3 — Projects Page Hardening (Search/Tags/Badges)
**What changed**
- Solidified projects filtering/search behavior (title/description/tags)
- Tag dropdown + badges matured into a stable UX
- Improved robustness around empty states and project metadata

**Why it matters**
- The projects page became the “core navigation hub” of the portfolio


---

### v1.2 — PWA & SEO Baseline
**What changed**
- Added PWA/SEO groundwork: `site.webmanifest`, `theme-color`, Apple web-app meta
- Favicons and installability moved closer to “real product” quality

**Why it matters**
- 4don.com gained the fundamentals for modern browser integration (install / theming / share-ready)


---

### v1.1 — Major Projects Upgrade (Dynamic Data + Detail Pages)
**What changed**
- Big step forward for the projects system:
  - dynamic rendering from `projects.json`
  - sorting by date
  - search + tag filtering
  - badges instead of raw tag lists
  - optional GitHub button (only if link exists)
  - image fallback (missing path + 404 safe)
- Introduced project detail pages in `/projects/`

**Why it matters**
- Projects became data-driven and scalable: adding a new project no longer requires HTML duplication


---

### v1.0 — Massively Template Stabilization
**What changed**
- Stabilized the initial Massively-based site structure after the first template integration
- Ensured core pages and navigation behave consistently

**Why it matters**
- Created a clean foundation to build the dynamic projects system on top


---

### v0.1 — Switch to HTML5 UP Massively (Multi-Page Portfolio)
**What changed**
- Migrated from the initial prototype to the Massively template structure
- Introduced multiple pages (home / projects / about / contact + legal pages)
- Introduced the first dynamic project list approach via `projects.json` + `projects.js`

**Why it matters**
- The project moved from “idea/prototype” to an extensible portfolio structure


---

### v0.0 — Initial Prototype (First Idea)
**What changed**
- Very first concept: custom HTML/CSS/JS prototype
- Focused on validating content and layout direction before template adoption

**Why it matters**
- This was the “proof that the idea works” phase before investing into a full template system
