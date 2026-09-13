(() => {
  const MistakeBank = window.MistakeBank = {
    installed: false,
    pagesPatched: false,
    progressPatched: false,
    subjects: ['English B HL', 'Biology SL', 'ESS HL', 'Math AI SL'],

    escape(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    assessment(attempt) {
      return typeof FinalExamProgressV2 !== 'undefined' && typeof FinalExamProgressV2.assessment === 'function'
        ? FinalExamProgressV2.assessment(attempt)
        : (attempt?.assessmentTarget || attempt?.section || null);
    },

    assessmentLabel(subject, assessment) {
      return typeof FinalExamProgressV2 !== 'undefined' && typeof FinalExamProgressV2.assessmentLabel === 'function'
        ? FinalExamProgressV2.assessmentLabel(subject, assessment)
        : (assessment || 'Final Exam');
    },

    normalAttempts(subject) {
      if (typeof FinalExamProgressV2 === 'undefined' || typeof FinalExamProgressV2.normalAttempts !== 'function') return [];
      return FinalExamProgressV2.normalAttempts(subject);
    },

    genericObservation(attempt) {
      const subject = attempt?.subject;
      const assessment = this.assessment(attempt);
      const questionId = String(attempt?.questionId || '').trim();
      if (!this.subjects.includes(subject) || !assessment || !questionId) return null;
      if (subject === 'English B HL' && assessment === 'english-b-paper1-writing') return null;
      const score = Number(attempt?.score);
      const maxMarks = Number(attempt?.maxMarks);
      if (!Number.isFinite(score) || !Number.isFinite(maxMarks) || maxMarks <= 0) return null;
      const safeScore = Math.max(0, Math.min(score, maxMarks));
      const area = [attempt?.unit, attempt?.chapter, attempt?.topic]
        .find(value => typeof value === 'string' && value.trim()) || null;
      let detail = `${safeScore} / ${maxMarks} marks`;
      if (assessment === 'paper1a' && attempt?.selectedAnswer != null && attempt?.correctAnswer != null) {
        detail = `Selected ${attempt.selectedAnswer} · Correct ${attempt.correctAnswer}`;
      } else if (Array.isArray(attempt?.criteria)) {
        const missed = attempt.criteria.filter(criterion => criterion && criterion.awarded === false).length;
        if (missed > 0) detail = `${safeScore} / ${maxMarks} marks · ${missed} markscheme point${missed === 1 ? '' : 's'} missed`;
      }
      return {
        key: `${subject}|${assessment}|${questionId}`,
        subject,
        assessment,
        assessmentLabel: this.assessmentLabel(subject, assessment),
        questionId,
        area,
        score: safeScore,
        maxMarks,
        percentage: Math.round(safeScore / maxMarks * 100),
        resolved: safeScore >= maxMarks,
        detail,
        createdAt: attempt?.createdAt || ''
      };
    },

    questionObservations(attempt) {
      const subject = attempt?.subject;
      const assessment = this.assessment(attempt);
      if (subject !== 'English B HL' || !['english-b-paper2-reading', 'english-b-paper2-listening'].includes(assessment)) return [];
      const results = Array.isArray(attempt?.questionResults) ? attempt.questionResults : [];
      return results.map((result, index) => {
        const marks = Number(result?.marks);
        const awarded = Number(result?.awarded);
        const stableKey = String(result?.key || result?.questionId || `${attempt?.setId || 'set'}:${index + 1}`).trim();
        if (!stableKey || !Number.isFinite(marks) || marks <= 0 || !Number.isFinite(awarded)) return null;
        const safeAwarded = Math.max(0, Math.min(awarded, marks));
        const questionId = String(result?.questionId || stableKey).trim();
        const textId = String(result?.textId || '').trim();
        const chapters = Array.isArray(attempt?.chapters)
          ? attempt.chapters.filter(value => typeof value === 'string' && value.trim())
          : [];
        return {
          key: `${subject}|${assessment}|${stableKey}`,
          stableKey,
          setId: attempt?.setId || null,
          setKey: attempt?.setKey || null,
          chapters,
          subject,
          assessment,
          assessmentLabel: this.assessmentLabel(subject, assessment),
          questionId,
          textId: textId || null,
          area: chapters.join(', ') || null,
          score: safeAwarded,
          maxMarks: marks,
          percentage: Math.round(safeAwarded / marks * 100),
          resolved: safeAwarded >= marks,
          detail: `${safeAwarded} / ${marks} marks`,
          createdAt: attempt?.createdAt || ''
        };
      }).filter(Boolean);
    },

    observations(subject) {
      const rows = [];
      this.normalAttempts(subject).forEach(attempt => {
        const questionRows = this.questionObservations(attempt);
        if (questionRows.length) rows.push(...questionRows);
        else {
          const row = this.genericObservation(attempt);
          if (row) rows.push(row);
        }
      });
      return rows.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
    },

    unresolved(subject) {
      const latest = new Map();
      this.observations(subject).forEach(row => {
        if (!latest.has(row.key)) latest.set(row.key, row);
      });
      return [...latest.values()]
        .filter(row => !row.resolved)
        .sort((a, b) => {
          if (a.percentage !== b.percentage) return a.percentage - b.percentage;
          return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
        });
    },

    count(subject) {
      return this.unresolved(subject).length;
    },

    ensureStyles() {
      if (document.getElementById('mistake-bank-styles')) return;
      const style = document.createElement('style');
      style.id = 'mistake-bank-styles';
      style.textContent = `
        .mistake-bank-panel{margin-top:16px}
        .mistake-bank-list{display:grid;gap:8px;margin-top:10px}
        .mistake-bank-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;align-items:center;padding:11px 12px;border:1px solid #e4e7ec;border-radius:12px;background:#fff}
        .mistake-bank-copy strong,.mistake-bank-copy small{display:block}
        .mistake-bank-copy strong{font-size:.92rem;line-height:1.35}
        .mistake-bank-copy small{margin-top:3px;color:#667085;font-size:.76rem;line-height:1.4}
        .mistake-bank-score{text-align:right;white-space:nowrap}
        .mistake-bank-score strong,.mistake-bank-score small{display:block}
        .mistake-bank-score strong{font-size:.9rem;color:#b42318}
        .mistake-bank-score small{margin-top:2px;color:#667085;font-size:.72rem}
        .mistake-bank-retry{min-height:36px;padding:7px 11px;border:1px solid #cfd6df;border-radius:9px;background:#fff;font-weight:800;cursor:pointer}
        .mistake-bank-retry:hover{border-color:#98a2b3}
        .mistake-bank-retry:disabled{opacity:.55;cursor:default}
        .mistake-bank-target{outline:3px solid rgba(75,78,255,.18);outline-offset:5px;border-radius:12px}
        .mistake-bank-retry-hidden{display:none!important}
        .mistake-bank-empty{margin:8px 0 0;color:#667085;font-size:.85rem}
        .mistake-bank-setup{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:0 0 18px;padding:11px 13px;border:1px solid #e4e7ec;border-radius:12px;background:#fff}
        .mistake-bank-setup-copy strong,.mistake-bank-setup-copy small{display:block}
        .mistake-bank-setup-copy strong{font-size:.9rem}
        .mistake-bank-setup-copy small{margin-top:3px;color:#667085;font-size:.75rem}
        .mistake-bank-count{min-width:46px;text-align:center;padding:7px 10px;border-radius:999px;background:#fff1f0;color:#b42318;font-weight:900}
        .mistake-bank-count.clear{background:#ecfdf3;color:#027a48}
        @media(max-width:560px){.mistake-bank-row{grid-template-columns:1fr auto}.mistake-bank-copy{grid-column:1/-1}.mistake-bank-score{text-align:left}.mistake-bank-setup{align-items:flex-start}}
      `;
      document.head.appendChild(style);
    },

    ensureProgressPanel() {
      const subjectView = document.getElementById('progress-v2-subject');
      if (!subjectView) return null;
      let panel = document.getElementById('mistake-bank-progress-panel');
      if (panel) return panel;
      panel = document.createElement('section');
      panel.id = 'mistake-bank-progress-panel';
      panel.className = 'progress-v2-panel mistake-bank-panel';
      const readiness = document.getElementById('final-exam-readiness-subject');
      const hero = document.getElementById('progress-v2-subject-hero');
      if (readiness) readiness.insertAdjacentElement('afterend', panel);
      else if (hero) hero.insertAdjacentElement('afterend', panel);
      else subjectView.prepend(panel);
      return panel;
    },

    renderProgress(subject) {
      if (!this.subjects.includes(subject)) return;
      const panel = this.ensureProgressPanel();
      if (!panel) return;
      const items = this.unresolved(subject);
      const visible = items.slice(0, 6);
      panel.innerHTML = `
        <div class="progress-v2-panel-heading compact">
          <div><p class="eyebrow">MISTAKE BANK</p><h3>Mistakes to Review</h3></div>
          <span>${items.length} unresolved</span>
        </div>
        <p class="muted">Latest saved result per question. Retry the same question; a later full-mark attempt automatically resolves it.</p>
        ${visible.length ? `<div class="mistake-bank-list">${visible.map((item, index) => {
          const area = item.area ? ` · ${item.area}` : '';
          const text = item.textId ? ` · ${item.textId}` : '';
          return `<article class="mistake-bank-row">
            <div class="mistake-bank-copy">
              <strong>${this.escape(`${item.assessmentLabel}${area}${text}`)}</strong>
              <small>${this.escape(`Question ${item.questionId} · ${item.detail}`)}</small>
            </div>
            <div class="mistake-bank-score"><strong>${this.escape(`${item.percentage}%`)}</strong><small>Latest result</small></div>
            <button type="button" class="mistake-bank-retry" data-mistake-retry="${index}">Retry</button>
          </article>`;
        }).join('')}</div>` : '<p class="mistake-bank-empty">No unresolved mistakes in saved Final Exam practice.</p>'}
        ${items.length > visible.length ? `<p class="muted">Showing 6 of ${items.length} unresolved questions.</p>` : ''}`;
      panel.querySelectorAll('[data-mistake-retry]').forEach(button => {
        const item = visible[Number(button.dataset.mistakeRetry)];
        if (!item) return;
        button.addEventListener('click', async () => {
          button.disabled = true;
          try {
            await this.retry(item);
          } finally {
            button.disabled = false;
          }
        });
      });
    },

    learnedForQuestion(subject, question) {
      if (subject === 'English B HL') return true;
      if (typeof AdaptiveTraining === 'undefined') return false;
      const learned = new Set(typeof AdaptiveTraining.learned === 'function' ? AdaptiveTraining.learned(subject) : []);
      const required = typeof AdaptiveTraining.units === 'function' ? AdaptiveTraining.units(question) : [];
      return learned.size > 0 && required.length > 0 && required.every(unit => learned.has(unit));
    },

    highlight(selector) {
      window.setTimeout(() => {
        const target = document.querySelector(selector);
        if (!target) return;
        target.classList.add('mistake-bank-target');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    },

    async retryQuestion(item) {
      if (
        typeof AdaptiveTraining === 'undefined'
        || typeof AdaptiveTraining.catalog !== 'function'
        || typeof App === 'undefined'
        || typeof Pages === 'undefined'
      ) {
        alert('Mistake Retry is not ready yet. Please reopen Progress and try again.');
        return false;
      }
      const entry = AdaptiveTraining.catalog().find(row =>
        row?.subject === item.subject
        && row?.assessment === item.assessment
        && String(row?.question?.id || '') === String(item.questionId || '')
      );
      if (!entry?.question) {
        alert('This saved question is no longer available in the current question database.');
        return false;
      }
      if (!this.learnedForQuestion(item.subject, entry.question)) {
        alert('This question is outside the current Learned Content / Course Coverage. Update Course Coverage before retrying it.');
        return false;
      }

      AdaptiveTraining.resetExamModes?.();
      App.selectSubject(item.subject);
      App.state.practiceType = AdaptiveTraining.practiceType(item.assessment);
      App.state.practiceScope = 'all';
      App.state.selectedChapters = [];
      if (App.state.practiceType === 'paper1') App.state.paper1Section = AdaptiveTraining.paper1Section(item);
      else App.state.paper2Section = AdaptiveTraining.paper2Section(item);
      App.saveState();
      App.renderChapterSelector?.();
      App.applyPracticeScopeUI?.();
      App.applyPracticeTypeUI?.();

      if (App.state.practiceType === 'paper1') {
        await App.ensurePaper1Module?.();
        await Paper1.init?.();
        Paper1.section = AdaptiveTraining.paper1Section(item);
        Paper1.questions = [entry.question];
        Paper1.current = entry.question;
        Paper1.render();
      } else {
        Paper2.questions = [entry.question];
        Paper2.current = entry.question;
        Paper2.render();
      }

      Pages.show('practice');
      App.updatePracticeHeader?.();
      const header = document.getElementById('selection-subject-practice');
      if (header) header.textContent = `${item.subject} · ${item.assessmentLabel} · Mistake Retry`;
      this.highlight(App.state.practiceType === 'paper1' ? '#paper1-practice-panel' : '#paper2-practice-panel');
      return true;
    },

    englishModule(item) {
      if (item.assessment === 'english-b-paper2-listening') return window.EnglishBPaper2Listening;
      if (item.assessment === 'english-b-paper2-reading') return window.EnglishBPaper2Reading;
      return null;
    },

    englishTextMap(module) {
      const map = new Map();
      const add = text => {
        const id = String(text?.id || '').trim();
        if (id && !map.has(id)) map.set(id, text);
      };
      (Array.isArray(module?.data) ? module.data : []).forEach(set => (set?.texts || []).forEach(add));
      (Array.isArray(module?.focusedData) ? module.focusedData : []).forEach(add);
      return map;
    },

    findEnglishSourceSet(item, module) {
      const textMap = this.englishTextMap(module);
      const ids = String(item.setKey || '').split('|').map(value => value.trim()).filter(Boolean);
      if (ids.length) {
        const texts = ids.map(id => textMap.get(id)).filter(Boolean);
        if (texts.length === ids.length) return { id: item.setId || 'mistake-retry', texts };
      }
      const baseSets = Array.isArray(module?.data) ? module.data : [];
      const found = baseSets.find(set => (set?.texts || []).some(text =>
        (text?.questions || []).some((question, questionIndex) => module.questionKey(text, question, questionIndex) === item.stableKey)
      ));
      if (found) return found;
      const focused = typeof module?.buildPracticeSets === 'function' ? module.buildPracticeSets(item.chapters || []) : [];
      return focused.find(set => (set?.texts || []).some(text =>
        (text?.questions || []).some((question, questionIndex) => module.questionKey(text, question, questionIndex) === item.stableKey)
      )) || null;
    },

    buildEnglishRetrySet(item, module) {
      const source = this.findEnglishSourceSet(item, module);
      if (!source) return null;
      let targetTextIndex = -1;
      let targetQuestionIndex = -1;
      let targetMarks = 0;
      const texts = (source.texts || []).map((text, textIndex) => {
        const questions = [];
        (text.questions || []).forEach((question, questionIndex) => {
          const stableKey = module.questionKey(text, question, questionIndex);
          if (stableKey !== item.stableKey) return;
          targetTextIndex = textIndex;
          targetQuestionIndex = 0;
          targetMarks = Number(question?.marks || item.maxMarks || 0);
          const fallbackId = stableKey.startsWith(`${text?.id || 'text'}:`)
            ? stableKey.slice(String(text?.id || 'text').length + 1)
            : stableKey;
          questions.push({ ...question, id: question?.id || fallbackId });
        });
        return { ...text, questions, marks: questions.reduce((sum, question) => sum + Number(question?.marks || 0), 0) };
      });
      if (targetTextIndex < 0 || targetQuestionIndex < 0 || targetMarks <= 0) return null;
      return {
        set: {
          ...source,
          id: item.setId || source.id || 'mistake-retry',
          title: 'Mistake Retry',
          texts,
          totalMarks: targetMarks,
          mistakeRetry: true
        },
        targetTextIndex,
        targetQuestionIndex
      };
    },

    async retryEnglish(item) {
      const module = this.englishModule(item);
      if (!module || typeof App === 'undefined' || typeof Pages === 'undefined') {
        alert('This English B retry module is not available right now.');
        return false;
      }
      await module.init?.();
      const retry = this.buildEnglishRetrySet(item, module);
      if (!retry) {
        alert('This saved English B question is no longer available in the current practice data.');
        return false;
      }

      if (typeof AdaptiveTraining !== 'undefined') AdaptiveTraining.resetExamModes?.();
      App.selectSubject('English B HL');
      App.state.practiceType = 'paper2';
      App.state.englishBPaper2Mode = item.assessment === 'english-b-paper2-listening' ? 'listening' : 'reading';
      App.state.practiceScope = 'all';
      App.state.selectedChapters = [];
      App.saveState();
      App.renderChapterSelector?.();
      App.applyPracticeScopeUI?.();
      App.applyPracticeTypeUI?.();

      if (typeof module.stopAudio === 'function') module.stopAudio();
      module.practiceSets = [retry.set];
      module.currentSetIndex = 0;
      if ('playCounts' in module) module.playCounts = {};
      module.render();

      Pages.show('practice');
      App.updatePracticeHeader?.();
      const header = document.getElementById('selection-subject-practice');
      if (header) header.textContent = `English B HL · ${item.assessmentLabel} · Mistake Retry`;

      const prefix = item.assessment === 'english-b-paper2-listening' ? 'engb-l' : 'engb-r';
      window.setTimeout(() => {
        const textSelector = item.assessment === 'english-b-paper2-listening' ? '.engb-l-text' : '.engb-r-text';
        document.querySelectorAll(textSelector).forEach((section, index) => {
          section.classList.toggle('mistake-bank-retry-hidden', index !== retry.targetTextIndex);
        });
        this.highlight(`#${prefix}-q-${retry.targetTextIndex}-${retry.targetQuestionIndex}`);
      }, 60);
      return true;
    },

    async retry(item) {
      if (!item) return false;
      if (item.subject === 'English B HL') return this.retryEnglish(item);
      return this.retryQuestion(item);
    },

    ensureSetupPanel() {
      const selection = document.querySelector('#selection-page .selection-panel');
      if (!selection) return null;
      let panel = document.getElementById('mistake-bank-setup');
      if (panel) return panel;
      panel = document.createElement('section');
      panel.id = 'mistake-bank-setup';
      panel.className = 'mistake-bank-setup';
      const weak = document.getElementById('adaptive-practice-weak-panel');
      const heading = selection.querySelector('.selection-heading');
      if (weak) weak.insertAdjacentElement('afterend', panel);
      else if (heading) heading.insertAdjacentElement('afterend', panel);
      else selection.prepend(panel);
      return panel;
    },

    renderSetup() {
      const panel = this.ensureSetupPanel();
      if (!panel) return;
      const subject = typeof App !== 'undefined' ? App.state?.subject : null;
      if (!this.subjects.includes(subject)) {
        panel.hidden = true;
        panel.innerHTML = '';
        return;
      }
      panel.hidden = false;
      const total = this.count(subject);
      panel.innerHTML = `
        <div class="mistake-bank-setup-copy">
          <strong>Mistakes to Review</strong>
          <small>${this.escape(subject)} · latest saved result per question</small>
        </div>
        <span class="mistake-bank-count ${total === 0 ? 'clear' : ''}">${total}</span>`;
    },

    render() {
      this.ensureStyles();
      if (typeof Pages !== 'undefined' && Pages.current === 'selection') this.renderSetup();
      if (typeof Pages !== 'undefined' && Pages.current === 'statistics' && typeof ProgressUIV2 !== 'undefined') {
        const view = ProgressUIV2.activeView;
        if (this.subjects.includes(view)) this.renderProgress(view);
      }
    },

    patchNavigation() {
      if (!this.pagesPatched && typeof Pages !== 'undefined' && typeof Pages.show === 'function') {
        const originalShow = Pages.show.bind(Pages);
        Pages.show = page => {
          const result = originalShow(page);
          if (page === 'selection') {
            window.setTimeout(() => this.renderSetup(), 0);
            window.setTimeout(() => this.renderSetup(), 120);
          }
          if (page === 'statistics') {
            window.setTimeout(() => this.render(), 40);
            window.setTimeout(() => this.render(), 280);
          }
          return result;
        };
        this.pagesPatched = true;
      }
      if (!this.progressPatched && typeof ProgressUIV2 !== 'undefined' && typeof ProgressUIV2.setView === 'function') {
        const originalSetView = ProgressUIV2.setView.bind(ProgressUIV2);
        ProgressUIV2.setView = view => {
          const result = originalSetView(view);
          if (this.subjects.includes(view)) {
            window.setTimeout(() => this.renderProgress(view), 0);
            window.setTimeout(() => this.renderProgress(view), 80);
          }
          return result;
        };
        this.progressPatched = true;
      }
    },

    install() {
      if (this.installed) {
        this.render();
        return true;
      }
      if (
        typeof Pages === 'undefined'
        || typeof App === 'undefined'
        || typeof Storage === 'undefined'
        || typeof ProgressUIV2 === 'undefined'
        || !ProgressUIV2.installed
        || typeof FinalExamProgressV2 === 'undefined'
        || !FinalExamProgressV2.installed
      ) return false;
      this.installed = true;
      this.ensureStyles();
      this.patchNavigation();
      this.render();
      window.addEventListener('storage', () => this.render());
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.render();
      });
      return true;
    },

    boot() {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (this.install() || attempts >= 600) {
          window.clearInterval(timer);
          if (!this.installed) console.warn('Mistake Bank could not initialize. Existing practice remains available.');
        }
      }, 50);
    }
  };

  MistakeBank.boot();
})();