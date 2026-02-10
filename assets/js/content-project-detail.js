// assets/js/content-project-detail.js
/* =========================================================
   4don — Project Detail Loader (v1.9 clean + v1.9 i18n keys)

   v1.9 Rules:
   - Global UI labels ALWAYS via i18n:
       projects.detail.*
   - Project JSON contains ONLY project-specific content:
       meta + sections
   - No legacy fields: ui/header/metaBox/links/bodyHtml

   Slug:
   - project.html?slug=<slug>

   Content:
   - ../content/<lang>/projects/<slug>.json
   ========================================================= */

(function () {
  // -----------------------------
  // 1) Resolve slug from URL
  // -----------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (!slug) {
    console.warn('[project-detail] Missing project slug (?slug=...).');
    return;
  }

  // -----------------------------
  // 2) Helpers
  // -----------------------------
  function t(key, fallback) {
    return window.i18n?.t?.(key, fallback) ?? fallback;
  }

  function esc(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '';
  }

  function setHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value ?? '';
  }

  function show(el) {
    if (el) el.style.display = '';
  }

  function hide(el) {
    if (el) el.style.display = 'none';
  }

  function hideClosestRow(el) {
    if (!el) return;
    const row = el.closest('.meta-row');
    hide(row || el);
  }

  function showClosestRow(el) {
    if (!el) return;
    const row = el.closest('.meta-row');
    show(row || el);
  }

  function setMeta(nameOrProperty, value) {
    const selector = `meta[name="${nameOrProperty}"], meta[property="${nameOrProperty}"]`;
    const el = document.querySelector(selector);
    if (el && value != null) el.setAttribute('content', String(value));
  }

  // -----------------------------
  // 3) Lang fallback (only for initial load)
  // -----------------------------
  function getLangFallback() {
    try {
      const qLang = new URL(window.location.href).searchParams.get('lang');
      if (qLang === 'de' || qLang === 'en') return qLang;
    } catch (_) {}

    try {
      const ls = localStorage.getItem('lang');
      if (ls === 'de' || ls === 'en') return ls;
    } catch (_) {}

    return 'en';
  }

  // -----------------------------
  // 4) Load content
  // -----------------------------
  async function loadContent(lang) {
    const url = `../content/${lang}/projects/${slug}.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${url} (HTTP ${res.status})`);
    return res.json();
  }

  // -----------------------------
  // 5) v1.9 formatting helpers
  // -----------------------------
  function formatStatus(statusRaw) {
    const s = String(statusRaw ?? '')
      .trim()
      .toLowerCase();
    if (!s) return '';

    // v1.9 i18n keys: projects.detail.status.*
    if (s === 'active') return t('projects.detail.status.active', 'Active');
    if (s === 'wip') return t('projects.detail.status.wip', 'WIP');
    if (s === 'archived') return t('projects.detail.status.archived', 'Archived');

    return String(statusRaw);
  }

  // Keep it simple (you can upgrade later)
  function formatDate(dateRaw) {
    return String(dateRaw ?? '').trim();
  }

  // -----------------------------
  // 6) TOC
  // -----------------------------
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

    // v1.9 i18n key: projects.detail.tocTitle
    const tocTitle = esc(t('projects.detail.tocTitle', 'Contents'));

    return `
      <nav class="project-toc" aria-label="Table of contents">
        <h2 class="project-toc__title">${tocTitle}</h2>
        <ul class="project-toc__list">${items}</ul>
      </nav>
    `;
  }

  // -----------------------------
  // 7) Renderer (sections -> section -> chapters)
  // -----------------------------
  function renderV19Sections(sections) {
    const root = document.getElementById('project-body');
    if (!root) return;

    if (!Array.isArray(sections) || sections.length === 0) {
      root.innerHTML = `<p><em>${esc(t('projects.detail.noSections', 'No sections found.'))}</em></p>`;
      return;
    }

    const bodyHtml = sections
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
            ${chaptersHtml || `<p><em>${esc(t('projects.detail.noChapters', 'No chapters.'))}</em></p>`}
          </div>
        `;

        if (collapsible) {
          return `
            <details class="project-section" ${defaultOpen ? 'open' : ''} ${
              sectionId ? `id="${esc(sectionId)}" data-section-id="${esc(sectionId)}"` : ''
            }>
              <summary class="project-section__summary">${title}</summary>
              ${inner}
            </details>
          `;
        }

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

    const tocHtml = buildTocHtml(sections);
    root.innerHTML = (tocHtml ? tocHtml : '') + bodyHtml;

    openAndScrollToHash();
  }

  function renderChapter(ch, sectionId) {
    if (!ch || !ch.type) return '';

    const chapterId = ch.id ? String(ch.id).trim() : '';
    const fullId = sectionId && chapterId ? `${sectionId}-${chapterId}` : chapterId || '';

    const idAttr = fullId ? `id="${esc(fullId)}"` : '';
    const title = esc(ch.title || '');

    let content = '';

    if (ch.type === 'text') {
      const paras = Array.isArray(ch.body) ? ch.body : [];
      content = paras.map((p) => `<p>${esc(p)}</p>`).join('');
    } else if (ch.type === 'list') {
      const items = Array.isArray(ch.items) ? ch.items : [];
      content =
        items.length > 0
          ? `<ul>${items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>`
          : `<p><em>${esc(t('projects.detail.noItems', 'No items.'))}</em></p>`;
    } else if (ch.type === 'steps') {
      const steps = Array.isArray(ch.steps) ? ch.steps : [];
      content =
        steps.length > 0
          ? `<ol class="project-steps">
              ${steps
                .map(
                  (s) => `<li><strong>${esc(s?.label || '')}</strong> — ${esc(s?.text || '')}</li>`
                )
                .join('')}
             </ol>`
          : `<p><em>${esc(t('projects.detail.noSteps', 'No steps defined.'))}</em></p>`;
    } else if (ch.type === 'checklist') {
      const items = Array.isArray(ch.items) ? ch.items : [];
      content =
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
          : `<p><em>${esc(t('projects.detail.noChecklistItems', 'No tasks available.'))}</em></p>`;
    } else {
      const msg = esc(t('projects.detail.unsupportedChapterType', 'Unsupported chapter type:'));
      content = `<p><em>${msg} ${esc(ch.type)}</em></p>`;
    }

    return `
      <article class="project-chapter" ${idAttr}>
        ${title ? `<h3 class="project-chapter__title">${title}</h3>` : ''}
        ${content}
      </article>
    `;
  }

  // Deep-link handling:
  // - If hash points into a <details>, open it
  // - Then scroll smoothly to the target
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

  window.addEventListener('hashchange', () => openAndScrollToHash());

  // -----------------------------
  // 8) Render top UI (v1.9 clean)
  // -----------------------------
  function renderTopUi(data) {
    // Global UI labels (i18n) — v1.9 keys: projects.detail.*
    setText('project-back-btn', t('projects.detail.back', 'Back'));
    setText('project-kicker', t('projects.detail.kicker', 'Project'));
    setText('project-btn-backlist', t('projects.detail.backToProjects', 'Back to Projects'));
    setText('project-btn-contact', t('projects.detail.contact', 'Contact'));
    setText('project-mini-note', t('projects.detail.miniNote', ''));

    // Meta labels — v1.9 keys: projects.detail.metaLabels.*
    setText('project-meta-status-k', t('projects.detail.metaLabels.status', 'Status'));
    setText('project-meta-hosting-k', t('projects.detail.metaLabels.hosting', 'Hosting'));
    setText('project-meta-stack-k', t('projects.detail.metaLabels.stack', 'Stack'));
    setText('project-meta-content-k', t('projects.detail.metaLabels.content', 'Content'));

    // Button labels — v1.9 keys: projects.detail.live / github
    setText('project-btn-live', t('projects.detail.live', 'Live'));
    setText('project-btn-github', t('projects.detail.github', 'GitHub'));

    // Project-specific values (from v1.9 meta)
    const meta = data?.meta ?? {};
    const title = meta.title ?? '';
    const subtitle = meta.subtitle ?? '';
    const date = meta.date ?? '';
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    const status = formatStatus(meta.status);
    const hosting = meta.hosting ?? '';
    const stack = meta.stack ?? '';
    const content = meta.content ?? '';

    setText('project-title', title);
    setText('project-subtitle', subtitle);

    // Show date in kicker (optional)
    const kicker = t('projects.detail.kicker', 'Project');
    setText('project-kicker', date ? `${kicker} — ${formatDate(date)}` : kicker);

    // Meta values (hide rows if empty)
    const statusV = document.getElementById('project-meta-status-v');
    const hostingV = document.getElementById('project-meta-hosting-v');
    const stackV = document.getElementById('project-meta-stack-v');
    const contentV = document.getElementById('project-meta-content-v');

    if (statusV) {
      if (status) {
        statusV.textContent = status;
        showClosestRow(statusV);
      } else hideClosestRow(statusV);
    }

    if (hostingV) {
      if (hosting) {
        hostingV.textContent = hosting;
        showClosestRow(hostingV);
      } else hideClosestRow(hostingV);
    }

    if (stackV) {
      if (stack) {
        stackV.textContent = stack;
        showClosestRow(stackV);
      } else hideClosestRow(stackV);
    }

    if (contentV) {
      if (content) {
        contentV.textContent = content;
        showClosestRow(contentV);
      } else hideClosestRow(contentV);
    }

    // Badges from tags (if your HTML has .badges)
    const badges = document.querySelector('.badges');
    if (badges) {
      badges.innerHTML = tags.map((tg) => `<span class="badge">${esc(tg)}</span>`).join('');
    }

    // Cover image (optional): meta.cover: { src, alt }
    const coverImg = document.querySelector('.project-cover img');
    if (coverImg) {
      const coverSrc = meta?.cover?.src;
      const coverAlt = meta?.cover?.alt || title || 'Project cover';
      if (coverSrc) coverImg.src = coverSrc;
      coverImg.alt = coverAlt;
    }

    // Buttons (optional): meta.links: { live, github }
    const liveHref = meta?.links?.live || '';
    const githubHref = meta?.links?.github || '';

    const liveBtn = document.getElementById('project-btn-live');
    const ghBtn = document.getElementById('project-btn-github');

    if (liveBtn) {
      if (liveHref) {
        liveBtn.setAttribute('href', liveHref);
        show(liveBtn);
      } else {
        liveBtn.closest('li')?.remove?.();
      }
    }

    if (ghBtn) {
      if (githubHref) {
        ghBtn.setAttribute('href', githubHref);
        show(ghBtn);
      } else {
        ghBtn.closest('li')?.remove?.();
      }
    }

    // SEO meta (project-specific)
    if (title) document.title = title;

    if (meta?.description) {
      setMeta('description', meta.description);
      setMeta('og:description', meta.description);
      setMeta('twitter:description', meta.description);
    }

    if (meta?.ogTitle) {
      setMeta('og:title', meta.ogTitle);
      setMeta('twitter:title', meta.ogTitle);
    }
  }

  // -----------------------------
  // 9) Main render (v1.9 only)
  // -----------------------------
  function render(data) {
    renderTopUi(data);

    if (!Array.isArray(data?.sections)) {
      setHtml(
        'project-body',
        `<p><strong>${esc(
          t('projects.detail.missingSections', 'Invalid v1.9 project file: missing sections[].')
        )}</strong></p>`
      );
      return;
    }

    renderV19Sections(data.sections);
  }

  // -----------------------------
  // 10) Update flow
  // -----------------------------
  async function update(lang) {
    try {
      const data = await loadContent(lang);
      render(data);
      console.info(`[project-detail] Loaded v1.9 content for ${slug} (${lang}).`);
    } catch (e) {
      console.error('[project-detail] render failed:', e);
      setHtml(
        'project-body',
        `<p><strong>${esc(
          t('projects.detail.loadFailed', 'Failed to load project content.')
        )}</strong><br/><code>${esc(e.message)}</code></p>`
      );
    }
  }

  // Init
  const initialLang = window.i18n?.getLang?.() || getLangFallback();
  update(initialLang);

  // Re-render on language change
  window.i18n?.onChange?.((lang) => update(lang));
})();
