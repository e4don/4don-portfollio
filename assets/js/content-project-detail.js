// assets/js/content-project-detail.js
(function () {
  // This loader is used on project detail pages under /projects/.
  // Therefore, content lives one level up: ../content/<lang>/projects/<slug>.json

  const slug = document.documentElement.getAttribute('data-project-slug');
  if (!slug) {
    console.warn('[project-detail] Missing data-project-slug on <html>.');
    return;
  }

  // -----------------------------
  // Lang fallback (works even if i18n is not ready yet)
  // -----------------------------
  function getLangFallback() {
    try {
      const url = new URL(window.location.href);
      const qLang = url.searchParams.get('lang');
      if (qLang === 'de' || qLang === 'en') return qLang;
    } catch (_) {
      /* ignore */
    }

    try {
      const ls = localStorage.getItem('lang');
      if (ls === 'de' || ls === 'en') return ls;
    } catch (_) {
      /* ignore */
    }

    return 'en';
  }

  async function loadContent(lang) {
    // IMPORTANT: project pages are in /projects/, so we must go up one level
    const url = `../content/${lang}/projects/${slug}.json`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to load ${url} (HTTP ${res.status})`);
    }
    return res.json();
  }

  function setMeta(nameOrProperty, value) {
    const selector = `meta[name="${nameOrProperty}"], meta[property="${nameOrProperty}"]`;
    const el = document.querySelector(selector);
    if (el && value != null) el.setAttribute('content', String(value));
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '';
  }

  function setHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value ?? '';
  }

  function setHref(id, href) {
    const el = document.getElementById(id);
    if (el && href) el.setAttribute('href', href);
  }

  function render(data) {
    // --- Meta / SEO ---
    if (data?.meta?.title) document.title = data.meta.title;

    if (data?.meta?.description) {
      setMeta('description', data.meta.description);
      setMeta('og:description', data.meta.description);
      setMeta('twitter:description', data.meta.description);
    }

    if (data?.meta?.ogTitle) {
      setMeta('og:title', data.meta.ogTitle);
      setMeta('twitter:title', data.meta.ogTitle);
    }

    // --- Top UI ---
    setText('project-back-btn', data?.ui?.back ?? 'Back');
    setText('project-kicker', data?.header?.kicker ?? 'Project');
    setText('project-title', data?.header?.title ?? '');
    setText('project-subtitle', data?.header?.subtitle ?? '');

    // --- Meta box ---
    setText('project-meta-status-k', data?.metaBox?.statusLabel ?? 'Status');
    setText('project-meta-status-v', data?.metaBox?.statusValue ?? '');

    setText('project-meta-hosting-k', data?.metaBox?.hostingLabel ?? 'Hosting');
    setText('project-meta-hosting-v', data?.metaBox?.hostingValue ?? '');

    setText('project-meta-stack-k', data?.metaBox?.stackLabel ?? 'Stack');
    setText('project-meta-stack-v', data?.metaBox?.stackValue ?? '');

    setText('project-meta-content-k', data?.metaBox?.contentLabel ?? 'Content');
    setText('project-meta-content-v', data?.metaBox?.contentValue ?? '');

    // --- Buttons / links ---
    setText('project-btn-live', data?.links?.liveLabel ?? 'Live');
    setHref('project-btn-live', data?.links?.liveHref);

    setText('project-btn-github', data?.links?.githubLabel ?? 'GitHub');
    setHref('project-btn-github', data?.links?.githubHref);

    // Hide GitHub button if not provided
    const gh = document.getElementById('project-btn-github');
    if (gh && !data?.links?.githubHref) {
      gh.closest('li')?.remove();
    }

    setText('project-mini-note', data?.ui?.miniNote ?? '');

    // --- Main body (HTML) ---
    setHtml('project-body', data?.bodyHtml ?? '');

    // --- Bottom actions ---
    setText('project-btn-backlist', data?.ui?.backToProjects ?? 'Back to Projects');
    setText('project-btn-contact', data?.ui?.contact ?? 'Contact');
  }

  async function update(lang) {
    try {
      const data = await loadContent(lang);
      render(data);
      console.info(`[project-detail] Loaded content for ${slug} (${lang}).`);
    } catch (e) {
      console.error('[project-detail] render failed:', e);
    }
  }

  // -----------------------------
  // Init sequence
  // -----------------------------
  const initialLang = window.i18n?.getLang?.() || getLangFallback();
  update(initialLang);

  // Also react to language changes when i18n is ready
  // If i18n is not loaded yet at this moment, this will do nothing, which is fine.
  window.i18n?.onChange?.((lang) => update(lang));
})();
