(() => {
  Promise.all([
    fetch('script.b64.1').then(r => r.text()),
    fetch('script.b64.2').then(r => r.text())
  ]).then(([a, b]) => {
    const code = atob(a + b);
    const s = document.createElement('script');
    s.textContent = code;
    document.body.appendChild(s);
  }).catch(err => console.error('load fail', err));
})();
