// Additive Biology SL Final Exam Training data loader.
// Existing Paper 1 / Paper 2 logic remains untouched; extra questions are merged by unique id.
(() => {
  const BiologyFinalTraining = window.BiologyFinalTraining = {
    paper1Loaded: false,
    paper2Loaded: false,
    running: false,

    async fetchArray(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not load ${url}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('Biology Final Training extra data could not be loaded.', error);
        return [];
      }
    },

    mergeUnique(existing = [], additions = []) {
      const merged = Array.isArray(existing) ? [...existing] : [];
      const ids = new Set(merged.map(item => item?.id).filter(Boolean));
      (Array.isArray(additions) ? additions : []).forEach(item => {
        if (!item || !item.id || ids.has(item.id)) return;
        ids.add(item.id);
        merged.push(item);
      });
      return merged;
    },

    async extendPaper1() {
      if (this.paper1Loaded) return true;
      if (typeof Paper1 === 'undefined' || !Paper1.initialized) return false;

      const [paper1aBatch1, paper1bBatch1, paper1aBatch2, paper1bBatch2] = await Promise.all([
        this.fetchArray('data/paper1/biology-final-training-extra.json?v=2'),
        this.fetchArray('data/paper2/biology-final-data-extra.json?v=2'),
        this.fetchArray('data/paper1/biology-final-training-extra-2.json?v=2'),
        this.fetchArray('data/paper2/biology-final-data-extra-2.json?v=2')
      ]);
      const paper1aExtra = [...paper1aBatch1, ...paper1aBatch2];
      const paper1bExtra = [...paper1bBatch1, ...paper1bBatch2];

      Paper1.paper1aQuestions = this.mergeUnique(
        Paper1.paper1aQuestions,
        paper1aExtra.filter(question => question?.assessmentTarget === 'paper1a')
      );
      Paper1.paper1bQuestions = this.mergeUnique(
        Paper1.paper1bQuestions,
        paper1bExtra.filter(question => question?.assessmentTarget === 'paper1b')
      );
      this.paper1Loaded = true;

      if (typeof Paper1.renderLearnedUnitSelector === 'function') {
        Paper1.renderLearnedUnitSelector();
      }
      if (typeof CourseCoverage !== 'undefined' && typeof CourseCoverage.render === 'function') {
        CourseCoverage.render();
      }
      return true;
    },

    async extendPaper2() {
      if (this.paper2Loaded) return true;
      if (typeof Paper2 === 'undefined' || !Array.isArray(Paper2.allQuestions) || !Paper2.allQuestions.length) return false;

      const [batch1, batch2] = await Promise.all([
        this.fetchArray('data/paper2/biology-final-response-extra.json?v=2'),
        this.fetchArray('data/paper2/biology-final-response-extra-2.json?v=2')
      ]);
      const extra = [...batch1, ...batch2];
      Paper2.allQuestions = this.mergeUnique(
        Paper2.allQuestions,
        extra.filter(question => ['paper2a', 'paper2b'].includes(question?.assessmentTarget))
      );
      this.paper2Loaded = true;

      if (typeof CourseCoverage !== 'undefined' && typeof CourseCoverage.render === 'function') {
        CourseCoverage.render();
      }
      return true;
    },

    start() {
      if (this.running) return;
      this.running = true;
      let attempts = 0;
      const tryExtend = async () => {
        attempts += 1;
        await this.extendPaper2();
        await this.extendPaper1();
        if ((this.paper1Loaded && this.paper2Loaded) || attempts >= 300) {
          window.clearInterval(timer);
          this.running = false;
        }
      };
      const timer = window.setInterval(tryExtend, 50);
      tryExtend();
    }
  };

  BiologyFinalTraining.start();
})();
