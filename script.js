/* 4don.com – simple bilingual content + project rendering */

const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

const content = {
  de: {
    navProjects: 'Projekte',
    navAbout: 'Über mich',
    navContact: 'Kontakt',
    badgeRole: 'Automation Engineer',
    badgeTopics: 'Raspberry Pi · Smart Home · Networking · Homelab',
    heroTitle: 'Hi, ich bin Erik',
    heroSubtitle:
      'Ich baue pragmatische Automations- und Tech-Projekte, die im Alltag wirklich funktionieren — minimalistisch, schnell und ohne Buzzword-Overkill.',
    ctaProjects: 'Projekte ansehen',
    ctaMail: 'info@4don.com',
    ctaGitHub: 'GitHub',

    projectsTitle: 'Projekte',
    projectsDesc: 'Ausgewählte Dinge, die ich gebaut, optimiert oder automatisiert habe.',

    aboutTitle: 'Über mich',
    aboutText:
      'Ich mag: „klarer Plan, saubere Umsetzung“. Fokus auf robuste Lösungen, die auch nach Monaten noch laufen — und nicht nur im Screenshot gut aussehen.',
    stackTitle: 'Stack / Tools',
    stackText: 'Cloudflare · GitHub · Raspberry Pi · Home Assistant · Synology · Netzwerke · Automatisierung',

    contactTitle: 'Kontakt',
    contactText: 'Schreib mir gern:',

    footerLeft: '© 2026 Erik · 4don.com',
    footerRight: 'Deployed with Cloudflare Pages',

    projButtons: {
      demo: 'Demo',
      repo: 'GitHub',
      docs: 'Docs',
    }
  },
  en: {
    navProjects: 'Projects',
    navAbout: 'About',
    navContact: 'Contact',
    badgeRole: 'Automation Engineer',
    badgeTopics: 'Raspberry Pi · Smart Home · Networking · Homelab',
    heroTitle: 'Hi, I’m Erik',
    heroSubtitle:
      'I build pragmatic automation and tech projects that work in everyday life — minimal, fast and without buzzword overload.',
    ctaProjects: 'View projects',
    ctaMail: 'info@4don.com',
    ctaGitHub: 'GitHub',

    projectsTitle: 'Projects',
    projectsDesc: 'A small selection of things I built, optimized or automated.',

    aboutTitle: 'About',
    aboutText:
      'I like: “clear plan, clean execution”. I focus on robust solutions that keep running months later — not just looking good in a screenshot.',
    stackTitle: 'Stack / Tools',
    stackText: 'Cloudflare · GitHub · Raspberry Pi · Home Assistant · Synology · Networking · Automation',

    contactTitle: 'Contact',
    contactText: 'Feel free to reach out:',

    footerLeft: '© 2026 Erik · 4don.com',
    footerRight: 'Deployed with Cloudflare Pages',

    projButtons: {
      demo: 'Demo',
      repo: 'GitHub',
      docs: 'Docs',
    }
  }
};

// Replace these with real links when you have them.
const projects = [
  {
    title: { de: 'RMV Info Display (Raspberry Pi Kiosk)', en: 'RMV Info Display (Raspberry Pi Kiosk)' },
    description: {
      de: 'Live-Verbindungen, Laufwege & ein „Pendler-Mode“ — optimiert für schnelles „Ein Blick reicht“.',
      en: 'Live connections, walking routes and a “commuter mode” — optimized for quick glances.'
    },
    tags: ['Raspberry Pi', 'API', 'Kiosk UI'],
    links: {
      repo: 'https://github.com/e4don',
      demo: null,
      docs: null,
    }
  },
  {
    title: { de: 'Home Assistant Setup', en: 'Home Assistant Setup' },
    description: {
      de: 'Automationen, Sensorik & smarter Alltag — ohne Cloud-Zwang.',
      en: 'Automations, sensors & a smart everyday life — without being forced into the cloud.'
    },
    tags: ['Smart Home', 'Self-Hosted', 'Security'],
    links: { repo: null, demo: null, docs: null }
  },
  {
    title: { de: 'Synology Backup & Homelab', en: 'Synology Backup & Homelab' },
    description: {
      de: 'Backup-Strategien, Replikation, USV-Integration & saubere Datensicherung.',
      en: 'Backup strategies, replication, UPS integration and clean data protection.'
    },
    tags: ['NAS', 'Backup', 'Network'],
    links: { repo: null, demo: null, docs: null }
  },
  {
    title: { de: '4don.com (Cloudflare Pages)', en: '4don.com (Cloudflare Pages)' },
    description: {
      de: 'Minimal-Portfolio, schnell deployed — gebaut für spätere Blog/Wiki-Erweiterung.',
      en: 'Minimal portfolio, fast deploy — built to grow into blog/wiki later.'
    },
    tags: ['Cloudflare', 'Pages', 'DNS'],
    links: { repo: 'https://github.com/e4don/4don-portfolio', demo: 'https://4don.com', docs: null }
  }
];

