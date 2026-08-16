// Loads Math AI SL only after the stable shared/ESS wrappers have finished installing.
(() => {
  const start = (attempt = 0) => {
    const ready = (
      typeof App !== 'undefined'
      && typeof CourseCoverage !== 'undefined'
      && CourseCoverage.installed
      && typeof EssExam !== 'undefined'
      && EssExam.originals?.appPatched
      && typeof EssCourseCoverage !== 'undefined'
      && EssCourseCoverage.installed
      && typeof Paper1 !== 'undefined'
      && Paper1.initialized
      && typeof Paper2 !== 'undefined'
      && Array.isArray(Paper2.allQuestions)
      && Paper2.allQuestions.length > 0
    );

    if (!ready) {
      if (attempt < 500) setTimeout(() => start(attempt + 1), 50);
      else console.warn('Math AI SL loader could not find the stable exam foundation. Existing subjects remain available.');
      return;
    }

    if (document.getElementById('math-ai-sl-script')) return;
    const script = document.createElement('script');
    script.id = 'math-ai-sl-script';
    script.src = 'js/math-ai-sl.js?v=2';
    script.onerror = () => console.warn('Math AI SL module could not be loaded. Existing subjects remain available.');
    document.head.appendChild(script);
  };

  start();
})();
