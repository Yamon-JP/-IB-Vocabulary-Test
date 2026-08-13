// English B HL Listening voice control: strict US/GB English selection with no Japanese fallback.
(() => {
  const install = () => {
    const module = window.EnglishBPaper2Listening;
    if (!module || module.voiceAccentExtensionInstalled) return false;
    module.voiceAccentExtensionInstalled = true;
    module.voiceCache = [];
    module.voiceListenerInstalled = false;

    module.ensureAccentStyles = function() {
      if (document.getElementById('engb-l-accent-styles')) return;
      const style = document.createElement('style');
      style.id = 'engb-l-accent-styles';
      style.textContent = `
        .engb-l-accent-control{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 14px;border:1px solid #e4e7ec;border-radius:14px;background:#fff}
        .engb-l-accent-copy strong,.engb-l-accent-copy small{display:block}.engb-l-accent-copy small{margin-top:2px;color:#667085}
        .engb-l-accent-buttons{display:flex;gap:8px;flex-wrap:wrap}.engb-l-accent-buttons button{min-height:38px;padding:7px 12px;border:1px solid #d0d5dd;border-radius:10px;background:#fff;font-weight:800}.engb-l-accent-buttons button.active{border-color:#667085;box-shadow:0 0 0 2px rgba(102,112,133,.13);background:#f8fafc}
        .engb-l-voice-status{width:100%;font-size:.78rem;color:#667085}
        @media(max-width:600px){.engb-l-accent-control{align-items:flex-start}.engb-l-accent-buttons{width:100%}.engb-l-accent-buttons button{flex:1 1 0}}
      `;
      document.head.appendChild(style);
    };

    module.getAccent = function() {
      if (typeof App === 'undefined') return 'US';
      return App.state.englishBListeningAccent === 'GB' ? 'GB' : 'US';
    };

    module.getAccentLocale = function() {
      return this.getAccent() === 'GB' ? 'en-GB' : 'en-US';
    };

    module.setAccent = function(accent) {
      const normalized = accent === 'GB' ? 'GB' : 'US';
      this.stopAudio();
      if (typeof App !== 'undefined') {
        App.state.englishBListeningAccent = normalized;
        App.saveState();
      }
      this.refreshVoiceCache();
      this.updateAccentUI();
    };

    module.installAccentControl = function() {
      this.ensureAccentStyles();
      if (document.getElementById('engb-l-accent-control')) {
        this.updateAccentUI();
        return;
      }
      const panel = document.getElementById('english-b-paper2-listening-panel');
      const instruction = panel?.querySelector('.engb-l-instruction');
      if (!panel || !instruction) return;
      const control = document.createElement('div');
      control.id = 'engb-l-accent-control';
      control.className = 'engb-l-accent-control';
      control.innerHTML = `
        <div class="engb-l-accent-copy">
          <strong>Pronunciation</strong>
          <small>Choose the accent used for all Listening audio.</small>
        </div>
        <div class="engb-l-accent-buttons" role="group" aria-label="English pronunciation">
          <button type="button" id="engb-l-accent-us" onclick="EnglishBPaper2Listening.setAccent('US')">🇺🇸 US English</button>
          <button type="button" id="engb-l-accent-gb" onclick="EnglishBPaper2Listening.setAccent('GB')">🇬🇧 British English</button>
        </div>
        <div id="engb-l-voice-status" class="engb-l-voice-status">Loading English voices…</div>`;
      instruction.insertAdjacentElement('afterend', control);
      this.updateAccentUI();
    };

    module.refreshVoiceCache = function() {
      if (!('speechSynthesis' in window)) {
        this.voiceCache = [];
        return [];
      }
      this.voiceCache = window.speechSynthesis.getVoices();
      return this.voiceCache;
    };

    module.installVoiceListener = function() {
      if (this.voiceListenerInstalled || !('speechSynthesis' in window)) return;
      this.voiceListenerInstalled = true;
      const refresh = () => {
        this.refreshVoiceCache();
        this.updateAccentUI();
      };
      if (typeof window.speechSynthesis.addEventListener === 'function') {
        window.speechSynthesis.addEventListener('voiceschanged', refresh);
      } else {
        const previous = window.speechSynthesis.onvoiceschanged;
        window.speechSynthesis.onvoiceschanged = event => {
          if (typeof previous === 'function') previous.call(window.speechSynthesis, event);
          refresh();
        };
      }
      this.refreshVoiceCache();
    };

    module.isJapaneseVoice = function(voice) {
      const lang = String(voice?.lang || '').toLowerCase().replace('_','-');
      const name = String(voice?.name || '').toLowerCase();
      return lang.startsWith('ja') || /japanese|日本語|kyoko|otoya/.test(name);
    };

    module.isUsVoice = function(voice) {
      if (!voice || this.isJapaneseVoice(voice)) return false;
      const lang = String(voice.lang || '').toLowerCase().replace('_','-');
      const name = String(voice.name || '').toLowerCase();
      if (lang.startsWith('en-us')) return true;
      return /english\s*\(?(united states|u\.s\.|us)\)?|american english|us english|u\.s\. english/.test(name);
    };

    module.availableVoices = function(locale = this.getAccentLocale()) {
      const target = String(locale || this.getAccentLocale()).toLowerCase().replace('_','-');
      const voices = this.voiceCache?.length ? this.voiceCache : this.refreshVoiceCache();
      if (target.startsWith('en-us')) return voices.filter(voice => this.isUsVoice(voice));
      // Keep the already-working GB behaviour unchanged: en-GB language tag only.
      return voices.filter(voice => String(voice.lang || '').toLowerCase().replace('_','-').startsWith('en-gb'));
    };

    module.voiceQualityScore = function(voice) {
      const name = String(voice?.name || '').toLowerCase();
      let score = 0;
      if (name.includes('natural')) score += 50;
      if (name.includes('enhanced')) score += 40;
      if (name.includes('premium')) score += 38;
      if (name.includes('neural')) score += 36;
      if (name.includes('online')) score += 30;
      if (name.includes('google us english')) score += 28;
      if (name.includes('samantha')) score += 26;
      if (name.includes('alex')) score += 24;
      if (name.includes('aria')) score += 22;
      if (name.includes('jenny')) score += 21;
      if (name.includes('guy')) score += 20;
      if (name.includes('google')) score += 16;
      if (name.includes('microsoft')) score += 15;
      if (name.includes('siri')) score += 15;
      if (voice?.default) score += 4;
      return score;
    };

    module.preferredUsVoice = function() {
      return this.availableVoices('en-US')
        .slice()
        .sort((a, b) => this.voiceQualityScore(b) - this.voiceQualityScore(a))[0] || null;
    };

    module.pickVoice = function(_hint, speaker, index) {
      if (this.getAccent() === 'US') {
        // US is deliberately fixed to one best voice. This avoids mobile browsers
        // rotating into lower-quality or misconfigured en-US voices for different speakers.
        return this.preferredUsVoice();
      }
      const voices = this.availableVoices('en-GB')
        .slice()
        .sort((a, b) => this.voiceQualityScore(b) - this.voiceQualityScore(a));
      if (!voices.length) return null;
      const seed = [...String(speaker || '')].reduce((sum, char) => sum + char.charCodeAt(0), Number(index || 0));
      return voices[seed % voices.length] || voices[0];
    };

    module.updateAccentUI = function() {
      const accent = this.getAccent();
      document.getElementById('engb-l-accent-us')?.classList.toggle('active', accent === 'US');
      document.getElementById('engb-l-accent-gb')?.classList.toggle('active', accent === 'GB');
      const status = document.getElementById('engb-l-voice-status');
      if (!status) return;
      if (!('speechSynthesis' in window)) {
        status.textContent = 'Speech synthesis is not supported by this browser.';
        return;
      }
      const locale = this.getAccentLocale();
      const voices = this.availableVoices(locale);
      if (!voices.length) {
        status.textContent = `${locale} voice is still loading or is not installed. Playback will not use a Japanese fallback voice.`;
        return;
      }
      const preferred = accent === 'US'
        ? this.preferredUsVoice()
        : voices.slice().sort((a, b) => this.voiceQualityScore(b) - this.voiceQualityScore(a))[0];
      status.textContent = `${accent === 'GB' ? 'British English' : 'US English'} · ${voices.length} ${locale} voice${voices.length === 1 ? '' : 's'} available · Using: ${preferred?.name || 'English voice'} (${preferred?.lang || locale})`;
    };

    module.ensureAccentVoices = async function(locale) {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const voices = this.availableVoices(locale);
        if (voices.length) return voices;
        await new Promise(resolve => window.setTimeout(resolve, 100));
        this.refreshVoiceCache();
      }
      return [];
    };

    module.playAudio = async function(textIndex) {
      const set = this.currentSet();
      const text = set?.texts?.[textIndex];
      if (!text) return;
      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        alert('Speech playback is not supported by this browser.');
        return;
      }

      const locale = this.getAccentLocale();
      const voices = await this.ensureAccentVoices(locale);
      if (!voices.length) {
        this.updateAccentUI();
        alert(`${locale} English voice is not available on this device yet. A Japanese voice will not be used as a fallback.`);
        return;
      }

      const fixedUsVoice = this.getAccent() === 'US' ? this.preferredUsVoice() : null;
      if (this.getAccent() === 'US' && !fixedUsVoice) {
        this.updateAccentUI();
        alert('A suitable US English voice is not available on this device yet.');
        return;
      }

      this.stopAudio();
      this.activeTextId = text.id;
      this.playCounts[text.id] = (this.playCounts[text.id] || 0) + 1;
      this.refreshPlayCounts();
      this.updateAccentUI();

      const segments = Array.isArray(text.segments) ? text.segments : [];
      segments.forEach((segment, index) => {
        const utterance = new SpeechSynthesisUtterance(segment.text || '');
        utterance.lang = locale;
        utterance.rate = 0.95;
        utterance.pitch = 1;
        const voice = fixedUsVoice || this.pickVoice(locale, segment.speaker, index);
        if (!voice) return;
        utterance.voice = voice;
        if (index === segments.length - 1) utterance.onend = () => {
          this.activeTextId = null;
          this.paused = false;
        };
        window.speechSynthesis.speak(utterance);
      });
    };

    const originalInstallUI = module.installUI.bind(module);
    module.installUI = function() {
      originalInstallUI();
      this.installAccentControl();
    };

    const originalRender = module.render.bind(module);
    module.render = function() {
      originalRender();
      this.installAccentControl();
      this.updateAccentUI();
    };

    module.installVoiceListener();
    module.installAccentControl();
    module.updateAccentUI();
    return true;
  };

  const boot = (attempt = 0) => {
    if (install()) return;
    if (attempt < 300) window.setTimeout(() => boot(attempt + 1), 50);
  };
  boot();
})();