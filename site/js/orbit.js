/*
  The hero's orbit canvas: three inclined orbits round the portrait, nodes drifting along them, thin links
  between nodes that pass close to each other, and one signal running the middle orbit. Two 2D canvases, one
  behind the portrait and one in front, so a node passes behind the head and in front of the chest.

  Light by construction: about twenty arcs and a dozen discs a frame, 30 frames a second, a pixel ratio of
  1.5 at most, nothing drawn while the stage is off screen or the tab is hidden. Positions come from a clock
  that starts at load, so the picture is the same whenever it is looked at. The pointer tilts the orbital
  plane a few degrees and lights the nodes near it. Under reduced motion, on a phone and on touch screens it
  draws one still frame and stops.
*/
const TAU = Math.PI * 2;
const PAD = 0;                      // the canvases are the stage's own box (css/page.css)
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// radius as a share of the stage width, flattening (ry / rx), roll in degrees, seconds per lap, nodes [phase, size, tone]
const ORBITS = [
  { r: 0.205, flat: 0.25, roll: -9, lap: 96, nodes: [[0.08, 3.2, 'ink'], [0.55, 2.2, 'amber']] },
  { r: 0.318, flat: 0.27, roll: 5, lap: 150, nodes: [[0.21, 2.6, 'amber'], [0.47, 3.6, 'ink'], [0.83, 2.2, 'ink']] },
  { r: 0.432, flat: 0.29, roll: -3, lap: 232, nodes: [[0.02, 2.4, 'ink'], [0.31, 3.0, 'amber'], [0.62, 2.2, 'ink'], [0.9, 3.4, 'signal']] },
];
const SIGNAL = { orbit: 1, lap: 18, tail: 0.11 };       // a pulse on the middle orbit, a ninth of a lap long
const LINK = 0.15;                                      // nodes closer than this share of the width are linked
const NEAR = 170;                                       // px: how far the pointer reaches

