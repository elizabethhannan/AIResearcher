// Living background: a human–agent network (HXO/AXO).
// Teal circles = people, navy/purple diamonds = agents. Links form when they are close;
// signals travel along links; a rare "ripcord" ring marks a run halted for audit (part of AXO).
// Install: add a canvas with id "living-bg" to the page, then load assets/living-bg.js after it.
// Respects prefers-reduced-motion (draws one still frame) and pauses when the tab is hidden.
(function () {
  const canvas = document.getElementById("living-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let W = 0, H = 0, dpr = 1, nodes = [], signals = [], rings = [], running = true, raf = 0;
  const mouse = { x: -9999, y: -9999 };

  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function palette() {
    return {
      human: css("--accent-2") || "#0f5c5c",
      agent: css("--accent") || "#1d3a6b",
      agent2: css("--wip-text") || "#4b2d7a",
      alpha: parseFloat(css("--bg-alpha")) || 0.22
    };
  }
  let P = palette();

  function hexA(hex, a) {
    const h = hex.replace("#", "");
    const v = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
    const n = parseInt(v, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(90, Math.round((W * H) / 16000));
    nodes = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      kind: i % 3 === 0 ? "human" : (i % 3 === 1 ? "agent" : "agent2"),
      r: i % 3 === 0 ? 3.4 : 2.9, phase: Math.random() * Math.PI * 2
    }));
    signals = []; rings = [];
  }

  const LINK = 150;
  function step(t) {
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      const dx = mouse.x - n.x, dy = mouse.y - n.y, d2 = dx * dx + dy * dy;
      if (d2 < 160 * 160) { n.vx += dx * 0.00002; n.vy += dy * 0.00002; }
      n.vx *= 0.999; n.vy *= 0.999;
      if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20; if (n.y > H + 20) n.y = -20;
    }
    if (Math.random() < 0.04 && nodes.length > 1) {
      const a = nodes[(Math.random() * nodes.length) | 0];
      let best = null, bd = LINK;
      for (const b of nodes) { if (b === a) continue; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < bd) { bd = d; best = b; } }
      if (best) signals.push({ a, b: best, p: 0 });
    }
    signals = signals.filter(s => (s.p += 0.012) < 1);
    if (Math.random() < 0.0025 && nodes.length) {
      const n = nodes[(Math.random() * nodes.length) | 0];
      rings.push({ x: n.x, y: n.y, r: 4, life: 1 });
    }
    rings = rings.filter(r => (r.r += 0.6, r.life -= 0.008) > 0);
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const A = P.alpha;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          const mix = a.kind === "human" || b.kind === "human" ? P.human : P.agent;
          ctx.strokeStyle = hexA(mix, A * 0.55 * (1 - d / LINK));
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (const s of signals) {
      const x = s.a.x + (s.b.x - s.a.x) * s.p, y = s.a.y + (s.b.y - s.a.y) * s.p;
      ctx.fillStyle = hexA(P.human, A * 2.4 * Math.sin(Math.PI * s.p));
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
    for (const n of nodes) {
      const pulse = 0.75 + 0.25 * Math.sin(t / 900 + n.phase);
      const col = P[n.kind];
      ctx.fillStyle = hexA(col, A * 2 * pulse);
      if (n.kind === "human") { ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill(); }
      else { const r = n.r + 0.6; ctx.beginPath(); ctx.moveTo(n.x, n.y - r); ctx.lineTo(n.x + r, n.y); ctx.lineTo(n.x, n.y + r); ctx.lineTo(n.x - r, n.y); ctx.closePath(); ctx.fill(); }
    }
    for (const r of rings) {
      ctx.strokeStyle = hexA(P.agent2, A * 2 * r.life); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function loop(t) { if (!running) return; step(t); draw(t); raf = requestAnimationFrame(loop); }
  function start() { cancelAnimationFrame(raf); if (reduce.matches || !running) { draw(0); return; } raf = requestAnimationFrame(loop); }

  window.addEventListener("resize", () => { resize(); start(); });
  window.addEventListener("pointermove", e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else start(); });
  reduce.addEventListener && reduce.addEventListener("change", start);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { P = palette(); start(); });
  new MutationObserver(() => { P = palette(); start(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style"] });

  const btn = document.getElementById("motion-toggle");
  if (btn) btn.addEventListener("click", () => {
    running = !running;
    btn.textContent = running ? "Pause motion" : "Play motion";
    btn.setAttribute("aria-pressed", String(!running));
    start();
  });

  resize(); start();
})();
