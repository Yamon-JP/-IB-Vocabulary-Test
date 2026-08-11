const Pages = {
  current: 'home',

  ensureEssExamModule() {
    if (typeof EssExam !== 'undefined') {
      EssExam.init();
      return;
    }

    if (document.getElementById('ess-exam-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-exam-script';
    script.src = 'js/ess-exam.js';
    script.onload = () => {
      if (typeof EssExam !== 'undefined') EssExam.init();
    };
    script.onerror = () => {
      console.warn('ESS exam foundation module could not be loaded.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBStructured() {
    if (typeof Paper2 !== 'undefined' && typeof Paper2.isStructuredEssSectionB === 'function') return;
    if (document.getElementById('ess-section-b-structured-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-section-b-structured-script';
    script.src = 'js/ess-section-b-structured.js';
    script.onerror = () => {
      console.warn('ESS Section B structured-marking extension could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBStructuredSets() {
    const sources = [
      ['ess-section-b-structured-sets-1-3-script', 'js/ess-section-b-structured-sets-1-3.js'],
      ['ess-section-b-structured-sets-4-5-script', 'js/ess-section-b-structured-sets-4-5.js'],
      ['ess-section-b-structured-sets-6-7-script', 'js/ess-section-b-structured-sets-6-7.js']
    ];

    sources.forEach(([id, src]) => {
      if (document.getElementById(id)) return;
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onerror = () => {
        console.warn(`ESS Section B structured definitions could not be loaded: ${src}`);
      };
      document.body.appendChild(script);
    });
  },

  ensureUIOptimizations() {
    if (typeof UIOptimizations !== 'undefined') {
      UIOptimizations.install();
      return;
    }

    if (document.getElementById('ui-optimizations-script')) return;

    const script = document.createElement('script');
    script.id = 'ui-optimizations-script';
    script.src = 'js/ui-optimizations.js';
    script.onerror = () => {
      console.warn('UI optimization layer could not be loaded.');
    };
    document.body.appendChild(script);
  },

  ensureCourseCoverage() {
    if (typeof CourseCoverage !== 'undefined') {
      CourseCoverage.install();
      return;
    }

    if (document.getElementById('course-coverage-script')) return;

    const script = document.createElement('script');
    script.id = 'course-coverage-script';
    script.src = 'js/course-coverage.js';
    script.onload = () => {
      if (typeof CourseCoverage !== 'undefined') CourseCoverage.install();
    };
    script.onerror = () => {
      console.warn('Course Coverage module could not be loaded. Existing learned-unit controls remain available.');
    };
    document.body.appendChild(script);
  },

  ensureEssCourseCoverage() {
    if (typeof EssCourseCoverage !== 'undefined') {
      EssCourseCoverage.start();
      return;
    }

    if (document.getElementById('ess-course-coverage-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-course-coverage-script';
    script.src = 'js/ess-course-coverage.js';
    script.onload = () => {
      if (typeof EssCourseCoverage !== 'undefined') EssCourseCoverage.start();
    };
    script.onerror = () => {
      console.warn('ESS Course Coverage extension could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensurePaper2ProgressView() {
    if (typeof Paper2ProgressView !== 'undefined') {
      Paper2ProgressView.render();
      return;
    }

    if (document.getElementById('paper2-progress-view-script')) return;

    const script = document.createElement('script');
    script.id = 'paper2-progress-view-script';
    script.src = 'js/paper2-progress-view.js';
    script.onload = () => {
      if (typeof Paper2ProgressView !== 'undefined') Paper2ProgressView.render();
    };
    script.onerror = () => {
      console.warn('Paper 2 progress view could not be loaded.');
    };
    document.body.appendChild(script);
  },

  show(page) {
    document.querySelectorAll('.page').forEach(section => {
      section.style.display = 'none';
    });

    const target = document.getElementById(`${page}-page`);
    if (target) {
      target.style.display = 'block';
      this.current = page;

      // Keep the global bottom navigation visible on every page,
      // including Practice. Practice also has its dedicated Back button.
      document.body.classList.remove('practice-active');

      // Refresh progress display after page becomes visible
      if (typeof Progress !== 'undefined') {
        Progress.render();
      }

      if (page === 'statistics') {
        this.ensurePaper2ProgressView();
      }
    }
  },

  init() {
    this.ensureEssExamModule();
    this.ensureEssSectionBStructured();
    this.ensureEssSectionBStructuredSets();
    this.ensureUIOptimizations();
    this.ensureCourseCoverage();
    this.ensureEssCourseCoverage();
    this.show('home');
  }
};