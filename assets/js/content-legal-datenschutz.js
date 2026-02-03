// assets/js/content-legal-datenschutz.js
(function () {
  async function loadContent(lang) {
    const url = `../content/${lang}/legal/datenschutz.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
    return res.json();
  }

  function setMeta(nameOrProperty, value) {
    const selector = `meta[name="${nameOrProperty}"], meta[property="${nameOrProperty}"]`;
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', value);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '';
  }

  function setHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value ?? '';
  }

  function render(data) {
    // meta
    if (data?.meta?.title) document.title = `4DON.com - ${data.meta.title}`;
    if (data?.meta?.description) {
      setMeta('description', data.meta.description);
      setMeta('og:description', data.meta.description);
      setMeta('twitter:description', data.meta.description);
    }
    if (data?.meta?.title) {
      setMeta('og:title', data.meta.title);
      setMeta('twitter:title', data.meta.title);
    }

    // header
    setText('legal-title', data?.header?.title);
    setText('legal-subtitle', data?.header?.subtitle);

    // optional note (EN)
    if (data?.note?.html) setHtml('legal-note', data.note.html);
    else setHtml('legal-note', '');

    // sections
    const container = document.getElementById('legal-sections');
    if (container) {
      container.innerHTML = '';
      const sections = data?.sections ?? [];
      for (const s of sections) {
        const h2 = document.createElement('h2');
        h2.textContent = s.title ?? '';
        container.appendChild(h2);

        const div = document.createElement('div');
        div.innerHTML = s.html ?? '';
        container.appendChild(div);
      }
    }

    // link to imprint
    const a = document.getElementById('legal-to-imprint');
    if (a) {
      a.textContent = data?.links?.toImprint ?? '';
      a.setAttribute('href', data?.links?.imprintHref ?? 'impressum.html');
    }
  }

  async function update(lang) {
    try {
      const data = await loadContent(lang);
      render(data);
    } catch (e) {
      console.error('[content-legal-datenschutz] render failed:', e);
    }
  }

  window.i18n?.onChange?.((lang) => update(lang));

  const initialLang = window.i18n?.getLang?.();
  if (initialLang) update(initialLang);
})();
