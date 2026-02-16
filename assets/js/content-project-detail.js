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

   TOC (Feinschliff):
   - Desktop: sticky TOC left (sidebar)
   - Mobile: Massively-style panel (same system as navPanel):
       uses jQuery.fn.panel from HTML5 UP template
       visibleClass: body.is-tocPanel-visible
       toggle button: #tocPanelToggle (bottom-right)
       panel: #tocPanel (right side, with X close)
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
  // 6) TOC builder
  // -----------------------------
  function buildTocHtml(sections, options = {}) {
    const includeChapters = options.includeChapters !== false;

    const items = sections
      .filter((s) => s && s.type === 'section')
      .map((sec) => {
        const sectionId = sec.id ? String(sec.id).trim() : '';
        // Use navTitle for TOC if available, fallback to title
        const sectionTitle = esc(sec.navTitle || sec.title || '');
        const chapters = Array.isArray(sec.chapters) ? sec.chapters : [];

        // Only include chapter links if enabled (desktop)
        const chapterLinks = includeChapters
          ? chapters
              .filter((ch) => ch && ch.id)
              .map((ch) => {
                const chapterId = String(ch.id).trim();
                const fullId = sectionId ? `${sectionId}-${chapterId}` : chapterId;
                // Use navTitle for TOC if available, fallback to title
                const chapterTitle = esc(ch.navTitle || ch.title || fullId);
                return `<li><a href="#${esc(fullId)}">${chapterTitle}</a></li>`;
              })
              .join('')
          : '';

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

    const tocTitle = esc(t('projects.detail.tocTitle', 'Contents'));

    return `
    <nav class="project-toc" id="projectTocNav" aria-label="Table of contents">
      <h2 class="project-toc__title">${tocTitle}</h2>
      <ul class="project-toc__list">${items}</ul>
    </nav>
  `;
  }

  // -----------------------------
  // 7) Renderer (sections -> chapters)
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

        // Collapsible section -> <details>
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

        // Non-collapsible section -> <section>
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

    // Desktop: with chapter links
    const tocDesktop = buildTocHtml(sections, { includeChapters: true });

    // Mobile panel: ONLY sections (no chapter links)
    const tocMobile = buildTocHtml(sections, { includeChapters: true });

    // Render layout:
    // - Desktop: sticky sidebar with TOC
    // - Content: right side
    root.innerHTML = `
      <div class="project-layout">
        <aside class="project-toc-wrap">
          ${tocDesktop || ''}
        </aside>

        <div class="project-content">
          ${bodyHtml}
        </div>
      </div>
    `;

    // Deep-link behavior (open details + scroll)
    openAndScrollToHash();

    // Active highlight in TOC
    setupTocActiveTracking();

    // Mobile: Massively panel integration (same style as menu)
    setupTocPanel(tocMobile);

    // Smooth scroll for all TOC links (desktop + mobile)
    setupTocLinkScrolling();
  }

  // -----------------------------
  // 7.1) Render chapter by type
  // -----------------------------
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

  // -----------------------------
  // 7.2) Mobile TOC: Massively panel integration
  // -----------------------------
  function setupTocPanel(tocHtml) {
    if (!tocHtml) return;

    // Remove older mounts (important on language switch re-render)
    document.getElementById('tocPanelToggle')?.remove();
    document.getElementById('tocPanel')?.remove();

    const label = esc(t('projects.detail.tocTitle', 'Contents'));
    // Accessibility label for the icon-only close button (no i18n key needed)
    const closeLabel = 'Close';

    // 1) Create toggle (append to BODY like Massively)
    const toggle = document.createElement('a');
    toggle.href = '#tocPanel';
    toggle.id = 'tocPanelToggle';
    toggle.className = 'alt';
    toggle.textContent = label;
    document.body.appendChild(toggle);

    // 2) Create panel (append to BODY)
    const panel = document.createElement('div');
    panel.id = 'tocPanel';
    panel.innerHTML = `
    ${tocHtml}
    <a href="#tocPanel" class="close" aria-label="${closeLabel}"></a>
  `;
    document.body.appendChild(panel);

    // 3) Manual open/close (guaranteed to work with your CSS)
    const OPEN_CLASS = 'is-tocPanel-visible';

    function openPanel(e) {
      e?.preventDefault?.();
      // If menu panel is open, close it (avoid overlap)
      document.body.classList.remove('is-navPanel-visible');
      document.body.classList.add(OPEN_CLASS);
    }

    function closePanel(e) {
      e?.preventDefault?.();
      document.body.classList.remove(OPEN_CLASS);
    }

    toggle.addEventListener('click', openPanel);
    panel.querySelector('.close')?.addEventListener('click', closePanel);

    // Close on any TOC link click (nice UX)
    panel.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', () => document.body.classList.remove(OPEN_CLASS));
    });

    // Close on ESC
    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') document.body.classList.remove(OPEN_CLASS);
    });

    // 4) If Massively panel plugin exists, enhance (optional)
    if (window.jQuery?.fn?.panel) {
      window.jQuery('#tocPanel').panel({
        delay: 500,
        hideOnClick: true,
        hideOnSwipe: true,
        resetScroll: true,
        resetForms: true,
        side: 'right',
        target: window.jQuery('body'),
        visibleClass: OPEN_CLASS,
      });
    }
  }

  // -----------------------------
  // 7.3) Active section/chapter highlight (works for sidebar + mobile panel)
  // -----------------------------
  function setupTocActiveTracking() {
    // Track both sections AND chapters
    const allTargets = Array.from(
      document.querySelectorAll(
        '.project-section[id], details.project-section[id], .project-chapter[id]'
      )
    );
    if (!allTargets.length) return;

    // Get nav height for offset calculation
    function getNavHeight() {
      const nav = document.querySelector('#nav');
      return nav ? nav.getBoundingClientRect().height : 0;
    }

    // Update active state based on current scroll position
    function updateActiveState() {
      const scrollPos = window.scrollY;
      const navHeight = getNavHeight();
      const offset = navHeight + 100; // Extra offset for better trigger point

      // Find which element is currently "active" (closest to top of viewport after nav)
      let activeId = null;
      let closestDistance = Infinity;

      allTargets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        const elementTop = rect.top + scrollPos;
        const distance = Math.abs(elementTop - (scrollPos + offset));

        // Element is in view range and closer than previous
        if (rect.top < window.innerHeight * 0.6 && distance < closestDistance) {
          closestDistance = distance;
          activeId = target.id;
        }
      });

      // If we're near the top of the page, activate first element
      if (scrollPos < 200 && allTargets.length > 0) {
        activeId = allTargets[0].id;
      }

      // Clear all active states
      document
        .querySelectorAll('.project-toc a.is-active')
        .forEach((a) => a.classList.remove('is-active'));

      // Set new active state
      if (activeId) {
        document
          .querySelectorAll(`.project-toc a[href="#${CSS.escape(activeId)}"]`)
          .forEach((a) => a.classList.add('is-active'));
      }
    }

    // Use both scroll and IntersectionObserver for best results
    let scrollTimeout;
    window.addEventListener(
      'scroll',
      () => {
        // Throttle scroll events for performance
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateActiveState, 50);
      },
      { passive: true }
    );

    // Also use IntersectionObserver as backup
    const obs = new IntersectionObserver(
      (entries) => {
        // Trigger update when any element enters/exits viewport
        if (entries.some((e) => e.isIntersecting)) {
          updateActiveState();
        }
      },
      {
        rootMargin: '-10% 0px -50% 0px',
        threshold: [0, 0.1, 0.5, 1.0],
      }
    );

    allTargets.forEach((target) => obs.observe(target));

    // Initial state
    updateActiveState();

    // Update on hash change
    window.addEventListener('hashchange', () => {
      setTimeout(updateActiveState, 100);
    });

    // Update on initial hash
    const hash = (window.location.hash || '').replace('#', '').trim();
    if (hash) {
      setTimeout(() => {
        document
          .querySelectorAll(`.project-toc a[href="#${CSS.escape(hash)}"]`)
          .forEach((a) => a.classList.add('is-active'));
      }, 100);
    }
  }

  // -----------------------------
  // 7.4 + 7.5) Deep-link handling + smooth scroll with offset
  // - Opens <details> before scrolling
  // - Prevents wrong anchor jumps
  // - Works for reload, hashchange and TOC clicks
  // -----------------------------

  function getScrollOffset() {
    // Calculate offset based on sticky nav height
    const nav = document.querySelector('#nav');
    if (nav) {
      const style = getComputedStyle(nav);
      if (style.position === 'sticky' || style.position === 'fixed') {
        // Get actual nav height + extra padding for better visual spacing
        return Math.ceil(nav.getBoundingClientRect().height) + 24;
      }
    }

    // Fallback: no sticky nav
    return 32;
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;

    // Open parent <details> BEFORE measuring
    const details = el.closest('details');
    if (details) details.open = true;

    // Wait one frame so layout recalculates
    requestAnimationFrame(() => {
      const offset = getScrollOffset();
      const y = window.scrollY + el.getBoundingClientRect().top - offset;

      window.scrollTo({
        top: Math.max(0, y),
        behavior: 'smooth',
      });
    });
  }

  // Handle hash (reload or manual hash change)
  function openAndScrollToHash() {
    const hash = (window.location.hash || '').replace('#', '').trim();
    if (!hash) return;

    scrollToId(hash);
  }

  // Re-run when hash changes (back/forward etc.)
  window.addEventListener('hashchange', openAndScrollToHash);

  // Intercept TOC links (sidebar + mobile panel)
  function setupTocLinkScrolling() {
    document.querySelectorAll('.project-toc a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href') || '';
        const id = href.replace('#', '').trim();
        if (!id) return;

        // Stop native jump (this causes wrong positioning)
        e.preventDefault();

        // Update URL hash manually
        history.pushState(null, '', `#${id}`);

        // Close mobile TOC panel if open
        document.body.classList.remove('is-tocPanel-visible');

        // Controlled scroll
        scrollToId(id);
      });
    });
  }

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
