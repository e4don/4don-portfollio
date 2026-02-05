// assets/js/content-project-detail.js
/* =========================================================
   4don — Project Detail Content Loader (v1.8 + v1.9 compatible)

   Goals:
   - Load language-specific project content:
       ../content/<lang>/projects/<slug>.json
   - Backward compatible:
       v1.9 => data.sections (section/chapter model)
       v1.8 => data.bodyHtml (legacy HTML string)
   - Add Table of Contents (TOC) from sections/chapters
   - Use global UI labels from i18n (NOT from project JSON)

   Requirements:
   - <html data-project-slug="...">
   - Project detail HTML contains elements like:
       #project-title, #project-subtitle, #project-body, ...
   - i18n:
       window.i18n.getLang(), window.i18n.onChange(), window.i18n.t(key, fallback)
   ========================================================= */

(function () {
  // ---------------------------------------------------------
  // 1) Read slug from HTML attribute
  // ---------------------------------------------------------
  const slug = document.documentElement.getAttribute('data-project-slug');
  if (!slug) {
    console.warn('[project-detail] Missing data-project-slug on <html>.');
    return;
  }

  // ---------------------------------------------------------
  // 2) Language fallback (works even if i18n isn't ready yet)
  //    Priority:
  //    - URL param ?lang=de|en
  //    - localStorage "lang"
  //    - fallback "en"
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // 3) Load content JSON for current language + slug
  //    NOTE: Project detail pages live in /projects/,
  //          so we go up one directory: ../content/...
  // ---------------------------------------------------------
  async function loadContent(lang) {
    const url = `../content/${lang}/projects/${slug}.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${url} (HTTP ${res.status})`);
    return res.json();
  }

  // ---------------------------------------------------------
  // 4) DOM helpers
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // 5) i18n label helper (global UI labels only)
  // ---------------------------------------------------------
  function t(key, fallback) {
    return window.i18n?.t?.(key, fallback) ?? fallback;
  }

  // ---------------------------------------------------------
  // 6) Safe escape for strings that will be rendered as HTML
  // ---------------------------------------------------------
  function esc(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // =========================================================
  // v1.9: Table of Contents (TOC)
  // =========================================================
  function buildTocHtml(sections) {
    const items = sections
      .filter((s) => s && s.type === 'section')
      .map((sec) => {
        const sectionId = sec.id ? String(sec.id).trim() : '';
        const sectionTitle = esc(sec.title || '');
        const chapters = Array.isArray(sec.chapters) ? sec.chapters : [];

        const chapterLinks = chapters
          .filter((ch) => ch && ch.id)
          .map((ch) => {
            const chapterId = String(ch.id).trim();
            const fullId = sectionId ? `${sectionId}-${chapterId}` : chapterId;
            const chapterTitle = esc(ch.title || fullId);
            return `<li><a href="#${esc(fullId)}">${chapterTitle}</a></li>`;
          })
          .join('');

        return `
          <li class="project-toc__section">
            ${
              sectionId
                ? `<a href="#${esc(sectionId)}">${sectionTitle}</a>`
                : `<span>${sectionTitle}</span>`
            }
            ${chapterLinks ? `<ul class="project-toc__chapters">${chapterLinks}</ul>` : ''}
          </li>
        `;
      })
      .join('');

    if (!items) return '';

    // TOC title is a global UI label -> i18n
    const tocTitle = esc(t('projects.tocTitle', 'Contents'));

    return `
      <nav class="project-toc" aria-label="Table of contents">
        <h2 class="project-toc__title">${tocTitle}</h2>
        <ul class="project-toc__list">${items}</ul>
      </nav>
    `;
  }

  // =========================================================
  // v1.9: Renderer (sections -> (collapsible) section -> chapters)
  // =========================================================
  function renderV19Sections(data) {
    const root = document.getElementById('project-body');
    if (!root) return;

    const sections = Array.isArray(data?.sections) ? data.sections : [];

    if (sections.length === 0) {
      root.innerHTML = `<p><em>${esc(t('projects.noSections', 'No sections found.'))}</em></p>`;
      return;
    }

    const html = sections
      .map((sec) => {
        if (!sec || sec.type !== 'section') return '';

        const sectionId = sec.id ? String(sec.id).trim() : '';
        const title = esc(sec.title || '');
        const collapsible = !!sec.collapsible;
        const defaultOpen = !!sec.defaultOpen;

        const chapters = Array.isArray(sec.chapters) ? sec.chapters : [];
        const chaptersHtml = chapters.map((ch) => renderChapter(ch, sectionId)).join('');

        const inner = `
          <div class="project-section__inner">
            ${chaptersHtml || `<p><em>${esc(t('projects.noChapters', 'No chapters.'))}</em></p>`}
          </div>
        `;

        // Collapsible section via <details>/<summary>
        if (collapsible) {
          return `
            <details class="project-section" ${defaultOpen ? 'open' : ''} ${
              sectionId ? `id="${esc(sectionId)}" data-section-id="${esc(sectionId)}"` : ''
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
          <section class="project-section" ${
            sectionId ? `id="${esc(sectionId)}" data-section-id="${esc(sectionId)}"` : ''
          }>
            ${title ? `<h2 class="project-section__title">${title}</h2>` : ''}
            ${inner}
          </section>
        `;
      })
      .join('');

    // Render body
    root.innerHTML = html;

    // Insert TOC above the content
    const tocHtml = buildTocHtml(sections);
    if (tocHtml) {
      root.innerHTML = tocHtml + root.innerHTML;
    }

    // Handle deep links on initial render
    openAndScrollToHash();
  }

  function renderChapter(ch, sectionId) {
    if (!ch || !ch.type) return '';

    const chapterId = ch.id ? String(ch.id).trim() : '';
    const fullId = sectionId && chapterId ? `${sectionId}-${chapterId}` : chapterId || '';
    const title = esc(ch.title || '');

    const idAttr = fullId ? `id="${esc(fullId)}"` : '';

    let bodyHtml = '';

    if (ch.type === 'text') {
      const paras = Array.isArray(ch.body) ? ch.body : [];
      bodyHtml = paras.map((p) => `<p>${esc(p)}</p>`).join('');
    } else if (ch.type === 'list') {
      const items = Array.isArray(ch.items) ? ch.items : [];
      bodyHtml =
        items.length > 0
          ? `<ul>${items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>`
          : `<p><em>${esc(t('projects.noItems', 'No items.'))}</em></p>`;
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
          : `<p><em>${esc(t('projects.noSteps', 'No steps.'))}</em></p>`;
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
          : `<p><em>${esc(t('projects.noChecklistItems', 'No checklist items.'))}</em></p>`;
    } else {
      const msg = esc(t('projects.unsupportedChapterType', 'Unsupported chapter type:'));
      bodyHtml = `<p><em>${msg} ${esc(ch.type)}</em></p>`;
    }

    return `
      <article class="project-chapter" ${idAttr}>
        ${title ? `<h3 class="project-chapter__title">${title}</h3>` : ''}
        ${bodyHtml}
      </article>
    `;
  }

  // =========================================================
  // Deep-link handling:
  // - If hash points into a <details>, open it
  // - Then scroll smoothly to the target
  // =========================================================
  function openAndScrollToHash() {
    const hash = (window.location.hash || '').replace('#', '').trim();
    if (!hash) return;

    const el = document.getElementById(hash);
    if (!el) return;

    const details = el.closest('details');
    if (details) details.open = true;

    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  window.addEventListener('hashchange', () => {
    openAndScrollToHash();
  });

  // =========================================================
  // v1.8 render (top UI) + v1.9 body switch
  // =========================================================
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

    // --- Top UI (keep legacy fields working) ---
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

    // Remove GitHub button if no link is provided
    const gh = document.getElementById('project-btn-github');
    if (gh && !data?.links?.githubHref) {
      gh.closest('li')?.remove();
    }

    setText('project-mini-note', data?.ui?.miniNote ?? '');

    // --- Main body: v1.9 -> sections, v1.8 -> bodyHtml ---
    if (Array.isArray(data?.sections)) {
      renderV19Sections(data);
    } else {
      setHtml('project-body', data?.bodyHtml ?? '');
    }

    // --- Bottom actions (legacy) ---
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
      setHtml(
        'project-body',
        `<p><strong>Failed to load project content.</strong><br/><code>${esc(e.message)}</code></p>`
      );
    }
  }

  // ---------------------------------------------------------
  // Init
  // ---------------------------------------------------------
  const initialLang = window.i18n?.getLang?.() || getLangFallback();
  update(initialLang);

  // Re-render on language change
  window.i18n?.onChange?.((lang) => update(lang));
})();
