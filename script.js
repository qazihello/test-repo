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
