(function () {
  var d = document, root = d.documentElement;
  root.classList.add('js');

  // sticky nav shadow
  var nav = d.querySelector('.nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 10); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  // mobile menu
  var burger = d.querySelector('.burger'), menu = d.getElementById('menu');
  function setMenu(open) { menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });

  // reveal on scroll
  var items = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else items.forEach(function (el) { el.classList.add('in'); });

  // active link highlight
  var links = [].slice.call(d.querySelectorAll('.menu a:not(.cta)'));
  var secs = links.map(function (a) { return d.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { if (s) so.observe(s); });
  }

  // contact form -> opens visitor's mail client (no backend needed)
  var form = d.getElementById('contact-form'), note = form.querySelector('.note');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (f) {
      var bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle('bad', bad); if (bad) ok = false;
    });
    if (!ok) { note.style.color = '#d64545'; note.textContent = 'Please fill in your name, a valid email and a message.'; return; }
    var v = function (n) { return form.elements[n].value.trim(); };
    var body = v('message') + '\n\n— ' + v('first') + ' ' + v('last') + '\n' + v('email') + (v('phone') ? '\n' + v('phone') : '');
    window.location.href = 'mailto:ericandersen@nextphasesoln.com?subject=' +
      encodeURIComponent('Website enquiry from ' + v('first') + ' ' + v('last')) + '&body=' + encodeURIComponent(body);
    note.style.color = ''; note.textContent = 'Thank you — your email app should open to send this message.';
  });

  d.getElementById('yr').textContent = new Date().getFullYear();
})();
