// Deterministic motion engine for the Vocare showcase films.
// Every frame is a pure function of time `t` (seconds), so the renderer can
// seek to any frame and get the exact same image (no rAF drift, no dropped frames).

(function () {
  // ---------- easing (cubic-bezier solver) ----------
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const err = sx(t) - x;
        if (Math.abs(err) < 1e-6) break;
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= err / d;
      }
      let lo = 0, hi = 1;
      if (Math.abs(sx(t) - x) > 1e-5) {
        t = x;
        while (hi - lo > 1e-6) {
          sx(t) < x ? (lo = t) : (hi = t);
          t = (lo + hi) / 2;
        }
      }
      return sy(t);
    };
  }

  // Motion tokens. Entrances decelerate (ease-out), on-screen moves and camera
  // pushes use ease-in-out, exits accelerate and run shorter than entrances.
  const ease = {
    linear: (x) => x,
    outQuart: bezier(0.165, 0.84, 0.44, 1),
    outQuint: bezier(0.23, 1, 0.32, 1),
    outExpo: bezier(0.19, 1, 0.22, 1),
    inQuart: bezier(0.895, 0.03, 0.685, 0.22),
    inOutCubic: bezier(0.645, 0.045, 0.355, 1),
    inOutQuart: bezier(0.77, 0, 0.175, 1),
    inOutQuint: bezier(0.86, 0, 0.07, 1),
  };

  const dur = { reveal: 1.1, enter: 0.9, morph: 1.2, exit: 0.5, stagger: 0.07 };

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, start, d, e = ease.outQuart) => e(clamp((t - start) / d));

  // ---------- styling ----------
  function apply(el, { o = 1, x = 0, y = 0, s = 1, sx, sy, r = 0, blur = 0 } = {}) {
    el.style.opacity = clamp(o).toFixed(4);
    const scale = sx != null || sy != null ? `scale(${sx ?? s}, ${sy ?? s})` : `scale(${s})`;
    el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) ${scale} rotate(${r}deg)`;
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
    el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
  }

  // Generic enter/exit: blur-to-sharp rise in, soft lift + blur out.
  function show(el, t, { at, out = Infinity, d = dur.enter, outD = dur.exit, y = 40, blur = 14, s = 0.97, outY = -24, outS = 1.02, outBlur = 12, e = ease.outExpo } = {}) {
    const k = prog(t, at, d, e);
    const q = prog(t, out, outD, ease.inOutCubic);
    apply(el, {
      o: k * (1 - q),
      y: (1 - k) * y + q * outY,
      s: lerp(s, 1, k) * lerp(1, outS, q),
      blur: (1 - k) * blur + q * outBlur,
    });
    return k * (1 - q);
  }

  // Split a headline into word spans once; returns the spans.
  function split(el) {
    if (el._words) return el._words;
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = lines
      .map((line) =>
        line
          .trim()
          .split(/\s+/)
          .map((w) => `<span class="w">${w}</span>`)
          .join(' ')
      )
      .join('<br>');
    el._words = [...el.querySelectorAll('.w')];
    // gradient headlines: give every word a slice of one shared gradient
    if (el.classList.contains('grad')) {
      const box = el.getBoundingClientRect();
      const k = el.offsetWidth / box.width; // undo any ancestor scale
      el._words.forEach((w) => {
        w.style.backgroundSize = `${el.offsetWidth}px 100%`;
        w.style.backgroundPosition = `${-(w.getBoundingClientRect().left - box.left) * k}px 0`;
      });
    }
    return el._words;
  }

  // Word-by-word reveal, the signature move of every headline.
  function words(el, t, { at, out = Infinity, stagger = dur.stagger, d = dur.reveal, y = 56, blur = 16 } = {}) {
    const ws = split(el);
    el.style.visibility = t < at - 0.01 || t > out + dur.exit + ws.length * 0.03 + 0.1 ? 'hidden' : 'visible';
    ws.forEach((w, i) => {
      const k = prog(t, at + i * stagger, d, ease.outExpo);
      const q = prog(t, out + i * 0.03, dur.exit, ease.inOutCubic);
      apply(w, { o: k * (1 - q), y: (1 - k) * y - q * 28, blur: (1 - k) * blur + q * 12 });
    });
  }

  // Polish-style grouped number (always grouped, non-breaking thin space).
  function fmt(n, decimals = 0) {
    const s = Math.abs(n).toFixed(decimals);
    const [i, f] = s.split('.');
    const g = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (n < 0 ? '−' : '') + g + (f ? ',' + f : '');
  }

  function count(el, t, { at, d = 1.6, from = 0, to, decimals = 0, e = ease.outExpo, suffix = '' }) {
    const v = lerp(from, to, prog(t, at, d, e));
    el.textContent = fmt(v, decimals) + suffix;
  }

  // ---------- ambient background ----------
  function ambient(t) {
    const a = document.querySelector('.glow-a');
    const b = document.querySelector('.glow-b');
    if (a) a.style.transform = `translate3d(${Math.sin(t * 0.35) * 120}px, ${Math.cos(t * 0.28) * 160}px, 0) scale(${1 + Math.sin(t * 0.5) * 0.06})`;
    if (b) b.style.transform = `translate3d(${Math.cos(t * 0.3) * 140}px, ${Math.sin(t * 0.22) * 120}px, 0)`;
  }

  // ---------- shared outro ----------
  // Feature name, logo mask-reveal, tagline and URL. Same choreography in all 4 films.
  function outro(t, at) {
    const root = document.querySelector('.outro');
    if (!root) return;
    root.style.visibility = t < at - 0.05 ? 'hidden' : 'visible';
    show(root.querySelector('.outro-eyebrow'), t, { at: at, y: 24 });
    words(root.querySelector('.outro-title'), t, { at: at + 0.15 });
    const logo = root.querySelector('.outro-logo');
    const k = prog(t, at + 0.9, 1.2, ease.outExpo);
    logo.style.clipPath = `inset(0 ${(1 - k) * 100}% 0 0)`;
    apply(logo, { o: Math.min(1, k * 2), x: (1 - k) * -30, blur: (1 - k) * 8 });
    show(root.querySelector('.outro-tag'), t, { at: at + 1.35 });
    show(root.querySelector('.outro-url'), t, { at: at + 1.6, y: 16 });
    const line = root.querySelector('.outro-line');
    line.style.transform = `scaleX(${prog(t, at + 1.1, 1.4, ease.inOutQuart)})`;
  }

  // ---------- runtime ----------
  function run({ duration, render }) {
    const fit = () => {
      const s = Math.min(window.innerWidth / 1080, window.innerHeight / 1920);
      document.documentElement.style.setProperty('--fit', s);
    };
    window.addEventListener('resize', fit);
    fit();

    const frame = (t) => {
      ambient(t);
      render(t);
    };
    window.__duration = duration;
    window.__seek = (t) => frame(t);

    const params = new URLSearchParams(location.search);
    if (params.has('render')) {
      document.documentElement.classList.add('render');
      frame(0);
      return;
    }
    // Preview: loop in real time. ?t=5.2 freezes a frame for inspection.
    if (params.has('t')) return frame(parseFloat(params.get('t')));
    let t0 = performance.now();
    const loop = (now) => {
      const t = ((now - t0) / 1000) % (duration + 0.8);
      frame(Math.min(t, duration));
      requestAnimationFrame(loop);
    };
    document.fonts.ready.then(() => {
      t0 = performance.now();
      requestAnimationFrame(loop);
    });
  }

  window.M = { ease, dur, clamp, lerp, prog, apply, show, split, words, fmt, count, outro, run };
})();
