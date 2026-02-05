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
    if (!res.ok) throw new Error(`Failed to load ${url} (HTTP ${res.status})`);
    return res.json();
  }

  // -----------------------------
  // DOM helpers
  // -----------------------------
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

  // Safe escape for any user-provided strings rendered as HTML
  function esc(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // -----------------------------
  // v1.9 renderer: sections -> (collapsible) section -> chapters
  // -----------------------------
  function renderV19Sections(data) {
    const root = document.getElementById('project-body');
    if (!root) return;

    const sections = Array.isArray(data?.sections) ? data.sections : [];

    if (sections.length === 0) {
      root.innerHTML = `<p><em>No sections found.</em></p>`;
      return;
    }

    // Build HTML string (simple and predictable)
    const html = sections
      .map((sec) => {
        if (!sec || sec.type !== 'section') return '';

        const sectionId = sec.id ? String(sec.id).trim() : '';
        const title = esc(sec.title || '');
        const collapsible = !!sec.collapsible;
        const defaultOpen = !!sec.defaultOpen;

        const chapters = Array.isArray(sec.chapters) ? sec.chapters : [];

        const chaptersHtml = chapters.map((ch) => renderChapter(ch, sectionId)).join('');

        // Wrapper content for a section
        const inner = `
          <div class="project-section__inner">
            ${chaptersHtml || `<p><em>No chapters.</em></p>`}
          </div>
        `;

        // Collapsible section via <details>
        if (collapsible) {
          return `
            <details class="project-section" ${defaultOpen ? 'open' : ''} ${
              sectionId ? `data-section-id="${esc(sectionId)}"` : ''
            }>
              <summary class="project-section__summary">
                ${title}
              </summary>
              ${inner}
            </details>
          `;
        }

        // Non-collapsible section
        return `
          <section class="project-section" ${sectionId ? `data-section-id="${esc(sectionId)}"` : ''}>
            ${title ? `<h2 class="project-section__title">${title}</h2>` : ''}
            ${inner}
          </section>
        `;
      })
      .join('');

    root.innerHTML = html;

    // After rendering, handle deep-link hash:
    // - If hash points to a chapter, open the parent <details> section.
    // - Then scroll into view.
    openAndScrollToHash();
  }

  function renderChapter(ch, sectionId) {
    if (!ch || !ch.type) return '';

    const chapterId = ch.id ? String(ch.id).trim() : '';
    const fullId = sectionId && chapterId ? `${sectionId}-${chapterId}` : chapterId || '';

    const title = esc(ch.title || '');

    // Each chapter becomes an <article> so it is linkable & readable
    const idAttr = fullId ? `id="${esc(fullId)}"` : '';

    // Type-specific content
    let bodyHtml = '';

    if (ch.type === 'text') {
      const paras = Array.isArray(ch.body) ? ch.body : [];
      bodyHtml = paras.map((p) => `<p>${esc(p)}</p>`).join('');
    } else if (ch.type === 'list') {
      const items = Array.isArray(ch.items) ? ch.items : [];
      bodyHtml =
        items.length > 0
          ? `<ul>${items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>`
          : `<p><em>No items.</em></p>`;
    } else if (ch.type === 'steps') {
      const steps = Array.isArray(ch.steps) ? ch.steps : [];
      bodyHtml =
        steps.length > 0
          ? `<ol class="project-steps">
              ${steps
                .map(
                  (s) => `<li><strong>${esc(s?.label || '')}</strong> — ${esc(s?.text || '')}</li>`
                )
                .join('')}
             </ol>`
          : `<p><em>No steps.</em></p>`;
    } else if (ch.type === 'checklist') {
      const items = Array.isArray(ch.items) ? ch.items : [];
      bodyHtml =
        items.length > 0
          ? `<ul class="project-checklist">
              ${items
                .map((it) => {
                  const done = !!it?.done;
                  const txt = esc(it?.text || '');
                  return `<li class="${done ? 'is-done' : ''}">${txt}</li>`;
                })
                .join('')}
             </ul>`
          : `<p><em>No checklist items.</em></p>`;
    } else {
      bodyHtml = `<p><em>Unsupported chapter type: ${esc(ch.type)}</em></p>`;
    }

    return `
      <article class="project-chapter" ${idAttr}>
        ${title ? `<h3 class="project-chapter__title">${title}</h3>` : ''}
        ${bodyHtml}
      </article>
    `;
  }

  function openAndScrollToHash() {
    const hash = (window.location.hash || '').replace('#', '').trim();
    if (!hash) return;

    // Try direct match first
    const el = document.getElementById(hash);
    if (!el) return;

    // If this is inside a <details>, open it
    const details = el.closest('details');
    if (details) details.open = true;

    // Scroll
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  // Also handle hash changes after the page loaded
  window.addEventListener('hashchange', () => {
    openAndScrollToHash();
  });

  // -----------------------------
  // Existing v1.8 render (top UI) + new body rendering switch
  // -----------------------------
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
    setText('project-title', data?.header?.title ?? data?.meta?.title ?? '');
    setText('project-subtitle', data?.header?.subtitle ?? data?.meta?.subtitle ?? '');

    // --- Meta box ---
    setText('project-meta-status-k', data?.metaBox?.statusLabel ?? 'Status');
    setText('project-meta-status-v', data?.metaBox?.statusValue ?? data?.meta?.status ?? '');

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

    // --- Main body ---
    // v1.9: if "sections" exists -> new renderer, else fallback to old HTML string
    if (Array.isArray(data?.sections)) {
      renderV19Sections(data);
    } else {
      setHtml('project-body', data?.bodyHtml ?? '');
    }

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
      // Small, visible error for debugging
      setHtml(
        'project-body',
        `<p><strong>Failed to load project content.</strong><br/><code>${esc(e.message)}</code></p>`
      );
    }
  }

  // -----------------------------
  // Init sequence
  // -----------------------------
  const initialLang = window.i18n?.getLang?.() || getLangFallback();
  update(initialLang);

  // React to language changes when i18n is ready
  window.i18n?.onChange?.((lang) => update(lang));
})();
