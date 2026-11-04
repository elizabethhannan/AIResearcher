// background dots - 2 motion ("Thought forming") · Ellie Epp · 2026
// A row of points along a baseline. Each new point looks back at every earlier point,
// draws attention curves to them, picks the strongest three, and links to them with arcs.
// Install: add a canvas with id "living-bg", then load this file after it.
// Colors come from CSS variables: --accent-2 (mint), --accent (cream), --wip-text (lavender).
// Strength comes from --bg-alpha. Pauses when hidden; shows a still frame under reduced motion.
(function () {
  const canvas = document.getElementById("living-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let C, W = 0, H = 0, L = 0, dpr = 1, k = 1, base = 0, running = true, raf = 0, last = 0;
  // Optional vertical layout: <canvas data-orient="vertical" data-anchor="#profile h2" data-offset="-3">
  // puts the row of points in a column, offset px from the anchor's left edge; arcs reach right.
  const vertical = canvas.dataset.orient === "vertical";
  function baseX() {
    if (window.innerWidth < 820) return 8; // phones: keep the column at the screen edge, clear of the text
    const el = canvas.dataset.anchor && document.querySelector(canvas.dataset.anchor);
    const off = parseFloat(canvas.dataset.offset || "0");
    return (el ? el.getBoundingClientRect().left : 40) + off;
  }
  // Optional: data-query-anchor="<selector>" data-query-gap="10" parks the new (forming) point
  // just below that element, aligned with its left edge.
  // Optional: data-start-anchor="<selector>" data-start-gap="10" starts the whole column
  // that many px below the bottom of that element; nothing draws above it.
  function startY() {
    if (!vertical || !canvas.dataset.startAnchor) return 0;
    const el = document.querySelector(canvas.dataset.startAnchor);
    return el ? el.getBoundingClientRect().bottom + parseFloat(canvas.dataset.startGap || "10") : 0;
  }
  let origin = 0;
  function queryAnchor() {
    if (!vertical || !canvas.dataset.queryAnchor) return null;
    const el = document.querySelector(canvas.dataset.queryAnchor);
    if (!el) return null;
    const r = el.getBoundingClientRect(), gap = parseFloat(canvas.dataset.queryGap || "10");
    return { y: r.bottom + gap, x: r.left + 4 * k };
  }

  function palette() {
    C = {
      mint: css("--accent-2") || "#3EE8C4",
      cream: css("--accent") || "#EFE6D2",
      lav: css("--wip-text") || "#B8A6FF",
      glow: "#E6FFF8",
      alpha: parseFloat(css("--bg-alpha")) || 0.3
    };
  }
  function rgba(hex, a) {
    const h = hex.replace("#", ""), v = h.length === 3 ? h.split("").map(c => c + c).join("") : h, n = parseInt(v, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
  }

  // ---- model (same logic as the "Thought forming" design) ----
  let seed = 21, toks = [], cur = null, scroll = 0, time = 0, step = 0, committed = false, sparked = false, p = 0.3;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const target = () => {
    const qa = queryAnchor();
    if (qa) { const cent = Math.max(0, (L - 1440 * k) / 2); return 80 + toks.length * 44 - (qa.y - cent) / k; }
    if (vertical && canvas.dataset.startAnchor) { const fit = Math.max(4, Math.floor((L / k - 40) / 44) - 2); return Math.max(0, toks.length - fit) * 44; }
    return Math.max(0, toks.length - 25) * 44;
  };
  function newStep() {
    const n = toks.length, start = Math.max(0, n - 40), arr = [];
    let max = 0;
    for (let i = start; i < n; i++) {
      const rec = 1 / (1 + (n - 1 - i) * 0.18);
      const s = rnd() * 1.1 + rec + toks[i].size * 0.08;
      const e = Math.exp(3.2 * s); arr.push({ i, e }); if (e > max) max = e;
    }
    arr.forEach(a => { a.w = a.e / max; });
    cur = { arr, top: [...arr].sort((a, b) => b.w - a.w).slice(0, 3), slot: n };
  }
  function commit() {
    toks.push({ size: 2.5 + rnd() * 3.5, heat: 1, links: cur.top.slice(0, 2).map(t => ({ to: t.i, w: t.w })) });
  }
  function init() {
    seed = 21; toks = [];
    for (let i = 0; i < 6; i++) toks.push({ size: 3 + rnd() * 3, heat: 0, links: [] });
    for (let i = 0; i < 30; i++) { newStep(); commit(); }
    toks.forEach(t => { t.heat = 0; });
    scroll = target(); time = 0; step = 0; newStep(); committed = false; sparked = false;
  }
  // Speed: 1 = original design. 0.55 is calmer; set --bg-speed in CSS to change it.
  const speed = () => parseFloat(css("--bg-speed")) || 0.55;
  function advance(dt) {
    const T = 3.6, sp = speed(), f = (dt * sp) / 16.7;
    time += (dt / 1000) * sp;
    const s = Math.floor(time / T); p = time / T - s;
    if (s !== step) { step = s; newStep(); committed = false; sparked = false; }
    if (p >= 0.56 && !sparked) { sparked = true; cur.top.forEach(t => { toks[t.i].heat = 1; }); }
    if (p >= 0.72 && !committed) { commit(); committed = true; }
    toks.forEach(t => { t.heat *= Math.pow(0.985, f); });
    scroll += (target() - scroll) * (1 - Math.pow(0.97, f));
    if (toks.length > 400) { // keep memory bounded on long visits
      const drop = toks.length - 200;
      toks = toks.slice(drop).map(t => ({ ...t, links: t.links.map(l => ({ ...l, to: l.to - drop })).filter(l => l.to >= 0) }));
      cur.arr.forEach(a => a.i -= drop); cur.top.forEach(a => a.i -= drop); cur.slot -= drop; scroll -= drop * 44;
    }
  }

  // ---- drawing (artboard units: 44 per point, baseline at 760 of 900) ----
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    L = vertical ? H : W;
    k = vertical ? Math.max(H / 1440, 0.55) : Math.max(W / 1440, 0.55);
    base = vertical ? 0 : H * 0.86;
  }
  const X = i => (vertical && canvas.dataset.startAnchor) ? origin + (20 + i * 44 - scroll) * k : (80 + i * 44 - scroll) * k + Math.max(0, (L - 1440 * k) / 2);
  const Y = y => base - (760 - y) * k;

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    origin = startY();
    if (origin > 0) { L = H - origin; ctx.save(); ctx.beginPath(); ctx.rect(0, origin - 6, W, H); ctx.clip(); }
    // vertical: along-axis -> screen y, height above the line -> screen x to the right of the column
    if (vertical) ctx.setTransform(0, dpr, -dpr, 0, baseX() * dpr, 0);
    const A = C.alpha * 1.6, n = toks.length;
    ctx.lineCap = "round";
    // baseline
    ctx.strokeStyle = rgba(C.mint, 0.14 * A); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(L, base); ctx.stroke();
    // arcs from each point back to the points it chose
    for (let j = Math.max(0, n - 90); j < n; j++) {
      const age = n - 1 - j;
      for (const l of toks[j].links) {
        const xa = X(l.to), xb = X(j), rx = (xb - xa) / 2;
        if (rx <= 0) continue;
        const ry = Math.min(rx * 0.85, 560 * k);
        const col = j % 3 === 0 ? C.lav : j % 3 === 1 ? C.mint : C.cream;
        ctx.strokeStyle = rgba(col, (0.14 + 0.5 * l.w) * Math.max(0.12, 1 - age / 80) * A);
        ctx.beginPath(); ctx.ellipse(xa + rx, base, rx, ry, 0, Math.PI, 2 * Math.PI); ctx.stroke();
      }
    }
    // the new point looking back (attention curves)
    const qa = queryAnchor();
    const Q = { x: X(cur.slot), y: qa ? baseX() - qa.x : Y(420) };
    const env = p < 0.08 ? p / 0.08 : p < 0.6 ? 1 : p < 0.8 ? 1 - (p - 0.6) / 0.2 : 0;
    const curve = i => { const x = X(i); return [[x, base], [x, Y(640)], [Q.x - (Q.x - x) * 0.3, Q.y + 70 * k], [Q.x, Q.y]]; };
    if (env > 0) {
      ctx.lineWidth = 1.1;
      for (const a of cur.arr) {
        if (a.w < 0.04) continue;
        const P = curve(a.i);
        ctx.strokeStyle = rgba(C.mint, a.w * 0.8 * env * A);
        ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); ctx.bezierCurveTo(P[1][0], P[1][1], P[2][0], P[2][1], Q.x, Q.y); ctx.stroke();
      }
    }
    ctx.shadowColor = rgba(C.mint, 0.8 * A); ctx.shadowBlur = 7;
    // sparks travelling from the chosen points up to the new point
    if (p > 0.1 && p < 0.56) {
      const u = (p - 0.1) / 0.46, e = u * u * (3 - 2 * u), m = 1 - e, pal = [C.glow, C.lav, C.cream];
      cur.top.forEach((t, idx) => {
        const P = curve(t.i);
        const x = m * m * m * P[0][0] + 3 * m * m * e * P[1][0] + 3 * m * e * e * P[2][0] + e * e * e * P[3][0];
        const y = m * m * m * P[0][1] + 3 * m * m * e * P[1][1] + 3 * m * e * e * P[2][1] + e * e * e * P[3][1];
        ctx.fillStyle = rgba(pal[idx], A * 1.4); ctx.beginPath(); ctx.arc(x, y, 3.6 * k, 0, 2 * Math.PI); ctx.fill();
      });
    }
    // the drop: the new point settles onto the baseline
    if (p > 0.56 && p < 0.74) {
      const dy = Q.y + ((p - 0.56) / 0.18) * (base - Q.y);
      ctx.strokeStyle = rgba(C.glow, A * 1.4); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(Q.x, Q.y); ctx.lineTo(Q.x, dy); ctx.stroke();
    }
    const f = p > 0.54 && p < 0.76 ? (p - 0.54) / 0.22 : -1;
    if (f >= 0) { ctx.strokeStyle = rgba(C.glow, (1 - f) * A * 1.4); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(Q.x, Q.y, (6 + f * 30) * k, 0, 2 * Math.PI); ctx.stroke(); }
    ctx.fillStyle = rgba(C.glow, env * 0.9 * A * 1.4); ctx.beginPath(); ctx.arc(Q.x, Q.y, 4 * k, 0, 2 * Math.PI); ctx.fill();
    // the points on the baseline
    const bg = css("--bg") || "#0C1B33";
    for (let j = Math.max(0, n - 40); j < n; j++) {
      const t = toks[j], x = X(j);
      if (x < -20 || x > L + 20) continue;
      const fresh = j === n - 1 && committed, hot = t.heat > 0.3;
      const op = Math.min(1, 0.55 + t.heat) * A * 1.3;
      ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(hot ? C.glow : C.mint, op);
      ctx.fillStyle = fresh || t.heat > 0.5 ? rgba(C.glow, op) : bg;
      ctx.beginPath(); ctx.arc(x, base, (t.size * 0.75 + t.heat * 3.5) * k, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    if (origin > 0) ctx.restore();
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(50, now - (last || now)); last = now;
    advance(dt); draw(); raf = requestAnimationFrame(loop);
  }
  function start() {
    cancelAnimationFrame(raf); last = 0;
    if (reduce.matches || !running) { draw(); return; }
    raf = requestAnimationFrame(loop);
  }

  palette(); resize(); origin = startY(); if (origin > 0) L = H - origin; init();
  window.addEventListener("resize", () => { resize(); start(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else start(); });
  reduce.addEventListener && reduce.addEventListener("change", start);
  new MutationObserver(() => { palette(); start(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style"] });
  const btn = document.getElementById("motion-toggle");
  if (btn) btn.addEventListener("click", () => {
    running = !running;
    btn.textContent = running ? "Pause motion" : "Play motion";
    btn.setAttribute("aria-pressed", String(!running));
    start();
  });
  start();
})();
