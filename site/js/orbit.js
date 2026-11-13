/*
  The hero stage: a live halftone portrait with three orbits round it.

  Three 2D canvases share the stage: the far half of the orbits, the portrait, the near half of the orbits,
  so a node passes behind the head and in front of the chest.

  The portrait is drawn as dots from media/avatar-frames.png: 36 greyscale tone frames (144px each, six to a
  row) taken from a three-second Higgsfield clip of the photograph, in which the head turns a little and
  comes back. The frames are played forwards and backwards, so the loop has no seam, and blended from one to
  the next. Dots near the pointer brighten and grow. Until the frames have loaded, and wherever the canvases
  are off, the still picture (media/avatar-still-*.webp) stands in their place.

  Light by construction: about 8,000 dots in eight fills, twenty arcs and a dozen discs a frame, 30 frames a
  second, a pixel ratio of 1.5 at most, nothing drawn while the stage is off screen or the tab is hidden.
  Everything runs on one clock from load and stops on the stage's one pause button. On a stage too narrow for
  the orbits (a phone, a tablet held upright) css/page.css hides their canvases and only the portrait runs,
  with fewer dots; a touch on it lights the dots under the finger, then fades. Under reduced motion nothing
  runs: the still portrait and one still frame of the orbits.
*/
const TAU = Math.PI * 2;
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
const NEAR = 170;                                       // px: how far the pointer reaches the orbit's nodes

const FRAMES = { src: 'media/avatar-frames.png', n: 36, size: 144, cols: 6, loop: 7 };   // loop: seconds there and back
const GRID = 155;                                       // dots across the portrait
const GRID_SMALL = 118;                                 // on a portrait under 420px (a phone): fewer, larger dots
const LENS = 96;                                        // px: how far the pointer lights the portrait
const LEVELS = 8;                                       // tone steps, one fill each

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

/* the portrait's tone frames: one Uint8Array, frame after frame */
async function loadFrames() {
  const img = new Image();
  img.decoding = 'async';
  img.src = FRAMES.src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const { size, cols, n } = FRAMES, px = g.getImageData(0, 0, c.width, c.height).data, W = c.width;
  const out = new Uint8Array(n * size * size);
  for (let f = 0; f < n; f++) {
    const ox = (f % cols) * size, oy = Math.floor(f / cols) * size;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) out[f * size * size + y * size + x] = px[((oy + y) * W + ox + x) * 4];
  }
  return out;
}

