/**
 * MARANATA — app.js (V1)
 * Sin frameworks. Puro JS modular.
 *
 * Módulos:
 *  1. Nav: sticky + burger + active links
 *  2. Cartelera: carga JSON + render + filtros
 *  3. Formulario: validación + localStorage + CSV + mailto
 *  4. Reveal: scroll animations
 *  5. Toast: notificaciones
 */

'use strict';

/* ══════════════════════════════════════════════════
   1. NAV
══════════════════════════════════════════════════ */
const Nav = (() => {
  const header   = document.getElementById('header');
  const burger   = document.querySelector('.nav-burger');
  const mobileNav = document.getElementById('nav-mobile');
  const allLinks  = document.querySelectorAll('.nav-links a, .nav-mobile a');
  const sections  = document.querySelectorAll('section[id]');

  /* Sticky shadow */
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 20);
    updateActiveLink();
  }

  /* Active link via IntersectionObserver */
  function updateActiveLink() {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 100) {
        current = sec.id;
      }
    });
    allLinks.forEach(link => {
      const href = link.getAttribute('href')?.replace('#', '');
      link.classList.toggle('active', href === current);
    });
  }

  /* Burger */
  function toggleMobile() {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    mobileNav.classList.toggle('open', !open);
    mobileNav.setAttribute('aria-hidden', String(open));
    burger.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
  }

  /* Close mobile nav on link click */
  function closeMobile() {
    burger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-label', 'Abrir menú');
  }

  function init() {
    window.addEventListener('scroll', onScroll, { passive: true });
    burger?.addEventListener('click', toggleMobile);
    document.querySelectorAll('.nav-mobile a').forEach(l => {
      l.addEventListener('click', closeMobile);
    });
    onScroll();
  }

  return { init };
})();

