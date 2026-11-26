// Scroll walk-through (27 Nov 2026). The walk-through video, cut into frames and moved by the scroll.
// GSAP ScrollTrigger pins the stage and ties the frames to the scroll; Lenis smooths the wheel and trackpad.
// Without JavaScript, or for people who ask for reduced motion, the section shows the plain video instead.
(() => {
  const sec = document.querySelector('[data-ws]');
  if (!sec || !window.gsap || !window.ScrollTrigger) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ROOMS = JSON.parse(sec.dataset.rooms), FRAMES = +sec.dataset.frames, LENGTH = +sec.dataset.length, base = sec.dataset.seq;
  const stage = sec.querySelector('.ws-stage'), frame = sec.querySelector('.ws-frame'), canvas = frame.querySelector('canvas'), ctx = canvas.getContext('2d');
  const caps = sec.querySelector('.ws-caps'), rail = sec.querySelector('.ws-rail');
  sec.classList.add('ws-on');

  ROOMS.forEach((r, i) => {
    const c = document.createElement('div'); c.className = 'ws-cap';
    const n = document.createElement('span'); n.className = 'n'; n.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(ROOMS.length).padStart(2, '0');
    const b = document.createElement('b'); b.textContent = r.k;
    const s = document.createElement('span'); s.textContent = r.t;
    c.append(n, b, s); caps.append(c); r.cap = c;
    const btn = document.createElement('button'); btn.type = 'button';
    const l = document.createElement('span'); l.textContent = r.k; const bar = document.createElement('i');
    btn.append(l, bar); rail.append(btn); r.btn = btn; r.bar = bar;
  });

  // Frames: a tall set cut for phones held upright (p), a small wide set (s), a large wide set for big screens (l).
  // Loaded coarse first, then filled in.
  const tall = matchMedia('(max-aspect-ratio: 1/1)').matches, big = Math.max(innerWidth, innerHeight) * Math.min(devicePixelRatio || 1, 2) > 1400;
  const src = i => base + '/' + (tall ? 'p' : big ? 'l' : 's') + '/f' + String(i + 1).padStart(3, '0') + '.jpg';
  const imgs = new Array(FRAMES), ready = new Array(FRAMES).fill(false);
  let want = 0, shown = -1, cw = 0, ch = 0;
  const nearest = i => { for (let d = 0; d < FRAMES; d++) { if (ready[i - d]) return i - d; if (ready[i + d]) return i + d; } return -1; };
  const draw = force => {
    const i = nearest(want); if (i < 0 || (i === shown && !force) || !cw) return; shown = i;
    const im = imgs[i], s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
  };
  const load = i => new Promise(done => { if (imgs[i]) return done(); const im = imgs[i] = new Image(); im.decoding = 'async';
    im.onload = () => { ready[i] = true; if (Math.abs(i - want) < 12) draw(true); done(); }; im.onerror = done; im.src = src(i); });
  const order = []; [16, 8, 4, 2, 1].forEach(step => { for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i); });
  let started = false;
  const loadAll = async () => { if (started) return; started = true; const q = order.slice();
    const worker = async () => { while (q.length) await load(q.shift()); };
    await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]); };
  load(0);
  new IntersectionObserver((es, io) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); loadAll(); } }, { rootMargin: '150% 0px' }).observe(sec);

  // The canvas is measured on resize only, never while scrolling.
  const size = () => { const r = frame.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); cw = canvas.width = Math.round(r.width * d); ch = canvas.height = Math.round(r.height * d); draw(true); };
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

  // Depth. The picture sits a touch oversized so it can move: it pushes in while you scroll (faster scroll, more push)
  // and, with a mouse, leans a couple of degrees toward the pointer.
  gsap.set(canvas, { scale: 1.05, transformPerspective: 1100, transformOrigin: '50% 55%' });
  const zoomTo = gsap.quickTo(canvas, 'scale', { duration: .7, ease: 'power2.out' });
  ScrollTrigger.addEventListener('scrollEnd', () => zoomTo(1.05));
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const rx = gsap.quickTo(canvas, 'rotationX', { duration: .9, ease: 'power3.out' }), ry = gsap.quickTo(canvas, 'rotationY', { duration: .9, ease: 'power3.out' });
    const tx = gsap.quickTo(canvas, 'x', { duration: .9, ease: 'power3.out' }), ty = gsap.quickTo(canvas, 'y', { duration: .9, ease: 'power3.out' });
    stage.addEventListener('pointermove', e => { const a = e.clientX / innerWidth - .5, b = e.clientY / innerHeight - .5; ry(a * 3.2); rx(-b * 2.4); tx(-a * 22); ty(-b * 14); });
    stage.addEventListener('pointerleave', () => { rx(0); ry(0); tx(0); ty(0); });
  }
  // A hard, fast scroll is someone trying to get past, so it carries them straight out of the walk.
  const FAST = 5500; let skipping = false, quiet = performance.now() + 1500; // quiet: ignore speed from our own jumps and from page load
  const hush = ms => { quiet = performance.now() + ms; };
  ScrollTrigger.addEventListener('refresh', () => hush(800));
  function onScroll(self) {
    const v = self.getVelocity(); zoomTo(1.05 + .08 * Math.min(1, Math.abs(v) / 3200));
    if (skipping || performance.now() < quiet || Math.abs(v) < FAST || self.progress < .04 || self.progress > .96) return;
    skipping = true; const y = v > 0 ? self.end + innerHeight * .6 : self.start - innerHeight * .6;
    if (lenis) lenis.scrollTo(y, { duration: .9, force: true, onComplete: () => { skipping = false; } });
    else { scrollTo({ top: y, behavior: 'smooth' }); setTimeout(() => { skipping = false; }, 1200); }
  }

  // The walk: the stage is pinned and the scroll moves through the frames.
  let room = -1, walk = null;
  const setRoom = (i, dir) => { if (i === room) return; const old = ROOMS[room]; room = i;
    if (old) gsap.to(old.cap, { opacity: 0, y: dir > 0 ? -24 : 24, duration: .3, ease: 'power2.in', overwrite: true });
    gsap.fromTo(ROOMS[i].cap, { opacity: 0, y: dir > 0 ? 32 : -32 }, { opacity: 1, y: 0, duration: .55, ease: 'power3.out', delay: old ? .12 : 0, overwrite: true });
    ROOMS.forEach((r, j) => r.btn.classList.toggle('on', j === i)); };
  const state = { f: 0 };
  walk = gsap.to(state, { f: FRAMES - 1, ease: 'none',
    scrollTrigger: { id: 'walk', trigger: stage, start: 'top top', end: () => '+=' + Math.round(innerHeight * LENGTH), pin: true, scrub: .45, anticipatePin: 1, invalidateOnRefresh: true, onUpdate: onScroll },
    onUpdate: () => paint() });
  // paint() also runs after every re-measure: a refresh moves the walk without firing onUpdate (reload mid-walk, rotate).
  function paint() {
      want = Math.round(state.f); draw();
      const p = state.f / (FRAMES - 1), dir = walk && walk.scrollTrigger ? walk.scrollTrigger.direction : 1;
      let i = 0; ROOMS.forEach((r, j) => { if (j && p >= (r.at + ROOMS[j - 1].at) / 2) i = j; });
      setRoom(i, dir);
      ROOMS.forEach((r, j) => { const a = j ? (r.at + ROOMS[j - 1].at) / 2 : 0, b = j < ROOMS.length - 1 ? (r.at + ROOMS[j + 1].at) / 2 : 1;
        r.bar.style.setProperty('--p', Math.max(0, Math.min(1, (p - a) / (b - a))).toFixed(3)); });
  }
  ScrollTrigger.addEventListener('refresh', () => requestAnimationFrame(paint));
  paint();

  const go = y => { hush(2200); if (lenis) { lenis.resize(); lenis.scrollTo(y, { duration: 1.4, force: true }); } else scrollTo({ top: y, behavior: 'smooth' }); };
  ROOMS.forEach(r => r.btn.addEventListener('click', () => { if (!walk) return; const st = walk.scrollTrigger; go(st.start + (st.end - st.start) * r.at); }));

  // The walk plays once. When it has gone off the top of the screen, the pin and its scroll distance are taken out
  // (the scroll position is corrected in the same frame, so nothing moves), and scrolling back up is a normal page:
  // the picture is one still screen, not a walk to scrub back through.
  let done = false;
  const once = () => { const st = walk && walk.scrollTrigger; if (done || !st || skipping || scrollY < st.end + innerHeight * 1.1) return;
    done = true; removeEventListener('scroll', once);
    const d = st.end - st.start, y = scrollY - d, rest = lenis ? lenis.targetScroll - lenis.scroll : 0;
    st.kill(true); walk.kill(); walk = null; state.f = FRAMES - 1; paint();
    if (lenis) { lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }); if (Math.abs(rest) > 2) lenis.scrollTo(y + rest, { force: true }); } else scrollTo(0, y);
    ScrollTrigger.refresh(); };
  addEventListener('scroll', once, { passive: true });

  // Pages above this section finish loading images after start-up, so positions are measured again.
  addEventListener('load', () => { ScrollTrigger.refresh();
    // Test hook: ?at=0.5 opens the page half way through the walk.
    const q = /[?&]at=([\d.]+)/.exec(location.search); if (q && walk) { hush(3000); const st = walk.scrollTrigger, y = st.start + (st.end - st.start) * +q[1]; if (lenis) { lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }); } else scrollTo(0, y); } });
  if ('ResizeObserver' in window) { let h = 0, t = 0; new ResizeObserver(() => { const n = document.body.scrollHeight; if (Math.abs(n - h) > 4) { h = n; clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 250); } }).observe(document.body); }
})();
