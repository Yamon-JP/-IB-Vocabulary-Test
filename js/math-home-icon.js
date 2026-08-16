// Home-only Math AI SL subject badge. Keeps exam modules and course coverage untouched.
(() => {
  const MathHomeIcon = window.MathHomeIcon = {
    installed: false,

    ensureStyles() {
      if (document.getElementById('math-home-icon-style')) return;
      const style = document.createElement('style');
      style.id = 'math-home-icon-style';
      style.textContent = `
        /* Match the existing Aa / BIO / ESS subject badges exactly. */
        #subject-math-ai-sl::after {
          content: "MATH";
          color: #1d4ed8;
          background: #bfdbfe;
          letter-spacing: -.04em;
        }
      `;
      document.head.appendChild(style);
    },

    decorate() {
      const button = document.getElementById('subject-math-ai-sl');
      if (!button) return false;

      button.setAttribute('aria-label', 'Math AI SL');

      // Remove the previous image-based icon if an old DOM instance is still present.
      const oldIcon = button.querySelector('.math-home-subject-icon');
      if (oldIcon) oldIcon.remove();
      button.classList.remove('math-home-icon-card');

      const subtitle = button.querySelector('small');
      if (subtitle) subtitle.textContent = 'Practice';

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
          if (!this.installed) console.warn('Math Home badge could not initialize. Existing Home cards remain available.');
        }
      }, 50);
    }
  };

  MathHomeIcon.boot();
})();
