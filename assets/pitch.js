// Ananta AI Labs web pitch: a fixed 1920×1080 keynote canvas (1080×1920 in portrait), scaled by CSS (--s),
// played by one scrubbed GSAP timeline. Handoffs never fade: words wipe through clipped lines, card contents wipe
// with clip-path, two shared elements (#frame, #mark) morph between per-section slots with Flip.fit, and colour
// changes are hard cuts. Without JS or with reduced motion the page is a static deck of slides.
(() => {
  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const beats = $$('.beat'), N = beats.length;
  const motion = html.classList.contains('motion') && window.gsap && window.ScrollTrigger && window.Flip;
  if (!motion) html.classList.remove('motion');
  let cur = -1, st = null, ctx = null;
  const qa = () => /[?&]qa\b/.test(location.search) && document.body.append(Object.assign(document.createElement('script'), { src: 'assets/qa.js' }));

  // voice-over: one <audio>, one clip per section (assets/vo/<id>.mp3, encoded from build/audio/vo/<id>.wav)
  const audio = $('#vo'), cap = $('#caption');
  let on = null;
  const setBtn = (b, playing) => {
    b.classList.toggle('on', playing);
    $('use', b).setAttribute('href', playing ? '#i-pause' : '#i-play');
    $('span', b).textContent = playing ? 'Pause voice-over' : 'Play voice-over';
  };
  const stopVO = () => { audio.pause(); on && setBtn(on, false); on = null; cap.hidden = true; };
  $$('.vo-btn').forEach(b => b.addEventListener('click', () => {
    if (on === b) return stopVO();
    stopVO(); on = b; setBtn(b, true);
    audio.src = `assets/vo/${b.dataset.vo}.mp3?v=1112a`;
    audio.play().catch(stopVO);
    cap.textContent = $(`#${b.dataset.vo}-vo`).textContent; cap.hidden = false;
  }));
  audio.addEventListener('ended', stopVO);

  // pager + deep links (#b01 … #b12, #b10v); the section on screen plays its videos (muted; controls unmute), others pause
  const nowN = $('#now-n'), nowName = $('#now-name'), videos = $$('.beat video');
  // controls (play, sound) appear when the viewer reaches for the video, not as chrome over the picture
  videos.forEach(v => {
    v.controls = false;
    v.tabIndex = 0;
    for (const e of ['pointerenter', 'focus', 'touchstart']) v.addEventListener(e, () => { v.controls = true; }, { passive: true });
  });
  function show(i) {
    if (i === cur) return;
    cur = i; stopVO();
    nowN.textContent = String(i + 1).padStart(2, '0');
    nowName.textContent = beats[i].dataset.name;
    history.replaceState(null, '', '#' + beats[i].id);
    if (motion) videos.forEach(v => beats[i].contains(v) ? v.play().catch(() => {}) : v.pause());
  }
  // ceil: landing a sub-pixel short of a label lets a backward snap pick the previous section
  const labelY = id => Math.ceil(st.labelToScroll(id));
  function go(i) {
    i = Math.max(0, Math.min(N - 1, i));
    if (st) window.scrollTo({ top: labelY(beats[i].id), behavior: 'smooth' });
    else beats[i].scrollIntoView();
  }
  $$('[data-step]').forEach(b => b.addEventListener('click', () => go(cur + +b.dataset.step)));
  addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest('button,a,input,textarea,video')) return;
    if (e.key === 'ArrowRight') go(cur + 1);
    if (e.key === 'ArrowLeft') go(cur - 1);
  });

  if (!motion) {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && show(beats.indexOf(e.target))), { rootMargin: '-45% 0px -50% 0px' });
    beats.forEach(b => io.observe(b));
    qa();
    return;
  }

  gsap.registerPlugin(ScrollTrigger, Flip);
  const track = $('#track'), canvas = $('#canvas'), frame = $('#frame'), mark = $('#mark'), head = $('[data-mark-head]'), progress = $('#progress');
  const red = '#BD1921', ink = '#3C4858';
  const SHUT = 'inset(0% 0% 100% 0%)', OPEN = 'inset(0% 0% 0% 0%)', HOLD = 1.1;   // R1: every settled slide rests ≥1 s
  const fit = (el, to) => Flip.fit(el, to, { getVars: true });
  const radius = el => { const r = getComputedStyle(el).borderTopLeftRadius; return r.endsWith('%') ? el.offsetWidth * parseFloat(r) / 100 : parseFloat(r); };

  // number/clock rollers: the element's own text is the landing value, data-from the start
  const roll = (tl, el, from, to, fmt, at, dur) => {
    const o = { v: from };
    el.textContent = fmt(from);
    tl.to(o, { v: to, duration: dur, ease: 'power2.inOut', onUpdate: () => { el.textContent = fmt(o.v); } }, at);
  };
  const int = v => Math.round(v).toLocaleString('en-IN');
  const pct = v => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1) + '%';
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const clock = (tl, el, at, dur) => {
    el.dataset.to ??= el.textContent.trim();
    const from = el.dataset.from, pad = from.indexOf(':') === 2, m0 = toMin(from);
    let m1 = toMin(el.dataset.to); if (m1 < m0) m1 += 1440;
    roll(tl, el, m0, m1, v => { const m = Math.floor(v) % 1440, h = Math.floor(m / 60); return (pad ? String(h).padStart(2, '0') : h) + ':' + String(m % 60).padStart(2, '0'); }, at, dur);
  };
  const num = (tl, el, at, dur) => {   // counts in ink, lands red (hard cut)
    roll(tl, el, +el.dataset.from, +el.value, int, at, dur);
    gsap.set(el, { color: ink });
    tl.set(el, { color: red }, at + dur);
  };
  // terminal lines type out (monospace + steps(chars) = one character per step); each line starts sooner than the
  // last, so the build-up accelerates instead of ticking at an even PPT pace
  const type = (tl, lis, at, span) => {
    lis = lis.filter(li => li.offsetParent);   // rows hidden on this stage (portrait) do not take a turn
    const n = lis.length, start = k => at + span * (1 - (1 - k / n) ** 1.7);
    lis.forEach((li, k) => tl.fromTo(li, { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: OPEN, duration: start(k + 1) - start(k), ease: `steps(${Math.max(1, li.textContent.length)})` }, start(k)));
  };
  const callout = (tl, el, at) => tl.fromTo(el, { clipPath: 'inset(-60px 100% -16px -16px)' }, { clipPath: 'inset(-60px -16px -16px -16px)', duration: .45, ease: 'power2.inOut' }, at);
  const draw = (tl, paths, at, dur, stagger) => tl.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dur, stagger, ease: 'power2.inOut' }, at);
  const wipeIn = (tl, els, at) => tl.fromTo(els, { yPercent: 135 }, { yPercent: 0, duration: .6, stagger: .06, ease: 'power3.out' }, at);
  const wipeOut = (tl, els, at) => tl.to(els, { yPercent: -135, duration: .35, stagger: { amount: .12 }, ease: 'power2.in' }, at);

  // per-section choreography; t = moment the section's words have landed; returns the time its hold starts
  const scene = {
    b01(tl, s, t) {
      const [a, b] = $$('.swap .m>span', s), people = $$('.person', s);
      tl.to($('.hint>span', s), { yPercent: 135, duration: .3, ease: 'power2.in' }, t)   // R3: the opening arc runs ~3 s
        .to(people.slice(1), { x: k => people[0].offsetLeft - people[k + 1].offsetLeft, duration: 1.6, stagger: { amount: .5, ease: 'power2.out' }, ease: 'power3.inOut' }, t + .2)
        .set(people.slice(1), { visibility: 'hidden' }, t + 2.3)
        .set(people[0], { color: red }, t + 2.3);
      wipeOut(tl, [a, $('.people figcaption>span', s)], t + 1.5);
      tl.fromTo(b, { yPercent: 135 }, { yPercent: 0, duration: .7, ease: 'power3.out' }, t + 1.9);
      num(tl, $('.num', s), t + .3, 2.4);
      type(tl, $$('.lines .t', s), t + .2, 2.6);
      clock(tl, $('.clock', s), t + .2, 2.6);
      return t + 3.1;
    },
    b02(tl, s, t) {
      tl.fromTo($$('.row:not(.margin) .bar', s), { scaleX: .35 }, { scaleX: 1, duration: 1, stagger: .12, ease: 'power2.inOut' }, t - .2)
        .fromTo($('.margin .bar', s), { scaleX: 4.3, scaleY: 1, transformOrigin: 'left center' }, { scaleX: 1, scaleY: 1, duration: 1.1, ease: 'power2.inOut' }, t - .1)
        .fromTo($('.u i', s), { scaleX: 0 }, { scaleX: 1, duration: .5 }, t + .7);
      return t + 1.3;
    },
    b03(tl, s, t) {
      tl.fromTo($('.wire', s), { scaleX: 0 }, { scaleX: 1, duration: .6, ease: 'power2.inOut' }, t - .6)
        .to(mark, { scale: 1, duration: .5, ease: 'back.out(1.6)' }, t);
      return t + .8;
    },
    b04(tl, s, t) {
      num(tl, $('.num', s), t, 1.4);
      type(tl, $$('.lines .t', s), t, 1.4);
      clock(tl, $('.clock', s), t, 1.4);
      return t + 1.7;
    },
    b05(tl, s, t) {
      type(tl, $$('.lines .t', s), t, 1.6);
      clock(tl, $('.clock', s), t, 1.6);
      tl.fromTo($('.ticks', s), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: 'none' }, t);
      $$('.ev', s).forEach(e => tl.fromTo(e, { scale: 0 }, { scale: 1, duration: .15 }, t + parseFloat(e.style.left) / 100 * 1.6));
      return t + 1.9;
    },
    b06(tl, s, t) {
      tl.fromTo($$('.bar', s), { scaleX: 0 }, { scaleX: 1, duration: 1, stagger: .15, ease: 'power2.out' }, t);
      $$('.val', s).forEach((el, k) => roll(tl, el, 0, +el.value, pct, t + k * .15, 1));
      return t + 1.4;
    },
    b07(tl, s, t) {
      tl.fromTo($$('.agents svg', s), { scale: 0 }, { scale: 1, duration: .2, stagger: { amount: 1, ease: 'power2.out' }, ease: 'back.out(2)' }, t)
        .fromTo($('.article', s), { clipPath: SHUT }, { clipPath: OPEN, duration: 1.4, ease: 'power1.inOut' }, t);
      clock(tl, $('.clock', s), t, 1.4);
      return t + 1.7;
    },
    b08(tl, s, t) {
      tl.fromTo($$('.bar', s), { scaleX: 0 }, { scaleX: 1, duration: .9, stagger: .2 }, t);
      return t + 1.2;
    },
    b09(tl, s, t) {
      tl.fromTo($$('.face', s), { scale: 0 }, { scale: 1, duration: .4, stagger: .12, ease: 'back.out(1.7)' }, t - .5)
        .fromTo($$('.hbars .bar', s), { scaleX: 0 }, { scaleX: 1, duration: .8, stagger: .2 }, t + .3);
      callout(tl, $('.callout', s), t + .9);
      return t + 1.5;
    },
    b10(tl, s, t, { morph, fly, lift, portrait }) {   // page A: the engine; page B: the products; page C: the NAMO super app
      const pa = $('.pa', s), pb = $('.pb', s), pc = $('.pc', s);
      draw(tl, $$('.roads path', pa), t - .3, .6, .1);
      tl.fromTo($$('.n>*', pa), { yPercent: 135 }, { yPercent: 0, duration: .4, stagger: { amount: .4, ease: 'power2.out' }, ease: 'power3.out' }, t);
      t += 1;
      tl.addLabel('b10a', t);
      t += HOLD;
      wipeOut(tl, $$('.m>*,.n>*', pa), t);
      tl.to($$('.roads path', pa), { strokeDashoffset: 1, duration: .35, ease: 'power2.in' }, t);
      morph($('[data-frame]', pb), t + .1);
      fly(head, t + .1);
      wipeIn(tl, $$('.m>*', pb), t + (portrait ? .6 : .42));   // portrait: the mark rises through the copy band first
      tl.fromTo($('[data-frame]>.in', pb), { clipPath: SHUT }, { clipPath: OPEN, duration: .45 }, t + .55);
      t += 1.4;
      tl.addLabel('b10b', t);
      if (portrait) { const end = lift(tl, pb, t + HOLD); if (end > t + HOLD) { t = end; tl.addLabel('b10b2', t); } }
      t += HOLD;
      // page C: the NAMO Studio card becomes the NAMO card, and the app's twelve tiles grow out of it
      const card = $('.slot.namo', pc), lis = $$('.grid12 li', pc);
      wipeOut(tl, $$('.m>*', pb), t);
      tl.to($('[data-frame]>.in', pb), { clipPath: SHUT, duration: .3, ease: 'power2.in' }, t);
      morph(card, t + .1);
      wipeIn(tl, $$('.m>*', pc), t + .42);
      tl.fromTo($('.in', card), { clipPath: SHUT }, { clipPath: OPEN, duration: .35 }, t + .88);   // after the frame has landed
      // card-to-tile vectors, measured once before any transform (a transformed li becomes its tile's offsetParent)
      const k = canvas.getBoundingClientRect().width / canvas.offsetWidth, mid = el => { const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
      const [cx, cy] = mid(card), vec = lis.map(li => { const [x, y] = mid(li); return [(cx - x) / k, (cy - y) / k]; });
      // scale 0 hides them until they grow (never `visibility`: a visible child would outlive its hidden section)
      tl.fromTo(lis, { x: j => vec[j][0], y: j => vec[j][1], scale: 0 },
        { x: 0, y: 0, scale: 1, duration: .9, stagger: { amount: .7, ease: 'power2.out' }, ease: 'power3.out' }, t + 1.3);
      num(tl, $('.num', pc), t + 1.3, 1.5);
      tl.to($('.in', card), { clipPath: SHUT, duration: .3, ease: 'power2.in' }, t + 1.6);
      morph($('.slot.dot', pc), t + 1.8);   // the card folds away under the grid
      t += 2.9;
      if (portrait) { const end = lift(tl, pc, t + HOLD); if (end > t + HOLD) { tl.addLabel('b10c', t); t = end; } }
      return t;
    },
    b10v(tl, s, t) {   // the episode plays; agents fly out of it into the brand tiles; then "double down"
      const slot = $('.reel9', s), chips = $$('.agents-fly li', s), tiles = $$('.tiles li', s), [, line2, line3] = $$('.stack .m>span', s);
      t += .8; tl.addLabel('b10va', t); t += HOLD;
      wipeIn(tl, [line2, ...$$('.tiles li>span', s)], t);
      const cx = slot.offsetLeft + slot.offsetWidth / 2 - chips[0].offsetWidth / 2, cy = slot.offsetTop + slot.offsetHeight / 2;
      const land = j => {   // five agents per tile, in a row along the tile's foot
        const tile = tiles[j < 5 ? 0 : 1], w = chips[0].offsetWidth, step = (tile.offsetWidth - 56 - w) / 4;
        return [tile.offsetLeft + 28 + (j % 5) * step, tile.offsetTop + tile.offsetHeight - 28 - w];
      };
      tl.set(chips, { visibility: 'visible', x: cx, y: cy, scale: 0 }, t + .5)
        .to(chips, { scale: 1, duration: .25, stagger: .03, ease: 'back.out(2)' }, t + .5)
        .to(chips, { x: j => land(j)[0], y: j => land(j)[1], duration: .9, stagger: { amount: .6, ease: 'power2.out' }, ease: 'power3.inOut' }, t + .7);
      t += 2.4; tl.addLabel('b10vb', t); t += HOLD;
      wipeIn(tl, [line3], t);
      return t + .9;
    },
    b11(tl, s, t) {   // the ladder rises; the asked tranche fills red and takes the tick, the later ones stay outlined and lock
      const ask = $('.ask .col', s);
      gsap.set(ask, { backgroundColor: ink });
      tl.fromTo($$('.col', s), { scaleY: 0 }, { scaleY: 1, duration: .6, stagger: .15 }, t - .3)
        .set(ask, { backgroundColor: red }, t + .5)
        .fromTo($$('.col svg', s), { scale: 0 }, { scale: 1, duration: .25, stagger: .4, ease: 'back.out(2)' }, t + .5);
      return t + 1.7;
    },
    b12(tl, s, t) {
      draw(tl, $$('.roads path', s), t - .4, .8, .1);
      tl.fromTo($$('.ends circle', s), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .3, stagger: .1 }, t + .2);
      return t + 1.2;   // R1: the brand close holds longest
    },
  };

  function build() {
    ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } }), starts = [0];
      const markTo = new Map([head, ...$$('[data-mark]')].map(el => [el, fit(mark, el)]));   // measured at scale 1
      const slot0 = $('[data-frame]', beats[0]);
      gsap.set(frame, { ...fit(frame, slot0), borderRadius: radius(slot0) });
      gsap.set(mark, { ...markTo.get(head), scale: 0 });
      const morph = (slot, at) => tl.to(frame, { ...fit(frame, slot), borderRadius: radius(slot), duration: .75, ease: 'power3.inOut' }, at);
      // the mark rises into the header band before it travels (or travels along it before it drops), so it never crosses copy
      const fly = (to, at) => {
        const { x, ...v } = markTo.get(to), up = to === head;
        tl.to(mark, { ...v, duration: .75, ease: up ? 'power3.out' : 'power2.inOut' }, at)
          .to(mark, { x, duration: .75, ease: up ? 'power2.inOut' : 'power3.out' }, at);
      };
      const portrait = matchMedia('(orientation: portrait)').matches;
      // portrait: a slide taller than the stage pans up (from `at`) until its last element is in view; returns when it lands.
      // Lines the pan would push under the header wipe out first, so nothing is ever left half-cut by the header.
      const lift = (tl, box, at, label) => {   // label: a hold on the words before the pan takes them away
        const kids = $$(':scope > :not(.vo-row):not(.hint):not(.sr)', box);
        const D = Math.max(...kids.map(k => k.offsetTop + k.offsetHeight)) - (box.clientHeight - parseFloat(getComputedStyle(box).paddingBottom));
        if (D <= 8) return at;
        label && tl.addLabel(label, at);
        const c = canvas.getBoundingClientRect(), k = c.width / canvas.offsetWidth, floor = parseFloat(getComputedStyle(html).getPropertyValue('--top')) + 24;
        const gone = $$('.m', box).filter(m => (m.getBoundingClientRect().top - c.top) / k - D < floor);
        wipeOut(tl, gone.map(m => m.firstElementChild), at);
        tl.to([...kids, frame], { y: `-=${D}`, duration: 1, ease: 'power2.inOut' }, at);
        return at + 1.05;
      };
      let t = 0, at = head;
      tl.addLabel('top', 0);
      beats.forEach((s, i) => {
        const first = $('.pa', s) || s;
        if (i) {   // one continuous exchange: the next slide's words rise while the last one's leave; no empty frame
          const p = beats[i - 1], out = $('[data-frame]>.in', p), inn = $('[data-frame]>.in', first), m = $('[data-mark]', first) || head;
          wipeOut(tl, $$('.m>*,.n>*,.vo-row>*', p), t);
          out && tl.to(out, { clipPath: SHUT, duration: .3, ease: 'power2.in' }, t);
          tl.to($$('.agents-fly li, .grid12 li', p), { scale: 0, duration: .3, ease: 'power2.in' }, t);
          tl.set(s, { visibility: 'visible' }, t + .2).set(p, { visibility: 'hidden' }, t + .55);
          tl.to($$('.wire', p), { scaleX: 0, transformOrigin: '100% 50%', duration: .35, ease: 'power2.in' }, t);
          starts.push(t + .2);
          morph($('[data-frame]', first), t + .1);
          if (i > 2 && m !== at) { fly(m, t + .1); at = m; }
          wipeIn(tl, [...$$('.m:not(.later)>*', first), ...$$('.vo-row>*', s)], t + .42);   // starts as the last outgoing line clears: never two slides' words at once
          inn && tl.fromTo(inn, { clipPath: SHUT }, { clipPath: OPEN, duration: .45 }, t + .55);
          t += 1.05;
        }
        t = scene[s.id](tl, s, t, { morph, fly, lift, portrait });
        // portrait: hold the settled slide (every counter landed), then pan to its evidence and hold again
        if (portrait && s === first) { const end = lift(tl, s, t + HOLD); if (end > t + HOLD) { tl.addLabel(s.id + '-read', t); t = end; } }
        if (s.id === 'b10') at = head;
        tl.addLabel(s.id, t);
        t += HOLD;
      });
      tl.set({}, {}, t);
      track.style.height = tl.duration() * 50 + 100 + 'svh';   // half a screen of scroll per timeline second
      st = ScrollTrigger.create({
        trigger: track, start: 'top top', end: 'bottom bottom', animation: tl, scrub: .6,
        snap: { snapTo: 'labelsDirectional', duration: { min: .5, max: 1.4 }, delay: .12, ease: 'power1.inOut' },
        onUpdate: self => {
          progress.style.transform = `scaleX(${self.progress})`;
          const time = self.progress * tl.duration();
          let k = 0; while (k < N - 1 && time >= starts[k + 1]) k++;
          show(k);
        },
      });
    }, canvas);
  }

  // the canvas only rescales on resize (CSS); the composition changes only when the stage flips portrait ↔ landscape
  matchMedia('(orientation: portrait)').addEventListener('change', () => {
    const p = st.progress;
    ctx.revert(); build();
    window.scrollTo(0, st.start + p * (st.end - st.start));
  });

  // deep links: wait for load, so the browser's own jump to the #bNN section is already done
  history.scrollRestoration = 'manual';
  const linked = () => beats.findIndex(b => '#' + b.id === location.hash);
  const loaded = new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true }));
  Promise.all([document.fonts.ready, loaded]).then(() => {
    build();
    const k = linked();
    if (k > 0) window.scrollTo(0, labelY(beats[k].id));
    show(Math.max(0, k));
    addEventListener('hashchange', () => { const i = linked(); i >= 0 && go(i); });
    qa();
  });
})();
