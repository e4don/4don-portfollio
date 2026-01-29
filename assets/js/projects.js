/* 4don - Projects Loader
   Loads /projects.json and renders project cards using the HTML5 UP Massively layout.

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

  // Internal state
  let allProjects = [];

  // =========================================================
  // Save / restore UI state (search + tag) and scroll position
  //
  // Why?
  // - Browser back navigation is unreliable with dynamic rendering
  // - Project list is rebuilt from JSON on every load
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

  function buildTagOptions(projects) {
    if (!tagEl) return;

    // Collect unique tags (case-insensitive, sorted)
    const set = new Set();
    projects.forEach((p) => normTags(p.tags).forEach((t) => set.add(String(t).trim())));

    const tags = Array.from(set).sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }));

    tagEl.innerHTML =
      `<option value="__all__">All tags</option>` +
      tags
        .map((t) => {
          const label = esc(t);
          const value = esc(t.toLowerCase());
          return `<option value="${value}">${label}</option>`;
        })
        .join('');
  }

  function updateMeta(shown, total) {
    if (!metaEl) return;
    metaEl.textContent = total === 0 ? '' : `${shown} of ${total} projects`;
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
      grid.innerHTML = `
        <article>
          <header><h2>No projects found</h2></header>
          <p>Reset filters or check <code>projects.json</code>.</p>
        </article>`;
      return;
    }

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
          actions.push(`<li><a href="${url}" class="button" data-project-link="1">Open</a></li>`);
        }

        if (github) {
          actions.push(
            `<li><a href="${github}" class="button" target="_blank" rel="noopener">GitHub</a></li>`
          );
        }

        const actionsHtml =
          actions.length > 0 ? `<ul class="actions special">${actions.join('')}</ul>` : '';

        const imgTag = `<img src="${img}" alt="${title}"
          onerror="this.onerror=null;this.src='${esc(FALLBACK_IMG)}';" />`;

        const imageHtml = url
          ? `<a href="${url}" class="image fit" data-project-link="1">${imgTag}</a>`
          : `<span class="image fit">${imgTag}</span>`;

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
  }

  function applyAndRender() {
    const filtered = allProjects.filter(matchesFilters);
    updateMeta(filtered.length, allProjects.length);
    render(filtered);

    // Keep UI state in sync
    saveUIState();

    // Restore scroll position after returning from a detail page
    try {
      const armed = sessionStorage.getItem(KEY_ARMED) === '1';
      if (armed) {
        const y = parseInt(sessionStorage.getItem(KEY_SCROLL) || '0', 10);
        sessionStorage.removeItem(KEY_ARMED);

        if (Number.isFinite(y)) {
          setTimeout(() => window.scrollTo(0, y), 50);
        }
      }
    } catch (_) {
      /* ignore */
    }
  }

  // =========================================================
  // Load projects.json
  // =========================================================
  fetch('projects.json', { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const projects = Array.isArray(data) ? data : data.projects;

      if (!Array.isArray(projects) || projects.length === 0) {
        allProjects = [];
        updateMeta(0, 0);
        grid.innerHTML = `
          <article>
            <header><h2>No projects found</h2></header>
            <p><code>projects.json</code> contains no entries.</p>
          </article>`;
        return;
      }

      // Sort newest first
      projects.sort((a, b) => parseDate(b.date) - parseDate(a.date));
      allProjects = projects;

      // Build tag dropdown BEFORE restoring UI state
      buildTagOptions(allProjects);

      // Restore search + tag (if returning from detail page)
      restoreUIState();

      // Initial render (also restores scroll if armed)
      applyAndRender();

      // UI events
      if (searchEl) searchEl.addEventListener('input', applyAndRender);
      if (tagEl) tagEl.addEventListener('change', applyAndRender);

      if (resetEl) {
        resetEl.addEventListener('click', () => {
          if (searchEl) searchEl.value = '';
          if (tagEl) tagEl.value = '__all__';

          // Clear stored UI state
          try {
            sessionStorage.removeItem(KEY_STATE);
          } catch (_) {
            /* ignore */
          }

          applyAndRender();
        });
      }
    })
    .catch((err) => {
      updateMeta(0, 0);
      grid.innerHTML = `
        <article>
          <header><h2>Failed to load projects</h2></header>
          <p>
            Error: <code>${esc(err.message)}</code><br />
            Tip: Open the site via a local server (e.g. VS Code "Live Server").
          </p>
        </article>
      `;
    });
})();
