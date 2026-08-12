(() => {
  Promise.all([0,1,2,3].map(i => fetch('script.b64.p' + i).then(r => r.text())))
    .then(parts => {
      const code = atob(parts.join(''));
      const s = document.createElement('script');
      s.textContent = code;
      document.body.appendChild(s);
    }).catch(err => console.error('load fail', err));
})();
