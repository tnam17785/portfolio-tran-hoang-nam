/* v9 features */
(() => {
  'use strict';
  let spotlightOn = false, beatOn = false, quoteRainOn = false;
  let beatPhase = 0;
  const quotes = [
    'Stay sharp. Stay rare.',
    'Code. Create. Conquer.',
    'Nghệ An → Thế giới',
    'Glitch is a feature.',
    'Future is compiled.',
    'Trần Hoàng Nam',
    'THN // ONLINE'
  ];

  const spot = document.createElement('div');
  spot.id = 'spotlight-overlay';
  document.body.appendChild(spot);

  const quoteLayer = document.createElement('div');
  quoteLayer.id = 'quote-layer';
  document.body.appendChild(quoteLayer);

  function ensureBtn(id, label, title) {
    if (document.getElementById(id)) return document.getElementById(id);
    const nav = document.querySelector('.nav-right');
    if (!nav) return null;
    const b = document.createElement('button');
    b.className = 'nav-mode';
    b.id = id;
    b.title = title;
    b.textContent = label;
    const cmd = document.getElementById('btn-cmd');
    if (cmd) nav.insertBefore(b, cmd);
    else nav.appendChild(b);
    return b;
  }
  const btnSpot = ensureBtn('btn-spot', 'SPOT', 'Spotlight (L)');
  const btnBeat = ensureBtn('btn-beat', 'BEAT', 'Beat pulse (B)');
  const btnCard = ensureBtn('btn-card', 'CARD', 'Download profile card (D)');

  function toast(title, msg) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<div class="toast-title">' + title + '</div>' + (msg || '');
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2800);
  }
  function beep(f, d) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square'; o.frequency.value = f; g.gain.value = 0.03;
      o.connect(g); g.connect(ac.destination); o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d);
      o.stop(ac.currentTime + d);
    } catch (e) {}
  }

  function setSpot(on) {
    spotlightOn = on;
    document.body.classList.toggle('spotlight-on', on);
    if (btnSpot) { btnSpot.classList.toggle('active', on); btnSpot.textContent = on ? 'SPOT ON' : 'SPOT'; }
    if (on) toast('SPOTLIGHT', 'Cursor is the only light · L exit');
    else toast('SPOTLIGHT', 'Off');
  }
  if (btnSpot) btnSpot.addEventListener('click', () => setSpot(!spotlightOn));
  addEventListener('mousemove', e => {
    if (!spotlightOn) return;
    spot.style.setProperty('--sx', e.clientX + 'px');
    spot.style.setProperty('--sy', e.clientY + 'px');
  });

  function setBeat(on) {
    beatOn = on;
    document.body.classList.toggle('beat-on', on);
    if (btnBeat) { btnBeat.classList.toggle('active', on); btnBeat.textContent = on ? 'BEAT ON' : 'BEAT'; }
    if (on) { toast('BEAT', 'Pulse active · B exit'); beep(220, 0.08); }
    else toast('BEAT', 'Off');
  }
  if (btnBeat) btnBeat.addEventListener('click', () => setBeat(!beatOn));
  function beatLoop() {
    if (beatOn) {
      beatPhase = (beatPhase + 0.08) % (Math.PI * 2);
      const pulse = 0.5 + Math.sin(beatPhase) * 0.5;
      document.body.style.setProperty('--beat', pulse.toFixed(3));
      if (Math.sin(beatPhase) > 0.95) beep(180 + pulse * 80, 0.04);
    }
    requestAnimationFrame(beatLoop);
  }
  beatLoop();

  function shake(ms) {
    document.body.classList.add('screen-shake');
    setTimeout(() => document.body.classList.remove('screen-shake'), ms || 450);
    toast('SHAKE', 'System jolt');
    beep(100, 0.1);
  }

  function downloadCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 450;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 800, 450);
    g.addColorStop(0, '#030306');
    g.addColorStop(1, '#0a1020');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 800, 450);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 752, 402);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 28px Orbitron, sans-serif';
    ctx.fillText('THN', 48, 80);
    ctx.fillStyle = '#eef0f5';
    ctx.font = 'bold 42px Orbitron, sans-serif';
    ctx.fillText('TRAN HOANG NAM', 48, 150);
    ctx.fillStyle = '#7a7a8c';
    ctx.font = '22px Rajdhani, sans-serif';
    ctx.fillText('02/01/2009  ·  Nghe An, Viet Nam', 48, 200);
    ctx.fillStyle = '#00f0ff';
    ctx.font = '20px Share Tech Mono, monospace';
    ctx.fillText('Stay sharp. Stay rare.', 48, 280);
    ctx.fillStyle = '#ff2a6d';
    ctx.font = '16px monospace';
    ctx.fillText('portfolio-tran-hoang-nam', 48, 380);
    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'THN-profile-card.png';
      a.click();
      URL.revokeObjectURL(a.href);
      toast('CARD', 'Downloaded PNG');
      beep(660, 0.08);
    });
  }
  if (btnCard) btnCard.addEventListener('click', downloadCard);

  function setQuoteRain(on) {
    quoteRainOn = on;
    if (on) {
      toast('QUOTE RAIN', 'R to stop');
      spawnQuote();
    } else {
      quoteLayer.innerHTML = '';
      toast('QUOTE RAIN', 'Off');
    }
  }
  function spawnQuote() {
    if (!quoteRainOn) return;
    const el = document.createElement('div');
    el.className = 'falling-quote';
    el.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    el.style.left = Math.random() * 85 + '%';
    el.style.animationDuration = (4 + Math.random() * 5) + 's';
    el.style.color = ['#00f0ff', '#ff2a6d', '#a855f7', '#39ff14'][Math.floor(Math.random() * 4)];
    quoteLayer.appendChild(el);
    setTimeout(() => el.remove(), 9000);
    setTimeout(spawnQuote, 700 + Math.random() * 1200);
  }

  addEventListener('keydown', e => {
    if (document.activeElement.tagName === 'INPUT') return;
    if (e.key === 'l' || e.key === 'L') { e.preventDefault(); setSpot(!spotlightOn); }
    if (e.key === 'b' || e.key === 'B') { e.preventDefault(); setBeat(!beatOn); }
    if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); shake(500); }
    if (e.key === 'd' || e.key === 'D') { e.preventDefault(); downloadCard(); }
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); setQuoteRain(!quoteRainOn); }
  });

  const hint = document.querySelector('.secret-hint');
  if (hint) hint.textContent = 'Hold-click · P · X · Q · L spot · B beat · D card · R rain · Z shake';
})();
