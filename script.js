/* ============================================
   TRẦN HOÀNG NAM — INTERACTIONS v3
   New features: Terminal · Scramble · Konami
   Overdrive · Matrix · Name explode · Clock
   Random glitch · Scroll progress
============================================ */

(() => {
  'use strict';

  let overdrive = false;
  let mouse = { x: null, y: null };

  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let width, height, particles, animationId;
  let bursts = [];

  const CONFIG = {
    particleCount: 110,
    maxDist: 130,
    speed: 0.4,
    particleSize: 1.4,
    lineOpacity: 0.14,
    mouseRadius: 180,
    colors: ['#00f0ff', '#a855f7', '#ff2a6d', '#22d3ee', '#ffffff']
  };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if (matrixCanvas) {
      matrixCanvas.width = width;
      matrixCanvas.height = height;
    }
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * CONFIG.speed;
      this.vy = (Math.random() - 0.5) * CONFIG.speed;
      this.size = CONFIG.particleSize + Math.random() * 1.4;
      this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      this.alpha = 0.25 + Math.random() * 0.55;
      if (!init) {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) this.x = 0;
        else if (edge === 1) this.x = width;
        else if (edge === 2) this.y = 0;
        else this.y = height;
      }
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
      if (mouse.x !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.mouseRadius && dist > 0) {
          const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius;
          const dir = overdrive ? -1 : 1;
          this.vx += (dx / dist) * force * 0.55 * dir;
          this.vy += (dy / dist) * force * 0.55 * dir;
        }
      }
      this.vx *= 0.992;
      this.vy *= 0.992;
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed < 0.08) {
        this.vx += (Math.random() - 0.5) * 0.12;
        this.vy += (Math.random() - 0.5) * 0.12;
      }
      if (speed > (overdrive ? 5 : 3.5)) {
        this.vx *= 0.9;
        this.vy *= 0.9;
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha * 0.12;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  class BurstParticle {
    constructor(x, y) {
      this.x = x; this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.size = 1.5 + Math.random() * 2.5;
      this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      this.life = 1;
      this.decay = 0.015 + Math.random() * 0.02;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.vx *= 0.96; this.vy *= 0.96;
      this.life -= this.decay;
    }
    draw() {
      if (this.life <= 0) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.life * 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function initParticles() {
    particles = [];
    const count = Math.min(CONFIG.particleCount, Math.floor((width * height) / 10000));
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.maxDist) {
          const opacity = (1 - dist / CONFIG.maxDist) * CONFIG.lineOpacity;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
      if (mouse.x !== null) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.mouseRadius * 0.85) {
          const opacity = (1 - dist / (CONFIG.mouseRadius * 0.85)) * 0.25;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
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
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }
    animationId = requestAnimationFrame(animateParticles);
  }

  const matrixCanvas = document.getElementById('matrix-canvas');
  const mctx = matrixCanvas ? matrixCanvas.getContext('2d') : null;
  const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEF<>[]{}#$%&';
  let matrixColumns = [];

  function initMatrix() {
    if (!mctx) return;
    const fontSize = 14;
    const cols = Math.floor(width / fontSize);
    matrixColumns = Array(cols).fill(0).map(() => Math.random() * -50);
  }

  function drawMatrix() {
    if (!overdrive || !mctx) return;
    mctx.fillStyle = 'rgba(3, 3, 6, 0.08)';
    mctx.fillRect(0, 0, width, height);
    mctx.font = '13px monospace';
    matrixColumns.forEach((y, i) => {
      const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      const x = i * 14;
      mctx.fillStyle = Math.random() > 0.95 ? '#fff' : '#39ff14';
      mctx.fillText(char, x, y * 14);
      if (y * 14 > height && Math.random() > 0.975) matrixColumns[i] = 0;
      else matrixColumns[i]++;
    });
  }

  function matrixLoop() {
    drawMatrix();
    if (overdrive) requestAnimationFrame(matrixLoop);
  }

  const shapesContainer = document.getElementById('shapes');
  const shapeTypes = ['hex', 'triangle', 'circle', 'square'];

  function spawnShape() {
    if (!shapesContainer) return;
    const el = document.createElement('div');
    const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    el.className = `shape ${type}`;
    const size = 20 + Math.random() * 50;
    el.style.left = Math.random() * 100 + '%';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    if (type === 'circle') {
      el.style.width = size + 'px';
      el.style.height = size + 'px';
    }
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
  const TRAIL_COUNT = 12;

  for (let i = 0; i < TRAIL_COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'trail-dot';
    document.body.appendChild(dot);
    trailDots.push({ el: dot, x: 0, y: 0 });
  }

  document.addEventListener('mousemove', e => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (cursor) {
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
    }
  });

  window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

  function updateFollower() {
    if (!follower) return;
    followerX += (cursorX - followerX) * 0.12;
    followerY += (cursorY - followerY) * 0.12;
    follower.style.left = followerX + 'px';
    follower.style.top = followerY + 'px';
    let prevX = cursorX, prevY = cursorY;
    trailDots.forEach((dot, i) => {
      const lag = 0.2 + i * 0.04;
      dot.x += (prevX - dot.x) * lag;
      dot.y += (prevY - dot.y) * lag;
      dot.el.style.left = dot.x + 'px';
      dot.el.style.top = dot.y + 'px';
      dot.el.style.opacity = (1 - i / TRAIL_COUNT) * 0.5;
      dot.el.style.transform = `translate(-50%, -50%) scale(${1 - i / TRAIL_COUNT * 0.7})`;
      prevX = dot.x; prevY = dot.y;
    });
    requestAnimationFrame(updateFollower);
  }
  updateFollower();

  document.querySelectorAll('a, button, .info-item, .about-card, .nav-logo, .terminal-header').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (cursor) cursor.classList.add('hover');
      if (follower) follower.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      if (cursor) cursor.classList.remove('hover');
      if (follower) follower.classList.remove('hover');
    });
  });

  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  });

  window.addEventListener('mousedown', e => {
    for (let i = 0; i < (overdrive ? 28 : 18); i++) {
      bursts.push(new BurstParticle(e.clientX, e.clientY));
    }
    createRipple(e.clientX, e.clientY);
    if (cursor) {
      cursor.classList.add('click');
      setTimeout(() => cursor.classList.remove('click'), 200);
    }
  });

  function createRipple(x, y) {
    const el = document.createElement('div');
    el.className = 'ripple';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.width = '120px';
    el.style.height = '120px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  const typedEl = document.querySelector('.typed-text');
  const phrases = [
    'Creator • Explorer • Builder',
    'Nghệ An → Thế giới',
    'Code. Create. Conquer.',
    'Future is now.',
    'Stay sharp. Stay rare.',
    'Try Konami code ↑↑↓↓←→←→BA'
  ];
  let phraseIndex = 0, charIndex = 0, isDeleting = false, typeSpeed = 75;

  function type() {
    if (!typedEl) return;
    const current = phrases[phraseIndex];
    if (isDeleting) {
      typedEl.textContent = current.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 35;
    } else {
      typedEl.textContent = current.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 75;
    }
    if (!isDeleting && charIndex === current.length) {
      isDeleting = true;
      typeSpeed = 2000;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 350;
    }
    setTimeout(type, typeSpeed);
  }
  setTimeout(type, 1400);

  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');
  const scrollProgress = document.getElementById('scroll-progress');

  function updateNav() {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 140) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === current);
    });
  }

  function updateScrollProgress() {
    if (!scrollProgress) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? (window.scrollY / h) * 100 : 0;
    scrollProgress.style.width = p + '%';
  }

  window.addEventListener('scroll', () => {
    updateNav();
    updateScrollProgress();
  });

  const revealEls = document.querySelectorAll('.about-card, .info-item, .section-header');
  revealEls.forEach(el => el.classList.add('reveal'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  revealEls.forEach(el => observer.observe(el));

  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -11;
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 11;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  });

  const orbs = document.querySelectorAll('.orb');
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    orbs.forEach((orb, i) => {
      orb.style.transform = `translateY(${scrolled * (0.15 + i * 0.08)}px)`;
    });
  });

  const clockEl = document.getElementById('nav-clock');
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}:${s}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  const terminalBody = document.getElementById('terminal-body');
  const terminal = document.getElementById('terminal');
  const terminalMessages = [
    'boot sequence initiated...',
    'loading core modules... OK',
    'particle engine online',
    'identity: TRAN HOANG NAM',
    'location: NGHE AN // VN',
    'status: ALL SYSTEMS NOMINAL',
    'awaiting input...',
    'hint: try the Konami code',
    'scanning environment...',
    'no threats detected',
    'memory allocated: 64MB',
    'render pipeline active',
    'user presence confirmed',
    'overdrive protocol available',
    'stay sharp. stay rare.'
  ];
  let termIndex = 0;

  function addTerminalLine(text) {
    if (!terminalBody) return;
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = `<span class="prefix">></span>${text}`;
    terminalBody.appendChild(line);
    terminalBody.scrollTop = terminalBody.scrollHeight;
    while (terminalBody.children.length > 12) {
      terminalBody.removeChild(terminalBody.firstChild);
    }
  }

  function runTerminal() {
    addTerminalLine(terminalMessages[termIndex % terminalMessages.length]);
    termIndex++;
    setTimeout(runTerminal, 2800 + Math.random() * 2200);
  }
  setTimeout(runTerminal, 1800);

  if (terminal) {
    const th = terminal.querySelector('.terminal-header');
    if (th) th.addEventListener('click', () => terminal.classList.toggle('expanded'));
  }

  const chars = '!<>-_\\/[]{}—=+*^?#________';
  function scrambleText(el) {
    const original = el.dataset.text || el.textContent;
    let frame = 0;
    const total = original.length * 3;
    const interval = setInterval(() => {
      el.textContent = original
        .split('')
        .map((ch, i) => {
          if (i < frame / 3) return original[i];
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');
      frame++;
      if (frame >= total) {
        clearInterval(interval);
        el.textContent = original;
      }
    }, 28);
  }

  document.querySelectorAll('.scramble-target').forEach(el => {
    el.addEventListener('mouseenter', () => scrambleText(el));
  });

  const heroName = document.getElementById('hero-name');
  function explodeName() {
    if (!heroName) return;
    const text = 'TRẦN HOÀNG NAM';
    const glitchSpan = heroName.querySelector('.glitch');
    if (glitchSpan) glitchSpan.style.display = 'none';
    heroName.innerHTML = '';
    text.split('').forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.display = 'inline-block';
      heroName.appendChild(span);
      const angle = (Math.random() - 0.5) * 120;
      const dist = 40 + Math.random() * 100;
      const tx = Math.cos(angle * Math.PI / 180) * dist;
      const ty = Math.sin(angle * Math.PI / 180) * dist - 30;
      span.style.transition = 'none';
      span.style.transform = `translate(${tx}px, ${ty}px) rotate(${(Math.random() - 0.5) * 40}deg)`;
      span.style.opacity = '0.3';
      setTimeout(() => {
        span.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.7s';
        span.style.transform = 'translate(0, 0) rotate(0)';
        span.style.opacity = '1';
      }, 30 + i * 25);
    });
    setTimeout(() => {
      heroName.innerHTML = `<span class="glitch" data-text="TRẦN HOÀNG NAM">TRẦN HOÀNG NAM</span>`;
    }, 1400);
    addTerminalLine('identity scatter protocol executed');
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
  setInterval(() => {
    if (Math.random() > 0.7) triggerPageGlitch();
  }, 8000 + Math.random() * 7000);

  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  let konamiIndex = 0;
  const overdriveBadge = document.getElementById('overdrive-badge');

  function activateOverdrive() {
    if (overdrive) return;
    overdrive = true;
    document.body.classList.add('overdrive');
    if (overdriveBadge) overdriveBadge.classList.add('active');
    CONFIG.particleCount = 160;
    CONFIG.speed = 0.65;
    CONFIG.maxDist = 160;
    initParticles();
    initMatrix();
    matrixLoop();
    addTerminalLine('⚠ OVERDRIVE MODE ACTIVATED');
    addTerminalLine('particle density increased');
    addTerminalLine('matrix rain online');
    addTerminalLine('gravity inverted');
    triggerPageGlitch();
    setTimeout(() => {
      if (overdrive) deactivateOverdrive();
    }, 45000);
  }

  function deactivateOverdrive() {
    overdrive = false;
    document.body.classList.remove('overdrive');
    if (overdriveBadge) overdriveBadge.classList.remove('active');
    CONFIG.particleCount = 110;
    CONFIG.speed = 0.4;
    CONFIG.maxDist = 130;
    initParticles();
    addTerminalLine('overdrive protocol terminated');
    addTerminalLine('systems returning to nominal');
  }

  document.addEventListener('keydown', e => {
    if (e.code === konami[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konami.length) {
        konamiIndex = 0;
        activateOverdrive();
      }
    } else {
      konamiIndex = 0;
    }
  });

  let logoClicks = 0;
  const navLogo = document.getElementById('nav-logo');
  if (navLogo) {
    navLogo.addEventListener('click', () => {
      logoClicks++;
      if (logoClicks >= 2) {
        logoClicks = 0;
        activateOverdrive();
      }
      setTimeout(() => { logoClicks = 0; }, 400);
    });
  }

  window.addEventListener('resize', () => {
    resize();
    initParticles();
    if (overdrive) initMatrix();
  });

  resize();
  initParticles();
  animateParticles();
  updateScrollProgress();

})();
