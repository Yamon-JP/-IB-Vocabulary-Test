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
  script.src = 'js/ess-final-training.js?v=2';
  document.head.appendChild(script);
})();
