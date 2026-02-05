# Project Content Model (v1.9)

Goal: Project pages should feel like writing documents, not building HTML-in-JSON.

## File location
- content/de/projects/{slug}.json
- content/en/projects/{slug}.json

## Structure

### meta (required)
- title: string
- date: YYYY-MM-DD
- tags: string[]

### meta (optional)
- subtitle: string
- status: "active" | "wip" | "archived"
- links: { github?: string, live?: string }
- cover: (reserved for later)

### sections (array)
Author-friendly ordered list of sections. Each section has:
- type: string (required)
- title: string (optional)
- content field(s) depending on type

## Supported section types (v1.9)
### text
- body: string[] (paragraphs)

### list
- items: string[]

### steps
- steps: { label: string, text: string }[]

### checklist
- items: { text: string, done: boolean }[]

### section (container)
- id: string (optional, recommended)
- title: string (required)
- collapsible: boolean (optional)
- defaultOpen: boolean (optional)
- chapters: chapter[] (required)

### chapter (content)
Common fields:
- type: "text" | "list" | "steps" | "checklist"
- id: string (optional, recommended)
- title: string (optional)

IDs are used for deep linking and must be stable and language-agnostic.
