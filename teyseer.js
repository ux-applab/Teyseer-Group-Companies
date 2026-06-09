/* ============================================================
   TEYSEER — Shared page interactions
   - Reading progress bar
   - Reveal-on-scroll (with safety net + initial-viewport sweep)
   - Active anchor highlighting (scroll-spy)
   - Back-to-top button
   - Counter animation
   ============================================================ */

// Mark <html> as JS-enabled so progressive-enhancement CSS kicks in.
// Done at script start, before DOMContentLoaded, to avoid flash.
document.documentElement.classList.add('js');

(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    // ---------- Progress bar ----------
    var fill = document.getElementById('progressFill');
    function progress() {
      if (!fill) return;
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      fill.style.width = p + '%';
    }
    document.addEventListener('scroll', progress, { passive: true });
    progress();

    // ---------- Reveal-on-scroll ----------
    var reveals = document.querySelectorAll('.reveal');

    // Immediate sweep: anything inside (or above) the initial viewport
    // gets revealed right away. Covers hero/first-section reliably even
    // if IntersectionObserver init is delayed inside an iframe.
    function inInitialView(el) {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      return r.top < vh * 0.95;
    }
    function sweepInitial() {
      reveals.forEach(function (el) {
        if (inInitialView(el)) el.classList.add('is-in');
      });
    }
    sweepInitial();
    requestAnimationFrame(sweepInitial);

    // Then observe the rest for as-you-scroll reveals
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(function (el) {
        if (!el.classList.contains('is-in')) io.observe(el);
      });
    } else {
      // No IO — reveal everything.
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    }

    // Safety net: anything still hidden after 1.2s gets revealed.
    setTimeout(function () {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    }, 1200);

    // ---------- Anchor scroll-spy ----------
    var links = Array.from(document.querySelectorAll('.anchornav a'));
    var sections = links.map(function (l) {
      var id = l.getAttribute('href');
      return id && id.charAt(0) === '#' ? document.getElementById(id.slice(1)) : null;
    });
    function spy() {
      var y = window.scrollY + 120;
      var idx = 0;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i] && sections[i].offsetTop <= y) idx = i;
      }
      links.forEach(function (l, i) { l.classList.toggle('active', i === idx); });
    }
    document.addEventListener('scroll', spy, { passive: true });
    spy();

    // ---------- Back-to-top ----------
    var top = document.getElementById('totop');
    if (top) {
      top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
      document.addEventListener('scroll', function () {
        top.classList.toggle('show', window.scrollY > 600);
      }, { passive: true });
    }

    // ---------- Counters ----------
    // Show final value immediately, then attempt an upgrade count-up
    // animation. Page reads correctly whether or not rAF ticks.
    var counters = document.querySelectorAll('.counter');
    function formatNum(n) {
      return (n >= 1000) ? Math.round(n).toLocaleString() : Math.round(n);
    }
    counters.forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-to')) || 0;
      // Set final value immediately so the number always reads correctly
      el.textContent = formatNum(to);
      el.dataset.finalValue = String(to);
    });

    function animateCounter(el) {
      if (el.dataset.animated === '1') return;
      el.dataset.animated = '1';
      var to = parseFloat(el.dataset.finalValue) || 0;
      var dur = 1400;
      var start = null;
      el.textContent = '0';
      function tick(ts) {
        if (!start) start = ts;
        var t = Math.min((ts - start) / dur, 1);
        var v = (1 - Math.pow(1 - t, 3)) * to; // ease-out cubic
        el.textContent = formatNum(v);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = formatNum(to); // ensure exact final value
        }
      }
      requestAnimationFrame(tick);
    }

    // Only attempt animation when document is fully visible — skip
    // entirely otherwise (avoids "stuck at 0" in throttled iframes).
    if (counters.length && 'IntersectionObserver' in window && document.visibilityState === 'visible') {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            animateCounter(e.target);
            cio.unobserve(e.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    }

    // Final safety net: after 2s anything still at "0" gets reset to final
    setTimeout(function () {
      counters.forEach(function (el) {
        if (el.textContent === '0') el.textContent = formatNum(parseFloat(el.dataset.finalValue) || 0);
      });
    }, 2000);
  });
})();


// Disable end-of-page placeholder CTAs (they should look like buttons but not navigate)
document.addEventListener('click', function (e) {
  var t = e.target.closest && e.target.closest('a[data-noop="true"]');
  if (t) { e.preventDefault(); }
}, true);
