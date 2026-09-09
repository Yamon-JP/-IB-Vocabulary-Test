(() => {
  const FinalExamAchievements = window.FinalExamAchievements = {
    installed: false,
    subjects: ['English B HL', 'Biology SL', 'ESS HL', 'Math AI SL'],

    globalDefinitions: [
      { key: 'exam-starter', title: 'Exam Starter', description: 'Complete your first saved Final Exam Training attempt.', metric: 'attempts', target: 1 },
      { key: 'exam-regular', title: 'Exam Regular', description: 'Complete 10 saved Final Exam Training attempts.', metric: 'attempts', target: 10 },
      { key: 'four-subject-challenger', title: 'Four-Subject Challenger', description: 'Complete Final Exam Training in all four supported subjects.', metric: 'subjects', target: 4 },
      { key: 'full-mock-debut', title: 'Full Mock Debut', description: 'Complete your first saved Full Mock session.', metric: 'mocks', target: 1 },
      { key: 'mock-veteran', title: 'Mock Veteran', description: 'Complete five distinct saved Full Mock sessions.', metric: 'mocks', target: 5 }
    ],

    subjectDefinitions: [
      { key: 'subject-exam-starter', title: 'Exam Starter', description: 'Complete one saved Final Exam Training attempt in this subject.', metric: 'attempts', target: 1 },
      { key: 'subject-exam-routine', title: 'Exam Routine', description: 'Complete five saved Final Exam Training attempts in this subject.', metric: 'attempts', target: 5 },
      { key: 'subject-solid-form', title: 'Solid Form', description: 'Reach at least 60% current app readiness with at least 3 recent practice attempts.', metric: 'readiness', targetAttempts: 3, targetReadiness: 60 },
      { key: 'subject-strong-form', title: 'Strong Form', description: 'Reach at least 75% current app readiness with at least 5 recent practice attempts.', metric: 'readiness', targetAttempts: 5, targetReadiness: 75 }
    ],

    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    progressLayer() {
      return typeof FinalExamProgressV2 !== 'undefined' ? FinalExamProgressV2 : null;
    },

    validAttempts() {
      const layer = this.progressLayer();
      if (!layer || typeof layer.allAttempts !== 'function') return [];
      const attempts = layer.allAttempts();
      return attempts.filter(attempt => typeof layer.validAttempt !== 'function' || layer.validAttempt(attempt));
    },

    subjectAttempts(subject) {
      const layer = this.progressLayer();
      if (!layer) return [];
      if (typeof layer.subjectAttempts === 'function') return layer.subjectAttempts(subject);
      return this.validAttempts().filter(attempt => attempt.subject === subject);
    },

    mockSessions() {
      const sessions = new Set();
      this.validAttempts().forEach(attempt => {
        if (!attempt?.fullMock || !attempt?.sessionId) return;
        sessions.add(`${attempt.subject || 'Exam'}:${attempt.sessionId}`);
      });
      return sessions;
    },

    readiness(subject) {
      const layer = this.progressLayer();
      if (!layer || typeof layer.currentReadiness !== 'function') return { attempts: 0, percentage: null };
      const value = layer.currentReadiness(subject) || {};
      return {
        attempts: Number(value.attempts || 0),
        percentage: Number.isFinite(Number(value.percentage)) ? Number(value.percentage) : null
      };
    },

    metricState(definition, current) {
      const target = Math.max(1, Number(definition.target || 1));
      const value = Math.max(0, Number(current || 0));
      const unlocked = value >= target;
      return {
        key: definition.key,
        title: definition.title,
        description: definition.description,
        unlocked,
        pct: unlocked ? 100 : Math.min(100, Math.round(value / target * 100)),
        meta: `${Math.min(value, target)} / ${target}`
      };
    },

    readinessState(definition, subject) {
      const current = this.readiness(subject);
      const targetAttempts = Math.max(1, Number(definition.targetAttempts || 1));
      const targetReadiness = Math.max(1, Number(definition.targetReadiness || 1));
      const percentage = current.percentage === null ? 0 : current.percentage;
      const attemptPart = Math.min(current.attempts / targetAttempts, 1);
      const readinessPart = Math.min(percentage / targetReadiness, 1);
      const unlocked = current.attempts >= targetAttempts && percentage >= targetReadiness;
      return {
        key: definition.key,
        title: definition.title,
        description: definition.description,
        unlocked,
        pct: unlocked ? 100 : Math.round((attemptPart + readinessPart) * 50),
        meta: `${current.attempts}/${targetAttempts} recent · ${current.percentage === null ? '—' : `${current.percentage}%`}/${targetReadiness}% readiness`
      };
    },

    globalStates() {
      const attempts = this.validAttempts();
      const subjects = new Set(attempts.map(attempt => attempt.subject).filter(subject => this.subjects.includes(subject)));
      const mocks = this.mockSessions();
      const metrics = {
        attempts: attempts.length,
        subjects: subjects.size,
        mocks: mocks.size
      };
      return this.globalDefinitions.map(definition => ({
        ...this.metricState(definition, metrics[definition.metric] || 0),
        scope: 'global',
        subtitle: 'Final Exam Training'
      }));
    },

    subjectStates(subject) {
      const attempts = this.subjectAttempts(subject).length;
      return this.subjectDefinitions.map(definition => {
        const state = definition.metric === 'readiness'
          ? this.readinessState(definition, subject)
          : this.metricState(definition, attempts);
        return { ...state, scope: 'subject', subject, subtitle: subject };
      });
    },

    allStates() {
      return [
        ...this.globalStates(),
        ...this.subjects.flatMap(subject => this.subjectStates(subject))
      ];
    },

    nextCandidates() {
      return this.allStates()
        .filter(state => !state.unlocked)
        .map(state => ({
          kind: 'exam',
          title: state.title,
          subtitle: state.scope === 'subject' ? state.subject : state.description,
          pct: state.pct,
          meta: state.meta
        }));
    },

    milestoneCard(state) {
      return `
        <details class="trophy-v2-exam-milestone ${state.unlocked ? 'unlocked' : 'locked'}">
          <summary>
            <span class="trophy-v2-exam-icon">${state.unlocked ? '🏆' : '🔒'}</span>
            <span class="trophy-v2-exam-copy">
              <strong>${this.escapeHtml(state.title)}</strong>
              <small>${state.unlocked ? 'Unlocked' : `${state.pct}% complete`}</small>
            </span>
            <span class="trophy-v2-card-chevron">⌄</span>
          </summary>
          <div class="trophy-v2-exam-detail">
            <p>${this.escapeHtml(state.description)}</p>
            <div class="trophy-v2-progress-track"><span style="width:${state.pct}%"></span></div>
            <small>${this.escapeHtml(state.unlocked ? 'Completed' : state.meta)}</small>
          </div>
        </details>`;
    },

    render(container) {
      if (!container) return;
      const globalStates = this.globalStates();
      const globalUnlocked = globalStates.filter(state => state.unlocked).length;
      container.innerHTML = `
        <div class="trophy-v2-exam-global">
          <div class="trophy-v2-exam-subheading">
            <strong>Overall Final Exam Training</strong>
            <span>${globalUnlocked} / ${globalStates.length} unlocked</span>
          </div>
          <div class="trophy-v2-exam-global-grid">
            ${globalStates.map(state => this.milestoneCard(state)).join('')}
          </div>
        </div>
        <div class="trophy-v2-exam-subject-grid">
          ${this.subjects.map(subject => {
            const states = this.subjectStates(subject);
            const unlocked = states.filter(state => state.unlocked).length;
            const readiness = this.readiness(subject);
            return `
              <section class="trophy-v2-exam-subject-card">
                <div class="trophy-v2-exam-subheading">
                  <div><strong>${this.escapeHtml(subject)}</strong><small>Current readiness: ${readiness.percentage === null ? '—' : `${readiness.percentage}%`}</small></div>
                  <span>${unlocked} / ${states.length}</span>
                </div>
                <div class="trophy-v2-exam-subject-milestones">
                  ${states.map(state => this.milestoneCard(state)).join('')}
                </div>
              </section>`;
          }).join('')}
        </div>`;
    },

    install() {
      if (this.installed) return true;
      if (!this.progressLayer()) return false;
      this.installed = true;
      if (typeof TrophyUIV2 !== 'undefined' && TrophyUIV2.installed && typeof TrophyUIV2.render === 'function') {
        window.setTimeout(() => TrophyUIV2.render(), 0);
      }
      return true;
    },

    boot() {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (this.install() || attempts >= 400) {
          window.clearInterval(timer);
          if (!this.installed) console.warn('Final Exam Achievement milestones could not initialize. Existing achievements remain available.');
        }
      }, 50);
    }
  };

  FinalExamAchievements.boot();
})();
