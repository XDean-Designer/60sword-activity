(function (global) {
  var dpr = window.devicePixelRatio || 1;
  var loops = [];
  var running = false;

  function startLoop() {
    if (running) return;
    running = true;
    function tick() {
      for (var i = 0; i < loops.length; i++) loops[i]();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function addLoop(fn) {
    loops.push(fn);
    startLoop();
  }

  /* ── E: Golden bottom sparks ── */
  function initGoldenSparks(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var sparks = [];
    var MAX = 52;
    var SPEED = 0.55;
    var w, h;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createSpark() {
      var depth = Math.random();
      return {
        x: Math.random() * w,
        y: h + Math.random() * 16,
        depth: depth,
        size: 0.6 + depth * 3.4,
        vx: (Math.random() - 0.5) * (0.12 + depth * 0.45) * SPEED,
        vy: -(0.22 + depth * 0.72 + Math.random() * 0.5) * SPEED,
        life: 0,
        maxLife: 120 + Math.random() * 200 + depth * 100,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleAmp: 0.25 + Math.random() * 0.7,
        wobbleFreq: (0.012 + Math.random() * 0.02) * SPEED,
        blur: depth > 0.65
      };
    }

    function init() {
      sparks = [];
      for (var i = 0; i < MAX; i++) {
        var s = createSpark();
        s.y = h - Math.random() * h * 0.9;
        s.life = Math.random() * s.maxLife * 0.6;
        sparks.push(s);
      }
    }

    function drawSpark(s) {
      var t = s.life / s.maxLife;
      var alpha = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88;
      alpha *= 0.55 + s.depth * 0.65;
      if (alpha <= 0) return;
      var wx = Math.sin(s.life * s.wobbleFreq + s.wobblePhase) * s.wobbleAmp * (1 + s.depth);
      var px = s.x + wx;
      var py = s.y;
      var r = s.size * 2;
      ctx.save();
      if (s.blur) ctx.filter = 'blur(' + (2 + s.depth * 2.5) + 'px)';
      var grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, 'rgba(255, 252, 235, ' + (alpha * 1) + ')');
      grad.addColorStop(0.25, 'rgba(255, 228, 160, ' + (alpha * 0.92) + ')');
      grad.addColorStop(0.55, 'rgba(255, 195, 66, ' + (alpha * 0.72) + ')');
      grad.addColorStop(1, 'rgba(255, 195, 66, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      if (s.size > 1.6) {
        ctx.fillStyle = 'rgba(255, 255, 230, ' + (alpha * 0.85) + ')';
        ctx.beginPath();
        ctx.arc(px, py, s.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    resize();
    init();
    window.addEventListener('resize', function () { resize(); init(); });

    addLoop(function () {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < sparks.length; i++) {
        var s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy -= 0.002 * s.depth * SPEED;
        s.life++;
        if (s.life >= s.maxLife || s.y < -8) sparks[i] = createSpark();
        else drawSpark(s);
      }
    });
  }

  /* ── B: Title particles + flash (aligned to #title-art) ── */
  function initTitleFx(block) {
    if (!block) return;

    var art = block.querySelector('#title-art');
    if (!art) return;

    var glowEl = document.createElement('div');
    glowEl.id = 'title-gold-glow';
    glowEl.setAttribute('aria-hidden', 'true');
    block.insertBefore(glowEl, art);

    var particleCanvas = document.createElement('canvas');
    particleCanvas.id = 'title-particles-canvas';
    particleCanvas.setAttribute('aria-hidden', 'true');
    particleCanvas.style.position = 'absolute';
    particleCanvas.style.pointerEvents = 'none';
    particleCanvas.style.zIndex = '1';
    block.appendChild(particleCanvas);

    var flashCanvas = document.createElement('canvas');
    flashCanvas.id = 'title-flash-canvas';
    flashCanvas.setAttribute('aria-hidden', 'true');
    flashCanvas.style.position = 'absolute';
    flashCanvas.style.pointerEvents = 'none';
    flashCanvas.style.zIndex = '3';
    block.appendChild(flashCanvas);

    var pCtx = particleCanvas.getContext('2d');
    var fCtx = flashCanvas.getContext('2d');
    var padX = 31;
    var padY = 10;
    var pW, pH, pLeft, pTop;
    var particles = [];
    var MAX_P = 28;
    var SCALE = 1.3;
    var flashSize = 56;
    var FLASH_CYCLE = 3.8;
    var FLASH_BURST = 0.42;
    /* 「全」字顶部 — 第一行「定名全属于你的」第 3 字 2.5/7 */
    var FLASH_X = 0.357;
    var FLASH_Y = 0.10;
    var FLASH_OX = 2;
    var FLASH_OY = -2;

    function syncArtRect() {
      var blockRect = block.getBoundingClientRect();
      var artRect = art.getBoundingClientRect();
      var left = artRect.left - blockRect.left;
      var top = artRect.top - blockRect.top;
      var aw = artRect.width || art.offsetWidth || 325;
      var ah = artRect.height || art.offsetHeight || 116;
      pLeft = left - padX;
      pTop = top - padY;
      pW = aw + padX * 2;
      pH = ah + padY * 2;
      particleCanvas.style.left = pLeft + 'px';
      particleCanvas.style.top = pTop + 'px';
      particleCanvas.style.width = pW + 'px';
      particleCanvas.style.height = pH + 'px';
      particleCanvas.width = pW * dpr;
      particleCanvas.height = pH * dpr;
      pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var fx = left + aw * FLASH_X;
      var fy = top + ah * FLASH_Y;
      flashCanvas.style.left = (fx - flashSize / 2 + FLASH_OX) + 'px';
      flashCanvas.style.top = (fy - flashSize / 2 + FLASH_OY) + 'px';
      flashCanvas.style.width = flashSize + 'px';
      flashCanvas.style.height = flashSize + 'px';
      flashCanvas.width = flashSize * dpr;
      flashCanvas.height = flashSize * dpr;
      fCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var glowPadX = 56;
      var glowPadY = 48;
      glowEl.style.left = (left - glowPadX) + 'px';
      glowEl.style.top = (top - glowPadY) + 'px';
      glowEl.style.width = (aw + glowPadX * 2) + 'px';
      glowEl.style.height = (ah + glowPadY * 2) + 'px';
    }

    function getBand() {
      var ah = art.offsetHeight || 116;
      return {
        top: padY + ah * 0.06,
        bottom: padY + ah * 0.94
      };
    }

    function spawnParticle() {
      var band = getBand();
      particles.push({
        x: padX + (0.02 + Math.random() * 0.96) * (pW - padX * 2),
        y: band.top + Math.random() * (band.bottom - band.top),
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.35 + Math.random() * 0.75) * SCALE,
        vy: (Math.random() - 0.5) * 0.12 * SCALE,
        life: 0,
        maxLife: (90 + Math.random() * 80) * SCALE,
        size: 0.6 + Math.random() * 1.6,
        dustLen: 2 + Math.floor(Math.random() * 3)
      });
    }

    function initParticles() {
      particles = [];
      for (var i = 0; i < 16; i++) spawnParticle();
      for (var j = 0; j < particles.length; j++) {
        particles[j].life = Math.random() * particles[j].maxLife * 0.7;
        particles[j].x += particles[j].vx * particles[j].life * 0.4;
      }
    }

    function drawParticle(p) {
      var t = p.life / p.maxLife;
      var alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
      alpha *= 0.35 + p.size * 0.18;
      if (alpha <= 0) return;
      pCtx.save();
      pCtx.globalCompositeOperation = 'lighter';
      for (var d = 0; d < p.dustLen; d++) {
        var dt = d / p.dustLen;
        var dx = p.x - p.vx * d * 3.5 * SCALE;
        var dy = p.y - p.vy * d * 3.5 * SCALE;
        var da = alpha * (1 - dt) * 0.45;
        var dr = p.size * (1.1 - dt * 0.5);
        var dust = pCtx.createRadialGradient(dx, dy, 0, dx, dy, dr * 2);
        dust.addColorStop(0, 'rgba(255, 235, 190, ' + da + ')');
        dust.addColorStop(0.5, 'rgba(255, 195, 66, ' + (da * 0.5) + ')');
        dust.addColorStop(1, 'rgba(255, 195, 66, 0)');
        pCtx.fillStyle = dust;
        pCtx.beginPath();
        pCtx.arc(dx, dy, dr * 2, 0, Math.PI * 2);
        pCtx.fill();
      }
      var core = pCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
      core.addColorStop(0, 'rgba(255, 255, 230, ' + (alpha * 0.95) + ')');
      core.addColorStop(0.35, 'rgba(255, 213, 149, ' + (alpha * 0.65) + ')');
      core.addColorStop(1, 'rgba(255, 195, 66, 0)');
      pCtx.fillStyle = core;
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.restore();
    }

    function drawFlash() {
      var t = (performance.now() / 1000) % FLASH_CYCLE;
      fCtx.clearRect(0, 0, flashSize, flashSize);
      if (t > FLASH_BURST) return;
      var flash = Math.pow(Math.sin((t / FLASH_BURST) * Math.PI), 0.82);
      var cx = flashSize / 2;
      var cy = flashSize / 2;
      var coreR = 6 + flash * 9;
      fCtx.save();
      fCtx.globalCompositeOperation = 'lighter';
      var halo = fCtx.createRadialGradient(cx, cy, 0, cx, cy, 28);
      halo.addColorStop(0, 'rgba(255, 245, 210, ' + (0.48 * flash) + ')');
      halo.addColorStop(0.5, 'rgba(255, 213, 149, ' + (0.22 * flash) + ')');
      halo.addColorStop(1, 'rgba(255, 195, 66, 0)');
      fCtx.fillStyle = halo;
      fCtx.beginPath();
      fCtx.arc(cx, cy, 28, 0, Math.PI * 2);
      fCtx.fill();
      for (var a = 0; a < 4; a++) {
        var angle = (Math.PI / 4) + a * (Math.PI / 2);
        var rayLen = 10 + flash * 14;
        fCtx.strokeStyle = 'rgba(255, 255, 255, ' + (0.62 * flash) + ')';
        fCtx.lineWidth = 1.3;
        fCtx.beginPath();
        fCtx.moveTo(cx + Math.cos(angle) * 3, cy + Math.sin(angle) * 3);
        fCtx.lineTo(cx + Math.cos(angle) * rayLen, cy + Math.sin(angle) * rayLen);
        fCtx.stroke();
      }
      var core = fCtx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0, 'rgba(255, 255, 255, ' + (0.98 * flash) + ')');
      core.addColorStop(0.3, 'rgba(255, 248, 220, ' + (0.78 * flash) + ')');
      core.addColorStop(0.65, 'rgba(255, 213, 149, ' + (0.38 * flash) + ')');
      core.addColorStop(1, 'rgba(255, 195, 66, 0)');
      fCtx.fillStyle = core;
      fCtx.beginPath();
      fCtx.arc(cx, cy, coreR, 0, Math.PI * 2);
      fCtx.fill();
      fCtx.restore();
    }

    function onResize() {
      syncArtRect();
      initParticles();
    }

    onResize();
    window.addEventListener('resize', onResize);

    addLoop(function () {
      pCtx.clearRect(0, 0, pW, pH);
      if (particles.length < MAX_P && Math.random() < 0.32) spawnParticle();
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += (Math.random() - 0.5) * 0.008;
        p.life++;
        if (
          p.life >= p.maxLife ||
          p.x < -6 ||
          p.x > pW + 6 ||
          p.y < -6 ||
          p.y > pH + 6
        ) {
          particles.splice(i, 1);
          continue;
        }
        drawParticle(p);
      }
      drawFlash();
    });
  }

  /* ── A3: Grid orbit trail (page4 style) ── */
  function createGridOrbitTrail(canvas, opts) {
    if (!canvas) return { clear: function () {} };
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var w, h;
    var orbitAngle = 0;
    var trailPoints = [];
    var TRAIL_LEN = 20;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function getCellCenter(btn) {
      if (!btn || !opts.getSelectedButton) return null;
      var cRect = canvas.getBoundingClientRect();
      var bRect = btn.getBoundingClientRect();
      var size = Math.min(bRect.width, bRect.height);
      if (!size) return null;
      return {
        x: bRect.left + bRect.width / 2 - cRect.left,
        y: bRect.top + bRect.height / 2 - cRect.top,
        r: size / 2
      };
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var btn = opts.getSelectedButton ? opts.getSelectedButton() : null;
      var cell = getCellCenter(btn);
      if (!cell) {
        trailPoints = [];
        return;
      }

      orbitAngle += 0.032;
      var ox = cell.x + Math.cos(orbitAngle) * cell.r;
      var oy = cell.y + Math.sin(orbitAngle) * cell.r;

      trailPoints.push({ x: ox, y: oy });
      if (trailPoints.length > TRAIL_LEN) trailPoints.shift();

      for (var i = 0; i < trailPoints.length; i++) {
        var p = trailPoints[i];
        var t = (i + 1) / trailPoints.length;
        var alpha = Math.pow(t, 0.6) * 0.88;
        var glowR = (0.8 + t * 1.3) * 1.6;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        g.addColorStop(0, 'rgba(255, 248, 220, ' + alpha + ')');
        g.addColorStop(0.4, 'rgba(255, 210, 90, ' + (alpha * 0.7) + ')');
        g.addColorStop(1, 'rgba(255, 195, 66, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      var headR = 4.2;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var head = ctx.createRadialGradient(ox, oy, 0, ox, oy, headR);
      head.addColorStop(0, 'rgba(255, 255, 240, 1)');
      head.addColorStop(0.45, 'rgba(255, 220, 120, 0.92)');
      head.addColorStop(1, 'rgba(255, 195, 66, 0)');
      ctx.fillStyle = head;
      ctx.beginPath();
      ctx.arc(ox, oy, headR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    resize();
    window.addEventListener('resize', resize);
    addLoop(draw);

    return {
      clear: function () { trailPoints = []; },
      resize: resize
    };
  }

  /* ── A5: Grid shockwave (behind icons, brighter) ── */
  function createGridShockwave(canvas) {
    if (!canvas) return { trigger: function () {} };
    var ctx = canvas.getContext('2d');
    var w, h;
    var shockwaves = [];
    var shockSparks = [];
    var BRIGHT = 1.45;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function getCenter(btn) {
      if (!btn) return null;
      var cRect = canvas.getBoundingClientRect();
      var bRect = btn.getBoundingClientRect();
      return {
        x: bRect.left + bRect.width / 2 - cRect.left,
        y: bRect.top + bRect.height / 2 - cRect.top
      };
    }

    function trigger(btn) {
      var center = getCenter(btn);
      if (!center) return;
      var now = performance.now();
      shockwaves = [];
      shockSparks = [];
      var configs = [
        { delay: 0, duration: 380, maxRadius: 58, lineWidth: 3.6 },
        { delay: 58, duration: 400, maxRadius: 68, lineWidth: 3.0 },
        { delay: 116, duration: 420, maxRadius: 78, lineWidth: 2.4 }
      ];
      for (var r = 0; r < configs.length; r++) {
        var cfg = configs[r];
        shockwaves.push({
          x: center.x, y: center.y,
          startTime: now + cfg.delay,
          duration: cfg.duration,
          maxRadius: cfg.maxRadius,
          lineWidth: cfg.lineWidth
        });
      }
      var count = 10 + Math.floor(Math.random() * 6);
      for (var s = 0; s < count; s++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 1.8 + Math.random() * 2.8;
        shockSparks.push({
          x: center.x, y: center.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 24 + Math.random() * 22,
          size: 1.2 + Math.random() * 2.2
        });
      }
    }

    function draw(now) {
      ctx.clearRect(0, 0, w, h);
      for (var i = shockwaves.length - 1; i >= 0; i--) {
        var wave = shockwaves[i];
        var elapsed = now - wave.startTime;
        if (elapsed < 0) continue;
        var t = elapsed / wave.duration;
        if (t >= 1) { shockwaves.splice(i, 1); continue; }
        var ease = 1 - Math.pow(1 - t, 2.6);
        var radius = ease * wave.maxRadius;
        var alpha = (1 - t) * (1 - t * 0.2) * BRIGHT;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255, 220, 120, ' + Math.min(alpha * 0.95, 1) + ')';
        ctx.lineWidth = wave.lineWidth + 1;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 250, ' + Math.min(alpha * 0.85, 1) + ')';
        ctx.lineWidth = Math.max(wave.lineWidth * 0.45, 1);
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, radius * 0.94, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      for (var j = shockSparks.length - 1; j >= 0; j--) {
        var p = shockSparks[j];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.955;
        p.vy *= 0.955;
        p.life++;
        if (p.life >= p.maxLife) { shockSparks.splice(j, 1); continue; }
        var sparkT = 1 - p.life / p.maxLife;
        var sparkA = Math.pow(sparkT, 0.65) * BRIGHT;
        var glowR = p.size * 3.8;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var sg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        sg.addColorStop(0, 'rgba(255, 255, 255, ' + Math.min(sparkA * 1.4, 1) + ')');
        sg.addColorStop(0.35, 'rgba(255, 240, 200, ' + Math.min(sparkA * 1.05, 1) + ')');
        sg.addColorStop(1, 'rgba(255, 195, 66, 0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    resize();
    window.addEventListener('resize', resize);
    addLoop(function () { draw(performance.now()); });

    return { trigger: trigger, resize: resize };
  }

  function triggerIconBounce(btn) {
    if (!btn) return;
    btn.classList.remove('is-bouncing');
    void btn.offsetWidth;
    btn.classList.add('is-bouncing');
    window.setTimeout(function () { btn.classList.remove('is-bouncing'); }, 460);
  }

  /* ── C: Center icon FX ── */
  function initCenterFx(wrap, opts) {
    if (!wrap) return { pop: function () {}, burst: function () {} };
    opts = opts || {};
    var fxSize = opts.fxSize || 360;
    var canvas = wrap.querySelector('#center-fx-canvas');
    var burstRing = wrap.querySelector('#center-burst-ring');
    var frame = wrap.querySelector('#center-icon-frame');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'center-fx-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.className = 'pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2';
      canvas.style.width = fxSize + 'px';
      canvas.style.height = fxSize + 'px';
      wrap.insertBefore(canvas, wrap.firstChild);
    }
    var ctx = canvas.getContext('2d');
    var particles = [];
    var pulse = 0;
    var premium = !!opts.premium;
    var scheme = opts.scheme || (premium ? 'apotheosis' : 'default');
    var BRIGHT = scheme === 'apotheosis' ? 1.18 : (premium ? 1.42 : 1);
    var shockwaves = [];
    var burstFlash = 0;
    var ICON_RADIUS = 129;
    var GLOW_OVERLAP = 2;
    var RING_CLIP_INNER = scheme === 'apotheosis' ? ICON_RADIUS - GLOW_OVERLAP : 0;
    var RING_EDGE = scheme === 'apotheosis' ? ICON_RADIUS : 0;
    var RING_OUTER = scheme === 'apotheosis' ? 178 : 0;

    function withRingClip(cx, cy, fn) {
      if (scheme !== 'apotheosis') {
        fn();
        return;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, RING_OUTER, 0, Math.PI * 2);
      ctx.arc(cx, cy, RING_CLIP_INNER, 0, Math.PI * 2, true);
      ctx.clip('evenodd');
      fn();
      ctx.restore();
    }

    function drawFixedGodRays(cx, cy, breath) {
      var edgeInner = RING_CLIP_INNER;
      var rays = [
        { angle: -Math.PI / 2, spread: 0.08, outer: 178, inner: edgeInner + 2, core: 0.32 },
        { angle: -Math.PI / 2, spread: 0.18, outer: 168, inner: edgeInner + 1, core: 0.16 },
        { angle: -Math.PI / 2 + 0.32, spread: 0.06, outer: 158, inner: edgeInner + 1, core: 0.12 },
        { angle: -Math.PI / 2 - 0.32, spread: 0.06, outer: 158, inner: edgeInner + 1, core: 0.12 },
        { angle: Math.PI / 2, spread: 0.055, outer: 148, inner: edgeInner, core: 0.08 }
      ];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(cx, cy);
      for (var i = 0; i < rays.length; i++) {
        var ray = rays[i];
        var alpha = ray.core * (0.72 + breath * 0.28);
        ctx.save();
        ctx.rotate(ray.angle);
        ctx.beginPath();
        ctx.arc(0, 0, ray.outer, -ray.spread * 0.5, ray.spread * 0.5);
        ctx.arc(0, 0, ray.inner, ray.spread * 0.5, -ray.spread * 0.5, true);
        ctx.closePath();
        var rg = ctx.createRadialGradient(0, 0, ray.inner, 0, 0, ray.outer);
        rg.addColorStop(0, 'rgba(255, 248, 228, ' + Math.min(alpha, 0.72) + ')');
        rg.addColorStop(0.42, 'rgba(255, 225, 155, ' + Math.min(alpha * 0.72, 0.48) + ')');
        rg.addColorStop(0.72, 'rgba(255, 205, 90, ' + Math.min(alpha * 0.38, 0.24) + ')');
        rg.addColorStop(1, 'rgba(255, 195, 66, 0)');
        ctx.fillStyle = rg;
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    function drawRingGlow(cx, cy, p1, p2) {
      var outerR = 168 + p1 * 10;
      var innerR = RING_CLIP_INNER - 2;
      var ring = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
      ring.addColorStop(0, 'rgba(255, 213, 149, ' + ((0.34 + p1 * 0.18) * BRIGHT) + ')');
      ring.addColorStop(0.1, 'rgba(255, 210, 95, ' + ((0.42 + p1 * 0.18) * BRIGHT) + ')');
      ring.addColorStop(0.28, 'rgba(255, 210, 95, ' + ((0.32 + p1 * 0.16) * BRIGHT) + ')');
      ring.addColorStop(0.48, 'rgba(255, 195, 66, ' + ((0.12 + p2 * 0.08) * BRIGHT) + ')');
      ring.addColorStop(1, 'rgba(255, 195, 66, 0)');
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawShockwaves(cx, cy) {
      for (var s = shockwaves.length - 1; s >= 0; s--) {
        var sw = shockwaves[s];
        sw.r += 2.6;
        sw.alpha -= 0.022;
        if (sw.alpha <= 0) { shockwaves.splice(s, 1); continue; }
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255, 238, 180, ' + sw.alpha + ')';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(cx, cy, sw.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    function resize() {
      canvas.width = fxSize * dpr;
      canvas.height = fxSize * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnParticle() {
      if (scheme === 'apotheosis') {
        var spawnAngle = Math.random() * Math.PI * 2;
        var spawnR = RING_CLIP_INNER + Math.random() * 6;
        var cx = fxSize / 2;
        var cy = fxSize / 2;
        var moveAngle = spawnAngle + (Math.random() - 0.5) * 0.8;
        var speed = 0.28 + Math.random() * 0.42;
        particles.push({
          x: cx + Math.cos(spawnAngle) * spawnR,
          y: cy + Math.sin(spawnAngle) * spawnR,
          vx: Math.cos(moveAngle) * speed,
          vy: Math.sin(moveAngle) * speed,
          life: 0,
          maxLife: 48 + Math.random() * 36,
          size: 0.85 + Math.random() * 1.25
        });
        return;
      }
      var angle = Math.random() * Math.PI * 2;
      var speed = (0.45 + Math.random() * 1.35) * 0.5;
      particles.push({
        x: fxSize / 2, y: fxSize / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 42 + Math.random() * 48,
        size: 1.4 + Math.random() * 2.8
      });
    }

    function draw() {
      ctx.clearRect(0, 0, fxSize, fxSize);
      var cx = fxSize / 2;
      var cy = fxSize / 2;
      pulse += scheme === 'apotheosis' ? 0.024 : 0.035;
      var p1 = 0.5 + Math.sin(pulse) * 0.5;
      var p2 = 0.5 + Math.sin(pulse * 1.7 + 1.2) * 0.5;

      if (scheme === 'apotheosis') {
        withRingClip(cx, cy, function () {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          drawFixedGodRays(cx, cy, p1);
          drawRingGlow(cx, cy, p1, p2);
          if (burstFlash > 0) {
            var flash = ctx.createRadialGradient(cx, cy, RING_CLIP_INNER - 1, cx, cy, RING_EDGE + 22 + burstFlash * 36);
            flash.addColorStop(0, 'rgba(255, 248, 220, ' + (burstFlash * 0.38) + ')');
            flash.addColorStop(0.55, 'rgba(255, 210, 95, ' + (burstFlash * 0.16) + ')');
            flash.addColorStop(1, 'rgba(255, 195, 66, 0)');
            ctx.fillStyle = flash;
            ctx.beginPath();
            ctx.arc(cx, cy, RING_EDGE + 22 + burstFlash * 36, 0, Math.PI * 2);
            ctx.fill();
            burstFlash -= 0.028;
          }
          drawShockwaves(cx, cy);
          if (Math.random() < 0.3) spawnParticle();
          for (var j = particles.length - 1; j >= 0; j--) {
            var pt = particles[j];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.life++;
            var ptT = pt.life / pt.maxLife;
            var ptA = ptT < 0.15 ? ptT / 0.15 : 1 - (ptT - 0.15) / 0.85;
            if (pt.life >= pt.maxLife) { particles.splice(j, 1); continue; }
            var glowR = pt.size * 3.1;
            var pa = Math.min(ptA * BRIGHT * 0.68, 0.58);
            var pg = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, glowR);
            pg.addColorStop(0, 'rgba(255, 248, 225, ' + (pa * 0.92) + ')');
            pg.addColorStop(0.38, 'rgba(255, 228, 165, ' + (pa * 0.62) + ')');
            pg.addColorStop(0.72, 'rgba(255, 210, 95, ' + (pa * 0.32) + ')');
            pg.addColorStop(1, 'rgba(255, 195, 66, 0)');
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, glowR, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });
        return;
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      var outerR = scheme === 'apotheosis'
        ? 138 + p1 * 28
        : (premium ? 108 : 96) + p1 * (premium ? 32 : 26);
      var outer = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
      outer.addColorStop(0, 'rgba(255, 213, 149, ' + ((scheme === 'apotheosis' ? 0.34 + p1 * 0.22 : 0.38 + p1 * 0.28) * BRIGHT) + ')');
      outer.addColorStop(0.42, 'rgba(255, 195, 66, ' + ((scheme === 'apotheosis' ? 0.18 + p1 * 0.12 : 0.22 + p1 * 0.16) * BRIGHT) + ')');
      outer.addColorStop(1, 'rgba(255, 195, 66, 0)');
      ctx.fillStyle = outer;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.fill();

      var midR = scheme === 'apotheosis'
        ? 92 + p2 * 16
        : (premium ? 78 : 68) + p2 * (premium ? 18 : 14);
      var mid = ctx.createRadialGradient(cx, cy, 0, cx, cy, midR);
      mid.addColorStop(0, 'rgba(255, 240, 200, ' + ((scheme === 'apotheosis' ? 0.22 + p1 * 0.18 : 0.22 + p1 * 0.22) * BRIGHT) + ')');
      mid.addColorStop(0.55, 'rgba(255, 195, 66, ' + ((scheme === 'apotheosis' ? 0.12 + p1 * 0.1 : 0.12 + p1 * 0.14) * BRIGHT) + ')');
      mid.addColorStop(1, 'rgba(255, 195, 66, 0)');
      ctx.fillStyle = mid;
      ctx.beginPath();
      ctx.arc(cx, cy, midR, 0, Math.PI * 2);
      ctx.fill();

      if (scheme !== 'apotheosis') {
        var flareW = (premium ? 168 : 150) + p2 * (premium ? 36 : 30);
        var flare = ctx.createLinearGradient(cx - flareW, cy, cx + flareW, cy);
        flare.addColorStop(0, 'rgba(255, 195, 66, 0)');
        flare.addColorStop(0.38, 'rgba(255, 213, 149, ' + ((0.16 + p1 * 0.2) * BRIGHT) + ')');
        flare.addColorStop(0.5, 'rgba(255, 240, 200, ' + ((0.58 + p1 * 0.45) * BRIGHT) + ')');
        flare.addColorStop(0.62, 'rgba(255, 213, 149, ' + ((0.16 + p1 * 0.2) * BRIGHT) + ')');
        flare.addColorStop(1, 'rgba(255, 195, 66, 0)');
        ctx.fillStyle = flare;
        ctx.fillRect(cx - flareW, cy - (premium ? 11 : 9), flareW * 2, premium ? 22 : 18);
      }

      ctx.restore();

      if (Math.random() < (scheme === 'apotheosis' ? 0.36 : (premium ? 0.88 : 0.72))) spawnParticle();
      for (var i = particles.length - 1; i >= 0; i--) {
        var pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        var t = pt.life / pt.maxLife;
        var a = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        if (pt.life >= pt.maxLife) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var glowR = pt.size * 4.2;
        var pa = Math.min(a * BRIGHT, 1);
        var pg = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, glowR);
        pg.addColorStop(0, 'rgba(255, 255, 245, ' + Math.min(pa * 1.45, 1) + ')');
        pg.addColorStop(0.28, 'rgba(255, 248, 210, ' + (pa * 1.05) + ')');
        pg.addColorStop(0.58, 'rgba(255, 215, 90, ' + (pa * 0.82) + ')');
        pg.addColorStop(1, 'rgba(255, 195, 66, 0)');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function pop() {
      if (!frame) return;
      frame.classList.remove('center-icon-pop');
      void frame.offsetWidth;
      frame.classList.add('center-icon-pop');
    }

    function burst() {
      if (!burstRing) return;
      burstRing.classList.remove('is-active');
      void burstRing.offsetWidth;
      burstRing.classList.add('is-active');
      if (scheme === 'apotheosis') {
        burstFlash = 1;
        shockwaves.push({ r: RING_EDGE + 1, alpha: 0.58 });
        shockwaves.push({ r: RING_EDGE + 10, alpha: 0.42 });
      }
      window.setTimeout(function () { burstRing.classList.remove('is-active'); }, 620);
    }

    resize();
    window.addEventListener('resize', resize);
    addLoop(draw);

    if (opts.burstOnLoad) burst();
    if (opts.popOnLoad) pop();

    return { pop: pop, burst: burst };
  }

  var DEFAULT_SWORD_NAME = '独孤九剑';
  var NAME_SUFFIX = '剑';
  var MAX_PREFIX_LEN = 7;

  var NAME_POOL = [
    '独孤九剑', '倚天剑', '青釭剑', '玄铁剑', '碧血剑', '长虹剑',
    '追风剑', '逐日剑', '破晓剑', '守望剑', '裁决剑', '天行剑',
    '龙泉剑', '玄冰剑', '烈阳剑', '惊雷剑', '流云剑', '破军剑'
  ];

  var PREFIX_POOL = NAME_POOL.map(function (name) {
    var prefix = name.slice(-1) === NAME_SUFFIX ? name.slice(0, -1) : name;
    return prefix.slice(0, MAX_PREFIX_LEN);
  });

  function toFullName(prefix) {
    return (prefix || '') + NAME_SUFFIX;
  }

  function initNameInput(wrap, opts) {
    if (!wrap) return null;
    opts = opts || {};

    var displayEl = wrap.querySelector('#name-display');
    var editEl = wrap.querySelector('#name-edit');
    var inputEl = wrap.querySelector('#player-name-input');
    var phEl = wrap.querySelector('#name-ph');
    var savedName = opts.initialName || DEFAULT_SWORD_NAME;
    var prevName = savedName;
    var editing = false;

    function syncInputWidth() {
      if (!inputEl) return;
      var len = Math.max(inputEl.value.length, 1);
      inputEl.style.width = len + 'em';
    }

    function updatePlaceholder() {
      if (!phEl || !inputEl) return;
      phEl.classList.toggle('is-hidden', inputEl.value.length > 0);
    }

    function showDisplay(name) {
      savedName = name;
      if (displayEl) {
        displayEl.textContent = name;
        displayEl.classList.remove('is-hidden');
      }
      if (editEl) {
        editEl.classList.add('is-hidden');
        editEl.setAttribute('aria-hidden', 'true');
      }
      editing = false;
      if (opts.onChange) opts.onChange(name);
    }

    function enterEdit() {
      if (editing) return;
      prevName = savedName;
      editing = true;
      if (displayEl) displayEl.classList.add('is-hidden');
      if (editEl) {
        editEl.classList.remove('is-hidden');
        editEl.setAttribute('aria-hidden', 'false');
      }
      if (inputEl) {
        inputEl.value = '';
        syncInputWidth();
        updatePlaceholder();
        inputEl.focus();
        var len = inputEl.value.length;
        inputEl.setSelectionRange(len, len);
      }
    }

    function exitEdit() {
      if (!editing || !inputEl) return;
      var prefix = inputEl.value.trim();
      if (!prefix) showDisplay(prevName);
      else showDisplay(toFullName(prefix.slice(0, MAX_PREFIX_LEN)));
    }

    function setName(name) {
      showDisplay(name);
    }

    function randomName() {
      if (editing && inputEl) inputEl.blur();
      var current = savedName;
      var prefix = '';
      var attempts = 0;
      do {
        prefix = PREFIX_POOL[Math.floor(Math.random() * PREFIX_POOL.length)];
        attempts++;
      } while (toFullName(prefix) === current && attempts < 24);
      showDisplay(toFullName(prefix));
    }

    wrap.addEventListener('click', function (e) {
      if (editing) return;
      e.preventDefault();
      enterEdit();
    });

    if (inputEl) {
      inputEl.addEventListener('input', function () {
        if (inputEl.value.length > MAX_PREFIX_LEN) {
          inputEl.value = inputEl.value.slice(0, MAX_PREFIX_LEN);
        }
        updatePlaceholder();
        syncInputWidth();
      });

      inputEl.addEventListener('blur', function () {
        window.setTimeout(function () {
          if (editing) exitEdit();
        }, 0);
      });

      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          exitEdit();
          inputEl.blur();
        }
      });
    }

    showDisplay(savedName);

    return {
      getName: function () { return savedName; },
      setName: setName,
      randomName: randomName
    };
  }

  function initDice(btn, nameApi) {
    if (!btn || !nameApi) return;
    btn.addEventListener('click', function () {
      nameApi.randomName();
    });
  }

  function initStartFlash(startBtn, pageRoot) {
    if (!startBtn || !pageRoot) return;
    var flashEl = document.getElementById('white-flash');
    if (!flashEl) {
      flashEl = document.createElement('div');
      flashEl.id = 'white-flash';
      flashEl.setAttribute('aria-hidden', 'true');
      pageRoot.appendChild(flashEl);
    }
    var flashed = false;
    startBtn.addEventListener('click', function () {
      if (flashed) return;
      flashed = true;
      var btnRect = startBtn.getBoundingClientRect();
      var pageRect = pageRoot.getBoundingClientRect();
      var cx = ((btnRect.left + btnRect.width / 2 - pageRect.left) / pageRect.width) * 100;
      var cy = ((btnRect.top + btnRect.height / 2 - pageRect.top) / pageRect.height) * 100;
      flashEl.style.opacity = '1';
      var start = performance.now();
      var duration = 400;
      function animateFlash(now) {
        var t = Math.min((now - start) / duration, 1);
        var ease = 1 - Math.pow(1 - t, 3);
        var radius = ease * 180;
        flashEl.style.background = 'radial-gradient(circle at ' + cx + '% ' + cy + '%, #ffffff ' + (radius * 0.3) + '%, #ffffff ' + radius + '%, #ffffff 100%)';
        flashEl.style.opacity = String(Math.min(ease * 1.2, 1));
        if (t < 1) requestAnimationFrame(animateFlash);
        else {
          flashEl.style.background = '#ffffff';
          flashEl.style.opacity = '1';
          flashEl.classList.add('active');
        }
      }
      requestAnimationFrame(animateFlash);
    });
  }

  function updateGridDots(container, pageCount, currentPage) {
    if (!container) return;
    container.innerHTML = '';
    for (var d = 0; d < pageCount; d++) {
      var dot = document.createElement('span');
      dot.className = 'grid-page-dot' + (d === currentPage ? ' is-active' : '');
      container.appendChild(dot);
    }
  }

  global.Page5Fx = {
    initGoldenSparks: initGoldenSparks,
    initTitleFx: initTitleFx,
    createGridOrbitTrail: createGridOrbitTrail,
    createGridShockwave: createGridShockwave,
    triggerIconBounce: triggerIconBounce,
    initCenterFx: initCenterFx,
    initNameInput: initNameInput,
    initDice: initDice,
    initStartFlash: initStartFlash,
    updateGridDots: updateGridDots
  };
})(window);
