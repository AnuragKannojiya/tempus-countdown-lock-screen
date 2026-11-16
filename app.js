/* =========================================================
   TEMPUS — Countdown Lock Screen  ·  Application Logic
   ========================================================= */

(() => {
  'use strict';

  // ── Quotes ──────────────────────────────────────────────
  const QUOTES = [
    "The secret of getting ahead is getting started. — Mark Twain",
    "Time is what we want most, but what we use worst. — William Penn",
    "An inch of time is an inch of gold. — Chinese Proverb",
    "Lost time is never found again. — Benjamin Franklin",
    "The two most powerful warriors are patience and time. — Leo Tolstoy",
    "Time flies over us, but leaves its shadow behind. — Nathaniel Hawthorne",
    "Better three hours too soon than a minute too late. — William Shakespeare",
    "The bad news is time flies. The good news is you're the pilot. — Michael Altshuler",
    "Time is the most valuable thing a man can spend. — Theophrastus",
    "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
    "Every second is of infinite value. — Johann Wolfgang von Goethe",
    "The key is not spending time, but investing it. — Stephen Covey",
    "You may delay, but time will not. — Benjamin Franklin",
    "Time waits for no one. — Folklore",
    "Yesterday is gone. Tomorrow has not yet come. We have only today. — Mother Teresa",
    "One day or day one. You decide.",
    "Small steps every day lead to massive results.",
    "Focus on progress, not perfection.",
    "Discipline is choosing between what you want now and what you want most.",
    "Your future self will thank you.",
  ];

  // ── Theme color maps ───────────────────────────────────
  const THEME_COLORS = {
    aurora:   { c1: [99,102,241],  c2: [168,85,247],  c3: [236,72,153] },
    ocean:    { c1: [6,182,212],   c2: [59,130,246],  c3: [30,64,175]  },
    sunset:   { c1: [249,115,22],  c2: [239,68,68],   c3: [220,38,38]  },
    forest:   { c1: [34,197,94],   c2: [22,163,74],   c3: [21,128,61]  },
    midnight: { c1: [148,163,184], c2: [100,116,139], c3: [71,85,105]  },
    rose:     { c1: [251,113,133], c2: [244,63,94],   c3: [190,18,60]  },
  };

  // ── State ──────────────────────────────────────────────
  let state = loadState();
  let wakeLockSentinel = null;
  let quoteInterval = null;

  function defaultState() {
    // Default: countdown to next New Year
    const now = new Date();
    const nextYear = now.getFullYear() + 1;
    return {
      eventName: 'New Year ' + nextYear,
      targetDate: new Date(nextYear, 0, 1, 0, 0, 0).toISOString(),
      theme: 'aurora',
      urgencyMode: true,
      showQuotes: true,
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('tempus_state');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return defaultState();
  }

  function saveState() {
    localStorage.setItem('tempus_state', JSON.stringify(state));
  }

  // ── DOM Refs ───────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const statusTime     = $('#status-time');
  const statusDate     = $('#status-date');
  const eventLabel     = $('#event-label');
  const daysEl         = $('#days');
  const hoursEl        = $('#hours');
  const minutesEl      = $('#minutes');
  const secondsEl      = $('#seconds');
  const ringProgress   = $('#ring-progress');
  const insightText    = $('#insight-text');
  const quoteText      = $('#quote-text');
  const quoteContainer = $('#quote-container');
  const settingsPanel  = $('#settings-panel');
  const themeGrid      = $('#theme-grid');
  const celebration    = $('#celebration');
  const celebrationEvent = $('#celebration-event');
  const confettiCanvas = $('#confetti-canvas');

  // ── Ambient Background ─────────────────────────────────
  const ambientCanvas = $('#ambient-canvas');
  const ambientCtx = ambientCanvas.getContext('2d');

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    ambientCanvas.width = window.innerWidth * dpr;
    ambientCanvas.height = window.innerHeight * dpr;
    ambientCtx.scale(dpr, dpr);
    ambientCanvas.style.width = window.innerWidth + 'px';
    ambientCanvas.style.height = window.innerHeight + 'px';

    const particleCanvas = $('#particle-canvas');
    particleCanvas.width = window.innerWidth * dpr;
    particleCanvas.height = window.innerHeight * dpr;
    const pctx = particleCanvas.getContext('2d');
    pctx.scale(dpr, dpr);
    particleCanvas.style.width = window.innerWidth + 'px';
    particleCanvas.style.height = window.innerHeight + 'px';
  }

  // Gentle animated gradient orbs
  const orbs = [];
  function initOrbs() {
    orbs.length = 0;
    const colors = THEME_COLORS[state.theme] || THEME_COLORS.aurora;
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < 4; i++) {
      orbs.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 150 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        color: Object.values(colors)[i % 3],
        alpha: 0.15 + Math.random() * 0.1,
      });
    }
  }

  function drawOrbs() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ambientCtx.clearRect(0, 0, w, h);

    for (const orb of orbs) {
      orb.x += orb.vx;
      orb.y += orb.vy;
      if (orb.x < -orb.r) orb.x = w + orb.r;
      if (orb.x > w + orb.r) orb.x = -orb.r;
      if (orb.y < -orb.r) orb.y = h + orb.r;
      if (orb.y > h + orb.r) orb.y = -orb.r;

      const grad = ambientCtx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
      grad.addColorStop(0, `rgba(${orb.color.join(',')}, ${orb.alpha})`);
      grad.addColorStop(1, `rgba(${orb.color.join(',')}, 0)`);
      ambientCtx.fillStyle = grad;
      ambientCtx.fillRect(0, 0, w, h);
    }
  }

  // ── Particles ──────────────────────────────────────────
  const particles = [];
  let particleSpeed = 1;

  function initParticles() {
    particles.length = 0;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const count = Math.min(60, Math.floor((w * h) / 15000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 2,
        vy: -(0.2 + Math.random() * 0.5),
        alpha: 0.15 + Math.random() * 0.35,
        flicker: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawParticles() {
    const canvas = $('#particle-canvas');
    const ctx = canvas.getContext('2d');
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    const colors = THEME_COLORS[state.theme] || THEME_COLORS.aurora;
    const c = colors.c1;

    for (const p of particles) {
      p.y += p.vy * particleSpeed;
      p.flicker += 0.02;
      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      const a = p.alpha * (0.6 + 0.4 * Math.sin(p.flicker));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      ctx.fill();
    }
  }

  // ── Animation Loop ────────────────────────────────────
  function animate() {
    drawOrbs();
    drawParticles();
    requestAnimationFrame(animate);
  }

  // ── Countdown Logic ────────────────────────────────────
  const RING_CIRCUMFERENCE = 2 * Math.PI * 120; // ~753.98

  function updateCountdown() {
    const now = new Date();

    // Status bar
    statusTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    statusDate.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

    // Event label
    eventLabel.textContent = state.eventName || 'Countdown';

    const target = new Date(state.targetDate);
    let diff = target - now;

    // Finished?
    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE;
      insightText.textContent = 'Countdown complete!';
      showCelebration();
      return;
    }

    // Calculate
    const totalSeconds = Math.floor(diff / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minutesEl.textContent = String(m).padStart(2, '0');
    secondsEl.textContent = String(s).padStart(2, '0');

    // Ring progress — based on percentage of a 24-hour day elapsed
    // We use fraction of current day remaining
    const totalDurationMs = target - new Date(state.targetDate).getTime() + (target - now);
    const createdDate = new Date(localStorage.getItem('tempus_created') || now.toISOString());
    const totalSpan = target - createdDate;
    const elapsed = now - createdDate;
    const fraction = totalSpan > 0 ? Math.min(elapsed / totalSpan, 1) : 1;
    ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - fraction);

    // Progress insight
    updateInsight(d, h, m, s, fraction);

    // Urgency
    updateUrgency(d, h, fraction);
  }

  function updateInsight(d, h, m, s, fraction) {
    const pct = Math.round(fraction * 100);
    let text = '';
    if (d > 30) {
      text = `${pct}% elapsed · ${d} days remaining`;
    } else if (d > 1) {
      text = `${pct}% elapsed · ${d} days, ${h}h left`;
    } else if (d === 1) {
      text = `${pct}% elapsed · Tomorrow!`;
    } else if (h > 1) {
      text = `${pct}% elapsed · ${h}h ${m}m remaining`;
    } else if (h === 1) {
      text = `Almost there · ${m}m ${s}s left`;
    } else if (m > 5) {
      text = `Final stretch · ${m}m ${s}s`;
    } else {
      text = `🔥 ${m}m ${s}s — stay focused!`;
    }
    insightText.textContent = text;
  }

  function updateUrgency(d, h, fraction) {
    const main = $('.countdown-main');
    main.classList.remove('urgency-high', 'urgency-critical');

    if (!state.urgencyMode) return;

    if (fraction > 0.95 || (d === 0 && h < 1)) {
      main.classList.add('urgency-critical');
      particleSpeed = 3;
    } else if (fraction > 0.85 || (d === 0 && h < 6)) {
      main.classList.add('urgency-high');
      particleSpeed = 2;
    } else {
      particleSpeed = 1;
    }
  }

  // ── Celebration ────────────────────────────────────────
  function showCelebration() {
    celebration.classList.remove('hidden');
    confettiCanvas.classList.remove('hidden');
    celebrationEvent.textContent = state.eventName;
    launchConfetti();

    // Play subtle sound if possible
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 1.5);
    } catch (_) {}
  }

  function launchConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    confettiCanvas.width = window.innerWidth * dpr;
    confettiCanvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    confettiCanvas.style.width = window.innerWidth + 'px';
    confettiCanvas.style.height = window.innerHeight + 'px';

    const w = window.innerWidth;
    const h = window.innerHeight;
    const confetti = [];
    const colors = ['#6366f1','#a855f7','#ec4899','#f59e0b','#22c55e','#06b6d4','#f43f5e'];

    for (let i = 0; i < 150; i++) {
      confetti.push({
        x: Math.random() * w,
        y: Math.random() * h - h,
        r: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: 2 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 3,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
      });
    }

    let frames = 0;
    function drawConfetti() {
      ctx.clearRect(0, 0, w, h);
      for (const c of confetti) {
        c.x += c.vx;
        c.y += c.vy;
        c.rot += c.rotSpeed;
        c.vy += 0.05; // gravity

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate((c.rot * Math.PI) / 180);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.r / 2, -c.r, c.r, c.r * 2);
        ctx.restore();
      }
      frames++;
      if (frames < 300) {
        requestAnimationFrame(drawConfetti);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    }
    drawConfetti();
  }

  // ── Quotes ─────────────────────────────────────────────
  function showRandomQuote() {
    if (!state.showQuotes) {
      quoteContainer.style.display = 'none';
      return;
    }
    quoteContainer.style.display = '';
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    quoteText.style.opacity = '0';
    setTimeout(() => {
      quoteText.textContent = `"${q}"`;
      quoteText.style.transition = 'opacity 0.8s ease';
      quoteText.style.opacity = '1';
    }, 300);
  }

  // ── Theme ──────────────────────────────────────────────
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;

    // Update active swatch
    themeGrid.querySelectorAll('.theme-swatch').forEach((s) => {
      s.classList.toggle('active', s.dataset.theme === theme);
    });

    // Reinit visuals
    initOrbs();
    initParticles();
  }

  // ── Settings ───────────────────────────────────────────
  function openSettings() {
    settingsPanel.classList.remove('hidden');
    $('#event-name').value = state.eventName;

    // Format date for datetime-local input
    const d = new Date(state.targetDate);
    const pad = (n) => String(n).padStart(2, '0');
    const localISO = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    $('#event-date').value = localISO;

    $('#urgency-toggle').checked = state.urgencyMode;
    $('#quotes-toggle').checked = state.showQuotes;

    applyTheme(state.theme);
  }

  function closeSettings() {
    settingsPanel.classList.add('hidden');
  }

  function saveSettings() {
    const name = $('#event-name').value.trim();
    const dateVal = $('#event-date').value;

    if (!name) {
      $('#event-name').focus();
      return;
    }
    if (!dateVal) {
      $('#event-date').focus();
      return;
    }

    state.eventName = name;
    state.targetDate = new Date(dateVal).toISOString();
    state.urgencyMode = $('#urgency-toggle').checked;
    state.showQuotes = $('#quotes-toggle').checked;

    // Save creation time for progress calculation
    localStorage.setItem('tempus_created', new Date().toISOString());

    saveState();
    closeSettings();
    celebration.classList.add('hidden');
    confettiCanvas.classList.add('hidden');
    showRandomQuote();
  }

  // ── Presets ────────────────────────────────────────────
  function applyPreset(preset) {
    const now = new Date();
    switch (preset) {
      case 'new-year': {
        const ny = new Date(now.getFullYear() + 1, 0, 1);
        $('#event-name').value = 'New Year ' + ny.getFullYear();
        const pad = (n) => String(n).padStart(2, '0');
        $('#event-date').value = `${ny.getFullYear()}-01-01T00:00`;
        break;
      }
      case 'focus-25': {
        const t = new Date(now.getTime() + 25 * 60 * 1000);
        $('#event-name').value = '🧠 Focus Session';
        setDateInput(t);
        break;
      }
      case 'focus-50': {
        const t = new Date(now.getTime() + 50 * 60 * 1000);
        $('#event-name').value = '🎯 Deep Focus';
        setDateInput(t);
        break;
      }
      case 'break-5': {
        const t = new Date(now.getTime() + 5 * 60 * 1000);
        $('#event-name').value = '☕ Break Time';
        setDateInput(t);
        break;
      }
      case 'workout': {
        const t = new Date(now.getTime() + 45 * 60 * 1000);
        $('#event-name').value = '💪 Workout';
        setDateInput(t);
        break;
      }
      case 'custom-1h': {
        const t = new Date(now.getTime() + 60 * 60 * 1000);
        $('#event-name').value = '⏰ One Hour Timer';
        setDateInput(t);
        break;
      }
    }
  }

  function setDateInput(d) {
    const pad = (n) => String(n).padStart(2, '0');
    $('#event-date').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ── Fullscreen ─────────────────────────────────────────
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      $('#btn-fullscreen').classList.add('active');
    } else {
      document.exitFullscreen();
      $('#btn-fullscreen').classList.remove('active');
    }
  }

  // ── Wake Lock ──────────────────────────────────────────
  async function toggleWakeLock() {
    const btn = $('#btn-wake');
    if (wakeLockSentinel) {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
      btn.classList.remove('active');
      return;
    }
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      btn.classList.add('active');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
        btn.classList.remove('active');
      });
    } catch (_) {
      // Wake Lock API not supported
    }
  }

  // ── Theme Cycle ────────────────────────────────────────
  const THEME_LIST = ['aurora', 'ocean', 'sunset', 'forest', 'midnight', 'rose'];
  function cycleTheme() {
    const idx = THEME_LIST.indexOf(state.theme);
    const next = THEME_LIST[(idx + 1) % THEME_LIST.length];
    applyTheme(next);
    saveState();
  }

  // ── Event Listeners ────────────────────────────────────
  function bindEvents() {
    $('#btn-settings').addEventListener('click', openSettings);
    $('#close-settings').addEventListener('click', closeSettings);
    $('#save-settings').addEventListener('click', saveSettings);
    $('#btn-fullscreen').addEventListener('click', toggleFullscreen);
    $('#btn-wake').addEventListener('click', toggleWakeLock);
    $('#btn-theme').addEventListener('click', cycleTheme);
    $('#celebration-dismiss').addEventListener('click', () => {
      celebration.classList.add('hidden');
      confettiCanvas.classList.add('hidden');
      openSettings();
    });

    // Theme swatches
    themeGrid.querySelectorAll('.theme-swatch').forEach((s) => {
      s.addEventListener('click', () => applyTheme(s.dataset.theme));
    });

    // Presets
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });

    // Click lock screen to open settings (double tap)
    let lastTap = 0;
    $('.countdown-main').addEventListener('click', (e) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        openSettings();
      }
      lastTap = now;
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSettings();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 's' || e.key === 'S') {
        if (settingsPanel.classList.contains('hidden')) openSettings();
        else closeSettings();
      }
    });

    // Resize
    window.addEventListener('resize', () => {
      resizeCanvas();
      initOrbs();
      initParticles();
    });

    // Settings panel backdrop click
    settingsPanel.addEventListener('click', (e) => {
      if (e.target === settingsPanel) closeSettings();
    });

    // Fullscreen change
    document.addEventListener('fullscreenchange', () => {
      $('#btn-fullscreen').classList.toggle('active', !!document.fullscreenElement);
    });
  }

  // ── Init ───────────────────────────────────────────────
  function init() {
    resizeCanvas();
    applyTheme(state.theme);
    initOrbs();
    initParticles();
    animate();

    // Set creation date if not set
    if (!localStorage.getItem('tempus_created')) {
      localStorage.setItem('tempus_created', new Date().toISOString());
    }

    // Start countdown
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Quotes
    showRandomQuote();
    quoteInterval = setInterval(showRandomQuote, 30000); // Every 30s

    bindEvents();

    // If no saved state, show settings on first load
    if (!localStorage.getItem('tempus_state')) {
      setTimeout(openSettings, 1500);
    }
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
