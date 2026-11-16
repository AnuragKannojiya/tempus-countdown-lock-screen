/* =========================================================
   TEMPUS — 3D Countdown Lock Screen  ·  WOW Edition
   ========================================================= */
(() => {
  'use strict';

  // ── Quotes ──
  const QUOTES = [
    "The secret of getting ahead is getting started. — Mark Twain",
    "Time is what we want most, but what we use worst. — William Penn",
    "An inch of time is an inch of gold. — Chinese Proverb",
    "Lost time is never found again. — Benjamin Franklin",
    "The two most powerful warriors are patience and time. — Tolstoy",
    "The bad news is time flies. The good news is you're the pilot.",
    "Don't watch the clock; do what it does. Keep going. — Levenson",
    "Every second is of infinite value. — Goethe",
    "One day or day one. You decide.",
    "Focus on progress, not perfection.",
    "Discipline is choosing what you want most over what you want now.",
    "Your future self will thank you.",
    "Small steps every day lead to massive results.",
    "Time waits for no one.",
    "You may delay, but time will not. — Franklin",
  ];

  // ── Theme configs ──
  const THEME_COLORS = {
    cyberpunk: { c1:[0,240,255],   c2:[180,0,255],   c3:[255,0,110] },
    aurora:    { c1:[99,102,241],   c2:[168,85,247],   c3:[236,72,153] },
    ocean:     { c1:[6,182,212],    c2:[59,130,246],   c3:[30,64,175] },
    inferno:   { c1:[255,69,0],     c2:[255,0,128],    c3:[123,0,255] },
    matrix:    { c1:[0,255,65],     c2:[0,143,17],     c3:[0,255,65] },
    golden:    { c1:[245,158,11],   c2:[217,119,6],    c3:[251,191,36] },
  };

  // ── State ──
  let state = loadState();
  let wakeLockSentinel = null;
  let prevDigits = { d:'--', h:'--', m:'--', s:'--' };

  function defaultState() {
    const now = new Date();
    const ny = now.getFullYear() + 1;
    return {
      eventName: 'New Year ' + ny,
      targetDate: new Date(ny, 0, 1).toISOString(),
      theme: 'cyberpunk',
      urgencyMode: true,
      showQuotes: true,
    };
  }

  function loadState() {
    try { const r = localStorage.getItem('tempus_state'); if (r) return JSON.parse(r); } catch(_){}
    return defaultState();
  }
  function saveState() { localStorage.setItem('tempus_state', JSON.stringify(state)); }

  const $ = s => document.querySelector(s);

  // ═══════════════════════════════════════════════════════
  //  STARFIELD — Depth parallax stars
  // ═══════════════════════════════════════════════════════
  const starCanvas = $('#starfield');
  const starCtx = starCanvas.getContext('2d');
  let stars = [];

  function initStarfield() {
    const dpr = window.devicePixelRatio || 1;
    starCanvas.width = innerWidth * dpr;
    starCanvas.height = innerHeight * dpr;
    starCtx.scale(dpr, dpr);
    starCanvas.style.width = innerWidth + 'px';
    starCanvas.style.height = innerHeight + 'px';

    stars = [];
    const count = Math.min(200, Math.floor((innerWidth * innerHeight) / 5000));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        z: Math.random(), // depth 0-1
        r: 0.3 + Math.random() * 1.5,
        flicker: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawStarfield() {
    starCtx.clearRect(0, 0, innerWidth, innerHeight);
    const colors = THEME_COLORS[state.theme] || THEME_COLORS.cyberpunk;
    for (const s of stars) {
      s.flicker += 0.01 + s.z * 0.02;
      const alpha = (0.2 + 0.5 * s.z) * (0.6 + 0.4 * Math.sin(s.flicker));
      const c = s.z > 0.7 ? colors.c1 : s.z > 0.4 ? colors.c2 : colors.c3;
      starCtx.beginPath();
      starCtx.arc(s.x, s.y, s.r * (0.5 + s.z * 0.5), 0, Math.PI * 2);
      starCtx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
      starCtx.fill();
      // glow on bright stars
      if (s.z > 0.8) {
        starCtx.beginPath();
        starCtx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        starCtx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha * 0.1})`;
        starCtx.fill();
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  //  3D PARTICLES — Depth-layered with trails
  // ═══════════════════════════════════════════════════════
  const pCanvas = $('#particle-canvas');
  const pCtx = pCanvas.getContext('2d');
  let particles = [];
  let particleSpeed = 1;

  function initParticles() {
    const dpr = window.devicePixelRatio || 1;
    pCanvas.width = innerWidth * dpr;
    pCanvas.height = innerHeight * dpr;
    pCtx.scale(dpr, dpr);
    pCanvas.style.width = innerWidth + 'px';
    pCanvas.style.height = innerHeight + 'px';

    particles = [];
    const count = Math.min(80, Math.floor((innerWidth * innerHeight) / 12000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        z: Math.random(),
        r: 1 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.3 + Math.random() * 0.8),
        alpha: 0.15 + Math.random() * 0.4,
        trail: [],
      });
    }
  }

  function drawParticles() {
    pCtx.clearRect(0, 0, innerWidth, innerHeight);
    const colors = THEME_COLORS[state.theme] || THEME_COLORS.cyberpunk;

    for (const p of particles) {
      p.x += p.vx * particleSpeed;
      p.y += p.vy * particleSpeed * (0.5 + p.z);

      // Wrap
      if (p.y < -20) { p.y = innerHeight + 20; p.x = Math.random() * innerWidth; p.trail = []; }
      if (p.x < -20) p.x = innerWidth + 20;
      if (p.x > innerWidth + 20) p.x = -20;

      // Trail
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 8) p.trail.shift();

      const c = p.z > 0.5 ? colors.c1 : colors.c2;

      // Draw trail
      if (p.trail.length > 1) {
        pCtx.beginPath();
        pCtx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          pCtx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        pCtx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${p.alpha * 0.15})`;
        pCtx.lineWidth = p.r * 0.5;
        pCtx.stroke();
      }

      // Draw particle
      const size = p.r * (0.5 + p.z * 0.5);
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
      pCtx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${p.alpha})`;
      pCtx.fill();

      // Glow
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
      pCtx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${p.alpha * 0.08})`;
      pCtx.fill();
    }

    // Connection lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const c = colors.c1;
          pCtx.beginPath();
          pCtx.moveTo(particles[i].x, particles[i].y);
          pCtx.lineTo(particles[j].x, particles[j].y);
          pCtx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.04 * (1 - dist / 100)})`;
          pCtx.lineWidth = 0.5;
          pCtx.stroke();
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  //  3D MOUSE TILT
  // ═══════════════════════════════════════════════════════
  const tiltContainer = $('#tilt-container');
  let mouseX = 0, mouseY = 0;
  let currentTiltX = 0, currentTiltY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / innerWidth - 0.5) * 2;  // -1 to 1
    mouseY = (e.clientY / innerHeight - 0.5) * 2;
  });

  document.addEventListener('touchmove', e => {
    const t = e.touches[0];
    mouseX = (t.clientX / innerWidth - 0.5) * 2;
    mouseY = (t.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  document.addEventListener('mouseleave', () => { mouseX = 0; mouseY = 0; });

  function updateTilt() {
    // Smooth interpolation
    currentTiltX += (mouseY * -8 - currentTiltX) * 0.06;
    currentTiltY += (mouseX * 8 - currentTiltY) * 0.06;
    tiltContainer.style.transform =
      `perspective(1000px) rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;
  }

  // ═══════════════════════════════════════════════════════
  //  ANIMATION LOOP
  // ═══════════════════════════════════════════════════════
  function animate() {
    drawStarfield();
    drawParticles();
    updateTilt();
    requestAnimationFrame(animate);
  }

  // ═══════════════════════════════════════════════════════
  //  COUNTDOWN
  // ═══════════════════════════════════════════════════════
  const RING_C = 2 * Math.PI * 140;

  function flipDigit(id, newVal) {
    const card = $(id);
    if (!card) return;
    const front = card.querySelector('.flip-front span');
    const back = card.querySelector('.flip-back span');
    const oldVal = front.textContent;
    if (oldVal === newVal) return;

    back.textContent = newVal;
    card.classList.add('flipping');

    setTimeout(() => {
      front.textContent = newVal;
      card.classList.remove('flipping');
      // Reset inner transform
      card.querySelector('.flip-card-inner').style.transform = '';
    }, 600);
  }

  function updateCountdown() {
    const now = new Date();

    // Status bar
    $('#status-time').textContent = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    $('#status-date').textContent = now.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric' });

    // Label
    const label = state.eventName || 'Countdown';
    $('#event-label').textContent = label;
    $('#event-label-glow').textContent = label;

    const target = new Date(state.targetDate);
    let diff = target - now;

    if (diff <= 0) {
      ['#flip-days','#flip-hours','#flip-mins','#flip-secs'].forEach(id => {
        flipDigit(id, '00');
      });
      $('#ring-progress').style.strokeDashoffset = RING_C;
      $('#ring-progress-glow').style.strokeDashoffset = RING_C;
      $('#insight-text').textContent = 'Countdown complete!';
      $('#progress-fill').style.width = '100%';
      $('#progress-glow').style.width = '100%';
      $('#progress-text').textContent = '100% complete';
      showCelebration();
      return;
    }

    const ts = Math.floor(diff / 1000);
    const d = String(Math.floor(ts / 86400)).padStart(2, '0');
    const h = String(Math.floor((ts % 86400) / 3600)).padStart(2, '0');
    const m = String(Math.floor((ts % 3600) / 60)).padStart(2, '0');
    const s = String(ts % 60).padStart(2, '0');

    // Flip only changed digits
    if (d !== prevDigits.d) flipDigit('#flip-days', d);
    if (h !== prevDigits.h) flipDigit('#flip-hours', h);
    if (m !== prevDigits.m) flipDigit('#flip-mins', m);
    if (s !== prevDigits.s) flipDigit('#flip-secs', s);
    prevDigits = { d, h, m, s };

    // Ring
    const created = new Date(localStorage.getItem('tempus_created') || now.toISOString());
    const totalSpan = target - created;
    const elapsed = now - created;
    const frac = totalSpan > 0 ? Math.min(elapsed / totalSpan, 1) : 1;
    const offset = RING_C * (1 - frac);
    $('#ring-progress').style.strokeDashoffset = offset;
    $('#ring-progress-glow').style.strokeDashoffset = offset;

    // Progress bar
    const pct = Math.round(frac * 100);
    $('#progress-fill').style.width = pct + '%';
    $('#progress-glow').style.width = pct + '%';
    $('#progress-text').textContent = pct + '% complete';

    // Insight
    updateInsight(+d, +h, +m, +s, pct);
    updateUrgency(+d, +h, frac);
  }

  function updateInsight(d, h, m, s, pct) {
    let t = '';
    if (d > 30) t = `${pct}% elapsed · ${d} days remaining`;
    else if (d > 1) t = `${pct}% elapsed · ${d} days, ${h}h left`;
    else if (d === 1) t = `${pct}% elapsed · Tomorrow!`;
    else if (h > 1) t = `${pct}% elapsed · ${h}h ${m}m remaining`;
    else if (h === 1) t = `Almost there · ${m}m ${s}s left`;
    else if (m > 5) t = `Final stretch · ${m}m ${s}s`;
    else t = `🔥 ${m}m ${s}s — stay focused!`;
    $('#insight-text').textContent = t;
  }

  function updateUrgency(d, h, frac) {
    const main = $('.countdown-main');
    main.classList.remove('urgency-high', 'urgency-critical');
    if (!state.urgencyMode) { particleSpeed = 1; return; }

    if (frac > 0.95 || (d === 0 && h < 1)) {
      main.classList.add('urgency-critical');
      particleSpeed = 3.5;
    } else if (frac > 0.85 || (d === 0 && h < 6)) {
      main.classList.add('urgency-high');
      particleSpeed = 2;
    } else {
      particleSpeed = 1;
    }
  }

  // ═══════════════════════════════════════════════════════
  //  CELEBRATION
  // ═══════════════════════════════════════════════════════
  function showCelebration() {
    $('#celebration').classList.remove('hidden');
    $('#confetti-canvas').classList.remove('hidden');
    $('#celebration-event').textContent = state.eventName;
    launchConfetti();
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.frequency.setValueAtTime(freq, ac.currentTime + i * 0.15);
        g.gain.setValueAtTime(0.08, ac.currentTime + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.15 + 1);
        o.start(ac.currentTime + i * 0.15);
        o.stop(ac.currentTime + i * 0.15 + 1);
      });
    } catch(_){}
  }

  function launchConfetti() {
    const cv = $('#confetti-canvas');
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';

    const pieces = [];
    const colors = ['#00f0ff','#b400ff','#ff006e','#f59e0b','#22c55e','#3b82f6','#f43f5e','#fbbf24'];
    for (let i = 0; i < 200; i++) {
      pieces.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight - innerHeight,
        w: 4 + Math.random() * 6,
        h: 8 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: 2 + Math.random() * 5,
        vx: (Math.random() - 0.5) * 4,
        rot: Math.random() * 360,
        rs: (Math.random() - 0.5) * 12,
      });
    }
    let f = 0;
    (function draw() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of pieces) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.rot += p.rs;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - f / 350);
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      }
      if (++f < 400) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })();
  }

  // ═══════════════════════════════════════════════════════
  //  QUOTES
  // ═══════════════════════════════════════════════════════
  function showQuote() {
    if (!state.showQuotes) { $('#quote-container').style.display = 'none'; return; }
    $('#quote-container').style.display = '';
    const qt = $('#quote-text');
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    qt.style.opacity = '0';
    setTimeout(() => {
      qt.textContent = `"${q}"`;
      qt.style.transition = 'opacity 1s ease';
      qt.style.opacity = '1';
    }, 400);
  }

  // ═══════════════════════════════════════════════════════
  //  THEME
  // ═══════════════════════════════════════════════════════
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    $('#theme-grid').querySelectorAll('.theme-swatch').forEach(s =>
      s.classList.toggle('active', s.dataset.theme === theme)
    );
    initStarfield();
    initParticles();
  }

  const THEME_LIST = ['cyberpunk','aurora','ocean','inferno','matrix','golden'];
  function cycleTheme() {
    const i = THEME_LIST.indexOf(state.theme);
    applyTheme(THEME_LIST[(i + 1) % THEME_LIST.length]);
    saveState();
  }

  // ═══════════════════════════════════════════════════════
  //  SETTINGS
  // ═══════════════════════════════════════════════════════
  function openSettings() {
    $('#settings-panel').classList.remove('hidden');
    $('#event-name').value = state.eventName;
    const d = new Date(state.targetDate);
    const p = n => String(n).padStart(2,'0');
    $('#event-date').value = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    $('#urgency-toggle').checked = state.urgencyMode;
    $('#quotes-toggle').checked = state.showQuotes;
    applyTheme(state.theme);
  }

  function closeSettings() { $('#settings-panel').classList.add('hidden'); }

  function saveSettings() {
    const name = $('#event-name').value.trim();
    const dateVal = $('#event-date').value;
    if (!name) { $('#event-name').focus(); return; }
    if (!dateVal) { $('#event-date').focus(); return; }

    state.eventName = name;
    state.targetDate = new Date(dateVal).toISOString();
    state.urgencyMode = $('#urgency-toggle').checked;
    state.showQuotes = $('#quotes-toggle').checked;
    localStorage.setItem('tempus_created', new Date().toISOString());
    prevDigits = { d:'--', h:'--', m:'--', s:'--' };
    saveState();
    closeSettings();
    $('#celebration').classList.add('hidden');
    $('#confetti-canvas').classList.add('hidden');
    showQuote();
  }

  function applyPreset(preset) {
    const now = new Date();
    const setDT = t => {
      const p = n => String(n).padStart(2,'0');
      $('#event-date').value = `${t.getFullYear()}-${p(t.getMonth()+1)}-${p(t.getDate())}T${p(t.getHours())}:${p(t.getMinutes())}`;
    };
    const presets = {
      'new-year': () => { const y = now.getFullYear()+1; $('#event-name').value = 'New Year ' + y; setDT(new Date(y,0,1)); },
      'focus-25': () => { $('#event-name').value = '🧠 Focus Session'; setDT(new Date(now.getTime()+25*60e3)); },
      'focus-50': () => { $('#event-name').value = '🎯 Deep Focus';    setDT(new Date(now.getTime()+50*60e3)); },
      'break-5':  () => { $('#event-name').value = '☕ Break Time';    setDT(new Date(now.getTime()+5*60e3));  },
      'workout':  () => { $('#event-name').value = '💪 Workout';       setDT(new Date(now.getTime()+45*60e3)); },
      'custom-1h':() => { $('#event-name').value = '⏰ One Hour';      setDT(new Date(now.getTime()+60*60e3)); },
    };
    if (presets[preset]) presets[preset]();
  }

  // ═══════════════════════════════════════════════════════
  //  FULLSCREEN & WAKE LOCK
  // ═══════════════════════════════════════════════════════
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(()=>{});
      $('#btn-fullscreen').classList.add('active');
    } else {
      document.exitFullscreen();
      $('#btn-fullscreen').classList.remove('active');
    }
  }

  async function toggleWakeLock() {
    const btn = $('#btn-wake');
    if (wakeLockSentinel) {
      await wakeLockSentinel.release();
      wakeLockSentinel = null; btn.classList.remove('active');
      return;
    }
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      btn.classList.add('active');
      wakeLockSentinel.addEventListener('release', () => { wakeLockSentinel = null; btn.classList.remove('active'); });
    } catch(_){}
  }

  // ═══════════════════════════════════════════════════════
  //  EVENTS
  // ═══════════════════════════════════════════════════════
  function bindEvents() {
    $('#btn-settings').addEventListener('click', openSettings);
    $('#close-settings').addEventListener('click', closeSettings);
    $('#save-settings').addEventListener('click', saveSettings);
    $('#btn-fullscreen').addEventListener('click', toggleFullscreen);
    $('#btn-wake').addEventListener('click', toggleWakeLock);
    $('#btn-theme').addEventListener('click', cycleTheme);
    $('#celebration-dismiss').addEventListener('click', () => {
      $('#celebration').classList.add('hidden');
      $('#confetti-canvas').classList.add('hidden');
      openSettings();
    });

    $('#theme-grid').querySelectorAll('.theme-swatch').forEach(s =>
      s.addEventListener('click', () => applyTheme(s.dataset.theme))
    );

    document.querySelectorAll('.preset-btn').forEach(b =>
      b.addEventListener('click', () => applyPreset(b.dataset.preset))
    );

    let lastTap = 0;
    $('.countdown-main').addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < 300) openSettings();
      lastTap = now;
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSettings();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 's' || e.key === 'S') {
        if ($('#settings-panel').classList.contains('hidden')) openSettings();
        else closeSettings();
      }
    });

    window.addEventListener('resize', () => { initStarfield(); initParticles(); });

    $('#settings-panel').addEventListener('click', e => {
      if (e.target.classList.contains('settings-backdrop')) closeSettings();
    });

    document.addEventListener('fullscreenchange', () => {
      $('#btn-fullscreen').classList.toggle('active', !!document.fullscreenElement);
    });
  }

  // ═══════════════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════════════
  function init() {
    applyTheme(state.theme);
    initStarfield();
    initParticles();
    animate();

    if (!localStorage.getItem('tempus_created'))
      localStorage.setItem('tempus_created', new Date().toISOString());

    updateCountdown();
    setInterval(updateCountdown, 1000);

    showQuote();
    setInterval(showQuote, 30000);

    bindEvents();

    if (!localStorage.getItem('tempus_state'))
      setTimeout(openSettings, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
