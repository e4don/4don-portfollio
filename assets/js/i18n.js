/* =========================================================
   4don i18n (DE/EN) — Minimal, framework-free
   File: /assets/js/i18n.js

   How it works:
   - Language is resolved in this priority:
     1) URL param ?lang=de|en
     2) localStorage "lang"
     3) navigator.language (de => DE, otherwise EN)
   - Elements with data-i18n="key.path" are translated
   - Optional:
     - data-i18n-attr="placeholder|title|aria-label|..."
     - data-i18n-html="1" to allow HTML (trusted strings only)

   Key goals:
   - Works with HTML5 UP Massively
   - Supports mobile nav panel cloning (#navPanel) by re-applying
   - Toggle works on desktop + mobile (capture phase click handler)
   - URL sync keeps ?lang=... shareable

   Usage (per page):
   <script src="../assets/js/i18n.js"></script>
   <script>window.i18nInit?.({ basePath: "../assets/i18n" });</script>
   ========================================================= */

(function () {
  const STORAGE_KEY = 'lang';
  const SUPPORTED = ['de', 'en'];

  const state = {
    lang: 'en',
    dict: {},
    basePath: 'assets/i18n',
    ready: false,
    listeners: new Set(),
  };

  // ---------------------------------------------------------
  // Resolve language source (URL > localStorage > navigator)
  // ---------------------------------------------------------
  function getUrlLang() {
    try {
      const url = new URL(window.location.href);
      const lang = (url.searchParams.get('lang') || '').toLowerCase();
      return SUPPORTED.includes(lang) ? lang : null;
    } catch (_) {
      return null;
    }
  }

  function getStoredLang() {
    try {
      const lang = (localStorage.getItem(STORAGE_KEY) || '').toLowerCase();
      return SUPPORTED.includes(lang) ? lang : null;
    } catch (_) {
      return null;
    }
  }

  function getNavigatorLang() {
    const nav = (navigator.language || 'en').toLowerCase();
    return nav.startsWith('de') ? 'de' : 'en';
  }

  function resolveLang() {
    return getUrlLang() || getStoredLang() || getNavigatorLang();
  }

  // ---------------------------------------------------------
  // Persistence + URL sync
  // ---------------------------------------------------------
  function setStoredLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {
      /* ignore */
    }
  }

  // Keep lang in the URL so links are shareable (no page reload)
  function setUrlLang(lang) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      history.replaceState({}, '', url);
    } catch (_) {
      /* ignore */
    }
  }

  // ---------------------------------------------------------
  // Dictionary helpers
  // ---------------------------------------------------------
  function deepGet(obj, path) {
    if (!obj || !path) return null;
    const parts = String(path).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
      else return null;
    }
    return cur;
  }

  function t(key, fallback = '') {
    const v = deepGet(state.dict, key);
    return typeof v === 'string' ? v : fallback || key;
  }

  function formatText(value) {
    const year = new Date().getFullYear();
    return String(value).replaceAll('{year}', String(year));
  }

  // ---------------------------------------------------------
  // Apply translations to a DOM subtree
  // - Translates [data-i18n]
  // - Updates the language switch UI (ALL instances: desktop + navPanel clone)
  // ---------------------------------------------------------
  function apply(root = document) {
    const nodes = root.querySelectorAll('[data-i18n]');
    nodes.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = t(key, '');

      // Optional attribute translation (placeholder/title/aria-label/...)
      const attr = el.getAttribute('data-i18n-attr');
      if (attr) {
        el.setAttribute(attr, val);
        return;
      }

      // Optional HTML translation (trusted strings only)
      const allowHtml = el.getAttribute('data-i18n-html') === '1';
      const formatted = formatText(val);
      if (allowHtml) el.innerHTML = formatted;
      else el.textContent = formatted;
    });

    // Update ALL language toggle instances (desktop nav + mobile navPanel clone)
    document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
      btn.classList.toggle('is-de', state.lang === 'de');
      btn.classList.toggle('is-en', state.lang === 'en');

      // PATCH 2 (perfect): ARIA state for accessibility
      // (We use aria-pressed as a simple "on/off" indicator. You can also use aria-checked with role="switch".)
      btn.setAttribute('aria-pressed', state.lang === 'en' ? 'true' : 'false');
    });
  }

  // ---------------------------------------------------------
  // Load translation JSON
  // ---------------------------------------------------------
  async function loadDict(lang) {
    const url = `${state.basePath}/${lang}.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`i18n failed: ${res.status} (${url})`);
    return res.json();
  }

  // ---------------------------------------------------------
  // Set language:
  // - updates state
  // - persists to localStorage
  // - syncs URL (?lang=..)
  // - loads dict
  // - applies translations
  // - notifies listeners (e.g., projects.js)
  // ---------------------------------------------------------
  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = 'en';
    state.lang = lang;

    setStoredLang(lang);
    setUrlLang(lang);

    state.dict = await loadDict(lang);
    state.ready = true;

    // Apply translations to current DOM
    apply(document);

    // Notify listeners (e.g., dynamic renderers like projects.js)
    state.listeners.forEach((fn) => {
      try {
        fn(lang);
      } catch (_) {
        /* ignore */
      }
    });
  }

  // ---------------------------------------------------------
  // Listener API for dynamic pages (projects.js can re-render on language change)
  // ---------------------------------------------------------
  function onChange(fn) {
    state.listeners.add(fn);
    return () => state.listeners.delete(fn);
  }

  // ---------------------------------------------------------
  // Toggle binding:
  // - Use capture phase so Massively mobile nav panel can't swallow the click
  // - Stop propagation so the panel doesn't close before we toggle
  // - Re-apply after navPanel open/close (it clones #nav)
  // ---------------------------------------------------------
  function bindToggle() {
    // 1) Handle clicks early (capture) to survive the mobile panel click logic
    document.addEventListener(
      'click',
      (e) => {
        const btn = e.target.closest?.('[data-lang-toggle]');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        const next = state.lang === 'de' ? 'en' : 'de';
        setLang(next);
      },
      true
    );

    // 2) Massively creates/clones the mobile nav panel dynamically.
    // Re-apply after any click so newly injected clones get correct classes.
    // This is cheap and prevents "plain button" flashes.
    document.addEventListener('click', () => {
      setTimeout(() => apply(document), 0);
    });
  }

  // ---------------------------------------------------------
  // Public API
  // ---------------------------------------------------------
  window.i18n = {
    t,
    apply,
    setLang,
    getLang: () => state.lang,
    onChange,
  };

  // ---------------------------------------------------------
  // Page init helper (lets you pass basePath per directory depth)
  // ---------------------------------------------------------
  window.i18nInit = function ({ basePath = 'assets/i18n' } = {}) {
    state.basePath = basePath;
    bindToggle();

    // Resolve and apply the language immediately on page load
    const lang = resolveLang();
    setLang(lang);
  };
})();
