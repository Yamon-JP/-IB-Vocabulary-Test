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
        const chapter = Array.isArray(attempt?.chapters)
          ? attempt.chapters.filter(value => typeof value === 'string' && value.trim()).join(', ')
          : '';
        return {
          key: `${subject}|${assessment}|${stableKey}`,
          subject,
          assessment,
          assessmentLabel: this.assessmentLabel(subject, assessment),
          questionId,
          textId: textId || null,
          area: chapter || null,
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
        .mistake-bank-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 12px;border:1px solid #e4e7ec;border-radius:12px;background:#fff}
        .mistake-bank-copy strong,.mistake-bank-copy small{display:block}
        .mistake-bank-copy strong{font-size:.92rem;line-height:1.35}
        .mistake-bank-copy small{margin-top:3px;color:#667085;font-size:.76rem;line-height:1.4}
        .mistake-bank-score{text-align:right;white-space:nowrap}
        .mistake-bank-score strong,.mistake-bank-score small{display:block}
        .mistake-bank-score strong{font-size:.9rem;color:#b42318}
        .mistake-bank-score small{margin-top:2px;color:#667085;font-size:.72rem}
        .mistake-bank-empty{margin:8px 0 0;color:#667085;font-size:.85rem}
        .mistake-bank-setup{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:0 0 18px;padding:11px 13px;border:1px solid #e4e7ec;border-radius:12px;background:#fff}
        .mistake-bank-setup-copy strong,.mistake-bank-setup-copy small{display:block}
        .mistake-bank-setup-copy strong{font-size:.9rem}
        .mistake-bank-setup-copy small{margin-top:3px;color:#667085;font-size:.75rem}
        .mistake-bank-count{min-width:46px;text-align:center;padding:7px 10px;border-radius:999px;background:#fff1f0;color:#b42318;font-weight:900}
        .mistake-bank-count.clear{background:#ecfdf3;color:#027a48}
        @media(max-width:560px){.mistake-bank-row{grid-template-columns:1fr}.mistake-bank-score{text-align:left}.mistake-bank-setup{align-items:flex-start}}
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
        <p class="muted">Latest saved result per question. A later full-mark attempt automatically resolves that question.</p>
        ${visible.length ? `<div class="mistake-bank-list">${visible.map(item => {
          const area = item.area ? ` · ${item.area}` : '';
          const text = item.textId ? ` · ${item.textId}` : '';
          return `<article class="mistake-bank-row">
            <div class="mistake-bank-copy">
              <strong>${this.escape(`${item.assessmentLabel}${area}${text}`)}</strong>
              <small>${this.escape(`Question ${item.questionId} · ${item.detail}`)}</small>
            </div>
            <div class="mistake-bank-score"><strong>${this.escape(`${item.percentage}%`)}</strong><small>Latest result</small></div>
          </article>`;
        }).join('')}</div>` : '<p class="mistake-bank-empty">No unresolved mistakes in saved Final Exam practice.</p>'}
        ${items.length > visible.length ? `<p class="muted">Showing 6 of ${items.length} unresolved questions.</p>` : ''}`;
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