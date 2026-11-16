(function () {
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };

  /* ---------- nav / menu / form (work without GSAP too) ---------- */
  var nav = $('.nav');
  function navState() { nav.classList.toggle('scrolled', window.scrollY > 40); }
  navState(); window.addEventListener('scroll', navState, { passive: true });

  var burger = $('.burger'), menu = $('#menu');
  function setMenu(o) { menu.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });

  var form = $('#contact-form'), note = $('.note', form);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    $$('[required]', form).forEach(function (f) {
      var bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle('bad', bad); if (bad) ok = false;
    });
    if (!ok) { note.style.color = '#ff7b7b'; note.textContent = 'Please fill in your name, a valid email and a message.'; return; }
    var v = function (n) { return form.elements[n].value.trim(); };
    var body = v('message') + '\n\n— ' + v('first') + ' ' + v('last') + '\n' + v('email') + (v('phone') ? '\n' + v('phone') : '');
    window.location.href = 'mailto:ericandersen@nextphasesoln.com?subject=' +
      encodeURIComponent('Website enquiry from ' + v('first') + ' ' + v('last')) + '&body=' + encodeURIComponent(body);
    note.style.color = ''; note.textContent = 'Thank you — your email app should open to send this message.';
  });
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- seismic wavefield canvas ---------- */
  var cv = $('#seismic'), ctx = cv.getContext('2d'), W, H, DPR, visible = true, pulses = [], t0 = performance.now();
  var mouse = { x: -999, y: -999 };
  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  size(); window.addEventListener('resize', size);
  function spawn(x, y) { pulses.push({ x: x, y: y, t: performance.now() }); if (pulses.length > 5) pulses.shift(); }
  spawn(W * 0.72, H * 0.4);
  var auto = setInterval(function () { if (visible) spawn(W * (0.55 + Math.random() * 0.35), H * (0.25 + Math.random() * 0.3)); }, 3800);
  cv.parentNode.addEventListener('pointerdown', function (e) { var r = cv.getBoundingClientRect(); spawn(e.clientX - r.left, e.clientY - r.top); });
  cv.parentNode.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  cv.parentNode.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; });
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(cv);

  var LINES = 17;
  function draw(now) {
    requestAnimationFrame(draw);
    if (!visible) return;
    var t = (now - t0) / 1000, maxR = Math.max(W, H) * 0.9;
    ctx.clearRect(0, 0, W, H);
    var step = W < 700 ? 10 : 6;
    for (var i = 0; i < LINES; i++) {
      var f = i / (LINES - 1), base = H * (0.34 + f * 0.74);
      var a = 0.1 + f * 0.5;
      ctx.beginPath();
      for (var x = -10; x <= W + 10; x += step) {
        var y = base + Math.sin(x * 0.004 + t * 0.35 + i * 0.5) * (12 + f * 20) + Math.sin(x * 0.011 - t * 0.2 + i) * 6;
        for (var p = 0; p < pulses.length; p++) {
          var pl = pulses[p], r = Math.max(0, (now - pl.t) * 0.22);
          if (r > maxR) continue;
          var dx = x - pl.x, dy = base - pl.y, dist = Math.sqrt(dx * dx + dy * dy);
          var k = Math.exp(-Math.pow((dist - r) / 46, 2)) * 22 * (1 - r / maxR);
          y -= k * Math.sin(dist * 0.06 - r * 0.06);
        }
        var m = Math.exp(-(Math.pow(x - mouse.x, 2) + Math.pow(base - mouse.y, 2)) / 9000) * 14;
        y -= m;
        if (x === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(' + (90 + (f * 40 | 0)) + ',' + (170 + (f * 30 | 0)) + ',255,' + a + ')';
      ctx.lineWidth = 1 + f * 0.9;
      ctx.stroke();
    }
    for (var q = 0; q < pulses.length; q++) {
      var pp = pulses[q], rr = Math.max(0, (now - pp.t) * 0.22);
      if (rr > maxR) continue;
      ctx.beginPath(); ctx.arc(pp.x, pp.y, rr, 0, 6.2832);
      ctx.strokeStyle = 'rgba(160,215,255,' + (0.32 * (1 - rr / maxR)) + ')'; ctx.lineWidth = 1.2; ctx.stroke();
    }
  }
  if (!reduce) requestAnimationFrame(draw); else { pulses[0].t = performance.now() - 2500; draw(performance.now()); }


  /* ---------- 3D seismic cube (hero) ---------- */
  (function () {
    var cb = $('#cube'); if (!cb) return;
    var cx2 = cb.getContext('2d'), cw, ch, S, dpr, G = 38, D = 0.34, HM = 0.2, vis2 = true, mx = 0, tmx = 0;
    var hero = cb.parentNode;
    function fit() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = cb.clientWidth; ch = cb.clientHeight; cb.width = cw * dpr; cb.height = ch * dpr; cx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      S = cw * 0.565;
    }
    fit(); window.addEventListener('resize', fit);
    new IntersectionObserver(function (e) { vis2 = e[0].isIntersecting; }).observe(cb);
    hero.addEventListener('pointermove', function (e) { tmx = (e.clientX / window.innerWidth - 0.5) * 2; });
    function surf(x, y, t) {
      var z = 0.1 + 0.05 * (1 - x) + 0.03 * y
        + 0.032 * Math.sin(3.1 * x + 1.2 + t * 0.15) * Math.cos(2.5 * y + 0.4)
        + 0.02 * Math.sin(5.4 * x - 2.1 * y + t * 0.25) + 0.006 * Math.cos(8 * x + 4 * y - t * 0.2);
      var f1 = x * 0.82 + y * 0.57 - 0.72, f2 = x * 0.3 - y * 0.95 + 0.22;
      z -= 0.07 / (1 + Math.exp(-f1 * 70)); z += 0.045 / (1 + Math.exp(-f2 * 70));
      return z;
    }
    function P(x, y, z, sh) { return [cw / 2 + (x - y) * 0.866 * S + (z + D) * sh, (HM + 0.02) * S + (x + y) * 0.5 * S - z * S]; }
    var wells = [[0.3, 0.38], [0.62, 0.55], [0.46, 0.2]];
    function render(now) {
      var t = now / 1000; mx += (tmx - mx) * 0.05; var sh = mx * 0.1 * S;
      cx2.clearRect(0, 0, cw, ch);
      var hg = [], i, j, zmin = 9, zmax = -9;
      for (i = 0; i <= G; i++) { hg[i] = []; for (j = 0; j <= G; j++) { var z = surf(i / G, j / G, t); hg[i][j] = z; if (z < zmin) zmin = z; if (z > zmax) zmax = z; } }
      // faces first (they sit under the surface in screen space)
      function face(edge) { // edge: 'L' = y=1 face, 'R' = x=1 face
        var pts = [], u, k, K = 15;
        function E(uu, zz) { return edge === 'L' ? P(uu, 1, zz, sh) : P(1, uu, zz, sh); }
        function sz(uu) { return edge === 'L' ? surf(uu, 1, t) : surf(1, uu, t); }
        cx2.beginPath();
        for (u = 0; u <= G; u++) { var p = E(edge === 'L' ? u / G : u / G, hg[edge === 'L' ? u : G][edge === 'L' ? G : u]); u ? cx2.lineTo(p[0], p[1]) : cx2.moveTo(p[0], p[1]); }
        var pb1 = E(1, -D), pb0 = E(0, -D);
        cx2.lineTo(pb1[0], pb1[1]); cx2.lineTo(pb0[0], pb0[1]); cx2.closePath();
        var g = cx2.createLinearGradient(0, E(0.5, 0.2)[1], 0, pb0[1]);
        g.addColorStop(0, edge === 'L' ? '#17335a' : '#102a4d'); g.addColorStop(1, edge === 'L' ? '#071428' : '#050f20');
        cx2.fillStyle = g; cx2.fill();
        cx2.save(); cx2.clip();
        for (k = 1; k <= K; k++) {
          var fk = k / (K + 1);
          cx2.beginPath();
          for (u = 0; u <= G * 2; u++) {
            var uu = u / (G * 2), zz = sz(uu) * (1 - fk) * 0.92 - D * fk + 0.012 * Math.sin(uu * 24 + k * 1.7 + t * 0.4);
            var q = E(uu, zz); u ? cx2.lineTo(q[0], q[1]) : cx2.moveTo(q[0], q[1]);
          }
          cx2.strokeStyle = 'rgba(' + (120 + k * 4) + ',' + (190 + k * 2) + ',255,' + (k % 4 === 0 ? 0.5 : 0.18) + ')';
          cx2.lineWidth = k % 4 === 0 ? 1.4 : 0.9; cx2.stroke();
        }
        cx2.restore();
      }
      face('L'); face('R');
      // top surface, back to front
      var sc = (t * 0.22) % 1.3 - 0.15, s, a, b;
      for (s = 0; s < 2 * G - 1; s++) {
        for (i = Math.max(0, s - G + 1); i <= Math.min(s, G - 1); i++) {
          j = s - i;
          var z0 = hg[i][j], z1 = hg[i + 1][j], z2 = hg[i + 1][j + 1], z3 = hg[i][j + 1];
          var zm = (z0 + z1 + z2 + z3) / 4, tt = (zm - zmin) / (zmax - zmin);
          var slope = (z0 - z2) * 6;
          var xm = (i + 0.5) / G, ym = (j + 0.5) / G;
          var scan = Math.max(0, 1 - Math.abs(xm * 0.55 + ym * 0.45 - sc) / 0.05) * 22;
          var hue = 250 - tt * 250, L = 40 + tt * 12 + slope * 6 + scan;
          cx2.fillStyle = 'hsl(' + hue + ',80%,' + Math.max(18, Math.min(78, L)) + '%)';
          var p0 = P(i / G, j / G, z0, sh), p1 = P((i + 1) / G, j / G, z1, sh), p2 = P((i + 1) / G, (j + 1) / G, z2, sh), p3 = P(i / G, (j + 1) / G, z3, sh);
          cx2.beginPath(); cx2.moveTo(p0[0], p0[1]); cx2.lineTo(p1[0], p1[1]); cx2.lineTo(p2[0], p2[1]); cx2.lineTo(p3[0], p3[1]); cx2.closePath();
          cx2.fill(); cx2.strokeStyle = cx2.fillStyle; cx2.lineWidth = 0.6; cx2.stroke();
        }
      }
      // contour lines on the surface
      cx2.lineWidth = 0.7; cx2.strokeStyle = 'rgba(255,255,255,.16)';
      for (var c = 1; c < 9; c++) {
        var lvl = zmin + (zmax - zmin) * c / 9; cx2.beginPath();
        for (i = 0; i < G; i++) for (j = 0; j < G; j++) {
          var v0 = hg[i][j] - lvl, v1 = hg[i + 1][j] - lvl, v3 = hg[i][j + 1] - lvl;
          if (v0 * v1 < 0) { var f = v0 / (v0 - v1), q1 = P((i + f) / G, j / G, lvl, sh), q2 = P((i + f) / G, (j + 1) / G, lvl, sh); cx2.moveTo(q1[0], q1[1]); cx2.lineTo(q2[0], q2[1]); }
          if (v0 * v3 < 0) { var g2 = v0 / (v0 - v3), r1 = P(i / G, (j + g2) / G, lvl, sh), r2 = P((i + 1) / G, (j + g2) / G, lvl, sh); cx2.moveTo(r1[0], r1[1]); cx2.lineTo(r2[0], r2[1]); }
        }
        cx2.stroke();
      }
      // cube edges
      var c0 = P(0, 1, surf(0, 1, t), sh), c1 = P(1, 1, surf(1, 1, t), sh), c2 = P(1, 0, surf(1, 0, t), sh);
      var b0 = P(0, 1, -D, sh), b1 = P(1, 1, -D, sh), b2 = P(1, 0, -D, sh);
      cx2.strokeStyle = 'rgba(180,220,255,.55)'; cx2.lineWidth = 1.2; cx2.beginPath();
      cx2.moveTo(c0[0], c0[1]); cx2.lineTo(b0[0], b0[1]); cx2.lineTo(b1[0], b1[1]); cx2.lineTo(b2[0], b2[1]); cx2.lineTo(c2[0], c2[1]);
      cx2.moveTo(c1[0], c1[1]); cx2.lineTo(b1[0], b1[1]); cx2.stroke();
      // wells with pulsing beads
      wells.forEach(function (w, n) {
        var wz = surf(w[0], w[1], t), top = P(w[0], w[1], wz, sh), up = P(w[0], w[1], wz + 0.12, sh);
        var g = cx2.createLinearGradient(0, up[1], 0, top[1]);
        g.addColorStop(0, 'rgba(160,220,255,0)'); g.addColorStop(1, 'rgba(160,220,255,.95)');
        cx2.strokeStyle = g; cx2.lineWidth = 1.6; cx2.beginPath(); cx2.moveTo(up[0], up[1]); cx2.lineTo(top[0], top[1]); cx2.stroke();
        var ph = (t * 0.5 + n * 0.33) % 1, by = up[1] + (top[1] - up[1]) * ph;
        cx2.fillStyle = 'rgba(255,255,255,' + (1 - ph) + ')'; cx2.beginPath(); cx2.arc(top[0], by, 2.6, 0, 6.2832); cx2.fill();
        cx2.fillStyle = 'rgba(120,200,255,.9)'; cx2.beginPath(); cx2.arc(top[0], top[1], 3.2, 0, 6.2832); cx2.fill();
      });
    }
    function loop(now) { requestAnimationFrame(loop); if (vis2) render(now); }
    if (reduce) render(6000); else requestAnimationFrame(loop);
  })();

  /* ---------- GSAP scroll experience ---------- */
  if (!window.gsap || !window.ScrollTrigger) return;
  root.classList.add('gs');
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  // cursor glow
  var glow = $('.glow');
  if (matchMedia('(pointer:fine)').matches) {
    var gx = gsap.quickTo(glow, 'x', { duration: .6, ease: 'power3' }), gy = gsap.quickTo(glow, 'y', { duration: .6, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { glow.style.opacity = 1; gx(e.clientX); gy(e.clientY); });
  }

  // background colour descends with scroll
  gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: true } })
    .to('.bg', { backgroundColor: '#082a52', ease: 'none' })
    .to('.bg', { backgroundColor: '#051a35', ease: 'none' })
    .to('.bg', { backgroundColor: '#030c19', ease: 'none' });
  gsap.to('.strata', { y: '-12%', ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: true } });

  // progress bar + depth gauge
  var depthEl = $('#depth'), layerEl = $('#layer'), dot = $('.g-dot'), fill = $('.g-fill'), bar = $('.progress i');
  var track = $('.g-track');
  ScrollTrigger.create({
    start: 0, end: 'max', onUpdate: function (s) {
      var p = s.progress;
      bar.style.transform = 'scaleX(' + p + ')';
      fill.style.transform = 'scaleY(' + p + ')';
      dot.style.top = (p * 100) + '%';
      depthEl.textContent = Math.round(p * 4500).toLocaleString('en-US');
    }
  });
  $$('[data-layer]').forEach(function (s) {
    ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: function (self) { if (self.isActive) layerEl.textContent = s.dataset.layer; } });
  });

  // hero intro
  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true"><i>' + w + '</i></span>'; }).join(' ');
    return $$('.w i', el);
  }
  var h1w = splitWords($('.hero h1')), subw = splitWords($('.h1-sub'));
  gsap.timeline({ delay: .2 })
    .from('.hero .eyebrow', { opacity: 0, x: -20, duration: .8, ease: 'power3.out' })
    .to(h1w, { y: 0, duration: 1.1, stagger: .07, ease: 'expo.out' }, '-=.4')
    .to(subw, { y: 0, duration: 1, stagger: .07, ease: 'expo.out' }, '-=.7')
    .from('.hero .lead', { opacity: 0, y: 20, duration: .9, ease: 'power3.out' }, '-=.6')
    .from('.cue', { opacity: 0, duration: 1 }, '-=.4');
  gsap.to('.hero-inner', { yPercent: -14, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // vision: words light up as you scroll
  var st = $('.statement');
  st.setAttribute('aria-label', st.textContent.trim());
  st.innerHTML = st.textContent.trim().split(/\s+/).map(function (w) { return '<span class="wd" aria-hidden="true">' + w + '</span>'; }).join(' ');
  gsap.to($$('.wd', st), { opacity: 1, stagger: .5, ease: 'none', scrollTrigger: { trigger: st, start: 'top 78%', end: 'bottom 55%', scrub: true } });

  // generic reveals
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%', once: true,
    onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: .12, ease: 'power3.out' }); }
  });

  // counters
  $$('[data-count]').forEach(function (el) {
    var target = +el.dataset.count, plain = el.hasAttribute('data-plain'), o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
      gsap.to(o, { v: target, duration: 1.8, ease: 'power2.out', onUpdate: function () { el.textContent = plain ? Math.round(o.v) : Math.round(o.v); } });
    } });
  });

  // pinned story
  var steps = $$('.step'), dots = $$('.dots li');
  gsap.set(steps, { autoAlpha: 0, y: 40 }); gsap.set(steps[0], { autoAlpha: 1, y: 0 });
  dots[0].classList.add('on');
  mm.add('(min-width: 901px)', function () {
    var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: '.story', start: 'top top', end: '+=200%', pin: true, scrub: .6, anticipatePin: 1 } });
    steps.forEach(function (s, i) {
      if (i === 0) { tl.to({}, { duration: .4 }); return; }
      var at = '>';
      tl.to(steps[i - 1], { autoAlpha: 0, y: -40, duration: .6 }, at)
        .call(function () { dots.forEach(function (x, k) { x.classList.toggle('on', k === i); }); }, null, '<.3')
        .to(s, { autoAlpha: 1, y: 0, duration: .6 }, '<.15')
        .to({}, { duration: .5 });
    });
  });
  mm.add('(max-width: 900px)', function () {
    gsap.set(steps, { autoAlpha: 1, y: 0, clearProps: 'all' });
    $('.steps').style.cssText = 'display:grid;gap:34px';
    steps.forEach(function (s) { s.style.gridArea = 'auto'; });
    $('.dots').style.display = 'none';
    return function () { $('.steps').style.cssText = ''; steps.forEach(function (s) { s.style.gridArea = ''; }); $('.dots').style.display = ''; };
  });

  // portrait parallax
  gsap.fromTo('.frame img', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.portrait', start: 'top bottom', end: 'bottom top', scrub: true } });

  // big headings: soft rise
  $$('.mega, .mega-h').forEach(function (h) {
    gsap.from(h, { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
