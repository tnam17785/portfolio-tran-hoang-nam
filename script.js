/* ============================================
   TRẦN HOÀNG NAM — INTERACTIONS v2
   Particles • Trails • Magnetic • Bursts
============================================ */

(() => {
  'use strict';

  // ---------- Canvas: Enhanced Particle System ----------
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let width, height, particles, mouse, animationId;
  let trails = [];

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
  }

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(init = false) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * CONFIG.speed;
      this.vy = (Math.random() - 0.5) * CONFIG.speed;
      this.size = CONFIG.particleSize + Math.random() * 1.4;
      this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      this.alpha = 0.25 + Math.random() * 0.55;
      this.life = 1;
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
          this.vx += (dx / dist) * force * 0.55;
          this.vy += (dy / dist) * force * 0.55;
        }
      }

      this.vx *= 0.992;
      this.vy *= 0.992;

      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed < 0.08) {
        this.vx += (Math.random() - 0.5) * 0.12;
        this.vy += (Math.random() - 0.5) * 0.12;
      }
      if (speed > 3.5) {
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

      // soft glow
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
      this.x = x;
      this.y = y;
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
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.96;
      this.vy *= 0.96;
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

  let bursts = [];

  function initParticles() {
    particles = [];
    const count = Math.min(CONFIG.particleCount, Math.floor((width * height) / 10000));
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
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
      // connect to mouse
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

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });
    drawConnections();

    // bursts
    bursts = bursts.filter(b => b.life > 0);
    bursts.forEach(b => {
      b.update();
      b.draw();
    });

    // mouse glow core
    if (mouse.x !== null) {
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 140);
      g.addColorStop(0, 'rgba(0, 240, 255, 0.09)');
      g.addColorStop(0.4, 'rgba(168, 85, 247, 0.04)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }

    animationId = requestAnimationFrame(animate);
  }

  mouse = { x: null, y: null };

  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Click burst + ripple
  window.addEventListener('mousedown', e => {
    for (let i = 0; i < 18; i++) {
      bursts.push(new BurstParticle(e.clientX, e.clientY));
    }
    createRipple(e.clientX, e.clientY);
    cursor.classList.add('click');
    setTimeout(() => cursor.classList.remove('click'), 200);
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

  resize();
  initParticles();
  animate();

  // ---------- Floating Shapes ----------
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
    el.style.animationDelay = '0s';
    shapesContainer.appendChild(el);
    setTimeout(() => el.remove(), 30000);
  }

  // spawn a few initially and keep spawning
  for (let i = 0; i < 6; i++) setTimeout(spawnShape, i * 800);
  setInterval(spawnShape, 2800);

  // ---------- Custom Cursor + Trail ----------
  const cursor = document.querySelector('.cursor');
  const follower = document.querySelector('.cursor-follower');
  let cursorX = 0, cursorY = 0;
  let followerX = 0, followerY = 0;
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
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
  });

  function updateFollower() {
    followerX += (cursorX - followerX) * 0.12;
    followerY += (cursorY - followerY) * 0.12;
    follower.style.left = followerX + 'px';
    follower.style.top = followerY + 'px';

    // trail
    let prevX = cursorX, prevY = cursorY;
    trailDots.forEach((dot, i) => {
      const lag = 0.2 + i * 0.04;
      dot.x += (prevX - dot.x) * lag;
      dot.y += (prevY - dot.y) * lag;
      dot.el.style.left = dot.x + 'px';
      dot.el.style.top = dot.y + 'px';
      dot.el.style.opacity = (1 - i / TRAIL_COUNT) * 0.5;
      dot.el.style.transform = `translate(-50%, -50%) scale(${1 - i / TRAIL_COUNT * 0.7})`;
      prevX = dot.x;
      prevY = dot.y;
    });

    requestAnimationFrame(updateFollower);
  }
  updateFollower();

  // hover states
  const hoverTargets = document.querySelectorAll('a, button, .info-item, .about-card, .nav-logo');
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hover');
      follower.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover');
      follower.classList.remove('hover');
    });
  });

  // ---------- Magnetic Effect ----------
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

  // ---------- Typing Effect ----------
  const typedEl = document.querySelector('.typed-text');
  const phrases = [
    'Creator • Explorer • Builder',
    'Nghệ An → Thế giới',
    'Code. Create. Conquer.',
    'Future is now.',
    'Stay sharp. Stay rare.'
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 75;

  function type() {
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

  // ---------- Nav Active ----------
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateNav() {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 140;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === current);
    });
  }
  window.addEventListener('scroll', updateNav);

  // ---------- Scroll Reveal ----------
  const revealEls = document.querySelectorAll('.about-card, .info-item, .section-header');
  revealEls.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
  );
  revealEls.forEach(el => observer.observe(el));

  // ---------- 3D Tilt (stronger) ----------
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -11;
      const rotateY = ((x - centerX) / centerX) * 11;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  });

  // ---------- Parallax on scroll for orbs ----------
  const orbs = document.querySelectorAll('.orb');
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    orbs.forEach((orb, i) => {
      const speed = 0.15 + i * 0.08;
      orb.style.transform = `translateY(${scrolled * speed}px)`;
    });
  });

})();