const state = {
  lang: 'de'
};

function setLang(lang){
  state.lang = lang;
  document.documentElement.lang = lang;
  localStorage.setItem('4don_lang', lang);

  const t = content[lang];

  // Text nodes
  $('[data-i18n="nav.projects"]').textContent = t.navProjects;
  $('[data-i18n="nav.about"]').textContent = t.navAbout;
  $('[data-i18n="nav.contact"]').textContent = t.navContact;

  $('[data-i18n="badge.role"]').textContent = t.badgeRole;
  $('[data-i18n="badge.topics"]').textContent = t.badgeTopics;

  $('[data-i18n="hero.title"]').textContent = t.heroTitle;
  $('[data-i18n="hero.subtitle"]').textContent = t.heroSubtitle;

  $('[data-i18n="cta.projects"]').textContent = t.ctaProjects;
  $('[data-i18n="cta.mail"]').textContent = t.ctaMail;
  $('[data-i18n="cta.github"]').textContent = t.ctaGitHub;

  $('[data-i18n="section.projects.title"]').textContent = t.projectsTitle;
  $('[data-i18n="section.projects.desc"]').textContent = t.projectsDesc;

  $('[data-i18n="section.about.title"]').textContent = t.aboutTitle;
  $('[data-i18n="section.about.text"]').textContent = t.aboutText;
  $('[data-i18n="section.stack.title"]').textContent = t.stackTitle;
  $('[data-i18n="section.stack.text"]').textContent = t.stackText;

  $('[data-i18n="section.contact.title"]').textContent = t.contactTitle;
  $('[data-i18n="section.contact.text"]').textContent = t.contactText;

  $('[data-i18n="footer.left"]').textContent = t.footerLeft;
  $('[data-i18n="footer.right"]').textContent = t.footerRight;

  renderProjects();
  updateLangButtons();
}

function renderProjects(){
  const lang = state.lang;
  const t = content[lang];
  const grid = $('#projectsGrid');
  grid.innerHTML = '';

  projects.forEach((p) => {
    const card = document.createElement('article');
    card.className = 'card';

    const h = document.createElement('h3');
    h.textContent = p.title[lang] || p.title.de;

    const d = document.createElement('p');
    d.className = 'muted';
    d.textContent = p.description[lang] || p.description.de;

    const tags = document.createElement('div');
    tags.className = 'tags';
    (p.tags || []).forEach(tag => {
      const s = document.createElement('span');
      s.className = 'tag';
      s.textContent = tag;
      tags.appendChild(s);
    });

    const actions = document.createElement('div');
    actions.className = 'actions';

    const makeBtn = (label, href) => {
      const a = document.createElement('a');
      a.className = 'btn small ghost';
      a.textContent = label;
      a.href = href;
      a.target = '_blank';
      a.rel = 'noreferrer';
      return a;
    };

    if (p.links?.demo) actions.appendChild(makeBtn(t.projButtons.demo, p.links.demo));
    if (p.links?.repo) actions.appendChild(makeBtn(t.projButtons.repo, p.links.repo));
    if (p.links?.docs) actions.appendChild(makeBtn(t.projButtons.docs, p.links.docs));

    card.appendChild(h);
    card.appendChild(d);
    card.appendChild(tags);
    if (actions.children.length) card.appendChild(actions);

    grid.appendChild(card);
  });
}

function updateLangButtons(){
  $$('#langToggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === state.lang);
    btn.setAttribute('aria-pressed', btn.dataset.lang === state.lang ? 'true' : 'false');
  });
}

function setupNav(){
  // smooth scroll
  $$('.nav a').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // active state
  const sections = ['#projects', '#about', '#contact'].map(id => document.querySelector(id)).filter(Boolean);
  const links = $$('.nav a').filter(a => (a.getAttribute('href')||'').startsWith('#'));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = '#' + entry.target.id;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0.01 });

  sections.forEach(s => obs.observe(s));
}

function boot(){
  // language: default DE, keep last
  const stored = localStorage.getItem('4don_lang');
  if (stored === 'en') state.lang = 'en';

  // wire toggle
  $$('#langToggle button').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  setupNav();
  setLang(state.lang);
}

boot();
