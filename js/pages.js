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

  ensureEssJapaneseLocalization() {
    if (typeof Paper2 !== 'undefined' && Paper2.essJapaneseLocalizationInstalled) return;
    if (document.getElementById('ess-japanese-localization-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-japanese-localization-script';
    script.src = 'js/ess-japanese-localization.js';
    script.onerror = () => {
      console.warn('ESS Japanese localization layer could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBJapaneseAudit() {
    if (typeof Paper2 !== 'undefined' && Paper2.essSectionBJapaneseAuditInstalled) return;
    if (document.getElementById('ess-section-b-japanese-audit-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-section-b-japanese-audit-script';
    script.src = 'js/ess-section-b-japanese-audit.js';
    script.onerror = () => {
      console.warn('ESS Section B Japanese audit layer could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBJapaneseFinalPass() {
    if (typeof Paper2 !== 'undefined' && Paper2.essSectionBJapaneseFinalPassV2Installed) return;
    if (document.getElementById('ess-section-b-japanese-final-pass-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-section-b-japanese-final-pass-script';
    script.src = 'js/ess-section-b-japanese-final-pass-v2.js?v=2';
    script.onerror = () => {
      console.warn('ESS Section B final Japanese cleanup v2 could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBJapaneseRenderGuard() {
    if (typeof Paper2 !== 'undefined' && Paper2.essSectionBJapaneseRenderGuardInstalled) return;
    if (document.getElementById('ess-section-b-japanese-render-guard-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-section-b-japanese-render-guard-script';
    script.src = 'js/ess-section-b-japanese-render-guard.js?v=1';
    script.onerror = () => {
      console.warn('ESS Section B Japanese render guard could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBZeroBareEnglish() {
    if (typeof Paper2 !== 'undefined' && Paper2.essSectionBZeroBareEnglishInstalled) return;
    if (document.getElementById('ess-section-b-zero-bare-english-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-section-b-zero-bare-english-script';
    script.src = 'js/ess-section-b-japanese-zero-bare-english.js?v=1';
    script.onerror = () => {
      console.warn('ESS Section B final bare-English cleanup could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
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

      document.body.classList.remove('practice-active');

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
    this.ensureEssJapaneseLocalization();
    this.ensureEssSectionBJapaneseAudit();
    this.ensureEssSectionBJapaneseFinalPass();
    this.ensureEssSectionBJapaneseRenderGuard();
    this.ensureEssSectionBZeroBareEnglish();
    this.ensureUIOptimizations();
    this.ensureCourseCoverage();
    this.ensureEssCourseCoverage();
    this.show('home');
  }
};