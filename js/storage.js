const Storage = {
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  load(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }
};

(() => {
  if (document.getElementById('biology-final-training-script')) return;
  const script = document.createElement('script');
  script.id = 'biology-final-training-script';
  script.src = 'js/biology-final-training.js?v=4';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('ess-final-training-script')) return;
  const script = document.createElement('script');
  script.id = 'ess-final-training-script';
  script.src = 'js/ess-final-training.js?v=3';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('ess-final-training-2-script')) return;
  const script = document.createElement('script');
  script.id = 'ess-final-training-2-script';
  script.src = 'js/ess-final-training-2.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('math-ai-sl-loader-script')) return;
  const script = document.createElement('script');
  script.id = 'math-ai-sl-loader-script';
  script.src = 'js/math-ai-sl-loader.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('math-ai-sl-ui-guard-script')) return;
  const script = document.createElement('script');
  script.id = 'math-ai-sl-ui-guard-script';
  script.src = 'js/math-ai-sl-ui-guard.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('math-ai-sl-batch2-script')) return;
  const script = document.createElement('script');
  script.id = 'math-ai-sl-batch2-script';
  script.src = 'js/math-ai-sl-batch2.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('math-ai-sl-final-audit-script')) return;
  const script = document.createElement('script');
  script.id = 'math-ai-sl-final-audit-script';
  script.src = 'js/math-ai-sl-final-audit.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('v1-audit-fixes-script')) return;
  const script = document.createElement('script');
  script.id = 'v1-audit-fixes-script';
  script.src = 'js/v1-audit-fixes.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('math-home-icon-script')) return;
  const script = document.createElement('script');
  script.id = 'math-home-icon-script';
  script.src = 'js/math-home-icon.js?v=1';
  document.head.appendChild(script);
})();
