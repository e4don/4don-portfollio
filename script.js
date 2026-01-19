/* 4don.com – working bilingual content + project rendering + nav active state (matches current index.html) */

const $  = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

const STORAGE_KEY = "4don_lang";

const I18N = {
  de: {
    nav_projects: "Projekte",
    nav_about: "Über mich",
    nav_contact: "Kontakt",

    pill_role: "Automation Engineer",
    topics: "Raspberry Pi · Smart Home · Networking · Homelab",

    hero_title: "Hi, ich bin Erik 👋",
    hero_lead:
      "Ich baue gern pragmatische Automations- und Tech-Projekte, die im Alltag wirklich funktionieren. Hier sammle ich meine Highlights – minimalistisch, schnell und ohne Buzzword-Overkill.",
    hero_note: "Tipp: Diese Seite ist statisch (Cloudflare Pages) — schnell, günstig, robust.",
    cta_projects: "🚀 Projekte ansehen",

    projects_title: "Projekte",
    projects_sub: "Ausgewählte Dinge, die ich gebaut, optimiert oder automatisiert habe.",

    about_title: "Über mich",
    about_text:
      "Ich mag: \"klarer Plan, saubere Umsetzung\". Fokus auf robuste Lösungen, die auch nach Monaten noch laufen — und nicht nur im Screenshot gut aussehen.",
    stack_title: "Stack / Tools",

    contact_title: "Kontakt",
    contact_text: "Schreib mir gern:",
    contact_note: "(Formular optional — kommt später, wenn du willst.)",

    footer_right: "Deployed with Cloudflare Pages",

    projButtons: { demo: "Demo", repo: "GitHub", docs: "Docs" }
  },

  en: {
    nav_projects: "Projects",
    nav_about: "About",
    nav_contact: "Contact",

    pill_role: "Automation Engineer",
    topics: "Raspberry Pi · Smart Home · Networking · Homelab",

    hero_title: "Hi, I’m Erik 👋",
    hero_lead:
      "I build pragmatic automation and tech projects that work in everyday life. Here I collect some highlights — minimal, fast and without buzzword overload.",
    hero_note: "Tip: This site is static (Cloudflare Pages) — fast, cheap and robust.",
    cta_projects: "🚀 View projects",

    projects_title: "Projects",
    projects_sub: "A small selection of things I built, optimized or automated.",

    about_title: "About",
    about_text:
      "I like: “clear plan, clean execution”. I focus on robust solutions that keep running months later — not just looking good in a screenshot.",
    stack_title: "Stack / Tools",

    contact_title: "Contact",
    contact_text: "Feel free to reach out:",
    contact_note: "(Optional form — we can add it later.)",

    footer_right: "Deployed with Cloudflare Pages",

    projButtons: { demo: "Demo", repo: "GitHub", docs: "Docs" }
  }
};

// Beispiel-Projekte (kannst du später easy ersetzen)
const projects = [
  {
    title: { de: "RMV Info Display (Raspberry Pi Kiosk)", en: "RMV Info Display (Raspberry Pi Kiosk)" },
    description: {
      de: "Live-Verbindungen, Laufwege & ein „Pendler-Mode“ — optimiert für schnelles „Ein Blick reicht“.",
      en: "Live connections, walking routes & a commuter mode — optimized for quick glances."
    },
    tags: ["Raspberry Pi", "API", "Kiosk UI"],
    links: { repo: "https://github.com/e4don", demo: null, docs: null }
  },
  {
    title: { de: "Home Assistant Setup", en: "Home Assistant Setup" },
    description: {
      de: "Automationen, Sensorik & smarter Alltag — ohne Cloud-Zwang.",
      en: "Automations, sensors & a smart everyday life — without being forced into the cloud."
    },
    tags: ["Smart Home", "Self-Hosted", "Security"],
    links: { repo: null, demo: null, docs: null }
  },
  {
    title: { de: "Synology Backup & Homelab", en: "Synology Backup & Homelab" },
    description: {
      de: "Backup-Strategien, Replikation, USV-Integration & saubere Datensicherung.",
      en: "Backup strategies, replication, UPS integration & clean data protection."
    },
    tags: ["NAS", "Backup", "Network"],
    links: { repo: null, demo: null, docs: null }
  }
];

