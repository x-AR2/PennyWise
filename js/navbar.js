/**
 * PennyWise - Global Navigation Pill & Track Controller
 * Shared across index.html and all pages/*.html
 */
(function() {
  function initNavbar() {
    var rootEl = document.getElementById('pill-nav-root');
    if (!rootEl) return;

    var EO = 'cubic-bezier(0.22, 1, 0.36, 1)';
    var clamp = function(v, a, b) { return Math.min(b, Math.max(a, v)); };
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    var inP = location.pathname.includes('/pages/');
    var base = inP ? '' : 'pages/', rt = inP ? '../' : '';
    var items = [
      {label: 'Home', href: rt + 'index.html'},
      {label: 'Live Search', href: base + 'results.html'},
      {label: 'Deals', href: base + 'deals.html'},
      {label: 'Tickets', href: base + 'tickets.html'},
      {label: 'Compare', href: base + 'compare.html'},
      {label: 'Wishlist', href: base + 'wishlist.html'},
      {label: 'History', href: base + 'history.html'},
      {label: 'About', href: base + 'about.html'}
    ];

    var fn = location.pathname.split('/').pop() || 'index.html', active = items[0].href;
    items.forEach(function(it) {
      if (fn === it.href.split('/').pop()) active = it.href;
    });

    var ai = 0;
    for (var i = 0; i < items.length; i++) {
      if (items[i].href === active) {
        ai = i;
        break;
      }
    }

    var v = {
      '--pn-h': '48px', '--pn-pad': '4px', '--pn-inner': '40px', '--pn-x': '18px', '--pn-font': '14px', '--pn-gap': '8px', '--pn-mark': '24px',
      '--pn-surface': 'rgba(10,10,10,0)', '--pn-solid': '#0a0a0a', '--pn-edge': 'rgba(255,255,255,0.08)', '--pn-rim': 'rgba(255,255,255,0.07)',
      '--pn-shadow': 'none', '--pn-text': 'rgba(230,230,235,0.85)', '--pn-strong': '#ffffff',
      '--pn-pill': 'linear-gradient(180deg,#dbc091 0%,#c8a96e 100%)', '--pn-pill-ink': '#0a0a0a',
      '--pn-pill-shadow': 'inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px -4px rgba(200,169,110,0.5)',
      '--pn-dot': '#c8a96e', '--pn-ring': 'rgba(200,169,110,0.55)', '--pn-row-hover': 'rgba(255,255,255,0.06)',
      '--pn-tile': 'linear-gradient(180deg,#1e1e1e 0%,#141414 100%)',
      '--pn-tile-rim': 'inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 10px -4px rgba(0,0,0,0.6)',
      '--pn-blur': 'none'
    };
    Object.keys(v).forEach(function(k) { rootEl.style.setProperty(k, v[k]); });
    rootEl.className = 'pill-nav';
    rootEl.setAttribute('data-layout', 'split');
    rootEl.setAttribute('data-items', 'pill');

    var h = '<div class="pill-nav__bar pill-nav__surface"><div class="pill-nav__track" id="pn-track"><ul class="pill-nav__list">';
    items.forEach(function(it, idx) {
      var c = idx === ai ? ' aria-current="page"' : '';
      h += '<li class="pill-nav__slot"><a href="' + it.href + '" class="pill-nav__item"' + c + '><span class="pill-nav__fill" aria-hidden="true"></span><span class="pill-nav__face">' + it.label + '</span><span class="pill-nav__face-alt" aria-hidden="true">' + it.label + '</span></a></li>';
    });
    h += '</ul><span class="pill-nav__dot" id="pn-dot" aria-hidden="true"></span></div></div><div class="pill-nav__measure" aria-hidden="true"><div class="pill-nav__list" id="pn-ml">';
    items.forEach(function(it) { h += '<span class="pill-nav__ink-item">' + it.label + '</span>'; });
    h += '</div></div>';
    rootEl.innerHTML = h;

    var track = rootEl.querySelector('#pn-track'), dot = rootEl.querySelector('#pn-dot'), slots = rootEl.querySelectorAll('.pill-nav__slot');
    var rc = [], dx = 0, dv = 0, da = 0, ca = ai, raf = 0, last = 0;

    function measure() {
      slots.forEach(function(s, i) {
        rc[i] = { left: s.offsetLeft, width: s.offsetWidth };
        var r = Math.ceil(2 * Math.sqrt(Math.pow(s.offsetWidth / 2, 2) + Math.pow(s.offsetHeight, 2))) + 2;
        s.style.setProperty('--pn-fill', r + 'px');
      });
    }

    function getC() {
      var r = rc[ca];
      return r ? r.left + r.width / 2 : null;
    }

    function rdot() {
      var p = clamp(Math.abs(dv) / 700, 0, 2.2);
      dot.style.transform = 'translate3d(' + dx + 'px,0,0) scaleX(' + (1 + p) + ')';
      dot.style.opacity = '' + da;
    }

    function tick(now) {
      raf = 0;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      var busy = false, c = getC();
      if (c !== null) {
        if (da < 0.02) { dx = c; dv = 0; }
        if (!reduce) {
          var k = 360, z = 0.85, st = Math.ceil(dt / (1 / 240)), hh = dt / st;
          for (var i = 0; i < st; i++) {
            dv += (-k * (dx - c) - 2 * z * Math.sqrt(k) * dv) * hh;
            dx += dv * hh;
          }
        } else {
          dx = c;
          dv = 0;
        }
        da += (1 - da) * (reduce ? 1 : 1 - Math.exp(-dt / 0.1));
        if (Math.abs(dx - c) > 0.05 || Math.abs(dv) > 0.5 || da < 0.999) busy = true;
      } else {
        da += (0 - da) * (reduce ? 1 : 1 - Math.exp(-dt / 0.1));
        if (da > 0.002) busy = true; else da = 0;
      }
      rdot();
      if (busy) raf = requestAnimationFrame(tick);
    }

    function wake() {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    }

    slots.forEach(function(slot, idx) {
      slot.addEventListener('pointerenter', function(e) {
        if (e.pointerType === 'touch') return;
        slots.forEach(function(s, i) {
          s.toggleAttribute('data-lit', i === idx);
          s.toggleAttribute('data-hover', i === idx);
        });
      });
      slot.querySelector('.pill-nav__item').addEventListener('click', function() {
        ca = idx;
        slots.forEach(function(s, i) {
          var a = s.querySelector('.pill-nav__item');
          if (i === idx) a.setAttribute('aria-current', 'page');
          else a.removeAttribute('aria-current');
          s.toggleAttribute('data-on', i === idx);
        });
        wake();
      });
    });

    track.addEventListener('pointerleave', function() {
      slots.forEach(function(s) {
        s.removeAttribute('data-lit');
        s.removeAttribute('data-hover');
      });
    });

    if (slots[ai]) slots[ai].toggleAttribute('data-on', true);

    setTimeout(function() {
      measure();
      var c = getC();
      if (c !== null) { dx = c; da = 1; }
      rdot();
      wake();
      if (!reduce) {
        var bar = rootEl.querySelector('.pill-nav__bar');
        if (bar) {
          var bh = bar.offsetHeight;
          bar.animate([
            {clipPath: 'inset(0px ' + (Math.max(0, bar.offsetWidth - bh)) + 'px 0px 0px round ' + (bh / 2) + 'px)'},
            {clipPath: 'inset(0px 0px 0px 0px round ' + (bh / 2) + 'px)'}
          ], {duration: 760, delay: 90, easing: EO, fill: 'backwards'});
        }
        slots.forEach(function(s, i) {
          s.animate([
            {opacity: 0, transform: 'translateX(-8px)'},
            {opacity: 1, transform: 'translateX(0)'}
          ], {duration: 500, delay: 180 + i * 45, easing: EO, fill: 'backwards'});
        });
      }
    }, 50);

    if (window.ResizeObserver) new ResizeObserver(function() { measure(); wake(); }).observe(track);
  }

  if (document.getElementById('pill-nav-root')) {
    initNavbar();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
  }
})();
