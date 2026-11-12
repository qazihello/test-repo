(function () {
  var $ = function (id) { return document.getElementById(id); };

  // theme
  $('themeBtn').addEventListener('click', function () {
    var cur = document.documentElement.dataset.theme ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
  $('yr').textContent = new Date().getFullYear();

  // reveal on scroll
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // word counter
  var wc = $('wcText');
  function fmtTime(s) { return s < 60 ? s + 's' : Math.floor(s / 60) + 'm ' + (s % 60) + 's'; }
  function count() {
    var t = wc.value, w = (t.trim().match(/\S+/g) || []).length;
    $('sWords').textContent = w.toLocaleString();
    $('sChars').textContent = t.length.toLocaleString();
    $('sSent').textContent = (t.match(/[^.!?]+[.!?]+(\s|$)/g) || (t.trim() ? [1] : [])).length;
    $('sRead').textContent = fmtTime(Math.round(w / 238 * 60));
  }
  wc.addEventListener('input', count); count();

  // citation generator
  var style = 'apa';
  document.querySelectorAll('.seg button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.seg button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on'); style = b.dataset.s; cite();
    });
  });
  function esc(s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function cite() {
    var a = $('cAuthor').value.trim(), t = $('cTitle').value.trim(), y = $('cYear').value.trim(),
        s = $('cSite').value.trim(), u = $('cUrl').value.trim();
    if (!a && !t) { $('cOut').textContent = 'Your citation appears here.'; return; }
    var out;
    if (style === 'apa') {
      out = [a && esc(a) + '.', '(' + (esc(y) || 'n.d.') + ').', t && '<i>' + esc(t) + '</i>.', s && esc(s) + '.', u && esc(u)].filter(Boolean).join(' ');
    } else {
      out = [a && esc(a) + '.', t && '“' + esc(t) + '.”', s && '<i>' + esc(s) + '</i>,', y && esc(y) + ',', u && esc(u) + '.'].filter(Boolean).join(' ');
    }
    $('cOut').innerHTML = out;
  }
  ['cAuthor', 'cTitle', 'cYear', 'cSite', 'cUrl'].forEach(function (id) { $(id).addEventListener('input', cite); });
  $('cCopy').addEventListener('click', function () {
    var btn = this, txt = $('cOut').textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () {
      btn.textContent = 'Copied ✓'; setTimeout(function () { btn.textContent = 'Copy citation'; }, 1600);
    }).catch(function () {});
  });

  // shop calculator
  function shop() {
    var p = parseFloat($('pPrice').value), d = parseFloat($('pDisc').value) || 0, x = parseFloat($('pTax').value) || 0;
    if (isNaN(p)) { $('pOut').textContent = '—'; $('pSave').textContent = 'Enter a price to start.'; return; }
    var after = p * (1 - d / 100), total = after * (1 + x / 100);
    $('pOut').textContent = total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    $('pSave').textContent = 'You save ' + (p - after).toFixed(2) + ' · tax ' + (total - after).toFixed(2);
  }
  ['pPrice', 'pDisc', 'pTax'].forEach(function (id) { $(id).addEventListener('input', shop); });
})();
