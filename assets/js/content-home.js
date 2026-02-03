// assets/js/content-home.js
(function () {
  async function loadHomeContent(lang) {
    const url = `content/${lang}/home.json`;
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

  function setAlt(id, value) {
    const el = document.getElementById(id);
    if (el) el.setAttribute('alt', value ?? '');
  }

  function renderHome(data) {
    // meta
    if (data?.meta?.title) document.title = `4DON.com - ${data.meta.title}`;
    if (data?.meta?.description) {
      setMeta('description', data.meta.description);
      setMeta('og:description', data.meta.description);
      setMeta('twitter:description', data.meta.description);
    }

    // intro
    setHtml('home-intro-text', data?.intro?.text);
    setText('home-intro-cta', data?.intro?.cta);

    // featured
    setText('home-featured-kicker', data?.featured?.kicker);
    setHtml('home-featured-title', data?.featured?.titleHtml);
    setText('home-featured-text', data?.featured?.text);
    setAlt('home-featured-image', data?.featured?.imageAlt);
    setText('home-featured-cta', data?.featured?.cta);

    // cards
    const cards = data?.cards ?? [];
    for (let i = 0; i < 2; i++) {
      const c = cards[i] || {};
      setText(`home-card-${i}-kicker`, c.kicker);
      setText(`home-card-${i}-title`, c.title);
      setText(`home-card-${i}-text`, c.text);
      setAlt(`home-card-${i}-image`, c.imageAlt);
      setText(`home-card-${i}-cta`, c.cta);
      // href optional:
      // const link = document.getElementById(`home-card-${i}-title`)?.closest('a');
      // if (link && c.href) link.setAttribute('href', c.href);
    }
  }

  async function update(lang) {
    try {
      const data = await loadHomeContent(lang);
      renderHome(data);
    } catch (e) {
      console.error('[content-home] render failed:', e);
    }
  }

  // hook into existing i18n system
  window.i18n?.onChange?.((lang) => update(lang));

  // initial render
  const initialLang = window.i18n?.getLang?.();
  if (initialLang) update(initialLang);
})();
