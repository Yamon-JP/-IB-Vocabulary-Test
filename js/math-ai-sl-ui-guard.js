// Keeps Math-only UI state from leaking into stable subject screens; Math vocabulary stays hidden.
(() => {
  const install = (attempt = 0) => {
    if (typeof App === 'undefined' || typeof MathAISL === 'undefined' || !MathAISL.installed) {
      if (attempt < 400) setTimeout(() => install(attempt + 1), 50);
      return;
    }
    if (App.__mathAISLUIGuard) return;

    const originalApplyPracticeTypeUI = App.applyPracticeTypeUI;
    App.applyPracticeTypeUI = function(...args) {
      const result = originalApplyPracticeTypeUI.apply(this, args);
      const vocabularyButton = document.getElementById('type-vocabulary');
      const isMath = this.state.subject === MathAISL.subject;

      if (vocabularyButton) {
        vocabularyButton.hidden = isMath;
        vocabularyButton.style.display = isMath ? 'none' : '';
        vocabularyButton.setAttribute('aria-hidden', isMath ? 'true' : 'false');
      }

      if (!isMath) {
        const paper2Description = document.querySelector('#type-paper2 small');
        if (paper2Description && paper2Description.textContent === 'Extended-response modeling and interpretation') {
          paper2Description.textContent = 'IB-style written answers and markscheme review';
        }
      }
      return result;
    };

    App.__mathAISLUIGuard = true;
  };

  install();
})();
