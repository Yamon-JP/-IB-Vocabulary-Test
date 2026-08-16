// Additive Math AI SL batch 2 loader. Existing Math UI and filtering remain untouched.
(() => {
  const MathAISLBatch2 = window.MathAISLBatch2 = {
    loaded: false,
    running: false,

    async fetchArray(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not load ${url}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('Math AI SL batch 2 data could not be loaded.', error);
        return [];
      }
    },

    async load() {
      if (this.loaded) return true;
      if (
        typeof MathAISL === 'undefined'
        || !MathAISL.installed
        || !MathAISL.dataLoaded
        || typeof Paper1 === 'undefined'
        || typeof Paper2 === 'undefined'
      ) return false;

      const sources = [
        'data/math-ai-sl-paper1-batch2-1.json?v=1',
        'data/math-ai-sl-paper1-batch2-2.json?v=1',
        'data/math-ai-sl-paper1-batch2-3.json?v=1',
        'data/math-ai-sl-paper2-batch2-1.json?v=1',
        'data/math-ai-sl-paper2-batch2-2.json?v=1',
        'data/math-ai-sl-paper2-batch2-3.json?v=1'
      ];
      const datasets = await Promise.all(sources.map(source => this.fetchArray(source)));
      if (datasets.some(dataset => !dataset.length)) return false;

      const paper1Extra = datasets.slice(0, 3).flat().filter(question =>
        question?.subject === MathAISL.subject && question?.assessmentTarget === 'math-paper1'
      );
      const paper2Extra = datasets.slice(3).flat().filter(question =>
        question?.subject === MathAISL.subject && question?.assessmentTarget === 'math-paper2'
      );

      Paper1.paper1bQuestions = MathAISL.mergeUnique(Paper1.paper1bQuestions, paper1Extra);
      Paper2.allQuestions = MathAISL.mergeUnique(Paper2.allQuestions, paper2Extra);
      this.loaded = true;

      if (typeof CourseCoverage !== 'undefined' && typeof CourseCoverage.render === 'function') {
        CourseCoverage.render();
      }
      return true;
    },

    start() {
      if (this.running || this.loaded) return;
      this.running = true;
      let attempts = 0;
      const timer = window.setInterval(async () => {
        attempts += 1;
        const loaded = await this.load();
        if (loaded || attempts >= 400) {
          window.clearInterval(timer);
          this.running = false;
          if (!loaded) console.warn('Math AI SL batch 2 could not initialize. Existing Math practice remains available.');
        }
      }, 50);
    }
  };

  MathAISLBatch2.start();
})();
