// Scroll walk-through v5 (27 Nov 2026). You fly in from the street, then walk the gym room by room.
// The picture is a run of frames on a canvas. GSAP ScrollTrigger pins the stage and ties the frames to the scroll;
// Lenis smooths the wheel and trackpad. The walk stops in each room: the room name lands, glowing points can be
// tapped for a short card, and the picture can be dragged (phone) or leans to the mouse (desktop) to look around.
// Without JavaScript, or for people who ask for reduced motion, the section shows the plain video instead.
(() => {
  const sec = document.querySelector('[data-ws]');
  if (!sec || !window.gsap || !window.ScrollTrigger) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ROOMS = JSON.parse(sec.dataset.rooms), FRAMES = +sec.dataset.frames, LENGTH = +sec.dataset.length, base = sec.dataset.seq;
  const stage = sec.querySelector('.ws-stage'), frame = sec.querySelector('.ws-frame'), canvas = frame.querySelector('canvas'), ctx = canvas.getContext('2d');
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  sec.classList.add('ws-on');

  // Frames: a tall set cut for phones held upright (p), a small wide set (s), a large wide set for big screens (l).
  const tall = matchMedia('(max-aspect-ratio: 1/1)').matches, big = Math.max(innerWidth, innerHeight) * Math.min(devicePixelRatio || 1, 2) > 1400;
  const AR = tall ? +sec.dataset.par : 16 / 9, U0 = tall ? (1 - AR * 9 / 16) / 2 : 0, UW = 1 - 2 * U0; // the slice of the wide frame the tall set shows
  const src = i => base + '/' + (tall ? 'p' : big ? 'l' : 's') + '/f' + String(i + 1).padStart(3, '0') + '.jpg';

  // The scene: the picture and its tap points move together. It is a little larger than the stage so it can move.
  const scene = el('div', 'ws-scene'); frame.insertBefore(scene, canvas); scene.append(canvas);
  const spots = el('div', 'ws-spots'); scene.append(spots);
  const title = el('div', 'ws-title'); title.setAttribute('aria-live', 'polite'); stage.append(title);
  const card = el('div', 'ws-card'); card.hidden = true; stage.append(card);
  const intro = el('div', 'ws-intro'); const logo = el('img'); logo.src = sec.dataset.logo; logo.alt = ''; const cue = el('span', '', 'Scroll to step inside'); intro.append(logo, cue); stage.append(intro);
  const hint = el('div', 'ws-hint', 'Drag to look around'); hint.hidden = true; stage.append(hint);

  const closeCard = () => { if (card.hidden) return; card.hidden = true; stage.classList.remove('carded'); spots.querySelectorAll('.on').forEach(b => b.classList.remove('on')); };
  const openCard = (s, btn) => { const same = btn.classList.contains('on'); closeCard(); if (same) return;
    card.replaceChildren(); const x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.addEventListener('click', closeCard);
    card.append(x, el('b', '', s.k), el('p', '', s.t));
    if (s.href) { const a = el('a', '', s.cta + ' →'); a.href = s.href; card.append(a); }
    card.hidden = false; stage.classList.add('carded'); btn.classList.add('on');
    gsap.fromTo(card, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .35, ease: 'power3.out' }); };
  ROOMS.forEach((r, i) => { r.btns = (r.spots || []).map(s => { const b = el('button', 'ws-spot'); b.type = 'button'; b.hidden = true; b.setAttribute('aria-label', s.k);
    // On a phone only the middle of the picture is on screen, and the room name sits low, so tap points are kept inside that.
      const pu = tall ? Math.min(.59, Math.max(.41, s.u)) : s.u, pv = tall ? Math.min(.64, s.v) : s.v;
      b.style.left = ((pu - U0) / UW * 100).toFixed(2) + '%'; b.style.top = (pv * 100).toFixed(2) + '%'; b.append(el('i'));
    b.addEventListener('click', e => { e.stopPropagation(); openCard(s, b); }); spots.append(b); return b; }); });

  const imgs = new Array(FRAMES), ready = new Array(FRAMES).fill(false);
  let want = 0, shown = -1, cw = 0, ch = 0, panMax = 0;
  const nearest = i => { for (let d = 0; d < FRAMES; d++) { if (ready[i - d]) return i - d; if (ready[i + d]) return i + d; } return -1; };
  const draw = force => { const i = nearest(want); if (i < 0 || (i === shown && !force) || !cw) return; shown = i; ctx.drawImage(imgs[i], 0, 0, cw, ch); };
  const load = i => new Promise(done => { if (imgs[i]) return done(); const im = imgs[i] = new Image(); im.decoding = 'async';
    im.onload = () => { ready[i] = true; if (Math.abs(i - want) < 12) draw(true); done(); }; im.onerror = done; im.src = src(i); });
  // Loaded coarse first, then filled in.
  const order = []; [16, 8, 4, 2, 1].forEach(step => { for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i); });
  let started = false;
  const loadAll = async () => { if (started) return; started = true; const q = order.slice();
    const worker = async () => { while (q.length) await load(q.shift()); };
    await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]); };
  load(0);
  new IntersectionObserver((es, io) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); loadAll(); } }, { rootMargin: '150% 0px' }).observe(sec);

  // The scene covers the stage and keeps the picture's shape. Measured on resize only, never while scrolling.
  const size = () => { const r = frame.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); if (!r.width) return;
    const w = Math.max(r.width, r.height * AR), h = w / AR;
    scene.style.width = w + 'px'; scene.style.height = h + 'px'; scene.style.left = (r.width - w) / 2 + 'px'; scene.style.top = (r.height - h) / 2 + 'px';
    panMax = (w - r.width) / 2; cw = canvas.width = Math.round(w * d); ch = canvas.height = Math.round(h * d); draw(true); };
  new ResizeObserver(size).observe(frame);

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // One clock: GSAP's ticker drives Lenis. Chat, menus and other inner scroll areas keep their own scroll.
  let lenis = null;
  if (window.Lenis) {
    document.documentElement.style.scrollBehavior = 'auto';
    lenis = new Lenis({ anchors: true, allowNestedScroll: true, autoToggle: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.addEventListener('refresh', () => lenis.resize());
  }

  // The picture opens from a rounded card to the full stage as the section arrives.
  gsap.fromTo(frame, { clipPath: 'inset(7% 6% 7% 6% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
    scrollTrigger: { trigger: stage, start: 'top bottom', end: 'top top', scrub: true } });

  // Depth: the scene pushes in while you scroll (faster scroll, more push) and leans toward the mouse.
  gsap.set(scene, { scale: 1.06, transformPerspective: 1100, transformOrigin: '50% 55%' });
  const zoomTo = gsap.quickTo(scene, 'scale', { duration: .7, ease: 'power2.out' });
  ScrollTrigger.addEventListener('scrollEnd', () => zoomTo(1.06));
  const panTo = gsap.quickTo(scene, 'x', { duration: .5, ease: 'power3.out' }), ry = gsap.quickTo(scene, 'rotationY', { duration: .9, ease: 'power3.out' });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const rx = gsap.quickTo(scene, 'rotationX', { duration: .9, ease: 'power3.out' }), ty = gsap.quickTo(scene, 'y', { duration: .9, ease: 'power3.out' });
    stage.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const a = e.clientX / innerWidth - .5, b = e.clientY / innerHeight - .5; ry(a * 4); rx(-b * 2.6); panTo(-a * (26 + panMax)); ty(-b * 16); });
    stage.addEventListener('pointerleave', () => { rx(0); ry(0); panTo(0); ty(0); });
  }
  // Touch: drag sideways to look around. Up and down still scrolls the page.
  let drag = null, pan = 0, looked = false;
  stage.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; drag = { x: e.clientX, y: e.clientY, pan, on: false }; });
  stage.addEventListener('pointermove', e => { if (!drag || e.pointerType === 'mouse') return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) { if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) return; drag.on = true; if (!looked) { looked = true; hint.hidden = true; } }
    pan = Math.max(-panMax, Math.min(panMax, drag.pan + dx * 1.15)); panTo(pan); ry(panMax ? -pan / panMax * 3 : 0); });
  ['pointerup', 'pointercancel'].forEach(t => stage.addEventListener(t, () => { drag = null; }));
  stage.addEventListener('click', e => { if (!e.target.closest('.ws-card')) closeCard(); });

  // A hard, fast scroll is someone trying to get past, so it carries them straight out of the walk.
  const FAST = 5500; let skipping = false, quiet = performance.now() + 1500; // quiet: ignore speed from our own jumps and from page load
  const hush = ms => { quiet = performance.now() + ms; };
  ScrollTrigger.addEventListener('refresh', () => hush(800));
  function onScroll(self) {
    const v = self.getVelocity(); zoomTo(1.06 + .08 * Math.min(1, Math.abs(v) / 3200));
    if (skipping || performance.now() < quiet || Math.abs(v) < FAST || self.progress < .04 || self.progress > .96) return;
    skipping = true; const y = v > 0 ? self.end + innerHeight * .6 : self.start - innerHeight * .6;
    if (lenis) lenis.scrollTo(y, { duration: .9, force: true, onComplete: () => { skipping = false; } });
    else { scrollTo({ top: y, behavior: 'smooth' }); setTimeout(() => { skipping = false; }, 1200); }
  }

  // The walk. The stage is pinned; the scroll flies in, then moves room to room and rests in each one.
  const state = { f: 0 }, holds = [], FLY = 1.2, MOVE = .85, HOLD = .5;
  let room = -2, walk = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: () => paint(),
    scrollTrigger: { id: 'walk', trigger: stage, start: 'top top', end: () => '+=' + Math.round(innerHeight * LENGTH), pin: true, scrub: .45, anticipatePin: 1, invalidateOnRefresh: true, onUpdate: onScroll } });
  walk.to({}, { duration: .2 });
  walk.to(logo, { scale: 7, opacity: 0, duration: .55, ease: 'power2.in' }, .15).to(cue, { opacity: 0, duration: .2 }, .15);
  ROOMS.forEach((r, i) => { walk.to(state, { f: r.f, duration: i ? MOVE : FLY, ease: i ? 'sine.inOut' : 'power1.in' }, i ? '>' : .2);
    const t0 = walk.duration(); walk.to({}, { duration: HOLD }); holds.push([t0, walk.duration()]); });

  const setRoom = i => { if (i === room) return; const old = ROOMS[room]; room = i; closeCard();
    if (old) old.btns.forEach(b => { b.hidden = true; });
    gsap.killTweensOf(title);
    if (i < 0) { gsap.to(title, { opacity: 0, y: -14, duration: .25, ease: 'power2.in' }); hint.hidden = true; return; }
    title.textContent = ROOMS[i].k; gsap.fromTo(title, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' });
    ROOMS[i].btns.forEach((b, j) => { b.hidden = false; gsap.fromTo(b, { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: .45, delay: .15 + j * .12, ease: 'back.out(2)' }); });
    if (!looked && panMax > 24 && matchMedia('(pointer: coarse)').matches) { hint.hidden = false; gsap.fromTo(hint, { opacity: 0 }, { opacity: 1, duration: .4, delay: .5 }); } };
  // paint() also runs after every re-measure: a refresh moves the walk without firing onUpdate (reload mid-walk, rotate).
  function paint() {
    want = Math.round(state.f); draw();
    if (!walk) return setRoom(ROOMS.length - 1);
    const t = walk.time(); let i = -1; holds.forEach((h, j) => { if (t >= h[0] - .06 && t <= h[1] + .08) i = j; });
    setRoom(i);
  }
  ScrollTrigger.addEventListener('refresh', () => requestAnimationFrame(paint));
  paint();

  // The walk plays once. When it has gone off the top of the screen, the pin and its scroll distance are taken out
  // (the scroll position is corrected in the same frame, so nothing moves), and scrolling back up is a normal page:
  // the picture is one still screen of the last room, with its tap points, not a walk to scrub back through.
  let done = false;
  const once = () => { const st = walk && walk.scrollTrigger; if (done || !st || skipping || scrollY < st.end + innerHeight * 1.1) return;
    done = true; removeEventListener('scroll', once);
    const d = st.end - st.start, y = scrollY - d, rest = lenis ? lenis.targetScroll - lenis.scroll : 0;
    st.kill(true); walk.kill(); walk = null; gsap.set(intro, { display: 'none' }); state.f = FRAMES - 1; room = -2; paint();
    if (lenis) { lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }); if (Math.abs(rest) > 2) lenis.scrollTo(y + rest, { force: true }); } else scrollTo(0, y);
    ScrollTrigger.refresh(); };
  addEventListener('scroll', once, { passive: true });

  // Pages above this section finish loading images after start-up, so positions are measured again.
  addEventListener('load', () => { ScrollTrigger.refresh();
    // Test hook: ?at=0.5 opens the page half way through the walk.
    const q = /[?&]at=([\d.]+)/.exec(location.search); if (q && walk) { hush(3000); const st = walk.scrollTrigger, y = st.start + (st.end - st.start) * +q[1]; if (lenis) { lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }); } else scrollTo(0, y); } });
  if ('ResizeObserver' in window) { let h = 0, t = 0; new ResizeObserver(() => { const n = document.body.scrollHeight; if (Math.abs(n - h) > 4) { h = n; clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 250); } }).observe(document.body); }
})();
