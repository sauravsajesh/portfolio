/*
  The page's own behaviour. It runs before the kit's system.js (index.html lists it first), so everything it
  renders is in the page when the kit binds its tabs.

  - renders the project explorer, the skills tabs and the history rows from js/data.js
  - explorer: area filters, deep links (#project-<id>), and the slide-over under 1024px
  - media slots: a project's poster becomes a muted loop when data.js names a video for it
  - magnetic pull on the primary actions, smooth in-page jumps, the hero's orbit canvas (js/orbit.js)

  Switching projects, facets and skill areas is the kit's tab behaviour (assets/system.js): the markup below
  only declares role="tablist", role="tab" and aria-controls. Inside the two windows text sits in div and
  span, as in every kit fragment.
*/
import { areas, projects, skills, history, languages } from './data.js';
import { mountOrbit } from './orbit.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => matchMedia('(max-width: 1023px)').matches;
const hide = i => (i ? ' hidden' : '');

const byId = Object.fromEntries(projects.map(p => [p.id, p]));
const areaOf = Object.fromEntries(areas.map(a => [a.id, a]));

/* real tool marks fetched by the kit's icons.mjs into assets/icons: [width, height, shape classes] */
const ICONS = {
  tensorflow: [37, 40], pytorch: [33, 40], python: [40, 40], docker: [40, 29, 'ic-land'], azure: [40, 38],
  'github-actions': [40, 40], 'raspberry-pi': [31, 40, 'ic-tall'], flask: [31, 40, 'ic-tall ic-ink'],
  'linux-tux': [34, 40], bash: [35, 40], git: [40, 40], 'hugging-face': [40, 37], 'c-plusplus': [36, 40],
  keras: [40, 40], pytest: [35, 40], opencv: [32, 40],
};
const mark = id => {
  const m = ICONS[id];
  return m ? `<span class="ic-tile"><img class="ic ${m[2] || ''}" src="assets/icons/${id}.svg" width="${m[0]}" height="${m[1]}" alt="" loading="lazy"></span>` : '';
};
const glyph = id => `<span class="ic-tile ic-tile--glyph" aria-hidden="true"><span class="ic ic-mask" style="-webkit-mask-image:url(assets/icons/ui-${id}.svg);mask-image:url(assets/icons/ui-${id}.svg)"></span></span>`;
const ARROW_OUT = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="2.5" width="3" height="9" rx=".8"/><rect x="8" y="2.5" width="3" height="9" rx=".8"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.6v8.8a.6.6 0 0 0 .9.5l7-4.4a.6.6 0 0 0 0-1L4.9 2.1a.6.6 0 0 0-.9.5z"/></svg>';

