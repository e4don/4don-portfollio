(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const STORAGE_KEY = "4don_lang";

  // ===== 1) Text-Dictionary (Keys müssen zu data-i18n im HTML passen) =====
  const I18N = {
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
      cta_contact: "Kontakt",
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

      footer_right: "Deployed with Cloudflare Pages",

      proj_demo: "Demo",
      proj_repo: "GitHub",
      proj_docs: "Docs"
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
      cta_contact: "Contact",
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

      footer_right: "Deployed with Cloudflare Pages",

      proj_demo: "Demo",
      proj_repo: "GitHub",
      proj_docs: "Docs"
    }
  };

  // ===== 2) Projekte (Demo-Daten – später ersetzen durch echte Links) =====
  const PROJECTS = [
    {
      title: { de: "RMV Info Display (Raspberry Pi Kiosk)", en: "RMV Info Display (Raspberry Pi Kiosk)" },
      desc: {
        de: "Live-Verbindungen, Laufwege & ein „Pendler-Mode“ — optimiert für schnelles „Ein Blick reicht“.",
        en: "Live connections, walking routes & a commuter mode — optimized for quick glances."
      },
      tags: ["Raspberry Pi", "API", "Kiosk UI"],
      links: { repo: "https://github.com/e4don", demo: null, docs: null }
    },
    {
      title: { de: "Home Assistant Setup", en: "Home Assistant Setup" },
      desc: {
        de: "Automationen, Sensorik & smarter Alltag — ohne Cloud-Zwang.",
        en: "Automations, sensors & smart everyday life — without being forced into the cloud."
      },
      tags: ["Smart Home", "Self-Hosted", "Security"],
      links: { repo: null, demo: null, docs: null }
    },
    {
      title: { de: "Synology Backup & Homelab", en: "Synology Backup & Homelab" },
      desc: {
        de: "Backup-Strategien, Replikation, USV-Integration & saubere Datensicherung.",
        en: "Backup strategies, replication, UPS integration & clean data protection."
      },
      tags: ["NAS", "Backup", "Network"],
      links: { repo: null, demo: null, docs: null }
    }
  ];

  // ===== Helpers =====
  function getLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "en" ? "en" : "de";
  }

  function setLangButtons(lang) {
    const deBtn = $("#btn-de");
    const enBtn = $("#btn-en");
    if (!deBtn || !enBtn) return;

    const isDE = lang === "de";
    deBtn.classList.toggle("active", isDE);
    enBtn.classList.toggle("active", !isDE);
    deBtn.setAttribute("aria-pressed", String(isDE));
    enBtn.setAttribute("aria-pressed", String(!isDE));
  }

  // ===== 3) i18n anwenden (ROBUST: keine Null-Crashes) =====
  function applyI18n(lang) {
    const dict = I18N[lang] || I18N.de;

    document.documentElement.lang = lang;

    // Wichtig: wir ersetzen NUR das, was im DOM vorhanden ist.
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = dict[key];
      if (typeof val === "string") el.textContent = val;
    });

    // Footer rechts (falls vorhanden)
    const footerRight = $('[data-i18n="footer_right"]');
    if (footerRight && typeof dict.footer_right === "string") footerRight.textContent = dict.footer_right;

    setLangButtons(lang);
    renderProjects(lang);
  }

  // ===== 4) Projekte rendern =====
  function renderProjects(lang) {
    const dict = I18N[lang] || I18N.de;

    // In deinem Layout heißt es projectsList (nicht projectsGrid)
    const host = $("#projectsList");
    if (!host) return;

    host.innerHTML = "";

    PROJECTS.forEach((p) => {
      const card = document.createElement("article");
      card.className = "project";

      const h = document.createElement("h3");
      h.className = "project__title";
      h.textContent = (p.title && (p.title[lang] || p.title.de)) || "Project";

      const d = document.createElement("p");
      d.className = "project__desc";
      d.textContent = (p.desc && (p.desc[lang] || p.desc.de)) || "";

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

      if (p.links?.demo) actions.appendChild(mk(dict.proj_demo, p.links.demo));
      if (p.links?.repo) actions.appendChild(mk(dict.proj_repo, p.links.repo));
      if (p.links?.docs) actions.appendChild(mk(dict.proj_docs, p.links.docs));

      card.appendChild(h);
      card.appendChild(d);
      if (tags.children.length) card.appendChild(tags);
      if (actions.children.length) card.appendChild(actions);

      host.appendChild(card);
    });
  }

  // ===== 5) Nav Active State (aria-current) =====
  function initActiveNav() {
    const links = $$(".nav a").filter((a) => (a.getAttribute("href") || "").startsWith("#"));
    const sections = links
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);

    if (!links.length || !sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (!visible) return;

        const id = "#" + visible.target.id;
        links.forEach((a) => {
          if (a.getAttribute("href") === id) a.setAttribute("aria-current", "page");
          else a.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0.01, 0.2, 0.35, 0.5] }
    );

    sections.forEach((s) => obs.observe(s));
  }

  // ===== Boot =====
  document.addEventListener("DOMContentLoaded", () => {
    const lang = getLang();

    $("#btn-de")?.addEventListener("click", () => {
      localStorage.setItem(STORAGE_KEY, "de");
      applyI18n("de");
    });

    $("#btn-en")?.addEventListener("click", () => {
      localStorage.setItem(STORAGE_KEY, "en");
      applyI18n("en");
    });

    initActiveNav();
    applyI18n(lang);
  });
})();
