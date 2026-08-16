// Home-only Math AI SL subject icon. Keeps exam modules and course coverage untouched.
(() => {
  const MathHomeIcon = window.MathHomeIcon = {
    installed: false,

    ensureStyles() {
      if (document.getElementById('math-home-icon-style')) return;
      const style = document.createElement('style');
      style.id = 'math-home-icon-style';
      style.textContent = `
        #subject-math-ai-sl.math-home-icon-card {
          align-items: center;
          justify-content: center;
          padding: 18px;
        }
        #subject-math-ai-sl .math-home-subject-icon {
          display: block;
          width: 82px;
          height: 82px;
          border-radius: 18px;
          object-fit: cover;
          flex: 0 0 auto;
        }
        @media (max-width: 800px) {
          #subject-math-ai-sl .math-home-subject-icon {
            width: 72px;
            height: 72px;
            border-radius: 16px;
          }
        }
      `;
      document.head.appendChild(style);
    },

    decorate() {
      const button = document.getElementById('subject-math-ai-sl');
      if (!button) return false;
      button.classList.add('math-home-icon-card');
      button.setAttribute('aria-label', 'Math AI SL');
      button.innerHTML = '<img class="math-home-subject-icon" src="assets/math-home-icon.svg?v=1" alt="MATH">';
      return true;
    },

    install() {
      if (this.installed) return true;
      if (typeof App === 'undefined' || typeof MathAISL === 'undefined' || !MathAISL.installed) return false;

      this.ensureStyles();
      const originalRenderSubjectCards = App.renderSubjectCards;
      App.renderSubjectCards = function(...args) {
        const result = originalRenderSubjectCards.apply(this, args);
        MathHomeIcon.decorate();
        return result;
      };

      this.installed = true;
      this.decorate();
      return true;
    },

    boot() {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (this.install() || attempts >= 400) {
          window.clearInterval(timer);
          if (!this.installed) console.warn('Math Home icon could not initialize. Existing Home cards remain available.');
        }
      }, 50);
    }
  };

  MathHomeIcon.boot();
})();
