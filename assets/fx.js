/* Thunder AI Labs scroll engine.
   A pinned scene reports progress 0..1 while it scrolls past. Elements are placed with keyframes:
   [[p,{o,x,y,s,r,b}], ...] where x, y and b (blur) are in u = 1% of the viewport's short side. */
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const D = { o: 1, x: 0, y: 0, s: 1, r: 0, b: 0 };
  const K = fr => { let prev = { ...D }; return fr.map(([p, v]) => (prev = { ...prev, ...v }, [p, prev])); };
  const at = (k, p) => {
    if (p <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (p <= k[i][0]) {
      const [a, va] = k[i - 1], [b, vb] = k[i], t = ease((p - a) / (b - a || 1)), o = {};
      for (const n in vb) o[n] = lerp(va[n], vb[n], t);
      return o;
    }
    return k[k.length - 1][1];
  };
  let u = 1;
  const put = (el, v) => {
    el.style.opacity = v.o;
    el.style.visibility = v.o < .01 ? 'hidden' : 'visible';
    el.style.transform = `translate(-50%,-50%) translate(${v.x * u}px,${v.y * u}px) scale(${v.s}) rotate(${v.r}deg)`;
    el.style.filter = v.b > .05 ? `blur(${v.b * u}px)` : '';
  };
  const anim = (el, fr) => { const k = K(fr); return p => put(el, at(k, p)); };
  const progress = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Headline words rise one after another as t goes 0..1. */
  const split = el => {
    if (el._w) return el._w;
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w"><span class="i">${w}</span></span>`).join(' ');
    return (el._w = [...el.querySelectorAll('.i')]);
  };
  const words = (el, t) => {
    const ws = split(el), n = ws.length;
    ws.forEach((w, i) => { const v = ease(clamp((t * (n + 1.5) - i) / 1.5)); w.style.transform = `translateY(${(1 - v) * 110}%)`; });
  };
  const type = (el, txt, t) => { const n = Math.round(txt.length * clamp(t)); if (el._n !== n) { el._n = n; el.textContent = txt.slice(0, n); } };
  const flag = (el, cls, on) => el.classList.toggle(cls, !!on);

  const list = [];
  let layout = { wide: true };
  const measure = () => {
    u = Math.min(innerWidth, innerHeight) / 100;
    document.documentElement.style.setProperty('--u', u + 'px');
    const wide = innerWidth / innerHeight > 1.15, hw = innerWidth / 2 / u, hh = innerHeight / 2 / u;
    document.documentElement.classList.toggle('wide', wide);
    layout = wide
      ? { wide, hw, hh, hx: -hw * .46, hy: 0, cx: hw * .43, cy: 0, k: Math.min(.74, hw * .0105) }
      : { wide, hw, hh, hx: 0, hy: -hh * .58, cx: 0, cy: hh * .33, k: Math.min(1, hh / 108) };
  };
  /* A scene plays by itself once it reaches the screen: its playhead runs on a clock (o.dur ms), and scrolling
     can only move it further ahead, never hold it back. Scroll back above it and it resets, so it plays again.
     fn(p, layout, e, t, sp): p = max(clock, scroll), e = how far it has come into view (also eased in on the clock),
     t = clock only, sp = scroll only. o.cap stops the clock part early, for scenes whose ending belongs to the scroll. */
  const scene = (el, fn, rest = 1, o = {}) => list.push({ el, fn, rest, dur: o.dur || 7000, cap: o.cap ?? 1, at: o.at ?? .5, on: false, t0: 0 });
  const run = now => {
    for (const s of list) {
      const r = s.el.getBoundingClientRect();
      if (r.top > innerHeight) s.on = false;
      if (r.bottom < -60 || r.top > innerHeight + 60) continue;
      if (!s.on && r.top < innerHeight * s.at) { s.on = true; s.t0 = now; }
      const t = s.on ? clamp((now - s.t0) / s.dur) : 0, sp = progress(s.el);
      const e = Math.max(clamp(1 - r.top / innerHeight), s.on ? clamp((now - s.t0) / 900) : 0);
      if (reduce) s.fn(s.rest, layout, 1, 1, sp);
      else s.fn(Math.max(Math.min(t, s.cap), sp), layout, e, t, sp);
    }
    if (!reduce) requestAnimationFrame(run);
  };
  const req = () => { if (reduce) run(performance.now()); };
  /* Place a group of elements (a composition) at the layout's composition spot. */
  const group = (g, L, dx = 0, dy = 0, ks = 1) => { g.style.transform = `translate(${(L.cx + dx) * u}px,${(L.cy + dy) * u}px) scale(${L.k * ks})`; };
  const head = (el, L, v) => put(el, { ...v, x: L.hx + (v.x || 0), y: L.hy + (v.y || 0) });

  measure();
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { measure(); req(); });
  document.documentElement.classList.toggle('rm', reduce);
  window.FX = { clamp, seg, ease, lerp, K, at, put, anim, progress, reduce, words, type, flag, scene, group, head, start: () => requestAnimationFrame(run), U: () => u, L: () => layout };
})();
