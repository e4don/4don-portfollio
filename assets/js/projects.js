/* 4don - Projects Loader
   Lädt /projects.json und rendert Projekt-Cards im Massively-Layout.

   Features:
   - Sortierung (neu -> alt) via date (YYYY-MM oder YYYY-MM-DD)
   - Search (Titel/Beschreibung/Tags)
   - Tag-Filter (Dropdown)
   - Badges statt "Tags: …"
   - Optional: GitHub-Button, wenn github vorhanden
   - Bild-Fallback via onerror (wenn Projektbild 404)
   - Detailseiten (url) öffnen im selben Tab
*/

(function () {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  // Controls (optional; falls nicht vorhanden, läuft's trotzdem)
  const searchEl = document.getElementById('projectSearch');
  const tagEl = document.getElementById('tagFilter');
  const resetEl = document.getElementById('resetFilters');
  const metaEl = document.getElementById('projectsMeta');

  // Fallback-Image (für missing/404 Projektbilder)
  const FALLBACK_IMG = 'assets/images/projects/fallback.png';

  // Helper: sicherer Text (XSS-safe für HTML-Strings)
  const esc = (s) =>
    String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  // Normalisiert tags
  const normTags = (tags) => (Array.isArray(tags) ? tags.filter(Boolean).map(String) : []);

  // Date parse: akzeptiert "YYYY-MM" oder "YYYY-MM-DD"
  const parseDate = (d) => {
    if (!d) return 0;
    const s = String(d).trim();
    const iso = /^\d{4}-\d{2}$/.test(s) ? `${s}-01` : s;
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : 0;
  };

  // State
  let allProjects = [];

  function buildTagOptions(projects) {
    if (!tagEl) return;

    // Dropdown value in lowercase (robust gegen DNS vs dns etc.)
    const set = new Set();
    projects.forEach((p) => normTags(p.tags).forEach((t) => set.add(String(t).trim())));

    const tags = Array.from(set).sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }));

    tagEl.innerHTML =
      `<option value="__all__">Alle Tags</option>` +
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
    if (total === 0) {
      metaEl.textContent = '';
      return;
    }
    metaEl.textContent = `${shown} von ${total} Projekten`;
  }

  function matchesFilters(p) {
    const q = (searchEl?.value ?? '').trim().toLowerCase();
    const tag = tagEl?.value ?? '__all__';

    const title = String(p.title ?? '').toLowerCase();
    const desc = String(p.description ?? '').toLowerCase();

    const tags = normTags(p.tags);
    const tagsLower = tags.map((t) => String(t).toLowerCase());
    const tagsStr = tagsLower.join(' ');

    const tagOk = tag === '__all__' ? true : tagsLower.includes(tag);
    const qOk = !q ? true : title.includes(q) || desc.includes(q) || tagsStr.includes(q);

    return tagOk && qOk;
  }

  function render(projects) {
    if (!Array.isArray(projects) || projects.length === 0) {
      grid.innerHTML = `
        <article>
          <header><h2>Keine Projekte gefunden</h2></header>
          <p>Bitte Filter zurücksetzen oder <code>projects.json</code> prüfen.</p>
        </article>`;
      return;
    }

    grid.innerHTML = projects
      .map((p) => {
        const title = esc(p.title);
        const date = esc(p.date || '');
        const desc = esc(p.description || '');

        // Projektbild: wenn nicht gesetzt -> FALLBACK_IMG
        const img = esc(p.image || FALLBACK_IMG);

        // Links:
        // - url = Detailseite (same tab)
        // - github = Repo-Link (neues Tab)
        const url = esc(p.url || '');
        const github = esc(p.github || '');

        const tags = normTags(p.tags).map(esc);

        // Buttons: Open (url) + GitHub (optional)
        const actions = [];

        if (url) {
          // Detailseite same tab (kein target blank)
          actions.push(`<li><a href="${url}" class="button">Open</a></li>`);
        }

        if (github) {
          // GitHub bewusst neues Tab
          actions.push(
            `<li><a href="${github}" class="button" target="_blank" rel="noopener">GitHub</a></li>`
          );
        }

        const actionsHtml =
          actions.length > 0 ? `<ul class="actions special">${actions.join('')}</ul>` : '';

        // Bild-Fallback auch bei 404 (onerror)
        const imgTag = `<img src="${img}" alt="${title}" onerror="this.onerror=null;this.src='${esc(
          FALLBACK_IMG
        )}';" />`;

        // Image Wrapper:
        // Wenn URL existiert: Bild klickbar -> same tab
        const imageHtml = url
          ? `<a href="${url}" class="image fit">${imgTag}</a>`
          : `<span class="image fit">${imgTag}</span>`;

        // Badges
        const badges =
          tags.length > 0
            ? `<div class="project-badges">
                ${tags
                  .map((t, idx) => {
                    // optional Accent:
                    // const cls = idx === 0 ? 'project-badge is-accent' : 'project-badge';
                    const cls = 'project-badge';
                    return `<span class="${cls}">${t}</span>`;
                  })
                  .join('')}
              </div>`
            : '';

        return `
          <article>
            <header>
              ${date ? `<span class="date">${date}</span>` : ''}
              <h2>${url ? `<a href="${url}">${title}</a>` : title}</h2>
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
  }

  // Load projects.json
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
            <header><h2>Keine Projekte gefunden</h2></header>
            <p>In <code>projects.json</code> sind aktuell keine Einträge vorhanden.</p>
          </article>`;
        return;
      }

      // Sortierung: neueste zuerst
      projects.sort((a, b) => parseDate(b.date) - parseDate(a.date));

      allProjects = projects;

      // Tag-Dropdown füllen
      buildTagOptions(allProjects);

      // Initial render
      applyAndRender();

      // Events
      if (searchEl) searchEl.addEventListener('input', applyAndRender);
      if (tagEl) tagEl.addEventListener('change', applyAndRender);

      if (resetEl) {
        resetEl.addEventListener('click', () => {
          if (searchEl) searchEl.value = '';
          if (tagEl) tagEl.value = '__all__';
          applyAndRender();
        });
      }
    })
    .catch((err) => {
      updateMeta(0, 0);
      grid.innerHTML = `
        <article>
          <header><h2>Projekte konnten nicht geladen werden</h2></header>
          <p>
            Fehler: <code>${esc(err.message)}</code><br />
            Tipp: Öffne die Seite über einen lokalen Server (z.B. VS Code "Live Server").
          </p>
        </article>
      `;
    });
})();
