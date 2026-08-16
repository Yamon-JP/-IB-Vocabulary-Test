// Final Math AI SL balance pass: finer Learned Content plus high-value exam gaps.
(() => {
  const FinalMathAudit = window.MathAISLFinalAudit = {
    loaded: false,
    running: false,
    oldProbabilitySkill: '4.3 Probability and distributions',
    refinedSkills: [{"id":"1.1 Scientific notation, approximation and error","group":"Topic 1: Number and algebra"},{"id":"1.2 Sequences and series","group":"Topic 1: Number and algebra"},{"id":"1.3 Financial mathematics","group":"Topic 1: Number and algebra"},{"id":"1.4 Infinite geometric series","group":"Topic 1: Number and algebra"},{"id":"1.5 Direct variation and simultaneous equations","group":"Topic 1: Number and algebra"},{"id":"2.1 Linear and piecewise models","group":"Topic 2: Functions"},{"id":"2.2 Quadratic models","group":"Topic 2: Functions"},{"id":"2.3 Exponential models","group":"Topic 2: Functions"},{"id":"2.4 Function concepts and transformations","group":"Topic 2: Functions"},{"id":"2.5 Cubic and sinusoidal models","group":"Topic 2: Functions"},{"id":"3.1 Measurement and 3D geometry","group":"Topic 3: Geometry and trigonometry"},{"id":"3.2 Trigonometry and bearings","group":"Topic 3: Geometry and trigonometry"},{"id":"3.3 Voronoi diagrams","group":"Topic 3: Geometry and trigonometry"},{"id":"3.4 Arc length and sector area","group":"Topic 3: Geometry and trigonometry"},{"id":"4.1 Descriptive statistics","group":"Topic 4: Statistics and probability"},{"id":"4.2 Correlation and regression","group":"Topic 4: Statistics and probability"},{"id":"4.3 Probability rules and conditional probability","group":"Topic 4: Statistics and probability"},{"id":"4.4 Discrete random variables and expected value","group":"Topic 4: Statistics and probability"},{"id":"4.5 Binomial distribution","group":"Topic 4: Statistics and probability"},{"id":"4.6 Normal distribution","group":"Topic 4: Statistics and probability"},{"id":"4.7 Statistical testing","group":"Topic 4: Statistics and probability"},{"id":"5.1 Rates of change and derivatives","group":"Topic 5: Calculus"},{"id":"5.2 Optimization","group":"Topic 5: Calculus"},{"id":"5.3 Area and integration","group":"Topic 5: Calculus"}],
    remap: {"MATH-AI-SL-P1-4.3-001":"4.5 Binomial distribution","MATH-AI-SL-P1-4.3-002":"4.3 Probability rules and conditional probability","MATH-AI-SL-P1-4.3-003":"4.6 Normal distribution","MATH-AI-SL-P2-4.3-001":"4.6 Normal distribution","MATH-AI-SL-P2-4.3-002":"4.5 Binomial distribution","MATH-AI-SL-P2-4.3-003":"4.6 Normal distribution"},

    async fetchArray(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not load ${url}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('Math AI SL final-balance data could not be loaded.', error);
        return [];
      }
    },

    migrateCoverage() {
      const selected = new Set(CourseCoverage.getSelected(MathAISL.subject));
      if (selected.has(this.oldProbabilitySkill)) {
        selected.delete(this.oldProbabilitySkill);
        selected.add('4.3 Probability rules and conditional probability');
        selected.add('4.5 Binomial distribution');
        selected.add('4.6 Normal distribution');
        CourseCoverage.setSelected(MathAISL.subject, [...selected], { syncLegacy: false });
      }
    },

    refineQuestion(question) {
      const unit = this.remap[question?.id];
      if (!unit) return question;
      question.unit = unit;
      question.requiredUnits = [unit];
      return question;
    },

    async load() {
      if (this.loaded) return true;
      if (
        typeof MathAISL === 'undefined'
        || !MathAISL.installed
        || typeof MathAISLBatch2 === 'undefined'
        || !MathAISLBatch2.loaded
        || typeof CourseCoverage === 'undefined'
        || typeof Paper1 === 'undefined'
        || typeof Paper2 === 'undefined'
      ) return false;

      MathAISL.skills = this.refinedSkills.map(skill => ({ ...skill }));
      this.migrateCoverage();

      Paper1.paper1bQuestions.forEach(question => this.refineQuestion(question));
      Paper2.allQuestions.forEach(question => this.refineQuestion(question));

      const [paper1Extra, paper2Extra] = await Promise.all([
        this.fetchArray('data/math-ai-sl-paper1-final-balance.json?v=1'),
        this.fetchArray('data/math-ai-sl-paper2-final-balance.json?v=1')
      ]);
      if (!paper1Extra.length || !paper2Extra.length) return false;

      Paper1.paper1bQuestions = MathAISL.mergeUnique(Paper1.paper1bQuestions, paper1Extra);
      Paper2.allQuestions = MathAISL.mergeUnique(Paper2.allQuestions, paper2Extra);
      this.loaded = true;

      if (typeof CourseCoverage.render === 'function') CourseCoverage.render();
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
          if (!loaded) console.warn('Math AI SL final balance could not initialize. Existing Math practice remains available.');
        }
      }, 50);
    }
  };

  FinalMathAudit.start();
})();
