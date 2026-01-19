/* 4don.com – bilingual content + project rendering + nav active state */

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

const STORAGE_KEY = "4don_lang";

const content = {
  de: {
    nav_projects: "Projekte",
    nav_about: "Über mich",
    nav_contact: "Kontakt",

    badge_role: "Automation Engineer",
    badge_topics: "Raspberry Pi · Smart Home · Networking · Homelab",

    hero_title: "Hi, ich bin Erik 👋",
    hero_subtitle:
      "Ich baue pragmatische Automations- und Tech-Projekte, die im Alltag wirklich funktionieren — minimalistisch, schnell und ohne Buzzword-Overkill.",
    cta_projects: "🚀 Projekte ansehen",
    hero_note: "Tipp: Diese Seite ist statisch (Cloudflare Pages) — schnell, günstig, robust.",

    projects_title: "Projekte",
    projects_desc: "Ausgewählte Dinge, die ich gebaut, optimiert oder automatisiert habe.",

    about_title: "Über mich",
    about_text:
      "Ich mag: „klarer Plan, saubere Umsetzung“. Fokus auf robuste Lösungen, die auch nach Monaten noch laufen — und nicht nur im Screenshot gut aussehen.",
    stack_title: "Stack / Tools",

    contact_title: "Kontakt",
    contact_text: "Schreib mir gern:",
    contact_note: "(Formular optional — kommt später, wenn du willst.)",

    footer_left: "©",
    footer_right: "Deployed with Cloudflare Pages",

    projButtons: { demo: "Demo", repo: "GitHub", docs: "Docs" }
  },

  en: {
    nav_projects: "Projects",
    nav_about: "About",
    nav_contact: "Contact",

    badge_role: "Automation Engineer",
    badge_topics: "Raspberry Pi · Smart Home · Networking · Homelab",

    hero_title: "Hi, I’m Erik 👋",
    hero_subtitle:
      "I build pragmatic automation and tech projects that work in everyday life — minimal, fast and without buzzword overload.",
    cta_projects: "🚀 View projects",
    hero_note: "Tip: This site is static (Cloudflare Pages) — fast, cheap and robust.",

    projects_title: "Projects",
    projects_desc: "A small selection of things I built, optimized or automated.",

    about_title: "About",
    about_text:
      "I like: “clear plan, clean execution”. I focus on robust solutions that keep running months later — not just looking good in a screenshot.",
    stack_title: "Stack / Tools",

    contact_title: "Contact",
    contact_text: "Feel free to reach out:",
    contact_note: "(Optional form — we can add it later.)",

    footer_left: "©",
    footer_right: "Deployed with Cloudflare Pages",

    projButtons: { demo: "Demo", repo: "GitHub", docs: "Docs" }
  }
};

// Replace these with real links when you have them.
const projects = [
  {
    title: { de: "RMV Info Display (Raspberry Pi Kiosk)", en: "RMV Info Display (Raspberry Pi Kiosk)" },
    description: {
      de: "Live-Verbindungen, Laufwege & ein „Pendler-Mode“ — optimiert für schnelles „Ein Blick reicht“.",
      en: "Live connections, walking routes and a “commuter mode” — optimized for quick glances."
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
      en: "Backup strategies, replication, UPS integration and clean data protection."
    },
    tags: ["NAS", "Backup", "Network"],
    links: { repo: null, demo: null, docs: null }
  },
  {
    title: { de: "4don.com (Cloudflare Pages)", en: "4don.com (Cloudflare Pages)" },
    description: {
      de: "Minimal-Portfolio, schnell deployed — gebaut für spätere Blog/Wiki-Erweiterung.",
      en: "Minimal portfolio, fast deploy — built to grow into blog/wiki later."
    },
    tags: ["Cloudflare", "Pages", "DNS"],
    links: { repo: "https://github.com/e4don/4don-portfolio", demo: "https://4don.com", docs: null }
  }
];

const state = { lang: "de" };

function applyI18n() {
  const t = content[state.lang] || content.de;

  // set document lang
  document.documentElement.lang = state.lang;

  // generic: replace all [data-i18n] with matching key
  $$("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (!key) return;
    if (typeof t[key] !== "string") return;
    node.textContent = t[key];
  });

  renderProjects();
  updateLangButtons();
}

function setLang(lang) {
  state.lang = (lang === "en") ? "en" : "de";
  localStorage.setItem(STORAGE_KEY, state.lang);
  applyI18n();
}

function updateLangButtons() {
  const btnDE = $("#lang-de");
  const btnEN = $("#lang-en");
  if (!btnDE || !btnEN) return;

  const isDE = state.lang === "de";

  btnDE.classList.toggle("active", isDE);
  btnEN.classList.toggle("active", !isDE);

  btnDE.setAttribute("aria-pressed", isDE ? "true" : "false");
  btnEN.setAttribute("aria-pressed", !isDE ? "true" : "false");
}

function renderProjects() {
  const t = content[state.lang] || content.de;
  const grid = $("#projectsList");
  if (!grid) return;

  grid.innerHTML = "";

  projects.forEach((p) => {
    const wrap = document.createElement("article");
    wrap.className = "project";

    const h = document.createElement("h3");
    h.className = "project__title";
    h.textContent = (p.title && (p.title[state.lang] || p.title.de)) || "Project";

    const d = document.createElement("p");
    d.className = "project__desc";
    d.textContent = (p.description && (p.description[state.lang] || p.description.de)) || "";

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

    if (p.links?.demo) actions.appendChild(mk(t.projButtons.demo, p.links.demo));
    if (p.links?.repo) actions.appendChild(mk(t.projButtons.repo, p.links.repo));
    if (p.links?.docs) actions.appendChild(mk(t.projButtons.docs, p.links.docs));

    wrap.appendChild(h);
    wrap.appendChild(d);
    if (tags.children.length) wrap.appendChild(tags);
    if (actions.children.length) wrap.appendChild(actions);

    grid.appendChild(wrap);
  });
}

function setupNav() {
  // smooth scroll
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

  // active state via IntersectionObserver -> aria-current="page"
  const navLinks = $$(".nav a").filter((a) => (a.getAttribute("href") || "").startsWith("#"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length || !navLinks.length) return;

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
  // restore language (default de)
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en") state.lang = "en";

  // language buttons
  $("#lang-de")?.addEventListener("click", () => setLang("de"));
  $("#lang-en")?.addEventListener("click", () => setLang("en"));

  setupNav();
  setupYear();
  applyI18n();
}

document.addEventListener("DOMContentLoaded", boot);
