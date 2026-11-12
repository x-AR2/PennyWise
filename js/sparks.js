/**
 * PennyWise - Click Spark Cursor Effect
 * Shared across index.html and all pages/*.html
 */
(function(){
  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:99999;';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var bursts = [], raf = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  var easeOut = function(t){ return 1 - Math.pow(1 - t, 3); };
  var count = 8, size = 20, radius = 42, lineWidth = 2.5, duration = 520, color = '#ffffff';

  function spawn(x, y) {
    var sparks = [];
    var step = (Math.PI * 2) / count;
    for (var i = 0; i < count; i++) {
      var base = step * i;
      var jitter = (Math.random() - 0.5) * 0.2;
      sparks.push({
        angle: base + jitter * step * 0.9,
        reach: 1 + (Math.random() - 0.5) * 0.14,
        scale: 1 + (Math.random() - 0.5) * 0.16
      });
    }
    bursts.push({ x: x, y: y, start: performance.now(), sparks: sparks });
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    raf = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    for (var b = bursts.length - 1; b >= 0; b--) {
      var burst = bursts[b];
      var elapsed = now - burst.start;
      var p = elapsed / duration;
      if (p >= 1) { bursts.splice(b, 1); continue; }

      var e = easeOut(Math.min(1, Math.max(0, p)));
      var fade = 1 - Math.max(0, Math.min(1, (p - 0.55) / 0.45));
      var len = size * Math.pow(1 - p, 1.6);
      ctx.globalAlpha = Math.max(0, Math.min(1, fade));
      ctx.lineWidth = lineWidth;

      for (var i = 0; i < burst.sparks.length; i++) {
        var sp = burst.sparks[i];
        var dist = radius * sp.reach * e;
        var x1 = burst.x + Math.cos(sp.angle) * dist;
        var y1 = burst.y + Math.sin(sp.angle) * dist;
        var x2 = burst.x + Math.cos(sp.angle) * (dist + len * sp.scale);
        var y2 = burst.y + Math.sin(sp.angle) * (dist + len * sp.scale);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    if (bursts.length > 0) raf = requestAnimationFrame(tick);
  }

  window.addEventListener('pointerdown', function(e) {
    spawn(e.clientX, e.clientY);
  }, { passive: true });
})();