const state = { lang: "de" };

function applyLanguage(lang) {
  state.lang = (lang === "en") ? "en" : "de";
  localStorage.setItem(STORAGE_KEY, state.lang);
  document.documentElement.lang = state.lang;

  const dict = I18N[state.lang] || I18N.de;

  // 1) Alle data-i18n Texte ersetzen
  $$("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    const val = dict[key];
    if (typeof val === "string") node.textContent = val;
  });

  // 2) Language buttons state
  const btnDE = $("#btn-de");
  const btnEN = $("#btn-en");
  if (btnDE && btnEN) {
    const isDE = state.lang === "de";
    btnDE.classList.toggle("active", isDE);
    btnEN.classList.toggle("active", !isDE);
    btnDE.setAttribute("aria-pressed", String(isDE));
    btnEN.setAttribute("aria-pressed", String(!isDE));
  }

  // 3) Projekte neu rendern
  renderProjects();
}

function renderProjects() {
  const dict = I18N[state.lang] || I18N.de;
  const grid = $("#projectsList");           // IMPORTANT: matches index.html
  if (!grid) return;

  grid.innerHTML = "";

  projects.forEach((p) => {
    const card = document.createElement("article");
    card.className = "project";

    const h = document.createElement("h3");
    h.className = "project__title";
    h.textContent = p.title[state.lang] || p.title.de;

    const d = document.createElement("p");
    d.className = "project__desc";
    d.textContent = p.description[state.lang] || p.description.de;

    const tags = document.createElement("div");
    tags.className = "tags";
    (p.tags || []).forEach((tag) => {
      const s = document.createElement("span");
      s.className = "tag";
      s.textContent = tag;
      tags.appendChild(s);
    });

    const actions = document.createElement("div");
    actions.className = "actions";

    const mk = (label, href) => {
      const a = document.createElement("a");
      a.className = "action";
      a.textContent = label;
      a.href = href;
      a.target = "_blank";
      a.rel = "noreferrer";
      return a;
    };

    if (p.links?.demo) actions.appendChild(mk(dict.projButtons.demo, p.links.demo));
    if (p.links?.repo) actions.appendChild(mk(dict.projButtons.repo, p.links.repo));
    if (p.links?.docs) actions.appendChild(mk(dict.projButtons.docs, p.links.docs));

    card.appendChild(h);
    card.appendChild(d);
    if (tags.children.length) card.appendChild(tags);
    if (actions.children.length) card.appendChild(actions);

    grid.appendChild(card);
  });
}

function setupNav() {
  // Smooth scroll
  $$(".nav a").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Active state (aria-current)
  const navLinks = $$(".nav a").filter((a) => (a.getAttribute("href") || "").startsWith("#"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (!navLinks.length || !sections.length) return;

  const obs = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

    if (!visible) return;

    const id = "#" + visible.target.id;
    navLinks.forEach((a) => {
      if (a.getAttribute("href") === id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }, { rootMargin: "-40% 0px -55% 0px", threshold: [0.01, 0.2, 0.35, 0.5] });

  sections.forEach((s) => obs.observe(s));
}

function setupYear() {
  const y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
}

function boot() {
  // Language restore
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en") state.lang = "en";

  // Wire language buttons (matches index.html)
  $("#btn-de")?.addEventListener("click", () => applyLanguage("de"));
  $("#btn-en")?.addEventListener("click", () => applyLanguage("en"));

  setupNav();
  setupYear();

  // First render
  applyLanguage(state.lang);
}

document.addEventListener("DOMContentLoaded", boot);