function palette() {
  const cs = getComputedStyle(document.documentElement);
  const hex = (name, fallback) => {
    const v = cs.getPropertyValue(name).trim() || fallback;
    const m = /^#([0-9a-f]{6})$/i.exec(v) || /^#([0-9a-f]{6})$/i.exec(fallback);
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  return { ink: hex('--p-ink', '#ece8df'), amber: hex('--p-accent', '#e0a458'), signal: hex('--signal', '#7fb6d6') };
}
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// a fixed scatter of faint dust, the same on every load
function dust(n) {
  let s = 0x2f6e2b1;
  const rnd = () => ((s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x297a2d39 | 0) >>> 0) / 4294967296;
  return Array.from({ length: n }, () => ({ x: rnd(), y: rnd(), r: 0.6 + rnd() * 1.0, a: 0.14 + rnd() * 0.26 }));
}

export function mountOrbit(stage, { pauseButton } = {}) {
  const back = stage.querySelector('.orbit--back'), front = stage.querySelector('.orbit--front');
  if (!back || !front || !back.getContext) return null;
  const bx = back.getContext('2d'), fx = front.getContext('2d');
  const col = palette(), motes = dust(56);
  const fixed = matchMedia('(prefers-reduced-motion: reduce)').matches
    || matchMedia('(max-width: 639px)').matches || matchMedia('(pointer: coarse)').matches;

  let W = 0, H = 0, dpr = 1;                             // the stage's box, css px
  let tiltX = 0, tiltY = 0, aimX = 0, aimY = 0;          // the pointer's pull on the plane, -1..1, eased
  let ptr = null;                                        // the pointer in canvas px, or null
  let visible = true, paused = false, raf = 0, last = 0, clock = 0, t0 = performance.now();

  const size = () => {
    const r = stage.getBoundingClientRect();
    // css/page.css turns the canvases off on a stage too narrow for the orbits: nothing to size or draw then
    if (!r.width || !r.height || getComputedStyle(back).display === 'none') return false;
    W = r.width; H = r.height;
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    for (const c of [back, front]) {
      c.width = Math.round((W + PAD * 2) * dpr);
      c.height = Math.round((H + PAD * 2) * dpr);
    }
    return true;
  };

  /* a point on an orbit: its screen position, and z > 0 when it is on the viewer's side */
  const at = (o, turn, cx, cy) => {
    const a = turn * TAU, R = o.r * W;
    const flat = clamp(o.flat + tiltY * 0.07, 0.12, 0.42);
    const roll = (o.roll + tiltX * 3.2) * Math.PI / 180;
    const x = Math.cos(a) * R, z = Math.sin(a), y = z * R * flat;
    return { x: cx + x * Math.cos(roll) - y * Math.sin(roll), y: cy + x * Math.sin(roll) + y * Math.cos(roll), z };
  };

  const arc = (ctx, o, from, to, cx, cy) => {              // an orbit's arc as a polyline, from..to in turns
    const steps = Math.max(8, Math.ceil(Math.abs(to - from) * 96));
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const p = at(o, lerp(from, to, i / steps), cx, cy);
      if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
    }
    ctx.stroke();
  };

  const draw = t => {
    const cx = PAD + W / 2, cy = PAD + H * 0.6;
    for (const ctx of [bx, fx]) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W + PAD * 2, H + PAD * 2); ctx.lineCap = 'round'; }

    // behind everything: one soft amber light behind the head, and the dust
    // (an ellipse as wide as 0.46 of the stage and as tall as half of it, so it has faded out before the stage's edges)
    const gx = Math.min(W * 0.46, H * 1.15), gy = H * 0.5;
    bx.save(); bx.translate(cx, PAD + H * 0.5); bx.scale(1, gy / gx);
    const g = bx.createRadialGradient(0, 0, 0, 0, 0, gx);
    g.addColorStop(0, rgba(col.amber, 0.13)); g.addColorStop(0.5, rgba(col.amber, 0.055)); g.addColorStop(1, rgba(col.amber, 0));
    bx.fillStyle = g; bx.beginPath(); bx.arc(0, 0, gx, 0, TAU); bx.fill(); bx.restore();
    for (const m of motes) { bx.fillStyle = rgba(col.ink, m.a); bx.beginPath(); bx.arc(PAD + m.x * W + tiltX * 4 * m.r, PAD + m.y * H + tiltY * 3 * m.r, m.r, 0, TAU); bx.fill(); }

    // the orbits: the far half behind the portrait, the near half in front of it
    ORBITS.forEach(o => {
      bx.lineWidth = 1.25; bx.strokeStyle = rgba(col.ink, 0.2); arc(bx, o, 0.5, 1, cx, cy);
      fx.lineWidth = 1.25; fx.strokeStyle = rgba(col.ink, 0.34); arc(fx, o, 0, 0.5, cx, cy);
    });

    // the signal: a short bright arc running the middle orbit
    const so = ORBITS[SIGNAL.orbit], head = (t / SIGNAL.lap) % 1;
    for (let i = 0; i < 14; i++) {
      const a0 = head - SIGNAL.tail * (i + 1) / 14, a1 = head - SIGNAL.tail * i / 14;
      const mid = (((a0 + a1) / 2) % 1 + 1) % 1, ctx = mid < 0.5 ? fx : bx;
      ctx.lineWidth = 1.6; ctx.strokeStyle = rgba(col.signal, (1 - i / 14) * (mid < 0.5 ? 0.9 : 0.4));
      arc(ctx, so, a0, a1, cx, cy);
    }

    // the nodes
    const nodes = [];
    ORBITS.forEach((o, k) => o.nodes.forEach(([phase, r, tone]) => {
      const p = at(o, phase + t / o.lap, cx, cy);
      const near = ptr ? clamp(1 - Math.hypot(p.x - ptr.x, p.y - ptr.y) / NEAR, 0, 1) : 0;
      nodes.push({ ...p, k, r, tone, near });
    }));

    // links between nodes of neighbouring orbits that pass close to each other
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      if (Math.abs(a.k - b.k) !== 1) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y) / W;
      if (d >= LINK) continue;
      const ctx = a.z > 0 && b.z > 0 ? fx : bx;
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(col.amber, (1 - d / LINK) * (ctx === fx ? 0.42 : 0.22));
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    // and from the pointer to the nodes it is near
    if (ptr) for (const n of nodes) {
      if (n.near <= 0) continue;
      fx.lineWidth = 1; fx.strokeStyle = rgba(col.signal, n.near * 0.5);
      fx.beginPath(); fx.moveTo(ptr.x, ptr.y); fx.lineTo(n.x, n.y); fx.stroke();
    }

    for (const n of nodes) {
      const ctx = n.z > 0 ? fx : bx, depth = 0.82 + (n.z + 1) * 0.16, r = n.r * depth * (1 + n.near * 0.5);
      const a = (n.z > 0 ? 0.95 : 0.5) + n.near * 0.3;
      ctx.fillStyle = rgba(col[n.tone], 0.12 + n.near * 0.14); ctx.beginPath(); ctx.arc(n.x, n.y, r * 3.6, 0, TAU); ctx.fill();   // halo
      ctx.fillStyle = rgba(col[n.tone], Math.min(1, a)); ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, TAU); ctx.fill();
    }
  };

  const frame = now => {
    raf = 0;
    if (!visible || paused || document.hidden || back.offsetParent === null) return;
    raf = requestAnimationFrame(frame);
    if (now - last < 32) return;                          // about 30 frames a second
    last = now;
    clock = (now - t0) / 1000;
    tiltX = lerp(tiltX, aimX, 0.06); tiltY = lerp(tiltY, aimY, 0.06);
    draw(clock + 14);
  };
  const run = () => { if (!fixed && !raf && visible && !paused && !document.hidden && W) raf = requestAnimationFrame(frame); };
  const still = () => draw((fixed ? 0 : clock) + 14);

  if (size()) still();
  new ResizeObserver(() => { if (size()) { still(); run(); } }).observe(stage);

  if (!fixed) {
    new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: '80px' }).observe(stage);
    document.addEventListener('visibilitychange', run);

    // the pointer: read once a move, in viewport px; the stage's box is cached and refreshed on scroll and resize
    let box = stage.getBoundingClientRect(), stale = false;
    const refresh = () => { stale = true; };
    addEventListener('scroll', refresh, { passive: true });
    addEventListener('resize', refresh, { passive: true });
    addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      if (stale) { box = stage.getBoundingClientRect(); stale = false; }
      const x = e.clientX - box.left, y = e.clientY - box.top;
      const inside = x > -120 && x < box.width + 120 && y > -160 && y < box.height + 80;
      ptr = inside ? { x: x + PAD, y: y + PAD } : null;
      aimX = inside ? clamp((x / box.width - 0.5) * 2, -1, 1) : 0;
      aimY = inside ? clamp((y / box.height - 0.5) * 2, -1, 1) : 0;
      if (paused) { tiltX = aimX; tiltY = aimY; still(); }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { ptr = null; aimX = aimY = 0; });

    if (pauseButton) {
      stage.append(pauseButton(() => {
        paused = !paused;
        if (paused) { cancelAnimationFrame(raf); raf = 0; } else { t0 = performance.now() - clock * 1000; run(); }
        return paused;
      }, 'the orbit animation'));
    }
    run();
  }
  return { pause() { paused = true; }, resume() { paused = false; run(); } };
}
