/* v8 features addon */
(() => {
  'use strict';
  const colors = ['#00f0ff', '#a855f7', '#ff2a6d', '#22d3ee', '#ffffff'];
  let paintMode = false, catchMode = false, catchScore = 0;
  let chargeLevel = 0, charging = false, chargeX = 0, chargeY = 0, chargeTimer = null;
  let paintStrokes = [], catchTargets = [];
  const chargeRing = document.getElementById('charge-ring');
  const gameBanner = document.getElementById('game-banner');
  const btnPaint = document.getElementById('btn-paint');
  const btnPlay = document.getElementById('btn-play');
  const aiPanel = document.getElementById('ai-panel');
  const aiBody = document.getElementById('ai-body');
  const paintCanvas = document.getElementById('paint-canvas');
  let pctx = null;
  if (paintCanvas) {
    pctx = paintCanvas.getContext('2d');
    const rp = () => { paintCanvas.width = innerWidth; paintCanvas.height = innerHeight; };
    rp(); addEventListener('resize', rp);
  }
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
  function burst(x, y, n, power) {
    if (!pctx) return;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, sp = 2 + power * 6;
      paintStrokes.push({
        points: [{ x: x, y: y }, { x: x + Math.cos(a) * sp * 8, y: y + Math.sin(a) * sp * 8 }],
        color: colors[i % colors.length],
        life: 0.9
      });
    }
  }
  addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (e.target.closest('input,button,a,.terminal,.cmd-overlay,.ai-panel,.ach-overlay,.nav')) return;
    if (paintMode || catchMode) return;
    charging = true; chargeLevel = 0; chargeX = e.clientX; chargeY = e.clientY;
    if (chargeRing) {
      chargeRing.style.left = chargeX + 'px'; chargeRing.style.top = chargeY + 'px';
      chargeRing.classList.add('active');
    }
    const tick = () => {
      if (!charging) return;
      chargeLevel = Math.min(100, chargeLevel + 2.2);
      const sc = 0.3 + chargeLevel / 100 * 4.5;
      if (chargeRing) {
        chargeRing.style.transform = 'translate(-50%,-50%) scale(' + sc + ')';
        chargeRing.style.borderColor = chargeLevel > 70 ? '#ff2a6d' : chargeLevel > 40 ? '#a855f7' : '#00f0ff';
      }
      const hc = document.getElementById('hud-charge');
      if (hc) hc.textContent = Math.floor(chargeLevel) + '%';
      if (chargeLevel >= 100) { release(); return; }
      chargeTimer = requestAnimationFrame(tick);
    };
    chargeTimer = requestAnimationFrame(tick);
  });
  addEventListener('mouseup', () => { if (charging) release(); });
  addEventListener('mousemove', e => {
    if (charging) {
      chargeX = e.clientX; chargeY = e.clientY;
      if (chargeRing) { chargeRing.style.left = chargeX + 'px'; chargeRing.style.top = chargeY + 'px'; }
    }
  });
  function release() {
    if (!charging) return;
    charging = false;
    if (chargeTimer) cancelAnimationFrame(chargeTimer);
    if (chargeRing) { chargeRing.classList.remove('active'); chargeRing.style.transform = 'translate(-50%,-50%) scale(0.3)'; }
    const hc = document.getElementById('hud-charge'); if (hc) hc.textContent = '0%';
    if (chargeLevel < 15) { chargeLevel = 0; return; }
    const power = chargeLevel / 100;
    burst(chargeX, chargeY, Math.floor(12 + power * 40), power);
    beep(200 + power * 600, 0.12);
    toast('CHARGE ' + Math.floor(chargeLevel) + '%', 'Released');
    chargeLevel = 0;
  }
  function setPaint(on) {
    paintMode = on;
    document.body.classList.toggle('paint-mode', on);
    if (btnPaint) { btnPaint.classList.toggle('active', on); btnPaint.textContent = on ? 'PAINT ON' : 'PAINT'; }
    if (on) { if (catchMode) setCatch(false); toast('PAINT', 'Drag to draw · P exit'); }
    else toast('PAINT', 'Off');
  }
  if (btnPaint) btnPaint.addEventListener('click', () => setPaint(!paintMode));
  let painting = false;
  addEventListener('mousedown', e => {
    if (!paintMode || e.button !== 0) return;
    if (e.target.closest('input,button,a,.terminal,.nav')) return;
    painting = true;
    paintStrokes.push({ points: [{ x: e.clientX, y: e.clientY }], color: colors[Math.floor(Math.random() * colors.length)], life: 1 });
  });
  addEventListener('mousemove', e => {
    if (!painting || !paintMode) return;
    const s = paintStrokes[paintStrokes.length - 1];
    if (s) s.points.push({ x: e.clientX, y: e.clientY });
  });
  addEventListener('mouseup', () => { painting = false; });
  function paintLoop() {
    if (pctx) {
      pctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
      for (let i = paintStrokes.length - 1; i >= 0; i--) {
        const s = paintStrokes[i];
        s.life -= 0.0015;
        if (s.life <= 0 || s.points.length < 2) { paintStrokes.splice(i, 1); continue; }
        pctx.save();
        pctx.globalAlpha = s.life * 0.85;
        pctx.strokeStyle = s.color;
        pctx.lineWidth = 2.5;
        pctx.shadowColor = s.color;
        pctx.shadowBlur = 12;
        pctx.lineCap = 'round';
        pctx.beginPath();
        pctx.moveTo(s.points[0].x, s.points[0].y);
        for (let j = 1; j < s.points.length; j++) pctx.lineTo(s.points[j].x, s.points[j].y);
        pctx.stroke();
        pctx.restore();
      }
    }
    requestAnimationFrame(paintLoop);
  }
  paintLoop();
  function setCatch(on) {
    catchMode = on;
    if (btnPlay) { btnPlay.classList.toggle('active', on); btnPlay.textContent = on ? 'PLAY ON' : 'PLAY'; }
    if (gameBanner) gameBanner.classList.toggle('active', on);
    if (on) {
      if (paintMode) setPaint(false);
      catchScore = 0; updateScore();
      toast('CATCH', 'Touch orbs · X exit');
      spawn();
    } else {
      catchTargets.forEach(t => t.el.remove());
      catchTargets = [];
      toast('CATCH', 'Score: ' + catchScore);
    }
  }
  if (btnPlay) btnPlay.addEventListener('click', () => setCatch(!catchMode));
  function updateScore() {
    const el = document.getElementById('hud-score');
    if (el) el.textContent = catchScore;
  }
  function spawn() {
    if (!catchMode) return;
    const el = document.createElement('div');
    el.className = 'catch-target';
    const color = colors[Math.floor(Math.random() * colors.length)];
    el.style.color = color; el.style.background = color;
    const x = 40 + Math.random() * (innerWidth - 80);
    let y = -20;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    document.body.appendChild(el);
    catchTargets.push({ el: el, x: x, y: y, speed: 1.5 + Math.random() * 2.5 });
    setTimeout(spawn, 600 + Math.random() * 900);
  }
  let mx = null, my = null;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function catchLoop() {
    if (catchMode) {
      for (let i = catchTargets.length - 1; i >= 0; i--) {
        const t = catchTargets[i];
        t.y += t.speed;
        t.el.style.top = t.y + 'px';
        if (t.y > innerHeight + 30) { t.el.remove(); catchTargets.splice(i, 1); continue; }
        if (mx != null && Math.hypot(mx - t.x, my - t.y) < 28) {
          catchScore += 10; updateScore();
          burst(t.x, t.y, 6, 0.5);
          beep(500 + Math.random() * 400, 0.05);
          t.el.remove(); catchTargets.splice(i, 1);
          if (catchScore === 100) toast('SCORE 100', 'Nice aim');
        }
      }
    }
    requestAnimationFrame(catchLoop);
  }
  catchLoop();
  const ANS = {
    who: 'Trần Hoàng Nam — creator, explorer, builder. Born 2009.',
    from: 'Nghệ An, Việt Nam. Roots deep, eyes on the horizon.',
    age: 'Live clock on this page. Born 02/01/2009.',
    goal: 'Code. Create. Conquer. Stay sharp. Stay rare.',
    skill: 'Web, design, systems thinking. Always learning.'
  };
  function openAI() {
    if (!aiPanel) return;
    aiPanel.classList.add('open');
    if (aiBody && !aiBody.dataset.init) {
      aiBody.dataset.init = '1';
      line('sys', 'THN brief online. Pick a query.');
    }
  }
  function closeAI() { if (aiPanel) aiPanel.classList.remove('open'); }
  function line(type, text) {
    if (!aiBody) return;
    const d = document.createElement('div');
    d.className = 'ai-line ' + type;
    d.textContent = (type === 'sys' ? '> ' : '? ') + text;
    aiBody.appendChild(d);
    aiBody.scrollTop = aiBody.scrollHeight;
  }
  document.querySelectorAll('.ai-actions button').forEach(btn => {
    btn.addEventListener('click', () => {
      line('user', btn.textContent);
      setTimeout(() => { line('sys', ANS[btn.dataset.q] || '...'); beep(600, 0.06); }, 300);
    });
  });
  const aiClose = document.getElementById('ai-close');
  if (aiClose) aiClose.addEventListener('click', closeAI);
  addEventListener('keydown', e => {
    if (document.activeElement.tagName === 'INPUT') return;
    if (e.key === 'p' || e.key === 'P') { e.preventDefault(); setPaint(!paintMode); }
    if (e.key === 'x' || e.key === 'X') { e.preventDefault(); setCatch(!catchMode); }
    if (e.key === 'q' || e.key === 'Q') {
      e.preventDefault();
      if (aiPanel && aiPanel.classList.contains('open')) closeAI(); else openAI();
    }
  });
})();
