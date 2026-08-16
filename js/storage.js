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
  script.src = 'js/biology-final-training.js?v=3';
  document.head.appendChild(script);
})();
