/* 4don - Projects Loader (v1.8)
   Loads language-specific project card data and renders project cards
   using the HTML5 UP Massively layout.

   Data sources (recommended):
   - DE cards:  content/de/projects.cards.json
   - EN cards:  content/en/projects.cards.json

   This script is intentionally responsible ONLY for:
   - Loading the cards data (language-aware)
   - Rendering cards
   - Search + Tag filtering
   - URL sync (q + tag)
   - SPA-like back navigation restore (search/tag + scroll)
   - i18n-ready UI text via window.i18n.t()

   Features:
   - Sorting (newest → oldest) via date (YYYY-MM or YYYY-MM-DD)
   - Search (title / description / tags)
   - Tag filter (dropdown)
   - Badge-based tag display
   - Optional GitHub button (if github URL exists)
   - Image fallback via onerror (404-safe)
   - Project detail pages open in same tab
   - SPA-like back navigation:
     -> Saves search/tag + scroll before navigating to detail pages
     -> Restores search/tag + scroll after returning
   - Language-aware loading:
     -> Reloads cards data when language changes (DE/EN)
     -> Keeps current search + tag selection whenever possible
     -> Keeps URL state (q + tag) in sync
*/

(function () {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  // UI controls (optional; script works even if some are missing)
  const searchEl = document.getElementById('projectSearch');
  const tagEl = document.getElementById('tagFilter');
  const resetEl = document.getElementById('resetFilters');
  const metaEl = document.getElementById('projectsMeta');

  // Fallback image for missing / 404 project images
  const FALLBACK_IMG = 'assets/images/projects/fallback.png';

  // =========================================================
  // SPA-like restore keys (sessionStorage)
  // =========================================================
  const KEY_STATE = 'projects.uiState'; // JSON: { q, tag }
  const KEY_SCROLL = 'projects.scrollY'; // number
  const KEY_ARMED = 'projects.restoreArmed'; // "1" => restore on next render

  // =========================================================
  // i18n helpers (safe fallback when i18n.js is not loaded)
  // =========================================================
  const tt = (key, fallback) => (window.i18n?.t ? window.i18n.t(key, fallback) : fallback);

  const format = (s, vars) =>
    String(s).replace(/\{(\w+)\}/g, (_, k) =>
      Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : `{${k}}`
    );

  // Escape helper (XSS-safe for HTML string output)
  const esc = (s) =>
    String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  // Normalize tags into a clean string array
  const normTags = (tags) => (Array.isArray(tags) ? tags.filter(Boolean).map(String) : []);

  // Date parser (accepts YYYY-MM or YYYY-MM-DD)
  const parseDate = (d) => {
    if (!d) return 0;
    const s = String(d).trim();
    const iso = /^\d{4}-\d{2}$/.test(s) ? `${s}-01` : s;
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : 0;
  };

  // =========================================================
  // Language-aware data URL
  // =========================================================
  function getProjectsDataUrl() {
    const lang = window.i18n?.getLang?.() || 'en';
    return `content/${lang}/projects.cards.json`;
  }

  // =========================================================
  // URL sync helpers (q + tag)
  // =========================================================
  function readUrlState() {
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get('q') ?? '';
      const tag = url.searchParams.get('tag') ?? '__all__';
      return { q, tag };
    } catch (_) {
      return { q: '', tag: '__all__' };
    }
  }

  function writeUrlState({ q, tag }) {
    try {
      const url = new URL(window.location.href);

      // q
      const qq = String(q || '').trim();
      if (qq) url.searchParams.set('q', qq);
      else url.searchParams.delete('q');

      // tag
      const ttg = String(tag || '__all__');
      if (ttg && ttg !== '__all__') url.searchParams.set('tag', ttg);
      else url.searchParams.delete('tag');

      // keep lang param intact (handled by i18n.js)
      history.replaceState({}, '', url);
    } catch (_) {
      /* ignore */
    }
  }

  // =========================================================
  // Save / restore UI state (search + tag) and scroll position
  // =========================================================
  function saveUIState() {
    try {
      const state = {
        q: searchEl ? String(searchEl.value ?? '') : '',
        tag: tagEl ? String(tagEl.value ?? '__all__') : '__all__',
      };
      sessionStorage.setItem(KEY_STATE, JSON.stringify(state));
    } catch (_) {
      /* ignore */
    }
  }

  function restoreUIState() {
    // Must be called AFTER tag options are built
    try {
      const raw = sessionStorage.getItem(KEY_STATE);
      if (!raw) return;

      const state = JSON.parse(raw);

      // Restore search
      if (searchEl && typeof state.q === 'string') {
        searchEl.value = state.q;
      }

      // Restore tag only if option exists
      if (tagEl && typeof state.tag === 'string') {
        const hasOption = Array.from(tagEl.options).some((o) => o.value === state.tag);
        tagEl.value = hasOption ? state.tag : '__all__';
      }
    } catch (_) {
      /* ignore */
    }
  }

  function rememberProjectsScrollAndState() {
    // Called before navigating to a project detail page
    try {
      saveUIState();
      sessionStorage.setItem(KEY_SCROLL, String(window.scrollY || 0));
      sessionStorage.setItem(KEY_ARMED, '1');
    } catch (_) {
      /* ignore */
    }
  }

  // Global click capture:
  // Only links explicitly marked with data-project-link
  // will trigger state + scroll saving.
  document.addEventListener(
    'click',
    (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      if (a.hasAttribute('data-project-link')) {
        rememberProjectsScrollAndState();
      }
    },
    true // capture phase (fires early, even for nested elements)
  );

  // =========================================================
  // UI helpers
  // =========================================================
  function buildTagOptions(projects) {
    if (!tagEl) return;

    // Collect unique tags (case-insensitive, sorted)
    const set = new Set();
    projects.forEach((p) => normTags(p.tags).forEach((t) => set.add(String(t).trim())));

    const tags = Array.from(set).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

    // Localized label for the "__all__" option
    const allLabel = esc(tt('projects.allTags', 'All tags'));

    tagEl.innerHTML =
      `<option value="__all__">${allLabel}</option>` +
      tags
        .map((t) => {
          const label = esc(t);
          // value is lowercase to match the filter logic
          const value = esc(t.toLowerCase());
          return `<option value="${value}">${label}</option>`;
        })
        .join('');
  }

  function updateMeta(shown, total) {
    if (!metaEl) return;
    if (total === 0) {
      metaEl.textContent = '';
      return;
    }
    const tpl = tt('projects.meta', '{shown} of {total} projects');
    metaEl.textContent = format(tpl, { shown, total });
  }

  function matchesFilters(p) {
    const q = (searchEl?.value ?? '').trim().toLowerCase();
    const tag = tagEl?.value ?? '__all__';

    const title = String(p.title ?? '').toLowerCase();
    const desc = String(p.description ?? '').toLowerCase();

    const tags = normTags(p.tags);
    const tagsLower = tags.map((t) => t.toLowerCase());
    const tagsStr = tagsLower.join(' ');

    const tagOk = tag === '__all__' || tagsLower.includes(tag);
    const qOk = !q || title.includes(q) || desc.includes(q) || tagsStr.includes(q);

    return tagOk && qOk;
  }

  function render(projects) {
    if (!Array.isArray(projects) || projects.length === 0) {
      const emptyTitle = esc(tt('projects.emptyTitle', 'No projects found'));
      const emptyHint = esc(tt('projects.emptyHint', 'Reset filters or check projects.json.'));

      grid.innerHTML = `
        <article>
          <header><h2>${emptyTitle}</h2></header>
          <p>${emptyHint}</p>
        </article>`;
      return;
    }

    const openLabel = esc(tt('projects.open', 'Open'));
    const githubLabel = esc(tt('projects.github', 'GitHub'));

    grid.innerHTML = projects
      .map((p) => {
        const title = esc(p.title);
        const date = esc(p.date || '');
        const desc = esc(p.description || '');

        const img = esc(p.image || FALLBACK_IMG);
        const url = esc(p.url || '');
        const github = esc(p.github || '');
        const tags = normTags(p.tags).map(esc);

        // Action buttons
        const actions = [];

        if (url) {
          actions.push(
            `<li><a href="${url}" class="button" data-project-link="1">${openLabel}</a></li>`
          );
        }

        if (github) {
          actions.push(
            `<li><a href="${github}" class="button" target="_blank" rel="noopener">${githubLabel}</a></li>`
          );
        }

        const actionsHtml =
          actions.length > 0 ? `<ul class="actions special">${actions.join('')}</ul>` : '';

        // 404-safe image fallback
        const imgTag = `<img src="${img}" alt="${title}"
          onerror="this.onerror=null;this.src='${esc(FALLBACK_IMG)}';" />`;

        // Image wrapper: clickable when url exists (same tab)
        const imageHtml = url
          ? `<a href="${url}" class="image fit" data-project-link="1">${imgTag}</a>`
          : `<span class="image fit">${imgTag}</span>`;

        // Badges
        const badges =
          tags.length > 0
            ? `<div class="project-badges">
                ${tags.map((t) => `<span class="project-badge">${t}</span>`).join('')}
              </div>`
            : '';

        return `
          <article>
            <header>
              ${date ? `<span class="date">${date}</span>` : ''}
              ${
                url
                  ? `<h2><a href="${url}" data-project-link="1">${title}</a></h2>`
                  : `<h2>${title}</h2>`
              }
            </header>

            ${imageHtml}
            <p>${desc}</p>
            ${badges}
            ${actionsHtml}
          </article>
        `;
      })
      .join('');

    // Re-apply translations for any data-i18n elements rendered dynamically (optional)
    window.i18n?.apply?.(grid);
  }

  function restoreScrollIfArmed() {
    // Restore scroll position after returning from a detail page
    try {
      const armed = sessionStorage.getItem(KEY_ARMED) === '1';
      if (!armed) return;

      const y = parseInt(sessionStorage.getItem(KEY_SCROLL) || '0', 10);
      sessionStorage.removeItem(KEY_ARMED);

      if (Number.isFinite(y)) {
        setTimeout(() => window.scrollTo(0, y), 50);
      }
    } catch (_) {
      /* ignore */
    }
  }

  function applyAndRender(allProjects) {
    const filtered = allProjects.filter(matchesFilters);
    updateMeta(filtered.length, allProjects.length);
    render(filtered);

    // Keep UI state in sync
    saveUIState();

    // Keep the URL in sync (q + tag)
    writeUrlState({
      q: searchEl ? searchEl.value : '',
      tag: tagEl ? tagEl.value : '__all__',
    });

    restoreScrollIfArmed();
  }

  // =========================================================
  // Loading (language-aware) + event binding (only once)
  // =========================================================
  let allProjects = [];
  let eventsBound = false;

  function bindUIEventsOnce() {
    if (eventsBound) return;
    eventsBound = true;

    if (searchEl) searchEl.addEventListener('input', () => applyAndRender(allProjects));
    if (tagEl) tagEl.addEventListener('change', () => applyAndRender(allProjects));

    if (resetEl) {
      resetEl.addEventListener('click', () => {
        if (searchEl) searchEl.value = '';
        if (tagEl) tagEl.value = '__all__';

        try {
          sessionStorage.removeItem(KEY_STATE);
        } catch (_) {
          /* ignore */
        }

        applyAndRender(allProjects);
      });
    }

    // Browser back / forward support (q + tag via URL)
    window.addEventListener('popstate', () => {
      const st = readUrlState();

      if (searchEl) searchEl.value = st.q;

      if (tagEl) {
        const hasOption = Array.from(tagEl.options).some((o) => o.value === st.tag);
        tagEl.value = hasOption ? st.tag : '__all__';
      }

      applyAndRender(allProjects);
    });
  }

  async function loadProjects({ reason = 'init' } = {}) {
    const prevQ = searchEl ? String(searchEl.value || '') : '';
    const prevTag = tagEl ? String(tagEl.value || '__all__') : '__all__';

    try {
      const url = getProjectsDataUrl();
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const projects = Array.isArray(data) ? data : data.projects;

      if (!Array.isArray(projects) || projects.length === 0) {
        allProjects = [];
        updateMeta(0, 0);

        const emptyTitle = esc(tt('projects.emptyTitle', 'No projects found'));
        const emptyHint = esc(tt('projects.emptyHint', 'Reset filters or check projects.json.'));

        grid.innerHTML = `
          <article>
            <header><h2>${emptyTitle}</h2></header>
            <p>${emptyHint}</p>
          </article>`;
        return;
      }

      // Sort newest first
      projects.sort((a, b) => parseDate(b.date) - parseDate(a.date));
      allProjects = projects;

      // Build tag dropdown BEFORE restoring state
      buildTagOptions(allProjects);

      // 1) Apply URL state first (shareable links)
      const urlState = readUrlState();
      if (searchEl) searchEl.value = urlState.q;

      if (tagEl) {
        const hasOption = Array.from(tagEl.options).some((o) => o.value === urlState.tag);
        tagEl.value = hasOption ? urlState.tag : '__all__';
      }

      // 2) Then restore session state (SPA-like back), but only if armed
      try {
        const armed = sessionStorage.getItem(KEY_ARMED) === '1';
        if (armed) restoreUIState();
      } catch (_) {
        /* ignore */
      }

      // On language change: keep current UI (search + tag) if possible.
      // (Works best if tags are identical across languages)
      if (reason === 'langChange') {
        if (searchEl) searchEl.value = prevQ;

        if (tagEl) {
          const hasOption = Array.from(tagEl.options).some((o) => o.value === prevTag);
          tagEl.value = hasOption ? prevTag : '__all__';
        }
      }

      // Render
      applyAndRender(allProjects);

      // Bind events once
      bindUIEventsOnce();
    } catch (err) {
      allProjects = [];
      updateMeta(0, 0);

      const failTitle = esc(tt('projects.loadFailTitle', 'Failed to load projects'));
      const failTip = esc(
        tt(
          'projects.loadFailTip',
          'Tip: Open the site via a local server (e.g. VS Code "Live Server").'
        )
      );

      grid.innerHTML = `
        <article>
          <header><h2>${failTitle}</h2></header>
          <p>
            Error: <code>${esc(err.message)}</code><br />
            ${failTip}
          </p>
        </article>
      `;
    }
  }

  // Initial load
  loadProjects({ reason: 'init' });

  // Reload cards data on language change
  window.i18n?.onChange?.(() => {
    loadProjects({ reason: 'langChange' });
  });
})();
