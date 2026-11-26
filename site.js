// Fitaz Gym site behaviour. No libraries. Everything degrades to plain links without JS.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Accent colour (preview picker). Stored per browser only.
  const root = document.documentElement;
  const setAccent = a => {
    a === 'cobalt' ? root.removeAttribute('data-accent') : root.setAttribute('data-accent', a);
    $$('.swatch button[data-a]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.a === a)));
    try { localStorage.setItem('accent', a); } catch (e) {}
  };
  // Mode: light (beige, black and one colour) or silver and black
  const setMode = (m, pick) => {
    m === 'silver' ? root.setAttribute('data-mode', 'silver') : root.removeAttribute('data-mode');
    $$('.swatch button[data-m]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
    try { localStorage.setItem('mode', m); } catch (e) {}
    if (pick && m !== 'silver' && root.getAttribute('data-accent') === 'silver') setAccent('cobalt');
  };
  let saved = 'cobalt', mode = 'light';
  try { const q = new URLSearchParams(location.search); mode = q.get('mode') || localStorage.getItem('mode') || 'light'; saved = q.get('accent') || localStorage.getItem('accent') || 'cobalt'; } catch (e) {}
  setMode(mode); setAccent(saved);
  $$('.swatch button[data-a]').forEach(b => b.addEventListener('click', () => setAccent(b.dataset.a)));
  $$('.swatch button[data-m]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.m, true)));

  // Review aid: ?only=<section id> shows just that section
  { const o = /[?&]only=([\w-]+)/.exec(location.search); if (o) $$('main > section').forEach(x => { if (x.id !== o[1]) x.style.display = 'none'; }); }

  // Header rotator
  const rot = $$('.rot a');
  if (rot.length > 1 && !calm) {
    let i = 0;
    setInterval(() => {
      rot[i].classList.replace('on', 'out');
      const prev = rot[i];
      setTimeout(() => prev.classList.remove('out'), 600);
      i = (i + 1) % rot.length;
      rot[i].classList.add('on');
    }, 3800);
  }

  // Menu sheet
  const sheet = $('.sheet');
  if (sheet) {
    const open = v => { sheet.classList.toggle('open', v); document.body.style.overflow = v ? 'hidden' : ''; if (v) $('.sheet .menu-btn').focus(); else $('.hdr .menu-btn').focus(); };
    $('.hdr .menu-btn').addEventListener('click', () => open(true));
    $('.sheet .menu-btn').addEventListener('click', () => open(false));
    if (/[?&]menu\b/.test(location.search)) open(true);
    addEventListener('keydown', e => e.key === 'Escape' && sheet.classList.contains('open') && open(false));
    $$('[data-close]', sheet).forEach(x => x.addEventListener('click', () => { sheet.classList.remove('open'); document.body.style.overflow = ''; }));
  }

  // Reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('[data-rv]').forEach(el => io.observe(el));

  // Count-up numbers
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, suf = el.dataset.suffix || '';
    if (calm) { el.textContent = to.toFixed(dec) + suf; return; }
    const t0 = performance.now();
    const tick = t => { const p = Math.min(1, (t - t0) / 1400), v = to * (1 - Math.pow(1 - p, 3)); el.textContent = v.toFixed(dec) + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }));
  $$('[data-count]').forEach(el => cio.observe(el));

  // 3D tilt on pointer (desktop) for cards
  if (fine && !calm) $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.classList.add('live');
      el.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 9 + 'deg');
      el.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 9 + 'deg');
    });
    el.addEventListener('pointerleave', () => { el.classList.remove('live'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });

  // Magnetic primary buttons (desktop)
  if (fine && !calm) $$('.btn[data-mag]').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`; });
    b.addEventListener('pointerleave', () => b.style.transform = '');
  });

  // Hero: parallax + goal picker
  const hero = $('.hero');
  if (hero) {
    const bg = $('.bg', hero), glow = $('.glow', hero);
    if (!calm) addEventListener('scroll', () => { const y = scrollY; if (y < innerHeight) { bg.style.transform = `translateY(${y * .22}px)`; glow.style.transform = `translate(${y * .12}px, ${-y * .18}px)`; } }, { passive: true });
    const goals = $$('.goal button', hero), imgs = $$('.bg img', hero), sub = $('.sub', hero), cta2 = $('[data-cta2]', hero);
    const pick = b => {
      goals.forEach(g => g.setAttribute('aria-pressed', String(g === b)));
      imgs.forEach(im => im.classList.toggle('on', im.dataset.g === b.dataset.g));
      sub.textContent = b.dataset.line;
      cta2.textContent = b.dataset.cta2; cta2.href = b.dataset.href2;
    };
    goals.forEach(b => b.addEventListener('click', () => pick(b)));
  }

  // Photo and results rails: arrow buttons
  $$('.rail').forEach(rail => {
    const nav = rail.parentElement.querySelector('.rail-nav');
    if (nav) $$('button', nav).forEach(b => b.addEventListener('click', () => rail.scrollBy({ left: (b.dataset.d === 'next' ? 1 : -1) * Math.min(540, rail.clientWidth * .85), behavior: calm ? 'auto' : 'smooth' })));
  });

  // Reviews on phones: swipe, arrows, and a gentle auto-advance that waits while you touch it
  $$('[data-revm]').forEach(box => {
    const tr = $('.revm-track', box), cards = $$('.rv', tr), n = $('[data-n]', box); let i = 0, hold = 0;
    const at = () => { const x = tr.scrollLeft + 4; let k = 0; cards.forEach((c, j) => { if (c.offsetLeft - cards[0].offsetLeft <= x) k = j; }); return k; };
    const go = (k, auto) => { i = (k + cards.length) % cards.length; tr.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: calm || (auto && i === 0) ? 'auto' : 'smooth' }); n.textContent = `${i + 1} / ${cards.length}`; };
    tr.addEventListener('scroll', () => { i = at(); n.textContent = `${i + 1} / ${cards.length}`; }, { passive: true });
    const wait = () => { hold = Date.now() + 7000; };
    ['touchstart', 'pointerdown', 'focusin'].forEach(e => box.addEventListener(e, wait, { passive: true }));
    $$('button', box).forEach(b => b.addEventListener('click', () => { wait(); go(at() + (b.dataset.d === 'next' ? 1 : -1)); }));
    let seen = false; new IntersectionObserver(es => seen = es[0].isIntersecting, { threshold: .4 }).observe(box);
    setInterval(() => { if (seen && !document.hidden && Date.now() > hold && box.offsetParent) go(at() + 1, true); }, 4500);
  });

  // Reviews wall: touch to pause
  $$('.wall').forEach(w => { w.addEventListener('touchstart', () => w.classList.add('hold'), { passive: true }); w.addEventListener('touchend', () => setTimeout(() => w.classList.remove('hold'), 2500)); });

  // Offer countdown
  $$('[data-countdown]').forEach(el => {
    const end = new Date(el.dataset.countdown).getTime();
    const tick = () => { const ms = end - Date.now(); if (ms <= 0) { el.textContent = 'ends today'; return; } const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4); el.textContent = d > 0 ? `${d} day${d === 1 ? '' : 's'} ${h}h left` : `${h}h ${m}m left`; };
    tick(); setInterval(tick, 60000);
  });

  // Club tour: vertical scroll drives the photos sideways. Falls back to a swipe row.
  $$('.tour').forEach(t => {
    const track = $('.ttrack', t), bar = $('.tprog i', t);
    if (calm || !CSS.supports('position', 'sticky')) { t.classList.add('flat'); return; }
    let raf = 0;
    const paint = () => { raf = 0; const r = t.getBoundingClientRect(), total = t.offsetHeight - innerHeight, p = Math.max(0, Math.min(1, -r.top / total)); const max = track.scrollWidth - innerWidth; track.style.transform = `translate3d(${-p * Math.max(0, max)}px,0,0)`; if (bar) bar.style.transform = `scaleX(${p})`; };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    addEventListener('resize', paint); paint();
  });

  // Walk-through: arrows in the photo walk you to the next room, the marker follows on the plan, the photo moves forward
  // Walk-through v5: one video. It plays while it is on screen, the bar scrubs it, the room buttons jump to a room.
  $$('[data-wt]').forEach(w => {
    const v = $('video', w), view = $('.wt-view', w), track = $('.wt-track', w), fill = $('.wt-fill', w), knob = $('.wt-knob', w), big = $('.wt-big', w), pp = $('.wt-pp', w), full = $('.wt-full', w), rooms = $$('.wt-room', w), kEl = $('[data-wt-k]', w), tEl = $('[data-wt-t]', w);
    const half = +w.dataset.half, dur = () => v.duration || +w.dataset.dur;
    let loaded = false, held = false, drag = false, cur = 0, seen = false;
    const load = () => { if (!loaded) { loaded = true; v.src = v.dataset.src; v.load(); } };
    const seek = x => { load(); x = Math.max(0, Math.min(dur() - .05, x)); if (v.readyState >= 1) v.currentTime = x; else v.addEventListener('loadedmetadata', () => { v.currentTime = x; }, { once: true }); paint(x); };
    const play = () => { load(); const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    const paint = x => { const T = x === undefined ? v.currentTime : x, pc = T / dur() * 100;
      fill.style.width = pc + '%'; knob.style.left = pc + '%'; track.setAttribute('aria-valuenow', Math.round(T));
      let i = 0; rooms.forEach((r, j) => { if (T >= +r.dataset.s - half) i = j; });
      if (i !== cur) { cur = i; rooms.forEach((r, j) => r.classList.toggle('on', j === i)); kEl.textContent = rooms[i].dataset.k; tEl.textContent = rooms[i].dataset.t;
        const st = rooms[i].parentElement; st.scrollTo({ left: rooms[i].offsetLeft - st.offsetLeft - st.clientWidth / 2 + rooms[i].clientWidth / 2, behavior: 'smooth' }); } };
    const state = () => { const on = !v.paused; w.classList.toggle('playing', on); pp.textContent = on ? '❚❚' : '▶'; pp.setAttribute('aria-label', on ? 'Pause' : 'Play'); big.setAttribute('aria-label', on ? 'Pause the walk-through' : 'Play the walk-through'); };
    const toggle = () => { if (v.paused) { held = false; play(); } else { held = true; v.pause(); } };
    v.addEventListener('timeupdate', () => { if (!drag) paint(); });
    v.addEventListener('play', state); v.addEventListener('pause', state);
    const loop = () => { if (!v.paused && !drag) paint(); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    big.addEventListener('click', toggle); pp.addEventListener('click', toggle);
    rooms.forEach(r => r.addEventListener('click', () => { held = false; seek(+r.dataset.s); play(); }));
    // Scrub: drag anywhere on the bar. The video is paused while dragging so each frame shows as you move.
    const at = e => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur(); };
    let was = false, raf = 0, want = 0;
    track.addEventListener('pointerdown', e => { drag = true; was = !v.paused; v.pause(); track.setPointerCapture(e.pointerId); seek(at(e)); e.preventDefault(); });
    track.addEventListener('pointermove', e => { if (!drag) return; want = at(e); paint(want); if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (v.readyState >= 1) v.currentTime = want; }); });
    const up = () => { if (!drag) return; drag = false; if (was && !held) play(); };
    track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
    track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') seek(v.currentTime + 2); if (e.key === 'ArrowLeft') seek(v.currentTime - 2); if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
    full.addEventListener('click', () => { const on = !w.classList.contains('full'); w.classList.toggle('full', on); document.documentElement.classList.toggle('cb-lock', on); full.setAttribute('aria-pressed', String(on)); full.textContent = on ? '✕' : '⤢'; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && w.classList.contains('full')) full.click(); });
    // Plays on its own while it is on screen (not for people who ask for reduced motion), and stops when scrolled away.
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { seen = e.isIntersecting; if (seen) { load(); if (!held && !calm) play(); } else v.pause(); }), { threshold: .5 }).observe(view);
    const q = /[?&]wt=([\d.]+)/.exec(location.search); if (q) { held = true; seek(+q[1]); }
    if (/[?&]tourfull\b/.test(location.search)) full.click();
  });

  $$('[data-floor]').forEach(fl => {
    const view = $('.fl-view', fl), shots = $$('.fl-shot', fl), dots = $$('.fl-stop', fl), lights = $('.fl-lights', fl), live = $('.fl-live', fl), play = $('.fl-play', fl), full = $('.fl-full', fl), mv = $('.fl-mv', fl), gen = $('.fl-gen', fl);
    let cur = 0, timer = null, moving = false;
    const note = t => { if (gen) { gen.textContent = t; gen.hidden = !t; } };
    // Lighting preview: day is the real photo, the others are generated from it and load when first picked.
    const setLight = k => { if (!lights) return; const sh = shots[cur];
      $$('img.lt', sh).forEach(im => { const on = im.dataset.lt === k; if (on && !im.src) im.src = im.dataset.src; im.classList.toggle('show', on); });
      $$('button', lights).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.light === k)));
      view.dataset.light = k; note(k === 'day' ? '' : 'Lighting preview, generated'); };
    const lightsFor = d => { if (!lights) return; const has = (d.dataset.lights || '').split(' ').filter(Boolean); lights.hidden = !has.length; $$('button', lights).forEach(b => b.hidden = b.dataset.light !== 'day' && !has.includes(b.dataset.light)); };
    // A generated move between two stops: play it, then land on the real photo of the next stop.
    const move = (i, b) => { moving = true; let done = false;
      const end = () => { if (done) return; done = true; clearTimeout(guard); land(i); requestAnimationFrame(() => { view.classList.remove('mv'); moving = false; }); };
      const guard = setTimeout(end, 9000);
      mv.onended = end; mv.onerror = end; note('Generated transition');
      mv.src = b.dataset.mv; mv.currentTime = 0;
      const p = mv.play(); view.classList.add('mv'); if (p && p.catch) p.catch(end); };
    const go = (i, from) => {
      i = (i + dots.length) % dots.length; if (i === cur || moving) return;
      if (from && from.dataset.mv && mv && !calm) { setLight('day'); return move(i, from); }
      land(i, from); };
    const land = (i, from) => {
      const d = dots[i], old = shots[cur];
      shots.forEach(sh => sh.classList.remove('leave'));
      if (from) { old.style.setProperty('--ox', from.dataset.ox + '%'); old.style.setProperty('--oy', from.dataset.oy + '%'); } else { old.style.setProperty('--ox', '50%'); old.style.setProperty('--oy', '55%'); }
      old.classList.add('leave'); old.classList.remove('on'); shots[i].classList.add('on');
      dots.forEach((x, j) => { x.classList.toggle('on', j === i); x.classList.toggle('seen', x.classList.contains('seen') || j === cur); });
      const st = d.parentElement; st.scrollTo({ left: d.offsetLeft - st.offsetLeft - st.clientWidth / 2 + d.clientWidth / 2, behavior: calm ? 'auto' : 'smooth' });
      $('[data-fl-n]', fl).textContent = i + 1; $('[data-fl-k]', fl).textContent = d.dataset.k; $('[data-fl-t]', fl).textContent = d.dataset.t;
      view.classList.remove('uselive'); live.setAttribute('aria-pressed', 'false'); live.textContent = 'See it in use'; live.hidden = !d.dataset.live;
      $$('img.lt.show', old).forEach(im => im.classList.remove('show'));
      cur = i; setLight('day'); lightsFor(d);
    };
    const stop = () => { clearInterval(timer); timer = null; play.setAttribute('aria-pressed', 'false'); play.textContent = '▶ Play the walk-through'; };
    live.hidden = !dots[0].dataset.live; if (lights) { lightsFor(dots[0]); $$('button', lights).forEach(b => b.addEventListener('click', () => { stop(); setLight(b.dataset.light); })); }
    dots.forEach((d, i) => d.addEventListener('click', () => { stop(); go(i); }));
    $$('[data-fl]', fl).forEach(b => b.addEventListener('click', () => { stop(); go(cur + +b.dataset.fl); }));
    $$('.fl-go button', fl).forEach(b => b.addEventListener('click', () => { stop(); go(+b.dataset.to, b); }));
    play.addEventListener('click', () => { if (timer) return stop(); play.setAttribute('aria-pressed', 'true'); play.textContent = '❚❚ Pause'; go(cur + 1); timer = setInterval(() => go(cur + 1), 4200); });
    full.addEventListener('click', () => { const on = !fl.classList.contains('full'); fl.classList.toggle('full', on); document.documentElement.classList.toggle('cb-lock', on); full.setAttribute('aria-pressed', String(on)); full.textContent = on ? '✕' : '⤢'; });
    live.addEventListener('click', () => { const on = !view.classList.contains('uselive'); view.classList.toggle('uselive', on); live.setAttribute('aria-pressed', String(on)); live.textContent = on ? 'Back to the room' : 'See it in use'; });
    view.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { stop(); go(cur + 1); } if (e.key === 'ArrowLeft') { stop(); go(cur - 1); } if (e.key === 'Escape' && fl.classList.contains('full')) full.click(); });
    let sx = null;
    view.addEventListener('pointerdown', e => { sx = e.clientX; });
    view.addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 44 && !e.target.closest('button')) { stop(); go(cur + (e.clientX < sx ? 1 : -1)); } sx = null; });
    if (fine && !calm) view.addEventListener('pointermove', e => { const r = view.getBoundingClientRect(); view.style.setProperty('--lx', ((e.clientX - r.left) / r.width - .5) * 2); view.style.setProperty('--ly', ((e.clientY - r.top) / r.height - .5) * 2); });
    const q = /[?&]stop=(\d+)/.exec(location.search); if (q) go(+q[1] - 1);
    if (/[?&]tourfull\b/.test(location.search)) full.click();
  });

  // Pickers: tabs, days and phases. A button [data-p="group:i"] shows the panel [data-panel="group:i"].
  $$('[data-pick]').forEach(box => {
    const g = box.dataset.pick, btns = $$(`[data-p^="${g}:"]`, box), panels = $$(`[data-panel^="${g}:"]`, box);
    const pick = k => { btns.forEach(b => { const on = b.dataset.p === k; b.hasAttribute('aria-selected') ? b.setAttribute('aria-selected', String(on)) : b.setAttribute('aria-pressed', String(on)); }); panels.forEach(p => p.hidden = p.dataset.panel !== k); };
    btns.forEach(b => b.addEventListener('click', () => pick(b.dataset.p)));
    if (box.hasAttribute('data-today')) { const dow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Brisbane' })).getDay(); if (dow >= 1 && dow <= 6) pick(`${g}:${dow - 1}`); }
    const q = new RegExp('[?&]' + g + '=(\\d+)').exec(location.search); if (q) pick(`${g}:${q[1]}`);
  });

  // Staffed hours: highlight today and say whether the team is in right now (Brisbane time)
  const hoursT = $('.hours'), kbH = (() => { try { return JSON.parse($('#kb').textContent).hours; } catch (e) { return null; } })();
  if (hoursT || kbH) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Brisbane', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday), now = (+parts.hour % 24) + +parts.minute / 60;
    $$('.hours tr').forEach(tr => tr.classList.toggle('today', +tr.dataset.dow === dow));
    const slots = d => !hoursT ? (kbH[(d + 6) % 7] || []) : [...($(`.hours tr[data-dow="${d}"] td`)?.textContent.matchAll(/(\d+)(?::(\d+))?(am|pm) to (\d+)(?::(\d+))?(am|pm)/g) || [])].map(m => [(+m[1] % 12) + (m[3] === 'pm' ? 12 : 0) + (+m[2] || 0) / 60, (+m[4] % 12) + (m[6] === 'pm' ? 12 : 0) + (+m[5] || 0) / 60]);
    const f = h => { const H = Math.floor(h), mm = Math.round((h - H) * 60); return (H % 12 || 12) + (mm ? ':' + String(mm).padStart(2, '0') : '') + (H < 12 ? 'am' : 'pm'); };
    const cur = slots(dow).find(([a, b]) => now >= a && now < b), next = slots(dow).find(([a]) => a > now);
    let msg = '';
    if (cur) msg = `Staff are in now, until ${f(cur[1])}`;
    else if (next) msg = `Staff back at ${f(next[0])} today`;
    else for (let i = 1; i < 8 && !msg; i++) { const s2 = slots((dow + i) % 7); if (s2.length) msg = `Staff back ${i === 1 ? 'tomorrow' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][(dow + i) % 7]} at ${f(s2[0][0])}`; }
    $$('[data-staff]').forEach(el => el.textContent = msg);
  }

  // Sticky join bar appears after the hero
  const jb = $('.joinbar');
  if (jb) addEventListener('scroll', () => jb.classList.toggle('show', scrollY > innerHeight * .6), { passive: true });

  // Join wizard: membership, commitment, then a recap with the direct sign-up link
  const wiz = $('.wiz');
  if (wiz) {
    const { plans, tiers } = JSON.parse($('#plans').textContent);
    const state = { tier: null, term: null };
    const steps = $$('.steps i', wiz), s2 = $('[data-step="2"]', wiz), s3 = $('[data-step="3"]', wiz), sum = $('.sum', wiz);
    const sumT = $('.what b', sum), sumD = $('.what span', sum), gos = [$('.btn', sum), $('[data-s="go"]', wiz)];
    const S = k => $(`[data-s="${k}"]`, wiz);
    const fee = p => p.fee === '0' ? `<s>$${p.feeWas}</s> $0` : `$${p.fee}`;
    document.body.classList.add('has-sum');
    const paint = () => {
      $$('[data-tier]', wiz).forEach(o => o.setAttribute('aria-checked', String(o.dataset.tier === state.tier)));
      $$('[data-term]', wiz).forEach(o => {
        o.setAttribute('aria-checked', String(o.dataset.term === state.term));
        const p = state.tier && plans[state.tier][o.dataset.term];
        $('.p', o).textContent = p ? `$${p.price} a week` : '';
        $('.f', o).innerHTML = p ? `Joining fee ${fee(p)}` : '';
      });
      s2.dataset.locked = String(!state.tier);
      const p = state.tier && state.term && plans[state.tier][state.term];
      s3.dataset.locked = String(!p);
      steps.forEach((s, i) => s.classList.toggle('on', i < (state.tier ? (state.term ? 3 : 2) : 1)));
      $('.q h3', s2).textContent = state.tier ? `Join ${tiers[state.tier].name} membership` : 'Choose your commitment'; $('.q b', s2).textContent = state.tier ? 'Step 2 · choose your commitment' : 'Step 2';
      $('.q h3', s3).textContent = p ? `Join ${p.name}` : 'Check it and join';
      if (p) {
        sumT.textContent = `${p.name} · $${p.price}/wk`; sumD.textContent = p.fee === '0' ? '$0 joining fee. ' + p.first + '.' : p.commit;
        S('name').textContent = p.name; S('commit').textContent = p.commit; S('price').textContent = `$${p.price}`; S('fee').innerHTML = fee(p); S('first').textContent = p.first.replace(/^First payment |^Payments start /, '').replace(/^w/, 'W');
        S('incl').innerHTML = tiers[state.tier].incl.map(x => `<li>${x}</li>`).join('');
        gos.forEach(g => { g.textContent = `Join ${p.name}`; g.href = p.url; g.setAttribute('aria-disabled', 'false'); });
      } else {
        sumT.textContent = state.tier ? 'Now choose your commitment' : 'Choose your membership'; sumD.textContent = 'Three quick steps, then join online.';
        S('name').textContent = state.tier ? `${tiers[state.tier].name}: choose your commitment` : 'Pick your membership above'; S('commit').textContent = '';
        ['price', 'fee', 'first'].forEach(k => S(k).textContent = '–'); S('incl').innerHTML = '';
        gos.forEach(g => { g.textContent = 'Join now'; g.removeAttribute('href'); g.setAttribute('aria-disabled', 'true'); });
      }
    };
    const go = el => el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
    const top = el => { const y = el.getBoundingClientRect().top + scrollY - 84; scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' }); };
    $$('[data-tier]', wiz).forEach(o => o.addEventListener('click', () => { state.tier = o.dataset.tier; state.term = state.term || '12'; paint(); top(s2); }));
    $$('[data-term]', wiz).forEach(o => o.addEventListener('click', () => { state.term = o.dataset.term; paint(); top(s3); }));
    const q = new URLSearchParams(location.search);
    if (plans[q.get('plan')]) state.tier = q.get('plan');
    if (state.tier) { state.term = plans[state.tier][q.get('term')] ? q.get('term') : '12'; const h = $('.mhead h1'), l = $('.mhead .lede'); if (h) h.innerHTML = `Join <span>${tiers[state.tier].name} membership</span>`; if (l) l.textContent = 'Choose your commitment below and join online. It takes a couple of minutes.'; setTimeout(() => top(s2), 350); }
    paint();
    if (state.tier && !state.term) setTimeout(() => go(s2), 400);
  }

  // Timetable day tabs (static fallback list grouped by day)
  const days = $$('.day');
  if (days.length) {
    const show = d => { days.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.d === d))); $$('[data-day]').forEach(g => g.hidden = g.dataset.day !== d); };
    days.forEach(b => b.addEventListener('click', () => show(b.dataset.d)));
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Brisbane' }).format(new Date());
    show((days.find(b => b.dataset.d === today) || days.find(b => b.dataset.d > today) || days[0]).dataset.d);
  }

  // Forms: validate, post to the endpoint in data-endpoint, show thanks. Falls back to email if no endpoint yet.
  $$('form[data-lead]').forEach(f => {
    const err = $('.err', f), ok = $('.ok', f);
    f.addEventListener('submit', async e => {
      e.preventDefault();
      err.hidden = true;
      if (!f.reportValidity()) return;
      const data = Object.fromEntries(new FormData(f));
      if (data.company) return; // honeypot
      data.page = location.pathname; data.source = f.dataset.lead;
      const ep = f.dataset.endpoint;
      const btn = $('button[type=submit]', f); btn.disabled = true; btn.textContent = 'Sending…';
      try {
        if (!ep && !f.dataset.preview) throw new Error('no endpoint');
        if (ep) { const r = await fetch(ep, { method: 'POST', body: new URLSearchParams(data) }); if (!r.ok && r.type !== 'opaque') throw new Error(r.status); }
        $$('fieldset, label, button, .fine', f).forEach(x => x.hidden = true); ok.hidden = false; ok.focus();
        if (window.fbq) fbq('track', 'Lead'); if (window.dataLayer) dataLayer.push({ event: 'lead', lead_type: data.source });
      } catch (x) {
        btn.disabled = false; btn.textContent = 'Send';
        err.hidden = false;
      }
    });
  });

  // Timetable: when hosted, swap the snapshot for the live feed from GymMaster
  const tt = $('[data-tt][data-live]');
  if (tt) fetch(tt.dataset.live).then(r => r.ok ? r.json() : Promise.reject()).then(({ classes }) => {
    if (!classes || !classes.length) return;
    const escH = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const tm = t => t.replace(/^0/, '').replace(' AM', 'am').replace(' PM', 'pm');
    const mon = d => { const x = new Date(d + 'T12:00:00+10:00'); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Brisbane' }).format(x); };
    const by = {}; classes.forEach(c => (by[c.date] = by[c.date] || []).push(c));
    Object.keys(by).forEach(d => { const list = $(`[data-day="${d}"] .cls-list`, tt); if (!list) return;
      list.innerHTML = by[d].map(c => `<div class="cls"><div class="tm"><b>${tm(c.start)}</b><span>to ${tm(c.end)}</span></div><div class="nm"><b>${escH(c.name)}${c.offPeak ? ' <span class="pill">Off-peak</span>' : ''}${c.price === 0 ? ' <span class="pill free">Free</span>' : ''}</b><span>${c.coach ? 'with ' + escH(c.coach.replace(/\s+/g, ' ')) + ' · ' : ''}${c.price === 0 ? 'Free for everyone' : 'Casual $' + (c.price % 1 ? c.price.toFixed(2) : c.price)}${/limited/i.test(c.availability) ? ' · <span class="left">Limited space</span>' : ''}</span></div><a class="btn sm ink" href="${tt.dataset.schedule}?classid=${encodeURIComponent(c.classid)}&week=${mon(c.date)}" target="_blank" rel="noopener">${c.price === 0 ? 'Book free' : 'Book'}</a></div>`).join(''); });
    const rd = $('[data-read]', tt); if (rd) rd.textContent = 'Live from GymMaster just now.';
  }).catch(() => {});

  // Chat assistant. Hosted: streams from /api/chat (Claude). In the private preview it asks Claude through the viewer,
  // and if neither is there it answers from the site's own facts. Same look and the same buttons in all three.
  const cb = $('.cb');
  if (cb) {
    const kb = JSON.parse($('#kb').textContent), log = $('.cb-log', cb), ta = $('.cb-in textarea', cb), sendB = $('.cb-send', cb), stopB = $('.cb-stop', cb), down = $('.cb-down', cb), fab = $('.chat-fab'), tease = $('.cb-tease');
    const KEY = 'cb2', track = (ev, o = {}) => { try { (window.dataLayer = window.dataLayer || []).push({ event: 'chat_' + ev, ...o }); } catch (e) {} };
    let msgs = [], busy = false, ctl = null, sampleFn, opened = false;
    try { msgs = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) {}
    const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch (e) {} };
    const escH = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const md = s => { const lines = escH(s.trim()).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split(/\n+/); let out = '', inL = false; for (const l of lines) { const m = /^\s*[-•]\s+(.*)/.exec(l); if (m) { out += (inL ? '' : '<ul>') + '<li>' + m[1] + '</li>'; inL = true; } else { out += (inL ? '</ul>' : '') + '<p>' + l + '</p>'; inL = false; } } return out + (inL ? '</ul>' : ''); };
    // Brisbane clock and whether the team is in
    const now = () => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value])); return { ...p, dow: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday), h: (+p.hour % 24) + +p.minute / 60 }; };
    const fh = h => { const H = Math.floor(h), m = Math.round((h - H) * 60); return (H % 12 || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (H < 12 ? 'am' : 'pm'); };
    const staff = () => { const n = now(), today = kb.hours[n.dow] || [], cur = today.find(([a, b]) => n.h >= a && n.h < b), next = today.find(([a]) => a > n.h); if (cur) return { on: true, t: `The team is in now, until ${fh(cur[1])}.` }; if (next) return { on: false, t: `The team is back at ${fh(next[0])} today.` }; for (let i = 1; i < 8; i++) { const d = kb.hours[(n.dow + i) % 7]; if (d && d.length) return { on: false, t: `The team is back ${i === 1 ? 'tomorrow' : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][(n.dow + i) % 7]} at ${fh(d[0][0])}.` }; } return { on: false, t: '' }; };
    const ctxLine = () => { const n = now(), s = staff(); return `[context] Now: ${n.weekday} ${n.day} ${n.month} ${n.year}, ${fh(Math.floor(n.h * 60) / 60)} Brisbane time. Team in the gym right now: ${s.on ? 'yes' : 'no'}. ${s.t} Page they are on: ${location.pathname}`; };
    const st = staff(); $('[data-cb-status]', cb).textContent = st.on ? 'AI assistant · the team is in the gym now' : 'AI assistant · answers any time'; cb.classList.toggle('staffed', st.on);

    const near = () => log.scrollHeight - log.scrollTop - log.clientHeight < 140;
    const toEnd = force => { if (force || near()) { log.scrollTop = log.scrollHeight; down.hidden = true; } else down.hidden = false; };
    log.addEventListener('scroll', () => { if (near()) down.hidden = true; });
    down.addEventListener('click', () => toEnd(true));

    const btnHTML = keys => (keys || []).filter(k => kb.actions[k]).slice(0, 3).map((k, i) => { const [label, href] = kb.actions[k]; return href.startsWith('#lead:') ? `<button type="button" class="cb-btn${i ? ' alt' : ''}" data-lead="${escH(href.slice(6))}">${escH(label)}</button>` : `<a class="cb-btn${i ? ' alt' : ''}" href="${escH(href)}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''} data-k="${k}">${escH(label)}<i aria-hidden="true">${/^https?:/.test(href) ? '↗' : '→'}</i></a>`; }).join('');
    const leadHTML = (topic, q) => `<form class="cb-lead" data-topic="${escH(topic || 'Chat question')}" novalidate><b>Leave your details and the team will get back to you.</b><input name="first_name" placeholder="First name" autocomplete="given-name" required><input name="mobile" type="tel" inputmode="tel" placeholder="Mobile" autocomplete="tel" required pattern="[0-9 +\\(\\)]{8,}"><input name="email" type="email" placeholder="Email" autocomplete="email" required><textarea name="message" rows="2" placeholder="Anything we should know?">${escH(q || '')}</textarea><input name="company" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true"><button class="cb-btn" type="submit">Send to the team</button><small>Goes to our team and member system so we can reply. We never sell it.</small><p class="err" hidden>That did not send. Please call ${escH(kb.phone)}.</p></form>`;
    const bubble = (m, i) => { const el = document.createElement('div'); el.className = 'cb-row ' + (m.role === 'user' ? 'me' : 'bot'); el.dataset.i = i;
      if (m.role === 'user') el.innerHTML = `<div class="cb-msg">${escH(m.text)}</div>`;
      else el.innerHTML = `<div class="cb-msg">${md(m.text || '')}</div>${m.buttons && m.buttons.length ? `<div class="cb-btns">${btnHTML(m.buttons)}</div>` : ''}${m.lead && !m.sent ? leadHTML(m.topic, m.q) : ''}${m.sent ? '<div class="cb-msg ok">Thanks. That has gone to the team and they will be in touch.</div>' : ''}${m.done && !m.welcome ? `<div class="cb-fb"><button type="button" data-fb="up" aria-pressed="${m.fb === 'up'}">Yes</button><button type="button" data-fb="down" aria-pressed="${m.fb === 'down'}">No</button></div>` : ''}`;
      return el; };
    const chipsRow = list => { $$('.cb-chips', log).forEach(x => x.remove()); if (!list || !list.length) return; const el = document.createElement('div'); el.className = 'cb-chips'; el.innerHTML = list.slice(0, 4).map(c => `<button type="button">${escH(c)}</button>`).join(''); log.appendChild(el); };
    const render = () => { log.innerHTML = '';
      const w = document.createElement('div'); w.className = 'cb-welcome'; w.innerHTML = `<div class="cb-row bot"><div class="cb-msg">${md(kb.greeting)}</div></div>${msgs.length ? '' : `<div class="cb-start">${kb.starters.map(([t, s, q]) => `<button type="button" data-q="${escH(q)}"><b>${escH(t)}</b><small>${escH(s)}</small></button>`).join('')}</div>`}`; log.appendChild(w);
      msgs.forEach((m, i) => log.appendChild(bubble(m, i)));
      const last = msgs[msgs.length - 1]; chipsRow(msgs.length ? (last && last.role === 'bot' && !last.lead ? last.chips : []) : kb.chips); toEnd(true); };

    // Local answers: match the question to the site's own facts
    const words = s => s.toLowerCase().replace(/[^a-z0-9$/ ]+/g, ' ').split(/\s+/).filter(x => x.length > 1);
    const localAnswer = q => { const qs = words(q); let best = null, score = 0; for (const it of kb.intents) { const ks = it.k.split(' '); let s2 = 0; for (const w of qs) if (ks.includes(w)) s2 += w.length > 3 ? 2 : 1; else if (w.length > 4 && ks.some(k => k.length > 4 && (k.startsWith(w.slice(0, 5)) || w.startsWith(k.slice(0, 5))))) s2 += 1; if (s2 > score) { score = s2; best = it; } }
      if (!best || score < 2) return { text: 'I don’t have that one, sorry. Leave your details here and the team will come back to you with the answer, or give us a call.', buttons: ['call', 'email'], chips: [], lead: true };
      let a = best.a; const n = now();
      if (a === '__TODAY__') { const iso = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Brisbane' }).format(d); const tomorrow = /tomorrow/.test(q.toLowerCase()), d = new Date(Date.now() + (tomorrow ? 864e5 : 0)), list = (kb.tt || {})[iso(d)]; a = list && list.length ? `${tomorrow ? 'Tomorrow' : 'Today'}’s classes: ${list.join(', ')}. Members book in the app. Not a member? Book one class as a casual for $28.` : `I can’t see classes for ${tomorrow ? 'tomorrow' : 'today'} right now. The timetable page has the live times.`; }
      return { text: a.replace('__STAFF__', staff().t), buttons: best.b, chips: best.c, lead: !!best.lead }; };
    const split = full => { const i = full.indexOf('§'); if (i < 0) return { text: full, meta: null }; let meta = null; try { meta = JSON.parse(full.slice(i + 1).trim()); } catch (e) {} return { text: full.slice(0, i), meta }; };
    const turns = () => msgs.filter(m => (m.role === 'user' || m.text) && !m.welcome).slice(-12).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

    const setBusy = v => { busy = v; sendB.hidden = v; stopB.hidden = !v; cb.classList.toggle('busy', v); };
    const ask = async (q, src = 'typed') => { q = (q || '').trim().slice(0, 500); if (!q || busy) return;
      msgs.push({ role: 'user', text: q }); const m = { role: 'bot', text: '' }; msgs.push(m); save(); render(); ta.value = ''; ta.style.height = '';
      const row = log.querySelector(`.cb-row[data-i="${msgs.length - 1}"]`), box = $('.cb-msg', row); box.innerHTML = '<span class="cb-typing"><i></i><i></i><i></i></span>'; toEnd(true);
      setBusy(true); ctl = new AbortController(); track('message_sent', { src }); const t0 = Date.now();
      const paint = full => { const { text } = split(full); if (text.trim()) { box.innerHTML = md(text); toEnd(); } };
      let full = '', mode = 'local';
      try {
        const list = turns().slice(0, -0 || undefined).filter(x => x.content), lastU = list[list.length - 1]; lastU.content = ctxLine() + '\n' + lastU.content;
        if (cb.dataset.endpoint) { mode = 'api';
          const r = await fetch(cb.dataset.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: list }), signal: ctl.signal });
          if (!r.ok || !r.body) throw new Error('down');
          const rd = r.body.getReader(), dec = new TextDecoder(); for (;;) { const { done, value } = await rd.read(); if (done) break; full += dec.decode(value, { stream: true }); paint(full); }
        } else if (kb.system) { if (sampleFn === undefined) sampleFn = window.claude && window.claude.use ? await Promise.race([window.claude.use('sample'), new Promise(r => setTimeout(() => r(null), 4000))]) : null;
          if (!sampleFn) throw new Error('nosample'); mode = 'sample';
          list[0].content = kb.system + '\n\n=== The conversation with the visitor starts here. Reply as Ruby, the AI assistant, following every rule above. ===\n\n' + list[0].content;
          const res = await sampleFn(list, { modelTier: 'quick', cache: false, signal: ctl.signal, onText: ({ text }) => { full = text; paint(full); } }); full = res.text || full;
        } else throw new Error('local');
        if (!full.trim()) throw new Error('empty');
      } catch (e) {
        if (ctl.signal.aborted) { full = full || ''; mode = 'stopped'; }
        else { if (e && e.code === 'not_granted') sampleFn = null; const la = localAnswer(q); mode = 'local'; const txt = la.text; for (let i = 0; i <= txt.length && !ctl.signal.aborted; i += 3) { box.innerHTML = md(txt.slice(0, i)); toEnd(); await new Promise(r => setTimeout(r, calm ? 0 : 12)); } full = txt + '\n§' + JSON.stringify({ buttons: la.buttons, chips: la.chips, lead: la.lead }); }
      }
      const { text, meta } = split(full); m.text = text.trim() || (mode === 'stopped' ? 'Stopped.' : 'Sorry, I didn’t catch that. Could you ask it another way?'); m.buttons = meta && Array.isArray(meta.buttons) ? meta.buttons.filter(k => kb.actions[k]) : []; m.chips = meta && Array.isArray(meta.chips) ? meta.chips.filter(x => typeof x === 'string').map(x => x.slice(0, 60)) : []; m.lead = !!(meta && meta.lead); m.q = q; m.done = true; m.mode = mode;
      if (m.lead) track('fallback', { q }); track('answer', { mode, ms: Date.now() - t0 });
      setBusy(false); save(); const at = near(); render(); if (!at) down.hidden = false; $('[data-cb-live]', cb).textContent = m.text; if (!cb.classList.contains('open')) $('.cb-dot', fab).hidden = false; if (fine) ta.focus(); };

    log.addEventListener('click', e => { const t = e.target.closest('button, a'); if (!t) return;
      if (t.closest('.cb-chips')) return ask(t.textContent, 'chip'); if (t.dataset.q) return ask(t.dataset.q, 'starter');
      if (t.dataset.lead !== undefined && !t.closest('form')) { const m = { role: 'bot', text: 'Easy. Pop your details in and the team will be in touch.', lead: true, topic: t.dataset.lead, q: (msgs.filter(x => x.role === 'user').pop() || {}).text || '', done: true, welcome: true }; msgs.push(m); save(); render(); const f = $('.cb-lead input', log); if (f) f.focus(); return; }
      if (t.dataset.fb) { const i = +t.closest('.cb-row').dataset.i; msgs[i].fb = t.dataset.fb; save(); $$('[data-fb]', t.parentElement).forEach(b => b.setAttribute('aria-pressed', String(b === t))); track('feedback', { v: t.dataset.fb, q: msgs[i].q }); return; }
      if (t.dataset.k) track('cta', { k: t.dataset.k }); });
    log.addEventListener('submit', async e => { const f = e.target.closest('.cb-lead'); if (!f) return; e.preventDefault(); if (!f.reportValidity()) return; const i = +f.closest('.cb-row').dataset.i, fd = Object.fromEntries(new FormData(f)); if (fd.company) return; const btn = $('button[type=submit]', f); btn.disabled = true; btn.textContent = 'Sending…';
      try { const ep = cb.dataset.leadEndpoint; if (ep) { const r = await fetch(ep, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...fd, interest: f.dataset.topic, source: 'chat', page: location.pathname, transcript: msgs.filter(x => x.text).slice(-8).map(x => (x.role === 'user' ? 'Visitor: ' : 'Bot: ') + x.text).join('\n') }) }); if (!r.ok) throw 0; } else await new Promise(r => setTimeout(r, 500));
        msgs[i].sent = true; save(); render(); track('lead', { topic: f.dataset.topic }); } catch (err) { btn.disabled = false; btn.textContent = 'Send to the team'; $('.err', f).hidden = false; } });

    // Open, close, new chat
    const vv = window.visualViewport, fit = () => { if (vv) { cb.style.setProperty('--cbh', vv.height + 'px'); cb.style.setProperty('--cbt', vv.offsetTop + 'px'); } };
    const show = v => { cb.hidden = !v; cb.classList.toggle('open', v); document.documentElement.classList.toggle('cb-lock', v); if (tease) tease.hidden = true;
      if (v) { $('.cb-dot', fab).hidden = true; if (!opened) { opened = true; render(); track('opened'); } fit(); toEnd(true); if (fine) ta.focus(); try { sessionStorage.setItem('cb-seen', '1'); } catch (e) {} } else fab.focus(); };
    if (vv) { vv.addEventListener('resize', () => { fit(); if (cb.classList.contains('open')) toEnd(true); }); vv.addEventListener('scroll', fit); }
    $$('[data-chat-open]').forEach(b => b.addEventListener('click', () => show(true)));
    $('.cb-x', cb).addEventListener('click', () => show(false));
    $('.cb-new', cb).addEventListener('click', () => { if (ctl) ctl.abort(); msgs = []; save(); render(); track('reset'); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && cb.classList.contains('open')) show(false); });
    stopB.addEventListener('click', () => ctl && ctl.abort());
    $('.cb-in', cb).addEventListener('submit', e => { e.preventDefault(); ask(ta.value); });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(ta.value); } });
    ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; });
    // A gentle nudge, once per visit
    if (tease) { let seen = false; try { seen = !!sessionStorage.getItem('cb-seen'); } catch (e) {} if (!seen && !/[?&](chat|menu|only)\b/.test(location.search)) setTimeout(() => { if (!cb.classList.contains('open') && !$('.sheet.open')) { tease.hidden = false; track('teaser'); try { sessionStorage.setItem('cb-seen', '1'); } catch (e) {} } }, 14000); $('.cb-tease-x', tease).addEventListener('click', () => { tease.hidden = true; }); }
    { const q = /[?&]chat(?:=([^&]*))?/.exec(location.search); if (q) { show(true); if (q[1]) ask(decodeURIComponent(q[1].replace(/\+/g, ' ')), 'link'); } }
  }
})();
