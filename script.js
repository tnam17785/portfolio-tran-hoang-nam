/* THN Portfolio v5 — glitch-storm removed */
(() => {
  'use strict';
  let overdrive = false;
  let particleMode = 'repel';
  let sfxOn = false;
  let secretsFound = 0;
  const SECRET_TOTAL = 7;
  let mouse = { x: null, y: null };
  let currentTheme = 'cyan';
  let hudVisible = false;
  let particleCount = 0;
  let fps = 60;
  let frameCount = 0;
  let lastFpsTime = performance.now();
  const achievements = new Set();

  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let width, height, particles = [], animationId;
  let bursts = [];
  const CONFIG = {
    particleCount: 110, maxDist: 130, speed: 0.4, particleSize: 1.4,
    lineOpacity: 0.14, mouseRadius: 180,
    colors: ['#00f0ff', '#a855f7', '#ff2a6d', '#22d3ee', '#ffffff']
  };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if (matrixCanvas) { matrixCanvas.width = width; matrixCanvas.height = height; }
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x = Math.random() * width; this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * CONFIG.speed;
      this.vy = (Math.random() - 0.5) * CONFIG.speed;
      this.size = CONFIG.particleSize + Math.random() * 1.4;
      this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      this.alpha = 0.25 + Math.random() * 0.55;
      if (!init) {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) this.x = 0; else if (edge === 1) this.x = width;
        else if (edge === 2) this.y = 0; else this.y = height;
      }
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
      if (mouse.x !== null) {
        const dx = this.x - mouse.x, dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.mouseRadius && dist > 0) {
          const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius;
          let dir = overdrive ? -1 : 1;
          if (particleMode === 'attract') dir = -1;
          else if (particleMode === 'repel') dir = 1;
          else if (particleMode === 'orbit') {
            this.vx += (-dy / dist) * force * 0.7;
            this.vy += (dx / dist) * force * 0.7;
            dir = 0;
          }
          if (dir !== 0) {
            this.vx += (dx / dist) * force * 0.55 * dir;
            this.vy += (dy / dist) * force * 0.55 * dir;
          }
        }
      }
      this.vx *= 0.992; this.vy *= 0.992;
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed < 0.08) { this.vx += (Math.random() - 0.5) * 0.12; this.vy += (Math.random() - 0.5) * 0.12; }
      if (speed > (overdrive ? 5 : 3.5)) { this.vx *= 0.9; this.vy *= 0.9; }
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color; ctx.globalAlpha = this.alpha; ctx.fill();
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = this.color; ctx.globalAlpha = this.alpha * 0.12; ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  class BurstParticle {
    constructor(x, y) {
      this.x = x; this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
      this.size = 1.5 + Math.random() * 2.5;
      this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      this.life = 1; this.decay = 0.015 + Math.random() * 0.02;
    }
    update() { this.x += this.vx; this.y += this.vy; this.vx *= 0.96; this.vy *= 0.96; this.life -= this.decay; }
    draw() {
      if (this.life <= 0) return;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
      ctx.fillStyle = this.color; ctx.globalAlpha = this.life * 0.9; ctx.fill(); ctx.globalAlpha = 1;
    }
  }

  function initParticles() {
    particles = [];
    const count = Math.min(CONFIG.particleCount, Math.floor((width * height) / 10000));
    for (let i = 0; i < count; i++) particles.push(new Particle());
    particleCount = particles.length;
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.maxDist) {
          const opacity = (1 - dist / CONFIG.maxDist) * CONFIG.lineOpacity;
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`; ctx.lineWidth = 0.7; ctx.stroke();
        }
      }
      if (mouse.x !== null) {
        const dx = particles[i].x - mouse.x, dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.mouseRadius * 0.85) {
          const opacity = (1 - dist / (CONFIG.mouseRadius * 0.85)) * 0.25;
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`; ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    bursts = bursts.filter(b => b.life > 0);
    bursts.forEach(b => { b.update(); b.draw(); });
    if (mouse.x !== null) {
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 140);
      g.addColorStop(0, 'rgba(0, 240, 255, 0.09)');
      g.addColorStop(0.4, 'rgba(168, 85, 247, 0.04)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
    }
    frameCount++;
    const now = performance.now();
    if (now - lastFpsTime >= 1000) { fps = frameCount; frameCount = 0; lastFpsTime = now; updateHUD(); }
    animationId = requestAnimationFrame(animateParticles);
  }

  const matrixCanvas = document.getElementById('matrix-canvas');
  const mctx = matrixCanvas ? matrixCanvas.getContext('2d') : null;
  const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEF<>[]{}#$%&';
  let matrixColumns = [];
  function initMatrix() {
    if (!mctx) return;
    matrixColumns = Array(Math.floor(width / 14)).fill(0).map(() => Math.random() * -50);
  }
  function drawMatrix() {
    if (!overdrive || !mctx) return;
    mctx.fillStyle = 'rgba(3, 3, 6, 0.08)'; mctx.fillRect(0, 0, width, height);
    mctx.font = '13px monospace';
    matrixColumns.forEach((y, i) => {
      const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      mctx.fillStyle = Math.random() > 0.95 ? '#fff' : '#39ff14';
      mctx.fillText(char, i * 14, y * 14);
      if (y * 14 > height && Math.random() > 0.975) matrixColumns[i] = 0; else matrixColumns[i]++;
    });
  }
  function matrixLoop() { drawMatrix(); if (overdrive) requestAnimationFrame(matrixLoop); }

  const shapesContainer = document.getElementById('shapes');
  const shapeTypes = ['hex', 'triangle', 'circle', 'square'];
  function spawnShape() {
    if (!shapesContainer) return;
    const el = document.createElement('div');
    const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    el.className = `shape ${type}`;
    const size = 20 + Math.random() * 50;
    el.style.left = Math.random() * 100 + '%';
    el.style.width = size + 'px'; el.style.height = size + 'px';
    if (type === 'triangle') {
      el.style.borderLeftWidth = (size / 2) + 'px';
      el.style.borderRightWidth = (size / 2) + 'px';
      el.style.borderBottomWidth = (size * 0.86) + 'px';
    }
    el.style.animationDuration = (12 + Math.random() * 18) + 's';
    shapesContainer.appendChild(el);
    setTimeout(() => el.remove(), 30000);
  }
  for (let i = 0; i < 6; i++) setTimeout(spawnShape, i * 800);
  setInterval(spawnShape, 2800);

  const cursor = document.querySelector('.cursor');
  const follower = document.querySelector('.cursor-follower');
  let cursorX = 0, cursorY = 0, followerX = 0, followerY = 0;
  const trailDots = [];
  for (let i = 0; i < 12; i++) {
    const dot = document.createElement('div');
    dot.className = 'trail-dot';
    document.body.appendChild(dot);
    trailDots.push({ el: dot, x: 0, y: 0 });
  }
  document.addEventListener('mousemove', e => {
    cursorX = e.clientX; cursorY = e.clientY;
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (cursor) { cursor.style.left = cursorX + 'px'; cursor.style.top = cursorY + 'px'; }
  });
  window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
  function updateFollower() {
    if (!follower) return;
    followerX += (cursorX - followerX) * 0.12;
    followerY += (cursorY - followerY) * 0.12;
    follower.style.left = followerX + 'px'; follower.style.top = followerY + 'px';
    let prevX = cursorX, prevY = cursorY;
    trailDots.forEach((dot, i) => {
      const lag = 0.2 + i * 0.04;
      dot.x += (prevX - dot.x) * lag; dot.y += (prevY - dot.y) * lag;
      dot.el.style.left = dot.x + 'px'; dot.el.style.top = dot.y + 'px';
      dot.el.style.opacity = (1 - i / 12) * 0.5;
      dot.el.style.transform = `translate(-50%, -50%) scale(${1 - i / 12 * 0.7})`;
      prevX = dot.x; prevY = dot.y;
    });
    requestAnimationFrame(updateFollower);
  }
  updateFollower();

  document.querySelectorAll('a, button, .info-item, .about-card, .nav-logo, .terminal-header, .dot, .nav-cmd, .nav-mode, .nav-sfx').forEach(el => {
    el.addEventListener('mouseenter', () => { if (cursor) cursor.classList.add('hover'); if (follower) follower.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { if (cursor) cursor.classList.remove('hover'); if (follower) follower.classList.remove('hover'); });
  });

  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - rect.left - rect.width / 2) * 0.12}px, ${(e.clientY - rect.top - rect.height / 2) * 0.12}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0, 0)'; });
  });

  window.addEventListener('mousedown', e => {
    for (let i = 0; i < (overdrive ? 28 : 18); i++) bursts.push(new BurstParticle(e.clientX, e.clientY));
    const el = document.createElement('div');
    el.className = 'ripple';
    el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px';
    el.style.width = '120px'; el.style.height = '120px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
    if (cursor) { cursor.classList.add('click'); setTimeout(() => cursor.classList.remove('click'), 200); }
  });

  const typedEl = document.querySelector('.typed-text');
  const phrases = ['Creator • Explorer • Builder', 'Nghệ An → Thế giới', 'Code. Create. Conquer.', 'Future is now.', 'Stay sharp. Stay rare.', 'Try Ctrl+K or REPEL'];
  let phraseIndex = 0, charIndex = 0, isDeleting = false, typeSpeed = 75;
  function type() {
    if (!typedEl) return;
    const current = phrases[phraseIndex];
    if (isDeleting) { typedEl.textContent = current.substring(0, charIndex - 1); charIndex--; typeSpeed = 35; }
    else { typedEl.textContent = current.substring(0, charIndex + 1); charIndex++; typeSpeed = 75; }
    if (!isDeleting && charIndex === current.length) { isDeleting = true; typeSpeed = 2000; }
    else if (isDeleting && charIndex === 0) { isDeleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; typeSpeed = 350; }
    setTimeout(type, typeSpeed);
  }
  setTimeout(type, 1400);

  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');
  const dots = document.querySelectorAll('.section-dots .dot');
  const scrollProgress = document.getElementById('scroll-progress');
  function updateNav() {
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 140) current = s.getAttribute('id'); });
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === current));
    dots.forEach(d => d.classList.toggle('active', d.dataset.section === current));
  }
  function updateScrollProgress() {
    if (!scrollProgress) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', () => { updateNav(); updateScrollProgress(); });

  document.querySelectorAll('.about-card, .info-item, .section-header').forEach(el => el.classList.add('reveal'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => { if (entry.isIntersecting) setTimeout(() => entry.target.classList.add('visible'), i * 80); });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const rx = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -11;
      const ry = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 11;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.03,1.03,1.03)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale3d(1,1,1)'; });
  });

  document.querySelectorAll('.orb').forEach((orb, i) => {
    window.addEventListener('scroll', () => { orb.style.transform = `translateY(${window.scrollY * (0.15 + i * 0.08)}px)`; });
  });

  const clockEl = document.getElementById('nav-clock');
  function updateClock() {
    if (!clockEl) return;
    const n = new Date();
    clockEl.textContent = [n.getHours(), n.getMinutes(), n.getSeconds()].map(v => String(v).padStart(2, '0')).join(':');
  }
  updateClock(); setInterval(updateClock, 1000);

  const terminalBody = document.getElementById('terminal-body');
  const terminalInput = document.getElementById('terminal-input');
  const terminal = document.getElementById('terminal');
  const autoMessages = ['boot sequence initiated...', 'loading core modules... OK', 'particle engine online', 'identity: TRAN HOANG NAM', 'location: NGHE AN // VN', 'status: ALL SYSTEMS NOMINAL', 'awaiting input...', 'hint: click REPEL or Ctrl+K', 'scanning environment...', 'no threats detected', 'render pipeline active', 'user presence confirmed'];
  let termIndex = 0;
  function addTerminalLine(text, isCmd = false) {
    if (!terminalBody) return;
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = isCmd ? `<span class="prefix" style="color:var(--accent)">$</span>${text}` : `<span class="prefix">></span>${text}`;
    terminalBody.appendChild(line);
    terminalBody.scrollTop = terminalBody.scrollHeight;
    while (terminalBody.children.length > 14) terminalBody.removeChild(terminalBody.firstChild);
  }
  function runAutoTerminal() {
    addTerminalLine(autoMessages[termIndex % autoMessages.length]);
    termIndex++;
    setTimeout(runAutoTerminal, 3200 + Math.random() * 2500);
  }
  setTimeout(runAutoTerminal, 2500);

  if (terminal) {
    const th = terminal.querySelector('.terminal-header');
    if (th) th.addEventListener('click', () => terminal.classList.toggle('expanded'));
    if (terminalInput) {
      terminalInput.addEventListener('focus', () => terminal.classList.add('expanded', 'focused'));
      terminalInput.addEventListener('blur', () => setTimeout(() => terminal.classList.remove('focused'), 150));
      terminal.addEventListener('click', (e) => {
        if (e.target === terminalInput) return;
        terminal.classList.add('expanded');
        if (e.target.closest('.terminal-input-row') || e.target === terminal) terminalInput.focus();
      });
    }
  }

  function handleTerminalCommand(cmd) {
    const c = cmd.trim().toLowerCase();
    if (!c) return;
    addTerminalLine(c, true);
    if (c === 'help') addTerminalLine('commands: help, overdrive, theme [cyan|magenta|lime|gold], clear, status, whoami, glitch, hud');
    else if (c === 'overdrive' || c === 'od') activateOverdrive();
    else if (c.startsWith('theme ')) setTheme(c.split(' ')[1]);
    else if (c === 'clear') { if (terminalBody) terminalBody.innerHTML = ''; }
    else if (c === 'status') addTerminalLine(`mode: ${overdrive ? 'OVERDRIVE' : 'NOMINAL'} | particles: ${particleCount} | theme: ${currentTheme}`);
    else if (c === 'whoami') { addTerminalLine('TRAN HOANG NAM // 2009 // NGHE AN'); unlockAchievement('identity', 'IDENTITY CONFIRMED', 'whoami'); }
    else if (c === 'glitch') { triggerPageGlitch(); addTerminalLine('glitch burst triggered'); }
    else if (c === 'hud') { toggleHUD(); addTerminalLine('HUD toggled'); }
    else addTerminalLine(`unknown command: ${c}`);
  }
  if (terminalInput) {
    terminalInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { handleTerminalCommand(terminalInput.value); terminalInput.value = ''; }
    });
  }

  const scrambleChars = '!<>-_\\/[]{}—=+*^?#________';
  function scrambleText(el) {
    const original = el.dataset.text || el.textContent;
    let frame = 0; const total = original.length * 3;
    const interval = setInterval(() => {
      el.textContent = original.split('').map((ch, i) => i < frame / 3 ? original[i] : scrambleChars[Math.floor(Math.random() * scrambleChars.length)]).join('');
      frame++;
      if (frame >= total) { clearInterval(interval); el.textContent = original; }
    }, 28);
  }
  document.querySelectorAll('.scramble-target').forEach(el => el.addEventListener('mouseenter', () => scrambleText(el)));

  const heroName = document.getElementById('hero-name');
  function explodeName() {
    if (!heroName) return;
    const text = 'TRẦN HOÀNG NAM';
    const gs = heroName.querySelector('.glitch');
    if (gs) gs.style.display = 'none';
    heroName.innerHTML = '';
    text.split('').forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.display = 'inline-block';
      heroName.appendChild(span);
      const angle = (Math.random() - 0.5) * 120;
      const dist = 40 + Math.random() * 100;
      span.style.transition = 'none';
      span.style.transform = `translate(${Math.cos(angle * Math.PI / 180) * dist}px, ${Math.sin(angle * Math.PI / 180) * dist - 30}px) rotate(${(Math.random() - 0.5) * 40}deg)`;
      span.style.opacity = '0.3';
      setTimeout(() => {
        span.style.transition = 'transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.7s';
        span.style.transform = 'translate(0,0) rotate(0)'; span.style.opacity = '1';
      }, 30 + i * 25);
    });
    setTimeout(() => { heroName.innerHTML = '<span class="glitch" data-text="TRẦN HOÀNG NAM">TRẦN HOÀNG NAM</span>'; }, 1400);
    addTerminalLine('identity scatter protocol executed');
    unlockAchievement('scatter', 'IDENTITY SCATTER', 'Name explosion');
  }
  if (heroName) heroName.addEventListener('click', explodeName);

  const pageGlitch = document.getElementById('page-glitch');
  function triggerPageGlitch() {
    if (!pageGlitch) return;
    pageGlitch.classList.remove('active');
    void pageGlitch.offsetWidth;
    pageGlitch.classList.add('active');
    setTimeout(() => pageGlitch.classList.remove('active'), 400);
  }
  setInterval(() => { if (Math.random() > 0.7) triggerPageGlitch(); }, 8000 + Math.random() * 7000);

  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  let konamiIndex = 0;
  const overdriveBadge = document.getElementById('overdrive-badge');
  function activateOverdrive() {
    if (overdrive) return;
    overdrive = true;
    document.body.classList.add('overdrive');
    if (overdriveBadge) overdriveBadge.classList.add('active');
    CONFIG.particleCount = 160; CONFIG.speed = 0.65; CONFIG.maxDist = 160;
    initParticles(); initMatrix(); matrixLoop();
    addTerminalLine('⚠ OVERDRIVE MODE ACTIVATED');
    unlockAchievement('overdrive', 'OVERDRIVE', 'Beyond limits');
    triggerPageGlitch(); updateHUD();
    setTimeout(() => { if (overdrive) deactivateOverdrive(); }, 45000);
  }
  function deactivateOverdrive() {
    overdrive = false;
    document.body.classList.remove('overdrive');
    if (overdriveBadge) overdriveBadge.classList.remove('active');
    CONFIG.particleCount = 110; CONFIG.speed = 0.4; CONFIG.maxDist = 130;
    initParticles(); addTerminalLine('overdrive protocol terminated'); updateHUD();
  }
  document.addEventListener('keydown', e => {
    if (e.code === konami[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konami.length) { konamiIndex = 0; activateOverdrive(); }
    } else konamiIndex = 0;
  });
  let logoClicks = 0;
  const navLogo = document.getElementById('nav-logo');
  if (navLogo) {
    navLogo.addEventListener('click', () => {
      logoClicks++;
      if (logoClicks >= 2) { logoClicks = 0; activateOverdrive(); }
      setTimeout(() => { logoClicks = 0; }, 400);
    });
  }

  function showToast(title, msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<div class="toast-title">${title}</div>${msg || ''}`;
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3200);
  }
  function unlockAchievement(id, title, msg) {
    if (achievements.has(id)) return;
    achievements.add(id);
    showToast('ACHIEVEMENT', title + (msg ? ' — ' + msg : ''));
    addTerminalLine(`achievement unlocked: ${title}`);
    registerSecret(id, title, msg);
  }

  const hud = document.getElementById('hud');
  function updateHUD() {
    const modeEl = document.getElementById('hud-mode');
    const partEl = document.getElementById('hud-particles');
    const fpsEl = document.getElementById('hud-fps');
    const themeEl = document.getElementById('hud-theme');
    if (modeEl) modeEl.textContent = overdrive ? 'OVERDRIVE' : 'NOMINAL';
    if (partEl) partEl.textContent = particleCount;
    if (fpsEl) fpsEl.textContent = fps;
    if (themeEl) themeEl.textContent = currentTheme.toUpperCase();
  }
  function toggleHUD() {
    hudVisible = !hudVisible;
    if (hud) hud.classList.toggle('visible', hudVisible);
    if (hudVisible) unlockAchievement('hud', 'SYSTEM HUD', 'Telemetry online');
  }
  document.addEventListener('keydown', e => {
    if ((e.key === 'h' || e.key === 'H') && document.activeElement.tagName !== 'INPUT') toggleHUD();
  });

  function setTheme(name) {
    document.body.classList.remove('theme-magenta', 'theme-lime', 'theme-gold');
    if (overdrive) document.body.classList.add('overdrive');
    const map = { cyan: null, magenta: 'theme-magenta', lime: 'theme-lime', gold: 'theme-gold' };
    if (map[name]) document.body.classList.add(map[name]);
    currentTheme = name || 'cyan';
    addTerminalLine(`theme set: ${currentTheme}`);
    updateHUD();
    unlockAchievement('theme', 'CHROMATIC SHIFT', `Theme: ${currentTheme}`);
  }

  const cmdOverlay = document.getElementById('cmd-overlay');
  const cmdInput = document.getElementById('cmd-input');
  const cmdList = document.getElementById('cmd-list');
  const commands = [
    { id: 'overdrive', label: 'Activate Overdrive', desc: 'Matrix + chaos', run: () => activateOverdrive() },
    { id: 'theme-cyan', label: 'Theme: Cyan', desc: 'Default', run: () => setTheme('cyan') },
    { id: 'theme-magenta', label: 'Theme: Magenta', desc: 'Pink/purple', run: () => setTheme('magenta') },
    { id: 'theme-lime', label: 'Theme: Lime', desc: 'Matrix green', run: () => setTheme('lime') },
    { id: 'theme-gold', label: 'Theme: Gold', desc: 'Warm', run: () => setTheme('gold') },
    { id: 'hud', label: 'Toggle HUD', desc: 'Telemetry', run: () => toggleHUD() },
    { id: 'glitch', label: 'Trigger Glitch', desc: 'Burst', run: () => triggerPageGlitch() },
    { id: 'scatter', label: 'Scatter Name', desc: 'Explode', run: () => explodeName() },
    { id: 'home', label: 'Go Home', desc: 'Top', run: () => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'about', label: 'Go About', desc: '01', run: () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'info', label: 'Go Info', desc: '02', run: () => document.getElementById('info')?.scrollIntoView({ behavior: 'smooth' }) },
  ];
  let cmdActive = 0;
  let filteredCmds = commands;
  function openCmd() {
    if (!cmdOverlay) return;
    cmdOverlay.classList.add('open');
    if (cmdInput) { cmdInput.value = ''; cmdInput.focus(); }
    renderCmdList(commands); cmdActive = 0;
    unlockAchievement('cmd', 'COMMAND CENTER', 'Palette opened');
  }
  function closeCmd() { if (cmdOverlay) cmdOverlay.classList.remove('open'); }
  function renderCmdList(list) {
    if (!cmdList) return;
    filteredCmds = list;
    cmdList.innerHTML = list.map((c, i) => `<div class="cmd-item ${i === cmdActive ? 'active' : ''}" data-idx="${i}"><span>${c.label}</span><span class="cmd-desc">${c.desc}</span></div>`).join('');
    cmdList.querySelectorAll('.cmd-item').forEach(el => {
      el.addEventListener('click', () => { filteredCmds[+el.dataset.idx].run(); closeCmd(); });
    });
  }
  if (cmdInput) {
    cmdInput.addEventListener('input', () => {
      const q = cmdInput.value.toLowerCase();
      const filtered = commands.filter(c => c.label.toLowerCase().includes(q) || c.id.includes(q));
      cmdActive = 0; renderCmdList(filtered);
    });
    cmdInput.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); cmdActive = Math.min(cmdActive + 1, filteredCmds.length - 1); renderCmdList(filteredCmds); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cmdActive = Math.max(cmdActive - 1, 0); renderCmdList(filteredCmds); }
      else if (e.key === 'Enter') { e.preventDefault(); if (filteredCmds[cmdActive]) { filteredCmds[cmdActive].run(); closeCmd(); } }
      else if (e.key === 'Escape') closeCmd();
    });
  }
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openCmd(); }
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); openCmd(); }
    if (e.key === 'Escape') closeCmd();
  });
  const btnCmd = document.getElementById('btn-cmd');
  if (btnCmd) btnCmd.addEventListener('click', openCmd);
  if (cmdOverlay) cmdOverlay.addEventListener('click', e => { if (e.target === cmdOverlay) closeCmd(); });

  const bootScreen = document.getElementById('boot-screen');
  const bootLine = document.getElementById('boot-line');
  const bootBar = document.getElementById('boot-bar-fill');
  const bootMessages = ['INITIALIZING SYSTEM...', 'LOADING CORE MODULES...', 'PARTICLE ENGINE... OK', 'IDENTITY: TRAN HOANG NAM', 'LOCATION: NGHE AN', 'ALL SYSTEMS NOMINAL', 'WELCOME'];
  let bootDone = false;
  function finishBoot() {
    if (bootDone) return;
    bootDone = true;
    if (bootScreen) bootScreen.classList.add('done');
    unlockAchievement('boot', 'SYSTEM ONLINE', 'Boot complete');
  }
  function runBoot() {
    if (!bootScreen) { finishBoot(); return; }
    let i = 0;
    const step = () => {
      if (bootDone) return;
      if (i < bootMessages.length) {
        if (bootLine) bootLine.textContent = bootMessages[i];
        if (bootBar) bootBar.style.width = ((i + 1) / bootMessages.length * 100) + '%';
        i++; setTimeout(step, 400 + Math.random() * 200);
      } else setTimeout(finishBoot, 400);
    };
    step();
  }
  if (bootScreen) {
    bootScreen.addEventListener('click', finishBoot);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') finishBoot(); });
  }
  setTimeout(runBoot, 300);

  function updateSecretsUI() {
    const el = document.getElementById('secrets-badge');
    if (el) {
      el.textContent = '◆ ' + secretsFound + '/' + SECRET_TOTAL;
      if (secretsFound >= SECRET_TOTAL) el.classList.add('complete');
    }
  }
  const secretIds = new Set();
  function registerSecret(id, title, msg) {
    if (secretIds.has(id)) return;
    secretIds.add(id);
    secretsFound = secretIds.size;
    updateSecretsUI();
    if (typeof showToast === 'function') showToast('SECRET ' + secretsFound + '/' + SECRET_TOTAL, title);
    playBeep(880, 0.08);
  }
  updateSecretsUI();

  const btnMode = document.getElementById('btn-mode');
  const modes = ['repel', 'attract', 'orbit'];
  const modeLabels = { repel: 'REPEL', attract: 'ATTRACT', orbit: 'ORBIT' };
  if (btnMode) {
    btnMode.addEventListener('click', () => {
      const i = modes.indexOf(particleMode);
      particleMode = modes[(i + 1) % modes.length];
      btnMode.textContent = modeLabels[particleMode];
      btnMode.classList.add('active');
      showToast('PARTICLE MODE', modeLabels[particleMode]);
      playBeep(440, 0.05);
      registerSecret('mode', 'MODE SWITCH', particleMode);
    });
  }

  const birth = new Date(2009, 0, 2);
  function updateLiveAge() {
    const now = new Date();
    const ms = now - birth;
    const sec = Math.floor(ms / 1000);
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const years = Math.floor(days / 365.25);
    const ageYears = document.getElementById('age-years');
    const liveAge = document.getElementById('live-age');
    if (ageYears) ageYears.textContent = years;
    if (liveAge) liveAge.textContent = days.toLocaleString('vi-VN') + ' ngày · ' + hours + 'h ' + mins + 'm · ' + s + 's';
  }
  updateLiveAge(); setInterval(updateLiveAge, 1000);

  document.querySelectorAll('.about-card').forEach(card => {
    let clicks = 0;
    card.addEventListener('click', () => {
      clicks++;
      if (clicks >= 2) {
        clicks = 0;
        card.classList.toggle('flipped');
        playBeep(660, 0.06);
        registerSecret('flip', 'CARD FLIP', 'Backside revealed');
      }
      setTimeout(() => { clicks = 0; }, 350);
    });
  });

  const gCanvas = document.getElementById('graffiti-canvas');
  let gctx = null;
  if (gCanvas) {
    gctx = gCanvas.getContext('2d');
    function resizeG() { gCanvas.width = window.innerWidth; gCanvas.height = window.innerHeight; }
    resizeG(); window.addEventListener('resize', resizeG);
  }
  const graffitiMarks = [];
  function addGraffiti(x, y) {
    if (!gctx) return;
    const colors = ['#00f0ff', '#ff2a6d', '#a855f7', '#39ff14'];
    graffitiMarks.push({ x, y, r: 8 + Math.random() * 20, color: colors[Math.floor(Math.random() * colors.length)], life: 1, rot: Math.random() * Math.PI });
  }
  function drawGraffiti() {
    if (!gctx) return;
    gctx.clearRect(0, 0, gCanvas.width, gCanvas.height);
    for (let i = graffitiMarks.length - 1; i >= 0; i--) {
      const m = graffitiMarks[i];
      m.life -= 0.012;
      if (m.life <= 0) { graffitiMarks.splice(i, 1); continue; }
      gctx.save();
      gctx.translate(m.x, m.y); gctx.rotate(m.rot);
      gctx.globalAlpha = m.life * 0.7;
      gctx.strokeStyle = m.color; gctx.lineWidth = 2;
      gctx.shadowColor = m.color; gctx.shadowBlur = 12;
      gctx.beginPath(); gctx.moveTo(-m.r, 0); gctx.lineTo(m.r, 0); gctx.moveTo(0, -m.r); gctx.lineTo(0, m.r); gctx.stroke();
      gctx.beginPath(); gctx.arc(0, 0, m.r * 0.4, 0, Math.PI * 2); gctx.stroke();
      gctx.restore();
    }
    requestAnimationFrame(drawGraffiti);
  }
  drawGraffiti();
  window.addEventListener('mousedown', e => {
    if (e.target.closest('input, button, a, .terminal')) return;
    addGraffiti(e.clientX, e.clientY);
  });

  // glitch-storm (fast mouse shake) removed — causes lag

  let audioCtx = null;
  function playBeep(freq, dur) {
    if (!sfxOn) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square'; o.frequency.value = freq; g.gain.value = 0.04;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }
  const btnSfx = document.getElementById('btn-sfx');
  if (btnSfx) {
    btnSfx.addEventListener('click', () => {
      sfxOn = !sfxOn;
      btnSfx.classList.toggle('active', sfxOn);
      btnSfx.textContent = sfxOn ? '♪ ON' : '♪';
      if (sfxOn) { playBeep(520, 0.1); registerSecret('sfx', 'AUDIO LINK', 'Sound enabled'); }
    });
  }
  window.addEventListener('mousedown', () => playBeep(320 + Math.random() * 200, 0.04));

  window.addEventListener('resize', () => { resize(); initParticles(); if (overdrive) initMatrix(); });
  resize(); initParticles(); animateParticles(); updateScrollProgress(); updateHUD();
})();
