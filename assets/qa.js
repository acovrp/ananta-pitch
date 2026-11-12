// QA probe, loaded only with ?qa (see web/check-motion.mjs). Steps the whole scroll timeline and records every element
// that is ever semi-transparent: computed opacity strictly between 0 and 1, a text/background colour with partial alpha,
// an opacity filter, SVG fill/stroke opacity, or an opacity transition. Any hit is a cross-dissolve. Result → <pre id="qa-result">.
// Also exposes qaInfo()/qaSeek(t) so the frame renderer can step the timeline without scrolling.
(() => {
  const STEP = 0.05;
  const tl = window.ScrollTrigger?.getAll()[0]?.animation;
  const els = [...document.querySelectorAll('#canvas *')];
  const out = { motion: !!tl, step: STEP, samples: 0, elements: els.length, bad: [] };
  const seen = new Set();
  const flag = (el, what, time) => {   // one finding per element + property (first time it happens)
    const sec = el.closest('section');
    const key = `${el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className.baseVal ?? el.className).trim().replace(/\s+/g, '.')}${sec ? ' in #' + sec.id : ''}: ${what.split(' ')[0]}`;
    if (!seen.has(key)) { seen.add(key); out.bad.push(`${key} = ${what.split(' ').slice(1).join(' ')} (t=${time.toFixed(2)})`); }
  };
  const alpha = c => { const p = c.match(/rgba?\(([^)]+)\)/)?.[1].split(/[\s,/]+/).filter(Boolean); return p && p.length > 3 ? parseFloat(p[3]) : 1; };
  const partial = a => a > 0 && a < 1;
  const scan = time => {
    out.samples++;
    for (const el of els) {
      const cs = getComputedStyle(el);
      if (partial(parseFloat(cs.opacity))) flag(el, `opacity ${cs.opacity}`, time);
      if (partial(alpha(cs.color))) flag(el, `color ${cs.color}`, time);
      if (partial(alpha(cs.backgroundColor))) flag(el, `background ${cs.backgroundColor}`, time);
      if (/opacity/.test(cs.filter)) flag(el, `filter ${cs.filter}`, time);
      if (el instanceof SVGElement && (partial(parseFloat(cs.fillOpacity)) || partial(parseFloat(cs.strokeOpacity)))) flag(el, 'svg fill/stroke opacity', time);
      if (/opacity|all/.test(cs.transitionProperty) && cs.transitionDuration.split(',').some(d => parseFloat(d) > 0)) flag(el, `transition ${cs.transitionProperty}`, time);
    }
  };
  if (tl) {
    const keep = tl.time();
    for (let t = 0; t <= tl.duration() + 1e-6; t += STEP) { tl.time(t, false); scan(t); }
    tl.time(keep, false);
  } else scan(0);
  // data gate: in every chart, each bar's rendered length / the value printed on screen must agree within ±3%
  // (measured at the section's hold). Values come from the visible label (₹2 cr, 15%, 7–8% → 7.5, 6 months) or the
  // <data value>, never from the CSS that draws the bar. The b02 ledger is illustrative (no values) and is not a chart.
  const shown = row => {
    const d = row.querySelector('data[value]'); if (d) return Math.abs(+d.value);
    const n = (row.querySelector('.amt, .val').textContent.match(/[\d.]+/g) || []).map(Number);
    return n.reduce((a, b) => a + b, 0) / n.length;
  };
  out.charts = [];
  for (const chart of document.querySelectorAll('.diverge, .hbars, .ladder')) {
    const sec = chart.closest('section');
    if (tl) tl.time(tl.labels[sec.id], false);
    const tall = chart.classList.contains('ladder');
    const bars = [...chart.querySelectorAll(tall ? 'li' : '.row')].map(row => {
      const r = row.querySelector('.bar, .col').getBoundingClientRect();
      return { v: shown(row), len: tall ? r.height : r.width };
    });
    const k = bars.map(b => b.len / b.v), spread = Math.max(...k) / Math.min(...k) - 1;
    out.charts.push({ section: sec.id, kind: chart.classList[chart.classList.length - 1], values: bars.map(b => b.v), lengths: bars.map(b => Math.round(b.len)), spread: +spread.toFixed(4) });
    if (!(spread <= 0.03)) out.bad.push(`#${sec.id} ${chart.className}: bar lengths not proportional to the values shown (spread ${(spread * 100).toFixed(1)}% > 3%)`);
  }
  if (tl) tl.time(window.ScrollTrigger.getAll()[0].progress * tl.duration(), false);   // back to where the scroll is
  out.pass = out.bad.length === 0;
  const pre = Object.assign(document.createElement('pre'), { id: 'qa-result', textContent: JSON.stringify(out) });
  const beats = [...document.querySelectorAll('.beat')];
  window.qaInfo = () => ({ duration: tl?.duration() ?? 0, holds: tl ? Object.entries(tl.labels).filter(([k]) => k !== 'top').map(([, t]) => t) : [] });
  window.qaSeek = t => {   // timeline state + the pager/progress the scroll handler would show
    tl.time(t, false);
    const live = beats.filter(b => getComputedStyle(b).visibility === 'visible').pop() ?? beats[0];
    document.getElementById('now-n').textContent = String(beats.indexOf(live) + 1).padStart(2, '0');
    document.getElementById('now-name').textContent = live.dataset.name;
    document.getElementById('progress').style.transform = `scaleX(${t / tl.duration()})`;
  };
  pre.hidden = true;
  document.body.append(pre);
  console.log('qa-result', JSON.stringify(out));
})();
