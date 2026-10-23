
class Component extends DCLogic {
  skyRef = React.createRef();
  layerClouds = React.createRef();
  layerHills = React.createRef();
  layerMid = React.createRef();
  layerClose = React.createRef();
  heroVideo = React.createRef();
  railRef = React.createRef();
  initRail() {
    const el = this.railRef.current; if (!el) return;
    let half = () => el.scrollWidth / 2;
    let pauseUntil = 0, dragging = false, startX = 0, startLeft = 0, last = performance.now();
    const wrap = () => { const hw = half(); if (el.scrollLeft >= hw) el.scrollLeft -= hw; else if (el.scrollLeft < 0) el.scrollLeft += hw; };
    const tick = (now) => {
      const dt = now - last; last = now;
      if (!dragging && !this._railStopped && now > pauseUntil && !this._reduced) { el.scrollLeft += dt * 0.045; }
      wrap(); this._railRaf = requestAnimationFrame(tick);
    };
    this._railRaf = requestAnimationFrame(tick);
    el.addEventListener('pointerdown', e => { dragging = true; startX = e.clientX; startLeft = el.scrollLeft; el.style.cursor = 'grabbing'; el.setPointerCapture(e.pointerId); });
    const end = () => { if (!dragging) return; dragging = false; el.style.cursor = 'grab'; pauseUntil = performance.now() + 2500; };
    el.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - startX; if (Math.abs(dx) > 8 && this._railTakeOver) this._railTakeOver(); el.scrollLeft = startLeft - dx; });
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('pointerleave', end);
    el.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { pauseUntil = performance.now() + 2500; } }, { passive: true });
    el.addEventListener('touchstart', () => { pauseUntil = performance.now() + 2500; }, { passive: true });
    this._railPause = () => { pauseUntil = performance.now() + 4000; };
    /* 5Four: first deliberate interaction stops the marquee and turns on snap */
    this._railTakeOver = () => {
      if (this._railStopped) return;
      this._railStopped = true;
    };

  }
  railStep(dir) {
    const el = this.railRef.current; if (!el) return;
    if (this._railPause) this._railPause();
    if (this._railTakeOver) this._railTakeOver();
    /* 5Four: snap to real card offsets rather than a fixed pixel step */
    const track = el.firstElementChild;
    const cards = track ? Array.from(track.children) : [];
    if (!cards.length) return;
    const padL = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const stops = cards.map((c) => c.offsetLeft - padL);
    let start = el.scrollLeft;
    let idx = 0;
    for (let i = 0; i < stops.length; i++) if (stops[i] <= start + 4) idx = i;
    let target = stops[Math.max(0, Math.min(stops.length - 1, idx + dir))];
    /* the track is duplicated for the infinite loop, so a position and that
       position minus half the track look identical — rebase instead of letting
       wrap() yank the animation mid-flight */
    const hw = el.scrollWidth / 2;
    if (target >= hw) { target -= hw; start -= hw; el.scrollLeft = start; }
    else if (target < 0) { target += hw; start += hw; el.scrollLeft = start; }
    const t0 = performance.now(), dur = 450;
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    const anim = (now) => { const p = Math.min(1, (now - t0) / dur); el.scrollLeft = start + (target - start) * ease(p); if (p < 1) requestAnimationFrame(anim); };
    requestAnimationFrame(anim);
  }
  loaderRef = React.createRef();
  navLinksRef = React.createRef();
  menuBtnRef = React.createRef();
  setMenu(open) {
    const el = this.navLinksRef.current, btn = this.menuBtnRef.current;
    if (el) el.classList.toggle('is-open', open);
    if (btn) { btn.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); }
    if (open && !this._menuDoc) {
      this._menuDoc = (ev) => { if (!el.contains(ev.target) && !(btn && btn.contains(ev.target))) this.setMenu(false); };
      setTimeout(() => document.addEventListener('pointerdown', this._menuDoc), 0);
    } else if (!open && this._menuDoc) { document.removeEventListener('pointerdown', this._menuDoc); this._menuDoc = null; }
  }
  toggleMenu = () => { const el = this.navLinksRef.current; this.setMenu(!(el && el.classList.contains('is-open'))); };
  closeMenu = () => this.setMenu(false);
  runLoader() {
    const el = this.loaderRef.current; if (!el) return;
    const seen = sessionStorage.getItem('pm-loaded') || new URLSearchParams(location.search).has('nopreload');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduced) { el.classList.add('is-gone'); return; }
    document.documentElement.style.overflow = 'hidden';
    const finish = () => {
      el.classList.add('is-out');
      setTimeout(() => { el.classList.add('is-gone'); document.documentElement.style.overflow = ''; sessionStorage.setItem('pm-loaded', '1'); }, 950);
    };
    let timerDone = false, videoDone = false;
    const tryFinish = () => { if (timerDone && videoDone) finish(); };
    setTimeout(() => { timerDone = true; tryFinish(); }, 3300);
    const v = this.heroVideo.current;
    if (v && v.readyState < 3) { v.addEventListener('canplay', () => { videoDone = true; tryFinish(); }, { once: true }); setTimeout(() => { videoDone = true; tryFinish(); }, 6000); }
    else { videoDone = true; }
  }
  componentDidMount() {
    this.runLoader();
    const v = this.heroVideo.current; if (v) { v.muted = true; v.defaultMuted = true; v.volume = 0; v.addEventListener('volumechange', () => { if (!v.muted) v.muted = true; });
      v.loop = true;
      v.addEventListener('timeupdate', () => { if (v.currentTime >= 34.7 && v.currentTime < 36.4) v.currentTime = 36.4; });
      v.play().catch(() => {}); }
    this._reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); this._io.unobserve(e.target); } }), { threshold: 0, rootMargin: "0px 0px -8% 0px" } /* 5Four: was 0.15 */);
    document.querySelectorAll('.pm-reveal').forEach(el => this._io.observe(el));
    this._mo = new MutationObserver(() => document.querySelectorAll('.pm-reveal:not(.is-in)').forEach(el => this._io.observe(el)));
    this._mo.observe(document.body, { childList: true, subtree: true });
    this.initRail();
    /* 5Four: Esc closes the menu and returns focus to the button (checklist §2, §10) */
    this._onKey = (e) => {
      if (e.key !== 'Escape') return;
      const el = this.navLinksRef.current;
      if (el && el.classList.contains('is-open')) { this.setMenu(false); const b = this.menuBtnRef.current; if (b) b.focus(); }
    };
    addEventListener('keydown', this._onKey);
    const railEl = this.railRef.current;
    if (railEl) {
      const revealRail = () => railEl.querySelectorAll('.pm-reveal').forEach((n) => n.classList.add('is-in'));
      const railIo = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { revealRail(); railIo.disconnect(); }
      }, { threshold: 0 });
      railIo.observe(railEl);
      /* belt and braces: if anything above goes wrong, never leave them blank */
      setTimeout(revealRail, 4000);
    }
    this._onScroll = () => { if (!this._raf) this._raf = requestAnimationFrame(() => { this._raf = 0; this.update(); }); };
    addEventListener('scroll', this._onScroll, { passive: true });
    addEventListener('resize', this._onScroll);
    this.update();
  }
  componentWillUnmount() { removeEventListener('keydown', this._onKey); removeEventListener('scroll', this._onScroll); removeEventListener('resize', this._onScroll); if (this._io) this._io.disconnect(); if (this._railRaf) cancelAnimationFrame(this._railRaf); }
  update() {
    const sky = this.skyRef.current; if (!sky || this._reduced) return;
    const r = sky.getBoundingClientRect(); const vh = innerHeight;
    // 0 when sky top enters viewport bottom, 1 when sky top reaches viewport top
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    const t = (p - 0.5) * 2; // -1..1
    const set = (ref, y) => { if (ref.current) ref.current.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`; };
    set(this.layerClouds, Math.max(0, t) * 30);
    set(this.layerHills, t * 40);
    set(this.layerMid, t * 25);
  }
  smoothTo(id) {
    return (e) => {
      const el = document.getElementById(id); if (!el) return;
      e.preventDefault(); this.closeMenu();
      let target = 0; for (let n = el; n; n = n.offsetParent) target += n.offsetTop; /* 5Four: was getBoundingClientRect, which includes the reveal transform */
      if (el.classList.contains('pm-reveal')) el.classList.add('is-in');
      el.querySelectorAll('.pm-reveal').forEach((n) => n.classList.add('is-in'));
      const start = scrollY, t0 = performance.now(), dur = 700;
      const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const step = (now) => { const p = Math.min(1, (now - t0) / dur); scrollTo(0, start + (target - start) * ease(p)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
  }
  renderVals() {
    return { loaderRef: this.loaderRef, navLinksRef: this.navLinksRef, menuBtnRef: this.menuBtnRef, toggleMenu: this.toggleMenu, scrollToTop: this.smoothTo('top'), scrollToStory: this.smoothTo('story'), scrollToGame: this.smoothTo('game'), scrollToPress: this.smoothTo('press'), scrollToContact: this.smoothTo('contact'), heroVideo: this.heroVideo, railRef: this.railRef, railPrev: () => this.railStep(-1), railNext: () => this.railStep(1), skyRef: this.skyRef, layerClouds: this.layerClouds, layerHills: this.layerHills, layerMid: this.layerMid, layerClose: this.layerClose };
  }
}
