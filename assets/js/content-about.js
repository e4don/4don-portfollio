// assets/js/about-content.js
(function () {
  async function loadAboutContent(lang) {
    const url = `content/${lang}/about.json`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
    return res.json();
  }

  function setMeta(nameOrProperty, value) {
    // supports <meta name="..."> and <meta property="...">
    const selector = `meta[name="${nameOrProperty}"], meta[property="${nameOrProperty}"]`;
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', value);
  }

  function renderAbout(data) {
    // Hero
    const heroTitle = document.getElementById('about-hero-title');
    const heroIntro = document.getElementById('about-hero-intro');
    if (heroTitle) heroTitle.textContent = data?.hero?.title ?? '';
    if (heroIntro) heroIntro.textContent = data?.hero?.intro ?? '';

    // Profile
    const avatar = document.getElementById('about-avatar');
    const name = document.getElementById('about-name');
    const role = document.getElementById('about-role');
    const location = document.getElementById('about-location');

    if (avatar) avatar.setAttribute('alt', data?.profile?.avatarAlt ?? '');
    if (name) name.textContent = data?.profile?.name ?? '';
    if (role) role.textContent = data?.profile?.role ?? '';
    if (location) location.textContent = data?.profile?.location ?? '';

    // Sections
    const mindsetTitle = document.getElementById('about-mindset-title');
    const mindsetText = document.getElementById('about-mindset-text');
    if (mindsetTitle) mindsetTitle.textContent = data?.sections?.mindset?.title ?? '';
    if (mindsetText) mindsetText.textContent = data?.sections?.mindset?.text ?? '';

    const workTitle = document.getElementById('about-work-title');
    const workList = document.getElementById('about-work-list');
    if (workTitle) workTitle.textContent = data?.sections?.work?.title ?? '';

    if (workList) {
      workList.innerHTML = '';
      const items = data?.sections?.work?.list ?? [];
      for (const item of items) {
        const li = document.createElement('li');
        li.textContent = item;
        workList.appendChild(li);
      }
    }

    const techTitle = document.getElementById('about-tech-title');
    const techText = document.getElementById('about-tech-text');
    if (techTitle) techTitle.textContent = data?.sections?.tech?.title ?? '';
    if (techText) techText.textContent = data?.sections?.tech?.text ?? '';

    // CTA
    const ctaProjects = document.getElementById('about-cta-projects');
    const ctaContact = document.getElementById('about-cta-contact');
    if (ctaProjects) ctaProjects.textContent = data?.cta?.projects ?? '';
    if (ctaContact) ctaContact.textContent = data?.cta?.contact ?? '';

    // Meta / SEO (optional but nice)
    const pageTitle = data?.meta?.title ? `4DON.com - ${data.meta.title}` : '4DON.com';
    document.title = pageTitle;

    if (data?.meta?.description) {
      setMeta('description', data.meta.description);
      setMeta('og:description', data.meta.description);
      setMeta('twitter:description', data.meta.description);
    }

    // OG title
    setMeta('og:title', data?.meta?.title ? `4don — ${data.meta.title}` : '4don');
    setMeta('twitter:title', data?.meta?.title ? `4don — ${data.meta.title}` : '4don');
  }

  async function update(lang) {
    try {
      const data = await loadAboutContent(lang);
      renderAbout(data);
    } catch (e) {
      console.error('[about-content] render failed:', e);
    }
  }

  // hook into your existing i18n system
  window.i18n?.onChange?.((lang) => update(lang));

  // if i18n is already ready for some reason, render once
  const initialLang = window.i18n?.getLang?.();
  if (initialLang) update(initialLang);
})();
