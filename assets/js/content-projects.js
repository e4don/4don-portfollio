// assets/js/content-projects.js
(function () {
  async function loadContent(lang) {
    const url = `content/${lang}/projects.page.json`;
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

    // header
    setText('projects-page-title', data?.header?.title);
    setHtml('projects-page-intro', data?.header?.introHtml);
    setText('projects-page-note', data?.header?.note);
  }

  async function update(lang) {
    try {
      const data = await loadContent(lang);
      render(data);
    } catch (e) {
      console.error('[content-projects] render failed:', e);
    }
  }

  window.i18n?.onChange?.((lang) => update(lang));

  const initialLang = window.i18n?.getLang?.();
  if (initialLang) update(initialLang);
})();