/* the kit's round pause button, for a loop the page runs itself */
function pauseButton(toggle, what = 'animation') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'loop-pause';
  const show = paused => {
    b.innerHTML = paused ? ICON_PLAY : ICON_PAUSE;
    b.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} ${what}`);
    b.classList.toggle('is-paused', paused);
  };
  b.addEventListener('click', () => show(toggle()));
  show(false);
  return b;
}

/* ------------------------------------------------------------------ the project explorer */
function renderExplorer() {
  const root = $('[data-px]');
  if (!root) return null;
  const filters = $('[data-px-filters]', root), rows = $('[data-px-rows]', root), heads = $('[data-px-heads]', root);
  const facet = name => $(`[data-px-facet="${name}"]`, root);

  filters.innerHTML = `<button class="px__chip" type="button" data-area="all" aria-pressed="true">All</button>`
    + areas.map(a => `<button class="px__chip" type="button" data-area="${a.id}" aria-pressed="false">${esc(a.short || a.label)}</button>`).join('');
  filters.insertAdjacentHTML('afterend',
    `<select class="px__select" id="px-area" name="area" aria-label="Show projects by area" data-px-select><option value="all">All projects</option>${areas.map(a => `<option value="${a.id}">${esc(a.label)}</option>`).join('')}</select>`);

  // each row is the project's anchor (#project-<id>) and the tab of its four panels
  rows.innerHTML = projects.map((p, i) => `
    <button class="px__row" type="button" role="tab" id="project-${p.id}" aria-selected="${i === 0}" aria-controls="px-h-${p.id} px-o-${p.id} px-a-${p.id} px-s-${p.id}" data-id="${p.id}" data-areas="${p.areas.join(' ')}">
      <img class="px__thumb" src="${p.media.thumb}" width="44" height="44" alt="" loading="lazy" decoding="async">
      <span><span class="px__row-title">${esc(p.short)}</span><span class="px__row-kind">${esc(p.kind)}</span></span>
      <span class="px__row-mark" aria-hidden="true"></span>
    </button>`).join('');

  heads.innerHTML = projects.map((p, i) => `
    <div class="px__head" id="px-h-${p.id}"${hide(i)}>
      <div class="px__head-kind">${esc(p.kind)}</div>
      <div class="px__head-title" role="heading" aria-level="3">${esc(p.title)}</div>
      <div class="px__head-meta">${esc(p.meta)}</div>
    </div>`).join('');

  facet('overview').innerHTML = projects.map((p, i) => `
    <div class="px__ov" id="px-o-${p.id}"${hide(i)}>
      <div>
        <div class="px__summary">${esc(p.summary)}</div>
        <ul class="px__areas" aria-label="Areas">${p.areas.map(a => `<li>${esc(areaOf[a].label)}</li>`).join('')}</ul>
        ${p.links.length ? `<div class="px__links">${p.links.map(l => `<a class="px__ext" href="${esc(l.href)}" rel="noopener">${esc(l.label)}${ARROW_OUT}</a>`).join('')}</div>` : ''}
      </div>
      <figure class="slot" data-slot="${p.id}"><img src="${p.media.poster}" width="1024" height="640" alt="${esc(p.media.alt)}" loading="lazy" decoding="async"></figure>
    </div>`).join('');

  facet('architecture').innerHTML = projects.map((p, i) => `
    <ol class="px__stages" id="px-a-${p.id}"${hide(i)}>${p.stages.map(s => `
      <li class="px__stage"><div class="px__stage-title">${esc(s.title)}</div><div class="px__stage-text">${esc(s.text)}</div></li>`).join('')}
    </ol>`).join('');

  facet('stack').innerHTML = projects.map((p, i) => `
    <div class="px__sr${p.figures.length ? '' : ' px__sr--wide'}" id="px-s-${p.id}"${hide(i)}>
      <div>
        <div class="px__label">Stack</div>
        <ul class="px__tools">${p.stack.map(t => `<li class="px__tool">${mark(t.icon)}${esc(t.name)}</li>`).join('')}</ul>
      </div>
      ${p.figures.length ? `<div>
        <div class="px__label">Figures</div>
        <div class="px__figs">${p.figures.map(f => `<div class="px__fig"><div class="px__fig-value">${esc(f.value)}</div><div class="px__fig-label">${esc(f.label)}</div></div>`).join('')}</div>
      </div>` : ''}
    </div>`).join('');

  /* ---- behaviour the kit's tabs do not cover: the area filter, deep links, the slide-over ---- */
  const rowEls = $$('.px__row', rows), chips = $$('.px__chip', filters), select = $('[data-px-select]', root);
  const selected = () => rowEls.find(r => r.getAttribute('aria-selected') === 'true');

  const filter = area => {
    let first = null;
    rowEls.forEach(r => {
      const on = area === 'all' || r.dataset.areas.split(' ').includes(area);
      r.hidden = !on;
      if (on && !first) first = r;
    });
    chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.area === area)));
    select.value = area;
    if (selected()?.hidden && first) first.click();
  };
  chips.forEach(c => c.addEventListener('click', () => filter(c.dataset.area)));
  select.addEventListener('change', () => filter(select.value));

  // arrow keys walk the rows the filter leaves on show (the kit would also stop on hidden ones)
  rows.addEventListener('keydown', e => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    const shown = rowEls.filter(r => !r.hidden), i = shown.indexOf(e.target.closest('.px__row'));
    if (i < 0) return;
    e.preventDefault();
    e.stopPropagation();
    const next = shown[(i + d + shown.length) % shown.length];
    next.click();
    next.focus();
  }, true);

  // under 1024px the open project slides over the list, inside the window
  const back = $('[data-px-back]', root);
  const slide = on => {
    root.classList.toggle('is-open', on);
    if (!narrow()) return;
    if (on) back.focus({ preventScroll: true }); else selected()?.focus({ preventScroll: true });
  };
  rowEls.forEach(r => r.addEventListener('click', e => { if (e.isTrusted && narrow()) slide(true); }));
  back.addEventListener('click', () => slide(false));
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('is-open') && narrow()) slide(false); });

  const open = id => {
    const row = byId[id] && document.getElementById(`project-${id}`);
    if (!row) return false;
    if (row.hidden) filter('all');
    row.click();
    if (narrow()) root.classList.add('is-open');
    return true;
  };
  return { open };
}

/* ------------------------------------------------------------------ skills: four tabs, each with its window */
function renderSkills() {
  const tabs = $('[data-sk-tabs]'), panels = $('[data-sk-panels]'), screens = $('[data-sk-screens]');
  if (!tabs) return;
  tabs.innerHTML = skills.map((g, i) => {
    const a = areaOf[g.area];
    const label = a.short ? `<span class="sk__tab-full">${esc(a.label)}</span><span class="sk__tab-short">${esc(a.short)}</span>` : esc(a.label);
    return `<button class="sk__tab" type="button" role="tab" id="sk-t-${g.area}" aria-selected="${i === 0}" aria-controls="sk-p-${g.area} sk-s-${g.area}">${label}</button>`;
  }).join('');
  panels.innerHTML = skills.map((g, i) => `
    <div class="sk__panel" role="tabpanel" id="sk-p-${g.area}" aria-labelledby="sk-t-${g.area}"${hide(i)}>
      <p>${esc(g.lead)}</p>
      <div class="sk__links">
        <a class="link" href="#project-${g.link.project}">${esc(g.link.label)}</a>
        ${g.cert ? `<a class="link" href="${esc(g.cert.href)}" rel="noopener">${esc(g.cert.label)}</a>` : ''}
      </div>
    </div>`).join('');
  screens.innerHTML = skills.map((g, i) => `
    <div class="ui ui-panel sk__screen" id="sk-s-${g.area}"${hide(i)}>
      <div class="sk__cols"><span>Skill</span><span>Used in</span></div>
      <ul class="sk__list">${g.items.map(it => `
        <li class="sk__item">
          <span class="sk__name">${it.icon ? mark(it.icon) : glyph(it.glyph)}${esc(it.name)}</span>
          <span class="sk__used">${it.used.map(u => byId[u]
            ? `<a class="sk__chip" href="#project-${u}">${esc(byId[u].tag)}</a>`
            : `<span class="sk__chip sk__chip--plain">${esc(u)}</span>`).join('')}</span>
        </li>`).join('')}
      </ul>
    </div>`).join('');
}

/* ------------------------------------------------------------------ experience: the history as ruled rows */
function renderHistory() {
  const rows = $('[data-xp-rows]');
  if (rows) rows.innerHTML = history.map(h => `
    <li><span class="rows__name">${esc(h.role)}</span><span class="rows__value">${esc(h.dates)}</span><p><span class="xp__org">${esc(h.org)}</span>${esc(h.text)}</p></li>`).join('')
    + `<li><span class="rows__name">Languages</span><p>${esc(languages)}</p></li>`;
}

/* ------------------------------------------------------------------ media slots: a still, or a muted loop */
function mountSlots() {
  if (reduced() || matchMedia('(max-width: 639px)').matches) return;       // the poster stands
  for (const p of projects) {
    const fig = p.media && p.media.video && $(`[data-slot="${p.id}"]`);
    if (!fig) continue;
    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, playsInline: true, preload: 'none', poster: p.media.poster, src: p.media.video, tabIndex: -1 });
    v.setAttribute('aria-hidden', 'true');
    fig.append(v);
    let paused = false, seen = false;
    const play = () => v.play().then(() => fig.classList.add('is-playing')).catch(() => {});
    fig.append(pauseButton(() => { paused = !paused; if (paused) v.pause(); else if (seen) play(); return paused; }, 'video'));
    new IntersectionObserver(es => es.forEach(e => { seen = e.isIntersecting; if (seen && !paused) play(); else v.pause(); }), { threshold: 0.4 }).observe(fig);
  }
}

/* ------------------------------------------------------------------ magnetic pull on the primary actions */
function magnets() {
  if (reduced() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const els = $$('.magnet');
  if (!els.length) return;
  const REACH = 72, MAX = 6;
  let boxes = [], px = -1e4, py = -1e4, raf = 0, stale = true;
  const measure = () => {
    boxes = els.map(el => {
      const r = el.getBoundingClientRect();
      const mx = parseFloat(el.style.getPropertyValue('--mx')) || 0, my = parseFloat(el.style.getPropertyValue('--my')) || 0;
      return { el, cx: r.left + r.width / 2 - mx, cy: r.top + r.height / 2 - my, hw: r.width / 2, hh: r.height / 2, on: r.width > 0 };
    });
    stale = false;
  };
  const frame = () => {
    raf = 0;
    if (stale) measure();
    for (const b of boxes) {
      if (!b.on) continue;
      const dx = px - b.cx, dy = py - b.cy;
      // distance from the button's edge, 0 inside it
      const gap = Math.hypot(Math.max(0, Math.abs(dx) - b.hw), Math.max(0, Math.abs(dy) - b.hh));
      const k = gap >= REACH ? 0 : 1 - gap / REACH;
      const mx = k ? Math.max(-MAX, Math.min(MAX, dx * 0.12 * k)) : 0, my = k ? Math.max(-MAX, Math.min(MAX, dy * 0.22 * k)) : 0;
      b.el.style.setProperty('--mx', `${mx.toFixed(2)}px`);
      b.el.style.setProperty('--my', `${my.toFixed(2)}px`);
      b.el.classList.toggle('is-pulled', k > 0);
    }
  };
  const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; px = e.clientX; py = e.clientY; ask(); }, { passive: true });
  addEventListener('scroll', () => { stale = true; }, { passive: true });
  addEventListener('resize', () => { stale = true; }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { px = py = -1e4; ask(); });
}

/* ------------------------------------------------------------------ in-page jumps
   A link to a section stays the browser's own jump (it moves the focus point and the address); it is only
   made smooth for that one jump. A link to a project (#project-thesis) opens it in the explorer and lands
   on the section's top, where its heading is. */
function jumps(explorer) {
  const html = document.documentElement;
  const PROJECT = /^#project-([\w-]+)$/;
  let timer = 0;
  const smooth = () => {
    if (reduced()) return;
    html.style.scrollBehavior = 'smooth';
    clearTimeout(timer);
    timer = setTimeout(() => { html.style.scrollBehavior = ''; }, 1000);
  };
  const toProject = id => {
    if (!explorer || !explorer.open(id)) return false;
    smooth();
    document.getElementById('projects').scrollIntoView({ block: 'start' });
    return true;
  };
  document.addEventListener('click', e => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a || a.classList.contains('skip-link') || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    const hash = a.getAttribute('href'), m = PROJECT.exec(hash);
    if (!m) { if (hash.length > 1 && document.getElementById(hash.slice(1))) smooth(); return; }
    e.preventDefault();
    if (toProject(m[1]) && hash !== location.hash) history.pushState(null, '', hash);
  });
  const fromAddress = () => { const m = PROJECT.exec(location.hash); if (m) toProject(m[1]); };
  addEventListener('popstate', fromAddress);
  addEventListener('hashchange', fromAddress);
  if (PROJECT.test(location.hash)) addEventListener('load', fromAddress, { once: true });
}

const explorer = renderExplorer();
renderSkills();
renderHistory();
jumps(explorer);
magnets();
mountSlots();
const stage = $('[data-orbit]');
if (stage) mountOrbit(stage, { pauseButton });
