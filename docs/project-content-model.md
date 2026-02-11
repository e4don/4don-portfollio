# Project Content Model (v1.9)

This document defines the v1.9 content model for project detail pages and the workflow to generate the project listing cards.

## Goals

- Write projects like documents, not like code
- No JSON-escaped HTML
- Clean separation of:
  - **Content** (per project JSON)
  - **Renderer/UI** (shared JS + HTML template)
- Avoid double maintenance:
  - Use project JSON as **single source of truth**
  - Generate `projects.cards.json` automatically

---

## Folder Structure

Projects listing (root):
- `projects.html` (listing page)

Project detail template:
- `projects/project.html` (single template for all projects)
- URL pattern: `projects/project.html?slug=<slug>`

Project content:
- `content/de/projects/<slug>.json`
- `content/en/projects/<slug>.json`

Generated listing files (build artifacts):
- `content/de/projects.cards.json`
- `content/en/projects.cards.json`

Notes:
- Files starting with `_` are ignored by the generator (examples/drafts).
- `visibility: "private"` projects are not listed.

---

## card (Listing data)
Used for: projects.html (project cards)

Required::
- title (string)
- date (string: YYYY-MM or YYYY-MM-DD)
- description (string)
- image (string, relative path)
- tags (array of strings)

Optional:
- github (string URL, empty if none)
- visibility (public | private #visibility: "private" → not listed)
- pinned (boolean, default false)

Important:
- url is NOT stored here.
The generator computes it automatically:
projects/project.html?slug=<slug>

---

## meta (Detail header + SEO + hero)
Used for: projects/project.html

Common fields:
- title, subtitle, description
- date (optional)
- status (recommended values: active, wip, archived)
- hosting, stack, content (strings)
- cover.src should usually be relative to /projects/ (template location).
  Example:
  - ../assets/images/projects/4don-portfolio.png

Links:
- links.live (optional)
- links.github (optional)
  If a link is missing, the button will be hidden automatically.

---

## sections (Content structure)
A project consists of multiple sections.
Each section can be collapsible (<details> behavior).

Section object:
{
  "type": "section",
  "id": "story",
  "title": "Story",
  "collapsible": true,
  "defaultOpen": true,
  "chapters": []
}

Fields:
- type: must be "section"
- id: string (recommended)
  Used for anchors + TOC + deep links
  Example: #story
- title: string
- collapsible: boolean
- defaultOpen: boolean
- chapters: array

### Deep links / IDs
Chapters can have IDs, too.
The renderer builds combined IDs:
- Section: id="story"
- Chapter: id="motivation"
- Combined anchor: #story-motivation

This allows:
- TOC links
- shareable URLs
- opening a collapsed section automatically when navigating via hash

---

## Chapter types
1) text
Paragraphs as an array

{
  "type": "text",
  "id": "motivation",
  "title": "Motivation",
  "body": ["Paragraph 1", "Paragraph 2"]
}

2) list
Bullet list

{
  "type": "list",
  "id": "features",
  "title": "Features",
  "items": ["Item A", "Item B"]
}

3) steps
Ordered steps (label + text)

{
  "type": "steps",
  "id": "setup",
  "title": "Setup",
  "steps": [
    { "label": "Step 1", "text": "Do this…" },
    { "label": "Step 2", "text": "Do that…" }
  ]
}

4) checklist
Task list (done true/false)

{
  "type": "checklist",
  "id": "roadmap",
  "title": "Roadmap",
  "items": [
    { "text": "First milestone", "done": true },
    { "text": "Next milestone", "done": false }
  ]
}

---

## Authoring workflow: Adding a new project

1. Create two files:
- content/de/projects/<slug>.json
- content/en/projects/<slug>.json

2. Fill card, meta, and sections.

3. Generate listing cards:
- Run the generator script to create:
  content/de/projects.cards.json
  content/en/projects.cards.json

4. Open projects.html and verify:
- Card appears
- Sorting is correct
- Clicking opens:
  projects/project.html?slug=<slug>

---

## Generate projects.cards.json

Requirement

Node.js is needed locally (only for generating cards).
This does NOT affect the deployed website.

Run (no PATH required):
$node = "C:\path\node\node.exe"
& $node tools\generate-project-cards.mjs


Output:
- content/de/projects.cards.json
- content/en/projects.cards.json

Notes:
- Files starting with _ are ignored
- visibility: "private" projects are skipped
- pinned: true projects are sorted at the top

---

## Project JSON: Overview

Each project file MUST contain:

- `card` (listing card data)
- `meta` (detail page header/hero/seo data)
- `sections` (content structure)

### Minimal template

```json
{
  "card": {
    "title": "Project title",
    "date": "2026-02",
    "description": "Short listing text…",
    "image": "assets/images/projects/example.png",
    "tags": ["Tag A", "Tag B"],
    "github": "",
    "visibility": "public",
    "pinned": false
  },
  "meta": {
    "title": "Project title",
    "subtitle": "Short subtitle…",
    "description": "SEO description…",
    "date": "2026-02-05",
    "tags": ["optional", "seo", "tags"],
    "status": "active",
    "hosting": "Cloudflare Pages",
    "stack": "HTML / CSS / Vanilla JS",
    "content": "JSON → UI",
    "cover": { "src": "../assets/images/projects/example.png", "alt": "Cover alt text" },
    "links": { "live": "../index.html", "github": "https://github.com/..." }
  },
  "sections": []
}