export function mountOrbit(stage, { pauseButton } = {}) {
  const back = stage.querySelector('.orbit--back'), front = stage.querySelector('.orbit--front'), face = stage.querySelector('.portrait');
  if (!back || !front || !back.getContext) return null;
  const bx = back.getContext('2d'), fx = front.getContext('2d'), px = face ? face.getContext('2d') : null;
  const col = palette(), motes = dust(56);
  const fixed = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, S = 0, dpr = 1;                      // the stage's box and the portrait's square, css px
  let tiltX = 0, tiltY = 0, aimX = 0, aimY = 0;          // the pointer's pull on the plane, -1..1, eased
  let ptr = null;                                        // the pointer in stage px, or null
  let touch = null, touching = false;                     // a finger on the portrait: { x, y, k }, k fading to 0
  let orbitsOn = true;                                   // false where css/page.css hides the orbit canvases
  let visible = true, paused = false, raf = 0, last = 0, clock = 0, t0 = performance.now();
  let tones = null, dots = null;                         // the frames, and the dot grid for the current size

  // the portrait's dots: hex-packed, each with its place and the tone texel it reads
  const layout = () => {
    const G = S < 420 ? GRID_SMALL : GRID;
    const p = S / G, rowH = p * 0.866, rows = Math.floor(S / rowH), T = FRAMES.size;
    const n = G * rows, x = new Float32Array(n), y = new Float32Array(n), at = new Uint32Array(n);
    let k = 0;
    for (let j = 0; j < rows; j++) for (let i = 0; i < G; i++) {
      const cx = i * p + p / 2 + (j % 2 ? p / 2 : 0), cy = j * rowH + p / 2;
      if (cx >= S || cy >= S) continue;
      x[k] = cx; y[k] = cy;
      at[k] = Math.min(T - 1, Math.floor(cy / S * T)) * T + Math.min(T - 1, Math.floor(cx / S * T));
      k++;
    }
    dots = { n: k, x, y, at, p, bx: Array.from({ length: LEVELS }, () => new Float32Array(k * 3)), bn: new Uint32Array(LEVELS) };
  };

  const size = () => {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    W = r.width; H = r.height; S = Math.min(W, H);
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    // css/page.css turns the orbit canvases off on a stage too narrow for them: they are neither sized nor drawn
    orbitsOn = getComputedStyle(back).display !== 'none';
    for (const c of [back, front]) { c.width = orbitsOn ? Math.round(W * dpr) : 0; c.height = orbitsOn ? Math.round(H * dpr) : 0; }
    if (face) { face.width = face.height = Math.round(S * dpr); layout(); }
    return true;
  };

  /* ------------------------------------------------------------ the portrait */
  const drawFace = t => {
    if (!px || !tones || !dots) return;
    const { n, x, y, at, p, bx: buckets, bn } = dots, T2 = FRAMES.size * FRAMES.size;
    // there and back: a triangle wave, eased at both ends
    const ph = (t / FRAMES.loop) % 1, tri = 1 - Math.abs(2 * ph - 1), e = tri * tri * (3 - 2 * tri);
    const fp = e * (FRAMES.n - 1), f0 = Math.floor(fp), f1 = Math.min(FRAMES.n - 1, f0 + 1), w = fp - f0;
    const A = f0 * T2, B = f1 * T2;
    const lp = ptr || touch, lk = ptr ? 1 : touch ? touch.k : 0;   // the mouse lights at once; a finger fades out
    const lx = lp ? lp.x - (W - S) / 2 : -1e4, ly = lp ? lp.y - (H - S) / 2 : -1e4, lens2 = LENS * LENS;
    bn.fill(0);
    for (let k = 0; k < n; k++) {
      let tone = (tones[A + at[k]] * (1 - w) + tones[B + at[k]] * w) / 255;
      if (tone < 0.055) continue;
      const dx = x[k] - lx, dy = y[k] - ly, d2 = dx * dx + dy * dy;
      let grow = 1;
      if (d2 < lens2) { const q = 1 - Math.sqrt(d2) / LENS, b = q * q * lk; tone = Math.min(1, tone * (1 + 0.55 * b)); grow = 1 + 0.22 * b; }
      const lv = Math.min(LEVELS - 1, Math.floor(tone * LEVELS)), o = bn[lv] * 3, buf = buckets[lv];
      buf[o] = x[k]; buf[o + 1] = y[k]; buf[o + 2] = (p * 0.5) * Math.min(0.98, 0.16 + 0.88 * tone) * grow;
      bn[lv]++;
    }
    px.setTransform(dpr, 0, 0, dpr, 0, 0);
    px.clearRect(0, 0, S, S);
    for (let lv = 0; lv < LEVELS; lv++) {
      const m = bn[lv]; if (!m) continue;
      const tone = (lv + 0.5) / LEVELS, k = Math.pow(tone, 1.5), buf = buckets[lv];
      px.fillStyle = `rgba(${Math.round(lerp(col.amber[0], col.ink[0], k))},${Math.round(lerp(col.amber[1], col.ink[1], k))},${Math.round(lerp(col.amber[2], col.ink[2], k))},${Math.min(1, 0.4 + 0.75 * tone).toFixed(3)})`;
      px.beginPath();
      for (let i = 0; i < m; i++) { const o = i * 3; px.moveTo(buf[o] + buf[o + 2], buf[o + 1]); px.arc(buf[o], buf[o + 1], buf[o + 2], 0, TAU); }
      px.fill();
    }
  };

  /* ------------------------------------------------------------ the orbits */
  // a point on an orbit: its screen position, and z > 0 when it is on the viewer's side
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

  const drawOrbits = t => {
    const cx = W / 2, cy = H * 0.6;
    for (const ctx of [bx, fx]) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineCap = 'round'; }

    // behind everything: one soft amber light behind the portrait (an ellipse that has faded out before the
    // stage's edges), and the dust
    const gx = Math.min(W * 0.46, H * 1.15), gy = H * 0.5;
    bx.save(); bx.translate(cx, H * 0.5); bx.scale(1, gy / gx);
    const g = bx.createRadialGradient(0, 0, 0, 0, 0, gx);
    g.addColorStop(0, rgba(col.amber, 0.13)); g.addColorStop(0.5, rgba(col.amber, 0.055)); g.addColorStop(1, rgba(col.amber, 0));
    bx.fillStyle = g; bx.beginPath(); bx.arc(0, 0, gx, 0, TAU); bx.fill(); bx.restore();
    for (const m of motes) { bx.fillStyle = rgba(col.ink, m.a); bx.beginPath(); bx.arc(m.x * W + tiltX * 4 * m.r, m.y * H + tiltY * 3 * m.r, m.r, 0, TAU); bx.fill(); }

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

  const draw = t => { if (orbitsOn) drawOrbits(t + 14); drawFace(t); };

  const frame = now => {
    raf = 0;
    if (!visible || paused || document.hidden || stage.offsetParent === null) return;
    raf = requestAnimationFrame(frame);
    if (now - last < 32) return;                          // about 30 frames a second
    last = now;
    clock = (now - t0) / 1000;
    tiltX = lerp(tiltX, aimX, 0.06); tiltY = lerp(tiltY, aimY, 0.06);
    if (touch && !touching) { touch.k -= 0.05; if (touch.k <= 0) touch = null; }
    draw(clock);
  };
  const run = () => { if (!fixed && !raf && visible && !paused && !document.hidden && W) raf = requestAnimationFrame(frame); };
  const still = () => draw(fixed ? 0 : clock);

  if (size()) still();
  new ResizeObserver(() => { if (size()) { still(); run(); } }).observe(stage);

  if (!fixed) {
    // the live portrait takes over from the still picture once its frames are in
    if (px) loadFrames().then(a => { tones = a; stage.classList.add('is-live'); still(); }).catch(() => {});

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
      ptr = inside ? { x, y } : null;
      aimX = inside ? clamp((x / box.width - 0.5) * 2, -1, 1) : 0;
      aimY = inside ? clamp((y / box.height - 0.5) * 2, -1, 1) : 0;
      if (paused) { tiltX = aimX; tiltY = aimY; still(); }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { ptr = null; aimX = aimY = 0; });

    // a finger on the portrait lights the dots under it while it rests or drags, then they fade; the page still
    // scrolls as usual (a scroll that starts on the portrait cancels the touch)
    const touchAt = e => { const b = stage.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top, k: 1 }; };
    stage.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') return; touching = true; touch = touchAt(e); if (paused) still(); }, { passive: true });
    stage.addEventListener('pointermove', e => { if (e.pointerType === 'touch' && touching) touch = touchAt(e); }, { passive: true });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) stage.addEventListener(ev, e => { if (e.pointerType === 'touch') touching = false; }, { passive: true });

    if (pauseButton) {
      stage.append(pauseButton(() => {
        paused = !paused;
        if (paused) { cancelAnimationFrame(raf); raf = 0; } else { t0 = performance.now() - clock * 1000; run(); }
        return paused;
      }, orbitsOn ? 'the portrait and orbit animation' : 'the portrait animation'));
    }
    run();
  }
  return { pause() { paused = true; }, resume() { paused = false; run(); } };
}
