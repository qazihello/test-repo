(function(){
  var nav=document.getElementById('nav'),links=document.getElementById('links'),burger=document.getElementById('burger');
  function onScroll(){nav.classList.toggle('solid',window.scrollY>40)}
  onScroll();window.addEventListener('scroll',onScroll,{passive:true});

  burger.addEventListener('click',function(){
    var o=links.classList.toggle('open');burger.setAttribute('aria-expanded',o);
  });
  links.addEventListener('click',function(e){
    if(e.target.tagName==='A'){links.classList.remove('open');burger.setAttribute('aria-expanded','false')}
  });

  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});

  var lang='fr';
  try{lang=localStorage.getItem('belimm-lang')||'fr'}catch(e){}
  function apply(l){
    document.documentElement.lang=l;
    document.querySelectorAll('[data-'+l+']').forEach(function(el){el.textContent=el.getAttribute('data-'+l)});
    try{localStorage.setItem('belimm-lang',l)}catch(e){}
  }
  apply(lang);
  document.getElementById('lang').addEventListener('click',function(){lang=lang==='fr'?'en':'fr';apply(lang)});

  document.getElementById('form').addEventListener('submit',function(e){
    e.preventDefault();document.getElementById('ok').hidden=false;this.reset();
  });
  document.getElementById('yr').textContent=new Date().getFullYear();
})();
