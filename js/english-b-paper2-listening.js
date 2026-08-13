// English B HL Paper 2 Listening practice. Uses browser speech synthesis for original training audio.
(() => {
  const ProgressStore = {
    storageKey: 'ib_english_b_paper2_listening_progress',
    schemaVersion: 1,
    load() {
      const saved = typeof Storage !== 'undefined' ? Storage.load(this.storageKey) : null;
      return { schemaVersion: this.schemaVersion, attempts: Array.isArray(saved?.attempts) ? saved.attempts : [] };
    },
    record(attempt) {
      if (!attempt || typeof Storage === 'undefined') return null;
      const data = this.load();
      data.attempts.push(attempt);
      Storage.save(this.storageKey, data);
      return attempt;
    }
  };

  const EnglishBPaper2Listening = window.EnglishBPaper2Listening = {
    data: [],
    practiceSets: [],
    currentSetIndex: 0,
    initialized: false,
    appPatched: false,
    reviewed: false,
    attemptSaved: false,
    autoScore: 0,
    playCounts: {},
    activeTextId: null,
    paused: false,

    async init() {
      this.ensureStyles();
      this.installModeControl();
      this.installUI();
      this.patchApp();
      if (this.initialized) return true;
      try {
        const response = await fetch('data/english-b/paper2-listening.json?v=1');
        if (!response.ok) throw new Error('English B Paper 2 Listening data not found');
        const data = await response.json();
        this.data = Array.isArray(data) ? data : [];
        this.initialized = true;
        return true;
      } catch (error) {
        console.warn('English B Paper 2 Listening data could not be loaded.', error);
        this.data = [];
        return false;
      }
    },

    ensureStyles() {
      if (document.getElementById('english-b-paper2-listening-stylesheet')) return;
      const link = document.createElement('link');
      link.id = 'english-b-paper2-listening-stylesheet';
      link.rel = 'stylesheet';
      link.href = 'css/english-b-paper2-listening.css?v=1';
      document.head.appendChild(link);
    },

    installModeControl() {
      if (document.getElementById('english-b-paper2-mode-control')) return;
      const scope = document.querySelector('.scope-control');
      if (!scope) return;
      const control = document.createElement('div');
      control.id = 'english-b-paper2-mode-control';
      control.className = 'paper1-section-control engb-l-mode-control';
      control.style.display = 'none';
      control.innerHTML = `
        <h3>Paper 2 Receptive Skill</h3>
        <div class="engb-l-mode-grid">
          <button type="button" id="english-b-paper2-reading-mode" onclick="EnglishBPaper2Listening.setMode('reading')">
            <strong>Reading</strong><br><small>3 written texts · 40 marks</small>
          </button>
          <button type="button" id="english-b-paper2-listening-mode" onclick="EnglishBPaper2Listening.setMode('listening')">
            <strong>Listening</strong><br><small>3 audio texts · 25 marks</small>
          </button>
        </div>`;
      scope.parentNode.insertBefore(control, scope);
    },

    installUI() {
      if (document.getElementById('english-b-paper2-listening-panel')) return;
      const achievements = document.getElementById('practice-achievements');
      if (!achievements) return;
      const panel = document.createElement('section');
      panel.id = 'english-b-paper2-listening-panel';
      panel.innerHTML = `
        <div class="engb-l-shell">
          <div class="engb-l-header">
            <div>
              <p class="eyebrow">FINAL EXAM TRAINING</p>
              <h3>English B HL · Paper 2 Listening</h3>
              <p class="muted">Listen to three original audio texts and answer the questions.</p>
            </div>
            <div class="engb-l-badges">
              <span class="engb-l-badge" id="engb-l-set-label">Listening Mock</span>
              <span class="engb-l-badge" id="engb-l-total-marks">25 marks</span>
            </div>
          </div>
          <div class="engb-l-instruction">
            <p><strong>Training audio:</strong> this module uses your browser's English speech voices to read original IB-style scripts. It is not an official IB recording.</p>
            <p class="muted">The transcript stays hidden until you check the answers. Objective items are auto-marked; short and gap answers use markscheme self-check so valid paraphrases are not rejected.</p>
          </div>
          <div id="engb-l-content"></div>
          <div class="engb-l-actions">
            <button type="button" onclick="EnglishBPaper2Listening.submit()">Check Answers</button>
            <button type="button" onclick="EnglishBPaper2Listening.nextSet()">Next Set →</button>
          </div>
          <div id="engb-l-score-area"></div>
        </div>`;
      achievements.parentNode.insertBefore(panel, achievements);
    },

    escapeHtml(value) {
      return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    },

    getMode() {
      if (typeof App === 'undefined') return 'reading';
      return App.state.englishBPaper2Mode === 'listening' ? 'listening' : 'reading';
    },

    setMode(mode) {
      if (typeof App === 'undefined' || App.state.subject !== 'English B HL') return;
      App.state.englishBPaper2Mode = mode === 'listening' ? 'listening' : 'reading';
      App.saveState();
      App.applyPracticeTypeUI();
      App.updatePracticeHeader();
    },

    buildPracticeSets(chapters = []) {
      const selected = new Set(Array.isArray(chapters) ? chapters : []);
      if (!selected.size) return this.data.map(set => ({ ...set, texts: set.texts.map(text => ({ ...text, questions: text.questions.map(question => ({ ...question })) })) }));
      const texts = this.data.flatMap(set => Array.isArray(set.texts) ? set.texts : []).filter(text => selected.has(text.chapter));
      const sets = [];
      for (let i = 0; i < texts.length; i += 3) {
        const chunk = texts.slice(i, i + 3).map(text => ({ ...text, questions: text.questions.map(question => ({ ...question })) }));
        sets.push({
          id: `ENGB-L-FOCUS-${sets.length + 1}`,
          title: `Focused Listening ${sets.length + 1}`,
          focused: true,
          texts: chunk,
          totalMarks: chunk.reduce((sum, text) => sum + Number(text.marks || 0), 0)
        });
      }
      return sets;
    },

    loadForSelection(chapters = []) {
      this.stopAudio();
      this.practiceSets = this.buildPracticeSets(chapters);
      this.currentSetIndex = 0;
      this.playCounts = {};
      this.render();
      return this.practiceSets.length;
    },

    currentSet() { return this.practiceSets[this.currentSetIndex] || null; },

    render() {
      this.installUI();
      const set = this.currentSet();
      const content = document.getElementById('engb-l-content');
      const label = document.getElementById('engb-l-set-label');
      const total = document.getElementById('engb-l-total-marks');
      const scoreArea = document.getElementById('engb-l-score-area');
      if (!content) return;
      this.reviewed = false;
      this.attemptSaved = false;
      this.autoScore = 0;
      if (!set || !Array.isArray(set.texts) || !set.texts.length) {
        content.innerHTML = '<div class="engb-l-empty">No English B Paper 2 Listening texts are available for this selection.</div>';
        if (scoreArea) scoreArea.innerHTML = '';
        return;
      }
      if (label) label.textContent = set.title;
      if (total) total.textContent = `${set.totalMarks} marks`;
      content.innerHTML = set.texts.map((text, textIndex) => this.renderText(text, textIndex)).join('');
      if (scoreArea) scoreArea.innerHTML = '';
      this.refreshPlayCounts();
    },

    renderText(text, textIndex) {
      const questions = (Array.isArray(text.questions) ? text.questions : []).map((question, questionIndex) => this.renderQuestion(question, textIndex, questionIndex)).join('');
      return `
        <section class="engb-l-text" id="engb-l-text-${textIndex}">
          <div class="engb-l-text-head">
            <div><span class="engb-l-badge">Audio ${String.fromCharCode(65 + textIndex)} · ${this.escapeHtml(text.theme)}</span><h4>${this.escapeHtml(text.title)}</h4><small class="muted">${this.escapeHtml(text.sourceType || '')}</small></div>
            <strong>${Number(text.marks || 0)} marks</strong>
          </div>
          <div class="engb-l-player">
            <button type="button" onclick="EnglishBPaper2Listening.playAudio(${textIndex})">▶ Play from start</button>
            <button type="button" onclick="EnglishBPaper2Listening.pauseResume()">⏯ Pause / Resume</button>
            <button type="button" onclick="EnglishBPaper2Listening.stopAudio()">■ Stop</button>
            <span class="engb-l-play-count" id="engb-l-play-count-${textIndex}">Played 0 times</span>
          </div>
          <div class="engb-l-questions">${questions}</div>
          <div class="engb-l-transcript-slot" id="engb-l-transcript-${textIndex}"></div>
        </section>`;
    },

    renderQuestion(question, textIndex, questionIndex) {
      const key = `${textIndex}-${questionIndex}`;
      let answer = '';
      if (question.type === 'mcq') {
        answer = `<div class="engb-l-options">${(question.options || []).map((option, index) => `<label><input type="radio" name="engb-l-${key}" value="${index}"><span>${this.escapeHtml(option)}</span></label>`).join('')}</div>`;
      } else if (question.type === 'multi') {
        answer = `<div class="engb-l-options">${(question.options || []).map((option, index) => `<label><input type="checkbox" name="engb-l-${key}-multi" value="${index}"><span>${this.escapeHtml(option)}</span></label>`).join('')}</div><small class="muted">Choose exactly ${Number(question.required || question.correctIndices?.length || 2)}.</small>`;
      } else {
        answer = `<textarea id="engb-l-${key}-text" class="engb-l-input engb-l-textarea" placeholder="Write a concise answer in English."></textarea>`;
      }
      return `
        <article class="engb-l-question" id="engb-l-q-${key}">
          <div class="engb-l-qhead"><strong>${questionIndex + 1}. ${this.escapeHtml(question.prompt)}</strong><span class="engb-l-marks">${question.marks} mark${Number(question.marks) === 1 ? '' : 's'}</span></div>
          ${answer}
          <div id="engb-l-feedback-${key}"></div>
        </article>`;
    },

    availableVoices() {
      if (!('speechSynthesis' in window)) return [];
      return window.speechSynthesis.getVoices().filter(voice => /^en(-|_)/i.test(voice.lang || '') || /^English/i.test(voice.name || ''));
    },

    pickVoice(hint, speaker, index) {
      const voices = this.availableVoices();
      if (!voices.length) return null;
      const normalizedHint = String(hint || '').toLowerCase();
      const preferred = voices.filter(voice => String(voice.lang || '').toLowerCase().startsWith(normalizedHint));
      const pool = preferred.length ? preferred : voices;
      const seed = [...String(speaker || '')].reduce((sum, char) => sum + char.charCodeAt(0), index || 0);
      return pool[seed % pool.length] || pool[0];
    },

    playAudio(textIndex) {
      const set = this.currentSet();
      const text = set?.texts?.[textIndex];
      if (!text) return;
      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        alert('Speech playback is not supported by this browser.');
        return;
      }
      this.stopAudio();
      this.activeTextId = text.id;
      this.playCounts[text.id] = (this.playCounts[text.id] || 0) + 1;
      this.refreshPlayCounts();
      const segments = Array.isArray(text.segments) ? text.segments : [];
      segments.forEach((segment, index) => {
        const utterance = new SpeechSynthesisUtterance(segment.text || '');
        utterance.lang = segment.voiceHint || 'en-US';
        utterance.rate = 0.95;
        utterance.pitch = 1;
        const voice = this.pickVoice(segment.voiceHint, segment.speaker, index);
        if (voice) utterance.voice = voice;
        if (index === segments.length - 1) utterance.onend = () => { this.activeTextId = null; this.paused = false; };
        window.speechSynthesis.speak(utterance);
      });
    },

    pauseResume() {
      if (!('speechSynthesis' in window)) return;
      const synth = window.speechSynthesis;
      if (synth.paused) {
        synth.resume();
        this.paused = false;
      } else if (synth.speaking) {
        synth.pause();
        this.paused = true;
      }
    },

    stopAudio() {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      this.activeTextId = null;
      this.paused = false;
    },

    refreshPlayCounts() {
      const set = this.currentSet();
      (set?.texts || []).forEach((text, index) => {
        const element = document.getElementById(`engb-l-play-count-${index}`);
        if (element) {
          const count = Number(this.playCounts[text.id] || 0);
          element.textContent = `Played ${count} time${count === 1 ? '' : 's'}`;
        }
      });
    },

    getRadio(name) {
      return document.querySelector(`input[name="${name}"]:checked`)?.value ?? '';
    },

    getMulti(name) {
      return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => Number(input.value));
    },

    submit() {
      const set = this.currentSet();
      if (!set) return;
      this.stopAudio();
      this.reviewed = true;
      this.attemptSaved = false;
      this.autoScore = 0;

      (set.texts || []).forEach((text, textIndex) => {
        (text.questions || []).forEach((question, questionIndex) => {
          const key = `${textIndex}-${questionIndex}`;
          const feedback = document.getElementById(`engb-l-feedback-${key}`);
          if (!feedback) return;
          let correct = null;
          let html = '';
          let selfPoints = [];

          if (question.type === 'mcq') {
            const value = this.getRadio(`engb-l-${key}`);
            correct = value !== '' && Number(value) === Number(question.correctIndex);
            if (correct) this.autoScore += Number(question.marks || 1);
            html += `<p><strong>Answer:</strong> ${this.escapeHtml(question.options?.[question.correctIndex] || '')} ${correct ? '✓' : ''}</p>`;
          } else if (question.type === 'multi') {
            const selected = this.getMulti(`engb-l-${key}-multi`);
            const required = Number(question.required || question.correctIndices?.length || 0);
            const correctIndices = Array.isArray(question.correctIndices) ? question.correctIndices.map(Number) : [];
            let awarded = 0;
            if (selected.length <= required) awarded = selected.filter(index => correctIndices.includes(index)).length;
            this.autoScore += Math.min(Number(question.marks || required), awarded);
            correct = selected.length === required && awarded === required;
            html += `<p><strong>Correct choices:</strong> ${correctIndices.map(index => this.escapeHtml(question.options?.[index] || '')).join('; ')} ${correct ? '✓' : ''}</p>`;
          } else {
            selfPoints = (question.markscheme || []).map(point => ({ text: point, points: 1 }));
          }

          if (selfPoints.length) {
            html += `<div class="engb-l-self-points"><strong>Markscheme self-check</strong>${selfPoints.map(point => `<label><input type="checkbox" data-engb-l-self-point data-points="${point.points}" onchange="EnglishBPaper2Listening.updateScore()"><span>${this.escapeHtml(point.text)} <small>(${point.points} mark)</small></span></label>`).join('')}</div>`;
          }
          if (question.explanationJa) html += `<p class="engb-l-feedback-ja" lang="ja"><strong>日本語解説：</strong>${this.escapeHtml(question.explanationJa)}</p>`;
          feedback.className = `engb-l-feedback ${correct === true ? 'correct' : correct === false ? 'incorrect' : ''}`;
          feedback.innerHTML = html;
        });
        this.showTranscript(text, textIndex);
      });
      this.renderScoreArea();
      document.getElementById('engb-l-score-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    showTranscript(text, textIndex) {
      const slot = document.getElementById(`engb-l-transcript-${textIndex}`);
      if (!slot) return;
      slot.innerHTML = `<div class="engb-l-transcript"><h5>Transcript · review only</h5>${(text.segments || []).map(segment => `<p><span class="engb-l-speaker">${this.escapeHtml(segment.speaker)}:</span> ${this.escapeHtml(segment.text)}</p>`).join('')}</div>`;
    },

    selfScore() {
      return [...document.querySelectorAll('#english-b-paper2-listening-panel input[data-engb-l-self-point]:checked')]
        .reduce((sum, input) => sum + Number(input.dataset.points || 0), 0);
    },

    updateScore() {
      const set = this.currentSet();
      const total = document.getElementById('engb-l-score-total');
      if (set && total) total.textContent = `${this.autoScore + this.selfScore()} / ${Number(set.totalMarks || 0)}`;
    },

    renderScoreArea() {
      const set = this.currentSet();
      const area = document.getElementById('engb-l-score-area');
      if (!set || !area) return;
      area.innerHTML = `
        <section class="engb-l-score">
          <div class="engb-l-scoreline"><span>Current score</span><strong id="engb-l-score-total">${this.autoScore + this.selfScore()} / ${Number(set.totalMarks || 0)}</strong></div>
          <p class="muted">Check the markscheme boxes only when your answer demonstrates the same meaning. Grammar or spelling errors should not remove the mark if meaning remains clear.</p>
          <div class="engb-l-actions"><button type="button" onclick="EnglishBPaper2Listening.saveAttempt()">Save Attempt</button><span id="engb-l-save-status" class="engb-l-save-status"></span></div>
        </section>`;
    },

    saveAttempt() {
      const set = this.currentSet();
      const status = document.getElementById('engb-l-save-status');
      if (!set || !this.reviewed) {
        if (status) status.textContent = 'Check Answers first.';
        return;
      }
      if (this.attemptSaved) {
        if (status) status.textContent = 'This attempt is already saved.';
        return;
      }
      const score = this.autoScore + this.selfScore();
      const maxMarks = Number(set.totalMarks || 0);
      const attempt = {
        schemaVersion: 1,
        attemptId: `${set.id}-${Date.now()}`,
        setId: set.id,
        subject: 'English B HL',
        assessmentTarget: 'english-b-paper2-listening',
        chapters: (set.texts || []).map(text => text.chapter),
        score,
        maxMarks,
        percentage: maxMarks ? Math.round((score / maxMarks) * 100) : 0,
        playCounts: { ...this.playCounts },
        createdAt: new Date().toISOString()
      };
      ProgressStore.record(attempt);
      this.attemptSaved = true;
      if (status) status.textContent = `${score} / ${maxMarks} saved.`;
    },

    nextSet() {
      if (!this.practiceSets.length) return;
      this.stopAudio();
      this.currentSetIndex = (this.currentSetIndex + 1) % this.practiceSets.length;
      this.playCounts = {};
      this.render();
      document.getElementById('english-b-paper2-listening-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    syncModeControl() {
      if (typeof App === 'undefined') return;
      const control = document.getElementById('english-b-paper2-mode-control');
      const visible = App.state.subject === 'English B HL' && App.state.practiceType === 'paper2';
      if (control) control.style.display = visible ? 'block' : 'none';
      const mode = this.getMode();
      document.getElementById('english-b-paper2-reading-mode')?.classList.toggle('active', mode === 'reading');
      document.getElementById('english-b-paper2-listening-mode')?.classList.toggle('active', mode === 'listening');
      const button = document.getElementById('type-paper2');
      const copy = button?.querySelector('span:last-child');
      if (copy && App.state.subject === 'English B HL') copy.innerHTML = '<strong>Paper 2 Receptive</strong><small>Reading · Listening</small>';
    },

    patchApp() {
      if (this.appPatched || typeof App === 'undefined') return;
      this.appPatched = true;
      const module = this;
      const originalSetPracticeType = App.setPracticeType.bind(App);
      const originalApplyPracticeTypeUI = App.applyPracticeTypeUI.bind(App);
      const originalStartPractice = App.startPractice.bind(App);
      const originalOpenPractice = App.openPractice.bind(App);
      const originalUpdatePracticeHeader = App.updatePracticeHeader.bind(App);

      App.setPracticeType = function(type) {
        originalSetPracticeType(type);
        if (this.state.subject === 'English B HL' && type === 'paper2') {
          if (!['reading','listening'].includes(this.state.englishBPaper2Mode)) this.state.englishBPaper2Mode = 'reading';
          this.saveState();
          this.applyPracticeTypeUI();
        }
      };

      App.applyPracticeTypeUI = function() {
        originalApplyPracticeTypeUI();
        module.installModeControl();
        module.syncModeControl();
      };

      App.startPractice = async function() {
        if (this.state.subject !== 'English B HL' || this.state.practiceType !== 'paper2' || module.getMode() !== 'listening') return originalStartPractice();
        const chapters = this.state.practiceScope === 'selected'
          ? [...document.querySelectorAll('#chapter-list input:checked')].map(input => input.value)
          : [];
        if (this.state.practiceScope === 'selected' && !chapters.length) {
          alert('Please select at least one chapter.');
          return;
        }
        this.state.selectedChapters = chapters;
        this.saveState();
        await module.init();
        const count = module.loadForSelection(chapters);
        if (!count) {
          alert('No English B Paper 2 Listening texts are available for this selection yet.');
          return;
        }
        this.updatePracticeHeader();
        Pages.show('practice');
      };

      App.openPractice = async function() {
        if (this.state.subject !== 'English B HL' || this.state.practiceType !== 'paper2' || module.getMode() !== 'listening') return originalOpenPractice();
        const chapters = this.state.practiceScope === 'selected' ? [...(this.state.selectedChapters || [])] : [];
        await module.init();
        const count = module.loadForSelection(chapters);
        if (!count) return;
        this.updatePracticeHeader();
        Pages.show('practice');
      };

      App.updatePracticeHeader = function() {
        originalUpdatePracticeHeader();
        const listening = document.getElementById('english-b-paper2-listening-panel');
        if (this.state.subject !== 'English B HL') {
          if (listening) listening.style.display = 'none';
          module.syncModeControl();
          return;
        }
        if (this.state.practiceType === 'paper2' && module.getMode() === 'listening') {
          const header = document.getElementById('selection-subject-practice');
          const scope = this.state.practiceScope === 'selected' && this.state.selectedChapters.length ? this.state.selectedChapters.join(', ') : 'All Chapters';
          if (header) header.textContent = `English B HL · Paper 2 Listening · ${scope}`;
          const reading = document.getElementById('english-b-paper2-reading-panel');
          const generic = document.getElementById('paper2-practice-panel');
          const paper1 = document.getElementById('english-b-paper1-practice-panel');
          if (reading) reading.style.display = 'none';
          if (generic) generic.style.display = 'none';
          if (paper1) paper1.style.display = 'none';
          if (listening) listening.style.display = 'block';
        } else if (listening) {
          listening.style.display = 'none';
        }
        module.syncModeControl();
      };

      this.syncModeControl();
    }
  };

  const boot = (attempt = 0) => {
    if (typeof App === 'undefined' || typeof Pages === 'undefined') {
      if (attempt < 300) window.setTimeout(() => boot(attempt + 1), 50);
      return;
    }
    EnglishBPaper2Listening.init();
  };
  boot();
})();