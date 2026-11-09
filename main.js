// Jhank Bass — interactions
(() => {
  const WA_NUMBER = '573104640438';
  const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  document.documentElement.classList.add('js');

  // WhatsApp links with prefilled messages
  document.querySelectorAll('[data-wa]').forEach((el) => {
    el.href = waLink(el.dataset.wa);
    el.target = '_blank';
    el.rel = 'noopener';
  });

  // Topbar + mobile menu
  const topbar = document.getElementById('topbar');
  const menu = document.getElementById('menu');
  const toggle = document.querySelector('.menu-toggle');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // ---------- Hero scroll scene with 3D bassist frames ----------
  const hero = document.querySelector('.hero');
  const charWrap = document.querySelector('.hero__char');
  const canvas = document.getElementById('char');
  const ctx = canvas.getContext('2d');
  const poster = document.getElementById('char-poster');
  const slides = [...document.querySelectorAll('.slide')];
  const bar = document.querySelector('.hero__progress span');
  const bgImg = document.querySelector('.hero__bg img');
  const strings = [...document.querySelectorAll('.hero__strings i')];
  // Pick a frame set that suits the device and the connection
  const conn = navigator.connection || {};
  const slowNet = conn.saveData || /(^|-)2g/.test(conn.effectiveType || '');
  const midNet = conn.effectiveType === '3g';
  const forceLite = /[?&]lite=1/.test(location.search);
  const lite = forceLite || slowNet || midNet || window.innerWidth <= 820 || (navigator.deviceMemory || 8) <= 2;
  const DIR = lite ? 'img/bassist/sm/' : 'img/bassist/';
  const STRIDE = slowNet ? 2 : 1; // very slow connections load every other frame
  const CONCURRENCY = slowNet ? 3 : midNet ? 4 : 6;
  let FRAMES = 144;
  let frames = [];
  let loaded = 0;
  let step = 0;
  let live = false;

  const pad = (n) => String(n).padStart(3, '0');
  const isReady = (i) => !!frames[i]?.naturalWidth;
  // Closest loaded frames below and above a fractional position
  const bracket = (f) => {
    let lo = -1, hi = -1;
    for (let i = Math.floor(f); i >= 0; i--) if (isReady(i)) { lo = i; break; }
    for (let i = Math.ceil(f); i < FRAMES; i++) if (isReady(i)) { hi = i; break; }
    return [lo, hi];
  };

  // Coarse-to-fine order: a few frames across the whole turn first, then fill the gaps
  const loadOrder = () => {
    const seen = new Set(), order = [];
    const push = (i) => { if (i < FRAMES && i % STRIDE === 0 && !seen.has(i)) { seen.add(i); order.push(i); } };
    push(Math.round((FRAMES - 1) / 2)); push(0); push(FRAMES - 1 - ((FRAMES - 1) % STRIDE));
    [24, 12, 6, 2, 1].forEach((st) => { for (let i = 0; i < FRAMES; i += st) push(i); });
    return order;
  };
  const FIRST_PASS = () => Math.ceil(FRAMES / 24) + 1;

  const loadFrames = () => {
    frames = new Array(FRAMES);
    const queue = loadOrder();
    const first = FIRST_PASS();
    const next = () => {
      const i = queue.shift();
      if (i === undefined) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => {
        if (img.naturalWidth) {
          loaded++;
          needsDraw = true;
          if (!live && loaded >= Math.min(first, queue.length + loaded)) { live = true; charWrap.classList.add('is-live'); }
        }
        next();
      };
      img.src = `${DIR}f-${pad(i)}.webp`;
      frames[i] = img;
    };
    for (let k = 0; k < CONCURRENCY; k++) next();
  };

  // Start after the page has loaded so the hero photo and text come first
  const start3d = () => {
    fetch('img/bassist/frames.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j && Number(j.count) > 1) FRAMES = Number(j.count); })
      .catch(() => {})
      .finally(() => {
        const probe = new Image();
        probe.onload = loadFrames;
        probe.onerror = () => { if (!poster.naturalWidth) charWrap.classList.add('no-3d'); };
        probe.src = `${DIR}f-000.webp`;
      });
  };
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  if (document.readyState === 'complete') idle(start3d, { timeout: 1500 });
  else window.addEventListener('load', () => idle(start3d, { timeout: 1500 }), { once: true });
  poster.addEventListener('error', () => { if (!loaded) charWrap.classList.add('no-3d'); });

  // Draw a fractional frame by cross-fading the closest loaded frames on each side
  let drawnF = -1;
  const drawFrame = (f) => {
    const [lo, hi] = bracket(f);
    const base = lo >= 0 ? lo : hi;
    if (base < 0) return;
    const img = frames[base];
    if (canvas.width !== img.naturalWidth) { canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; }
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    if (lo >= 0 && hi > lo) {
      const t = (f - lo) / (hi - lo);
      if (t > 0.02) { ctx.globalAlpha = t; ctx.drawImage(frames[hi], 0, 0); ctx.globalAlpha = 1; }
    }
    drawnF = f;
  };

  const pluck = () => {
    strings.forEach((s, k) => {
      setTimeout(() => { s.classList.remove('vib'); void s.offsetWidth; s.classList.add('vib'); }, k * 60);
    });
  };

  let heroP = 0;
  const render = () => {
    const r = hero.getBoundingClientRect();
    const total = hero.offsetHeight - window.innerHeight;
    heroP = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    if (bar) bar.style.transform = `scaleX(${heroP})`;
    const s = Math.min(slides.length - 1, Math.floor(heroP * slides.length * 0.999));
    if (s !== step) {
      slides[step].classList.remove('is-active');
      slides[s].classList.add('is-active');
      step = s;
      if (!reduced) pluck();
    }
    if (!reduced && bgImg) bgImg.style.transform = `scale(${1.08 + heroP * 0.12}) translate3d(${-heroP * 2}%, ${heroP * 3}%, 0)`;
  };

  // One animation loop: eased scroll following, idle groove and pointer tilt
  let smoothP = 0;
  let idleAmp = 0;
  let needsDraw = true;
  let lastScroll = performance.now();
  let tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0;
  let heroVisible = true;
  const loop = (t) => {
    if (heroVisible && live) {
      smoothP += (heroP - smoothP) * (reduced ? 1 : 0.1);
      if (Math.abs(heroP - smoothP) < 0.0005) smoothP = heroP;
      const resting = performance.now() - lastScroll > 500;
      idleAmp += ((resting && !reduced && heroP < 0.995 ? 1 : 0) - idleAmp) * 0.04;
      let f = smoothP * (FRAMES - 1) + idleAmp * Math.sin(t / 520) * (FRAMES / 36);
      f = clamp(f, 0, FRAMES - 1);
      if (needsDraw || Math.abs(f - drawnF) > 0.01) { drawFrame(f); needsDraw = false; }
      tiltX += (tiltTX - tiltX) * 0.08;
      tiltY += (tiltTY - tiltY) * 0.08;
      if (Math.abs(tiltX) + Math.abs(tiltY) > 0.001 || tiltTX || tiltTY) {
        charWrap.style.transform = `perspective(900px) rotateY(${tiltX * 8}deg) rotateX(${-tiltY * 5}deg) translate3d(${tiltX * 10}px, ${tiltY * 6}px, 0)`;
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);
  }

  // Pointer tilt on the character
  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    const sticky = document.querySelector('.hero__sticky');
    sticky.addEventListener('pointermove', (e) => {
      tiltTX = (e.clientX / window.innerWidth - 0.5) * 2;
      tiltTY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    sticky.addEventListener('pointerleave', () => { tiltTX = 0; tiltTY = 0; });
    document.querySelector('.hero__strings').addEventListener('pointerenter', pluck);
    charWrap.addEventListener('click', pluck);
  }

  let ticking = false;
  const onScroll = () => {
    lastScroll = performance.now();
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      render();
      topbar.classList.toggle('is-scrolled', window.scrollY > 40);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', render);
  render();

  // About: read more on phones
  const bio = document.querySelector('.bento__bio');
  const more = document.querySelector('.bio-more');
  more?.addEventListener('click', () => {
    const open = bio.classList.toggle('is-open');
    more.setAttribute('aria-expanded', String(open));
    more.textContent = open ? 'Leer menos' : 'Leer más';
  });

  // ---------- Videos: play inside the page ----------
  const reels = [...document.querySelectorAll('.reel')];
  const stopOthers = (keep) => reels.forEach((r) => {
    if (r === keep) return;
    const v = r.querySelector('video');
    if (!v.paused) v.pause();
    r.classList.remove('is-playing');
    v.controls = false;
  });
  reels.forEach((reel) => {
    const v = reel.querySelector('video');
    const btn = reel.querySelector('.reel__play');
    const start = () => {
      if (!v.src) v.src = v.dataset.src;
      stopOthers(reel);
      v.muted = false;
      v.controls = true;
      reel.classList.add('is-playing');
      v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
    };
    btn.addEventListener('click', start);
    v.addEventListener('pause', () => { if (v.ended || v.paused) reel.classList.toggle('is-playing', !v.paused); });
    v.addEventListener('play', () => reel.classList.add('is-playing'));
  });
  // Pause when the row leaves the screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) stopOthers(null); }), { threshold: 0 })
      .observe(document.getElementById('reel-row'));
  }
  const row = document.getElementById('reel-row');
  document.querySelectorAll('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
    row.scrollBy({ left: Number(b.dataset.scroll) * row.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' });
  }));

  // ---------- WhatsApp message builder ----------
  const form = document.getElementById('builder');
  const preview = document.getElementById('preview');
  const hidden = document.getElementById('wa-text');
  const otherField = document.getElementById('other-field');
  const fmtDate = (v) => (v ? new Date(`${v}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '');
  const buildMsg = () => {
    const fd = new FormData(form);
    const svc = fd.get('servicio');
    const opener = svc === 'bajista en vivo' ? 'necesito bajista en vivo' : svc === 'contrabajo' ? 'necesito contrabajista' : `necesito ${svc}`;
    let genre = fd.get('genero');
    const otherOn = genre === 'otro';
    otherField.hidden = !otherOn;
    if (otherOn) genre = (fd.get('otro_genero') || '').trim() || 'otro género';
    let msg = `Hola Jhankarlo, ${opener} para ${genre}`;
    const date = fmtDate(fd.get('fecha'));
    const city = (fd.get('ciudad') || '').trim();
    if (date) msg += `, el ${date}`;
    if (city) msg += `, en ${city}`;
    msg += '. ¿Tienes disponibilidad?';
    preview.textContent = msg;
    hidden.value = msg;
    return msg;
  };
  form.addEventListener('input', buildMsg);
  form.addEventListener('change', buildMsg);
  form.addEventListener('submit', (e) => { e.preventDefault(); window.open(waLink(buildMsg()), '_blank', 'noopener'); });
  buildMsg();

  // ---------- Reserve room for the tallest hero slide ----------
  const slideBox = document.querySelector('.hero__slides');
  const fitSlides = () => {
    slideBox.style.minHeight = '';
    const tallest = Math.max(...slides.map((sl) => sl.scrollHeight));
    slideBox.style.minHeight = `${tallest}px`;
  };
  (document.fonts?.ready || Promise.resolve()).then(fitSlides);
  window.addEventListener('resize', fitSlides);

  // ---------- Fit the footer wordmark ----------
  const fitAll = () => document.querySelectorAll('[data-fit]').forEach((el) => {
    const box = el.parentElement;
    el.style.fontSize = '';
    const avail = box.clientWidth;
    const w = el.offsetWidth;
    if (!w || !avail) return;
    el.style.fontSize = `${Math.floor(parseFloat(getComputedStyle(el).fontSize) * (avail / w) * 0.99 * 10) / 10}px`;
  });
  (document.fonts?.ready || Promise.resolve()).then(fitAll);
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fitAll, 150); });

  document.getElementById('year').textContent = new Date().getFullYear();

  // Floating WhatsApp: show the label briefly once the visitor has scrolled a bit
  const wa = document.querySelector('.wa-float');
  let waShown = false;
  window.addEventListener('scroll', () => {
    if (waShown || window.scrollY < window.innerHeight * 1.5) return;
    waShown = true; wa.classList.add('is-open');
    setTimeout(() => wa.classList.remove('is-open'), 3500);
  }, { passive: true });

  // ---------- Staggered reveals ----------
  const reveals = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    const groups = new Map();
    reveals.forEach((el) => {
      const sec = el.closest('section') || document.body;
      const n = groups.get(sec) || 0;
      el.style.setProperty('--i', String(Math.min(n, 7)));
      groups.set(sec, n + 1);
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }
})();
