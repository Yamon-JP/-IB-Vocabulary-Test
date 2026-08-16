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
          position: relative;
        }
        #subject-math-ai-sl .math-home-subject-icon {
          position: absolute;
          left: 18px;
          top: 18px;
          display: block;
          width: 46px;
          height: 46px;
          border-radius: 13px;
          object-fit: cover;
        }
        @media (max-width: 800px) {
          #subject-math-ai-sl .math-home-subject-icon {
            width: 42px;
            height: 42px;
            border-radius: 12px;
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
      if (!button.querySelector('.math-home-subject-icon')) {
        const icon = document.createElement('img');
        icon.className = 'math-home-subject-icon';
        icon.src = 'assets/math-home-icon.svg?v=1';
        icon.alt = '';
        icon.setAttribute('aria-hidden', 'true');
        button.prepend(icon);
      }
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
