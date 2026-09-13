// English B HL Paper 1 AI Instructor frontend.
// Adds an isolated AI grading layer without changing existing self-mark or progress storage.
(() => {
  const EnglishBAIInstructor = window.EnglishBAIInstructor = {
    installed: false,
    grading: false,
    endpointKey: 'ib_ai_instructor_endpoint',
    observer: null,

    endpoint() {
      const configured = String(window.IB_AI_INSTRUCTOR_ENDPOINT || '').trim();
      if (configured) return configured.replace(/\/$/, '');
      try {
        return String(localStorage.getItem(this.endpointKey) || '').trim().replace(/\/$/, '');
      } catch (_) {
        return '';
      }
    },

    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    install() {
      if (this.installed) return true;
      if (typeof EnglishBPaper1 === 'undefined' || typeof EnglishBPaper1.renderSelectedTask !== 'function') return false;

      const originalRenderSelectedTask = EnglishBPaper1.renderSelectedTask.bind(EnglishBPaper1);
      EnglishBPaper1.renderSelectedTask = (...args) => {
        const result = originalRenderSelectedTask(...args);
        this.mountControls();
        return result;
      };

      this.installed = true;
      this.mountControls();
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      return true;
    },

    mountControls() {
      const selected = document.getElementById('engb-p1-selected');
      const actions = selected?.querySelector('.engb-p1-actions');
      if (!selected || !actions) return;

      if (!document.getElementById('engb-ai-grade-button')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'engb-ai-grade-button';
        button.className = 'engb-ai-grade-button';
        button.textContent = 'Grade with AI Instructor';
        button.addEventListener('click', () => this.grade());
        actions.insertBefore(button, actions.firstChild);
      }

      if (!document.getElementById('engb-ai-result')) {
        const result = document.createElement('section');
        result.id = 'engb-ai-result';
        result.className = 'engb-ai-result';
        result.setAttribute('aria-live', 'polite');
        actions.insertAdjacentElement('afterend', result);
      }
    },

    setBusy(isBusy) {
      this.grading = Boolean(isBusy);
      const button = document.getElementById('engb-ai-grade-button');
      if (!button) return;
      button.disabled = this.grading;
      button.textContent = this.grading ? 'AI Instructor is grading…' : 'Grade with AI Instructor';
    },

    showMessage(title, message, kind = 'info') {
      const result = document.getElementById('engb-ai-result');
      if (!result) return;
      result.innerHTML = `
        <div class="engb-ai-message ${this.escapeHtml(kind)}">
          <strong>${this.escapeHtml(title)}</strong>
          <p>${this.escapeHtml(message)}</p>
        </div>`;
    },

    buildPayload() {
      if (typeof EnglishBPaper1 === 'undefined') return null;
      const task = typeof EnglishBPaper1.currentTask === 'function' ? EnglishBPaper1.currentTask() : null;
      const answer = document.getElementById('engb-p1-answer');
      const selectedTextType = String(EnglishBPaper1.selectedTextType || '').trim();
      const responseText = String(answer?.value || '').trim();
      if (!task || !answer) return null;

      return {
        task: {
          id: task.id || null,
          chapter: task.chapter || null,
          theme: task.theme || null,
          prompt: task.prompt || '',
          requirements: Array.isArray(task.requirements) ? task.requirements : [],
          audience: task.audience || '',
          purpose: task.purpose || '',
          register: task.register || '',
          bestTextType: task.bestTextType || '',
          textTypeRationale: task.textTypeRationale || ''
        },
        selectedTextType,
        answer: responseText,
        wordCount: typeof EnglishBPaper1.countWords === 'function'
          ? EnglishBPaper1.countWords(responseText)
          : responseText.split(/\s+/).filter(Boolean).length
      };
    },

    validateCriterion(value, max) {
      if (!value || typeof value !== 'object') return null;
      const score = Number(value.score);
      if (!Number.isInteger(score) || score < 0 || score > max) return null;
      const rationale = String(value.rationale || '').trim();
      const rationaleJa = String(value.rationaleJa || '').trim();
      const explanationJa = String(value.explanationJa || '').trim();
      const strengths = Array.isArray(value.strengths) ? value.strengths.map(String).filter(Boolean).slice(0, 3) : [];
      const strengthsJa = Array.isArray(value.strengthsJa) ? value.strengthsJa.map(String).filter(Boolean).slice(0, 3) : [];
      const improvements = Array.isArray(value.improvements) ? value.improvements.map(String).filter(Boolean).slice(0, 3) : [];
      const improvementsJa = Array.isArray(value.improvementsJa) ? value.improvementsJa.map(String).filter(Boolean).slice(0, 3) : [];
      if (!rationale) return null;
      return {
        score,
        rationale,
        rationaleJa,
        explanationJa,
        strengths,
        strengthsJa,
        improvements,
        improvementsJa
      };
    },

    normalizeGrading(payload) {
      const grading = payload?.grading;
      if (!grading || typeof grading !== 'object') return null;
      const language = this.validateCriterion(grading.language, 12);
      const message = this.validateCriterion(grading.message, 12);
      const conceptualUnderstanding = this.validateCriterion(grading.conceptualUnderstanding, 6);
      if (!language || !message || !conceptualUnderstanding) return null;

      const topImprovements = Array.isArray(grading.topImprovements)
        ? grading.topImprovements.map(String).filter(Boolean).slice(0, 3)
        : [];
      const topImprovementsJa = Array.isArray(grading.topImprovementsJa)
        ? grading.topImprovementsJa.map(String).filter(Boolean).slice(0, 3)
        : [];
      return {
        language,
        message,
        conceptualUnderstanding,
        total: language.score + message.score + conceptualUnderstanding.score,
        topImprovements,
        topImprovementsJa,
        nextStep: String(grading.nextStep || '').trim(),
        nextStepJa: String(grading.nextStepJa || '').trim(),
        overallComment: String(grading.overallComment || '').trim(),
        overallCommentJa: String(grading.overallCommentJa || '').trim(),
        meta: payload?.meta || {}
      };
    },

    bilingualListHtml(title, items, itemsJa) {
      if (!items.length) return '';
      return `
        <div class="engb-ai-list">
          <strong>${this.escapeHtml(title)}</strong>
          <ul>${items.map((item, index) => `
            <li>
              ${this.escapeHtml(item)}
              ${itemsJa[index] ? `<div class="muted">🇯🇵 ${this.escapeHtml(itemsJa[index])}</div>` : ''}
            </li>`).join('')}
          </ul>
        </div>`;
    },

    criterionHtml(label, criterion, max) {
      return `
        <article class="engb-ai-criterion">
          <div class="engb-ai-criterion-head">
            <strong>${this.escapeHtml(label)}</strong>
            <span>${criterion.score} / ${max}</span>
          </div>
          <p>${this.escapeHtml(criterion.rationale)}</p>
          ${criterion.rationaleJa ? `<p class="muted"><strong>🇯🇵 日本語訳：</strong>${this.escapeHtml(criterion.rationaleJa)}</p>` : ''}
          ${criterion.explanationJa ? `<p class="muted"><strong>🇯🇵 簡単解説：</strong>${this.escapeHtml(criterion.explanationJa)}</p>` : ''}
          ${this.bilingualListHtml('Strengths', criterion.strengths, criterion.strengthsJa)}
          ${this.bilingualListHtml('Improve', criterion.improvements, criterion.improvementsJa)}
        </article>`;
    },

    renderGrading(grading) {
      const result = document.getElementById('engb-ai-result');
      if (!result) return;
      const model = String(grading.meta?.model || '').trim();
      const rubricVersion = String(grading.meta?.rubricVersion || 'engb-paper1-v1').trim();
      result.innerHTML = `
        <section class="engb-ai-panel">
          <div class="engb-ai-header">
            <div>
              <p class="eyebrow">AI INSTRUCTOR</p>
              <h4>English B HL · Paper 1 feedback</h4>
              <p class="muted">Training assessment aligned to the Paper 1 criteria. This is not an official IB grade.</p>
              <p class="muted">英語の評価の直後に、日本語訳と短い解説を表示します。</p>
            </div>
            <div class="engb-ai-total"><strong>${grading.total}</strong><span>/ 30</span></div>
          </div>
          <div class="engb-ai-criteria">
            ${this.criterionHtml('Language', grading.language, 12)}
            ${this.criterionHtml('Message', grading.message, 12)}
            ${this.criterionHtml('Conceptual Understanding', grading.conceptualUnderstanding, 6)}
          </div>
          <div class="engb-ai-priority">
            <strong>Top 3 Improvements</strong>
            ${grading.topImprovements.length
              ? `<ol>${grading.topImprovements.map((item, index) => `
                <li>
                  ${this.escapeHtml(item)}
                  ${grading.topImprovementsJa[index] ? `<div class="muted">🇯🇵 ${this.escapeHtml(grading.topImprovementsJa[index])}</div>` : ''}
                </li>`).join('')}</ol>`
              : '<p class="muted">No priority list was returned.</p>'}
          </div>
          ${grading.nextStep ? `
            <div class="engb-ai-next">
              <strong>Next step</strong>
              <p>${this.escapeHtml(grading.nextStep)}</p>
              ${grading.nextStepJa ? `<p class="muted"><strong>🇯🇵 日本語訳：</strong>${this.escapeHtml(grading.nextStepJa)}</p>` : ''}
            </div>` : ''}
          ${grading.overallComment ? `
            <div class="engb-ai-overall">
              <strong>Instructor comment</strong>
              <p>${this.escapeHtml(grading.overallComment)}</p>
              ${grading.overallCommentJa ? `<p class="muted"><strong>🇯🇵 日本語訳：</strong>${this.escapeHtml(grading.overallCommentJa)}</p>` : ''}
            </div>` : ''}
          <div class="engb-ai-meta">Rubric ${this.escapeHtml(rubricVersion)}${model ? ` · ${this.escapeHtml(model)}` : ''} · AI result is not saved to Progress in Phase 7A-1.</div>
        </section>`;
    },

    async grade() {
      if (this.grading) return;
      const payload = this.buildPayload();
      if (!payload) {
        this.showMessage('AI Instructor unavailable', 'Open an English B Paper 1 Writing task first.', 'error');
        return;
      }
      if (!payload.selectedTextType) {
        this.showMessage('Choose a text type', 'Select a text type before asking the AI Instructor to grade your response.', 'warning');
        return;
      }
      if (!payload.answer) {
        this.showMessage('Write an answer first', 'Enter your Paper 1 response before asking the AI Instructor to grade it.', 'warning');
        return;
      }

      const endpoint = this.endpoint();
      if (!endpoint) {
        this.showMessage(
          'AI Instructor setup required',
          'The secure AI grading endpoint has not been configured yet. Your existing self-mark remains available.',
          'warning'
        );
        return;
      }

      this.setBusy(true);
      this.showMessage('AI Instructor', 'Reviewing your response against the Paper 1 criteria…');
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(`${endpoint}/grade/english-b-paper1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) {
          const detail = data?.error || 'Unknown AI grading error.';
          throw new Error(`HTTP ${response.status} — ${detail}`);
        }
        const grading = this.normalizeGrading(data);
        if (!grading) throw new Error('AI Instructor returned an invalid grading result.');
        this.renderGrading(grading);
      } catch (error) {
        const timedOut = error?.name === 'AbortError';
        const isPreview = window.location.hostname === 'ib-master-trainer-preview.takashiyamamoto-81.workers.dev';
        const diagnostic = isPreview && error?.message ? `Diagnostic: ${error.message}` : '';
        this.showMessage(
          'AI grading could not be completed',
          timedOut
            ? 'The grading request timed out. Your answer is still on this page, so you can try again.'
            : diagnostic || 'The secure AI grading service is unavailable or returned an invalid response. Your existing self-mark remains available.',
          'error'
        );
        console.warn('English B AI Instructor request failed.', error);
      } finally {
        window.clearTimeout(timeout);
        this.setBusy(false);
      }
    },

    boot() {
      if (this.install()) return;
      this.observer = new MutationObserver(() => {
        this.install();
      });
      this.observer.observe(document.documentElement, { childList: true, subtree: true });
      window.addEventListener('load', () => this.install(), { once: true });
    }
  };

  EnglishBAIInstructor.boot();
})();
