// assets/js/content-contact.js
(function () {
  // ---------------------------------------------------------
  // Formspree endpoint (SET THIS)
  // ---------------------------------------------------------
  const FORM_ENDPOINT = 'https://formspree.io/f/mdadwwke';

  // ---------------------------------------------------------
  // Load content
  // ---------------------------------------------------------
  async function loadContent(lang) {
    const url = `content/${lang}/contact.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
    return res.json();
  }

  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------
  function setMeta(nameOrProperty, value) {
    const selector = `meta[name="${nameOrProperty}"], meta[property="${nameOrProperty}"]`;
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', value);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '';
  }

  function setAttr(id, attr, value) {
    const el = document.getElementById(id);
    if (el && value != null) el.setAttribute(attr, value);
  }

  // ---------------------------------------------------------
  // Render page
  // ---------------------------------------------------------
  function render(data) {
    // Meta
    if (data?.meta?.title) document.title = `4DON.com - ${data.meta.title}`;
    if (data?.meta?.description) {
      setMeta('description', data.meta.description);
      setMeta('og:description', data.meta.description);
      setMeta('twitter:description', data.meta.description);
    }
    if (data?.meta?.title) {
      setMeta('og:title', `4don — ${data.meta.title}`);
      setMeta('twitter:title', `4don — ${data.meta.title}`);
    }

    // Header
    setText('contact-title', data?.header?.title);
    setText('contact-intro', data?.header?.intro);

    // Direct section
    setText('contact-direct-title', data?.direct?.title);
    setText('contact-mail-cta', data?.direct?.mailCta);
    setText('contact-github-cta', data?.direct?.githubCta);

    // Form texts
    setText('contact-form-title', data?.form?.title);
    setText('contact-form-hint', data?.form?.hint);

    setText('contact-label-name', data?.form?.nameLabel);
    setText('contact-label-email', data?.form?.emailLabel);
    setText('contact-label-message', data?.form?.messageLabel);

    setAttr('contact-input-name', 'placeholder', data?.form?.namePlaceholder);
    setAttr('contact-input-email', 'placeholder', data?.form?.emailPlaceholder);
    setAttr('contact-input-message', 'placeholder', data?.form?.messagePlaceholder);

    setText('contact-submit', data?.form?.submit);

    // Status messages
    setAttr('contact-form-status', 'data-success', data?.form?.success ?? '');
    setAttr('contact-form-status', 'data-error', data?.form?.error ?? '');

    // Form endpoint
    const form = document.getElementById('contact-form');
    if (form && FORM_ENDPOINT) {
      form.setAttribute('action', FORM_ENDPOINT);
    }

    // Store current language in hidden field
    const langInput = document.getElementById('contact-hidden-lang');
    if (langInput && window.i18n?.getLang) {
      langInput.value = window.i18n.getLang();
    }
  }

  // ---------------------------------------------------------
  // Form logic (wire once)
  // ---------------------------------------------------------
  function wireForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('contact-form-status');
    if (!form || !status) return;

    // Safety check (should not happen now)
    if (!form.getAttribute('action')) return;

    // --- Animated status helpers ---
    function showStatus(type, text) {
      status.classList.remove('is-success', 'is-error', 'is-visible');
      status.textContent = text;
      status.style.display = 'block';

      // force reflow so animation always triggers
      void status.offsetWidth;

      status.classList.add(type === 'success' ? 'is-success' : 'is-error');
      status.classList.add('is-visible');
    }

    function hideStatus() {
      status.classList.remove('is-visible', 'is-success', 'is-error');
      status.style.display = 'none';
      status.textContent = '';
    }
    // --- end helpers ---

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot
      const hp = form.querySelector('input[name="_gotcha"]');
      if (hp && hp.value) return;

      hideStatus();

      const formData = new FormData(form);

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          showStatus(
            'success',
            status.getAttribute('data-success') || 'Thanks! Your message has been sent.'
          );
          form.reset();
        } else {
          showStatus(
            'error',
            status.getAttribute('data-error') || 'Oops — something went wrong. Please try again.'
          );
        }
      } catch (_) {
        showStatus(
          'error',
          status.getAttribute('data-error') || 'Oops — something went wrong. Please try again.'
        );
      }
    });
  }

  // ---------------------------------------------------------
  // Update flow (render → wire once)
  // ---------------------------------------------------------
  let formWired = false;

  async function update(lang) {
    try {
      const data = await loadContent(lang);
      render(data);

      if (!formWired) {
        wireForm();
        formWired = true;
      }
    } catch (e) {
      console.error('[content-contact] render failed:', e);
    }
  }

  // React to language changes
  window.i18n?.onChange?.((lang) => update(lang));

  // Initial render
  const initialLang = window.i18n?.getLang?.();
  if (initialLang) update(initialLang);
})();