/* ══════════════════════════════════════════════════
   2. CARTELERA
══════════════════════════════════════════════════ */
const Cartelera = (() => {
  const grid   = document.getElementById('cartelera-grid');
  const filters = document.querySelectorAll('.filter-btn');
  let allActividades = [];
  let activeFilter = 'all';

  /* Category labels */
  const catLabels = {
    culto:    'Culto',
    oracion:  'Oración',
    academia: 'Academia',
    taller:   'Taller',
    servicio: 'Servicio',
    retiro:   'Retiro',
  };

  /* Format date */
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      day:   d.getDate(),
      month: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
      full:  d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    };
  }

  /* Format time */
  function formatTime(t) {
    const [h, m] = t.split(':');
    return `${h}:${m} hs`;
  }

  /* Build card HTML */
  function buildCard(act, delay) {
    const date = formatDate(act.date);
    return `
      <article
        class="act-card"
        data-category="${act.category}"
        aria-label="${act.title}"
        style="animation-delay:${delay}ms"
      >
        <div class="act-card-band" aria-hidden="true"></div>
        <div class="act-card-body">
          <div class="act-meta">
            <div class="act-date-badge" aria-label="Fecha: ${date.full}">
              <span class="day">${date.day}</span>
              <span class="month">${date.month}</span>
            </div>
            <span class="cat-chip">${catLabels[act.category] ?? act.category}</span>
          </div>
          <h3>${act.title}</h3>
          <p class="act-desc">${act.description}</p>
          <div class="act-footer">
            <div class="act-info-row">
              ${clockIcon()}
              <span>${formatTime(act.time)}</span>
            </div>
            <div class="act-info-row">
              ${pinIcon()}
              <span>${act.location}</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function clockIcon() {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  }
  function pinIcon() {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  }

  /* Render */
  function render(data) {
    if (!data.length) {
      grid.innerHTML = `
        <div class="cartelera-empty" role="status">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 1rem;opacity:.3;display:block" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <strong>Sin actividades en esta categoría.</strong>
          <p>Intenta otro filtro o revisa más adelante.</p>
        </div>`;
      return;
    }
    grid.innerHTML = data
      .map((act, i) => buildCard(act, i * 60))
      .join('');
  }

  /* Filter */
  function applyFilter(cat) {
    activeFilter = cat;
    const filtered = cat === 'all'
      ? allActividades
      : allActividades.filter(a => a.category === cat);
    render(filtered);
  }

  /* Load JSON */
  async function load() {
    try {
      const res = await fetch('data/actividades.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      allActividades = await res.json();
      /* Sort by date */
      allActividades.sort((a, b) => new Date(a.date) - new Date(b.date));
      render(allActividades);
    } catch (err) {
      console.warn('[Cartelera] No se pudo cargar actividades.json.', err);
      grid.innerHTML = `
        <div class="cartelera-empty" role="alert">
          <strong>⚠️ No se pudieron cargar las actividades.</strong>
          <p>Abre el sitio desde un servidor local (Live Server) para evitar restricciones CORS al leer el JSON.</p>
        </div>`;
    }
  }

  function init() {
    load();
    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        applyFilter(btn.dataset.filter);
      });
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════
   3. TOAST
══════════════════════════════════════════════════ */
const Toast = (() => {
  const el    = document.getElementById('toast');
  const icon  = document.getElementById('toast-icon');
  const title = document.getElementById('toast-title');
  const msg   = document.getElementById('toast-msg');
  const close = document.getElementById('toast-close');
  let timer;

  const icons = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  };

  function show(type, titleText, msgText, duration = 5000) {
    clearTimeout(timer);
    el.className = `toast ${type}`;
    el.setAttribute('aria-hidden', 'false');
    icon.innerHTML = icons[type] ?? '';
    title.textContent = titleText;
    msg.textContent   = msgText;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('show'));
    });

    timer = setTimeout(hide, duration);
  }

  function hide() {
    el.classList.remove('show');
    setTimeout(() => el.setAttribute('aria-hidden', 'true'), 400);
  }

  function init() {
    close?.addEventListener('click', hide);
  }

  return { show, init };
})();

/* ══════════════════════════════════════════════════
   4. FORMULARIO DE CONTACTO
══════════════════════════════════════════════════ */
const ContactForm = (() => {

  /* ── LocalStorage schema ── */
  const LS_KEY = 'maranata_submissions_v1';

  /* Configurable CSV columns */
  const CSV_COLUMNS = [
    { key: 'id',          label: 'ID' },
    { key: 'createdAt',   label: 'Fecha/Hora' },
    { key: 'type',        label: 'Tipo' },
    { key: 'name',        label: 'Nombre' },
    { key: 'email',       label: 'Email' },
    { key: 'message',     label: 'Mensaje' },
    { key: 'source',      label: 'Fuente' },
  ];

  /* Rate limit: 1 envío cada 30 segundos */
  const RATE_LIMIT_MS = 30_000;
  let lastSubmitTime = 0;

  /* Admin email — cambiar en producción */
  const ADMIN_EMAIL = 'admin@maranata.org';

  /* ── DOM ── */
  const form       = document.getElementById('contact-form');
  const btnSubmit  = document.getElementById('btn-submit');
  const btnMailto  = document.getElementById('btn-mailto');
  const btnDownload = document.getElementById('btn-download');
  const subsList   = document.getElementById('submissions-list');
  const statusEl   = document.getElementById('submit-status');

  /* ── Helpers ── */
  function getSubmissions() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch { return []; }
  }

  function saveSubmissions(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }

  function genId() {
    return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function escapeCSV(val) {
    if (val == null) return '';
    const str = String(val).replace(/"/g, '""');
    return /[,"\n\r]/.test(str) ? `"${str}"` : str;
  }

  function typeLabel(type) {
    return type === 'oracion' ? 'Petición de Oración' : 'Sugerencia';
  }

  /* ── Render sidebar list ── */
  function renderList() {
    const subs = getSubmissions();
    btnDownload.disabled = subs.length === 0;

    if (!subs.length) {
      subsList.innerHTML = '<div class="submissions-empty">No hay envíos guardados aún.</div>';
      return;
    }

    subsList.innerHTML = [...subs].reverse().slice(0, 10).map(s => `
      <div class="sub-item">
        <div class="sub-type">${typeLabel(s.type)}</div>
        <div class="sub-name">${s.name}</div>
        <div class="sub-time">${new Date(s.createdAt).toLocaleString('es-ES')}</div>
      </div>
    `).join('');
  }

  /* ── Validation ── */
  function validateField(id, errId, condition, msg) {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    const ok  = condition(el.value.trim());
    el.classList.toggle('error', !ok);
    err.classList.toggle('visible', !ok);
    if (!ok) err.textContent = msg;
    return ok;
  }

  function validateForm() {
    const typeOk = validateField('msg-type', 'type-error',
      v => v !== '', 'Por favor selecciona el tipo de mensaje.');
    const nameOk = validateField('msg-name', 'name-error',
      v => v.length >= 2, 'El nombre debe tener al menos 2 caracteres.');
    const emailEl = document.getElementById('msg-email');
    let emailOk = true;
    if (emailEl.value.trim()) {
      emailOk = validateField('msg-email', 'email-error',
        v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Ingresa un email válido.');
    } else {
      emailEl.classList.remove('error');
      document.getElementById('email-error').classList.remove('visible');
    }
    const msgOk = validateField('msg-text', 'message-error',
      v => v.length >= 10, 'El mensaje debe tener al menos 10 caracteres.');
    return typeOk && nameOk && emailOk && msgOk;
  }

  /* ── Build submission object ── */
  function buildSubmission() {
    return {
      id:        genId(),
      createdAt: new Date().toISOString(),
      type:      document.getElementById('msg-type').value,
      name:      document.getElementById('msg-name').value.trim(),
      email:     document.getElementById('msg-email').value.trim() || null,
      message:   document.getElementById('msg-text').value.trim(),
      source:    'landing-v1',
    };
  }

  /* ── CSV Export ── */
  function downloadCSV() {
    const subs = getSubmissions();
    if (!subs.length) return;

    const header = CSV_COLUMNS.map(c => escapeCSV(c.label)).join(',');
    const rows   = subs.map(s =>
      CSV_COLUMNS.map(c => escapeCSV(s[c.key])).join(',')
    );
    const csv = [header, ...rows].join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `maranata-envios-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Toast.show('success', 'CSV descargado', `${subs.length} envío(s) exportados correctamente.`);
  }

  /* ── Mailto builder ── */
  function buildMailto() {
    const type    = document.getElementById('msg-type').value;
    const name    = document.getElementById('msg-name').value.trim();
    const email   = document.getElementById('msg-email').value.trim();
    const message = document.getElementById('msg-text').value.trim();

    const subject = encodeURIComponent(
      `[Maranata] ${typeLabel(type)} — ${name}`
    );
    const body = encodeURIComponent(
      `Tipo: ${typeLabel(type)}\n` +
      `Nombre: ${name}\n` +
      `Email: ${email || '—'}\n` +
      `Fecha: ${new Date().toLocaleString('es-ES')}\n\n` +
      `Mensaje:\n${message}\n\n` +
      `---\nEnviado desde: Maranata Landing V1`
    );
    return `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
  }

  /* ── Set button loading state ── */
  function setLoading(loading) {
    btnSubmit.disabled = loading;
    btnSubmit.innerHTML = loading
      ? `<span class="spinner" style="width:16px;height:16px;border-width:2px;" aria-hidden="true"></span> Guardando…`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Guardar envío`;
  }

  /* ── Submit handler ── */
  async function handleSubmit(e) {
    e.preventDefault();

    /* Honeypot check */
    const hp = document.getElementById('hp-name');
    if (hp && hp.value) {
      console.warn('[Spam] Honeypot triggered.');
      return;
    }

    /* Rate limit */
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000);
      Toast.show('error', 'Espera un momento', `Por favor espera ${wait} segundos antes de enviar otro mensaje.`);
      return;
    }

    /* Validate */
    if (!validateForm()) {
      /* Focus first error */
      form.querySelector('.form-input.error, .form-select.error, .form-textarea.error')?.focus();
      statusEl.textContent = 'Hay errores en el formulario. Por favor corrígelos.';
      return;
    }

    setLoading(true);
    statusEl.textContent = 'Guardando envío…';

    /* Simulate async save */
    await new Promise(r => setTimeout(r, 600));

    const submission = buildSubmission();
    const subs = getSubmissions();
    subs.push(submission);
    saveSubmissions(subs);

    lastSubmitTime = Date.now();

    setLoading(false);
    statusEl.textContent = 'Envío guardado correctamente.';

    renderList();
    form.reset();
    Toast.show(
      'success',
      'Mensaje guardado ✓',
      'Tu mensaje quedó guardado en este dispositivo. Puedes enviarlo por correo con el botón "Enviar por correo".'
    );
  }

  /* ── Mailto handler ── */
  function handleMailto() {
    /* Validate lightly first */
    const type    = document.getElementById('msg-type').value;
    const name    = document.getElementById('msg-name').value.trim();
    const message = document.getElementById('msg-text').value.trim();

    if (!type || !name || !message) {
      Toast.show('error', 'Completa el formulario', 'Necesitas tipo, nombre y mensaje para enviarlo por correo.');
      return;
    }
    window.location.href = buildMailto();
    Toast.show('success', 'Cliente de correo abierto', 'Completa el envío desde tu cliente de correo.');
  }

  function init() {
    form?.addEventListener('submit', handleSubmit);
    btnMailto?.addEventListener('click', handleMailto);
    btnDownload?.addEventListener('click', downloadCSV);

    /* Inline validation on blur */
    document.getElementById('msg-name')?.addEventListener('blur', () =>
      validateField('msg-name', 'name-error', v => v.length >= 2, 'El nombre debe tener al menos 2 caracteres.'));
    document.getElementById('msg-email')?.addEventListener('blur', () => {
      const v = document.getElementById('msg-email').value.trim();
      if (v) validateField('msg-email', 'email-error',
        val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Ingresa un email válido.');
    });
    document.getElementById('msg-text')?.addEventListener('blur', () =>
      validateField('msg-text', 'message-error', v => v.length >= 10, 'El mensaje debe tener al menos 10 caracteres.'));

    renderList();
  }

  return { init };
})();

/* ══════════════════════════════════════════════════
   5. REVEAL (Scroll animations)
══════════════════════════════════════════════════ */
const Reveal = (() => {
  function init() {
    /* Skip if reduced motion */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ══════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Nav.init();
  Toast.init();
  Cartelera.init();
  ContactForm.init();
  Reveal.init();
});
