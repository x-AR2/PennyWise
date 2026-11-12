/**
 * PennyWise - Logo Tech-Text Canvas Animation
 * Shared across index.html and all pages/*.html
 */
(function(){
  var container = document.getElementById('logo-tech-text');
  if (!container) return;
  var canvas = container.querySelector('canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var textLines = ['PENNYWISE'];
  var strokeWidth = 1, dashLength = 3, dashGap = 2, bounce = 0.4;
  var SPRING = 320, KICK_DECAY = 0.62;

  var clamp01 = function(v){ return Math.min(1, Math.max(0, v||0)); };
  var approach = function(curr, target, dt, sec){ return curr + (target - curr) * (1 - Math.exp(-dt/sec)); };
  var width = 1, height = 1, dpr = 1, raf = 0, last = performance.now();
  var glyphs = [], kicks = [], pulse = 0, clock = 0;
  var dragging = -1, grab = {x:0,y:0};
  var pointer = {x:0,y:0,inside:false};
  var press = {x:0,y:0,time:0,index:-1};
  var lens = {x:0,y:0};
  var frame = {x1:0,y1:0,x2:0,y2:0,alpha:0,index:-1};
  var damping = 2 * Math.sqrt(SPRING) * (1 - clamp01(bounce) * 0.96);

  function sprite(ch, fontSize, isAccent, stroke) {
    var pad = Math.ceil(strokeWidth * 2 + 3);
    var probe = document.createElement('canvas').getContext('2d');
    var fontStr = '800 ' + fontSize + 'px "Inter","Helvetica Neue",system-ui,sans-serif';
    probe.font = fontStr;
    if ('letterSpacing' in probe) probe.letterSpacing = '-0.03em';
    var m = probe.measureText(ch);
    var w = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight + pad*2);
    var h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + pad*2);
    var img = document.createElement('canvas');
    img.width = Math.max(1, Math.ceil(w*dpr));
    img.height = Math.max(1, Math.ceil(h*dpr));
    var c = img.getContext('2d');
    if (!c) return {image:img,pad:pad};
    c.setTransform(dpr,0,0,dpr,0,0);
    c.font = fontStr;
    if ('letterSpacing' in c) c.letterSpacing = '-0.03em';
    c.textBaseline = 'alphabetic';
    var ink = isAccent ? '#c8a96e' : '#ffffff';
    var gx = pad + m.actualBoundingBoxLeft;
    var gy = pad + m.actualBoundingBoxAscent;
    if (stroke) {
      c.lineJoin = 'round';
      c.lineWidth = strokeWidth*2;
      c.strokeStyle = ink;
      c.setLineDash([Math.max(1,dashLength), Math.max(1,dashGap)]);
      c.strokeText(ch, gx, gy);
      c.setLineDash([]);
      c.globalCompositeOperation = 'destination-out';
      c.fillStyle = '#000'; c.fillText(ch, gx, gy);
    } else {
      c.fillStyle = ink; c.fillText(ch, gx, gy);
    }
    return {image:img, pad:pad};
  }

  function buildLayout() {
    width = container.clientWidth || 150;
    height = container.clientHeight || 32;
    dpr = Math.min(window.devicePixelRatio||1, 2);
    canvas.width = Math.round(width*dpr);
    canvas.height = Math.round(height*dpr);

    var probe = document.createElement('canvas').getContext('2d');
    var testSize = height * 0.75;
    var fontStr = '800 ' + testSize + 'px "Inter","Helvetica Neue",system-ui,sans-serif';
    probe.font = fontStr;
    if ('letterSpacing' in probe) probe.letterSpacing = '-0.03em';
    var lineW = probe.measureText(textLines[0]).width;
    var fit = Math.min(1, (width * 0.98) / Math.max(lineW, 1));
    var fontSize = Math.max(10, Math.round(testSize * fit));
    fontStr = '800 ' + fontSize + 'px "Inter","Helvetica Neue",system-ui,sans-serif';
    probe.font = fontStr;
    if ('letterSpacing' in probe) probe.letterSpacing = '-0.03em';

    var line = textLines[0];
    lineW = probe.measureText(line).width;
    var curX = (width - lineW) / 2;
    var curY = (height + fontSize * 0.72) / 2;
    var prev = glyphs.slice();
    glyphs = [];
    for (var ci = 0; ci < line.length; ci++) {
      var ch = line[ci];
      var charX = curX + probe.measureText(line.substring(0, ci)).width;
      if (!ch.trim()) continue;
      var own = probe.measureText(ch);
      var box = {
        x1: charX - own.actualBoundingBoxLeft,
        y1: curY - own.actualBoundingBoxAscent,
        x2: charX + own.actualBoundingBoxRight,
        y2: curY + own.actualBoundingBoxDescent
      };
      var kept = prev[glyphs.length];
      glyphs.push({
        char:ch, x:charX, y:curY, box:box, isAccent:true,
        offset: kept ? kept.offset : {x:0,y:0},
        velocity: kept ? kept.velocity : {x:0,y:0},
        outline: kept ? kept.outline : 0,
        fill: sprite(ch, fontSize, true, false),
        dashes: sprite(ch, fontSize, true, true),
        index: glyphs.length
      });
    }
  }

  function glyphAt(x, y) {
    var best=-1, bd=Infinity;
    for (var i=0;i<glyphs.length;i++) {
      var g=glyphs[i];
      var cx=(g.box.x1+g.box.x2)/2+g.offset.x;
      var cy=(g.box.y1+g.box.y2)/2+g.offset.y;
      var d=Math.hypot(x-cx,y-cy);
      if(d<bd){bd=d;best=i;}
    }
    return bd<36?best:-1;
  }

  function kick(idx) {
    var str=600;
    kicks.push({index:idx,at:pulse,velocity:str});
    for(var d=1;d<glyphs.length;d++){
      var v=str*Math.pow(KICK_DECAY,d);
      if(v<20)break;
      if(idx-d>=0)kicks.push({index:idx-d,at:pulse+d*0.055,velocity:v});
      if(idx+d<glyphs.length)kicks.push({index:idx+d,at:pulse+d*0.055,velocity:v});
    }
    wake();
  }

  function drawFrame(accent) {
    var g = glyphs[frame.index];
    if (!g || frame.alpha < 0.01) return;
    var a = frame.alpha;
    var x1 = Math.round(frame.x1), y1 = Math.round(frame.y1);
    var x2 = Math.round(frame.x2), y2 = Math.round(frame.y2);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = accent;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.rect(x1 + 0.5, y1 + 0.5, x2 - x1, y2 - y1);
    ctx.globalAlpha = 0.55 * a;
    ctx.stroke();

    ctx.beginPath();
    var corners = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
    for (var ci = 0; ci < 4; ci++) {
      ctx.rect(corners[ci][0] - 1.5, corners[ci][1] - 1.5, 3.5, 3.5);
    }
    ctx.globalAlpha = 0.95 * a;
    ctx.fill();

    ctx.font = '8px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.8 * a;
    ctx.fillText(g.char + ' ' + Math.round(g.box.x2 - g.box.x1), x1, y1 - 2);

    ctx.restore();
  }

  function tick(now) {
    raf = 0;
    var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now; pulse += dt;

    var accent = '#c8a96e';
    var active = pointer.inside || dragging >= 0;
    var sweeping = !active;
    if (sweeping) clock += dt * 1.1;

    var targetX = pointer.x;
    var targetY = pointer.y;
    if (sweeping && glyphs.length > 0) {
      var minX = glyphs[0].box.x1, maxX = glyphs[glyphs.length - 1].box.x2;
      var minY = glyphs[0].box.y1, maxY = glyphs[glyphs.length - 1].box.y2;
      targetX = minX + (maxX - minX) * (0.5 - 0.5 * Math.cos(clock * 0.9));
      targetY = minY + (maxY - minY) * (0.5 + 0.1 * Math.sin(clock * 1.3));
    }

    lens.x = approach(lens.x, targetX, dt, pointer.inside ? 0.05 : 0.2);
    lens.y = approach(lens.y, targetY, dt, pointer.inside ? 0.05 : 0.2);

    for (var k = kicks.length - 1; k >= 0; k--) {
      if (kicks[k].at > pulse) continue;
      var kg = glyphs[kicks[k].index];
      if (kg) kg.velocity.y -= kicks[k].velocity;
      kicks.splice(k, 1);
    }

    var moving = false;
    for (var i = 0; i < glyphs.length; i++) {
      var g = glyphs[i];
      if (i === dragging) {
        g.offset.x = approach(g.offset.x, pointer.x - grab.x, dt, 0.03);
        g.offset.y = approach(g.offset.y, pointer.y - grab.y, dt, 0.03);
        g.velocity.x = 0; g.velocity.y = 0; moving = true; continue;
      }
      if (Math.abs(g.offset.x) < 0.05 && Math.abs(g.offset.y) < 0.05 && Math.hypot(g.velocity.x, g.velocity.y) < 0.5) {
        g.offset.x = 0; g.offset.y = 0; g.velocity.x = 0; g.velocity.y = 0; continue;
      }
      g.velocity.x += (-SPRING * g.offset.x - damping * g.velocity.x) * dt;
      g.velocity.y += (-SPRING * g.offset.y - damping * g.velocity.y) * dt;
      g.offset.x += g.velocity.x * dt;
      g.offset.y += g.velocity.y * dt;
      moving = true;
    }

    var focus = dragging >= 0 ? dragging : glyphAt(lens.x, lens.y);
    if (focus >= 0) {
      var fg = glyphs[focus];
      var bx1 = fg.box.x1 + fg.offset.x - 3;
      var by1 = fg.box.y1 + fg.offset.y - 3;
      var bx2 = fg.box.x2 + fg.offset.x + 3;
      var by2 = fg.box.y2 + fg.offset.y + 3;
      if (frame.index < 0 || frame.alpha < 0.02) {
        frame.x1 = bx1; frame.y1 = by1; frame.x2 = bx2; frame.y2 = by2;
      }
      var glide = focus === dragging ? 0.02 : 0.08;
      frame.x1 = approach(frame.x1, bx1, dt, glide);
      frame.y1 = approach(frame.y1, by1, dt, glide);
      frame.x2 = approach(frame.x2, bx2, dt, glide);
      frame.y2 = approach(frame.y2, by2, dt, glide);
      frame.index = focus;
    }
    frame.alpha = approach(frame.alpha, focus >= 0 ? 1 : 0, dt, 0.1);

    for (var j = 0; j < glyphs.length; j++) {
      var gl = glyphs[j];
      var tgt = j === focus && j !== dragging ? 1 : 0;
      gl.outline = approach(gl.outline, tgt, dt, 0.09);
      if (Math.abs(gl.outline - tgt) > 0.002) moving = true;
      else gl.outline = tgt;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var gi = 0; gi < glyphs.length; gi++) {
      var gg = glyphs[gi];
      var gx2 = Math.round((gg.box.x1 + gg.offset.x - gg.fill.pad) * dpr);
      var gy2 = Math.round((gg.box.y1 + gg.offset.y - gg.fill.pad) * dpr);
      if (gg.outline < 0.999) { ctx.globalAlpha = 1 - gg.outline; ctx.drawImage(gg.fill.image, gx2, gy2); }
      if (gg.outline > 0.001) { ctx.globalAlpha = gg.outline; ctx.drawImage(gg.dashes.image, gx2, gy2); }
      ctx.globalAlpha = 1;
    }

    drawFrame(accent);

    var settling = moving || kicks.length > 0 || (frame.alpha > 0.01 && frame.alpha < 0.99);
    if (active || sweeping || settling) {
      raf = requestAnimationFrame(tick);
    }
  }

  function wake(){if(!raf){last=0;raf=requestAnimationFrame(tick);}}

  container.addEventListener('pointermove',function(e){
    var r=container.getBoundingClientRect();
    pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;
    pointer.inside=pointer.x>=0&&pointer.y>=0&&pointer.x<=r.width&&pointer.y<=r.height;
    wake();
  });
  container.addEventListener('pointerleave',function(){pointer.inside=false;wake();});
  container.addEventListener('pointerdown',function(e){
    var r=container.getBoundingClientRect();
    pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;
    var idx=glyphAt(pointer.x,pointer.y);
    press.x=pointer.x;press.y=pointer.y;press.time=performance.now();press.index=idx;
    if(idx>=0){dragging=idx;grab.x=pointer.x-glyphs[idx].offset.x;grab.y=pointer.y-glyphs[idx].offset.y;container.setPointerCapture&&container.setPointerCapture(e.pointerId);}
    wake();
  });
  container.addEventListener('pointerup',function(e){
    if(dragging>=0){dragging=-1;try{container.releasePointerCapture&&container.releasePointerCapture(e.pointerId);}catch(err){}}
    if(press.index>=0&&performance.now()-press.time<350){var r=container.getBoundingClientRect();if(Math.hypot(e.clientX-r.left-press.x,e.clientY-r.top-press.y)<8)kick(press.index);}
    press.index=-1;wake();
  });
  if(window.ResizeObserver)new ResizeObserver(function(){buildLayout();wake();}).observe(container);
  if(document.fonts)document.fonts.ready.then(function(){buildLayout();wake();});
  buildLayout();wake();
})();
